<?php

/*
|--------------------------------------------------------------------------
| Storefront details
|--------------------------------------------------------------------------
|
| Contact, pickup and payment details shown across the storefront. The
| Blade templates read them directly and the React components receive
| them through window.MurphylogStore (see partials/store-scripts).
|
*/

return [

    'name' => 'Murphylog Global',
    'legal_name' => 'Murphylog Global Concept',

    'phone' => '+2348024913553',
    'phone_display' => '0802 491 3553',

    'whatsapp' => '2348024913553',
    'whatsapp_display' => '+234 802 491 3553',

    'address' => [
        'line' => '12, Ola Ayeni Street',
        'area' => 'Ikeja, Lagos State, Nigeria',
        // The same address in parts, for search engines (App\Support\Seo)
        'locality' => 'Ikeja',
        'region' => 'Lagos',
        'country' => 'NG',
    ],

    'hours' => 'Mon to Sat, 9:00 AM to 6:30 PM',

    // The same hours in a form search engines read. Keep in step with 'hours'.
    'opening' => [
        'days' => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        'opens' => '09:00',
        'closes' => '18:30',
    ],

    // Shown on invoices and receipts
    'email' => 'info@murphylogglobal.com',
    'website' => 'murphylog.com.ng',

    // The address search engines are told is the site's own: every canonical link, the sitemap
    // and robots.txt are built on it. On the live site it is the real domain even if APP_URL
    // was left at its default; set STORE_URL to change it.
    'url' => env('STORE_URL', env('APP_ENV') === 'production' ? 'https://murphylog.com.ng' : env('APP_URL', 'http://localhost')),

    'delivery' => 'All states in Nigeria',

    'bank' => [
        'account_name' => 'Murphylog Global Concept',
        'bank_name' => 'Providus Bank',
        'account_number' => '5401799184',
    ],

    /*
    | What search engines and link previews show when a page does not set its own.
    | Titles stay under 60 characters and descriptions under 160, or they get cut off.
    */
    'seo' => [
        'home_title' => 'New & UK Used Laptops, Phones, Gadgets in Lagos | Murphylog',
        'description' => 'Shop brand new and UK used laptops, phones, tablets and gaming gadgets at Murphylog Global in Ikeja, Lagos. Store pickup or delivery to every state in Nigeria.',
        // Shown when a page is shared and has no photo of its own (1200 x 630)
        'image' => '/images/og-default.png',

        // Ownership codes from Google Search Console and Bing Webmaster Tools ("HTML tag" method).
        // Put only the code in .env, not the whole tag.
        'google_verification' => env('GOOGLE_SITE_VERIFICATION'),
        'bing_verification' => env('BING_SITE_VERIFICATION'),
    ],

    'social' => [
        'Instagram' => 'https://www.instagram.com/murphylog_gadgets?igsh=NGNmNXhoeTE0cmU0&utm_source=qr',
        'TikTok' => 'https://www.tiktok.com/@murphylog_gadgets',
    ],

];
