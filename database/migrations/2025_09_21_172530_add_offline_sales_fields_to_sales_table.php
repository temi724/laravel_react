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
        Schema::table('sales', function (Blueprint $table) {
            // Add fields for offline sales support
            $table->string('phone')->nullable()->after('emailaddress');
            $table->text('address')->nullable()->after('phone');
            $table->string('status')->default('pending')->after('payment_status');
            $table->text('notes')->nullable()->after('status');
            $table->date('sale_date')->nullable()->after('notes');
            $table->string('receipt_number')->nullable()->unique()->after('sale_date');
            $table->enum('sale_type', ['online', 'offline'])->default('online')->after('receipt_number');
            $table->decimal('subtotal', 10, 2)->nullable()->after('sale_type');
            $table->decimal('tax_amount', 10, 2)->nullable()->after('subtotal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'address',
                'status',
                'notes',
                'sale_date',
                'receipt_number',
                'sale_type',
                'subtotal',
                'tax_amount'
            ]);
        });
    }
};
