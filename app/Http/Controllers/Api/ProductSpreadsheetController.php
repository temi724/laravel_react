<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Product;
use App\Services\ProductExport;
use App\Services\ProductImport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use RuntimeException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The products table as an Excel file: exporting it with chosen columns, and listing
 * many products at once from a file.
 */
final class ProductSpreadsheetController extends Controller
{
    private const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    public function __construct(
        private readonly ProductExport $export,
        private readonly ProductImport $import,
    ) {}

    /**
     * The columns the export dialog offers.
     */
    public function fields(): JsonResponse
    {
        return response()->json(['success' => true, 'fields' => ProductExport::catalogue()]);
    }

    /**
     * Download the products the table is showing (same search and stock filter), with the chosen columns.
     */
    public function export(Request $request): BinaryFileResponse
    {
        $validated = $request->validate([
            'fields' => ['required', 'array', 'min:1'],
            'fields.*' => ['string', Rule::in(ProductExport::keys())],
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', Rule::in(['all', 'in_stock', 'out_of_stock', 'no_photo'])],
        ], ['fields.required' => 'Choose at least one column to export.']);

        $query = Product::query()->with('category')->orderBy('name');

        if (! empty($validated['search'])) {
            $term = $validated['search'];
            $query->where(fn ($q) => $q->where('name', 'like', "%{$term}%")
                ->orWhere('description', 'like', "%{$term}%")
                ->orWhere('id', 'like', "%{$term}%"));
        }

        match ($validated['status'] ?? 'all') {
            'in_stock' => $query->inStock(true),
            'out_of_stock' => $query->inStock(false),
            'no_photo' => $query->withoutPhotos(),
            default => null,
        };

        $path = $this->export->write($query->lazy(200), $validated['fields']);

        return response()
            ->download($path, 'products-'.now()->format('Y-m-d').'.xlsx', ['Content-Type' => self::XLSX])
            ->deleteFileAfterSend();
    }

    /**
     * The sample file that shows how to fill in an import.
     */
    public function sample(): BinaryFileResponse
    {
        return response()
            ->download($this->import->template(), 'product-import-sample.xlsx', ['Content-Type' => self::XLSX])
            ->deleteFileAfterSend();
    }

    /**
     * Check a file (dry_run) or import it. Either way the answer lists the rows that need fixing.
     */
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            // An .xlsx is a zip underneath, and some systems report it as one
            'file' => ['required', 'file', 'max:2048', 'mimes:xlsx,zip,csv,txt'],
            'dry_run' => ['nullable', 'boolean'],
        ], [
            'file.required' => 'Choose an Excel file to import.',
            'file.max' => 'The file is larger than 2MB. Split it into smaller files.',
            'file.mimes' => 'That is not an Excel file. Save it as an Excel workbook (.xlsx) and try again.',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        if (! in_array($extension, ['xlsx', 'csv'], true)) {
            return response()->json(['success' => false, 'message' => 'That is not an Excel file. Save it as an Excel workbook (.xlsx) and try again.'], 422);
        }

        try {
            $result = $this->import->read($file->getRealPath(), $extension);
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }

        $dryRun = $request->boolean('dry_run');
        $imported = 0;

        if (! $dryRun && $result['ready'] !== []) {
            /** @var Admin|null $admin */
            $admin = $request->attributes->get('admin');
            $imported = $this->import->import($result['ready'], $admin);

            Log::channel('audit')->info('products imported', ['admin_id' => $admin?->id, 'count' => $imported]);
        }

        return response()->json([
            'success' => true,
            'dry_run' => $dryRun,
            'ready' => count($result['ready']),
            'imported' => $imported,
            'problems' => $result['problems'],
            'skipped_examples' => $result['skipped_examples'],
            // A few names, so the admin can see the right file was read
            'preview' => array_slice(array_column($result['ready'], 'product_name'), 0, 5),
        ]);
    }
}
