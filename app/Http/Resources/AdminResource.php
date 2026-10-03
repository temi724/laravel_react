<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * An admin as the Settings page shows them. The password never leaves the server.
 *
 * @mixin Admin
 */
final class AdminResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $viewer = $request->attributes->get('admin');

        return [
            'id' => (string) $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone_number' => $this->phone_number,
            'is_active' => (bool) $this->is_active,
            'is_super' => $this->isSuperAdmin(),
            'permissions' => $this->permissions(),
            'is_you' => $viewer instanceof Admin && (string) $viewer->id === (string) $this->id,
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
