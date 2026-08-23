'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const ROLES = ['user', 'editor', 'admin'];

async function authedFetch(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Something went wrong');
  return body;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) setError(error.message);
    else setUsers(data || []);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleInvite(e) {
    e.preventDefault();
    setError(''); setNotice('');
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await authedFetch('/api/admin/invite', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      setNotice(`Invite sent to ${inviteEmail.trim()}.`);
      setInviteEmail(''); setInviteRole('user');
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(id, role) {
    setBusyId(id); setError('');
    try {
      await authedFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusToggle(id, currentStatus) {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setBusyId(id); setError('');
    try {
      await authedFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    setBusyId(id); setError('');
    try {
      await authedFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="wallet-panel" style={{ marginBottom: 15 }}>
        <h2>Invite a user</h2>
        <form onSubmit={handleInvite} className="wallet-form-grid" style={{ padding: '13px 0 0' }}>
          <div>
            <label>Email</label>
            <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div>
            <label>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="wallet-btn primary" disabled={inviting} type="submit">
              {inviting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}
      {notice && <div className="form-notice" style={{ marginBottom: 12 }}>{notice}</div>}

      <div className="wallet-panel">
        <div className="wallet-panel-head">
          <h2>All users</h2>
          <span>{users?.length ?? '…'} total</span>
        </div>
        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last sign-in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users === null && (
                <tr><td colSpan={6} className="wallet-empty">Loading…</td></tr>
              )}
              {users?.length === 0 && (
                <tr><td colSpan={6} className="wallet-empty">No users yet.</td></tr>
              )}
              {users?.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={isSelf || busyId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className="wallet-pill">{u.status}</span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="table-action edit"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => handleStatusToggle(u.id, u.status)}
                        >
                          {u.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                        </button>
                        <button
                          className="table-action delete"
                          disabled={isSelf || busyId === u.id}
                          onClick={() => setConfirmDelete(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete && (
        <div className="gate-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <h2>Delete {confirmDelete.email}?</h2>
            <p>This permanently deletes their account and all of their data. This can't be undone.</p>
            <div className="confirm-actions">
              <button className="wallet-btn" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="wallet-btn danger-fill" onClick={() => handleDelete(confirmDelete.id)}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
