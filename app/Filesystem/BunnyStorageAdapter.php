<?php

declare(strict_types=1);

namespace App\Filesystem;

use GuzzleHttp\Psr7\Utils;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use League\Flysystem\Config;
use League\Flysystem\DirectoryAttributes;
use League\Flysystem\FileAttributes;
use League\Flysystem\FilesystemAdapter;
use League\Flysystem\UnableToCheckExistence;
use League\Flysystem\UnableToCopyFile;
use League\Flysystem\UnableToDeleteDirectory;
use League\Flysystem\UnableToDeleteFile;
use League\Flysystem\UnableToMoveFile;
use League\Flysystem\UnableToReadFile;
use League\Flysystem\UnableToRetrieveMetadata;
use League\Flysystem\UnableToSetVisibility;
use League\Flysystem\UnableToWriteFile;
use League\Flysystem\Visibility;
use League\MimeTypeDetection\ExtensionMimeTypeDetector;
use Throwable;

/**
 * Stores files in a bunny.net storage zone through its HTTP API
 * (https://bunny.net/docs/storage/http), so Laravel can use it as a disk:
 *
 *   PUT    https://{hostname}/{zone}/{path}   upload, raw file as the body, answers 201
 *   GET    https://{hostname}/{zone}/{path}   download
 *   GET    https://{hostname}/{zone}/{dir}/   list a directory, answers a JSON array
 *   DELETE https://{hostname}/{zone}/{path}   delete a file or a directory
 *
 * Every request carries the storage zone password in the AccessKey header (that password,
 * not the account API key). Files are public through the pull zone connected to the zone:
 * https://{pull-zone}.b-cdn.net/{path}.
 */
final class BunnyStorageAdapter implements FilesystemAdapter
{
    /** Only bunny's own storage hosts are ever sent the password */
    private const HOSTNAME_PATTERN = '/^([a-z]{2,3}\.)?storage\.bunnycdn\.com$/';

    private readonly string $hostname;

    private readonly string $cdnUrl;

    private string $root;

    public function __construct(
        private readonly string $storageZone,
        // Kept out of error reports and stack traces
        #[\SensitiveParameter] private readonly string $accessKey,
        string $hostname = 'storage.bunnycdn.com',
        string $cdnUrl = '',
        string $root = '',
    ) {
        if ($storageZone === '' || $accessKey === '') {
            throw new InvalidArgumentException('Bunny storage needs BUNNY_STORAGE_ZONE and BUNNY_STORAGE_KEY to be set.');
        }

        $this->hostname = self::storageHostname($hostname);
        if (! preg_match(self::HOSTNAME_PATTERN, $this->hostname)) {
            throw new InvalidArgumentException("[{$hostname}] is not a bunny.net storage hostname. Copy it from the storage zone's API access page, for example storage.bunnycdn.com or uk.storage.bunnycdn.com.");
        }

        // A pull zone typed without "https://" is still a web address
        $cdnUrl = trim($cdnUrl);
        $this->cdnUrl = $cdnUrl === '' || preg_match('#^https?://#i', $cdnUrl) ? $cdnUrl : 'https://' . $cdnUrl;

        $this->root = trim($root, '/');
    }

    /**
     * The storage API host for whatever was pasted from the bunny dashboard: with or without
     * "https://", and also the S3-style address a zone with S3 compatibility shows
     * ("de-s3.storage.bunnycdn.com"). Such a zone answers on the ordinary storage host of its
     * region too, which is the API this driver speaks; Frankfurt ("de") is the one without a prefix.
     */
    public static function storageHostname(string $hostname): string
    {
        $hostname = strtolower(trim($hostname));
        $hostname = (string) preg_replace('#^https?://#', '', $hostname);
        $hostname = rtrim(explode('/', $hostname)[0], '.');

        if (preg_match('/^([a-z]{2,3})-s3\.storage\.bunnycdn\.com$/', $hostname, $match)) {
            $hostname = $match[1] . '.storage.bunnycdn.com';
        }

        return $hostname === 'de.storage.bunnycdn.com' ? 'storage.bunnycdn.com' : $hostname;
    }

    /**
     * The public address of a file, through the pull zone.
     */
    public function getUrl(string $path): string
    {
        if ($this->cdnUrl === '') {
            throw new InvalidArgumentException('Set BUNNY_CDN_URL to the address of the pull zone connected to the storage zone, for example https://your-zone.b-cdn.net.');
        }

        return rtrim($this->cdnUrl, '/') . '/' . $this->encode($this->withRoot($path));
    }

