<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\PromotionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\BundleRequest;
use App\Http\Requests\PromotionRequest;
use App\Models\Bundle;
use App\Models\Product;
use App\Models\Promotion;
use App\Services\Offers;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * The deal of the day, drops and bundles: what the store shows, and the admin's management of them.
 */
final class OfferController extends Controller
{
    public function __construct(private readonly Offers $offers) {}

    /**
     * What is on offer right now, for the storefront (public).
     */
    public function storefront(): JsonResponse
    {
        return response()->json($this->offers->storefront());
    }

    /**
     * Every promotion and bundle, for the admin Offers page.
     */
    public function index(): JsonResponse
    {
        $promotions = Promotion::query()->with('product.category')->latest('starts_at')->latest('id')->limit(200)->get();
        $bundles = Bundle::query()->with('items.product.category')->latest()->latest('id')->get();

        return response()->json([
            'success' => true,
            'promotions' => $promotions->map(fn (Promotion $promotion) => $this->offers->present($promotion))->all(),
            'bundles' => $bundles->map(fn (Bundle $bundle) => $this->offers->presentBundle($bundle))->all(),
        ]);
    }

    public function storePromotion(PromotionRequest $request): JsonResponse
    {
        $promotion = Promotion::create($this->promotionData($request) + [
            'created_by' => $request->attributes->get('admin')?->id,
        ]);

        return $this->promotionSaved($promotion, 201);
    }

    public function updatePromotion(PromotionRequest $request, string $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->update($this->promotionData($request));

        return $this->promotionSaved($promotion);
    }

    /**
     * Stop a promotion now. It keeps its record of what was sold.
     */
    public function endPromotion(string $id): JsonResponse
    {
        $promotion = Promotion::findOrFail($id);
        $promotion->update(['ends_at' => now()]);

        return $this->promotionSaved($promotion);
    }

    public function destroyPromotion(string $id): JsonResponse
    {
        Promotion::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    public function storeBundle(BundleRequest $request): JsonResponse
    {
        $bundle = $this->saveBundle(new Bundle(['created_by' => $request->attributes->get('admin')?->id]), $request);

        return response()->json(['success' => true, 'bundle' => $this->offers->presentBundle($bundle)], 201);
    }

    public function updateBundle(BundleRequest $request, string $id): JsonResponse
    {
        $bundle = $this->saveBundle(Bundle::findOrFail($id), $request);

        return response()->json(['success' => true, 'bundle' => $this->offers->presentBundle($bundle)]);
    }

    public function destroyBundle(string $id): JsonResponse
    {
        DB::transaction(function () use ($id): void {
            $bundle = Bundle::findOrFail($id);
            $bundle->items()->delete();
            $bundle->delete();
        });

        return response()->json(['success' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function promotionData(PromotionRequest $request): array
    {
        $data = $request->validated();
        $isDrop = $data['type'] === PromotionType::Drop->value;

        return [
            'type' => $data['type'],
            'product_id' => $data['product_id'],
            'storage' => trim((string) ($data['storage'] ?? '')) ?: null,
            'price' => $data['price'],
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'] ?? null,
            // Only a drop is limited in number
            'quantity_limit' => $isDrop ? $data['quantity_limit'] : null,
            'per_order_limit' => $data['per_order_limit'] ?? null,
            'headline' => $data['headline'] ?? null,
            'is_active' => true,
        ];
    }

    private function promotionSaved(Promotion $promotion, int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'promotion' => $this->offers->present($promotion->fresh()->load('product.category')),
        ], $status);
    }

    private function saveBundle(Bundle $bundle, BundleRequest $request): Bundle
    {
        $data = $request->validated();

        return DB::transaction(function () use ($bundle, $data): Bundle {
            $bundle->fill([
                'name' => trim($data['name']),
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'is_active' => (bool) ($data['is_active'] ?? true),
            ])->save();

            // The items are replaced as a whole: simpler than matching old rows to new ones
            $bundle->items()->delete();
            $products = Product::query()->findMany(array_column($data['items'], 'product_id'))->keyBy('id');

            foreach (array_values($data['items']) as $position => $item) {
                $sized = $products[$item['product_id']]->storage_options !== [];

                $bundle->items()->create([
                    'product_id' => $item['product_id'],
                    'storage' => $sized ? (trim((string) ($item['storage'] ?? '')) ?: null) : null,
                    'quantity' => $item['quantity'],
                    'position' => $position,
                ]);
            }

            return $bundle->fresh()->load('items.product.category');
        });
    }
}
