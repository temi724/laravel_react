<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Helpers\Money;
use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A bundle, new or edited: its name, its price and the products inside it.
 */
final class BundleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:2000'],
            'price' => ['required', 'numeric', 'min:1', 'max:99999999'],
            'is_active' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:2', 'max:8'],
            'items.*.product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'items.*.storage' => ['nullable', 'string', 'max:60'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Give the bundle a name.',
            'price.required' => 'Enter the bundle price.',
            'items.required' => 'Add the products that make up the bundle.',
            'items.min' => 'A bundle needs at least two products.',
            'items.max' => 'A bundle can hold up to eight products.',
            'items.*.product_id.required' => 'Choose a product from the list.',
            'items.*.product_id.exists' => 'Choose a product from the list.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $products = Product::query()->findMany(array_column($this->input('items'), 'product_id'))->keyBy('id');
            $usual = 0.0;
            $seen = [];

            foreach ($this->input('items') as $index => $item) {
                $product = $products[$item['product_id']];
                $storage = trim((string) ($item['storage'] ?? '')) ?: null;
                $sizes = array_filter(array_map(fn ($option) => is_array($option) ? ($option['storage'] ?? null) : null, $product->storage_options));

                if ($sizes !== [] && $storage === null) {
                    $validator->errors()->add("items.{$index}.storage", "{$product->product_name} comes in sizes. Choose one.");

                    continue;
                }

                $unit = $product->priceFor($sizes === [] ? null : $storage);
                if ($unit === null) {
                    $validator->errors()->add("items.{$index}.storage", "{$product->product_name} is not sold in {$storage}.");

                    continue;
                }

                $key = $product->id.'|'.mb_strtolower((string) $storage);
                if (isset($seen[$key])) {
                    $validator->errors()->add("items.{$index}.product_id", "{$product->product_name} is in the bundle twice. Raise its quantity instead.");
                }
                $seen[$key] = true;

                $usual += $unit * (int) $item['quantity'];
            }

            if ($validator->errors()->isEmpty() && (float) $this->input('price') >= $usual) {
                $validator->errors()->add('price', 'The bundle price must be lower than buying the items separately ('.Money::naira($usual).').');
            }
        }];
    }
}
