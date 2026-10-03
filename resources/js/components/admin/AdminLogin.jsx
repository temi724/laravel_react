import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeSlash } from 'iconsax-react';
import { Alert, Button, Field, Input } from './ui';
import { api } from '../../lib/admin';
import store from '../../lib/store';

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const details = store();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { ok, data } = await api('/api/admin/login', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      });

      if (ok && data?.success) {
        // Store authentication token if provided
        if (data.token) {
          localStorage.setItem('admin_token', data.token);
        }

        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
        return;
      }

      setError(data?.message || 'Login failed. Check your email and password.');
    } catch (err) {
      console.error('Login error:', err);
      setError('We could not reach the server. Check your connection and try again.');
    }

    setLoading(false);
  };

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Sign-in form */}
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-16">
        <a href="/" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-gray-600 hover:text-ink">
          <ArrowLeft size={16} color="currentColor" variant="Linear" />
          Back to store
        </a>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <p className="text-lg font-extrabold tracking-tight lg:hidden">{details.name}</p>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight lg:mt-0">Sign in to admin</h1>
          <p className="mt-2 text-sm text-gray-600">Manage products, sales and orders for the store.</p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <Alert tone="error" title="Could not sign you in">
                {error}
              </Alert>
            )}

            <Field label="Email address">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={credentials.email}
                onChange={handleInputChange}
                placeholder="you@example.com"
                disabled={loading}
              />
            </Field>

            <Field label="Password">
              <PasswordInput
                name="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleInputChange}
                disabled={loading}
                visible={showPassword}
                onToggle={() => setShowPassword((visible) => !visible)}
              />
            </Field>

            <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="w-full">
              {loading ? 'Signing in' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-gray-600">Forgot your password? Ask the store owner to reset it for you.</p>
        </div>
      </div>

      {/* Brand panel */}
      <div className="relative hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-16">
        <p className="text-xl font-extrabold tracking-tight">
          Murphylog<span className="font-medium text-white/60"> Global</span>
        </p>

        <div>
          <p className="max-w-md text-4xl leading-tight font-extrabold tracking-tight xl:text-5xl">
            Everything the store sells, <span className="text-brand-soft">in one place.</span>
          </p>
          <ul className="mt-10 grid max-w-md grid-cols-1 gap-3 text-sm text-white/70 sm:grid-cols-2">
            <li className="rounded-2xl bg-white/5 px-4 py-3">Add and price products and deals</li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">Confirm payments and complete orders</li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">Record in-store sales with a receipt</li>
            <li className="rounded-2xl bg-white/5 px-4 py-3">See what visitors view and buy</li>
          </ul>
        </div>

        <p className="text-sm text-white/50">
          {details.address.line}, {details.address.area}
        </p>
      </div>
    </div>
  );
};

// Password field with a show/hide button. Accepts the props Field passes to its control.
const PasswordInput = ({ visible, onToggle, ...props }) => (
  <div className="relative">
    <Input type={visible ? 'text' : 'password'} placeholder="Your password" className="pr-12" {...props} />
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? 'Hide password' : 'Show password'}
      aria-pressed={visible}
      className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink"
    >
      {visible ? <EyeSlash size={18} color="currentColor" variant="Linear" /> : <Eye size={18} color="currentColor" variant="Linear" />}
    </button>
  </div>
);

export default AdminLogin;
