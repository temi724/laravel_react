<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Admin roles and permissions, kept beside the murphylog users table rather than in it.
 *
 * Run it on its own: php artisan migrate --path=database/migrations/2026_10_02_000000_create_admin_profiles_table.php
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('admin_profiles')) {
            Schema::create('admin_profiles', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('user_id')->unique();
                $table->boolean('is_super')->default(false);
                // The permissions switched on for this admin (App\Enums\AdminPermission values)
                $table->json('permissions')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        // There must always be someone who can manage the others: the first admin account becomes the super admin
        if (Schema::hasTable('users') && ! DB::table('admin_profiles')->where('is_super', true)->exists()) {
            $firstAdmin = DB::table('users')->where('role', 'admin')->where('is_active', true)->orderBy('id')->value('id');

            if ($firstAdmin) {
                DB::table('admin_profiles')->updateOrInsert(
                    ['user_id' => $firstAdmin],
                    ['is_super' => true, 'permissions' => null, 'created_at' => now(), 'updated_at' => now()]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_profiles');
    }
};
