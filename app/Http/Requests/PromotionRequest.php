<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\PromotionType;
use App\Helpers\Money;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A deal of the day or a drop, new or edited. The checks that depend on the product
 * (its sizes, its usual price, its stock) and on other offers run after the basic rules.
 */
final class PromotionRequest extends FormRequest
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
            'type' => ['required', Rule::enum(PromotionType::class)],
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')],
            'storage' => ['nullable', 'string', 'max:60'],
            'price' => ['required', 'numeric', 'min:1', 'max:99999999'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at', Rule::requiredIf(fn () => $this->input('type') === PromotionType::DealOfDay->value)],
            'quantity_limit' => ['nullable', 'integer', 'min:1', 'max:100000', Rule::requiredIf(fn () => $this->input('type') === PromotionType::Drop->value)],
            'per_order_limit' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'headline' => ['nullable', 'string', 'max:120'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'product_id.required' => 'Choose the product this offer is for.',
            'product_id.exists' => 'Choose a product from the list.',
            'price.required' => 'Enter the offer price.',
            'starts_at.required' => 'Choose when the offer starts.',
            'ends_at.required' => 'Choose when the deal ends.',
            'ends_at.after' => 'The end must be after the start.',
            'quantity_limit.required' => 'Enter how many units are in the drop.',
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $product = Product::find($this->input('product_id'));
            $storage = trim((string) $this->input('storage')) ?: null;
            $type = PromotionType::from($this->input('type'));
            $editing = $this->route('id');

            // Products sold in sizes: the offer is for one of them
            $sizes = array_filter(array_map(fn ($option) => is_array($option) ? ($option['storage'] ?? null) : null, $product->storage_options));
            if ($sizes !== [] && $storage === null) {
                $validator->errors()->add('storage', 'This product comes in sizes. Choose the size the offer price is for.');

                return;
            }
            if ($sizes === [] && $storage !== null) {
                $validator->errors()->add('storage', 'This product is not sold in sizes.');

                return;
            }

            $usual = $product->priceFor($storage);
            if ($usual === null) {
                $validator->errors()->add('storage', "This product is not sold in {$storage}.");

                return;
            }

            if ((float) $this->input('price') >= $usual) {
                $validator->errors()->add('price', 'The offer price must be lower than the usual price of '.Money::naira($usual).'.');
            }

            $ends = $this->filled('ends_at') ? Carbon::parse($this->input('ends_at')) : null;
            if ($ends !== null && $ends->isPast()) {
                $validator->errors()->add('ends_at', 'The end is already in the past.');
            }

            if ($type === PromotionType::Drop && (int) $this->input('quantity_limit') > (int) $product->stock_quantity) {
                $validator->errors()->add('quantity_limit', "Only {$product->stock_quantity} in stock. Raise the stock count on the product first, or drop fewer.");
            }

            $others = Promotion::query()->current()->where('type', $type->value)->when($editing, fn ($query) => $query->where('id', '!=', $editing));

            if ($type === PromotionType::DealOfDay) {
                // One deal of the day at a time
                $starts = Carbon::parse($this->input('starts_at'));
                $clash = $others->with('product')->get()->first(
                    fn (Promotion $other) => ($other->starts_at === null || $ends === null || $other->starts_at->lt($ends))
                        && ($other->ends_at === null || $other->ends_at->gt($starts))
                );
                if ($clash) {
                    $validator->errors()->add('starts_at', sprintf(
                        'There is already a deal of the day for that time: %s. Choose another day, or end that deal first.',
                        $clash->product?->product_name ?? 'another product'
                    ));
                }
            } elseif ($others->where('product_id', $product->id)->exists()) {
                $validator->errors()->add('product_id', 'This product already has a drop that has not ended.');
            }
        }];
    }
}
