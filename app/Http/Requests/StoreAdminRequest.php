<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\AdminPermission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * A new admin, added by the super admin (the route is limited to them).
 */
final class StoreAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            // Customers share the users table, so the address must be free there too
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')],
            'phone_number' => ['nullable', 'string', 'regex:/^\+?\d{10,15}$/'],
            'password' => ['required', 'string', 'max:255', Password::min(10)->letters()->numbers()],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::in(AdminPermission::values())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'An account already uses that email address.',
            'phone_number.regex' => 'Enter a valid phone number, digits only.',
        ];
    }
}
