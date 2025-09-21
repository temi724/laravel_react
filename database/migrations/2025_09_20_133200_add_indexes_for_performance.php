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
        Schema::table('products', function (Blueprint $table) {
            // Index for product searches and filtering
            $table->index(['product_name']);
            $table->index(['price']);
            $table->index(['in_stock']);
            $table->index(['product_status']);
            $table->index(['category_id']);

            // Composite indexes for common queries
            $table->index(['in_stock', 'product_status']);
            $table->index(['category_id', 'in_stock']);
            $table->index(['price', 'in_stock']);
        });

        Schema::table('sales', function (Blueprint $table) {
            // Index for order lookups
            $table->index(['created_at']);
            $table->index(['payment_status']);
            $table->index(['order_id']);
            $table->index(['email']);
        });

        Schema::table('categories', function (Blueprint $table) {
            // Index for category lookups
            $table->index(['name']);
        });

        Schema::table('deals', function (Blueprint $table) {
            // Index for deals filtering
            $table->index(['created_at']);
            $table->index(['status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['product_name']);
            $table->dropIndex(['price']);
            $table->dropIndex(['in_stock']);
            $table->dropIndex(['product_status']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['in_stock', 'product_status']);
            $table->dropIndex(['category_id', 'in_stock']);
            $table->dropIndex(['price', 'in_stock']);
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['order_id']);
            $table->dropIndex(['email']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['status']);
        });
    }
};
