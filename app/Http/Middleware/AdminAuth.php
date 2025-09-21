<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use App\Models\Admin;

class AdminAuth
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if this is an API request
        if ($request->expectsJson() || $request->is('api/*')) {
            return $this->handleApiAuth($request, $next);
        }

        // Handle web authentication
        return $this->handleWebAuth($request, $next);
    }

    private function handleApiAuth(Request $request, Closure $next): Response
    {
        // For admin API routes, try session authentication first
        if ($request->is('api/admin/*')) {
            Log::info('AdminAuth API middleware - Admin API route detected, checking session first');
            Log::info('AdminAuth API middleware - Session admin_logged_in: ' . (Session::get('admin_logged_in') ? 'true' : 'false'));
            Log::info('AdminAuth API middleware - Session admin_id: ' . Session::get('admin_id'));

            // Check session authentication for admin routes
            if (Session::get('admin_logged_in') && Session::get('admin_id')) {
                $adminId = Session::get('admin_id');
                $admin = Admin::find($adminId);

                if ($admin) {
                    Log::info('AdminAuth API middleware - Session authentication successful for admin: ' . $admin->name);
                    $request->merge(['authenticated_admin' => $admin]);
                    return $next($request);
                }
            }

            Log::info('AdminAuth API middleware - Session authentication failed, trying header/parameter auth');
        }

        // Fallback to header/parameter authentication
        $adminId = $request->header('Admin-ID') ?? $request->get('admin_id');

        if (!$adminId) {
            Log::info('AdminAuth API middleware - No Admin-ID header or admin_id parameter provided');
            return response()->json([
                'error' => 'Admin authentication required',
                'message' => 'Please provide Admin-ID in headers or admin_id in request'
            ], 401);
        }

        // Verify admin exists
        $admin = Admin::find($adminId);
        if (!$admin) {
            Log::info('AdminAuth API middleware - Admin not found for ID: ' . $adminId);
            return response()->json([
                'error' => 'Invalid admin credentials',
                'message' => 'Admin not found'
            ], 401);
        }
        Log::info('AdminAuth API middleware - Header/parameter authentication successful for admin: ' . $admin->name);

        // Add admin to request for later use
        $request->merge(['authenticated_admin' => $admin]);

        return $next($request);
    }

    private function handleWebAuth(Request $request, Closure $next): Response
    {
        // Debug logging
        Log::info('AdminAuth middleware - URL: ' . $request->url());
        Log::info('AdminAuth middleware - Session admin_logged_in: ' . (Session::get('admin_logged_in') ? 'true' : 'false'));
        Log::info('AdminAuth middleware - Session admin_id: ' . Session::get('admin_id'));

        // Check if admin is logged in via session
        if (!Session::get('admin_logged_in')) {
            Log::info('AdminAuth middleware - Redirecting to login: admin_logged_in is false');
            return redirect()->route('admin.login');
        }

        // Verify admin still exists
        $adminId = Session::get('admin_id');
        if (!$adminId) {
            Log::info('AdminAuth middleware - Redirecting to login: admin_id is empty');
            Session::flush();
            return redirect()->route('admin.login');
        }

        $admin = Admin::find($adminId);
        if (!$admin) {
            Log::info('AdminAuth middleware - Redirecting to login: admin not found in database');
            Session::flush();
            return redirect()->route('admin.login');
        }

        Log::info('AdminAuth middleware - Authentication successful for admin: ' . $admin->name);

        // Add admin to request for later use
        $request->merge(['authenticated_admin' => $admin]);

        // Ensure admin name is in session for tracking purposes
        if (!Session::get('admin_name')) {
            Session::put('admin_name', $admin->name);
        }

        return $next($request);
    }
}
