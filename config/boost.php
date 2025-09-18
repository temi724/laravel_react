<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Boost Master Switch
    |--------------------------------------------------------------------------
    |
    | Disable all Boost functionality by setting BOOST_ENABLED=false. When
    | disabled, Boost routes won’t register and no scripts will be injected.
    */

    'enabled' => env('BOOST_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Boost Browser Logs Watcher
    |--------------------------------------------------------------------------
    |
    | Controls whether the browser logs watcher is active. Default is disabled
    | to ensure no console script is injected and no network posts to
    | /_boost/browser-logs happen in production. Enable explicitly on local by
    | setting BOOST_BROWSER_LOGS_WATCHER=true in your .env.
    */

    'browser_logs_watcher' => env('BOOST_BROWSER_LOGS_WATCHER', false),

];
