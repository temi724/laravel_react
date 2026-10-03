<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\Admin;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets a signed-in admin through only if they hold a permission, or are the super admin.
 * Used after admin.auth: "admin.can:products.edit", "admin.can:super".
 */
final class EnsureAdminCan
{
    /**
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $ability): Response
    {
        $admin = $request->attributes->get('admin');

        $allowed = $admin instanceof Admin
            && ($ability === 'super' ? $admin->isSuperAdmin() : $admin->canDo($ability));

        if ($allowed) {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'error' => 'Not allowed',
                'message' => 'Your account is not allowed to do this. Ask the super admin to switch it on in Settings.',
            ], 403);
        }

        return response()->view('admin.forbidden', [], 403);
    }
}
