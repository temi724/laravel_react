<?php

declare(strict_types=1);

namespace App\Services;

use App\Helpers\SerialNumbers;
use App\Models\Admin;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Entity\SheetView;
use OpenSpout\Writer\XLSX\Writer;
use RuntimeException;

/**
 * Lists many products at once from an Excel (or CSV) file.
 *
 * The first row of the first sheet holds the column headings; each row after it is one product.
 * Every row is checked on its own: good rows are imported, the others are reported back with
 * their row number and what to fix. Photos are not part of the file: products are imported
 * without them and the admin adds them by editing each product.
 */
final class ProductImport
{
    public const MAX_ROWS = 500;

    /** Rows whose name starts with this are the sample rows of the downloaded file and are skipped */
    public const EXAMPLE_PREFIX = 'Example:';

    /**
     * The columns of the file: key => [heading, required, what to put (for the guide sheet), width].
     *
     * @var array<string, array{0: string, 1: bool, 2: string, 3: int}>
     */
    private const COLUMNS = [
        'name' => ['Product name', true, 'The name customers see, for example "iPhone 17 Pro Max 256GB".', 38],
        'category' => ['Category', true, 'Must match one of your categories exactly (they are listed below).', 22],
        'price' => ['Price', true, 'In naira, numbers only, for example 1850000.', 14],
        'stock' => ['Stock count', true, 'How many units you have to sell. Use 0 if none.', 12],
        'condition' => ['Condition', false, 'New, UK used or Refurbished. Left empty, it is New.', 14],
        'serial_numbers' => ['Serial numbers', false, 'Serial number or IMEI of each unit, separated by commas. No more than the stock count.', 44],
        'overview' => ['Overview', false, 'One or two lines used in search results.', 40],
        'description' => ['Description', false, 'The full description on the product page.', 50],
        'key_features' => ['Key features', false, 'Short sentences. Each one becomes a bullet on the product page.', 44],
        'colours' => ['Colours', false, 'Separated by commas, for example Black, Blue.', 22],
        'included' => ['What is included', false, 'Separated by commas, for example Phone, USB-C cable.', 28],
        'storage_options' => ['Storage options', false, 'Size=price pairs separated by commas, for example 256GB=1850000, 512GB=2150000.', 34],
        'images' => ['Photo links', false, 'Optional links to photos already online, separated by commas. Leave empty and add photos later by editing the product.', 50],
    ];

    /** Other headings that are understood, so a file exported from the products table can be imported too */
    private const ALIASES = [
        'name' => 'name', 'product' => 'name', 'title' => 'name',
        'stock' => 'stock', 'stockremaining' => 'stock', 'quantity' => 'stock', 'qty' => 'stock',
        'serialnumber' => 'serial_numbers', 'serials' => 'serial_numbers', 'imei' => 'serial_numbers',
        'colors' => 'colours', 'color' => 'colours', 'colour' => 'colours',
        'included' => 'included', 'whatsincluded' => 'included',
        'storage' => 'storage_options',
        'images' => 'images', 'photos' => 'images', 'imagelinks' => 'images', 'photolink' => 'images',
        'features' => 'key_features', 'about' => 'key_features',
    ];

    private const CONDITIONS = [
        '' => 'new', 'new' => 'new', 'brandnew' => 'new',
        'ukused' => 'uk_used', 'used' => 'uk_used',
        'refurbished' => 'refurbished', 'refurb' => 'refurbished',
    ];

    /**
     * Write the sample file admins download to see how to fill theirs in, and return its path.
     */
    public function template(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'products-sample-').'.xlsx';
        $categories = Category::query()->orderBy('name')->pluck('name')->all();
        $bold = (new Style)->setFontBold();

        $writer = new Writer;
        $writer->openToFile($path);

        // Sheet 1: the headings and two example rows
        $sheet = $writer->getCurrentSheet();
        $sheet->setName('Products');
        $sheet->setSheetView((new SheetView)->setFreezeRow(2));
        foreach (array_values(self::COLUMNS) as $index => $column) {
            $sheet->setColumnWidth((float) $column[3], $index + 1);
        }