    public function fileExists(string $path): bool
    {
        try {
            $response = $this->request()->withOptions(['stream' => true])->get($this->endpoint($path));
        } catch (Throwable $e) {
            throw UnableToCheckExistence::forLocation($path, $e);
        }

        if ($response->status() === 404) {
            return false;
        }
        if ($response->successful()) {
            return true;
        }

        throw UnableToCheckExistence::forLocation($path, new \RuntimeException($this->explain($response)));
    }

    public function directoryExists(string $path): bool
    {
        try {
            $response = $this->request()->get($this->endpoint($path, directory: true));
        } catch (Throwable $e) {
            throw UnableToCheckExistence::forLocation($path, $e);
        }

        return $response->successful() && is_array($response->json()) && $response->json() !== [];
    }

    public function write(string $path, string $contents, Config $config): void
    {
        $this->upload($path, $contents, strtoupper(hash('sha256', $contents)));
    }

    public function writeStream(string $path, $contents, Config $config): void
    {
        // Bunny checks the upload against this when it is sent, so a file damaged on the way is refused
        $checksum = null;
        if (is_resource($contents) && (stream_get_meta_data($contents)['seekable'] ?? false)) {
            $hash = hash_init('sha256');
            hash_update_stream($hash, $contents);
            $checksum = strtoupper(hash_final($hash));
            rewind($contents);
        }

        $this->upload($path, Utils::streamFor($contents), $checksum);
    }

    public function read(string $path): string
    {
        try {
            $response = $this->request()->get($this->endpoint($path));
        } catch (Throwable $e) {
            throw UnableToReadFile::fromLocation($path, $e->getMessage(), $e);
        }

        if (! $response->successful()) {
            throw UnableToReadFile::fromLocation($path, $this->explain($response));
        }

        return $response->body();
    }

    public function readStream(string $path)
    {
        $stream = fopen('php://temp', 'w+b');
        fwrite($stream, $this->read($path));
        rewind($stream);

        return $stream;
    }

    public function delete(string $path): void
    {
        try {
            $response = $this->request()->delete($this->endpoint($path));
        } catch (Throwable $e) {
            throw UnableToDeleteFile::atLocation($path, $e->getMessage(), $e);
        }

        // Deleting something that is already gone is a success
        if (! $response->successful() && $response->status() !== 404) {
            throw UnableToDeleteFile::atLocation($path, $this->explain($response));
        }
    }

    public function deleteDirectory(string $path): void
    {
        // The root of the zone is never deleted from here: that would wipe every file in it
        if (trim($this->withRoot($path), '/') === '') {
            throw UnableToDeleteDirectory::atLocation($path, 'Refusing to delete the root of the storage zone.');
        }

        try {
            $response = $this->request()->delete($this->endpoint($path, directory: true));
        } catch (Throwable $e) {
            throw UnableToDeleteDirectory::atLocation($path, $e->getMessage(), $e);
        }

        if (! $response->successful() && $response->status() !== 404) {
            throw UnableToDeleteDirectory::atLocation($path, $this->explain($response));
        }
    }

    public function createDirectory(string $path, Config $config): void
    {
        // Bunny creates the directories of a path by itself when a file is uploaded
    }

    public function setVisibility(string $path, string $visibility): void
    {
        throw UnableToSetVisibility::atLocation($path, 'Files in a bunny.net storage zone are public through its pull zone; they have no visibility of their own.');
    }

    public function visibility(string $path): FileAttributes
    {
        return new FileAttributes($path, null, Visibility::PUBLIC);
    }

    public function mimeType(string $path): FileAttributes
    {
        $mimeType = $this->headers($path, 'mime type')->header('Content-Type') ?: (new ExtensionMimeTypeDetector)->detectMimeTypeFromPath($path);
        if (! $mimeType) {
            throw UnableToRetrieveMetadata::mimeType($path);
        }

        return new FileAttributes($path, null, null, null, strtok($mimeType, ';') ?: $mimeType);
    }

    public function lastModified(string $path): FileAttributes
    {
        $modified = strtotime((string) $this->headers($path, 'last modified')->header('Last-Modified'));
        if ($modified === false) {
            throw UnableToRetrieveMetadata::lastModified($path);
        }

        return new FileAttributes($path, null, null, $modified);
    }

