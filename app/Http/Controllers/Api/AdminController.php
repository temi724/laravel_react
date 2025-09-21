<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Product;
use App\Models\Deal;
use App\Models\PageVisit;
use App\Models\ProductView;
use App\Models\UserSession;
use App\Models\CheckoutEvent;
use App\Models\TrafficSource;
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
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Build base query with date filtering
            $baseQuery = function ($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->where('created_at', '>=', $startDate . ' 00:00:00');
                }
                if ($endDate) {
                    $query->where('created_at', '<=', $endDate . ' 23:59:59');
                }
                return $query;
            };

            // Get statistics with date filtering
            $totalProducts = \App\Models\Product::when($startDate || $endDate, $baseQuery)->count();
            $totalDeals = \App\Models\Deal::when($startDate || $endDate, $baseQuery)->count();
            $totalSales = \App\Models\Sales::when($startDate || $endDate, $baseQuery)->count();

            // Online vs Offline sales breakdown
            $onlineSales = \App\Models\Sales::where('sale_type', 'online')
                ->when($startDate || $endDate, $baseQuery)->count();
            $offlineSales = \App\Models\Sales::where('sale_type', 'offline')
                ->when($startDate || $endDate, $baseQuery)->count();

            $pendingOrders = \App\Models\Sales::where('order_status', false)
                ->when($startDate || $endDate, $baseQuery)->count();
            $completedOrders = \App\Models\Sales::where('order_status', true)
                ->when($startDate || $endDate, $baseQuery)->count();

            // Calculate total revenue dynamically from multiple sources with date filtering
            $totalRevenue = 0;
            $onlineRevenue = 0;
            $offlineRevenue = 0;

            // Get all sales for revenue calculation
            $allSales = \App\Models\Sales::when($startDate || $endDate, $baseQuery)
                ->get(['order_details', 'sale_type', 'total_amount', 'subtotal']);

            foreach ($allSales as $sale) {
                $saleRevenue = 0;

                // Try to get revenue from order_details first (works for both online and offline)
                if (!is_null($sale->order_details)) {
                    $orderDetails = $sale->order_details; // Already cast as array by model
                    if (is_array($orderDetails)) {
                        foreach ($orderDetails as $item) {
                            if (isset($item['subtotal'])) {
                                $saleRevenue += $item['subtotal'];
                            }
                        }
                    }
                }

                // If no revenue from order_details, try total_amount (mainly for offline sales)
                if ($saleRevenue == 0 && !is_null($sale->total_amount)) {
                    $saleRevenue = floatval($sale->total_amount);
                }

                // If still no revenue, try subtotal field (fallback for offline sales)
                if ($saleRevenue == 0 && !is_null($sale->subtotal)) {
                    $saleRevenue = floatval($sale->subtotal);
                }

                $totalRevenue += $saleRevenue;

                // Add to online or offline revenue
                if ($sale->sale_type === 'offline') {
                    $offlineRevenue += $saleRevenue;
                } else {
                    $onlineRevenue += $saleRevenue;
                }
            }

            $pendingPayments = \App\Models\Sales::where('payment_status', 'pending')
                ->when($startDate || $endDate, $baseQuery)->count();
            $completedPayments = \App\Models\Sales::where('payment_status', 'completed')
                ->when($startDate || $endDate, $baseQuery)->count();

            // Calculate received payments revenue (from completed payments) with date filtering
            $receivedPaymentsRevenue = 0;
            $paidSales = \App\Models\Sales::where('payment_status', 'completed')
                ->when($startDate || $endDate, $baseQuery)
                ->get(['order_details', 'total_amount', 'subtotal']);
            foreach ($paidSales as $sale) {
                $saleRevenue = 0;

                // Try to get revenue from order_details first
                if (!is_null($sale->order_details)) {
                    $orderDetails = $sale->order_details;
                    if (is_array($orderDetails)) {
                        foreach ($orderDetails as $item) {
                            if (isset($item['subtotal'])) {
                                $saleRevenue += $item['subtotal'];
                            }
                        }
                    }
                }

                // If no revenue from order_details, try total_amount
                if ($saleRevenue == 0 && !is_null($sale->total_amount)) {
                    $saleRevenue = floatval($sale->total_amount);
                }

                // If still no revenue, try subtotal field
                if ($saleRevenue == 0 && !is_null($sale->subtotal)) {
                    $saleRevenue = floatval($sale->subtotal);
                }

                $receivedPaymentsRevenue += $saleRevenue;
            }

            // Calculate pending deliveries/pickups (paid but not completed) with date filtering
            $pendingDeliveriesPickups = \App\Models\Sales::where('payment_status', 'completed')
                ->where('order_status', false)
                ->when($startDate || $endDate, $baseQuery)
                ->count();

            // Calculate outstanding payments (total revenue - received payments)
            $outstandingPayments = $totalRevenue - $receivedPaymentsRevenue;

            // Recent sales (last 10) with date filtering - calculate total for each sale
            $recentSalesRaw = \App\Models\Sales::orderBy('created_at', 'desc')
                ->when($startDate || $endDate, $baseQuery)
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
                    'online_sales' => $onlineSales,
                    'offline_sales' => $offlineSales,
                    'pending_orders' => $pendingOrders,
                    'completed_orders' => $completedOrders,
                    'total_revenue' => $totalRevenue,
                    'online_revenue' => $onlineRevenue,
                    'offline_revenue' => $offlineRevenue,
                    'pending_payments' => $pendingPayments,
                    'completed_payments' => $completedPayments,
                    'received_payments_revenue' => $receivedPaymentsRevenue,
                    'pending_deliveries_pickups' => $pendingDeliveriesPickups,
                    'outstanding_payments' => $outstandingPayments,
                ],
                'recent_sales' => $recentSales,
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
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
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // If no dates provided, default to start of current month to today
            if (!$startDate || !$endDate) {
                $endDate = now()->format('Y-m-d');
                $startDate = now()->startOfMonth()->format('Y-m-d');
            }

            // Parse dates and generate month range
            $start = \Carbon\Carbon::parse($startDate)->startOfMonth();
            $end = \Carbon\Carbon::parse($endDate)->endOfMonth();

            // Generate months between start and end date
            $monthsArray = [];
            $current = $start->copy();

            while ($current <= $end) {
                $monthsArray[$current->format('Y-m')] = [
                    'month' => $current->format('M'),
                    'year_month' => $current->format('Y-m'),
                    'sales' => 0,
                    'revenue' => 0
                ];
                $current->addMonth();
            }

            // Get actual sales data for the date range
            $monthlySales = \App\Models\Sales::selectRaw('
                    DATE_FORMAT(created_at, "%Y-%m") as month,
                    DATE_FORMAT(created_at, "%b") as month_short,
                    COUNT(*) as sales_count
                ')
                ->where('payment_status', 'completed')
                ->where('order_status', 1)
                ->where('created_at', '>=', $start)
                ->where('created_at', '<=', $end)
                ->groupBy('month', 'month_short')
                ->orderBy('month')
                ->get();

            // Fill in actual data where it exists
            foreach ($monthlySales as $monthData) {
                if (isset($monthsArray[$monthData->month])) {
                    $sales = \App\Models\Sales::whereRaw('DATE_FORMAT(created_at, "%Y-%m") = ?', [$monthData->month])
                        ->where('payment_status', 'completed')
                        ->where('order_status', 1)
                        ->get();

                    $totalRevenue = 0;
                    foreach ($sales as $sale) {
                        $orderDetails = $sale->order_details;

                        // Ensure order_details is an array
                        if (is_string($orderDetails)) {
                            $orderDetails = json_decode($orderDetails, true) ?: [];
                        } elseif (!is_array($orderDetails)) {
                            $orderDetails = [];
                        }

                        foreach ($orderDetails as $detail) {
                            if (is_array($detail)) {
                                $totalRevenue += floatval($detail['subtotal'] ?? 0);
                            }
                        }
                    }

                    $monthsArray[$monthData->month]['sales'] = intval($monthData->sales_count);
                    $monthsArray[$monthData->month]['revenue'] = $totalRevenue;
                }
            }

            // Convert to array and remove year_month key
            $result = array_values($monthsArray);
            foreach ($result as &$item) {
                unset($item['year_month']);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
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
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Build query with date filtering
            $salesQuery = \App\Models\Sales::where('payment_status', 'completed')
                ->where('order_status', 1);

            if ($startDate) {
                $salesQuery->where('created_at', '>=', $startDate . ' 00:00:00');
            }
            if ($endDate) {
                $salesQuery->where('created_at', '<=', $endDate . ' 23:59:59');
            }

            // If no date filters, default to start of current month to today
            if (!$startDate && !$endDate) {
                $startDate = now()->startOfMonth()->format('Y-m-d');
                $endDate = now()->format('Y-m-d');
                $salesQuery->where('created_at', '>=', $startDate . ' 00:00:00')
                          ->where('created_at', '<=', $endDate . ' 23:59:59');
            }

            $filteredSales = $salesQuery->get();
            $productStats = [];

            // Process each sale's order details
            foreach ($filteredSales as $sale) {
                $orderDetails = $sale->order_details;

                // Ensure order_details is an array
                if (is_string($orderDetails)) {
                    $orderDetails = json_decode($orderDetails, true) ?: [];
                } elseif (!is_array($orderDetails)) {
                    $orderDetails = [];
                }

                foreach ($orderDetails as $detail) {
                    if (!is_array($detail)) {
                        continue;
                    }

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
                'data' => $topItems,
                'debug' => [
                    'filtered_sales_count' => $filteredSales->count(),
                    'product_stats_count' => count($productStats),
                    'date_filter_applied' => !$startDate && !$endDate ? 'current_month' : 'custom_range',
                    'current_month' => now()->month,
                    'current_year' => now()->year
                ],
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
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
     * Get analytics overview data
     */
    public function getAnalyticsOverview(Request $request): JsonResponse
    {
        try {
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Build base query with date filtering
            $baseQuery = function ($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->where('created_at', '>=', $startDate . ' 00:00:00');
                }
                if ($endDate) {
                    $query->where('created_at', '<=', $endDate . ' 23:59:59');
                }
                return $query;
            };

            // Get basic analytics data
            $totalPageViews = PageVisit::when($startDate || $endDate, $baseQuery)->count();
            $uniquePageViews = PageVisit::when($startDate || $endDate, $baseQuery)
                ->distinct('session_id')->count('session_id');
            $totalProductViews = ProductView::when($startDate || $endDate, $baseQuery)->count();
            $uniqueProductViews = ProductView::when($startDate || $endDate, $baseQuery)
                ->distinct('session_id')->count('session_id');
            $totalSessions = UserSession::when($startDate || $endDate, $baseQuery)->count();
            $uniqueUsers = UserSession::when($startDate || $endDate, $baseQuery)
                ->whereNotNull('user_id')->distinct('user_id')->count('user_id');

            // Calculate average session duration
            $avgSessionDuration = UserSession::when($startDate || $endDate, $baseQuery)
                ->avg('total_duration') ?: 0;

            // Get top pages
            $topPages = PageVisit::when($startDate || $endDate, $baseQuery)
                ->selectRaw('page_url, COUNT(*) as views')
                ->groupBy('page_url')
                ->orderByDesc('views')
                ->limit(5)
                ->get();

            // Get top products
            $topProducts = ProductView::when($startDate || $endDate, $baseQuery)
                ->with('product:id,product_name')
                ->selectRaw('product_id, COUNT(*) as views')
                ->groupBy('product_id')
                ->orderByDesc('views')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_page_views' => $totalPageViews,
                    'unique_page_views' => $uniquePageViews,
                    'total_product_views' => $totalProductViews,
                    'unique_product_views' => $uniqueProductViews,
                    'total_sessions' => $totalSessions,
                    'unique_users' => $uniqueUsers,
                    'avg_session_duration' => round($avgSessionDuration, 2),
                    'top_pages' => $topPages,
                    'top_products' => $topProducts
                ],
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting analytics overview: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting analytics overview',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get traffic sources data
     */
    public function getTrafficSources(Request $request): JsonResponse
    {
        try {
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Build base query with date filtering
            $baseQuery = function ($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->where('created_at', '>=', $startDate . ' 00:00:00');
                }
                if ($endDate) {
                    $query->where('created_at', '<=', $endDate . ' 23:59:59');
                }
                return $query;
            };

            // Get traffic source data from user sessions
            $trafficSources = UserSession::when($startDate || $endDate, $baseQuery)
                ->selectRaw('traffic_source, COUNT(*) as sessions, SUM(page_views) as page_views, COUNT(DISTINCT user_id) as unique_users')
                ->whereNotNull('traffic_source')
                ->groupBy('traffic_source')
                ->orderByDesc('sessions')
                ->get();

            // Get referrer data
            $topReferrers = UserSession::when($startDate || $endDate, $baseQuery)
                ->selectRaw('referrer, COUNT(*) as sessions')
                ->whereNotNull('referrer')
                ->where('referrer', '!=', '')
                ->groupBy('referrer')
                ->orderByDesc('sessions')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'traffic_sources' => $trafficSources,
                    'top_referrers' => $topReferrers
                ],
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting traffic sources: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting traffic sources',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get conversion funnel data
     */
    public function getConversionFunnel(Request $request): JsonResponse
    {
        try {
            // Get date filter parameters
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');

            // Build base query with date filtering
            $baseQuery = function ($query) use ($startDate, $endDate) {
                if ($startDate) {
                    $query->where('created_at', '>=', $startDate . ' 00:00:00');
                }
                if ($endDate) {
                    $query->where('created_at', '<=', $endDate . ' 23:59:59');
                }
                return $query;
            };

            // Get funnel data from checkout events
            $pageViews = UserSession::when($startDate || $endDate, $baseQuery)->sum('page_views');
            $productViews = ProductView::when($startDate || $endDate, $baseQuery)->count();
            $cartViews = CheckoutEvent::where('event_type', 'cart_view')
                ->when($startDate || $endDate, $baseQuery)->count();
            $checkoutStarts = CheckoutEvent::where('event_type', 'checkout_start')
                ->when($startDate || $endDate, $baseQuery)->count();
            $paymentInfo = CheckoutEvent::where('event_type', 'payment_info')
                ->when($startDate || $endDate, $baseQuery)->count();
            $purchases = CheckoutEvent::where('event_type', 'purchase')
                ->when($startDate || $endDate, $baseQuery)->count();

            // Calculate conversion rates
            $productViewRate = $pageViews > 0 ? ($productViews / $pageViews) * 100 : 0;
            $cartRate = $productViews > 0 ? ($cartViews / $productViews) * 100 : 0;
            $checkoutRate = $cartViews > 0 ? ($checkoutStarts / $cartViews) * 100 : 0;
            $paymentRate = $checkoutStarts > 0 ? ($paymentInfo / $checkoutStarts) * 100 : 0;
            $purchaseRate = $paymentInfo > 0 ? ($purchases / $paymentInfo) * 100 : 0;

            $funnelData = [
                ['step' => 'Page Views', 'users' => $pageViews, 'conversion_rate' => 100],
                ['step' => 'Product Views', 'users' => $productViews, 'conversion_rate' => round($productViewRate, 2)],
                ['step' => 'Cart Views', 'users' => $cartViews, 'conversion_rate' => round($cartRate, 2)],
                ['step' => 'Checkout Started', 'users' => $checkoutStarts, 'conversion_rate' => round($checkoutRate, 2)],
                ['step' => 'Payment Info', 'users' => $paymentInfo, 'conversion_rate' => round($paymentRate, 2)],
                ['step' => 'Purchase', 'users' => $purchases, 'conversion_rate' => round($purchaseRate, 2)]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'funnel' => $funnelData,
                    'overall_conversion_rate' => $pageViews > 0 ? round(($purchases / $pageViews) * 100, 2) : 0
                ],
                'date_filter' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting conversion funnel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error getting conversion funnel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Track a page visit (Public endpoint for tracking)
     */
    public function trackPageVisit(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'page_url' => 'required|string',
                'page_title' => 'nullable|string',
                'user_agent' => 'nullable|string',
                'referrer' => 'nullable|string',
                'session_id' => 'required|string',
                'user_id' => 'nullable|string',
                'duration' => 'nullable|integer'
            ]);

            // Add IP address and geo data
            $data['ip_address'] = $request->ip();
            $data['country'] = null; // Can be enhanced with geo IP service
            $data['city'] = null;

            PageVisit::create($data);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error tracking page visit: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Track a product view (Public endpoint for tracking)
     */
    public function trackProductView(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'product_id' => 'required|string',
                'session_id' => 'required|string',
                'user_id' => 'nullable|string',
                'referrer' => 'nullable|string',
                'viewed_at' => 'nullable|date'
            ]);

            $data['ip_address'] = $request->ip();
            if (!isset($data['viewed_at'])) {
                $data['viewed_at'] = now();
            }

            ProductView::create($data);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error tracking product view: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Track or create a user session (Public endpoint for tracking)
     */
    public function trackSession(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'session_id' => 'required|string',
                'user_id' => 'nullable|string',
                'user_agent' => 'nullable|string',
                'device_type' => 'nullable|string',
                'browser' => 'nullable|string',
                'traffic_source' => 'nullable|string',
                'referrer' => 'nullable|string',
                'page_views' => 'nullable|integer',
                'total_duration' => 'nullable|integer'
            ]);

            // Add IP and geo data
            $data['ip_address'] = $request->ip();
            $data['country'] = null; // Can be enhanced with geo IP service
            $data['city'] = null;
            $data['last_activity'] = now();

            // Create or update session
            UserSession::updateOrCreate(
                ['session_id' => $data['session_id']],
                $data
            );

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error tracking session: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Update session activity (Public endpoint for tracking)
     */
    public function updateSessionActivity(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'session_id' => 'required|string',
                'page_views' => 'nullable|integer',
                'total_duration' => 'nullable|integer'
            ]);

            UserSession::where('session_id', $data['session_id'])
                ->update([
                    'page_views' => $data['page_views'] ?? 0,
                    'total_duration' => $data['total_duration'] ?? 0,
                    'last_activity' => now()
                ]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error updating session activity: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
        }
    }

    /**
     * Track checkout events (Public endpoint for tracking)
     */
    public function trackCheckoutEvent(Request $request): JsonResponse
    {
        try {
            $data = $request->validate([
                'session_id' => 'required|string',
                'event_type' => 'required|string',
                'product_id' => 'nullable|string',
                'value' => 'nullable|numeric',
                'product_data' => 'nullable|array',
                'currency' => 'nullable|string'
            ]);

            $data['currency'] = $data['currency'] ?? 'NGN';

            CheckoutEvent::create($data);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error tracking checkout event: ' . $e->getMessage());
            return response()->json(['success' => false], 500);
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

    /**
     * Create a new offline sale
     */
    public function createOfflineSale(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer.name' => 'required|string|max:255',
                'customer.email' => 'nullable|email|max:255',
                'customer.phone' => 'nullable|string|max:20',
                'customer.address' => 'nullable|string|max:500',
                'items' => 'required|array|min:1',
                'items.*.name' => 'required|string|max:255',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.price' => 'required|numeric|min:0',
                'items.*.description' => 'nullable|string|max:500',
                'paymentMethod' => 'required|string|in:cash,card,bank_transfer,check,other',
                'deliveryOption' => 'required|string|in:pickup,delivery',
                'notes' => 'nullable|string|max:1000',
                'date' => 'required|date',
                'receipt_number' => 'required|string|max:50',
                'total' => 'required|numeric|min:0',
                'grand_total' => 'required|numeric|min:0',
                'sale_type' => 'required|string|in:offline'
            ]);

            // Create the offline sale record
            $offlineSale = \App\Models\Sales::create([
                'username' => $validated['customer']['name'],
                'emailaddress' => $validated['customer']['email'] ?? '',
                'phone' => $validated['customer']['phone'] ?? '',
                'phonenumber' => $validated['customer']['phone'] ?? '', // Required field
                'address' => $validated['customer']['address'] ?? '',
                'location' => 'In-Store', // Default for offline sales
                'state' => 'In-Store', // Default for offline sales
                'city' => 'In-Store', // Default for offline sales
                'product_ids' => json_encode(array_map(function($item, $index) {
                    return $index + 1; // Simple ID assignment for offline items
                }, $validated['items'], array_keys($validated['items']))),
                'order_details' => json_encode($validated['items']),
                'payment_method' => $validated['paymentMethod'],
                'delivery_option' => $validated['deliveryOption'],
                'total_amount' => $validated['grand_total'],
                'order_status' => $validated['deliveryOption'] === 'pickup' ? true : false, // Pickup = completed, Delivery = pending
                'status' => 'completed', // Payment status - offline sales are always completed
                'payment_status' => 'completed', // Offline sales are paid immediately
                'notes' => $validated['notes'] ?? '',
                'sale_date' => $validated['date'],
                'receipt_number' => $validated['receipt_number'],
                'sale_type' => 'offline',
                'subtotal' => $validated['total'],
                'created_at' => now(),
                'updated_at' => now()
            ]);

            Log::info('Offline sale created successfully', [
                'sale_id' => $offlineSale->id,
                'receipt_number' => $validated['receipt_number'],
                'customer' => $validated['customer']['name'],
                'total' => $validated['grand_total']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Offline sale created successfully',
                'data' => [
                    'sale_id' => $offlineSale->id,
                    'receipt_number' => $validated['receipt_number']
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating offline sale: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Error creating offline sale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all offline sales
     */
    public function getOfflineSales(Request $request): JsonResponse
    {
        try {
            $query = \App\Models\Sales::where('sale_type', 'offline')
                ->orderBy('created_at', 'desc');

            // Add pagination if requested
            $perPage = $request->get('per_page', 15);
            $offlineSales = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $offlineSales
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching offline sales: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching offline sales',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
