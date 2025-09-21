<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Deal;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    /**
     * @OA\Get(
     *     path="/admins",
     *     summary="Get all admins",
     *     description="Retrieve a list of all administrators",
     *     operationId="getAdmins",
     *     tags={"Admins"},
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Admin")
     *         )
     *     )
     * )
     */
    public function index(): JsonResponse
    {
        $admins = Admin::all();
        return response()->json($admins);
    }

    /**
     * @OA\Post(
     *     path="/admins",
     *     summary="Create a new admin",
     *     description="Create a new administrator account",
     *     operationId="createAdmin",
     *     tags={"Admins"},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Admin data",
     *         @OA\JsonContent(
     *             required={"name", "email", "password", "phone_number"},
     *             @OA\Property(property="name", type="string", maxLength=255, example="John Smith"),
     *             @OA\Property(property="email", type="string", format="email", example="john.smith@admin.com"),
     *             @OA\Property(property="password", type="string", minLength=6, example="password123"),
     *             @OA\Property(property="phone_number", type="string", maxLength=20, example="+1234567890")
     *         )
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Admin created successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Admin")
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="The given data was invalid."),
     *             @OA\Property(property="errors", type="object")
     *         )
     *     )
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:admins,email',
            'password' => 'required|string|min:6',
            'phone_number' => 'required|string|max:20',
        ]);

        $admin = Admin::create($validated);

        return response()->json($admin, 201);
    }

    /**
     * @OA\Get(
     *     path="/admins/{id}",
     *     summary="Get admin by ID",
     *     description="Retrieve a specific administrator by their ID",
     *     operationId="getAdminById",
     *     tags={"Admins"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Admin ID",
     *         required=true,
     *         @OA\Schema(type="string", example="68b74ba7002cda59000d800c")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Successful operation",
     *         @OA\JsonContent(ref="#/components/schemas/Admin")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Admin not found"
     *     )
     * )
     */
    public function show(string $id): JsonResponse
    {
        $admin = Admin::findOrFail($id);
        return response()->json($admin);
    }

    /**
     * @OA\Put(
     *     path="/admins/{id}",
     *     summary="Update admin",
     *     description="Update an existing administrator",
     *     operationId="updateAdmin",
     *     tags={"Admins"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Admin ID",
     *         required=true,
     *         @OA\Schema(type="string", example="68b74ba7002cda59000d800c")
     *     ),
     *     @OA\RequestBody(
     *         description="Admin data to update",
     *         @OA\JsonContent(
     *             @OA\Property(property="name", type="string", maxLength=255, example="John Smith Updated"),
     *             @OA\Property(property="email", type="string", format="email", example="john.updated@admin.com"),
     *             @OA\Property(property="password", type="string", minLength=6, example="newpassword123"),
     *             @OA\Property(property="phone_number", type="string", maxLength=20, example="+1987654321")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Admin updated successfully",
     *         @OA\JsonContent(ref="#/components/schemas/Admin")
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Admin not found"
     *     ),
     *     @OA\Response(
     *         response=422,
     *         description="Validation error"
     *     )
     * )
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $admin = Admin::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:admins,email,' . $id,
            'password' => 'sometimes|required|string|min:6',
            'phone_number' => 'sometimes|required|string|max:20',
        ]);

        $admin->update($validated);

        return response()->json($admin);
    }

    /**
     * @OA\Delete(
     *     path="/admins/{id}",
     *     summary="Delete admin",
     *     description="Delete an administrator",
     *     operationId="deleteAdmin",
     *     tags={"Admins"},
     *     @OA\Parameter(
     *         name="id",
     *         in="path",
     *         description="Admin ID",
     *         required=true,
     *         @OA\Schema(type="string", example="68b74ba7002cda59000d800c")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Admin deleted successfully",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Admin deleted successfully")
     *         )
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Admin not found"
     *     )
     * )
     */
    public function destroy(string $id): JsonResponse
    {
        $admin = Admin::findOrFail($id);
        $admin->delete();

        return response()->json(['message' => 'Admin deleted successfully']);
    }

    /**
     * @OA\Post(
     *     path="/admin/login",
     *     summary="Admin login",
     *     description="Authenticate admin with email and password",
     *     operationId="adminLogin",
     *     tags={"Authentication"},
     *     @OA\RequestBody(
     *         required=true,
     *         description="Login credentials",
     *         @OA\JsonContent(
     *             required={"email", "password"},
     *             @OA\Property(property="email", type="string", format="email", example="admin@test.com"),
     *             @OA\Property(property="password", type="string", example="password123")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Login successful",
     *         @OA\JsonContent(
     *             @OA\Property(property="message", type="string", example="Login successful"),
     *             @OA\Property(property="admin", ref="#/components/schemas/Admin"),
     *             @OA\Property(property="admin_id", type="string", example="68b74ba7002cda59000d800c")
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Invalid credentials",
     *         @OA\JsonContent(
     *             @OA\Property(property="error", type="string", example="Invalid credentials"),
     *             @OA\Property(property="message", type="string", example="Email or password is incorrect")
     *         )
     *     )
     * )
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Find admin by email
        $admin = Admin::where('email', $validated['email'])->first();

        // Debug: Log the attempt
        Log::info('Login attempt for email: ' . $validated['email']);

        if (!$admin) {
            Log::info('Admin not found for email: ' . $validated['email']);
            return response()->json([
                'error' => 'Invalid credentials',
                'message' => 'Email or password is incorrect'
            ], 401);
        }

        Log::info('Admin found: ' . $admin->name . ', checking password...');

        // Check password
        $passwordCheck = $admin->checkPassword($validated['password']);
        Log::info('Password check result: ' . ($passwordCheck ? 'SUCCESS' : 'FAILED'));

        if (!$passwordCheck) {
            return response()->json([
                'error' => 'Invalid credentials',
                'message' => 'Email or password is incorrect'
            ], 401);
        }

        Log::info('Login successful for admin: ' . $admin->name);

        // Store admin session for future requests
        session([
            'admin_id' => $admin->id,
            'admin_logged_in' => true,
            'admin_name' => $admin->name
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'admin' => $admin,
            'admin_id' => $admin->id
        ]);
    }

    /**
     * Get dashboard statistics
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        try {
            // Get statistics
            $totalProducts = \App\Models\Product::count();
            $totalDeals = \App\Models\Deal::count();
            $totalSales = \App\Models\Sales::count();
            $pendingOrders = \App\Models\Sales::where('order_status', false)->count();
            $completedOrders = \App\Models\Sales::where('order_status', true)->count();

            // Calculate total revenue dynamically from order_details
            $totalRevenue = 0;
            $salesWithDetails = \App\Models\Sales::whereNotNull('order_details')->get(['order_details']);
            foreach ($salesWithDetails as $sale) {
                $orderDetails = $sale->order_details; // Already cast as array by model
                if (is_array($orderDetails)) {
                    foreach ($orderDetails as $item) {
                        if (isset($item['subtotal'])) {
                            $totalRevenue += $item['subtotal'];
                        }
                    }
                }
            }

            $pendingPayments = \App\Models\Sales::where('payment_status', 'pending')->count();
            $completedPayments = \App\Models\Sales::where('payment_status', 'completed')->count();

            // Recent sales (last 10) - calculate total for each sale
            $recentSalesRaw = \App\Models\Sales::orderBy('created_at', 'desc')
                ->limit(10)
                ->get(['id', 'order_id', 'username', 'order_details', 'order_status', 'payment_status', 'created_at']);

            // Calculate total for each recent sale
            $recentSales = $recentSalesRaw->map(function ($sale) {
                $total = 0;
                $orderDetails = $sale->order_details; // Already cast as array by model
                if (is_array($orderDetails)) {
                    foreach ($orderDetails as $item) {
                        if (isset($item['subtotal'])) {
                            $total += $item['subtotal'];
                        }
                    }
                }

                return [
                    'id' => $sale->id,
                    'order_id' => $sale->order_id,
                    'username' => $sale->username,
                    'total_amount' => $total,
                    'order_status' => $sale->order_status,
                    'payment_status' => $sale->payment_status,
                    'created_at' => $sale->created_at,
                ];
            });

            return response()->json([
                'success' => true,
                'stats' => [
                    'products' => $totalProducts,
                    'deals' => $totalDeals,
                    'total_sales' => $totalSales,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'total_revenue' => $totalRevenue,
                    'pending_payments' => $pendingPayments,
                    'completed_payments' => $completedPayments,
                ],
                'recent_sales' => $recentSales
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting dashboard stats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading dashboard statistics'
            ], 500);
        }
    }

    /**
     * Get admin products with search and filtering
     */
    public function getProducts(Request $request): JsonResponse
    {
        try {
            $typeFilter = $request->get('type', 'all');
            
            $products = collect();
            $deals = collect();

            // Fetch products if needed
            if ($typeFilter === 'all' || $typeFilter === 'product') {
                $productQuery = \App\Models\Product::query();

                // Search functionality for products
                if ($request->has('search') && !empty($request->search)) {
                    $searchTerm = $request->search;
                    $productQuery->where(function ($q) use ($searchTerm) {
                        $q->where('product_name', 'like', "%{$searchTerm}%")
                          ->orWhere('description', 'like', "%{$searchTerm}%")
                          ->orWhere('id', 'like', "%{$searchTerm}%");
                    });
                }

                // Category filter for products
                if ($request->has('category') && $request->category !== 'all') {
                    $productQuery->where('category_id', $request->category);
                }

                // Status filter for products
                if ($request->has('status') && $request->status !== 'all') {
                    if ($request->status === 'in_stock') {
                        $productQuery->where('in_stock', true);
                    } elseif ($request->status === 'out_of_stock') {
                        $productQuery->where('in_stock', false);
                    }
                }

                $products = $productQuery->with('category')->orderBy('created_at', 'desc')->get();
            }

            // Fetch deals if needed
            if ($typeFilter === 'all' || $typeFilter === 'deal') {
                $dealQuery = \App\Models\Deal::query();

                // Search functionality for deals
                if ($request->has('search') && !empty($request->search)) {
                    $searchTerm = $request->search;
                    $dealQuery->where(function ($q) use ($searchTerm) {
                        $q->where('product_name', 'like', "%{$searchTerm}%")
                          ->orWhere('description', 'like', "%{$searchTerm}%")
                          ->orWhere('id', 'like', "%{$searchTerm}%");
                    });
                }

                // Category filter for deals
                if ($request->has('category') && $request->category !== 'all') {
                    $dealQuery->where('category_id', $request->category);
                }

                // Status filter for deals
                if ($request->has('status') && $request->status !== 'all') {
                    if ($request->status === 'in_stock') {
                        $dealQuery->where('in_stock', true);
                    } elseif ($request->status === 'out_of_stock') {
                        $dealQuery->where('in_stock', false);
                    }
                }

                $deals = $dealQuery->with('category')->orderBy('created_at', 'desc')->get();
            }

            return response()->json([
                'success' => true,
                'products' => $products,
                'deals' => $deals,
                'total' => $products->count() + $deals->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting products: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading products'
            ], 500);
        }
    }

    /**
     * Get admin deals with search and filtering
     */
    public function getDeals(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\Deal::query();

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('title', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhere('id', 'like', "%{$searchTerm}%");
                });
            }

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'active') {
                    $query->where('is_active', true);
                } elseif ($request->status === 'inactive') {
                    $query->where('is_active', false);
                }
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $deals = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'deals' => $deals->items(),
                'totalPages' => $deals->lastPage(),
                'currentPage' => $deals->currentPage(),
                'total' => $deals->total()
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting deals: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading deals'
            ], 500);
        }
    }

    /**
     * Create a new deal
     */
    public function createDeal(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_name' => 'required|string',
                'category_id' => 'nullable|string|exists:categories,id',
                'price' => 'required|numeric',
                'old_price' => 'required|numeric',
                'overview' => 'nullable|string',
                'description' => 'nullable|string',
                'about' => 'nullable|string',
                'reviews' => 'nullable|array',
                'images_url' => 'nullable|array',
                'colors' => 'nullable|array',
                'what_is_included' => 'nullable|array',
                'specification' => 'nullable|array',
                'specification.*.key' => 'required_with:specification|string',
                'specification.*.value' => 'required_with:specification|string',
                'storage_options' => 'nullable|array',
                'storage_options.*.storage' => 'required_with:storage_options|string',
                'storage_options.*.price' => 'required_with:storage_options|numeric',
                'product_status' => 'nullable|string|in:new,uk_used,refurbished',
                'in_stock' => 'boolean',
                'product_images.*' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:2048'
            ]);

            // Handle image uploads
            $uploadedImageUrls = [];
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $image) {
                    if ($image && $image->isValid()) {
                        // Generate a unique filename
                        $filename = Str::random(40) . '.' . $image->getClientOriginalExtension();
                        
                        // Store the image in the images/products directory
                        $path = Storage::disk('images')->putFileAs('products', $image, $filename);
                        
                        // Generate the public URL
                        $uploadedImageUrls[] = '/images/products/' . $filename;
                    }
                }
            }

            // Combine uploaded images with any existing images_url
            $allImageUrls = $uploadedImageUrls;
            if (!empty($validated['images_url'])) {
                $allImageUrls = array_merge($allImageUrls, $validated['images_url']);
            }

            // Update the validated data with the combined image URLs
            $validated['images_url'] = $allImageUrls;

            // Remove product_images from validated data as it's not a database field
            unset($validated['product_images']);

            // Process specification array into object format
            if (isset($validated['specification']) && is_array($validated['specification'])) {
                $specificationObject = [];
                foreach ($validated['specification'] as $spec) {
                    if (isset($spec['key']) && isset($spec['value'])) {
                        $specificationObject[$spec['key']] = $spec['value'];
                    }
                }
                $validated['specification'] = $specificationObject;
            }

            $deal = \App\Models\Deal::create($validated);

            // Log the admin who created the deal
            $admin = $request->get('authenticated_admin');
            Log::info('Deal created by admin: ' . $admin->name . ' (ID: ' . $admin->id . ')');

            return response()->json([
                'success' => true,
                'message' => 'Deal created successfully',
                'deal' => $deal,
                'created_by_admin' => $admin->name
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating deal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating deal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new product
     */
    public function createProduct(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'product_name' => 'required|string',
                'category_id' => 'nullable|string|exists:categories,id',
                'price' => 'required|numeric',
                'overview' => 'nullable|string',
                'description' => 'nullable|string',
                'about' => 'nullable|string',
                'reviews' => 'nullable|array',
                'images_url' => 'nullable|array',
                'colors' => 'nullable|array',
                'what_is_included' => 'nullable|array',
                'specification' => 'nullable|array',
                'specification.*.key' => 'required_with:specification|string',
                'specification.*.value' => 'required_with:specification|string',
                'product_status' => 'nullable|string|in:new,uk_used,refurbished',
                'in_stock' => 'boolean',
                'product_images.*' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:2048'
            ]);

            // Handle image uploads
            $uploadedImageUrls = [];
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $image) {
                    if ($image && $image->isValid()) {
                        // Generate a unique filename
                        $filename = Str::random(40) . '.' . $image->getClientOriginalExtension();
                        
                        // Store the image in the images/products directory
                        $path = Storage::disk('images')->putFileAs('products', $image, $filename);
                        
                        // Generate the public URL
                        $uploadedImageUrls[] = '/images/products/' . $filename;
                    }
                }
            }

            // Combine uploaded images with any existing images_url
            $allImageUrls = $uploadedImageUrls;
            if (!empty($validated['images_url'])) {
                $allImageUrls = array_merge($allImageUrls, $validated['images_url']);
            }

            // Update the validated data with the combined image URLs
            $validated['images_url'] = $allImageUrls;

            // Remove product_images from validated data as it's not a database field
            unset($validated['product_images']);

            // Process specification array into object format
            if (isset($validated['specification']) && is_array($validated['specification'])) {
                $specificationObject = [];
                foreach ($validated['specification'] as $spec) {
                    if (isset($spec['key']) && isset($spec['value'])) {
                        $specificationObject[$spec['key']] = $spec['value'];
                    }
                }
                $validated['specification'] = $specificationObject;
            }

            $product = \App\Models\Product::create($validated);

            // Log the admin who created the product
            $admin = $request->get('authenticated_admin');
            Log::info('Product created by admin: ' . $admin->name . ' (ID: ' . $admin->id . ')');

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'product' => $product,
                'created_by_admin' => $admin->name
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating product: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error creating product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get admin sales with search and filtering
     */
    public function getSales(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\Sales::query();

            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('username', 'like', "%{$searchTerm}%")
                      ->orWhere('emailaddress', 'like', "%{$searchTerm}%")
                      ->orWhere('order_id', 'like', "%{$searchTerm}%")
                      ->orWhere('phonenumber', 'like', "%{$searchTerm}%");
                });
            }

            // Status filter
            if ($request->has('status') && $request->status !== 'all') {
                if ($request->status === 'pending') {
                    $query->where('order_status', false);
                } elseif ($request->status === 'completed') {
                    $query->where('order_status', true);
                }
            }

            // Payment filter
            if ($request->has('payment') && $request->payment !== 'all') {
                $query->where('payment_status', $request->payment);
            }

            // Order type filter
            if ($request->has('order_type') && $request->order_type !== 'all') {
                $query->where('order_type', $request->order_type);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $sales = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'sales' => $sales->items(),
                'totalPages' => $sales->lastPage(),
                'currentPage' => $sales->currentPage(),
                'total' => $sales->total()
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting sales: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading sales'
            ], 500);
        }
    }

    /**
     * Get specific sale/order details
     */
    public function getSale(Request $request, $id): JsonResponse
    {
        try {
            $sale = \App\Models\Sales::findOrFail($id);

            return response()->json([
                'success' => true,
                'order' => $sale
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting sale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }
    }

    /**
     * Get invoice data for React component
     */
    public function getInvoiceData(Request $request, $id): JsonResponse
    {
        try {
            $sale = \App\Models\Sales::findOrFail($id);

            // Parse order details and calculate total
            $orderDetails = $sale->order_details ?: [];
            $total = collect($orderDetails)->sum('subtotal');

            return response()->json([
                'success' => true,
                'invoice' => [
                    'sale' => $sale,
                    'order_details' => $orderDetails,
                    'total' => $total
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting invoice data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Invoice data not found'
            ], 404);
        }
    }

    /**
     * Update sale status
     */
    public function updateSaleStatus(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'required|string|in:pending,completed'
            ]);

            $sale = \App\Models\Sales::findOrFail($id);
            $sale->order_status = $validated['status'] === 'completed';
            $sale->save();

            return response()->json([
                'success' => true,
                'message' => 'Order status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating sale status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating order status'
            ], 500);
        }
    }

    /**
     * Update sale payment status
     */
    public function updateSalePaymentStatus(Request $request, $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_status' => 'required|string|in:pending,completed,failed,refunded'
            ]);

            $sale = \App\Models\Sales::findOrFail($id);
            $sale->payment_status = $validated['payment_status'];
            $sale->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating payment status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating payment status'
            ], 500);
        }
    }

    /**
     * Get monthly sales data for chart
     */
    public function getMonthlySalesData(Request $request): JsonResponse
    {
        try {
            // Get sales with confirmed payments and orders only
            $monthlySales = \App\Models\Sales::selectRaw('
                    DATE_FORMAT(created_at, "%Y-%m") as month,
                    DATE_FORMAT(created_at, "%b") as month_short,
                    COUNT(*) as sales_count
                ')
                ->where('payment_status', 'completed')
                ->where('order_status', 1)
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month', 'month_short')
                ->orderBy('month')
                ->get();

            // Calculate total revenue for each month
            $result = [];
            foreach ($monthlySales as $monthData) {
                $sales = \App\Models\Sales::whereRaw('DATE_FORMAT(created_at, "%Y-%m") = ?', [$monthData->month])
                    ->where('payment_status', 'completed')
                    ->where('order_status', 1)
                    ->get();
                
                $totalRevenue = 0;
                foreach ($sales as $sale) {
                    $orderDetails = $sale->order_details ?: [];
                    foreach ($orderDetails as $detail) {
                        $totalRevenue += floatval($detail['subtotal'] ?? 0);
                    }
                }
                
                $result[] = [
                    'month' => $monthData->month_short,
                    'sales' => intval($monthData->sales_count),
                    'revenue' => $totalRevenue
                ];
            }

            // If no data, generate some months with 0 values for the chart
            if (empty($result)) {
                $months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                foreach ($months as $month) {
                    $result[] = [
                        'month' => $month,
                        'sales' => 0,
                        'revenue' => 0
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting monthly sales data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting monthly sales data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get top selling items
     */
    public function getTopSellingItems(Request $request): JsonResponse
    {
        try {
            // Get all confirmed sales from current month
            $currentMonthSales = \App\Models\Sales::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->where('payment_status', 'completed')
                ->where('order_status', 1)
                ->get();

            $productStats = [];

            // Process each sale's order details
            foreach ($currentMonthSales as $sale) {
                $orderDetails = $sale->order_details ?: [];
                foreach ($orderDetails as $detail) {
                    $productId = $detail['id'] ?? null;
                    $productName = $detail['name'] ?? 'Unknown Product';
                    $quantity = intval($detail['quantity'] ?? 1);
                    $subtotal = floatval($detail['subtotal'] ?? 0);

                    $key = $productId ?: $productName;

                    if (!isset($productStats[$key])) {
                        // Try to get product image from database
                        $productImage = null;
                        if ($productId) {
                            $product = \App\Models\Product::find($productId);
                            if ($product && $product->image_url) {
                                $productImage = $product->image_url;
                            }
                        }

                        $productStats[$key] = [
                            'id' => $productId,
                            'name' => $productName,
                            'image' => $productImage,
                            'quantity_sold' => 0,
                            'total_revenue' => 0
                        ];
                    }

                    $productStats[$key]['quantity_sold'] += $quantity;
                    $productStats[$key]['total_revenue'] += $subtotal;
                }
            }

            // Sort by quantity sold and get top 3
            $topItems = collect($productStats)
                ->sortByDesc('quantity_sold')
                ->take(3)
                ->values()
                ->all();

            return response()->json([
                'success' => true,
                'data' => $topItems
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting top selling items: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting top selling items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a product
     */
    public function updateProduct(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $validated = $request->validate([
                'product_name' => 'required|string',
                'category_id' => 'nullable|string|exists:categories,id',
                'price' => 'required|numeric',
                'old_price' => 'nullable|numeric',
                'overview' => 'nullable|string',
                'description' => 'nullable|string',
                'about' => 'nullable|string',
                'product_status' => 'nullable|string|in:new,uk_used,refurbished',
                'colors' => 'nullable|array',
                'what_is_included' => 'nullable|array',
                'specification' => 'nullable|array',
                'in_stock' => 'nullable|boolean',
                'has_storage' => 'nullable|boolean',
                'storage_options' => 'nullable|array',
                'storage_options.*.storage' => 'required_with:storage_options|string',
                'storage_options.*.price' => 'required_with:storage_options|numeric',
                'product_images' => 'nullable|array',
                'product_images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
                'existing_images' => 'nullable|array'
            ]);

            // Handle image management
            $imageUrls = [];
            
            // Keep existing images that weren't removed
            if ($request->has('existing_images')) {
                $imageUrls = $request->input('existing_images');
            }

            // Handle new image uploads
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $image) {
                    if ($image && $image->isValid()) {
                        // Generate a unique filename
                        $filename = Str::random(40) . '.' . $image->getClientOriginalExtension();
                        
                        // Store the image in the images/products directory
                        $path = Storage::disk('images')->putFileAs('products', $image, $filename);
                        
                        // Generate the public URL
                        $imageUrls[] = '/images/products/' . $filename;
                    }
                }
            }

            // Update validated data with processed images
            $validated['images_url'] = $imageUrls;

            // Convert string to boolean for checkboxes
            if ($request->has('in_stock')) {
                $validated['in_stock'] = $request->input('in_stock') === '1' || $request->input('in_stock') === true;
            }

            if ($request->has('has_storage')) {
                $validated['has_storage'] = $request->input('has_storage') === '1' || $request->input('has_storage') === true;
            }

            // Remove has_storage from the data since it's not a database field
            unset($validated['has_storage']);

            // Process specification array back to object format
            if (isset($validated['specification']) && is_array($validated['specification'])) {
                $specificationObject = [];
                foreach ($validated['specification'] as $spec) {
                    if (isset($spec['key']) && isset($spec['value'])) {
                        $specificationObject[$spec['key']] = $spec['value'];
                    }
                }
                $validated['specification'] = $specificationObject;
            }

            $product->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'product' => $product->load('category')
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating product: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating product: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a product
     */
    public function deleteProduct(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::find($id);
            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting product: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting product',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a deal
     */
    public function updateDeal(Request $request, $id): JsonResponse
    {
        try {
            $deal = Deal::find($id);
            if (!$deal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deal not found'
                ], 404);
            }

            $validated = $request->validate([
                'product_name' => 'required|string',
                'category_id' => 'nullable|string|exists:categories,id',
                'price' => 'required|numeric',
                'old_price' => 'nullable|numeric',
                'overview' => 'nullable|string',
                'description' => 'nullable|string',
                'about' => 'nullable|string',
                'product_status' => 'nullable|string|in:new,uk_used,refurbished',
                'colors' => 'nullable|array',
                'what_is_included' => 'nullable|array',
                'specification' => 'nullable|array',
                'in_stock' => 'nullable|boolean',
                'has_storage' => 'nullable|boolean',
                'storage_options' => 'nullable|array',
                'storage_options.*.storage' => 'required_with:storage_options|string',
                'storage_options.*.price' => 'required_with:storage_options|numeric',
                'product_images' => 'nullable|array',
                'product_images.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
                'existing_images' => 'nullable|array'
            ]);

            // Handle image management
            $imageUrls = [];
            
            // Keep existing images that weren't removed
            if ($request->has('existing_images')) {
                $imageUrls = $request->input('existing_images');
            }

            // Handle new image uploads
            if ($request->hasFile('product_images')) {
                foreach ($request->file('product_images') as $image) {
                    if ($image && $image->isValid()) {
                        // Generate a unique filename
                        $filename = Str::random(40) . '.' . $image->getClientOriginalExtension();
                        
                        // Store the image in the images/products directory
                        $path = Storage::disk('images')->putFileAs('products', $image, $filename);
                        
                        // Generate the public URL
                        $imageUrls[] = '/images/products/' . $filename;
                    }
                }
            }

            // Update validated data with processed images
            $validated['images_url'] = $imageUrls;

            // Convert string to boolean for checkboxes
            if ($request->has('in_stock')) {
                $validated['in_stock'] = $request->input('in_stock') === '1' || $request->input('in_stock') === true;
            }

            if ($request->has('has_storage')) {
                $validated['has_storage'] = $request->input('has_storage') === '1' || $request->input('has_storage') === true;
            }

            // Remove has_storage from the data since it's not a database field
            unset($validated['has_storage']);

            // Process specification array back to object format
            if (isset($validated['specification']) && is_array($validated['specification'])) {
                $specificationObject = [];
                foreach ($validated['specification'] as $spec) {
                    if (isset($spec['key']) && isset($spec['value'])) {
                        $specificationObject[$spec['key']] = $spec['value'];
                    }
                }
                $validated['specification'] = $specificationObject;
            }

            $deal->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Deal updated successfully',
                'deal' => $deal->load('category')
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating deal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error updating deal: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a deal
     */
    public function deleteDeal(Request $request, $id): JsonResponse
    {
        try {
            $deal = Deal::find($id);
            if (!$deal) {
                return response()->json([
                    'success' => false,
                    'message' => 'Deal not found'
                ], 404);
            }

            $deal->delete();

            return response()->json([
                'success' => true,
                'message' => 'Deal deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting deal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error deleting deal',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