        $writer->addRow(Row::fromValues(array_column(self::COLUMNS, 0), $bold));
        $writer->addRow(Row::fromValues([
            self::EXAMPLE_PREFIX.' iPhone 17 Pro Max', $this->exampleCategory($categories, ['Smartphones', 'Mobile Phones', 'Phones']), 1850000, 3, 'New',
            '356789104523871, 356789104523889, 356789104523897',
            '6.9 inch display, A19 Pro chip and a 48MP camera.',
            'The largest iPhone display yet, with all-day battery life.',
            '6.9 inch display. 48MP camera. All-day battery.',
            'Black, Blue', 'Phone, USB-C cable', '256GB=1850000, 512GB=2150000', '',
        ]));
        $writer->addRow(Row::fromValues([
            self::EXAMPLE_PREFIX.' Anker 20,000mAh power bank', $this->exampleCategory($categories, ['Accessories', 'Electronics']), 38500, 12, 'New',
            '', 'Charges a phone four times over.', '', '', 'Black', 'Power bank, USB-C cable', '', '',
        ]));

        // Sheet 2: how to fill it in
        $guide = $writer->addNewSheetAndMakeItCurrent();
        $guide->setName('How to fill it in');
        $guide->setColumnWidth(24.0, 1);
        $guide->setColumnWidth(12.0, 2);
        $guide->setColumnWidth(100.0, 3);

