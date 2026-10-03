<?php

namespace App\Console\Commands;

use App\Models\Deal;
use App\Models\Product;
use App\Support\ProductImages;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MoveImagesToBunny extends Command
{
    protected $signature = 'images:to-bunny {--dry-run : List what would be copied without changing anything}';

    protected $description = 'Copy product photos kept in the local images folder to the bunny.net storage zone and point the products at the new addresses. Local files are left where they are.';

    /** Local address => bunny address, so a photo shared by several products is uploaded once */
    private array $moved = [];

    public function handle(): int
    {
        $bunny = config('filesystems.disks.bunny');
        if (empty($bunny['storage_zone']) || empty($bunny['access_key']) || empty($bunny['cdn_url'])) {
            $this->error('Set BUNNY_STORAGE_ZONE, BUNNY_STORAGE_KEY and BUNNY_CDN_URL in .env first.');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $this->moved = [];
        $updated = 0;
        $failed = 0;

        foreach ([Product::class, Deal::class] as $model) {
            $model::query()->chunkById(100, function ($items) use ($dryRun, &$updated, &$failed) {
                foreach ($items as $item) {
                    $images = is_array($item->images_url) ? $item->images_url : [];
                    $changed = false;

                    foreach ($images as $index => $url) {
                        // Only photos served from the local images folder; links to other sites stay as they are
                        if (! is_string($url) || ! str_starts_with($url, '/images/')) {
                            continue;
                        }

                        $path = substr($url, strlen('/images/'));
                        if (! Storage::disk('images')->exists($path)) {
                            $this->warn("Missing locally, left as it is: {$url}");
                            continue;
                        }

                        if ($dryRun) {
                            if (! isset($this->moved[$url])) {
                                $this->line("Would copy {$url}");
                            }
                            $this->moved[$url] = $url;
                            $changed = true;
                            continue;
                        }

                        try {
                            $images[$index] = $this->moved[$url] ??= $this->copy($path);
                            $changed = true;
                        } catch (Throwable $e) {
                            $failed++;
                            $this->error("Could not copy {$url}: {$e->getMessage()}");
                        }
                    }

                    if ($changed) {
                        $updated++;
                        if (! $dryRun) {
                            $item->images_url = array_values($images);
                            $item->save();
                        }
                    }
                }
            });
        }

        $this->info(sprintf(
            '%s %d %s, %d %s %s.',
            $dryRun ? 'Would update' : 'Updated',
            $updated,
            $updated === 1 ? 'product' : 'products',
            count($this->moved),
            count($this->moved) === 1 ? 'photo' : 'photos',
            $dryRun ? 'to copy' : 'copied'
        ));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Copy one local photo to bunny under the same path and return its new address.
     */
    private function copy(string $path): string
    {
        $stream = Storage::disk('images')->readStream($path);

        try {
            Storage::disk('bunny')->writeStream($path, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        return ProductImages::url($path, 'bunny');
    }
}
