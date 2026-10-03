<?php

namespace Tests\Feature;

use App\Models\Deal;
use App\Models\Product;
use App\Support\ProductUrls;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The store's own product addresses (/product/{slug}): how they are made, what happens
 * when two products share a name or a product is renamed, and where old addresses lead.
 * Runs on a throwaway in-memory database.
 */
class ProductUrlsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

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
            $table->unsignedBigInteger('category_id')->nullable();
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
    }

    private function withSlugs(): ProductUrls
    {
        (include database_path('migrations/2026_10_02_200000_create_product_slugs_table.php'))->up();
        $this->app->forgetScopedInstances();

        return ProductUrls::shared();
    }

    private function product(string $name): Product
    {
        return Product::create(['product_name' => $name, 'price' => 1000, 'stock_quantity' => 1])->fresh();
    }

    private function deal(string $name): Deal
    {
        return Deal::create(['product_name' => $name, 'price' => 1000])->fresh();
    }

    public function test_an_address_is_the_name_with_no_id(): void
    {
        $urls = $this->withSlugs();

        $this->assertSame('/product/apple-macbook-air-13-inch-m2', $urls->path($this->deal('Apple MacBook Air 13 inch (M2)')));
        $this->assertSame('/product/valve-steam-deck', $urls->path($this->product('Valve Steam Deck')));
    }

    public function test_items_with_the_same_name_get_different_addresses(): void
    {
        $urls = $this->withSlugs();

        $first = $this->product('Apple iPhone 17 Pro');
        $second = $this->product('Apple iPhone 17 Pro');
        $deal = $this->deal('Apple iPhone 17 Pro');

        $this->assertSame('/product/apple-iphone-17-pro', $urls->path($first));
        $this->assertSame('/product/apple-iphone-17-pro-2', $urls->path($second));
        $this->assertSame('/product/apple-iphone-17-pro-deal', $urls->path($deal));
        // Asking again changes nothing
        $this->assertSame('/product/apple-iphone-17-pro-2', $urls->path($second));
    }

    public function test_an_address_leads_to_its_item(): void
    {
        $urls = $this->withSlugs();
        $product = $this->product('Sony WH-1000XM5');
        $deal = $this->deal('Nintendo Switch Console');
        $urls->path($product);
        $urls->path($deal);

        $this->assertSame(['id' => (string) $product->id, 'type' => 'product'], $urls->locate('sony-wh-1000xm5'));
        $this->assertSame(['id' => $deal->id, 'type' => 'deal'], $urls->locate('nintendo-switch-console'));
        $this->assertNull($urls->locate('no-such-product'));
    }

    public function test_addresses_from_before_slugs_redirect(): void
    {
        $urls = $this->withSlugs();
        $product = $this->product('Samsung Galaxy S24');
        $deal = $this->deal('Apple Watch Ultra 2');

        $this->assertSame(['redirect' => '/product/samsung-galaxy-s24'], $urls->locate((string) $product->id));
        $this->assertSame(['redirect' => '/product/samsung-galaxy-s24'], $urls->locate((string) $product->id, 'samsung-galaxy-s24'));
        $this->assertSame(['redirect' => '/product/apple-watch-ultra-2'], $urls->locate($deal->id, 'apple-watch-ultra-2'));
        $this->assertNull($urls->locate('999999'));
    }

    public function test_a_deal_id_is_never_read_as_a_product_id(): void
    {
        $urls = $this->withSlugs();
        $six = collect(range(1, 6))->map(fn ($n) => $this->product("Product {$n}"))->last();
        $this->assertSame('6', (string) $six->id);

        // No deal has this id, and it must not fall through to product 6
        $this->assertNull($urls->locate('6abef54100389581009cd83e'));
    }

    public function test_a_renamed_product_keeps_its_old_address_as_a_redirect(): void
    {
        $urls = $this->withSlugs();
        $product = $this->product('iPhone 17 promax orange');
        $this->assertSame('/product/iphone-17-promax-orange', $urls->path($product));

        $product->update(['product_name' => 'Apple iPhone 17 Pro Max (Orange)']);
        $this->assertSame('apple-iphone-17-pro-max-orange', $urls->sync($product));

        $this->assertSame('/product/apple-iphone-17-pro-max-orange', $urls->path($product));
        $this->assertSame(['redirect' => '/product/apple-iphone-17-pro-max-orange'], $urls->locate('iphone-17-promax-orange'));

        // Renamed back: the first address is used again, and the other one now redirects
        $product->update(['product_name' => 'iPhone 17 promax orange']);
        $this->assertSame('iphone-17-promax-orange', $urls->sync($product));
        $this->assertSame(['redirect' => '/product/iphone-17-promax-orange'], $urls->locate('apple-iphone-17-pro-max-orange'));
    }

    public function test_a_deleted_product_frees_its_address(): void
    {
        $urls = $this->withSlugs();
        $old = $this->product('Valve Steam Deck');
        $urls->path($old);

        $urls->release($old);
        $old->delete();

        $this->assertNull($urls->locate('valve-steam-deck'));
        $this->assertSame('/product/valve-steam-deck', $urls->path($this->product('Valve Steam Deck')));
    }

    public function test_long_names_are_cut_at_a_word(): void
    {
        $urls = $this->withSlugs();
        $path = $urls->path($this->product('Apple MacBook Pro 16 inch M4 Max 64GB RAM 2TB SSD Space Black with AppleCare and USB-C Hub Bundle'));

        $this->assertLessThanOrEqual(strlen('/product/') + 80, strlen($path));
        $this->assertStringEndsNotWith('-', $path);
        $this->assertStringStartsWith('/product/apple-macbook-pro-16-inch-m4-max', $path);
    }

    public function test_the_route_redirects_old_addresses_permanently(): void
    {
        $urls = $this->withSlugs();
        $product = $this->product('Sony PlayStation 5 Console');
        $deal = $this->deal('Apple MacBook Air 13 inch (M2)');

        $this->get("/product/{$product->id}")->assertStatus(301)->assertRedirect('/product/sony-playstation-5-console');
        $this->get("/product/{$product->id}/sony-playstation-5-console")->assertStatus(301)->assertRedirect('/product/sony-playstation-5-console');
        $this->get("/product/{$deal->id}/apple-macbook-air-13-inch-m2")->assertStatus(301)->assertRedirect('/product/apple-macbook-air-13-inch-m2');

        // Renaming through the model moves the address and leaves a redirect behind
        $product->update(['product_name' => 'Sony PS5 Console']);
        $this->assertSame('/product/sony-ps5-console', $urls->path($product));
        $this->get('/product/sony-playstation-5-console')->assertStatus(301)->assertRedirect('/product/sony-ps5-console');
    }

    public function test_without_the_table_the_old_addresses_keep_working(): void
    {
        $urls = ProductUrls::shared();
        $product = $this->product('Samsung Galaxy Tab S9');

        $this->assertFalse($urls->ready());
        $this->assertSame("/product/{$product->id}/samsung-galaxy-tab-s9", $urls->path($product));
        $this->assertSame(['id' => (string) $product->id, 'type' => 'product'], $urls->locate((string) $product->id, 'samsung-galaxy-tab-s9'));
        $this->assertSame(['redirect' => "/product/{$product->id}/samsung-galaxy-tab-s9"], $urls->locate((string) $product->id));
    }
}
