<?php

namespace App\Models;

use App\Enums\AdminPermission;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Hash;

/**
 * @OA\Schema(
 *     schema="Admin",
 *     type="object",
 *     title="Admin",
 *     description="Admin model",
 *     @OA\Property(
 *         property="id",
 *         type="string",
 *         description="MongoDB-like ObjectId",
 *         example="68b74ba7002cda59000d800c"
 *     ),
 *     @OA\Property(
 *         property="name",
 *         type="string",
 *         description="Admin name",
 *         example="John Smith"
 *     ),
 *     @OA\Property(
 *         property="email",
 *         type="string",
 *         format="email",
 *         description="Admin email address",
 *         example="john.smith@admin.com"
 *     ),
 *     @OA\Property(
 *         property="phone_number",
 *         type="string",
 *         description="Admin phone number",
 *         example="+1234567890"
 *     ),
 *     @OA\Property(
 *         property="created_at",
 *         type="string",
 *         format="date-time",
 *         description="Creation timestamp",
 *         example="2025-09-02T20:30:15.000000Z"
 *     ),
 *     @OA\Property(
 *         property="updated_at",
 *         type="string",
 *         format="date-time",
 *         description="Last update timestamp",
 *         example="2025-09-02T20:30:15.000000Z"
 *     )
 * )
 */

class Admin extends Model
{
    use HasFactory;

    // Admins are the murphylog users whose role is 'admin'
    protected $table = 'users';

    // The users table uses auto-increment ids. Keeping the key type as string
    // means ids are still serialized as strings for the frontend.
    public $incrementing = true;

    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'phone',
    ];

    protected $casts = [
        'password' => 'hashed',
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    protected $appends = ['phone_number'];

    protected static function boot()
    {
        parent::boot();

        static::addGlobalScope('admin', function (Builder $query) {
            $query->where('role', 'admin');
        });

        static::creating(function ($model) {
            $model->role = 'admin';
        });
    }

    // phone_number <-> phone
    public function getPhoneNumberAttribute()
    {
        return $this->attributes['phone'] ?? null;
    }

    public function setPhoneNumberAttribute($value)
    {
        $this->attributes['phone'] = $value;
    }

    // Role and permissions (admin_profiles). An admin from before permissions existed has no row.
    public function profile(): HasOne
    {
        return $this->hasOne(AdminProfile::class, 'user_id');
    }

    /**
     * The super admin manages the other admins and can do everything.
     */
    public function isSuperAdmin(): bool
    {
        return (bool) $this->profile?->is_super;
    }

    /**
     * The permissions this admin has.
     *
     * @return list<string>
     */
    public function permissions(): array
    {
        // A super admin has them all, and so does an admin who predates permissions
        if ($this->isSuperAdmin() || $this->profile === null) {
            return AdminPermission::values();
        }

        return array_values(array_intersect(AdminPermission::values(), $this->profile->permissions ?? []));
    }

    public function canDo(AdminPermission|string $permission): bool
    {
        $value = $permission instanceof AdminPermission ? $permission->value : $permission;

        return in_array($value, $this->permissions(), true);
    }

    /**
     * Verify admin password
     */
    public function checkPassword(string $password): bool
    {
        return Hash::check($password, $this->password);
    }
}
