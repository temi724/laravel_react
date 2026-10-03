<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deal of the day, drops and bundles.
 *
 * Run it on its own: php artisan migrate --path=database/migrations/2026_10_02_100000_create_offers_tables.php
 */
return new class extends Migration
{
    public function up(): void
    {
        // A special price on one product for a set time: the deal of the day, or a drop
        // (a limited number of units released at a set moment).
        if (! Schema::hasTable('promotions')) {
            Schema::create('promotions', function (Blueprint $table): void {
                $table->id();
                $table->string('type', 20); // App\Enums\PromotionType
                $table->unsignedBigInteger('product_id')->index();
                $table->string('storage')->nullable(); // the storage size the price is for, when the product has sizes
                $table->decimal('price', 12, 2);
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->unsignedInteger('quantity_limit')->nullable(); // units released at this price
                $table->unsignedInteger('per_order_limit')->nullable();
                $table->unsignedInteger('units_sold')->default(0); // counted when an order is placed
                $table->string('headline')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index(['type', 'starts_at']);
            });
        }

        // Products sold together for one price
        if (! Schema::hasTable('bundles')) {
            Schema::create('bundles', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->decimal('price', 12, 2);
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('bundle_items')) {
            Schema::create('bundle_items', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('bundle_id')->index();
                $table->unsignedBigInteger('product_id')->index();
                $table->string('storage')->nullable();
                $table->unsignedInteger('quantity')->default(1);
                $table->unsignedInteger('position')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bundle_items');
        Schema::dropIfExists('bundles');
        Schema::dropIfExists('promotions');
    }
};
