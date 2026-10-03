<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The role and permissions of one admin (a row of the users table whose role is admin).
 *
 * @property int $user_id
 * @property bool $is_super
 * @property list<string>|null $permissions
 */
final class AdminProfile extends Model
{
    protected $fillable = ['user_id', 'is_super', 'permissions', 'created_by'];

    protected $casts = [
        'is_super' => 'boolean',
        'permissions' => 'array',
    ];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'user_id');
    }
}
