<?php

namespace App\Console\Commands;

use App\Models\Admin;
use Illuminate\Console\Command;
use Illuminate\Validation\Rules\Password;

class SetAdminPassword extends Command
{
    protected $signature = 'admin:password {email : The email address the admin signs in with}';

    protected $description = 'Set a new password for an admin. The password is typed at a hidden prompt, never on the command line.';

    public function handle(): int
    {
        $admin = Admin::where('email', $this->argument('email'))->first();
        if (! $admin) {
            $this->error('No admin has that email address.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('New password (at least 12 characters, with letters and numbers)');
        $validator = validator(['password' => $password], [
            'password' => ['required', Password::min(12)->letters()->numbers()],
        ]);

        if ($validator->fails()) {
            $this->error($validator->errors()->first('password'));

            return self::FAILURE;
        }

        if ($password !== (string) $this->secret('Type it again')) {
            $this->error('The two passwords do not match.');

            return self::FAILURE;
        }

        // The model hashes the password as it is saved
        $admin->password = $password;
        $admin->save();

        $this->info("Password updated for {$admin->email}.");

        return self::SUCCESS;
    }
}
