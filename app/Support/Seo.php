<?php

declare(strict_types=1);

namespace App\Support;

use App\Helpers\Money;
use App\Models\Category;
use App\Models\Deal;
use App\Models\Product;
use App\Services\Offers;
use Illuminate\Support\Str;

/**
 * What search engines and link previews read: titles, descriptions, canonical addresses
 * and the schema.org data of each kind of page. Everything stated here is taken from the
 * product, the category or config/store.php. Nothing is made up: no ratings, no reviews,
 * no policies the shop has not published.
 */
final class Seo
{
    private const TITLE_LIMIT = 60;

    private const DESCRIPTION_LIMIT = 158;

    /** Makers the shop sells, for products saved without a brand. Matched at the start of the name. */
    private const BRANDS = [
        'Apple', 'Samsung', 'Sony', 'HP', 'Dell', 'Lenovo', 'Asus', 'Acer', 'Microsoft', 'Google', 'Huawei', 'Xiaomi',
        'Tecno', 'Infinix', 'itel', 'Nokia', 'Oppo', 'Vivo', 'Realme', 'OnePlus', 'Nintendo', 'Valve', 'Logitech',
        'JBL', 'Bose', 'Anker', 'Oraimo', 'Canon', 'Nikon', 'LG', 'Toshiba', 'MSI', 'Razer', 'Beats', 'Amazon',
    ];

    /** Names that are a product line, not a maker */
    private const BRAND_OF_LINE = [
        'iphone' => 'Apple', 'ipad' => 'Apple', 'macbook' => 'Apple', 'imac' => 'Apple', 'airpods' => 'Apple',
        'galaxy' => 'Samsung', 'playstation' => 'Sony', 'ps5' => 'Sony', 'ps4' => 'Sony', 'xbox' => 'Microsoft',
        'surface' => 'Microsoft', 'pixel' => 'Google', 'thinkpad' => 'Lenovo',
    ];

    public static function storeName(): string
    {
        return (string) config('store.name');
    }

    /**
     * "Laptops in Lagos | Murphylog Global", shortened to "| Murphylog" and then to no
     * suffix at all when the full name would push the title past what a result shows.
     */
    public static function title(string $page): string
    {
        $page = self::clean($page);

        foreach ([' | '.self::storeName(), ' | '.Str::before(self::storeName(), ' ')] as $suffix) {
            if (mb_strlen($page.$suffix) <= self::TITLE_LIMIT) {
                return $page.$suffix;
            }
        }

        return $page;
    }

    /** One line of plain text, cut at a word with no trailing dots. */
    public static function clip(?string $text, int $limit = self::DESCRIPTION_LIMIT): string
    {
        $text = self::clean($text);
        if (mb_strlen($text) <= $limit) {
            return $text;
        }

        $cut = mb_substr($text, 0, $limit);
        $space = mb_strrpos($cut, ' ');
        $cut = rtrim($space !== false ? mb_substr($cut, 0, $space) : $cut, " \t,;:.-");

        // Not left hanging on "and" or "with"
        return (string) preg_replace('/(?:[\s,]+(?:and|or|with|the|a|an|of|to|in|for|on|at|by|that|which))+$/iu', '', $cut);
    }

    /**
     * The one address of a page, on the site's own host (config/store.php 'url'). A page reached
     * on another host, or with tracking parameters, still names this address as the original.
     */
    public static function url(string $path = '/'): string
    {
        return rtrim((string) config('store.url'), '/').'/'.ltrim($path, '/');
    }

    public static function image(?string $source): ?string
    {
        if ($source === null || trim($source) === '') {
            return null;
        }

        return Str::startsWith($source, ['http://', 'https://']) ? $source : self::url($source);
    }

    /** The picture a shared link shows when the page has none of its own, if the file is there. */
    public static function defaultImage(): ?string
    {
        $path = (string) config('store.seo.image');

        return $path !== '' && is_file(public_path(ltrim($path, '/'))) ? self::url($path) : null;
    }

    /**
     * The path of a product's page. The address itself belongs to ProductUrls (slugs with no
     * id once its table exists); every canonical link, card and sitemap entry asks here.
     */
    public static function productPath(Product|Deal $product): string
    {
        return ProductUrls::shared()->path($product)
            ?? '/product/'.$product->id.'/'.Str::slug((string) $product->product_name);
    }

    public static function categoryPath(Category $category): string
    {
        return '/category/'.$category->slug;
    }

    public static function productTitle(Product|Deal $product): string
    {
        return self::title($product->product_name.' Price in Nigeria');
    }

    /**
     * What it is, its condition, its price and where to get it, then as much of the product's
     * own overview as fits.
     */
    public static function productDescription(Product|Deal $product): string
    {
        $lead = sprintf(
            'Buy %s (%s) for %s at %s, Ikeja, Lagos.',
            $product->product_name,
            self::conditionLabel($product->product_status),
            Money::naira(self::price($product)),
            self::storeName(),
        );

        $overview = self::clean($product->overview ?: $product->description);
        $room = self::DESCRIPTION_LIMIT - mb_strlen($lead) - 1;

        // An overview cut to a few words reads worse than the delivery line
        if ($overview !== '' && $room >= 40) {
            return $lead.' '.self::clip($overview, $room);
        }

        return self::clip($lead.' Store pickup or delivery to every state in Nigeria.');
    }

