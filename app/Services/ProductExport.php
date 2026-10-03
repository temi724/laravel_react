<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Product;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;

/**
 * Writes products to an Excel file with the columns the admin picked.
 */
final class ProductExport
{
    /**
     * Every column that can be exported: key => [heading, group on the export dialog, ticked by default, width].
     *
     * @var array<string, array{0: string, 1: string, 2: bool, 3: int}>
     */
    private const FIELDS = [
        'name' => ['Product name', 'Basics', true, 38],
        'category' => ['Category', 'Basics', true, 22],
        'price' => ['Price', 'Basics', true, 14],
        'condition' => ['Condition', 'Basics', true, 14],
        'storage_options' => ['Storage options', 'Basics', false, 34],
        'stock' => ['Stock count', 'Stock', true, 12],
        'units_sold' => ['Number sold', 'Stock', true, 12],
        'stocked' => ['Stocked', 'Stock', false, 12],
        'in_stock' => ['In stock', 'Stock', false, 10],
        'serial_numbers' => ['Serial numbers', 'Stock', true, 44],
        'overview' => ['Overview', 'Details', false, 40],
        'description' => ['Description', 'Details', false, 50],
        'key_features' => ['Key features', 'Details', false, 44],
        'colours' => ['Colours', 'Details', false, 22],
        'included' => ['What is included', 'Details', false, 28],
        'specifications' => ['Specifications', 'Details', false, 44],
        'images' => ['Photo links', 'Details', false, 50],
        'listed_by' => ['Listed by', 'Record', false, 22],
        'created_at' => ['Date added', 'Record', false, 14],
        'id' => ['Product ID', 'Record', false, 12],
        'sku' => ['SKU', 'Record', false, 16],
    ];

    /**
     * The columns as the export dialog lists them.
     *
     * @return list<array{key: string, label: string, group: string, default: bool}>
     */
    public static function catalogue(): array
    {
        $catalogue = [];
        foreach (self::FIELDS as $key => [$label, $group, $default]) {
            $catalogue[] = ['key' => $key, 'label' => $label, 'group' => $group, 'default' => $default];
        }

        return $catalogue;
    }

    /**
     * @return list<string>
     */
    public static function keys(): array
    {
        return array_keys(self::FIELDS);
    }

    /**
     * Write the products to a temporary .xlsx file and return its path. The caller sends and deletes it.
     *
     * @param  iterable<Product>  $products
     * @param  list<string>  $fields  keys of FIELDS; they are written in the usual order whatever order they arrive in
     */
    public function write(iterable $products, array $fields): string
    {
        $fields = array_values(array_intersect(self::keys(), $fields));
        $path = tempnam(sys_get_temp_dir(), 'products-export-').'.xlsx';

        $writer = new Writer;
        $writer->openToFile($path);

        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Products');
        $sheet->setSheetView((new SheetView)->setFreezeRow(2)); // the heading row stays put while scrolling
        foreach ($fields as $index => $field) {
            $sheet->setColumnWidth((float) self::FIELDS[$field][3], $index + 1);
        }

        $writer->addRow(Row::fromValues(
            array_map(fn (string $field) => self::FIELDS[$field][0], $fields),
            (new Style)->setFontBold()
        ));

        foreach ($products as $product) {
            $writer->addRow(Row::fromValues(array_map(fn (string $field) => $this->value($product, $field), $fields)));
        }

        $writer->close();

        return $path;
    }

    /**
     * One cell. Numbers stay numbers so they can be summed; text is written as text, so a value
     * starting with "=" is never run as a formula by Excel.
     */
    private function value(Product $product, string $field): string|int|float
    {
        return match ($field) {
            'name' => (string) $product->product_name,
            'category' => (string) ($product->category?->name ?? ''),
            'price' => (float) $product->price,
            'condition' => match ($product->product_status) {
                'uk_used' => 'UK used',
                'refurbished' => 'Refurbished',
                default => 'New',
            },
            'storage_options' => $this->pairs(collect($product->storage_options)->mapWithKeys(
                fn ($option) => is_array($option) ? [(string) ($option['storage'] ?? '') => $option['price'] ?? ''] : []
            )->all(), '='),
            'stock' => (int) $product->stock_quantity,
            'units_sold' => (int) $product->units_sold,
            'stocked' => (int) $product->stock_quantity + (int) $product->units_sold,
            'in_stock' => $product->in_stock ? 'Yes' : 'No',
            'serial_numbers' => implode(', ', $product->serial_numbers),
            'overview' => (string) $product->overview,
            'description' => (string) $product->description,
            'key_features' => (string) $product->about,
            'colours' => $this->list($product->colors),
            'included' => $this->list($product->what_is_included),
            'specifications' => $this->pairs(is_array($product->specification) ? $product->specification : [], ': '),
            'images' => $this->list($product->images_url),
            'listed_by' => (string) ($product->listed_by['name'] ?? ''),
            'created_at' => (string) $product->created_at?->format('Y-m-d'),
            'id' => (int) $product->id,
            'sku' => (string) $product->sku,
            default => '',
        };
    }

    private function list(mixed $values): string
    {
        if (! is_array($values)) {
            return (string) $values;
        }

        return implode(', ', array_filter(array_map(
            fn ($value) => is_array($value) ? (string) ($value['name'] ?? '') : (string) $value,
            $values
        ), fn (string $value) => $value !== ''));
    }

    /**
     * @param  array<string, mixed>  $pairs
     */
    private function pairs(array $pairs, string $separator): string
    {
        $parts = [];
        foreach ($pairs as $key => $value) {
            if (is_scalar($value) && (string) $key !== '') {
                $parts[] = $key.$separator.$value;
            }
        }

        return implode(', ', $parts);
    }
}
