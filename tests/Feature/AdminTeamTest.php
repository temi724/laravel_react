<?php

namespace Tests\Feature;

use App\Enums\AdminPermission;
use App\Models\Admin;
use App\Models\AdminProfile;
use App\Models\Category;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Monolog\Handler\NullHandler;
use Tests\TestCase;

/**
 * The super admin, the other admins and what each may do.
 * Runs on a throwaway in-memory database holding only the tables this needs.
 */
class AdminTeamTest extends TestCase
{
    private Admin $super;

    protected function setUp(): void
    {
        parent::setUp();

        // Keep test sign-ins out of the real audit log
        config(['logging.channels.audit' => ['driver' => 'monolog', 'handler' => NullHandler::class]]);

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('remember_token')->nullable();
            $table->string('role')->default('customer');
            $table->string('phone')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('admin_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->boolean('is_super')->default(false);
            $table->json('permissions')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
        });
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->timestamps();
        });
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->timestamps();
        });

        $this->super = $this->admin('Owner', 'owner@example.com', super: true);
    }

    /**
     * @param  list<string>|null  $permissions  null leaves the admin without a profile, as before permissions existed
     */
    private function admin(string $name, string $email, bool $super = false, ?array $permissions = null): Admin
    {
        $admin = Admin::create(['name' => $name, 'email' => $email, 'password' => 'correct-horse-9']);

        if ($super || $permissions !== null) {
            AdminProfile::create(['user_id' => $admin->id, 'is_super' => $super, 'permissions' => $permissions]);
        }

        return $admin->fresh();
    }

    private function signedInAs(Admin $admin): static
    {
        return $this->withSession(['admin_logged_in' => true, 'admin_id' => $admin->id]);
    }

    public function test_only_the_super_admin_reaches_the_settings(): void
    {
        $staff = $this->admin('Staff', 'staff@example.com', permissions: AdminPermission::values());

        $this->getJson('/api/admin/team')->assertStatus(401);
        $this->signedInAs($staff)->getJson('/api/admin/team')->assertStatus(403);
        $this->signedInAs($this->super)->getJson('/api/admin/team')
            ->assertOk()
            ->assertJsonCount(2, 'admins')
            ->assertJsonCount(count(AdminPermission::cases()), 'permissions');

        $this->withoutVite();
        $this->signedInAs($staff)->get('/admin/settings')->assertStatus(403)->assertSee('You do not have access to this page');
        $this->signedInAs($this->super)->get('/admin/settings')->assertOk();
    }

    public function test_the_super_admin_adds_an_admin_who_can_then_sign_in(): void
    {
        $response = $this->signedInAs($this->super)->postJson('/api/admin/team', [
            'name' => 'Tunde Bello',
            'email' => 'tunde@example.com',
            'phone_number' => '08031234567',
            'password' => 'shop-floor-2026',
            'permissions' => ['sales.view', 'sales.offline', 'not.a.permission.but.filtered.by.validation' => 'x'],
        ]);

        // An unknown permission is refused outright
        $response->assertStatus(422);

        $response = $this->signedInAs($this->super)->postJson('/api/admin/team', [
            'name' => 'Tunde Bello',
            'email' => 'tunde@example.com',
            'phone_number' => '08031234567',
            'password' => 'shop-floor-2026',
            'permissions' => ['sales.view', 'sales.offline'],
        ]);

        $response->assertCreated()
            ->assertJsonPath('admin.name', 'Tunde Bello')
            ->assertJsonPath('admin.is_super', false)
            ->assertJsonPath('admin.is_active', true)
            ->assertJsonPath('admin.permissions', ['sales.view', 'sales.offline'])
            ->assertJsonMissingPath('admin.password');

        $tunde = Admin::where('email', 'tunde@example.com')->firstOrFail();
        $this->assertTrue(Hash::check('shop-floor-2026', $tunde->password));
        $this->assertSame('admin', DB::table('users')->where('id', $tunde->id)->value('role'));
        $this->assertSame((int) $this->super->id, (int) $tunde->profile->created_by);

        $this->flushSession();
        $this->postJson('/api/admin/login', ['email' => 'tunde@example.com', 'password' => 'shop-floor-2026'])
            ->assertOk()
            ->assertSessionHas('admin_id', $tunde->id);
        $this->assertNotNull($tunde->fresh()->last_login_at);
    }

    public function test_a_new_admin_needs_a_real_email_and_a_strong_password(): void
    {
        DB::table('users')->insert(['name' => 'Customer', 'email' => 'customer@example.com', 'password' => 'x', 'role' => 'customer']);

        $this->signedInAs($this->super)->postJson('/api/admin/team', ['name' => 'A', 'email' => 'customer@example.com', 'password' => 'short'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);

        $this->assertSame(1, Admin::count());
    }

    public function test_each_switch_opens_only_its_own_actions(): void
    {
        $staff = $this->admin('Staff', 'staff@example.com', permissions: ['categories.manage']);

        $this->signedInAs($staff)->postJson('/api/categories', ['name' => 'Smart watches'])->assertCreated();
        $this->signedInAs($staff)->postJson('/api/admin/products', [])->assertStatus(403);
        $this->signedInAs($staff)->deleteJson('/api/admin/products/1')->assertStatus(403);
        $this->signedInAs($staff)->getJson('/api/admin/sales')->assertStatus(403);
        $this->signedInAs($staff)->putJson('/api/admin/sales/abc/payment-status', ['payment_status' => 'completed'])->assertStatus(403);
        $this->signedInAs($staff)->postJson('/api/admin/offline-sales', [])->assertStatus(403);
        $this->signedInAs($staff)->getJson('/api/admin/dashboard-stats')->assertStatus(403);

        $noCategories = $this->admin('Other', 'other@example.com', permissions: ['sales.view']);
        $this->signedInAs($noCategories)->postJson('/api/categories', ['name' => 'Drones'])->assertStatus(403);
        $this->assertSame(1, Category::count());
    }

    public function test_changing_the_switches_takes_effect_on_the_next_request(): void
    {
        $staff = $this->admin('Staff', 'staff@example.com', permissions: []);
        $this->signedInAs($staff)->postJson('/api/categories', ['name' => 'Drones'])->assertStatus(403);

        $this->signedInAs($this->super)->putJson("/api/admin/team/{$staff->id}", [
            'name' => 'Staff Member',
            'email' => 'staff@example.com',
            'permissions' => ['categories.manage'],
        ])->assertOk()->assertJsonPath('admin.permissions', ['categories.manage'])->assertJsonPath('admin.name', 'Staff Member');

        $this->signedInAs($staff)->postJson('/api/categories', ['name' => 'Drones'])->assertCreated();
        // The password was left empty, so it is unchanged
        $this->assertTrue(Hash::check('correct-horse-9', $staff->fresh()->password));
    }

    public function test_an_admin_from_before_permissions_keeps_full_access_and_a_super_admin_always_has_it(): void
    {
        $legacy = $this->admin('Legacy', 'legacy@example.com');
        $this->assertSame(AdminPermission::values(), $legacy->permissions());
        $this->assertFalse($legacy->isSuperAdmin());

        // Switching everything off for the super admin changes nothing
        $this->signedInAs($this->super)->putJson("/api/admin/team/{$this->super->id}", [
            'name' => 'Owner', 'email' => 'owner@example.com', 'permissions' => [],
        ])->assertOk()->assertJsonPath('admin.is_super', true);

        $this->assertSame(AdminPermission::values(), $this->super->fresh()->permissions());
    }

    public function test_a_deactivated_admin_is_signed_out_and_cannot_sign_in_until_reactivated(): void
    {
        $staff = $this->admin('Staff', 'staff@example.com', permissions: ['categories.manage']);
        $this->signedInAs($staff)->getJson('/api/admin/categories')->assertOk();

        $this->signedInAs($this->super)->putJson("/api/admin/team/{$staff->id}/status", ['active' => false])
            ->assertOk()->assertJsonPath('admin.is_active', false);

        // Their open session stops working at once
        $this->signedInAs($staff)->getJson('/api/admin/categories')->assertStatus(401);

        $this->flushSession();
        $this->postJson('/api/admin/login', ['email' => 'staff@example.com', 'password' => 'correct-horse-9'])
            ->assertStatus(403)
            ->assertSessionMissing('admin_id');
        // A wrong password still gets the usual answer, so the account's state is not given away
        $this->postJson('/api/admin/login', ['email' => 'staff@example.com', 'password' => 'wrong'])->assertStatus(401);

        $this->signedInAs($this->super)->putJson("/api/admin/team/{$staff->id}/status", ['active' => true])->assertOk();
        $this->flushSession();
        $this->postJson('/api/admin/login', ['email' => 'staff@example.com', 'password' => 'correct-horse-9'])->assertOk();
    }

    public function test_the_super_admin_cannot_be_locked_out(): void
    {
        $this->signedInAs($this->super)->putJson("/api/admin/team/{$this->super->id}/status", ['active' => false])
            ->assertStatus(422);

        $this->assertTrue($this->super->fresh()->is_active);
    }

    public function test_a_category_with_products_cannot_be_deleted(): void
    {
        $category = Category::create(['name' => 'Phones']);
        DB::table('products')->insert(['category_id' => $category->id, 'name' => 'iPhone 17']);
        $empty = Category::create(['name' => 'Drones']);

        $this->signedInAs($this->super)->getJson('/api/admin/categories')
            ->assertOk()->assertJsonPath('categories.1.products_count', 1);

        $this->signedInAs($this->super)->deleteJson("/api/categories/{$category->id}")->assertStatus(422);
        $this->signedInAs($this->super)->deleteJson("/api/categories/{$empty->id}")->assertNoContent();
        $this->signedInAs($this->super)->postJson('/api/categories', ['name' => 'Phones'])->assertStatus(422);
        $this->signedInAs($this->super)->putJson("/api/categories/{$category->id}", ['name' => 'Mobile phones'])
            ->assertOk()->assertJsonPath('name', 'Mobile phones');

        $this->assertSame(['Mobile phones'], Category::pluck('name')->all());
    }
}