    public function fileSize(string $path): FileAttributes
    {
        $length = $this->headers($path, 'file size')->header('Content-Length');
        if (! is_numeric($length)) {
            throw UnableToRetrieveMetadata::fileSize($path);
        }

        return new FileAttributes($path, (int) $length);
    }

    public function listContents(string $path, bool $deep): iterable
    {
        $response = $this->request()->get($this->endpoint($path, directory: true));
        $entries = $response->successful() && is_array($response->json()) ? $response->json() : [];

        foreach ($entries as $entry) {
            if (! is_array($entry) || ! isset($entry['ObjectName'])) {
                continue;
            }

            $entryPath = ltrim(trim($path, '/') . '/' . $entry['ObjectName'], '/');
            $modified = isset($entry['LastChanged']) ? (strtotime((string) $entry['LastChanged']) ?: null) : null;

            if (! empty($entry['IsDirectory'])) {
                yield new DirectoryAttributes($entryPath, Visibility::PUBLIC, $modified);
                if ($deep) {
                    yield from $this->listContents($entryPath, true);
                }
            } else {
                yield new FileAttributes($entryPath, isset($entry['Length']) ? (int) $entry['Length'] : null, Visibility::PUBLIC, $modified);
            }
        }
    }

    public function move(string $source, string $destination, Config $config): void
    {
        try {
            $this->copy($source, $destination, $config);
            $this->delete($source);
        } catch (Throwable $e) {
            throw UnableToMoveFile::fromLocationTo($source, $destination, $e);
        }
    }

    public function copy(string $source, string $destination, Config $config): void
    {
        // The storage API has no copy, so the file is read and written again
        try {
            $this->write($destination, $this->read($source), $config);
        } catch (Throwable $e) {
            throw UnableToCopyFile::fromLocationTo($source, $destination, $e);
        }
    }

    /**
     * @param  string|\Psr\Http\Message\StreamInterface  $body
     */
    private function upload(string $path, $body, ?string $checksum): void
    {
        $contentType = (new ExtensionMimeTypeDetector)->detectMimeTypeFromPath($path) ?: 'application/octet-stream';
        $request = $this->request()->timeout(120);
        if ($checksum) {
            $request = $request->withHeaders(['Checksum' => $checksum]);
        }

        try {
            // The file goes as the raw body: bunny answers 401 to anything encoded (a form, base64...)
            $response = $request->withBody($body, $contentType)->put($this->endpoint($path));
        } catch (Throwable $e) {
            throw UnableToWriteFile::atLocation($path, $e->getMessage(), $e);
        }

        if (! $response->successful()) {
            throw UnableToWriteFile::atLocation($path, $this->explain($response));
        }
    }

    /**
     * The response headers for a file, without downloading its contents.
     */
    private function headers(string $path, string $what): Response
    {
        try {
            $response = $this->request()->withOptions(['stream' => true])->get($this->endpoint($path));
        } catch (Throwable $e) {
            throw UnableToRetrieveMetadata::create($path, $what, $e->getMessage(), $e);
        }

        if (! $response->successful()) {
            throw UnableToRetrieveMetadata::create($path, $what, $this->explain($response));
        }

        return $response;
    }

    private function request(): PendingRequest
    {
        return Http::withHeaders(['AccessKey' => $this->accessKey])
            ->accept('application/json')
            ->connectTimeout(10)
            ->timeout(60);
    }

    private function endpoint(string $path, bool $directory = false): string
    {
        $url = "https://{$this->hostname}/" . rawurlencode($this->storageZone) . '/' . $this->encode($this->withRoot($path));

        return $directory ? rtrim($url, '/') . '/' : $url;
    }

    private function withRoot(string $path): string
    {
        return ltrim($this->root . '/' . ltrim($path, '/'), '/');
    }

    private function encode(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    /**
     * Why bunny refused, in words that point at the fix. The password is never part of it.
     */
    private function explain(Response $response): string
    {
        return match ($response->status()) {
            401 => 'bunny.net refused the request (401): check the storage zone password and that the hostname matches the zone\'s region.',
            404 => 'bunny.net could not find it (404): check the storage zone name and the path.',
            default => 'bunny.net answered ' . $response->status() . '.',
        };
    }
}
