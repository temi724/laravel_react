<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Check existing indexes first and only add if they don't exist
            $existingIndexes = DB::select("SHOW INDEX FROM products");
            $indexNames = collect($existingIndexes)->pluck('Key_name')->toArray();

            // Only add indexes if they don't already exist
            if (!in_array('products_product_name_index', $indexNames)) {
                $table->index(['product_name']);
            }
            if (!in_array('products_price_index', $indexNames)) {
                $table->index(['price']);
            }
            if (!in_array('products_in_stock_index', $indexNames)) {
                $table->index(['in_stock']);
            }
            if (!in_array('products_product_status_index', $indexNames)) {
                $table->index(['product_status']);
            }
            if (!in_array('products_category_id_index', $indexNames)) {
                $table->index(['category_id']);
            }

            // Composite indexes for common queries
            if (!in_array('products_in_stock_product_status_index', $indexNames)) {
                $table->index(['in_stock', 'product_status']);
            }
            if (!in_array('products_category_id_in_stock_index', $indexNames)) {
                $table->index(['category_id', 'in_stock']);
            }
            if (!in_array('products_price_in_stock_index', $indexNames)) {
                $table->index(['price', 'in_stock']);
            }
        });

        Schema::table('sales', function (Blueprint $table) {
            // Check existing indexes first and only add if they don't exist
            $existingIndexes = DB::select("SHOW INDEX FROM sales");
            $indexNames = collect($existingIndexes)->pluck('Key_name')->toArray();

            // Index for order lookups
            if (!in_array('sales_created_at_index', $indexNames)) {
                $table->index(['created_at']);
            }
            if (!in_array('sales_payment_status_index', $indexNames)) {
                $table->index(['payment_status']);
            }
            if (!in_array('sales_order_id_index', $indexNames)) {
                $table->index(['order_id']);
            }
            if (!in_array('sales_emailaddress_index', $indexNames)) {
                $table->index(['emailaddress']);
            }
        });

        Schema::table('categories', function (Blueprint $table) {
            // Check existing indexes first and only add if they don't exist
            $existingIndexes = DB::select("SHOW INDEX FROM categories");
            $indexNames = collect($existingIndexes)->pluck('Key_name')->toArray();

            // Index for category lookups
            if (!in_array('categories_name_index', $indexNames)) {
                $table->index(['name']);
            }
        });

        Schema::table('deals', function (Blueprint $table) {
            // Check existing indexes first and only add if they don't exist
            $existingIndexes = DB::select("SHOW INDEX FROM deals");
            $indexNames = collect($existingIndexes)->pluck('Key_name')->toArray();

            // Index for deals filtering
            if (!in_array('deals_created_at_index', $indexNames)) {
                $table->index(['created_at']);
            }
            if (!in_array('deals_product_status_index', $indexNames)) {
                $table->index(['product_status']);
            }
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
            $table->dropIndex(['emailaddress']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropIndex(['name']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropIndex(['created_at']);
            $table->dropIndex(['product_status']);
        });
    }
};
