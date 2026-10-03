<?php

namespace Tests\Feature;

use App\Exceptions\InsufficientStock;
use App\Models\Product;
use App\Models\Sales;
use App\Services\Inventory;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Stock and serial numbers moving between a product and a sale.
 * Runs on a throwaway in-memory database holding only the columns this needs.
 */
class InventoryTest extends TestCase
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
            $table->decimal('price', 10, 2);
            $table->integer('stock_quantity')->default(0);
            $table->string('status')->default('active');
            $table->unsignedBigInteger('category_id')->default(1);
            $table->text('meta_data')->nullable();
            $table->text('images')->nullable();
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('order_id');
            $table->string('username');
            $table->string('payment_status')->default('pending');
            $table->boolean('order_status')->default(false);
            $table->text('order_details')->nullable();
            $table->timestamps();
        });
    }

    private function phone(int $stock, array $serials): Product
    {
        return Product::create([
            'product_name' => 'iPhone 17',
            'category_id' => '1',
            'price' => 1850000,
            'stock_quantity' => $stock,
            'serial_numbers' => $serials,
        ])->fresh();
    }

    private function saleOf(Product $product, int $quantity, array $extra = []): Sales
    {
        return Sales::create([
            'username' => 'Ada Obi',
            'order_details' => [array_merge(['id' => (string) $product->id, 'type' => 'product', 'name' => $product->product_name, 'price' => 1850000, 'quantity' => $quantity], $extra)],
        ]);
    }

    public function test_a_product_with_units_is_in_stock_and_one_without_is_not(): void
    {
        $this->assertTrue($this->phone(2, [])->in_stock);

        $empty = $this->phone(0, []);
        $this->assertFalse($empty->in_stock);
        $this->assertSame('out_of_stock', $empty->status);
    }

    public function test_confirming_a_sale_takes_units_and_their_serial_numbers_off_the_product(): void
    {
        $product = $this->phone(3, ['SN-1', 'SN-2', 'SN-3']);
        $sale = $this->saleOf($product, 2);

        Inventory::deduct($sale);

        $product->refresh();
        $this->assertSame(1, $product->stock_quantity);
        $this->assertSame(2, $product->units_sold);
        $this->assertSame(['SN-3'], $product->serial_numbers);

        $line = $sale->fresh()->order_details[0];
        $this->assertSame(['SN-1', 'SN-2'], $line['serial_numbers']);
        $this->assertTrue($line['stock_deducted']);
    }

    public function test_a_sale_is_only_taken_from_stock_once(): void
    {
        $product = $this->phone(3, ['SN-1', 'SN-2', 'SN-3']);
        $sale = $this->saleOf($product, 1);

        Inventory::deduct($sale);
        Inventory::deduct($sale->fresh());

        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->assertSame(1, $product->fresh()->units_sold);
        $this->assertSame(['SN-2', 'SN-3'], $product->fresh()->serial_numbers);
    }

    public function test_selling_the_last_unit_marks_the_product_out_of_stock(): void
    {
        $product = $this->phone(1, ['SN-1']);

        Inventory::deduct($this->saleOf($product, 1));

        $product->refresh();
        $this->assertSame(0, $product->stock_quantity);
        $this->assertSame('out_of_stock', $product->status);
        $this->assertFalse($product->in_stock);
    }

    public function test_a_sale_larger_than_the_stock_is_refused_and_changes_nothing(): void
    {
        $product = $this->phone(1, ['SN-1']);
        $sale = $this->saleOf($product, 2);

        try {
            Inventory::deduct($sale);
            $this->fail('The sale should have been refused.');
        } catch (InsufficientStock $e) {
            $this->assertStringContainsString('Only 1 of iPhone 17 in stock', $e->getMessage());
        }

        $this->assertSame(1, $product->fresh()->stock_quantity);
        $this->assertSame(['SN-1'], $product->fresh()->serial_numbers);
        $this->assertArrayNotHasKey('stock_deducted', $sale->fresh()->order_details[0]);
    }

    public function test_units_without_serial_numbers_still_come_off_the_count(): void
    {
        $product = $this->phone(5, ['SN-1']);
        $sale = $this->saleOf($product, 3);

        Inventory::deduct($sale);

        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->assertSame([], $product->fresh()->serial_numbers);
        $this->assertSame(['SN-1'], $sale->fresh()->order_details[0]['serial_numbers']);
    }

    public function test_a_refund_puts_the_units_and_serial_numbers_back(): void
    {
        $product = $this->phone(2, ['SN-1', 'SN-2']);
        $sale = $this->saleOf($product, 2);
        Inventory::deduct($sale);

        Inventory::restore($sale->fresh());

        $product->refresh();
        $this->assertSame(2, $product->stock_quantity);
        $this->assertSame(0, $product->units_sold);
        $this->assertSame(['SN-1', 'SN-2'], $product->serial_numbers);
        $this->assertSame('active', $product->status);
        $this->assertSame([], $sale->fresh()->order_details[0]['serial_numbers']);
    }

    public function test_the_number_sold_adds_up_across_sales(): void
    {
        $product = $this->phone(10, []);

        Inventory::deduct($this->saleOf($product, 3));
        Inventory::deduct($this->saleOf($product->fresh(), 4));

        $product->refresh();
        $this->assertSame(7, $product->units_sold);
        $this->assertSame(3, $product->stock_quantity);
    }

    public function test_items_typed_in_by_hand_and_deals_do_not_touch_stock(): void
    {
        $product = $this->phone(2, ['SN-1', 'SN-2']);
        $sale = Sales::create([
            'username' => 'Walk-in',
            'order_details' => [
                ['name' => 'Screen repair', 'price' => 20000, 'quantity' => 1],
                ['id' => '68b74ba7002cda59000d800c', 'type' => 'deal', 'name' => 'Flash deal', 'price' => 1000, 'quantity' => 1],
            ],
        ]);

        Inventory::deduct($sale);

        $this->assertSame(2, $product->fresh()->stock_quantity);
        $this->assertArrayNotHasKey('stock_deducted', $sale->fresh()->order_details[0]);
    }
}
