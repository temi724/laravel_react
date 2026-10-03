<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\AdminPermission;
use App\Models\Admin;
use App\Models\AdminProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * The super admin's management of the other admins: adding them, choosing what each
 * may do, and switching their access off and on again.
 */
final class AdminTeam
{
    /**
     * @param  array{name: string, email: string, password: string, phone_number?: string|null, permissions?: list<string>|null}  $data
     */
    public function create(array $data, Admin $by): Admin
    {
        return DB::transaction(function () use ($data, $by): Admin {
            $admin = Admin::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'], // hashed by the model
                'phone_number' => $data['phone_number'] ?? null,
            ]);

            AdminProfile::create([
                'user_id' => $admin->id,
                'is_super' => false,
                'permissions' => $this->clean($data['permissions'] ?? []),
                'created_by' => $by->id,
            ]);

            // Read back from the database, so defaults it filled in (active, timestamps) are present
            return $admin->refresh()->load('profile');
        });
    }

    /**
     * @param  array{name?: string, email?: string, password?: string|null, phone_number?: string|null, permissions?: list<string>|null}  $data
     */
    public function update(Admin $admin, array $data): Admin
    {
        return DB::transaction(function () use ($admin, $data): Admin {
            $admin->fill(array_intersect_key($data, array_flip(['name', 'email', 'phone_number'])));

            // An empty password field means "keep the current one"
            if (! empty($data['password'])) {
                $admin->password = $data['password'];
            }
            $admin->save();

            // A super admin can do everything, so there is nothing to switch on or off
            if (array_key_exists('permissions', $data) && ! $admin->isSuperAdmin()) {
                AdminProfile::updateOrCreate(
                    ['user_id' => $admin->id],
                    ['permissions' => $this->clean($data['permissions'] ?? [])]
                );
            }

            return $admin->load('profile');
        });
    }

    /**
     * Deactivate or reactivate an admin. A deactivated admin is signed out at their next
     * request and cannot sign in again until reactivated.
     */
    public function setActive(Admin $admin, bool $active, Admin $by): Admin
    {
        if (! $active && (string) $admin->id === (string) $by->id) {
            throw ValidationException::withMessages(['active' => ['You cannot deactivate your own account.']]);
        }

        if (! $active && $admin->isSuperAdmin()) {
            throw ValidationException::withMessages(['active' => ['A super admin cannot be deactivated.']]);
        }

        $admin->is_active = $active;
        $admin->save();

        return $admin->load('profile');
    }

    /**
     * Only real permissions are stored, in their usual order.
     *
     * @param  array<int, mixed>  $permissions
     * @return list<string>
     */
    private function clean(array $permissions): array
    {
        return array_values(array_intersect(AdminPermission::values(), $permissions));
    }
}