    /**
     * The price the page shows right now: a running deal of the day or drop when there is one
     * on the product's default size, else its usual price. What search engines are told must
     * be what a visitor sees.
     */
    public static function price(Product|Deal $product): float
    {
        return self::offer($product)['price'];
    }

    /**
     * @return array{price: float, until: \Carbon\CarbonInterface|null}
     */
    public static function offer(Product|Deal $product): array
    {
        static $known;
        $known ??= new \WeakMap;

        if (! isset($known[$product])) {
            $promotion = $product instanceof Product && $product->exists
                ? app(Offers::class)->liveFor($product, $product->default_storage)
                : null;

            $known[$product] = [
                'price' => (float) ($promotion?->price ?? $product->display_price ?? $product->price),
                'until' => $promotion?->ends_at,
            ];
        }

        return $known[$product];
    }

    public static function conditionLabel(?string $status): string
    {
        return match ($status) {
            'uk_used' => 'UK used',
            'refurbished' => 'refurbished',
            default => 'brand new',
        };
    }

    /** The maker of a product: the saved brand, else a known maker or product line its name starts with. */
    public static function brand(Product|Deal $product): ?string
    {
        $saved = trim((string) ($product->brand ?? ''));
        if ($saved !== '') {
            return $saved;
        }

        $name = trim((string) $product->product_name);
        foreach (self::BRANDS as $brand) {
            if (stripos($name, $brand.' ') === 0) {
                return $brand;
            }
        }

        return self::BRAND_OF_LINE[strtolower(Str::before($name, ' '))] ?? null;
    }

