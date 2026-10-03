<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Enums\AdminPermission;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdminRequest;
use App\Http\Requests\UpdateAdminRequest;
use App\Http\Resources\AdminResource;
use App\Models\Admin;
use App\Services\AdminTeam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The Settings page: the super admin adds admins, chooses what each may do,
 * and deactivates or reactivates them. Every route here is limited to the super admin.
 */
final class AdminTeamController extends Controller
{
    public function __construct(private readonly AdminTeam $team) {}

    public function index(Request $request): JsonResponse
    {
        $admins = Admin::with('profile')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'admins' => AdminResource::collection($admins)->resolve($request),
            'permissions' => AdminPermission::catalogue(),
        ]);
    }

    public function store(StoreAdminRequest $request): JsonResponse
    {
        $admin = $this->team->create($request->validated(), $this->viewer($request));

        return response()->json([
            'success' => true,
            'message' => "{$admin->name} can now sign in.",
            'admin' => (new AdminResource($admin))->resolve($request),
        ], 201);
    }

    public function update(UpdateAdminRequest $request, string $id): JsonResponse
    {
        $admin = $this->team->update(Admin::with('profile')->findOrFail($id), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Changes saved.',
            'admin' => (new AdminResource($admin))->resolve($request),
        ]);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate(['active' => ['required', 'boolean']]);

        $admin = $this->team->setActive(
            Admin::with('profile')->findOrFail($id),
            (bool) $validated['active'],
            $this->viewer($request)
        );

        return response()->json([
            'success' => true,
            'message' => $admin->is_active ? "{$admin->name} can sign in again." : "{$admin->name} has been deactivated.",
            'admin' => (new AdminResource($admin))->resolve($request),
        ]);
    }

    private function viewer(Request $request): Admin
    {
        /** @var Admin $admin */
        $admin = $request->attributes->get('admin');

        return $admin;
    }
}
