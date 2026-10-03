<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AdminProfile;
use App\Models\Category;
use App\Models\Product;
use App\Services\ProductImport;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Monolog\Handler\NullHandler;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Tests\TestCase;

/**
 * Exporting the products table to Excel and importing products from an Excel file.
 * Runs on a throwaway in-memory database holding only the tables this needs.
 */
class ProductSpreadsheetTest extends TestCase
{
    private const HEADINGS = ['Product name', 'Category', 'Price', 'Stock count', 'Condition', 'Serial numbers', 'Colours', 'Storage options', 'Photo links'];

    private Admin $admin;

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

        Category::create(['name' => 'Smartphones']);
        Category::create(['name' => 'Accessories']);

        $this->admin = Admin::create(['name' => 'Owner', 'email' => 'owner@example.com', 'password' => 'correct-horse-9'])->fresh();
        AdminProfile::create(['user_id' => $this->admin->id, 'is_super' => true]);
    }

    private function signedIn(?Admin $admin = null): static
    {
        return $this->withSession(['admin_logged_in' => true, 'admin_id' => ($admin ?? $this->admin)->id]);
    }

    /**
     * An uploaded .xlsx with the given rows under the given headings.
     *
     * @param  list<list<mixed>>  $rows
     * @param  list<string>  $headings
     */
    private function workbook(array $rows, array $headings = self::HEADINGS): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'import-test-') . '.xlsx';
        $writer = new Writer;
        $writer->openToFile($path);
        $writer->addRow(Row::fromValues($headings));
        foreach ($rows as $row) {
            $writer->addRow(Row::fromValues($row));
        }
        $writer->close();

        return new UploadedFile($path, 'products.xlsx', null, null, true);
    }

    /**
     * @return list<list<mixed>>
     */
    private function sheet(string $path, int $index = 0): array
    {
        $reader = new Reader;
        $reader->open($path);
        $rows = [];
        foreach ($reader->getSheetIterator() as $position => $sheet) {
            if ($position - 1 === $index) {
                foreach ($sheet->getRowIterator() as $row) {
                    $rows[] = $row->toArray();
                }
            }
        }
        $reader->close();

        return $rows;
    }

    public function test_the_sample_file_has_the_headings_two_examples_and_a_guide(): void
    {
        $response = $this->signedIn()->get('/api/admin/products-import/sample')->assertOk();
        $this->assertStringContainsString('product-import-sample.xlsx', (string) $response->headers->get('content-disposition'));

        $path = $response->baseResponse->getFile()->getPathname();
        $products = $this->sheet($path);
        $this->assertSame('Product name', $products[0][0]);
        $this->assertContains('Serial numbers', $products[0]);
        $this->assertStringStartsWith(ProductImport::EXAMPLE_PREFIX, $products[1][0]);
        $this->assertCount(3, $products);

        $guide = array_merge(...array_map(fn ($row) => array_map('strval', $row), $this->sheet($path, 1)));
        $this->assertContains('Your categories', $guide);
        $this->assertContains('Smartphones', $guide);

        // Importing the sample as it is adds nothing: its rows are examples
        $this->signedIn()->post('/api/admin/products-import', ['file' => new UploadedFile($path, 'sample.xlsx', null, null, true)], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('imported', 0)->assertJsonPath('skipped_examples', 2);
        $this->assertSame(0, Product::count());
    }

    public function test_a_file_is_checked_first_and_nothing_is_saved(): void
    {
        $file = $this->workbook([
            ['iPhone 17', 'smartphones', 1850000, 2, 'New', 'A1, A2', 'Black, Blue', '256GB=1850000, 512GB=2150000', ''],
            ['Mystery phone', 'Phones', 'cheap', -1, 'Mint', '', '', '128GB', 'not a link'],
            ['Cable', 'Accessories', '₦6,500', 3, '', 'C1, C2, C3, C4', '', '', ''],
        ]);

        $response = $this->signedIn()->post('/api/admin/products-import', ['file' => $file, 'dry_run' => '1'], ['Accept' => 'application/json']);

        $response->assertOk()
            ->assertJsonPath('dry_run', true)
            ->assertJsonPath('ready', 1)
            ->assertJsonPath('imported', 0)
            ->assertJsonPath('preview', ['iPhone 17'])
            ->assertJsonPath('problems.0.row', 3)
            ->assertJsonPath('problems.0.name', 'Mystery phone')
            ->assertJsonPath('problems.1.row', 4);

        $messages = implode(' ', $response->json('problems.0.messages'));
        $this->assertStringContainsString('no category called "Phones"', $messages);
        $this->assertStringContainsString('price must be a number', $messages);
        $this->assertStringContainsString('stock count must be a whole number', $messages);
        $this->assertStringContainsString('condition "Mint"', $messages);
        $this->assertStringContainsString('storage option "128GB"', $messages);
        $this->assertStringContainsString('photo link "not"', $messages);
        $this->assertStringContainsString('4 serial numbers but the stock count is 3', implode(' ', $response->json('problems.1.messages')));

        $this->assertSame(0, Product::count());
    }

    public function test_good_rows_are_imported_with_stock_serial_numbers_and_who_listed_them(): void
    {
        $file = $this->workbook([
            // An IMEI typed into Excel arrives as a number
            ['iPhone 17', 'Smartphones', 1850000, 2, 'UK used', 356789104523871, 'Black, Blue', '256GB=1850000, 512GB=2150000', ''],
            ['Broken row', 'Nowhere', 10, 1, '', '', '', '', ''],
            ['Power bank', 'Accessories', '38,500', 12, '', '', '', '', 'https://cdn.example.com/a.jpg'],
        ]);

        $this->signedIn()->post('/api/admin/products-import', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('imported', 2)->assertJsonCount(1, 'problems');

        $iphone = Product::where('name', 'iPhone 17')->firstOrFail();
        $this->assertSame('1850000.00', $iphone->price);
        $this->assertSame(2, $iphone->stock_quantity);
        $this->assertSame(['356789104523871'], $iphone->serial_numbers);
        $this->assertSame('uk_used', $iphone->product_status);
        $this->assertSame(['Black', 'Blue'], $iphone->colors);
        $this->assertEquals([['storage' => '256GB', 'price' => 1850000], ['storage' => '512GB', 'price' => 2150000]], $iphone->storage_options);
        $this->assertSame([], $iphone->images_url);
        $this->assertTrue($iphone->in_stock);
        $this->assertSame('Owner', $iphone->listed_by['name']);

        $powerBank = Product::where('name', 'Power bank')->firstOrFail();
        $this->assertSame('38500.00', $powerBank->price);
        $this->assertSame(['https://cdn.example.com/a.jpg'], $powerBank->images_url);
        $this->assertSame(2, Product::count());
    }

    public function test_importing_the_same_file_twice_does_not_create_copies(): void
    {
        $rows = [['iPhone 17', 'Smartphones', 1850000, 1, '', '', '', '', ''], ['IPHONE 17', 'Smartphones', 1, 1, '', '', '', '', '']];

        $this->signedIn()->post('/api/admin/products-import', ['file' => $this->workbook($rows)], ['Accept' => 'application/json'])
            ->assertJsonPath('imported', 1)
            ->assertJsonPath('problems.0.messages.0', 'Row 2 has the same product name.');

        $this->signedIn()->post('/api/admin/products-import', ['file' => $this->workbook($rows)], ['Accept' => 'application/json'])
            ->assertJsonPath('imported', 0)
            ->assertJsonPath('problems.0.messages.0', 'A product with this name is already in the store.');

        $this->assertSame(1, Product::count());
    }

    public function test_a_file_without_the_required_headings_or_of_the_wrong_kind_is_refused(): void
    {
        $this->signedIn()->post('/api/admin/products-import', ['file' => $this->workbook([['x', 1]], ['Product name', 'Price'])], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'The file is missing required columns: Category, Stock count. Download the sample file to see the headings the first row needs.');

        $this->signedIn()->post('/api/admin/products-import', ['file' => UploadedFile::fake()->image('photo.jpg')], ['Accept' => 'application/json'])
            ->assertStatus(422);

        $this->signedIn()->post('/api/admin/products-import', [], ['Accept' => 'application/json'])->assertStatus(422);
    }

    public function test_the_export_holds_the_chosen_columns_for_the_products_listed(): void
    {
        $category = Category::where('name', 'Smartphones')->firstOrFail();
        $product = new Product([
            'product_name' => '=HYPERLINK("http://evil.example","iPhone 17")', 'category_id' => $category->id, 'price' => 1850000,
            'stock_quantity' => 3, 'serial_numbers' => ['A1', 'A2'], 'storage_options' => [['storage' => '256GB', 'price' => 1850000]],
        ]);
        $product->units_sold = 4;
        $product->listedBy($this->admin)->save();
        (new Product(['product_name' => 'Cable', 'category_id' => $category->id, 'price' => 6500, 'stock_quantity' => 0]))->save();

        $response = $this->signedIn()->get('/api/admin/products-export?' . http_build_query([
            'fields' => ['serial_numbers', 'name', 'stocked', 'price', 'in_stock', 'listed_by', 'storage_options'],
            'status' => 'in_stock',
        ]))->assertOk();

        $rows = $this->sheet($response->baseResponse->getFile()->getPathname());

        // Columns come out in the table's usual order, whatever order they were asked for in
        $this->assertSame(['Product name', 'Price', 'Storage options', 'Stocked', 'In stock', 'Serial numbers', 'Listed by'], $rows[0]);
        $this->assertCount(2, $rows, 'The out-of-stock product is left out by the filter');
        // Text stays text: Excel shows it rather than running it as a formula
        $this->assertSame(['=HYPERLINK("http://evil.example","iPhone 17")', 1850000, '256GB=1850000', 7, 'Yes', 'A1, A2', 'Owner'], $rows[1]);
    }

    public function test_export_and_import_each_need_their_own_permission(): void
    {
        $staff = Admin::create(['name' => 'Staff', 'email' => 'staff@example.com', 'password' => 'correct-horse-9'])->fresh();
        AdminProfile::create(['user_id' => $staff->id, 'permissions' => ['products.edit']]);

        $this->signedIn($staff)->getJson('/api/admin/products-export?fields[]=name')->assertStatus(403);
        $this->signedIn($staff)->getJson('/api/admin/products-export/fields')->assertStatus(403);
        $this->signedIn($staff)->getJson('/api/admin/products-import/sample')->assertStatus(403);
        $this->signedIn($staff)->postJson('/api/admin/products-import', [])->assertStatus(403);

        $this->signedIn()->getJson('/api/admin/products-export')->assertStatus(422);
        $this->signedIn()->getJson('/api/admin/products-export?fields[]=password')->assertStatus(422);
        $this->signedIn()->getJson('/api/admin/products-export/fields')->assertOk()->assertJsonPath('fields.0.key', 'name');
    }
}
