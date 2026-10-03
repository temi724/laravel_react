<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
            'report' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
            'report' => false,
        ],

        'images' => [
            'driver' => 'local',
            'root' => base_path('images'),
            'url' => env('APP_URL').'/images',
            'visibility' => 'public',
            'throw' => false,
            'report' => false,
        ],

        // A bunny.net storage zone (see App\Filesystem\BunnyStorageAdapter).
        // The values are on the storage zone's "FTP & API access" page; the CDN URL is the
        // pull zone connected to the zone.
        'bunny' => [
            'driver' => 'bunny',
            'storage_zone' => env('BUNNY_STORAGE_ZONE'),
            'access_key' => env('BUNNY_STORAGE_KEY'), // the storage zone password, not the account API key
            'hostname' => env('BUNNY_STORAGE_HOSTNAME', 'storage.bunnycdn.com'),
            'cdn_url' => env('BUNNY_CDN_URL'),
            'root' => env('BUNNY_STORAGE_ROOT', ''),
            'throw' => true,
            'report' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Uploads Disk
    |--------------------------------------------------------------------------
    |
    | Where uploaded product photos are stored. It is the bunny.net storage zone
    | as soon as its name and password are set, and the local images folder
    | until then. Set UPLOADS_DISK to choose one yourself.
    |
    */

    'uploads' => env('UPLOADS_DISK', env('BUNNY_STORAGE_ZONE') && env('BUNNY_STORAGE_KEY') ? 'bunny' : 'images'),

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
