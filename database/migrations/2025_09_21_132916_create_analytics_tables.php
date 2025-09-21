<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table for tracking page visits
        Schema::create('page_visits', function (Blueprint $table) {
            $table->id();
            $table->string('page_url');
            $table->string('page_title')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('referrer')->nullable();
            $table->string('session_id');
            $table->string('user_id')->nullable(); // For logged-in users
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->integer('duration')->default(0); // Time spent on page in seconds
            $table->timestamps();

            $table->index(['page_url', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

                // Table for tracking product views
        Schema::create('product_views', function (Blueprint $table) {
            $table->id();
            $table->string('product_id'); // Match the products table id type
            $table->string('session_id');
            $table->string('user_id')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('viewed_at');
            $table->timestamps();

            // Create foreign key constraint manually to match varchar id type
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->index(['product_id', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

        // Table for tracking user sessions
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique();
            $table->string('user_id')->nullable();
            $table->string('ip_address');
            $table->string('user_agent');
            $table->string('country')->nullable();
            $table->string('city')->nullable();
            $table->string('device_type')->nullable(); // mobile, desktop, tablet
            $table->string('browser')->nullable();
            $table->string('traffic_source')->nullable(); // direct, search, social, referral
            $table->string('referrer')->nullable();
            $table->integer('page_views')->default(0);
            $table->integer('total_duration')->default(0); // Total session time in seconds
            $table->timestamp('last_activity')->nullable();
            $table->timestamps();
        });

                // Table for tracking checkout funnel
        Schema::create('checkout_events', function (Blueprint $table) {
            $table->id();
            $table->string('session_id');
            $table->string('event_type'); // cart_view, checkout_start, payment_info, purchase
            $table->string('product_id')->nullable(); // Match the products table id type
            $table->decimal('value', 10, 2)->nullable(); // Cart value or purchase amount
            $table->json('product_data')->nullable(); // Product details at time of event
            $table->string('currency', 3)->default('NGN');
            $table->timestamps();

            // Create foreign key constraint manually to match varchar id type
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->index(['event_type', 'created_at']);
            $table->index(['session_id', 'created_at']);
        });

        // Table for tracking traffic sources
        Schema::create('traffic_sources', function (Blueprint $table) {
            $table->id();
            $table->string('session_id');
            $table->string('source'); // google, facebook, direct, etc.
            $table->string('medium')->nullable(); // cpc, organic, social, referral
            $table->string('campaign')->nullable();
            $table->string('keyword')->nullable();
            $table->string('referrer_url')->nullable();
            $table->timestamps();
        });
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
    }
};
