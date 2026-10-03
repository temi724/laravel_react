<?php

namespace App\Providers;

use App\Filesystem\BunnyStorageAdapter;
use App\View\Composers\StoreNavigationComposer;
use App\View\Composers\StoreOffersComposer;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\Filesystem;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer('partials.store-header', StoreNavigationComposer::class);
        View::composer('partials.store-scripts', StoreOffersComposer::class);

        // The "bunny" disk: files kept in a bunny.net storage zone
        Storage::extend('bunny', function ($app, array $config) {
            $adapter = new BunnyStorageAdapter(
                (string) ($config['storage_zone'] ?? ''),
                (string) ($config['access_key'] ?? ''),
                (string) ($config['hostname'] ?? 'storage.bunnycdn.com'),
                (string) ($config['cdn_url'] ?? ''),
                (string) ($config['root'] ?? ''),
            );

            return new FilesystemAdapter(new Filesystem($adapter, $config), $adapter, $config);
        });

        // Limits on the public write endpoints, each counted on its own per visitor.
        // (A plain "throttle:10,1" shares one counter between every route a visitor calls.)
        RateLimiter::for('orders', fn (Request $request) => Limit::perMinute(10)->by('orders|' . $request->ip()));
        RateLimiter::for('analytics', fn (Request $request) => Limit::perMinute(120)->by('analytics|' . $request->ip()));
        RateLimiter::for('admin-login', fn (Request $request) => Limit::perMinute(20)->by('admin-login|' . $request->ip()));
    }
}
