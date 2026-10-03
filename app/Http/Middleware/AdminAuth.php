<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    /**
     * Only a signed-in admin gets through. The admin is known from the session set at login
     * and from nothing else: an admin id sent in a header or a parameter proves nothing.
     *
     * Routes using this middleware must also use the "web" group, which starts the session.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $admin = $this->signedInAdmin($request);

        if (! $admin) {
            return $this->deny($request);
        }

        // Add admin to request for later use
        $request->merge(['authenticated_admin' => $admin]);
        $request->attributes->set('admin', $admin);

        $response = $next($request);

        $this->recordChange($request, $admin, $response);

        return $response;
    }

    private function signedInAdmin(Request $request): ?Admin
    {
        if (! $request->hasSession()) {
            return null;
        }

        $session = $request->session();
        if (! $session->get('admin_logged_in') || ! $session->get('admin_id')) {
            return null;
        }

        // Verify admin still exists and has not been deactivated since signing in
        $admin = Admin::with('profile')->find($session->get('admin_id'));
        if (! $admin || ! $admin->is_active) {
            $session->forget(['admin_logged_in', 'admin_id', 'admin_name']);

            return null;
        }

        // Ensure admin name is in session for tracking purposes
        if (! $session->get('admin_name')) {
            $session->put('admin_name', $admin->name);
        }

        return $admin;
    }

    private function deny(Request $request): Response
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'error' => 'Admin authentication required',
                'message' => 'Sign in as an admin to continue',
            ], 401);
        }

        return redirect()->route('admin.login');
    }

    /**
     * Keep a record of who changed what: every admin request that is not a plain read
     * goes to storage/logs/audit-*.log. Request bodies are left out on purpose.
     */
    private function recordChange(Request $request, Admin $admin, Response $response): void
    {
        if ($request->isMethodSafe()) {
            return;
        }

        Log::channel('audit')->info('admin action', [
            'admin_id' => $admin->id,
            'admin' => $admin->email,
            'method' => $request->method(),
            'path' => $request->path(),
            'status' => $response->getStatusCode(),
            'ip' => $request->ip(),
        ]);
    }
}
