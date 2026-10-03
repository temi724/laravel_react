<?php

namespace Tests\Feature;

use App\Filesystem\BunnyStorageAdapter;
use App\Models\Product;
use App\Support\ProductImages;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use League\Flysystem\UnableToDeleteDirectory;
use League\Flysystem\UnableToWriteFile;
use Tests\TestCase;

/**
 * The bunny.net storage disk, against a stand-in for bunny's HTTP API
 * (https://bunny.net/docs/storage/http). No request leaves the machine.
 */
class BunnyStorageTest extends TestCase
{
    private const KEY = 'zone-password-1234';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'filesystems.disks.bunny' => [
                'driver' => 'bunny',
                'storage_zone' => 'murphylog',
                'access_key' => self::KEY,
                'hostname' => 'uk.storage.bunnycdn.com',
                'cdn_url' => 'https://murphylog.b-cdn.net/',
                'root' => '',
                'throw' => true,
            ],
            'filesystems.uploads' => 'bunny',
        ]);
        Storage::forgetDisk('bunny');
        Http::preventStrayRequests();
    }

    /**
     * Answers every request with "201 uploaded" and keeps what was sent. A file sent as a stream
     * can only be read while the request is being made, so it is read here.
     */
    private function recordUploads(): \ArrayObject
    {
        $uploads = new \ArrayObject;

        Http::fake(function (Request $request) use ($uploads) {
            $uploads[] = [
                'method' => $request->method(),
                'url' => $request->url(),
                'body' => $request->body(),
                'checksum' => $request->header('Checksum')[0] ?? null,
            ];

            return Http::response(['HttpCode' => 201, 'Message' => 'File uploaded.'], 201);
        });

        return $uploads;
    }

    public function test_a_file_is_uploaded_as_the_raw_body_with_the_zone_password(): void
    {
        Http::fake(['uk.storage.bunnycdn.com/*' => Http::response(['HttpCode' => 201, 'Message' => 'File uploaded.'], 201)]);

        Storage::disk('bunny')->put('products/My Phone.png', 'png-bytes');

        Http::assertSent(function (Request $request) {
            return $request->method() === 'PUT'
                && $request->url() === 'https://uk.storage.bunnycdn.com/murphylog/products/My%20Phone.png'
                && $request->header('AccessKey') === [self::KEY]
                && $request->header('Content-Type') === ['image/png']
                && $request->header('Checksum') === [strtoupper(hash('sha256', 'png-bytes'))]
                && $request->body() === 'png-bytes';
        });
    }

    public function test_the_public_address_goes_through_the_pull_zone(): void
    {
        $this->assertSame('https://murphylog.b-cdn.net/products/a%20b.png', Storage::disk('bunny')->url('products/a b.png'));
    }

    public function test_a_refused_upload_fails_without_revealing_the_password(): void
    {
        Http::fake(['*' => Http::response(['HttpCode' => 401, 'Message' => 'Unauthorized'], 401)]);

        try {
            Storage::disk('bunny')->put('products/a.png', 'x');
            $this->fail('The upload should have failed.');
        } catch (UnableToWriteFile $e) {
            $this->assertStringContainsString('401', $e->getMessage());
            $this->assertStringNotContainsString(self::KEY, $e->getMessage());
        }
    }

    public function test_deleting_a_file_that_is_already_gone_is_fine(): void
    {
        Http::fake(['*' => Http::response(['HttpCode' => 404, 'Message' => 'Object Not Found'], 404)]);

        $this->assertTrue(Storage::disk('bunny')->delete('products/gone.png'));
        Http::assertSent(fn (Request $request) => $request->method() === 'DELETE' && $request->url() === 'https://uk.storage.bunnycdn.com/murphylog/products/gone.png');
    }

    public function test_existence_follows_the_answer_from_bunny(): void
    {
        Http::fake([
            '*/products/here.png' => Http::response('bytes', 200),
            '*/products/missing.png*' => Http::response(['HttpCode' => 404], 404),
        ]);

        $this->assertTrue(Storage::disk('bunny')->exists('products/here.png'));
        $this->assertFalse(Storage::disk('bunny')->exists('products/missing.png'));
    }

    public function test_a_directory_listing_is_read_from_the_json_bunny_returns(): void
    {
        Http::fake(['uk.storage.bunnycdn.com/murphylog/products/' => Http::response([
            ['ObjectName' => 'a.png', 'IsDirectory' => false, 'Length' => 120, 'LastChanged' => '2026-10-01T10:00:00.000'],
            ['ObjectName' => 'demo', 'IsDirectory' => true, 'Length' => 0, 'LastChanged' => '2026-10-01T10:00:00.000'],
        ])]);

        $this->assertSame(['products/a.png'], Storage::disk('bunny')->files('products'));
        $this->assertSame(['products/demo'], Storage::disk('bunny')->directories('products'));
    }

    public function test_the_root_of_the_zone_is_never_deleted(): void
    {
        Http::fake();

        $this->expectException(UnableToDeleteDirectory::class);
        (new BunnyStorageAdapter('murphylog', self::KEY))->deleteDirectory('');
    }

    public function test_the_password_is_only_ever_sent_to_a_bunny_storage_host(): void
    {
        $this->expectException(InvalidArgumentException::class);
        new BunnyStorageAdapter('murphylog', self::KEY, 'storage.bunnycdn.com.evil.example');
    }

    public function test_the_hostname_can_be_pasted_as_the_dashboard_shows_it(): void
    {
        $this->assertSame('storage.bunnycdn.com', BunnyStorageAdapter::storageHostname('https://de-s3.storage.bunnycdn.com'));
        $this->assertSame('storage.bunnycdn.com', BunnyStorageAdapter::storageHostname('https://storage.bunnycdn.com/'));
        $this->assertSame('uk.storage.bunnycdn.com', BunnyStorageAdapter::storageHostname('UK-S3.storage.bunnycdn.com'));
        $this->assertSame('ny.storage.bunnycdn.com', BunnyStorageAdapter::storageHostname('ny.storage.bunnycdn.com'));
    }

    public function test_a_pull_zone_typed_without_https_still_gives_a_full_address(): void
    {
        $adapter = new BunnyStorageAdapter('murphylog', self::KEY, 'https://de-s3.storage.bunnycdn.com', 'murphylog.b-cdn.net');

        $this->assertSame('https://murphylog.b-cdn.net/products/a.png', $adapter->getUrl('products/a.png'));
    }

    public function test_the_password_stays_out_of_stack_traces(): void
    {
        try {
            new BunnyStorageAdapter('murphylog', self::KEY, 'not-bunny.example');
            $this->fail('The hostname should have been refused.');
        } catch (InvalidArgumentException $e) {
            $this->assertStringNotContainsString(self::KEY, $e->getTraceAsString());
            $this->assertStringNotContainsString(self::KEY, json_encode($e->getTrace()));
        }
    }

    public function test_a_root_folder_is_put_in_front_of_every_path(): void
    {
        Http::fake(['*' => Http::response([], 201)]);
        $adapter = new BunnyStorageAdapter('murphylog', self::KEY, 'storage.bunnycdn.com', 'https://murphylog.b-cdn.net', 'shop');

        $adapter->write('products/a.png', 'x', new \League\Flysystem\Config);

        Http::assertSent(fn (Request $request) => $request->url() === 'https://storage.bunnycdn.com/murphylog/shop/products/a.png');
        $this->assertSame('https://murphylog.b-cdn.net/shop/products/a.png', $adapter->getUrl('products/a.png'));
    }

    public function test_an_uploaded_product_photo_is_stored_on_bunny_under_its_real_type(): void
    {
        $uploads = $this->recordUploads();

        // A PNG that claims to be an HTML page
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        $file = tempnam(sys_get_temp_dir(), 'png');
        file_put_contents($file, $png);
        $url = ProductImages::store(new UploadedFile($file, 'evil.html', 'text/html', null, true));

        $this->assertMatchesRegularExpression('#^https://murphylog\.b-cdn\.net/products/[A-Za-z0-9]{40}\.png$#', $url);
        $this->assertCount(1, $uploads);
        $this->assertSame('PUT', $uploads[0]['method']);
        $this->assertSame(str_replace('https://murphylog.b-cdn.net/', 'https://uk.storage.bunnycdn.com/murphylog/', $url), $uploads[0]['url']);
        $this->assertSame($png, $uploads[0]['body']);
        $this->assertSame(strtoupper(hash('sha256', $png)), $uploads[0]['checksum']);
    }

    public function test_a_photo_bunny_refuses_is_reported_on_the_photo_field(): void
    {
        Http::fake(['*' => Http::response([], 401)]);

        try {
            ProductImages::store(UploadedFile::fake()->image('phone.jpg'));
            $this->fail('The upload should have been reported.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('product_images', $e->errors());
        }
    }

    public function test_without_bunny_details_photos_stay_in_the_local_images_folder(): void
    {
        config(['filesystems.uploads' => 'images']);
        Storage::fake('images');
        Http::fake();

        $url = ProductImages::store(UploadedFile::fake()->image('phone.jpg'));

        $this->assertMatchesRegularExpression('#^/images/products/[A-Za-z0-9]{40}\.jpg$#', $url);
        Storage::disk('images')->assertExists(substr($url, strlen('/images/')));
        Http::assertNothingSent();
    }

    public function test_the_move_command_copies_local_photos_and_repoints_the_products(): void
    {
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
        Schema::create('deals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->text('images_url')->nullable();
            $table->text('storage_options')->nullable();
            $table->timestamps();
        });

        Storage::fake('images');
        Storage::disk('images')->put('products/demo/ps5.jpg', 'ps5-bytes');
        $uploads = $this->recordUploads();

        $shared = ['/images/products/demo/ps5.jpg', 'https://example.com/elsewhere.jpg', '/images/products/lost.jpg'];
        $first = Product::create(['product_name' => 'PS5', 'category_id' => '1', 'price' => 1, 'stock_quantity' => 1, 'images_url' => $shared]);
        $second = Product::create(['product_name' => 'PS5 Slim', 'category_id' => '1', 'price' => 1, 'stock_quantity' => 1, 'images_url' => ['/images/products/demo/ps5.jpg']]);

        $this->artisan('images:to-bunny --dry-run')->assertSuccessful();
        $this->assertCount(0, $uploads);
        $this->assertSame($shared, $first->fresh()->images_url);

        $this->artisan('images:to-bunny')->assertSuccessful();

        // Uploaded once although two products use it; other links and missing files are left alone
        $this->assertCount(1, $uploads);
        $this->assertSame('https://uk.storage.bunnycdn.com/murphylog/products/demo/ps5.jpg', $uploads[0]['url']);
        $this->assertSame('ps5-bytes', $uploads[0]['body']);
        $this->assertSame(
            ['https://murphylog.b-cdn.net/products/demo/ps5.jpg', 'https://example.com/elsewhere.jpg', '/images/products/lost.jpg'],
            $first->fresh()->images_url
        );
        $this->assertSame(['https://murphylog.b-cdn.net/products/demo/ps5.jpg'], $second->fresh()->images_url);
        Storage::disk('images')->assertExists('products/demo/ps5.jpg');
    }
}
