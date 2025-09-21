<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PageVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_url',
        'page_title',
        'user_agent',
        'ip_address',
        'referrer',
        'session_id',
        'user_id',
        'country',
        'city',
        'duration'
    ];

    protected $casts = [
        'duration' => 'integer',
    ];

    /**
     * Get the user session this page visit belongs to
     */
    public function userSession()
    {
        return $this->belongsTo(UserSession::class, 'session_id', 'session_id');
    }
}
{
    //
}
