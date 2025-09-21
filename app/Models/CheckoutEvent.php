<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CheckoutEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'event_type',
        'product_id',
        'value',
        'product_data',
        'currency'
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'product_data' => 'array',
    ];

    /**
     * Get the product associated with this checkout event
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id', 'id');
    }

    /**
     * Get the user session this checkout event belongs to
     */
    public function userSession()
    {
        return $this->belongsTo(UserSession::class, 'session_id', 'session_id');
    }
}
