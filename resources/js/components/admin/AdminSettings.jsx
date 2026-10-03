import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Add, Edit2, People } from 'iconsax-react';
import { Alert, Badge, Button, Card, ConfirmDialog, EmptyState, Field, IconButton, Input, Modal, SectionHeader, Switch, Table, TableMessage, TableSkeleton, Td, Th } from './ui';
import { api, formatDateTime, sanitizePhone } from '../../lib/admin';
import { showToast } from '../../lib/toast';

const emptyForm = { name: '', email: '', phone_number: '', password: '', permissions: [] };

// Permissions keep the order the server lists them in, under their group headings
const groupPermissions = (catalogue) =>
  catalogue.reduce((groups, permission) => {
    const group = groups.find((entry) => entry.name === permission.group);
    if (group) group.items.push(permission);
    else groups.push({ name: permission.group, items: [permission] });
    return groups;
  }, []);

// The add and edit dialog for one admin
const AdminDialog = ({ admin, catalogue, onClose, onSaved }) => {
  const isEdit = Boolean(admin);
  const [form, setForm] = useState(() =>
    admin ? { name: admin.name, email: admin.email, phone_number: admin.phone_number || '', password: '', permissions: admin.permissions || [] } : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const groups = useMemo(() => groupPermissions(catalogue), [catalogue]);

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggle = (permission, on) => {
    setForm((prev) => ({
      ...prev,
      permissions: on ? [...new Set([...prev.permissions, permission])] : prev.permissions.filter((value) => value !== permission),
    }));
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setErrors({});
    setMessage('');

    try {
      const body = { ...form, phone_number: form.phone_number || null, password: form.password || null };
      const { ok, data } = await api(isEdit ? `/api/admin/team/${admin.id}` : '/api/admin/team', { method: isEdit ? 'PUT' : 'POST', body });

      if (ok && data?.success) {
        showToast(data.message || 'Saved');
        onSaved(data.admin);
        return;
      }

      setErrors(data?.errors || {});
      setMessage(data?.errors ? 'Some details need fixing. Check the fields marked below.' : data?.message || 'We could not save this admin. Try again.');
    } catch (error) {
      console.error('Error saving admin:', error);
      setMessage('We could not save this admin. Check your connection and try again.');
    }

    setSaving(false);
  };

  return (
    <Modal
      title={isEdit ? `Edit ${admin.name}` : 'Add an admin'}
      description={isEdit ? undefined : 'They sign in at the admin login page with the email and password you set here.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="admin-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add admin'}
          </Button>
        </>
      }
    >
      <form id="admin-form" onSubmit={save} noValidate className="space-y-5">
        {message && <Alert tone="error">{message}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name}>
            <Input value={form.name} onChange={(e) => setField('name', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Phone" optional error={errors.phone_number}>
            <Input type="tel" inputMode="tel" value={form.phone_number} onChange={(e) => setField('phone_number', sanitizePhone(e.target.value))} placeholder="08030000000" autoComplete="off" />
          </Field>
          <Field label="Email" required error={errors.email} className="sm:col-span-2">
            <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="name@example.com" autoComplete="off" />
          </Field>
          <Field
            label={isEdit ? 'New password' : 'Password'}
            required={!isEdit}
            optional={isEdit}
            error={errors.password}
            hint={isEdit ? 'Leave empty to keep their current password.' : 'At least 10 characters, with letters and numbers. Give it to them in private.'}
            className="sm:col-span-2"
          >
            <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)} autoComplete="new-password" />
          </Field>
          <div className="-mt-2 sm:col-span-2">
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-pressed={showPassword} className="text-sm font-semibold text-brand hover:underline">
              {showPassword ? 'Hide password' : 'Show password'}
            </button>
          </div>
        </div>

        {/* What they can do */}
        <div className="border-t border-gray-100 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-bold">What this admin can do</h3>
              {!admin?.is_super && (
                <p className="text-sm text-gray-600 tabular-nums">
                  {form.permissions.length} of {catalogue.length} switched on
                </p>
              )}
            </div>
            {!admin?.is_super && (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setField('permissions', catalogue.map((permission) => permission.value))}>
                  Allow everything
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setField('permissions', [])}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {admin?.is_super ? (
            <Alert tone="info" className="mt-3">
              A super admin can do everything, including managing the other admins.
            </Alert>
          ) : (
            <div className="mt-4 space-y-5">
              {groups.map((group) => (
                <fieldset key={group.name}>
                  <legend className="text-xs font-semibold text-gray-500">{group.name}</legend>
                  <div className="mt-3 space-y-4">
                    {group.items.map((permission) => (
                      <Switch
                        key={permission.value}
                        checked={form.permissions.includes(permission.value)}
                        onChange={(on) => toggle(permission.value, on)}
                        label={permission.label}
                        description={permission.description}
                      />
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

// Settings: the super admin adds admins, chooses what each can do, and deactivates or reactivates them
const AdminSettings = () => {
  const [admins, setAdmins] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dialog, setDialog] = useState(null); // { admin } to edit, { admin: null } to add
  const [statusChange, setStatusChange] = useState(null); // { admin, active }
  const [statusBusy, setStatusBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, data } = await api('/api/admin/team');
      setAdmins(data?.admins || []);
      setCatalogue(data?.permissions || []);
      setLoadFailed(!ok);
    } catch (error) {
      console.error('Error loading admins:', error);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const keep = (saved) => {
    setAdmins((prev) => {
      const next = prev.some((admin) => admin.id === saved.id) ? prev.map((admin) => (admin.id === saved.id ? saved : admin)) : [...prev, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name));
    });
  };

  const changeStatus = async () => {
    if (!statusChange) return;

    setStatusBusy(true);
    try {
      const { ok, data } = await api(`/api/admin/team/${statusChange.admin.id}/status`, { method: 'PUT', body: { active: statusChange.active } });
      if (ok && data?.success) {
        keep(data.admin);
        showToast(data.message);
      } else {
        showToast(Object.values(data?.errors || {}).flat()[0] || data?.message || 'Could not update the admin', 'error');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      showToast('Could not update the admin', 'error');
    } finally {
      setStatusBusy(false);
      setStatusChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionHeader
          title="Admins"
          description="Add the people who help run the store, choose what each of them can do, and switch off access when someone leaves."
          actions={
            <Button icon={Add} onClick={() => setDialog({ admin: null })}>
              Add admin
            </Button>
          }
        />
      </Card>

      <Table>
        <thead>
          <tr>
            <Th>Admin</Th>
            <Th>Role</Th>
            <Th>Access</Th>
            <Th>Status</Th>
            <Th>Last signed in</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={6} rows={3} />
          ) : loadFailed ? (
            <TableMessage columns={6}>
              <EmptyState title="We could not load the admins" description="Check your connection and try again." action={<Button onClick={load}>Try again</Button>} />
            </TableMessage>
          ) : admins.length === 0 ? (
            <TableMessage columns={6}>
              <EmptyState icon={People} title="No admins yet" description="Add the first person who will help run the store." />
            </TableMessage>
          ) : (
            admins.map((admin) => (
              <tr key={admin.id} className="border-b border-gray-100 last:border-0">
                <Td>
                  <div className={`flex min-w-56 items-center gap-3 ${admin.is_active ? '' : 'opacity-60'}`}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold" aria-hidden="true">
                      {admin.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-semibold">
                        <span className="max-w-56 truncate">{admin.name}</span>
                        {admin.is_you && <Badge tone="brand">You</Badge>}
                      </p>
                      <p className="max-w-64 truncate text-xs text-gray-500">{admin.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge tone={admin.is_super ? 'ink' : 'neutral'}>{admin.is_super ? 'Super admin' : 'Admin'}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-gray-600 tabular-nums">
                  {admin.is_super || admin.permissions.length === catalogue.length ? 'Everything' : admin.permissions.length === 0 ? 'Nothing yet' : `${admin.permissions.length} of ${catalogue.length} permissions`}
                </Td>
                <Td>
                  <Badge tone={admin.is_active ? 'success' : 'neutral'}>{admin.is_active ? 'Active' : 'Deactivated'}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-gray-600">{admin.last_login_at ? formatDateTime(admin.last_login_at) : 'Never'}</Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-2">
                    {!admin.is_super && !admin.is_you && (
                      <Button variant="secondary" size="sm" onClick={() => setStatusChange({ admin, active: !admin.is_active })}>
                        {admin.is_active ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    )}
                    <IconButton icon={Edit2} label={`Edit ${admin.name}`} onClick={() => setDialog({ admin })} />
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {dialog && (
        <AdminDialog
          admin={dialog.admin}
          catalogue={catalogue}
          onClose={() => setDialog(null)}
          onSaved={(saved) => {
            keep(saved);
            setDialog(null);
          }}
        />
      )}

      {statusChange && (
        <ConfirmDialog
          title={statusChange.active ? `Reactivate ${statusChange.admin.name}?` : `Deactivate ${statusChange.admin.name}?`}
          message={
            statusChange.active
              ? 'They will be able to sign in again, with the same permissions as before.'
              : 'They are signed out straight away and cannot sign in until you reactivate them. Nothing they did is deleted.'
          }
          confirmLabel={statusChange.active ? 'Reactivate' : 'Deactivate'}
          tone={statusChange.active ? 'primary' : 'danger'}
          loading={statusBusy}
          onConfirm={changeStatus}
          onCancel={() => setStatusChange(null)}
        />
      )}
    </div>
  );
};

export default AdminSettings;
