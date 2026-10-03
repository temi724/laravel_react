<?php

namespace App\Http\Controllers;

/**
 * @OA\Info(
 *     version="1.0.0",
 *     title="Laravel Commerce API",
 *     description="API documentation for Laravel Commerce application with product management, sales tracking, categories, and admin authentication",
 *     @OA\Contact(
 *         email="admin@laravelcommerce.com"
 *     ),
 *     @OA\License(
 *         name="MIT",
 *         url="https://opensource.org/licenses/MIT"
 *     )
 * )
 * @OA\Server(
 *     description="Local Development Server",
 *     url="http://127.0.0.1:8000/api"
 * )
 * @OA\SecurityScheme(
 *     securityScheme="AdminAuth",
 *     type="apiKey",
 *     in="cookie",
 *     name="laravel-session",
 *     description="The session cookie set by POST /admin/login. Create, update and delete operations need a signed-in admin and the X-CSRF-TOKEN header."
 * )
 */
abstract class Controller
{
    //
}
