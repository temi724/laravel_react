<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Category::latest()->get();
    }

    /**
     * Every category with how many products it holds, for the admin Categories page.
     */
    public function adminIndex(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'categories' => Category::withCount('products')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('categories', 'name')],
        ], $this->messages());

        $category = Category::create(['name' => trim($validated['name'])]);

        return response()->json($category->loadCount('products'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = Category::findOrFail($id);
        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('categories', 'name')->ignore($category->id)],
        ], $this->messages());

        $category->update(['name' => trim($validated['name'])]);

        return response()->json($category->loadCount('products'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $category = Category::withCount('products')->findOrFail($id);

        // Deleting a category in the database takes its products with it, so only an empty one may go
        if ($category->products_count > 0) {
            return response()->json([
                'message' => sprintf(
                    '%s still has %d %s. Move them to another category or delete them first.',
                    $category->name,
                    $category->products_count,
                    $category->products_count === 1 ? 'product' : 'products'
                ),
            ], 422);
        }

        $category->delete();

        return response()->json(null, 204);
    }

    /**
     * Get category with its products
     */
    public function showWithProducts(string $id)
    {
        $category = Category::with('products')->findOrFail($id);
        return response()->json($category);
    }

    private function messages(): array
    {
        return [
            'name.required' => 'Enter a name for the category.',
            'name.unique' => 'There is already a category with that name.',
            'name.max' => 'Keep the name under 100 characters.',
        ];
    }
}
