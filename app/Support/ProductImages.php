<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Where uploaded product photos go, and the address they are then shown from.
 *
 * The disk is config('filesystems.uploads'): the bunny.net storage zone once its details
 * are in .env, the local images folder until then.
 */
final class ProductImages
{
    public const FOLDER = 'products';

    /**
     * Store one uploaded photo and return the address to save on the product.
     *
     * @throws ValidationException when the storage refuses the file
     */
    public static function store(UploadedFile $image): string
    {
        // A unique name. The extension comes from the file's real type, never from the name the browser sent.
        $filename = Str::random(40) . '.' . $image->extension();
        $path = self::FOLDER . '/' . $filename;
        $disk = self::disk();

        try {
            $stored = Storage::disk($disk)->putFileAs(self::FOLDER, $image, $filename);
        } catch (Throwable $e) {
            Log::error('Product photo upload failed', ['disk' => $disk, 'error' => $e->getMessage()]);
            $stored = false;
        }

        if ($stored === false) {
            throw ValidationException::withMessages([
                'product_images' => ['A photo could not be saved to the file storage. Try again in a moment.'],
            ]);
        }

        return self::url($path, $disk);
    }

    /**
     * The address a stored photo is shown from.
     */
    public static function url(string $path, ?string $disk = null): string
    {
        $disk ??= self::disk();

        // The local folder is served by this site, so its photos keep a relative address
        if ($disk === 'images') {
            return '/images/' . ltrim($path, '/');
        }

        return Storage::disk($disk)->url($path);
    }

    public static function disk(): string
    {
        return (string) config('filesystems.uploads', 'images');
    }
}