        $writer->addRow(Row::fromValues(['Column', 'Required', 'What to put'], $bold));
        foreach (self::COLUMNS as [$heading, $required, $help]) {
            $writer->addRow(Row::fromValues([$heading, $required ? 'Yes' : 'No', $help]));
        }
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValues(['Good to know'], $bold));
        foreach ([
            'One product per row on the "Products" sheet. Keep the headings in the first row as they are.',
            'Rows whose product name starts with "'.self::EXAMPLE_PREFIX.'" are skipped, so the two examples can stay or go.',
            'A product whose name is already in the store is skipped, so importing the same file twice does not create copies.',
            'Up to '.self::MAX_ROWS.' products per file.',
            'Photos: leave "Photo links" empty, then open each product in the admin and add its photos.',
            'Format the "Serial numbers" column as Text in Excel so long IMEI numbers are not changed.',
        ] as $note) {
            $writer->addRow(Row::fromValues([$note]));
        }
        $writer->addRow(Row::fromValues([]));
        $writer->addRow(Row::fromValues(['Your categories'], $bold));
        foreach ($categories as $category) {
            $writer->addRow(Row::fromValues([$category]));
        }

        $writer->close();

        return $path;
    }

    /**
     * A category for an example row: one of the store's own that fits, else its first, else the usual name.
     *
     * @param  list<string>  $categories
     * @param  list<string>  $preferred
     */
    private function exampleCategory(array $categories, array $preferred): string
    {
        foreach ($preferred as $name) {
            if (in_array($name, $categories, true)) {
                return $name;
            }
        }

        return $categories[0] ?? $preferred[0];
    }

    /**
     * Read and check a file without saving anything.
     *
     * @return array{ready: list<array<string, mixed>>, problems: list<array{row: int, name: string, messages: list<string>}>, skipped_examples: int}
     *
     * @throws RuntimeException when the file cannot be used at all (unreadable, no headings, too many rows)
     */
    public function read(string $path, string $extension): array
    {
        [$columns, $rows] = $this->rows($path, $extension);

        $missing = array_filter(
            array_keys(array_filter(self::COLUMNS, fn (array $column) => $column[1])),
            fn (string $key) => ! in_array($key, $columns, true)
        );
        if ($missing !== []) {
            throw new RuntimeException(sprintf(
                'The file is missing %s: %s. Download the sample file to see the headings the first row needs.',
                count($missing) === 1 ? 'a required column' : 'required columns',
                implode(', ', array_map(fn (string $key) => self::COLUMNS[$key][0], $missing))
            ));
        }

        $categories = Category::query()->pluck('id', 'name')
            ->mapWithKeys(fn ($id, $name) => [mb_strtolower(trim((string) $name)) => (string) $id])->all();
        $existingNames = Product::query()->pluck('name')
            ->mapWithKeys(fn ($name) => [mb_strtolower(trim((string) $name)) => true])->all();

        $ready = [];
        $problems = [];
        $skippedExamples = 0;
        $namesInFile = [];
        $serialsInFile = [];

        foreach ($rows as $rowNumber => $cells) {
            $name = $this->text($cells['name'] ?? '');

            if (str_starts_with(mb_strtolower($name), mb_strtolower(self::EXAMPLE_PREFIX))) {
                $skippedExamples++;

                continue;
            }

            [$product, $messages] = $this->product($cells, $categories);

            $key = mb_strtolower($name);
            if ($name !== '') {
                if (isset($existingNames[$key])) {
                    $messages[] = 'A product with this name is already in the store.';
                } elseif (isset($namesInFile[$key])) {
                    $messages[] = "Row {$namesInFile[$key]} has the same product name.";
                } else {
                    $namesInFile[$key] = $rowNumber;
                }
            }

            foreach ($product['serial_numbers'] as $serial) {
                $serialKey = mb_strtolower($serial);
                if (isset($serialsInFile[$serialKey]) && $serialsInFile[$serialKey] !== $rowNumber) {
                    $messages[] = "Serial number {$serial} is also on row {$serialsInFile[$serialKey]}.";
                }
                $serialsInFile[$serialKey] ??= $rowNumber;
            }

            if ($messages === []) {
                $ready[] = $product + ['row' => $rowNumber];
            } else {
                $problems[] = ['row' => $rowNumber, 'name' => $name, 'messages' => array_values(array_unique($messages))];
            }
        }

        return ['ready' => $ready, 'problems' => $problems, 'skipped_examples' => $skippedExamples];
    }

    /**
     * Save the rows that passed the check. Returns how many products were created.
     *
     * @param  list<array<string, mixed>>  $ready  from read()
     */
    public function import(array $ready, ?Admin $by): int
    {
        return DB::transaction(function () use ($ready, $by): int {
            foreach ($ready as $attributes) {
                unset($attributes['row']);
                (new Product($attributes))->listedBy($by)->save();
            }

            return count($ready);
        });
    }

    /**
     * The file's rows keyed by row number as Excel shows it, each row keyed by column.
     *
     * @return array{0: list<string>, 1: array<int, array<string, mixed>>}
     */
    private function rows(string $path, string $extension): array
    {
        $reader = $extension === 'csv' ? new CsvReader : new XlsxReader;

        try {
            $reader->open($path);
        } catch (\Throwable $e) {
            throw new RuntimeException('The file could not be opened. Save it as an Excel workbook (.xlsx) and try again.', 0, $e);
        }

        $columns = null;
        $rows = [];

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $rowNumber => $row) {
                    $values = $row->toArray();

                    if ($columns === null) {
                        $columns = array_map(fn ($heading) => $this->columnFor($heading), $values);

                        continue;
                    }

                    $cells = [];
                    foreach ($values as $index => $value) {
                        if (($columns[$index] ?? null) !== null) {
                            $cells[$columns[$index]] = $value;
                        }
                    }

                    // A blank line in the sheet is not a product
                    if (implode('', array_map(fn ($value) => $this->text($value), $cells)) === '') {
                        continue;
                    }

                    if (count($rows) >= self::MAX_ROWS) {
                        throw new RuntimeException('The file has more than '.self::MAX_ROWS.' products. Split it into smaller files.');
                    }

                    $rows[(int) $rowNumber] = $cells;
                }

                break; // only the first sheet holds products
            }
        } catch (RuntimeException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new RuntimeException('The file could not be read. Save it as an Excel workbook (.xlsx) and try again.', 0, $e);
        } finally {
            $reader->close();
        }

        if ($columns === null) {
            throw new RuntimeException('The file is empty. Download the sample file to see how to fill it in.');
        }

        return [array_values(array_filter($columns)), $rows];
    }

    /**
     * Which column a heading stands for, whatever its capitals, spaces or punctuation.
     */
    private function columnFor(mixed $heading): ?string
    {
        $normalised = (string) preg_replace('/[^a-z]/', '', mb_strtolower($this->text($heading)));

        foreach (self::COLUMNS as $key => [$label]) {
            if ($normalised === preg_replace('/[^a-z]/', '', mb_strtolower($label))) {
                return $key;
            }
        }

        return self::ALIASES[$normalised] ?? null;
    }

    /**
     * One row turned into product attributes, with what is wrong with it (if anything).
     *
     * @param  array<string, mixed>  $cells
     * @param  array<string, string>  $categories  lower-cased name => id
     * @return array{0: array<string, mixed>, 1: list<string>}
     */
    private function product(array $cells, array $categories): array
    {
        $messages = [];

        $name = $this->text($cells['name'] ?? '');
        if ($name === '') {
            $messages[] = 'The product name is missing.';
        } elseif (mb_strlen($name) > 255) {
            $messages[] = 'The product name is longer than 255 characters.';
        }

        $categoryName = $this->text($cells['category'] ?? '');
        $categoryId = $categories[mb_strtolower($categoryName)] ?? null;
        if ($categoryName === '') {
            $messages[] = 'The category is missing.';
        } elseif ($categoryId === null) {
            $messages[] = "There is no category called \"{$categoryName}\". Add it on the Categories page or fix the spelling.";
        }

        $price = $this->number($cells['price'] ?? '');
        if ($price === null || $price < 0) {
            $messages[] = 'The price must be a number, for example 1850000.';
        }

        $stock = $this->number($cells['stock'] ?? '');
        if ($stock === null || $stock < 0 || floor($stock) !== $stock) {
            $messages[] = 'The stock count must be a whole number (0 if none).';
        }

        $conditionText = $this->text($cells['condition'] ?? '');
        $condition = self::CONDITIONS[(string) preg_replace('/[^a-z]/', '', mb_strtolower($conditionText))] ?? null;
        if ($condition === null) {
            $messages[] = "The condition \"{$conditionText}\" is not one of New, UK used or Refurbished.";
        }

        $serials = SerialNumbers::clean($this->split($cells['serial_numbers'] ?? '', '/[\n,;]+/'));
        if ($stock !== null && $stock >= 0) {
            $messages = array_merge($messages, SerialNumbers::productProblems($serials, (int) $stock));
        }

        $storage = [];
        foreach ($this->split($cells['storage_options'] ?? '', '/[\n,;]+/') as $pair) {
            $parts = preg_split('/\s*[=:]\s*/', $pair, 2) ?: [];
            $optionPrice = $this->number($parts[1] ?? '');
            if (count($parts) !== 2 || trim($parts[0]) === '' || $optionPrice === null || $optionPrice < 0) {
                $messages[] = "The storage option \"{$pair}\" should look like 256GB=1850000.";

                continue;
            }
            $storage[] = ['storage' => trim($parts[0]), 'price' => $optionPrice];
        }

        $images = $this->split($cells['images'] ?? '', '/[\n,;\s]+/');
        foreach ($images as $image) {
            if (! preg_match('#^(https?://|/images/)#i', $image)) {
                $messages[] = "The photo link \"{$image}\" is not a web address. Leave the cell empty to add photos later.";
            }
        }

        return [[
            'product_name' => $name,
            'category_id' => $categoryId,
            'price' => $price ?? 0,
            'stock_quantity' => (int) ($stock ?? 0),
            'serial_numbers' => $serials,
            'product_status' => $condition ?? 'new',
            'overview' => $this->text($cells['overview'] ?? ''),
            'description' => $this->text($cells['description'] ?? ''),
            'about' => $this->text($cells['key_features'] ?? ''),
            'colors' => $this->split($cells['colours'] ?? '', '/[\n,;]+/'),
            'what_is_included' => $this->split($cells['included'] ?? '', '/[\n,;]+/'),
            'storage_options' => $storage,
            'images_url' => $images,
        ], $messages];
    }

    /**
     * A cell as trimmed text. Excel hands long numbers over as floats; those are written out in full.
     */
    private function text(mixed $value): string
    {
        if (is_float($value)) {
            return floor($value) === $value ? number_format($value, 0, '', '') : (string) $value;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return is_scalar($value) ? trim((string) $value) : '';
    }

    /**
     * A cell as a number: "1,850,000", "₦1850000" and 1850000 all work. Null when it is not a number.
     */
    private function number(mixed $value): ?float
    {
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        $text = (string) preg_replace('/[₦,\s]|NGN/iu', '', $this->text($value));

        return is_numeric($text) ? (float) $text : null;
    }

    /**
     * @return list<string>
     */
    private function split(mixed $value, string $pattern): array
    {
        $parts = preg_split($pattern, $this->text($value)) ?: [];

        return array_values(array_filter(array_map('trim', $parts), fn (string $part) => $part !== ''));
    }
}
