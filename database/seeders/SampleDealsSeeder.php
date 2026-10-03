<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Deal;
use Illuminate\Database\Seeder;

/**
 * Sample flash deals for demos: real products, written descriptions, the stand-in photos
 * in images/products/demo. Prices are placeholders to be replaced with the shop's own.
 *
 *   php artisan db:seed --class=SampleDealsSeeder
 *
 * Safe to run again: a deal whose name is already there is left alone.
 */
class SampleDealsSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()->pluck('id', 'name');
        $added = 0;

        foreach ($this->deals() as $index => $deal) {
            if (Deal::where('product_name', $deal['product_name'])->exists()) {
                continue;
            }

            $category = $deal['category'];
            unset($deal['category']);

            Deal::create($deal + [
                'category_id' => isset($categories[$category]) ? (string) $categories[$category] : null,
                'in_stock' => true,
                // A minute apart, so they keep this order wherever deals are listed newest first
                'created_at' => now()->subMinutes($index),
                'updated_at' => now(),
            ]);
            $added++;
        }

        $this->command?->info("Sample deals added: {$added}");
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function deals(): array
    {
        $photo = fn (string $file) => '/images/products/demo/' . $file;

        return [
            [
                'product_name' => 'Apple iPhone 17 Pro Max',
                'category' => 'Smartphones',
                'price' => 2050000,
                'old_price' => 2250000,
                'product_status' => 'new',
                'overview' => 'Apple\'s largest iPhone: a 6.9 inch 120Hz display, the A19 Pro chip and three 48MP rear cameras.',
                'description' => "The iPhone 17 Pro Max is the one to pick if you want the biggest screen and the longest battery life Apple makes. The 6.9 inch Super Retina XDR display runs at up to 120Hz, so scrolling and games look smooth, and it stays readable in direct sunlight.\n\nAll three rear cameras are 48MP, including the telephoto, which reaches 8x optical-quality zoom. The 18MP front camera keeps everyone in frame on video calls and lets you take landscape selfies without turning the phone.\n\nThe A19 Pro chip handles 4K video editing and console-class games without slowing down, and the phone charges over USB-C like the rest of your devices.",
                'about' => '6.9 inch Super Retina XDR display with ProMotion up to 120Hz. A19 Pro chip. Three 48MP rear cameras with up to 8x optical-quality zoom. 18MP Center Stage front camera. USB-C charging and fast data transfer. Works with MagSafe chargers and cases.',
                'images_url' => [$photo('iphone-17-pro-max-orange.jpg'), $photo('iphone-17-pro-max-blue.jpg'), $photo('iphone-17-pro-max-silver.jpg')],
                'colors' => ['Cosmic Orange', 'Deep Blue', 'Silver'],
                'storage_options' => [['storage' => '256GB', 'price' => 2050000], ['storage' => '512GB', 'price' => 2400000]],
                'what_is_included' => ['iPhone 17 Pro Max', 'USB-C charge cable'],
                'specification' => [
                    'Display' => '6.9 inch Super Retina XDR, up to 120Hz',
                    'Chip' => 'Apple A19 Pro',
                    'Rear cameras' => '48MP main, 48MP ultra wide, 48MP telephoto',
                    'Front camera' => '18MP Center Stage',
                    'Connector' => 'USB-C',
                    'SIM' => 'Check with us for the SIM version in stock',
                ],
            ],
            [
                'product_name' => 'Samsung Galaxy S25 Ultra',
                'category' => 'Smartphones',
                'price' => 1520000,
                'old_price' => 1750000,
                'product_status' => 'new',
                'overview' => 'Samsung\'s top phone: a 200MP camera, a built-in S Pen and a 6.9 inch display in a titanium frame.',
                'description' => "The Galaxy S25 Ultra is built for people who use their phone for everything. The 6.9 inch Dynamic AMOLED display is sharp and bright, with an anti-glare coating that makes it easy to read outdoors, and the S Pen slides out of the body for notes, signatures and precise photo edits.\n\nThe 200MP main camera captures enough detail to crop in heavily after the shot. It is joined by a 50MP ultra wide and two telephoto cameras, so you can go from a group photo to a stage across the hall without moving.\n\nInside, the Snapdragon 8 Elite for Galaxy and 12GB of memory keep heavy apps and games running smoothly, and the 5000mAh battery comfortably lasts a full day.",
                'about' => '6.9 inch QHD+ Dynamic AMOLED 2X display at 120Hz. 200MP main camera with 50MP ultra wide, 5x and 3x telephoto. Snapdragon 8 Elite for Galaxy with 12GB memory. 5000mAh battery with 45W fast charging. S Pen built in. Titanium frame.',
                'images_url' => [$photo('galaxy-s25-ultra.jpg'), $photo('galaxy-s25-lineup.png')],
                'colors' => ['Titanium Silverblue', 'Titanium Black', 'Titanium Gray'],
                'storage_options' => [['storage' => '256GB', 'price' => 1520000], ['storage' => '512GB', 'price' => 1720000]],
                'what_is_included' => ['Galaxy S25 Ultra', 'S Pen', 'USB-C cable', 'SIM ejector pin'],
                'specification' => [
                    'Display' => '6.9 inch QHD+ Dynamic AMOLED 2X, 120Hz',
                    'Processor' => 'Snapdragon 8 Elite for Galaxy',
                    'Memory' => '12GB',
                    'Rear cameras' => '200MP main, 50MP ultra wide, 50MP 5x telephoto, 10MP 3x telephoto',
                    'Battery' => '5000mAh, 45W wired charging',
                    'Stylus' => 'S Pen included',
                ],
            ],
            [
                'product_name' => 'Sony PlayStation 5 Console (Disc Edition)',
                'category' => 'Gaming Consoles',
                'price' => 669000,
                'old_price' => 750000,
                'product_status' => 'new',
                'overview' => '4K gaming with fast loading, a disc drive for games and films, and the DualSense wireless controller.',
                'description' => "The PlayStation 5 loads games in seconds thanks to its built-in SSD, and plays them in 4K with ray-traced lighting on supported titles. If your TV supports it, many games run at up to 120 frames per second.\n\nThis is the Disc Edition, so you can buy and sell physical games, play your PS4 discs and watch 4K Ultra HD Blu-ray films. The DualSense controller adds haptic feedback and adaptive triggers: you feel the tension of a bowstring or the surface you are driving on.\n\nIt is ready to play out of the box. Connect it to your TV with the HDMI cable included, sign in, and start.",
                'about' => '4K gaming at up to 120 frames per second on supported TVs. Built-in SSD for near-instant loading. Ultra HD Blu-ray disc drive. DualSense controller with haptic feedback and adaptive triggers. Plays PS4 games. 3D audio with compatible headphones.',
                'images_url' => [$photo('ps5.png'), $photo('ps5-setup.jpg'), $photo('dualsense.png')],
                'colors' => ['White'],
                'what_is_included' => ['PlayStation 5 console', 'DualSense wireless controller', 'HDMI cable', 'Power cable', 'USB charging cable', 'Console stand'],
                'specification' => [
                    'Storage' => '825GB SSD',
                    'Resolution' => 'Up to 4K, HDR',
                    'Disc drive' => '4K Ultra HD Blu-ray',
                    'Controller' => '1 DualSense wireless controller',
                    'Video output' => 'HDMI 2.1',
                ],
            ],
            [
                'product_name' => 'Apple MacBook Air 13 inch (M2)',
                'category' => 'Laptops',
                'price' => 1290000,
                'old_price' => 1450000,
                'product_status' => 'new',
                'overview' => 'A thin, silent laptop with a full day of battery life, for work, school and travel.',
                'description' => "The MacBook Air with the M2 chip is the laptop most people should buy. It weighs 1.24kg, has no fan, so it never makes a sound, and runs for up to 18 hours on a charge, which is enough to leave the charger at home.\n\nThe 13.6 inch Liquid Retina display is bright and colour-accurate, the keyboard is comfortable for long documents, and the 1080p camera makes you look clear on calls. MagSafe charging snaps on magnetically and leaves both Thunderbolt ports free.\n\nIt handles office work, browsing with many tabs, photo editing and light video editing with ease.",
                'about' => '13.6 inch Liquid Retina display. Apple M2 chip with 8-core CPU. 16GB memory and 256GB SSD. Up to 18 hours of battery life. 1080p FaceTime HD camera. MagSafe charging and two Thunderbolt ports. Fanless and silent. Weighs 1.24kg.',
                'images_url' => [$photo('macbook-air.jpg')],
                'colors' => ['Starlight', 'Midnight', 'Silver', 'Space Grey'],
                'what_is_included' => ['MacBook Air', 'USB-C power adapter', 'USB-C to MagSafe 3 cable'],
                'specification' => [
                    'Display' => '13.6 inch Liquid Retina',
                    'Chip' => 'Apple M2',
                    'Memory' => '16GB',
                    'Storage' => '256GB SSD',
                    'Battery' => 'Up to 18 hours',
                    'Ports' => 'MagSafe 3, two Thunderbolt, headphone jack',
                    'Weight' => '1.24kg',
                ],
            ],
            [
                'product_name' => 'Apple AirPods Pro (2nd generation) with USB-C',
                'category' => 'Headphones',
                'price' => 349000,
                'old_price' => 420000,
                'product_status' => 'new',
                'overview' => 'Wireless earbuds with active noise cancellation, a clear transparency mode and a USB-C charging case.',
                'description' => "AirPods Pro block out the generator next door, the traffic and the open office, and let the world back in when you need to hear it. Adaptive Audio blends the two by itself, lowering loud sounds around you while keeping voices clear.\n\nThey pair with an iPhone the moment you open the case and switch between your Apple devices on their own. You get up to 6 hours of listening on one charge and up to 30 hours with the case, which charges by USB-C, MagSafe or an Apple Watch charger.\n\nFour sizes of silicone tips are included, so they sit securely in most ears, and they are rated IP54 against sweat and dust.",
                'about' => 'Active noise cancellation and transparency mode. Adaptive Audio adjusts to your surroundings. Up to 6 hours per charge, up to 30 hours with the case. USB-C and MagSafe charging case with a built-in speaker for Find My. IP54 sweat and dust resistance. Four sizes of ear tips included.',
                'images_url' => [$photo('airpods-pro.jpg')],
                'colors' => ['White'],
                'what_is_included' => ['AirPods Pro', 'MagSafe charging case (USB-C)', 'Silicone ear tips in four sizes', 'USB-C charge cable'],
                'specification' => [
                    'Chip' => 'Apple H2',
                    'Noise control' => 'Active noise cancellation, transparency, Adaptive Audio',
                    'Battery' => 'Up to 6 hours, up to 30 hours with case',
                    'Charging' => 'USB-C, MagSafe, Apple Watch charger',
                    'Resistance' => 'IP54 (earbuds and case)',
                ],
            ],
            [
                'product_name' => 'Microsoft Xbox Series S 512GB',
                'category' => 'Gaming Consoles',
                'price' => 489000,
                'old_price' => 560000,
                'product_status' => 'new',
                'overview' => 'The smallest Xbox: all-digital next-generation gaming at up to 120 frames per second.',
                'description' => "The Xbox Series S is the most affordable way into current-generation gaming. It is small enough to fit on any shelf, loads games quickly from its 512GB SSD and plays them at up to 1440p and 120 frames per second.\n\nThere is no disc drive: you download games from the Microsoft Store or play a large library with Xbox Game Pass. Quick Resume lets you switch between several games and pick each one up exactly where you left off.\n\nThe wireless controller is included, along with the HDMI cable, so it is ready to play as soon as it is connected to your TV and the internet.",
                'about' => 'All-digital console, no disc drive. 512GB custom SSD for fast loading. Up to 1440p resolution and 120 frames per second. Quick Resume switches between games. Works with Xbox Game Pass. Xbox Wireless Controller included.',
                'images_url' => [$photo('xbox-series-s.jpg'), $photo('xbox-series-s-2.jpg')],
                'colors' => ['Robot White'],
                'what_is_included' => ['Xbox Series S console', 'Xbox Wireless Controller', 'HDMI cable', 'Power cable', '2 AA batteries'],
                'specification' => [
                    'Storage' => '512GB SSD',
                    'Resolution' => 'Up to 1440p',
                    'Frame rate' => 'Up to 120 frames per second',
                    'Disc drive' => 'None (digital only)',
                    'Video output' => 'HDMI 2.1',
                ],
            ],
            [
                'product_name' => 'Apple Watch Ultra 2',
                'category' => 'Accessories',
                'price' => 1180000,
                'old_price' => 1350000,
                'product_status' => 'new',
                'overview' => 'Apple\'s toughest watch: a 49mm titanium case, the brightest Apple Watch display and multi-day battery life.',
                'description' => "The Apple Watch Ultra 2 is made for long days and hard use. The 49mm titanium case and flat sapphire crystal shrug off knocks, it is water resistant to 100 metres, and the display reaches 3000 nits, so it is readable under the midday sun.\n\nThe battery lasts up to 36 hours of normal use and up to 72 hours in Low Power Mode. Dual-frequency GPS tracks runs and rides accurately between tall buildings, and the orange Action button starts a workout, a stopwatch or the torch with one press.\n\nIt also does everything an Apple Watch does: calls and messages from your wrist, heart rate and sleep tracking, and Apple Pay where it is supported.",
                'about' => '49mm titanium case with sapphire crystal. Display up to 3000 nits. Up to 36 hours of battery, 72 hours in Low Power Mode. Water resistant to 100 metres. Precision dual-frequency GPS. Customisable Action button. Heart rate, sleep and workout tracking.',
                'images_url' => [$photo('apple-watch-ultra.jpg'), $photo('apple-watch-wrist.jpg')],
                'colors' => ['Natural Titanium', 'Black Titanium'],
                'what_is_included' => ['Apple Watch Ultra 2', 'Band', 'Magnetic fast charger to USB-C cable'],
                'specification' => [
                    'Case' => '49mm titanium',
                    'Display' => 'Always-On Retina, up to 3000 nits',
                    'Battery' => 'Up to 36 hours, up to 72 hours in Low Power Mode',
                    'Water resistance' => '100 metres',
                    'Location' => 'Precision dual-frequency GPS',
                    'Works with' => 'iPhone',
                ],
            ],
            [
                'product_name' => 'Nintendo Switch Console',
                'category' => 'Gaming Consoles',
                'price' => 270000,
                'old_price' => 320000,
                'product_status' => 'uk_used',
                'overview' => 'Play on the TV or take it with you. UK used and in clean working condition.',
                'description' => "The Nintendo Switch is three consoles in one. Put it in the dock to play on the TV, stand it on a table and hand a Joy-Con to a friend, or hold it like a handheld on the road. It is the home of Mario Kart, Zelda, Super Smash Bros and a long list of family-friendly games.\n\nThis unit is UK used. It has been cleaned and tested, and it comes with the dock and both Joy-Con controllers, so two people can play straight away.\n\nStorage is 32GB and can be expanded with a microSD card.",
                'about' => 'Plays on the TV, on a table or handheld. 6.2 inch touchscreen. Two Joy-Con controllers for two players out of the box. 32GB storage, expandable with microSD. Large library of family-friendly games. UK used, cleaned and tested.',
                'images_url' => [$photo('nintendo-switch.jpg')],
                'colors' => ['Neon Red and Neon Blue'],
                'what_is_included' => ['Nintendo Switch console', 'Dock', 'Left and right Joy-Con', 'Joy-Con grip', 'HDMI cable', 'Power adapter'],
                'specification' => [
                    'Screen' => '6.2 inch LCD touchscreen',
                    'Storage' => '32GB, microSD slot',
                    'Play modes' => 'TV, tabletop, handheld',
                    'Controllers' => '2 Joy-Con',
                    'Condition' => 'UK used',
                ],
            ],
        ];
    }
}
