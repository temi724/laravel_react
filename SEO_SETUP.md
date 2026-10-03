# SEO setup

What the site already does, and the few steps that have to be done by hand when it goes live.

## Before going live

1. In the live `.env`, set `APP_ENV=production`, `APP_DEBUG=false` and `APP_URL=https://murphylog.com.ng`.
   Every canonical link, the sitemap and `robots.txt` use `https://murphylog.com.ng` in production.
   To use another address (for example with `www`), set `STORE_URL` in `.env`.
2. Delete any old `robots.txt` in the public folder on the server. The site now answers
   `/robots.txt` itself, and a file left there would be served instead.
3. Run `composer install --optimize-autoloader` and `npm run build`, then `php artisan view:clear`.
4. Make one of `murphylog.com.ng` and `www.murphylog.com.ng` redirect to the other (in cPanel or
   `.htaccess`), and HTTP redirect to HTTPS.

## After going live

1. Google Search Console (https://search.google.com/search-console): add the site, choose the
   "HTML tag" method, and put the code in `.env` as `GOOGLE_SITE_VERIFICATION=...`.
   Then submit `https://murphylog.com.ng/sitemap.xml`.
2. Bing Webmaster Tools: the same, with `BING_SITE_VERIFICATION=...`.
3. Google Business Profile: claim the shop at 12, Ola Ayeni Street, Ikeja, with the same name,
   address, phone number and opening hours as `config/store.php`. This is what puts the shop
   on Google Maps and in "near me" searches.
4. Test a product page at https://search.google.com/test/rich-results.

## Where things are

| What | Where |
| --- | --- |
| Shop name, address, hours, default title and description | `config/store.php` |
| Titles, descriptions, canonical addresses, schema.org data | `app/Support/Seo.php` |
| The page head (title, robots, link previews, schema) | `app/View/Components/Layout.php` and `resources/views/components/layout.blade.php` |
| Category pages, all products, search | `app/Http/Controllers/CatalogController.php` |
| About page, `sitemap.xml`, `robots.txt`, `llms.txt` | `app/Http/Controllers/StorePageController.php` |
| Product addresses (`/product/...`) | `app/Support/ProductUrls.php` |
| Tests | `tests/Feature/SeoTest.php` |

## Rules for new pages

- Use `<x-layout :title="Seo::title('...')" :description="...">`. A page that should not be in
  search results gets `robots="noindex, follow"`.
- A page that lists products prints them in the HTML (`react.product-grid` with a `listing`),
  so they are there without JavaScript.
- Schema.org data states only what the page shows. No ratings or reviews unless real ones exist.
