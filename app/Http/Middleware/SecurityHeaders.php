<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Security headers for every response, whatever web server is in front
     * (public/.htaccess only covers Apache).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Remove security-sensitive headers
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        // Add security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy());

        // The admin area and raw API answers have no place in search results
        if ($request->is('admin', 'admin/*', 'admin-access', 'api/*')) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        // Browsers that have seen the site over HTTPS keep using HTTPS for a year
        if ($request->secure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }

    /**
     * What a page may load and where it may send data: this site only, plus the font host
     * the older layouts use and product photos served from any HTTPS address.
     *
     * Scripts keep 'unsafe-inline' and 'unsafe-eval' because Alpine (shipped with Livewire)
     * and the small inline config scripts need them. The policy still stops other sites from
     * framing the pages, forms from posting elsewhere, plugins, and <base> hijacking.
     */
    private function contentSecurityPolicy(): string
    {
        // The Vite dev server is another origin (and a websocket) while developing
        $dev = app()->environment('local') ? ' http: ws:' : '';

        return implode('; ', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'" . $dev,
            "style-src 'self' 'unsafe-inline' https://fonts.bunny.net" . $dev,
            "font-src 'self' data: https://fonts.bunny.net" . $dev,
            "img-src 'self' data: blob: https:" . $dev,
            "connect-src 'self'" . $dev,
            "frame-src 'self' blob:",
            "worker-src 'self' blob:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
        ]);
    }
}
