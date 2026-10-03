<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The store's own address for each product and flash deal: /product/{slug}.
     *
     * Kept apart from products.slug, which belongs to the murphylog schema and always ends
     * in a random number. A product keeps every address it has had, so an old link sends
     * the visitor (and search engines) on to the current one instead of to a 404.
     */
    public function up(): void
    {
        if (Schema::hasTable('product_slugs')) {
            return;
        }

        Schema::create('product_slugs', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 191)->unique();
            // 'product' or 'deal': the two tables share the /product/ addresses
            $table->string('item_type', 16);
            $table->string('item_id', 24);
            $table->boolean('is_current')->default(true);
            $table->timestamps();

            $table->index(['item_type', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_slugs');
    }
};
