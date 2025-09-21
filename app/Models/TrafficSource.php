<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrafficSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'source',
        'medium',
        'campaign',
        'referrer_domain',
        'sessions',
        'page_views',
        'users',
        'bounce_rate',
        'avg_session_duration'
    ];

    protected $casts = [
        'sessions' => 'integer',
        'page_views' => 'integer',
        'users' => 'integer',
        'bounce_rate' => 'decimal:2',
        'avg_session_duration' => 'decimal:2',
    ];
}
