<?php

namespace App\Console\Commands;

use App\Filesystem\BunnyStorageAdapter;
use App\Support\ProductImages;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CheckBunnyStorage extends Command
{
    protected $signature = 'bunny:check';

    protected $description = 'Check the bunny.net storage settings: upload a small test file, read it back, open it through the pull zone, and delete it.';

    public function handle(): int
    {
        $bunny = config('filesystems.disks.bunny');
        $missing = array_keys(array_filter([
            'BUNNY_STORAGE_ZONE' => empty($bunny['storage_zone']),
            'BUNNY_STORAGE_KEY' => empty($bunny['access_key']),
            'BUNNY_CDN_URL' => empty($bunny['cdn_url']),
        ]));
        if ($missing !== []) {
            $this->error('Not set in .env: ' . implode(', ', $missing));

            return self::FAILURE;
        }

        $this->line("Storage zone: {$bunny['storage_zone']} on " . BunnyStorageAdapter::storageHostname((string) $bunny['hostname']));
        $this->line('Product photos are saved to: ' . (ProductImages::disk() === 'bunny' ? 'bunny.net' : 'the local images folder (UPLOADS_DISK is set to ' . ProductImages::disk() . ')'));

        $path = 'connection-check-' . Str::lower(Str::random(12)) . '.txt';
        $contents = 'bunny storage check ' . now()->toIso8601String();
        $disk = Storage::disk('bunny');

        try {
            $disk->put($path, $contents);
            $this->info('Upload: ok');

            if ($disk->get($path) !== $contents) {
                $this->error('Read back: the file came back different from what was sent.');

                return self::FAILURE;
            }
            $this->info('Read back: ok');
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        // The pull zone is a separate setting in bunny, so it is checked on its own
        $url = $disk->url($path);
        try {
            $public = Http::timeout(20)->get($url);
            if ($public->successful() && $public->body() === $contents) {
                $this->info("Public address: ok ({$url})");
            } else {
                $this->warn("Public address answered {$public->status()} for {$url}. Check that BUNNY_CDN_URL is the pull zone connected to this storage zone.");
            }
        } catch (Throwable $e) {
            $this->warn("Public address could not be reached ({$url}): {$e->getMessage()}");
        }

        try {
            $disk->delete($path);
            $this->info('Delete: ok');
        } catch (Throwable $e) {
            $this->warn('The test file could not be deleted: ' . $e->getMessage());
        }

        return self::SUCCESS;
    }
}
