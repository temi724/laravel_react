<?php

namespace Tests\Feature;

use App\Models\Bundle;
use App\Models\Category;
use App\Models\Deal;
use App\Models\Product;
use App\Models\Promotion;
use App\Support\Seo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * What search engines are given: which pages they may list, the one address of each page,
 * the title and description, the products printed in the HTML and the schema.org data.
 * Runs on a throwaway in-memory database.
 */
class SeoTest extends TestCase
{
    private Category $phones;

    private Category $empty;

    private Product $iphone;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
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
            $table->string('brand')->nullable();
            $table->text('meta_data')->nullable();
            $table->text('images')->nullable();
            $table->timestamps();
        });
        Schema::create('deals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('product_name');
            $table->string('category_id')->nullable();
            $table->decimal('price', 12, 2);
            $table->decimal('old_price', 12, 2)->nullable();
            $table->text('overview')->nullable();
            $table->text('description')->nullable();
            $table->text('storage_options')->nullable();
            $table->text('images_url')->nullable();
            $table->string('product_status')->default('new');
            $table->boolean('in_stock')->default(true);
            $table->timestamps();
        });
        (include database_path('migrations/2026_10_02_100000_create_offers_tables.php'))->up();

        $this->phones = Category::create(['name' => 'Smartphones']);
        $this->empty = Category::create(['name' => 'Drones']);

        $this->iphone = Product::create([
            'product_name' => 'Apple iPhone 17 Pro',
            'category_id' => $this->phones->id,
            'price' => 1750000,
            'stock_quantity' => 3,
            'overview' => 'A 6.3 inch display and three 48MP cameras.',
            'description' => 'The iPhone 17 Pro has the same chip and camera system as the Pro Max in a smaller body.',
            'images_url' => ['/images/products/demo/iphone-17-pro.jpg'],
            'product_status' => 'uk_used',
        ])->fresh();
    }

    /**
     * The schema.org nodes of a page, by type.
     *
     * @return array<string, array<string, mixed>>
     */
    private function schema(TestResponse $response): array
    {
        preg_match('#<script type="application/ld\+json">(.*?)</script>#s', $response->getContent(), $found);
        $this->assertNotEmpty($found, 'The page has no schema.org data');

        $data = json_decode($found[1], true, flags: JSON_THROW_ON_ERROR);
        $this->assertSame('https://schema.org', $data['@context']);

        return collect($data['@graph'])->keyBy('@type')->all();
    }

    public function test_robots_txt_opens_the_shop_and_keeps_the_admin_area_out(): void
    {
        $robots = $this->get('/robots.txt')->assertOk()->assertHeader('Content-Type', 'text/plain; charset=UTF-8')->getContent();

        $this->assertStringContainsString("User-agent: *\n", $robots);
        $this->assertStringContainsString("Disallow: /admin\n", $robots);
        $this->assertStringContainsString('Sitemap: '.Seo::url('/sitemap.xml'), $robots);
        // Nothing public is blocked, and no AI crawler is turned away
        $this->assertStringNotContainsString("Disallow: /\n", $robots);
        $this->assertStringNotContainsString('GPTBot', $robots);
    }

    public function test_the_sitemap_lists_what_should_be_found_and_nothing_else(): void
    {
        $deal = Deal::create(['product_name' => 'Sony WH-1000XM5', 'category_id' => $this->phones->id, 'price' => 400000, 'old_price' => 480000]);
        $bundle = Bundle::create(['name' => 'Apple starter set', 'price' => 1700000, 'is_active' => true]);
        $bundle->items()->create(['product_id' => $this->iphone->id, 'quantity' => 1, 'position' => 0]);

        $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();
        $this->assertNotFalse(simplexml_load_string($sitemap), 'The sitemap is not valid XML');

        foreach (['/', '/products', '/about', '/category/smartphones', '/bundle/'.$bundle->slug, $this->iphone->url, $deal->url] as $path) {
            $this->assertStringContainsString('<loc>'.Seo::url($path).'</loc>', $sitemap);
        }

        // A photo for image search
        $this->assertStringContainsString('<image:loc>'.Seo::url('/images/products/demo/iphone-17-pro.jpg').'</image:loc>', $sitemap);

        // An empty category, and pages that are not for search results
        foreach (['/category/drones', '/cart', '/checkout', '/search', '/admin'] as $path) {
            $this->assertStringNotContainsString(Seo::url($path).'<', $sitemap);
        }
    }

    public function test_the_home_page_names_the_shop_and_prints_its_products(): void
    {
        $response = $this->get('/')->assertOk();

        $response->assertSee('<title>'.e(config('store.seo.home_title')).'</title>', false);
        $response->assertSee('<link rel="canonical" href="'.Seo::url('/').'">', false);
        $response->assertSee('<meta property="og:title"', false);
        // The product is a link in the HTML itself, before any script runs
        $response->assertSee('href="'.$this->iphone->url.'"', false);
        $response->assertDontSee('name="keywords"', false);

        $schema = $this->schema($response);
        $this->assertSame(config('store.name'), $schema['ElectronicsStore']['name']);
        $this->assertSame('Ikeja', $schema['ElectronicsStore']['address']['addressLocality']);
        $this->assertSame('NG', $schema['ElectronicsStore']['address']['addressCountry']);
        $this->assertSame('09:00', $schema['ElectronicsStore']['openingHoursSpecification'][0]['opens']);
        $this->assertSame(Seo::url($this->iphone->url), $schema['ItemList']['itemListElement'][0]['url']);
        $this->assertArrayHasKey('WebSite', $schema);
    }

    public function test_a_category_has_its_own_page_with_its_products_in_the_html(): void
    {
        $response = $this->get('/category/smartphones')->assertOk();

        $response->assertSee('<title>Buy Smartphones in Lagos, Nigeria | '.config('store.name').'</title>', false);
        $response->assertSee('<link rel="canonical" href="'.Seo::url('/category/smartphones').'">', false);
        $response->assertSee('<h1', false)->assertSee('Smartphones');
        $response->assertSee('href="'.$this->iphone->url.'"', false);
        $response->assertSee('1 product in Smartphones, from ₦1,750,000');

        $schema = $this->schema($response);
        $this->assertSame(['Home', 'Smartphones'], array_column($schema['BreadcrumbList']['itemListElement'], 'name'));
        $this->assertCount(1, $schema['ItemList']['itemListElement']);

        $this->get('/category/no-such-category')->assertNotFound();
    }

    public function test_an_empty_category_and_a_page_past_the_end_stay_out_of_search(): void
    {
        $this->get('/category/drones')->assertOk()
            ->assertSee('<meta name="robots" content="noindex, follow">', false)
            ->assertDontSee('rel="canonical"', false);

        // Page 1 has one address, and there is no page 2 of one product
        $this->get('/category/smartphones?page=1')->assertRedirect('/category/smartphones')->assertStatus(301);
        $this->get('/category/smartphones?page=2')->assertNotFound();
        $this->get('/products?page=abc')->assertRedirect('/products')->assertStatus(301);
    }

    public function test_later_pages_of_a_listing_have_their_own_address(): void
    {
        foreach (range(1, 31) as $number) {
            Product::create(['product_name' => "Phone {$number}", 'category_id' => $this->phones->id, 'price' => 1000 * $number, 'stock_quantity' => 1]);
        }

        // 32 products, 30 to a page
        $first = $this->get('/products')->assertOk();
        $first->assertSee('href="/products?page=2"', false);

        $second = $this->get('/products?page=2')->assertOk();
        $second->assertSee('<link rel="canonical" href="'.Seo::url('/products').'?page=2">', false);
        $second->assertSee(', Page 2');
        $this->assertCount(2, $this->schema($second)['ItemList']['itemListElement']);
    }

    public function test_old_listing_addresses_lead_to_the_new_ones(): void
    {
        $this->get('/search?category_id='.$this->phones->id)->assertRedirect('/category/smartphones')->assertStatus(301);
        $this->get('/search')->assertRedirect('/products')->assertStatus(301);
    }

    public function test_search_results_cart_and_checkout_stay_out_of_search(): void
    {
        foreach (['/search?q=iphone', '/cart', '/checkout', '/checkout/success'] as $path) {
            $this->get($path)->assertOk()
                ->assertSee('<meta name="robots" content="noindex, follow">', false)
                ->assertDontSee('rel="canonical"', false);
        }
    }

    public function test_a_product_page_is_printed_in_full_and_described_for_search(): void
    {
        $response = $this->get($this->iphone->url)->assertOk();

        $response->assertSee('<title>Apple iPhone 17 Pro Price in Nigeria | '.config('store.name').'</title>', false);
        $response->assertDontSee('Laravel</title>', false);
        $response->assertSee('<link rel="canonical" href="'.Seo::url($this->iphone->url).'">', false);
        $response->assertSee('<meta property="og:type" content="product">', false);
        $response->assertSee('Buy Apple iPhone 17 Pro (UK used) for ₦1,750,000 at '.config('store.name'));

        // The page itself: name, price, description and the way back to its category
        $response->assertSee('Apple iPhone 17 Pro</h1>', false);
        $response->assertSee('₦1,750,000');
        $response->assertSee('The iPhone 17 Pro has the same chip and camera system');
        $response->assertSee('href="/category/smartphones"', false);

        $schema = $this->schema($response);
        $product = $schema['Product'];
        $this->assertSame('Apple iPhone 17 Pro', $product['name']);
        $this->assertSame('Apple', $product['brand']['name']);
        $this->assertSame([Seo::url('/images/products/demo/iphone-17-pro.jpg')], $product['image']);
        $this->assertSame('1750000.00', $product['offers']['price']);
        $this->assertSame('NGN', $product['offers']['priceCurrency']);
        $this->assertSame('https://schema.org/InStock', $product['offers']['availability']);
        $this->assertSame('https://schema.org/UsedCondition', $product['offers']['itemCondition']);
        $this->assertSame(config('store.name'), $product['offers']['seller']['name']);
        // Nothing the shop has not published
        $this->assertArrayNotHasKey('aggregateRating', $product);
        $this->assertArrayNotHasKey('review', $product);

        $this->assertSame(['Home', 'Smartphones', 'Apple iPhone 17 Pro'], array_column($schema['BreadcrumbList']['itemListElement'], 'name'));
    }

    public function test_search_engines_are_told_the_price_the_page_shows(): void
    {
        Promotion::create([
            'type' => 'deal_of_day', 'product_id' => $this->iphone->id, 'price' => 1600000,
            'starts_at' => now()->subHour(), 'ends_at' => now()->addDay(), 'is_active' => true,
        ]);

        $offer = $this->schema($this->get($this->iphone->url)->assertOk())['Product']['offers'];

        $this->assertSame('1600000.00', $offer['price']);
        $this->assertSame(now()->addDay()->toDateString(), $offer['priceValidUntil']);

        // Out of stock is said as plainly as the price
        $this->iphone->update(['stock_quantity' => 0]);
        cache()->flush();
        $this->assertSame(
            'https://schema.org/OutOfStock',
            $this->schema($this->get($this->iphone->fresh()->url))['Product']['offers']['availability'],
        );
    }

    public function test_a_bundle_page_is_printed_and_described_for_search(): void
    {
        $bundle = Bundle::create(['name' => 'Apple starter set', 'description' => 'An iPhone and more.', 'price' => 1700000, 'is_active' => true]);
        $bundle->items()->create(['product_id' => $this->iphone->id, 'quantity' => 1, 'position' => 0]);

        $response = $this->get('/bundle/'.$bundle->slug)->assertOk();

        $response->assertSee('<title>Apple starter set Bundle Deal | '.config('store.name').'</title>', false);
        $response->assertSee('<link rel="canonical" href="'.Seo::url('/bundle/'.$bundle->slug).'">', false);
        $response->assertSee('Apple starter set</h1>', false);
        $response->assertSee('href="'.$this->iphone->url.'"', false);

        $product = $this->schema($response)['Product'];
        $this->assertSame('1700000.00', $product['offers']['price']);
        $this->assertSame('https://schema.org/InStock', $product['offers']['availability']);
        $this->assertSame(Seo::url($this->iphone->url), $product['isRelatedTo'][0]['url']);
    }

    public function test_the_about_page_states_the_shop_and_answers_common_questions(): void
    {
        $response = $this->get('/about')->assertOk();

        $response->assertSee(config('store.address.line'));
        $response->assertSee(config('store.phone_display'));

        $schema = $this->schema($response);
        $this->assertArrayHasKey('ElectronicsStore', $schema);

        // Every answer in the data is on the page, word for word
        foreach ($schema['FAQPage']['mainEntity'] as $question) {
            $response->assertSee($question['name']);
            $response->assertSee($question['acceptedAnswer']['text']);
        }
    }

    public function test_a_missing_page_answers_404_with_a_way_back(): void
    {
        $this->get('/no-such-page')->assertNotFound()
            ->assertSee('We could not find that page')
            ->assertSee('<meta name="robots" content="noindex, follow">', false)
            ->assertSee('href="/category/smartphones"', false);
    }

    public function test_the_admin_area_and_the_api_are_marked_noindex(): void
    {
        $this->get('/admin/login')->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        $this->get('/api/categories')->assertHeader('X-Robots-Tag', 'noindex, nofollow');
        $this->get('/')->assertHeaderMissing('X-Robots-Tag');
    }

    public function test_llms_txt_tells_ai_assistants_what_the_shop_is(): void
    {
        $text = $this->get('/llms.txt')->assertOk()->getContent();

        $this->assertStringStartsWith('# '.config('store.name'), $text);
        $this->assertStringContainsString(config('store.address.line'), $text);
        $this->assertStringContainsString('[Smartphones]('.Seo::url('/category/smartphones').')', $text);
    }

    public function test_titles_and_descriptions_fit_what_a_search_result_shows(): void
    {
        $this->assertSame('Laptops | '.config('store.name'), Seo::title('Laptops'));
        // The shop's name gives way before the page's own words do
        $this->assertSame('Buy Gaming Consoles & Games in Lagos, Nigeria | Murphylog', Seo::title('Buy Gaming Consoles & Games in Lagos, Nigeria'));
        $this->assertSame('Sony DualSense Wireless Controller Price in Nigeria', Seo::title('Sony DualSense Wireless Controller Price in Nigeria'));

        $long = Seo::clip(str_repeat('A fast laptop with a bright display and a long battery life and ', 6));
        $this->assertLessThanOrEqual(158, mb_strlen($long));
        $this->assertDoesNotMatchRegularExpression('/\b(and|with|a)$/', $long);

        $this->assertLessThanOrEqual(60, mb_strlen(config('store.seo.home_title')));
        $this->assertLessThanOrEqual(160, mb_strlen(config('store.seo.description')));
    }
}