    /**
     * The shop itself, as a local electronics store.
     *
     * @return array<string, mixed>
     */
    public static function store(): array
    {
        $opening = (array) config('store.opening');

        return array_filter([
            '@type' => 'ElectronicsStore',
            '@id' => self::url('/').'#store',
            'name' => self::storeName(),
            'legalName' => config('store.legal_name'),
            'url' => self::url('/'),
            'image' => self::defaultImage(),
            'description' => config('store.seo.description'),
            'telephone' => config('store.phone'),
            'email' => config('store.email'),
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => config('store.address.line'),
                'addressLocality' => config('store.address.locality'),
                'addressRegion' => config('store.address.region'),
                'addressCountry' => config('store.address.country'),
            ],
            'openingHoursSpecification' => empty($opening['days']) ? null : [[
                '@type' => 'OpeningHoursSpecification',
                'dayOfWeek' => $opening['days'],
                'opens' => $opening['opens'] ?? null,
                'closes' => $opening['closes'] ?? null,
            ]],
            'areaServed' => ['@type' => 'Country', 'name' => 'Nigeria'],
            'currenciesAccepted' => 'NGN',
            'paymentAccepted' => 'Bank transfer',
            // Profile addresses without the tracking part a share link carries
            'sameAs' => collect((array) config('store.social'))->map(fn ($url) => Str::before((string) $url, '?'))->values()->all(),
        ]);
    }

    /**
     * The shop as the seller of an offer: enough to stand on its own on a product page, and
     * the same @id as the full entry on the home page.
     *
     * @return array<string, mixed>
     */
    public static function seller(): array
    {
        return ['@type' => 'ElectronicsStore', '@id' => self::url('/').'#store', 'name' => self::storeName(), 'url' => self::url('/')];
    }

    /**
     * @return array<string, mixed>
     */
    public static function website(): array
    {
        return [
            '@type' => 'WebSite',
            '@id' => self::url('/').'#website',
            'name' => self::storeName(),
            'url' => self::url('/'),
            'inLanguage' => 'en-NG',
            'publisher' => ['@id' => self::url('/').'#store'],
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => ['@type' => 'EntryPoint', 'urlTemplate' => self::url('/search').'?q={search_term_string}'],
                'query-input' => 'required name=search_term_string',
            ],
        ];
    }

    /**
     * A product or a flash deal, with the price and stock shown on its page.
     *
     * @return array<string, mixed>
     */
    public static function product(Product|Deal $product): array
    {
        $url = self::url(self::productPath($product));
        $brand = self::brand($product);
        $images = collect((array) $product->images_url)->map(fn ($image) => self::image((string) $image))->filter()->values()->all();

        $properties = [];
        foreach ((array) ($product->specification ?? []) as $name => $value) {
            // Grouped specifications are listed one level down
            foreach (is_array($value) && ! array_is_list($value) ? $value : [$name => $value] as $key => $item) {
                $text = is_array($item) ? implode(', ', array_filter($item, 'is_scalar')) : (string) $item;
                if ($text !== '') {
                    $properties[] = ['@type' => 'PropertyValue', 'name' => Str::headline((string) $key), 'value' => $text];
                }
            }
        }

        return array_filter([
            '@type' => 'Product',
            '@id' => $url.'#product',
            'name' => $product->product_name,
            'description' => self::clip($product->overview ?: $product->description, 500),
            'image' => $images,
            'sku' => (string) ($product->sku ?: $product->id),
            'brand' => $brand ? ['@type' => 'Brand', 'name' => $brand] : null,
            'category' => $product->category?->name,
            'additionalProperty' => $properties,
            'offers' => array_filter([
                '@type' => 'Offer',
                'url' => $url,
                'price' => number_format(self::price($product), 2, '.', ''),
                'priceCurrency' => 'NGN',
                // A deal's price holds until the deal ends
                'priceValidUntil' => self::offer($product)['until']?->toDateString(),
                'availability' => 'https://schema.org/'.($product->in_stock ? 'InStock' : 'OutOfStock'),
                'itemCondition' => 'https://schema.org/'.match ($product->product_status) {
                    'uk_used' => 'UsedCondition',
                    'refurbished' => 'RefurbishedCondition',
                    default => 'NewCondition',
                },
                'seller' => self::seller(),
            ]),
        ]);
    }

    /**
     * A bundle, as one product sold at one price. $bundle is what Offers::presentBundle() returns.
     *
     * @param  array<string, mixed>  $bundle
     * @return array<string, mixed>
     */
    public static function bundle(array $bundle): array
    {
        $url = self::url((string) $bundle['url']);
        $items = collect($bundle['items'] ?? []);

        return array_filter([
            '@type' => 'Product',
            '@id' => $url.'#product',
            'name' => $bundle['name'],
            'description' => self::clip(($bundle['description'] ?? '') ?: self::bundleContents($bundle), 500),
            'image' => $items->map(fn ($item) => self::image($item['product']['image'] ?? null))->filter()->values()->all(),
            'sku' => 'BUNDLE-'.$bundle['id'],
            'category' => 'Bundles',
            'isRelatedTo' => $items->map(fn ($item) => array_filter([
                '@type' => 'Product',
                'name' => $item['product']['product_name'] ?? null,
                'url' => isset($item['product']['url']) ? self::url((string) $item['product']['url']) : null,
            ]))->values()->all(),
            'offers' => [
                '@type' => 'Offer',
                'url' => $url,
                'price' => number_format((float) $bundle['price'], 2, '.', ''),
                'priceCurrency' => 'NGN',
                'availability' => 'https://schema.org/'.(! empty($bundle['in_stock']) ? 'InStock' : 'OutOfStock'),
                'seller' => self::seller(),
            ],
        ]);
    }

    /**
     * "iPhone 17 Pro + iPad Pro + AirPods Max"
     *
     * @param  array<string, mixed>  $bundle
     */
    public static function bundleContents(array $bundle): string
    {
        return collect($bundle['items'] ?? [])
            ->map(fn ($item) => ($item['quantity'] > 1 ? $item['quantity'].' ' : '').($item['product']['product_name'] ?? 'Product'))
            ->implode(' + ');
    }

    /**
     * The path from the home page to this page. The last entry is the page itself.
     *
     * @param  list<array{0: string, 1: string}>  $trail  name and path of each step
     * @return array<string, mixed>
     */
    public static function breadcrumbs(array $trail): array
    {
        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => collect($trail)->values()->map(fn (array $step, int $index) => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $step[0],
                'item' => self::url($step[1]),
            ])->all(),
        ];
    }

    /**
     * The products listed on a page, in the order shown.
     *
     * @param  iterable<Product|Deal>  $products
     * @return array<string, mixed>
     */
    public static function itemList(iterable $products, string $name): array
    {
        return [
            '@type' => 'ItemList',
            'name' => $name,
            'itemListElement' => collect($products)->values()->map(fn ($product, int $index) => [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $product->product_name,
                'url' => self::url(self::productPath($product)),
            ])->all(),
        ];
    }

    /**
     * Questions and answers shown on the page, word for word.
     *
     * @param  list<array{question: string, answer: string}>  $questions
     * @return array<string, mixed>
     */
    public static function faq(array $questions): array
    {
        return [
            '@type' => 'FAQPage',
            'mainEntity' => collect($questions)->map(fn (array $item) => [
                '@type' => 'Question',
                'name' => $item['question'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $item['answer']],
            ])->all(),
        ];
    }

    /**
     * The JSON-LD of a page: its nodes in one graph, safe to print inside a script tag.
     *
     * @param  list<array<string, mixed>>  $nodes
     */
    public static function graph(array $nodes): string
    {
        return (string) json_encode(
            ['@context' => 'https://schema.org', '@graph' => array_values(array_filter($nodes))],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP,
        );
    }

    private static function clean(?string $text): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string) $text), ENT_QUOTES | ENT_HTML5)));
    }
}
