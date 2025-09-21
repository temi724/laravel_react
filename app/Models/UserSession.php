<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'user_id',
        'ip_address',
        'user_agent',
        'country',
        'city',
        'device_type',
        'browser',
        'traffic_source',
        'referrer',
        'page_views',
        'total_duration',
        'last_activity'
    ];

    protected $casts = [
        'page_views' => 'integer',
        'total_duration' => 'integer',
        'last_activity' => 'datetime',
    ];

    /**
     * Get the page visits for this session
     */
    public function pageVisits()
    {
        return $this->hasMany(PageVisit::class, 'session_id', 'session_id');
    }

    /**
     * Get the product views for this session
     */
    public function productViews()
    {
        return $this->hasMany(ProductView::class, 'session_id', 'session_id');
    }

    /**
     * Get the checkout events for this session
     */
    public function checkoutEvents()
    {
        return $this->hasMany(CheckoutEvent::class, 'session_id', 'session_id');
    }
}
