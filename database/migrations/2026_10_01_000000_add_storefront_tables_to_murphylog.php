<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables this app needs that the murphylog database does not have.
     * Products, categories and admins are read from the existing murphylog
     * tables, so nothing that already exists is created or altered here.
     */
    public function up(): void
    {
        if (!Schema::hasTable('deals')) {
            Schema::create('deals', function (Blueprint $table) {
                $table->string('id', 24)->primary();
                $table->string('product_name');
                $table->string('category_id', 24)->nullable();
                $table->json('reviews')->nullable();
                $table->decimal('price', 10, 2);
                $table->decimal('old_price', 10, 2)->nullable();
                $table->text('overview')->nullable();
                $table->text('description')->nullable();
                $table->text('about')->nullable();
                $table->json('images_url')->nullable();
                $table->json('colors')->nullable();
                $table->json('what_is_included')->nullable();
                $table->json('specification')->nullable();
                $table->json('storage_options')->nullable();
                $table->string('product_status')->default('new');
                $table->boolean('in_stock')->default(true);
                $table->timestamps();

                $table->index('category_id');
                $table->index('in_stock');
                $table->index('created_at');
                $table->index('product_status');
            });
        }

        if (!Schema::hasTable('sales')) {
            Schema::create('sales', function (Blueprint $table) {
                $table->string('id', 24)->primary();
                $table->string('order_id')->nullable()->unique();
                $table->string('username');
                $table->string('emailaddress');
                $table->string('phone')->nullable();
                $table->text('address')->nullable();
                $table->string('phonenumber');
                $table->string('location');
                $table->string('state');
                $table->string('city');
                $table->json('product_ids');
                $table->integer('quantity')->default(1);
                $table->boolean('order_status')->default(false);
                $table->enum('order_type', ['pickup', 'delivery'])->default('delivery');
                $table->string('payment_status')->default('pending');
                $table->string('status')->default('pending');
                $table->text('notes')->nullable();
                $table->date('sale_date')->nullable();
                $table->string('receipt_number')->nullable()->unique();
                $table->enum('sale_type', ['online', 'offline'])->default('online');
                $table->decimal('subtotal', 10, 2)->nullable();
                $table->decimal('tax_amount', 10, 2)->nullable();
                $table->json('order_details')->nullable();
                $table->string('payment_method')->nullable();
                $table->decimal('total_amount', 10, 2)->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->string('approved_by_admin')->nullable();
                $table->timestamp('payment_approved_at')->nullable();
                $table->timestamps();

                $table->index('created_at');
                $table->index('payment_status');
                $table->index('emailaddress');
            });
        }

        if (!Schema::hasTable('page_visits')) {
            Schema::create('page_visits', function (Blueprint $table) {
                $table->id();
                $table->string('page_url');
                $table->string('page_title')->nullable();
                $table->string('user_agent')->nullable();
                $table->string('ip_address')->nullable();
                $table->string('referrer')->nullable();
                $table->string('session_id');
                $table->string('user_id')->nullable();
                $table->string('country')->nullable();
                $table->string('city')->nullable();
                $table->integer('duration')->default(0);
                $table->timestamps();

                $table->index(['page_url', 'created_at']);
                $table->index(['session_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('product_views')) {
            Schema::create('product_views', function (Blueprint $table) {
                $table->id();
                // Holds a product id or a deal id, so it cannot be a foreign key to products
                $table->string('product_id');
                $table->string('session_id');
                $table->string('user_id')->nullable();
                $table->string('ip_address')->nullable();
                $table->string('referrer')->nullable();
                $table->timestamp('viewed_at');
                $table->timestamps();

                $table->index(['product_id', 'created_at']);
                $table->index(['session_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('user_sessions')) {
            Schema::create('user_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('session_id')->unique();
                $table->string('user_id')->nullable();
                $table->string('ip_address');
                $table->string('user_agent');
                $table->string('country')->nullable();
                $table->string('city')->nullable();
                $table->string('device_type')->nullable();
                $table->string('browser')->nullable();
                $table->string('traffic_source')->nullable();
                $table->string('referrer')->nullable();
                $table->integer('page_views')->default(0);
                $table->integer('total_duration')->default(0);
                $table->timestamp('last_activity')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('checkout_events')) {
            Schema::create('checkout_events', function (Blueprint $table) {
                $table->id();
                $table->string('session_id');
                $table->string('event_type');
                // Holds a product id or a deal id, so it cannot be a foreign key to products
                $table->string('product_id')->nullable();
                $table->decimal('value', 10, 2)->nullable();
                $table->json('product_data')->nullable();
                $table->string('currency', 3)->default('NGN');
                $table->timestamps();

                $table->index('product_id');
                $table->index(['event_type', 'created_at']);
                $table->index(['session_id', 'created_at']);
            });
        }

        if (!Schema::hasTable('traffic_sources')) {
            Schema::create('traffic_sources', function (Blueprint $table) {
                $table->id();
                $table->string('session_id');
                $table->string('source');
                $table->string('medium')->nullable();
                $table->string('campaign')->nullable();
                $table->string('keyword')->nullable();
                $table->string('referrer_url')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traffic_sources');
        Schema::dropIfExists('checkout_events');
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('product_views');
        Schema::dropIfExists('page_visits');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('deals');
    }
};
