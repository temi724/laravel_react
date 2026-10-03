<?php

namespace Tests\Feature;

use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Who is let in where. None of these requests may reach the database:
 * a visitor who is not signed in is turned away before anything is read or changed.
 */
class AccessControlTest extends TestCase
{
    public static function adminOnlyEndpoints(): array
    {
        return [
            'list all sales' => ['GET', '/api/sales'],
            'read a sale' => ['GET', '/api/sales/abc'],
            'create a sale' => ['POST', '/api/sales'],
            'delete a sale' => ['DELETE', '/api/sales/abc'],
            'admin sales list' => ['GET', '/api/admin/sales'],
            'product with its serial numbers' => ['GET', '/api/admin/products/1'],
            'mark a payment received' => ['PUT', '/api/admin/sales/abc/payment-status'],
            'create a category' => ['POST', '/api/categories'],
            'rename a category' => ['PUT', '/api/categories/1'],
            'delete a category' => ['DELETE', '/api/categories/1'],
            'read an order' => ['GET', '/api/orders/ORD-20261001-123456ABCD'],
            'change an order status' => ['PUT', '/api/orders/ORD-20261001-123456ABCD/status'],
            'create a product' => ['POST', '/api/products'],
            'delete a product' => ['DELETE', '/api/products/1'],
            'admin delete a product' => ['DELETE', '/api/admin/products/1'],
            'api documentation' => ['GET', '/api/documentation'],
        ];
    }

    #[DataProvider('adminOnlyEndpoints')]
    public function test_admin_endpoints_turn_away_visitors(string $method, string $uri): void
    {
        $this->json($method, $uri)->assertStatus(401);
    }

    #[DataProvider('adminOnlyEndpoints')]
    public function test_an_admin_id_in_a_header_or_parameter_proves_nothing(string $method, string $uri): void
    {
        $this->json($method, $uri, ['admin_id' => 1], ['Admin-ID' => '1'])->assertStatus(401);
        $this->json($method, $uri.'?admin_id=1')->assertStatus(401);
    }

    public function test_admin_pages_send_visitors_to_the_login_page(): void
    {
        foreach (['/admin', '/admin/sales', '/admin/orders', '/admin/invoice/abc', '/admin/invoice/abc/pdf', '/docs'] as $page) {
            $this->get($page)->assertRedirect(route('admin.login'));
        }
    }

    public function test_the_session_debug_route_is_gone(): void
    {
        $this->getJson('/api/admin/debug-session')->assertStatus(404);
    }

    public function test_responses_carry_security_headers(): void
    {
        $response = $this->get('/admin/login');

        $response->assertOk();
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->assertStringContainsString("frame-ancestors 'self'", (string) $response->headers->get('Content-Security-Policy'));
        $this->assertStringContainsString("object-src 'none'", (string) $response->headers->get('Content-Security-Policy'));
    }

    public function test_an_order_needs_a_customer_and_a_cart(): void
    {
        $this->postJson('/api/orders/place', [])
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['username', 'email', 'phone', 'cartItems']]);
    }

    public function test_an_order_refuses_bad_quantities_and_order_references(): void
    {
        $order = [
            'username' => 'Ada Obi',
            'email' => 'ada@example.com',
            'phone' => '08031234567',
            'deliveryOption' => 'pickup',
            'cartItems' => [['id' => '1', 'name' => 'Phone', 'price' => 1, 'quantity' => -5]],
        ];

        $this->postJson('/api/orders/place', $order)->assertStatus(422)->assertJsonStructure(['errors' => ['cartItems.0.quantity']]);

        $order['cartItems'][0]['quantity'] = 1;
        $order['orderId'] = '<script>alert(1)</script>';
        $this->postJson('/api/orders/place', $order)->assertStatus(422)->assertJsonStructure(['errors' => ['orderId']]);
    }

    public function test_placing_orders_is_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->postJson('/api/orders/place', [])->assertStatus(422);
        }

        $this->postJson('/api/orders/place', [])->assertStatus(429);
    }
}
