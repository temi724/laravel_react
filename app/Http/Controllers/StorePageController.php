<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Bundle;
use App\Models\Deal;
use App\Models\Product;
use App\Services\Offers;
use App\Support\Seo;
use App\View\Composers\StoreNavigationComposer;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Response;

/**
 * Pages and files about the shop itself: who it is and how to reach it, and the files that
 * tell search engines and AI assistants what is on the site.
 */
final class StorePageController extends Controller
{
    public function about(): View
    {
        return view('about', ['questions' => $this->questions()]);
    }

    /**
     * Common questions, answered only with what the shop has published (config/store.php).
     *
     * @return list<array{question: string, answer: string}>
     */
    private function questions(): array
    {
        $store = config('store');
        $address = $store['address']['line'].', '.$store['address']['area'];

        return [
            [
                'question' => 'Where is '.$store['name'].' located?',
                'answer' => "The store is at {$address}. It is open {$store['hours']}.",
            ],
            [
                'question' => 'Do you deliver outside Lagos?',
                'answer' => 'Yes. Orders are delivered to all states in Nigeria, and you can also pick up your order at the store in Ikeja.',
            ],
            [
                'question' => 'How do I pay for an order?',
                'answer' => "Payment is by bank transfer to {$store['bank']['account_name']} at {$store['bank']['bank_name']}. The account details are shown at checkout. After paying, send your proof of payment on WhatsApp and the order is confirmed.",
            ],
            [
                'question' => 'Do you sell brand new or UK used gadgets?',
                'answer' => 'Both. Every product page states the condition of the item: brand new, UK used or refurbished.',
            ],
            [
                'question' => 'How do I contact the store?',
                'answer' => "Call {$store['phone_display']} or send a WhatsApp message to {$store['whatsapp_display']}.",
            ],
        ];
    }

    public function sitemap(Offers $offers): Response
    {
        $products = Product::query()->latest('updated_at')->get();
        $deals = Deal::query()->latest('updated_at')->get();

        // Only categories with something in them
        $listed = $products->pluck('category_id')->merge($deals->pluck('category_id'))->map(fn ($id) => (string) $id)->unique();
        $categories = StoreNavigationComposer::categories()->filter(fn ($category) => $listed->contains((string) $category->id));

        $latest = collect([$products->max('updated_at'), $deals->max('updated_at')])->filter()->max();

        return response()
            ->view('sitemap.index', [
                'products' => $products->concat($deals),
                'categories' => $categories,
                'bundles' => $offers->bundles(),
                'latest' => $latest,
            ])
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * Everything public may be crawled. The admin area is kept out. Cart, checkout and search
     * results are not blocked here: they carry "noindex" instead, which only works when read.
     */
    public function robots(): Response
    {
        $lines = [
            'User-agent: *',
            'Disallow: /admin',
            'Disallow: /api/admin/',
            '',
            'Sitemap: '.Seo::url('/sitemap.xml'),
        ];

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    /**
     * A plain-text guide to the site for AI assistants (llmstxt.org): what the shop is,
     * how buying works and where the main pages are.
     */
    public function llms(Offers $offers): Response
    {
        $store = config('store');
        $categories = StoreNavigationComposer::categories();
        $bundles = $offers->bundles();

        $lines = [
            '# '.$store['name'],
            '',
            '> '.$store['seo']['description'],
            '',
            '## The shop',
            '',
            "- Address: {$store['address']['line']}, {$store['address']['area']}",
            "- Opening hours: {$store['hours']}",
            "- Phone: {$store['phone_display']}",
            "- WhatsApp: {$store['whatsapp_display']}",
            "- Delivery: {$store['delivery']}, or pickup at the store",
            '- Payment: bank transfer, with the account details shown at checkout',
            '- Prices are in Nigerian naira (NGN) and are shown on every product page',
            '- Condition (brand new, UK used or refurbished) is shown on every product page',
            '',
            '## Main pages',
            '',
            '- [All products]('.Seo::url('/products').')',
            '- [About the shop, contact and common questions]('.Seo::url('/about').')',
            '- [Sitemap of every product]('.Seo::url('/sitemap.xml').')',
            '',
            '## Categories',
            '',
            ...$categories->map(fn ($category) => "- [{$category->name}](".Seo::url(Seo::categoryPath($category)).')')->all(),
        ];

        if ($bundles->isNotEmpty()) {
            array_push($lines, '', '## Bundles', '', ...$bundles->map(fn (Bundle $bundle) => "- [{$bundle->name}](".Seo::url('/bundle/'.$bundle->slug).')')->all());
        }

        return response(implode("\n", $lines)."\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }
}
