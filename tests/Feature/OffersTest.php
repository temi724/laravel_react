<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AdminProfile;
use App\Models\Bundle;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Sales;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Monolog\Handler\NullHandler;
use Tests\TestCase;

/**
 * The deal of the day, drops and bundles, from the admin setting them up to an order being
 * placed, confirmed and refunded. Runs on a throwaway in-memory database.
 */
class OffersTest extends TestCase
{
    private Admin $admin;

    private Product $iphone;

    private Product $ipad;

    private Product $airpods;

    protected function setUp(): void
    {
        parent::setUp();

        config(['logging.channels.audit' => ['driver' => 'monolog', 'handler' => NullHandler::class]]);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('customer');
            $table->string('phone')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('admin_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->boolean('is_super')->default(false);
            $table->json('permissions')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug');
            $table->string('sku');
            $table->text('description');
            $table->text('short_description')->nullable();
            $table->decimal('price', 12, 2);
            $table->integer('stock_quantity')->default(0);
            $table->string('status')->default('active');
            $table->unsignedBigInteger('category_id');
            $table->text('meta_data')->nullable();
            $table->text('images')->nullable();
            $table->timestamps();
        });
        Schema::create('deals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('product_name');
            $table->decimal('price', 12, 2);
            $table->text('storage_options')->nullable();
            $table->text('images_url')->nullable();
            $table->boolean('in_stock')->default(true);
            $table->timestamps();
        });
        Schema::create('sales', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('order_id');
            $table->string('username');
            $table->string('emailaddress')->nullable();
            $table->string('phonenumber')->nullable();
            $table->string('location')->nullable();
            $table->string('state')->nullable();
            $table->string('city')->nullable();
            $table->text('product_ids')->nullable();
            $table->integer('quantity')->default(1);
            $table->boolean('order_status')->default(false);
            $table->string('order_type')->nullable();
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->nullable();
            $table->text('order_details')->nullable();
            $table->decimal('subtotal', 12, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->string('approved_by_admin')->nullable();
            $table->timestamp('payment_approved_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        (include database_path('migrations/2026_10_02_100000_create_offers_tables.php'))->up();

        $category = Category::create(['name' => 'Apple']);
        $make = fn (string $name, int $price, int $stock, array $extra = []) => Product::create([
            'product_name' => $name, 'category_id' => $category->id, 'price' => $price, 'stock_quantity' => $stock,
        ] + $extra)->fresh();

        $this->iphone = $make('iPhone 17', 1500000, 5, [
            'serial_numbers' => ['IP-1', 'IP-2', 'IP-3'],
            'storage_options' => [['storage' => '256GB', 'price' => 1500000], ['storage' => '512GB', 'price' => 1800000]],
        ]);
        $this->ipad = $make('iPad Air', 900000, 4, ['serial_numbers' => ['PAD-1', 'PAD-2']]);
        $this->airpods = $make('AirPods Pro', 350000, 10);

        $this->admin = Admin::create(['name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'correct-horse-9'])->fresh();
        AdminProfile::create(['user_id' => $this->admin->id, 'is_super' => true]);
    }

    private function signedIn(?Admin $admin = null): static
    {
        return $this->withSession(['admin_logged_in' => true, 'admin_id' => ($admin ?? $this->admin)->id]);
    }

    /**
     * @param  list<array<string, mixed>>  $items
     */
    private function order(array $items)
    {
        return $this->postJson('/api/orders/place', [
            'username' => 'Ada Obi', 'email' => 'ada@example.com', 'phone' => '08031234567', 'deliveryOption' => 'pickup',
            'cartItems' => $items,
        ]);
    }

    private function promotion(array $attributes): Promotion
    {
        return Promotion::create($attributes + ['type' => 'deal_of_day', 'starts_at' => now()->subHour(), 'ends_at' => now()->addHours(5), 'is_active' => true]);
    }

    public function test_the_deal_of_the_day_price_is_charged_while_the_deal_runs(): void
    {
        $deal = $this->promotion(['product_id' => $this->airpods->id, 'price' => 299000]);

        // The usual price is no longer the price
        $this->order([['id' => $this->airpods->id, 'name' => 'AirPods Pro', 'price' => 350000, 'quantity' => 1]])
            ->assertStatus(422)->assertJsonPath('message', 'The price of AirPods Pro is now ₦299,000. Remove it from your cart and add it again.');

        $this->order([['id' => $this->airpods->id, 'name' => 'AirPods Pro', 'price' => 299000, 'quantity' => 2]])
            ->assertCreated()
            ->assertJsonPath('order.total', 598000)
            ->assertJsonPath('order.items.0.promotion_id', $deal->id)
            ->assertJsonPath('order.items.0.promotion_label', 'Deal of the day');

        $this->assertSame(2, $deal->fresh()->units_sold);

        // Once it is over, the deal price is refused
        $deal->update(['ends_at' => now()->subMinute()]);
        $this->order([['id' => $this->airpods->id, 'name' => 'AirPods Pro', 'price' => 299000, 'quantity' => 1]])
            ->assertStatus(422)->assertJsonPath('message', 'The price of AirPods Pro is now ₦350,000. Remove it from your cart and add it again.');
    }

    public function test_an_offer_on_one_size_leaves_the_other_sizes_at_their_usual_price(): void
    {
        $this->promotion(['product_id' => $this->iphone->id, 'storage' => '512GB', 'price' => 1650000]);

        $this->order([['id' => $this->iphone->id, 'name' => 'iPhone 17', 'price' => 1650000, 'quantity' => 1, 'selected_storage' => '512GB']])
            ->assertCreated()->assertJsonPath('order.total', 1650000);
        $this->order([['id' => $this->iphone->id, 'name' => 'iPhone 17', 'price' => 1500000, 'quantity' => 1, 'selected_storage' => '256GB']])
            ->assertCreated()->assertJsonMissingPath('order.items.0.promotion_id');
    }

    public function test_a_product_is_held_back_until_its_drop_starts(): void
    {
        $this->promotion(['type' => 'drop', 'product_id' => $this->ipad->id, 'price' => 800000, 'quantity_limit' => 2, 'starts_at' => now()->addDay(), 'ends_at' => null]);

        $this->order([['id' => $this->ipad->id, 'name' => 'iPad Air', 'price' => 900000, 'quantity' => 1]])
            ->assertStatus(422)->assertJsonPath('message', 'iPad Air goes on sale when its drop starts. Remove it from your cart to continue.');

        $offers = $this->getJson('/api/offers')->assertOk();
        $offers->assertJsonPath('drops.0.status', 'scheduled')->assertJsonPath('drops.0.product.product_name', 'iPad Air');
        $this->assertArrayHasKey((string) $this->ipad->id, $offers->json('holds'));
    }

    public function test_a_live_drop_is_limited_per_order_and_in_total_and_then_sells_out(): void
    {
        $drop = $this->promotion(['type' => 'drop', 'product_id' => $this->ipad->id, 'price' => 800000, 'quantity_limit' => 3, 'per_order_limit' => 2, 'ends_at' => null]);
        $line = fn (int $quantity, int $price = 800000) => [['id' => $this->ipad->id, 'name' => 'iPad Air', 'price' => $price, 'quantity' => $quantity]];

        $this->order($line(3))->assertStatus(422)->assertJsonPath('message', 'iPad Air is limited to 2 per order at the drop price.');
        $this->order($line(2))->assertCreated()->assertJsonPath('order.total', 1600000);
        $this->order($line(2))->assertStatus(422)->assertJsonPath('message', 'Only 1 of iPad Air left at the drop price. Reduce the quantity in your cart.');
        $this->order($line(1))->assertCreated();

        $this->assertSame(3, $drop->fresh()->units_sold);
        $this->assertSame('sold_out', $drop->fresh()->status());

        // Sold out: back to the usual price
        $this->order($line(1))->assertStatus(422)->assertJsonPath('message', 'The price of iPad Air is now ₦900,000. Remove it from your cart and add it again.');
        $this->order($line(1, 900000))->assertCreated();
    }

    public function test_units_held_at_a_drop_price_are_released_when_the_payment_fails(): void
    {
        $drop = $this->promotion(['type' => 'drop', 'product_id' => $this->ipad->id, 'price' => 800000, 'quantity_limit' => 2, 'ends_at' => null]);
        $this->order([['id' => $this->ipad->id, 'name' => 'iPad Air', 'price' => 800000, 'quantity' => 2]])->assertCreated();
        $sale = Sales::firstOrFail();
        $this->assertSame(2, $drop->fresh()->units_sold);

        $this->signedIn()->putJson("/api/admin/sales/{$sale->id}/payment-status", ['payment_status' => 'failed'])->assertOk();
        $this->assertSame(0, $drop->fresh()->units_sold);

        // Marking it failed twice does not give units back twice
        $this->signedIn()->putJson("/api/admin/sales/{$sale->id}/payment-status", ['payment_status' => 'failed'])->assertOk();
        $this->assertSame(0, $drop->fresh()->units_sold);
        $this->assertSame('live', $drop->fresh()->status());
    }

    private function bundle(int $price = 2500000, array $items = null): Bundle
    {
        $bundle = Bundle::create(['name' => 'Apple starter set', 'price' => $price, 'is_active' => true]);
        foreach ($items ?? [[$this->iphone, '256GB', 1], [$this->ipad, null, 1], [$this->airpods, null, 2]] as $position => [$product, $storage, $quantity]) {
            $bundle->items()->create(['product_id' => $product->id, 'storage' => $storage, 'quantity' => $quantity, 'position' => $position]);
        }

        return $bundle->fresh();
    }

    public function test_a_bundle_is_sold_for_its_own_price_and_lists_what_is_inside(): void
    {
        $bundle = $this->bundle();

        $this->getJson('/api/offers')->assertOk()
            ->assertJsonPath('bundles.0.name', 'Apple starter set')
            ->assertJsonPath('bundles.0.usual_price', 3100000) // 1,500,000 + 900,000 + 2 x 350,000
            ->assertJsonPath('bundles.0.saving', 600000)
            ->assertJsonPath('bundles.0.in_stock', true);

        $this->order([['id' => $bundle->id, 'type' => 'bundle', 'name' => 'Apple starter set', 'price' => 1, 'quantity' => 1]])
            ->assertStatus(422)->assertJsonPath('message', 'The price of Apple starter set is now ₦2,500,000. Remove it from your cart and add it again.');

        $response = $this->order([['id' => $bundle->id, 'type' => 'bundle', 'name' => 'Apple starter set', 'price' => 2500000, 'quantity' => 1]])->assertCreated();
        $response->assertJsonPath('order.total', 2500000)
            ->assertJsonPath('order.items.0.type', 'bundle')
            ->assertJsonPath('order.items.0.components.0.name', 'iPhone 17')
            ->assertJsonPath('order.items.0.components.0.storage', '256GB')
            ->assertJsonPath('order.items.0.components.2.quantity', 2);

        $this->assertEqualsCanonicalizing(
            [(string) $this->iphone->id, (string) $this->ipad->id, (string) $this->airpods->id],
            Sales::firstOrFail()->product_ids
        );
        // Placing the order does not touch stock; confirming it does
        $this->assertSame(5, $this->iphone->fresh()->stock_quantity);
    }

    public function test_confirming_a_bundle_takes_every_product_inside_it_from_stock_and_a_refund_puts_them_back(): void
    {
        $bundle = $this->bundle();
        $this->order([['id' => $bundle->id, 'type' => 'bundle', 'name' => 'x', 'price' => 2500000, 'quantity' => 2]])->assertCreated();
        $sale = Sales::firstOrFail();

        $this->signedIn()->putJson("/api/admin/sales/{$sale->id}/payment-status", ['payment_status' => 'completed'])
            ->assertOk()->assertJsonPath('order.approved_by_admin', 'Owner');

        $this->assertSame(3, $this->iphone->fresh()->stock_quantity);
        $this->assertSame(['IP-3'], $this->iphone->fresh()->serial_numbers);
        $this->assertSame(2, $this->iphone->fresh()->units_sold);
        $this->assertSame(2, $this->ipad->fresh()->stock_quantity);
        $this->assertSame(6, $this->airpods->fresh()->stock_quantity);
        $this->assertSame(4, $this->airpods->fresh()->units_sold);

        $line = $sale->fresh()->order_details[0];
        $this->assertTrue($line['stock_deducted']);
        $this->assertSame(['IP-1', 'IP-2'], $line['components'][0]['serial_numbers']);
        $this->assertSame(['PAD-1', 'PAD-2'], $line['components'][1]['serial_numbers']);
        $this->assertSame([], $line['components'][2]['serial_numbers']);

        $this->signedIn()->putJson("/api/admin/sales/{$sale->id}/payment-status", ['payment_status' => 'refunded'])->assertOk();

        $this->assertSame(5, $this->iphone->fresh()->stock_quantity);
        $this->assertSame(['IP-1', 'IP-2', 'IP-3'], $this->iphone->fresh()->serial_numbers);
        $this->assertSame(0, $this->iphone->fresh()->units_sold);
        $this->assertSame(10, $this->airpods->fresh()->stock_quantity);
    }

    public function test_a_bundle_cannot_be_ordered_beyond_the_stock_of_any_product_inside_it(): void
    {
        $bundle = $this->bundle();

        // Four iPads in stock: three bundles plus two more iPads on their own is one too many
        $this->order([
            ['id' => $bundle->id, 'type' => 'bundle', 'name' => 'Apple starter set', 'price' => 2500000, 'quantity' => 3],
            ['id' => $this->ipad->id, 'name' => 'iPad Air', 'price' => 900000, 'quantity' => 2],
        ])->assertStatus(422)->assertJsonPath('message', 'Only 4 of iPad Air left in stock. Reduce the quantity in your cart.');

        $this->order([['id' => $bundle->id, 'type' => 'bundle', 'name' => 'Apple starter set', 'price' => 2500000, 'quantity' => 5]])
            ->assertStatus(422)->assertJsonPath('message', 'There is not enough stock for 5 of Apple starter set. Reduce the quantity in your cart.');

        $bundle->update(['is_active' => false]);
        $this->order([['id' => $bundle->id, 'type' => 'bundle', 'name' => 'Apple starter set', 'price' => 2500000, 'quantity' => 1]])
            ->assertStatus(422)->assertJsonPath('message', 'Apple starter set is no longer available. Remove it from your cart to continue.');

        $this->assertSame(0, Sales::count());
    }

    public function test_the_admin_sets_up_a_deal_of_the_day_and_cannot_overlap_another(): void
    {
        $payload = ['type' => 'deal_of_day', 'product_id' => $this->airpods->id, 'price' => 299000, 'starts_at' => now()->toIso8601String(), 'ends_at' => now()->addDay()->toIso8601String()];

        $this->signedIn()->postJson('/api/admin/promotions', ['price' => 350000] + $payload)
            ->assertStatus(422)->assertJsonValidationErrorFor('price');

        $this->signedIn()->postJson('/api/admin/promotions', $payload)
            ->assertCreated()->assertJsonPath('promotion.status', 'live')->assertJsonPath('promotion.usual_price', 350000);

        $this->signedIn()->postJson('/api/admin/promotions', ['product_id' => $this->ipad->id, 'price' => 800000] + $payload)
            ->assertStatus(422)->assertJsonValidationErrorFor('starts_at');

        // A product with sizes needs the size the price is for
        $tomorrow = ['starts_at' => now()->addDays(2)->toIso8601String(), 'ends_at' => now()->addDays(3)->toIso8601String()];
        $this->signedIn()->postJson('/api/admin/promotions', ['product_id' => $this->iphone->id, 'price' => 1400000] + $tomorrow + $payload)
            ->assertStatus(422)->assertJsonValidationErrorFor('storage');
        $this->signedIn()->postJson('/api/admin/promotions', ['product_id' => $this->iphone->id, 'price' => 1400000, 'storage' => '256GB'] + $tomorrow + $payload)
            ->assertCreated()->assertJsonPath('promotion.status', 'scheduled');

        $this->getJson('/api/offers')->assertJsonPath('deal_of_day.product.product_name', 'AirPods Pro')->assertJsonPath('deal_of_day.price', 299000);

        // Ending it now stops the price at once
        $id = Promotion::where('product_id', $this->airpods->id)->value('id');
        $this->signedIn()->postJson("/api/admin/promotions/{$id}/end")->assertOk()->assertJsonPath('promotion.status', 'ended');
        $this->getJson('/api/offers')->assertJsonPath('deal_of_day', null);
    }

    public function test_the_admin_schedules_a_drop_within_the_stock_and_one_per_product(): void
    {
        $payload = ['type' => 'drop', 'product_id' => $this->ipad->id, 'price' => 800000, 'starts_at' => now()->addDay()->toIso8601String(), 'per_order_limit' => 1];

        $this->signedIn()->postJson('/api/admin/promotions', $payload)->assertStatus(422)->assertJsonValidationErrorFor('quantity_limit');
        $this->signedIn()->postJson('/api/admin/promotions', ['quantity_limit' => 9] + $payload)->assertStatus(422)->assertJsonValidationErrorFor('quantity_limit');
        $this->signedIn()->postJson('/api/admin/promotions', ['quantity_limit' => 3] + $payload)
            ->assertCreated()->assertJsonPath('promotion.status', 'scheduled')->assertJsonPath('promotion.remaining', 3);
        $this->signedIn()->postJson('/api/admin/promotions', ['quantity_limit' => 2] + $payload)->assertStatus(422)->assertJsonValidationErrorFor('product_id');

        $id = Promotion::value('id');
        $this->signedIn()->deleteJson("/api/admin/promotions/{$id}")->assertOk();
        $this->assertSame(0, Promotion::count());
    }

    public function test_the_admin_builds_a_bundle_that_saves_money(): void
    {
        $items = [
            ['product_id' => $this->iphone->id, 'storage' => '256GB', 'quantity' => 1],
            ['product_id' => $this->airpods->id, 'quantity' => 1],
        ];

        $this->signedIn()->postJson('/api/admin/bundles', ['name' => 'Phone and buds', 'price' => 1700000, 'items' => [$items[0]]])
            ->assertStatus(422)->assertJsonValidationErrorFor('items');
        $this->signedIn()->postJson('/api/admin/bundles', ['name' => 'Phone and buds', 'price' => 1850000, 'items' => $items])
            ->assertStatus(422)->assertJsonValidationErrorFor('price');
        $this->signedIn()->postJson('/api/admin/bundles', ['name' => 'Phone and buds', 'price' => 1700000, 'items' => [['product_id' => $this->iphone->id, 'quantity' => 1], $items[1]]])
            ->assertStatus(422)->assertJsonValidationErrorFor('items.0.storage');

        $created = $this->signedIn()->postJson('/api/admin/bundles', ['name' => 'Phone and buds', 'description' => 'Everything to get started.', 'price' => 1700000, 'items' => $items])
            ->assertCreated()
            ->assertJsonPath('bundle.slug', 'phone-and-buds')
            ->assertJsonPath('bundle.saving', 150000)
            ->assertJsonCount(2, 'bundle.items');

        $id = $created->json('bundle.id');
        $this->signedIn()->putJson("/api/admin/bundles/{$id}", ['name' => 'Phone and buds', 'price' => 1650000, 'is_active' => false, 'items' => $items])
            ->assertOk()->assertJsonPath('bundle.is_active', false)->assertJsonPath('bundle.saving', 200000);
        $this->getJson('/api/offers')->assertJsonCount(0, 'bundles');

        $this->signedIn()->getJson('/api/admin/offers')->assertOk()->assertJsonCount(1, 'bundles');
        $this->signedIn()->deleteJson("/api/admin/bundles/{$id}")->assertOk();
        $this->assertSame(0, Bundle::count());
    }

    public function test_offers_are_managed_only_with_the_permission(): void
    {
        $staff = Admin::create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => 'correct-horse-9'])->fresh();
        AdminProfile::create(['user_id' => $staff->id, 'permissions' => ['products.edit']]);

        $this->getJson('/api/admin/offers')->assertStatus(401);
        $this->signedIn($staff)->getJson('/api/admin/offers')->assertStatus(403);
        $this->signedIn($staff)->postJson('/api/admin/promotions', [])->assertStatus(403);
        $this->signedIn($staff)->postJson('/api/admin/bundles', [])->assertStatus(403);
        $this->getJson('/api/offers')->assertOk();
    }
}
