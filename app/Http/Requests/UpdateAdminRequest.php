<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\AdminPermission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Changes to an existing admin. The password is optional: left empty, it stays as it is.
 */
final class UpdateAdminRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')->ignore($this->route('id'))],
            'phone_number' => ['nullable', 'string', 'regex:/^\+?\d{10,15}$/'],
            'password' => ['nullable', 'string', 'max:255', Password::min(10)->letters()->numbers()],
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
