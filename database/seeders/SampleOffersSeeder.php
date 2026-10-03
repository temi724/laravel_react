<?php

namespace Database\Seeders;

use App\Enums\PromotionType;
use App\Models\Bundle;
use App\Models\Category;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Database\Seeder;

/**
 * Sample offers for demos: a handful of real products with stock, a deal of the day,
 * a drop that starts in two days, and two bundles (an Apple set and a Samsung set).
 * Prices are placeholders to be replaced with the shop's own.
 *
 *   php artisan db:seed --class=SampleOffersSeeder
 *
 * Safe to run again: products, bundles and offers that are already there are left alone.
 */
class SampleOffersSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()->pluck('id', 'name');
        $products = [];

        foreach ($this->products() as $key => $data) {
            $category = $data['category'];
            unset($data['category']);

            $products[$key] = Product::query()->where('name', $data['product_name'])->first()
                ?? Product::create($data + ['category_id' => (string) ($categories[$category] ?? $categories->first())]);
        }

        // Deal of the day: the controller, for the next 24 hours
        if (! Promotion::query()->current()->where('type', PromotionType::DealOfDay->value)->exists()) {
            Promotion::create([
                'type' => PromotionType::DealOfDay->value,
                'product_id' => $products['dualsense']->id,
                'price' => 79000,
                'starts_at' => now(),
                'ends_at' => now()->addDay(),
                'per_order_limit' => 2,
                'is_active' => true,
            ]);
        }

        // A drop: three Steam Decks, in two days
        if (! Promotion::query()->current()->where('type', PromotionType::Drop->value)->where('product_id', $products['steam_deck']->id)->exists()) {
            Promotion::create([
                'type' => PromotionType::Drop->value,
                'product_id' => $products['steam_deck']->id,
                'price' => 720000,
                'starts_at' => now()->addDays(2),
                'quantity_limit' => 3,
                'per_order_limit' => 1,
                'headline' => 'Steam Deck weekend drop',
                'is_active' => true,
            ]);
        }

        $this->bundle('Apple starter set', 'An iPhone, an iPad and headphones that pair with both the moment you open them. One Apple ID, one charger type, everything in sync.', 3790000, [
            [$products['iphone'], '256GB', 1],
            [$products['ipad'], null, 1],
            [$products['airpods_max'], null, 1],
        ]);

        $this->bundle('Samsung Galaxy set', 'Phone, tablet and watch that share calls, messages and notes. Start on one, carry on with another.', 2090000, [
            [$products['galaxy'], '256GB', 1],
            [$products['galaxy_tab'], null, 1],
            [$products['galaxy_watch'], null, 1],
        ]);

        $this->command?->info('Sample offers are in place.');
    }

    /**
     * @param  list<array{0: Product, 1: string|null, 2: int}>  $items
     */
    private function bundle(string $name, string $description, int $price, array $items): void
    {
        if (Bundle::where('name', $name)->exists()) {
            return;
        }

        $bundle = Bundle::create(['name' => $name, 'description' => $description, 'price' => $price, 'is_active' => true]);
        foreach ($items as $position => [$product, $storage, $quantity]) {
            $bundle->items()->create(['product_id' => $product->id, 'storage' => $storage, 'quantity' => $quantity, 'position' => $position]);
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function products(): array
    {
        $photo = fn (string $file) => '/images/products/demo/'.$file;

        return [
            'iphone' => [
                'product_name' => 'Apple iPhone 17 Pro',
                'category' => 'Smartphones',
                'price' => 1750000,
                'stock_quantity' => 8,
                'product_status' => 'new',
                'overview' => 'A 6.3 inch 120Hz display, the A19 Pro chip and three 48MP rear cameras in a size that fits one hand.',
                'description' => "The iPhone 17 Pro has the same chip and camera system as the Pro Max in a smaller body. The display runs at up to 120Hz and stays readable in bright sun.\n\nAll three rear cameras are 48MP, and the 18MP front camera keeps a group in frame without turning the phone.",
                'about' => '6.3 inch Super Retina XDR display with ProMotion. A19 Pro chip. Three 48MP rear cameras. 18MP Center Stage front camera. USB-C.',
                'images_url' => [$photo('iphone-17-pro.jpg')],
                'colors' => ['Cosmic Orange', 'Deep Blue', 'Silver'],
                'storage_options' => [['storage' => '256GB', 'price' => 1750000], ['storage' => '512GB', 'price' => 2050000]],
                'what_is_included' => ['iPhone 17 Pro', 'USB-C charge cable'],
            ],
            'ipad' => [
                'product_name' => 'Apple iPad Pro 11 inch (M4)',
                'category' => 'Tablets',
                'price' => 1450000,
                'stock_quantity' => 6,
                'product_status' => 'new',
                'overview' => 'Apple\'s thinnest iPad, with an OLED display and the M4 chip.',
                'description' => "The iPad Pro pairs a bright, high-contrast OLED display with the M4 chip, so it handles drawing, video editing and multitasking without slowing down.\n\nIt works with Apple Pencil Pro and the Magic Keyboard, both sold separately.",
                'about' => '11 inch Ultra Retina XDR OLED display. Apple M4 chip. Face ID. USB-C with Thunderbolt. Works with Apple Pencil Pro.',
                'images_url' => [$photo('ipad-pro.jpg'), $photo('ipad-pro-camera.jpg')],
                'colors' => ['Space Black', 'Silver'],
                'what_is_included' => ['iPad Pro', 'USB-C charge cable', 'USB-C power adapter'],
            ],
            'airpods_max' => [
                'product_name' => 'Apple AirPods Max',
                'category' => 'Headphones',
                'price' => 890000,
                'stock_quantity' => 5,
                'product_status' => 'new',
                'overview' => 'Over-ear headphones with active noise cancellation and up to 20 hours of listening.',
                'description' => "AirPods Max are Apple's over-ear headphones. Active noise cancellation shuts out engines and chatter, and transparency mode lets you hear what is around you when you need to.\n\nThey pair with an iPhone or iPad the moment you hold them near, and switch between your Apple devices on their own.",
                'about' => 'Active noise cancellation and transparency mode. Up to 20 hours of listening. Spatial audio. Knit mesh canopy and memory foam ear cushions. Smart Case included.',
                'images_url' => [$photo('airpods-max.jpg'), $photo('airpods-max-silver.jpg')],
                'colors' => ['Silver', 'Midnight'],
                'what_is_included' => ['AirPods Max', 'Smart Case', 'Charge cable'],
            ],
            'galaxy' => [
                'product_name' => 'Samsung Galaxy S24',
                'category' => 'Smartphones',
                'price' => 1150000,
                'stock_quantity' => 7,
                'product_status' => 'new',
                'overview' => 'A compact Galaxy flagship with a 6.2 inch 120Hz display and a 50MP camera.',
                'description' => "The Galaxy S24 fits a bright 6.2 inch Dynamic AMOLED display into a phone that is easy to use with one hand. The 50MP main camera is joined by an ultra wide and a 3x telephoto.\n\nGalaxy AI features such as Circle to Search and live call translation are built in.",
                'about' => '6.2 inch Dynamic AMOLED 2X display at 120Hz. 50MP main camera with ultra wide and 3x telephoto. 4000mAh battery. Galaxy AI features.',
                'images_url' => [$photo('galaxy-s24-ultra.png')],
                'colors' => ['Onyx Black', 'Marble Grey', 'Cobalt Violet'],
                'storage_options' => [['storage' => '256GB', 'price' => 1150000], ['storage' => '512GB', 'price' => 1320000]],
                'what_is_included' => ['Galaxy S24', 'USB-C cable', 'SIM ejector pin'],
            ],
            'galaxy_tab' => [
                'product_name' => 'Samsung Galaxy Tab S9',
                'category' => 'Tablets',
                'price' => 820000,
                'stock_quantity' => 5,
                'product_status' => 'new',
                'overview' => 'An 11 inch AMOLED tablet with the S Pen in the box and water resistance.',
                'description' => "The Galaxy Tab S9 has an 11 inch Dynamic AMOLED display and comes with the S Pen, so it is ready for notes and sketches out of the box.\n\nIt is rated IP68 against water and dust, which is rare for a tablet.",
                'about' => '11 inch Dynamic AMOLED 2X display at 120Hz. S Pen included. IP68 water and dust resistance. Snapdragon 8 Gen 2 for Galaxy.',
                'images_url' => [$photo('galaxy-tab.jpg')],
                'colors' => ['Graphite', 'Beige'],
                'what_is_included' => ['Galaxy Tab S9', 'S Pen', 'USB-C cable'],
            ],
            'galaxy_watch' => [
                'product_name' => 'Samsung Galaxy Watch 6',
                'category' => 'Accessories',
                'price' => 320000,
                'stock_quantity' => 9,
                'product_status' => 'new',
                'overview' => 'A slim smartwatch with sleep coaching, heart rate tracking and calls from the wrist.',
                'description' => "The Galaxy Watch 6 tracks sleep, heart rate and workouts, and shows calls and messages from your Galaxy phone on a bright round display.\n\nIt works best with a Samsung phone and also pairs with other Android phones.",
                'about' => 'Sleep coaching and heart rate tracking. Calls and messages from the wrist. Sapphire crystal display. Water resistant. Works with Android phones.',
                'images_url' => [$photo('galaxy-watch.jpg'), $photo('galaxy-watch-2.jpg')],
                'colors' => ['Graphite', 'Gold'],
                'what_is_included' => ['Galaxy Watch 6', 'Wireless charger'],
            ],
            'dualsense' => [
                'product_name' => 'Sony DualSense Wireless Controller',
                'category' => 'Gaming',
                'price' => 95000,
                'stock_quantity' => 12,
                'product_status' => 'new',
                'overview' => 'The PlayStation 5 controller, with haptic feedback and adaptive triggers.',
                'description' => "A second DualSense means two can play. Haptic feedback and adaptive triggers let you feel the surface you are driving on or the pull of a bowstring.\n\nIt charges over USB-C and has a built-in microphone and a headset jack.",
                'about' => 'Haptic feedback and adaptive triggers. Built-in microphone and headset jack. Charges over USB-C. Works with PlayStation 5 and PC.',
                'images_url' => [$photo('dualsense.png'), $photo('dualsense-front.jpg')],
                'colors' => ['White'],
                'what_is_included' => ['DualSense wireless controller'],
            ],
            'steam_deck' => [
                'product_name' => 'Valve Steam Deck',
                'category' => 'Gaming Consoles',
                'price' => 780000,
                'stock_quantity' => 4,
                'product_status' => 'new',
                'overview' => 'A handheld that plays your PC games library on the go.',
                'description' => "The Steam Deck is a handheld gaming PC. Sign in to Steam and your library is there, with thousands of games verified to run well on it.\n\nIt has full-size controls, two trackpads and a touchscreen, and it docks to a TV or monitor with a USB-C dock (sold separately).",
                'about' => 'Plays games from your Steam library. Full-size controls with two trackpads. 7 inch touchscreen. microSD slot for more storage. Docks to a TV over USB-C.',
                'images_url' => [$photo('steam-deck.jpg')],
                'colors' => ['Black'],
                'what_is_included' => ['Steam Deck', 'Carrying case', 'Power supply'],
            ],
        ];
    }
}
