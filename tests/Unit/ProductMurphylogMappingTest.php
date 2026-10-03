<?php

namespace Tests\Unit;

use App\Models\Product;
use Tests\TestCase;

class ProductMurphylogMappingTest extends TestCase
{
    /**
     * A row as it is stored in the murphylog products table.
     */
    private function murphylogRow(array $overrides = []): Product
    {
        return (new Product)->setRawAttributes(array_merge([
            'id' => 7,
            'name' => 'Galaxy S24',
            'short_description' => 'Short text',
            'description' => 'Long text',
            'price' => '305.37',
            'cost_price' => '153.88',
            'status' => 'active',
            'stock_quantity' => 4,
            'category_id' => 3,
            'brand' => 'Samsung',
            'attributes' => '{"color":"Aqua"}',
            'images' => '["a.jpg","b.jpg"]',
            'meta_data' => '{"meta_title":"Galaxy S24"}',
        ], $overrides), true);
    }

    public function test_murphylog_columns_are_exposed_under_the_app_field_names(): void
    {
        $data = $this->murphylogRow()->toArray();

        $this->assertSame('7', $data['id']);
        $this->assertSame('3', $data['category_id']);
        $this->assertSame('Galaxy S24', $data['product_name']);
        $this->assertSame('Short text', $data['overview']);
        $this->assertSame(['a.jpg', 'b.jpg'], $data['images_url']);
        $this->assertTrue($data['in_stock']);
        $this->assertSame('new', $data['product_status']);
        $this->assertSame('305.37', $data['display_price']);
        $this->assertSame([], $data['storage_options']);
        $this->assertSame(['brand' => 'Samsung', 'color' => 'Aqua'], $data['specification']);
    }

    public function test_raw_and_internal_columns_are_not_serialized(): void
    {
        $data = $this->murphylogRow()->toArray();

        foreach (['name', 'short_description', 'images', 'attributes', 'meta_data', 'cost_price'] as $column) {
            $this->assertArrayNotHasKey($column, $data);
        }
    }

    public function test_only_active_products_with_units_left_are_in_stock(): void
    {
        $this->assertTrue($this->murphylogRow()->in_stock);
        $this->assertFalse($this->murphylogRow(['stock_quantity' => 0])->in_stock);
        $this->assertFalse($this->murphylogRow(['status' => 'out_of_stock'])->in_stock);
        $this->assertFalse($this->murphylogRow(['status' => 'inactive'])->in_stock);
    }

    public function test_the_stock_count_puts_a_product_on_and_off_sale(): void
    {
        $product = $this->murphylogRow();

        $product->stock_quantity = 0;
        $this->assertSame('out_of_stock', $product->getAttributes()['status']);

        $product->stock_quantity = 3;
        $this->assertSame('active', $product->getAttributes()['status']);

        // A hidden product stays hidden whatever its count
        $hidden = $this->murphylogRow(['status' => 'inactive']);
        $hidden->stock_quantity = 9;
        $this->assertSame('inactive', $hidden->getAttributes()['status']);
    }

    public function test_the_listing_admin_and_number_sold_are_for_admins_only(): void
    {
        $product = $this->murphylogRow();
        $product->listed_by = ['id' => 1, 'name' => 'Admin User', 'email' => 'admin@example.com', 'password' => 'never kept'];
        $product->units_sold = 5;

        $this->assertSame(['id' => '1', 'name' => 'Admin User', 'email' => 'admin@example.com'], $product->listed_by);
        $this->assertSame(5, $product->units_sold);
        $this->assertNull($this->murphylogRow()->listed_by);
        $this->assertSame(0, $this->murphylogRow()->units_sold);

        $public = $product->toArray();
        $this->assertArrayNotHasKey('listed_by', $public);
        $this->assertArrayNotHasKey('units_sold', $public);

        $admin = $product->append(Product::ADMIN_FIELDS)->toArray();
        $this->assertSame('Admin User', $admin['listed_by']['name']);
        $this->assertSame(5, $admin['units_sold']);
    }

    public function test_serial_numbers_are_kept_out_of_the_public_product_data(): void
    {
        $product = $this->murphylogRow();
        $product->serial_numbers = [' SN-1 ', '', 'SN-2'];

        $this->assertSame(['SN-1', 'SN-2'], $product->serial_numbers);
        $this->assertArrayNotHasKey('serial_numbers', $product->toArray());
        $this->assertArrayNotHasKey('meta_data', $product->toArray());
    }

    public function test_filling_app_fields_writes_murphylog_columns(): void
    {
        $product = new Product([
            'product_name' => 'Pixel 9',
            'overview' => 'Overview',
            'description' => null,
            'images_url' => ['x.jpg'],
            'in_stock' => false,
        ]);

        $raw = $product->getAttributes();

        $this->assertSame('Pixel 9', $raw['name']);
        $this->assertSame('Overview', $raw['short_description']);
        $this->assertSame('', $raw['description']);
        $this->assertSame('["x.jpg"]', $raw['images']);
        $this->assertSame('out_of_stock', $raw['status']);
    }

    public function test_fields_without_a_column_are_merged_into_meta_data(): void
    {
        $product = $this->murphylogRow();

        $product->fill([
            'about' => 'About text',
            'product_status' => 'uk_used',
            'colors' => ['Black'],
            'specification' => ['ram' => '8GB'],
            'storage_options' => [['storage' => '128GB', 'price' => 900]],
        ]);

        $meta = json_decode($product->getAttributes()['meta_data'], true);

        $this->assertSame('Galaxy S24', $meta['meta_title']);
        $this->assertSame('About text', $product->about);
        $this->assertSame('uk_used', $product->product_status);
        $this->assertSame(['Black'], $product->colors);
        $this->assertSame(['ram' => '8GB'], $product->specification);
        $this->assertSame('128GB', $product->default_storage);
        $this->assertSame(900, $product->display_price);
    }

    public function test_a_deal_style_id_never_matches_a_product(): void
    {
        $dealLookup = Product::query()->whereKey('6abe4c43007463e200e76b0d')->toSql();
        $productLookup = Product::query()->whereKey('179')->toSql();

        $this->assertStringContainsString('0 = 1', $dealLookup);
        $this->assertStringNotContainsString('0 = 1', $productLookup);
    }

    public function test_marking_an_inactive_product_out_of_stock_keeps_it_inactive(): void
    {
        $product = $this->murphylogRow(['status' => 'inactive']);

        $product->in_stock = false;
        $this->assertSame('inactive', $product->getAttributes()['status']);

        $product->in_stock = true;
        $this->assertSame('active', $product->getAttributes()['status']);
    }
}
