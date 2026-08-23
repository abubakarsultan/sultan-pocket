'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

const ROLES = ['user', 'editor', 'admin'];
const PAGE_SIZE = 25;

const ACTION_LABEL = {
  invite_user: 'invited',
  change_role: 'changed role for',
  suspend_user: 'suspended',
  reinstate_user: 'reinstated',
  delete_user: 'deleted',
};

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
  const [confirmRole, setConfirmRole] = useState(null); // { user, newRole }
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [activity, setActivity] = useState(null);

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) setError(error.message);
    else setUsers(data || []);
  }, []);

  const loadActivity = useCallback(async () => {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (!error) setActivity(data || []);
  }, []);

  useEffect(() => { loadUsers(); loadActivity(); }, [loadUsers, loadActivity]);

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      if (search.trim() && !u.email.toLowerCase().includes(search.trim().toLowerCase())) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

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
      loadUsers(); loadActivity();
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  }

  async function applyRoleChange(target, role) {
    setBusyId(target.id); setError('');
    try {
      await authedFetch(`/api/admin/users/${target.id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
      setConfirmRole(null);
      loadUsers(); loadActivity();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  function handleRoleSelect(target, newRole) {
    if (newRole === target.role) return;
    // Always confirm — promoting to admin is high-risk, but a mistaken
    // demotion/change is just as easy to do by accident from a dropdown.
    setConfirmRole({ user: target, newRole });
  }

  async function handleStatusToggle(id, currentStatus) {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    setBusyId(id); setError('');
    try {
      await authedFetch(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      loadUsers(); loadActivity();
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
      loadUsers(); loadActivity();
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
          <span>{filtered.length} of {users?.length ?? '…'} total</span>
        </div>

        <div className="wallet-panel-tools" style={{ marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            type="search"
            placeholder="Search by email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: '1 1 200px', minWidth: 160, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '8px 11px', fontSize: 12.5, color: 'var(--text)' }}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </select>
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
              {users?.length > 0 && filtered.length === 0 && (
                <tr><td colSpan={6} className="wallet-empty">No users match your search/filters.</td></tr>
              )}
              {users?.length === 0 && (
                <tr><td colSpan={6} className="wallet-empty">No users yet.</td></tr>
              )}
              {pageSlice.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        disabled={isSelf || busyId === u.id}
                        onChange={(e) => handleRoleSelect(u, e.target.value)}
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

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 12.5 }}>
            <button className="wallet-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
            <span style={{ color: 'var(--text-faint)' }}>Page {page} of {totalPages}</span>
            <button className="wallet-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      <div className="wallet-panel" style={{ marginTop: 15 }}>
        <div className="wallet-panel-head">
          <h2>Recent activity</h2>
        </div>
        {activity === null && <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>Loading…</p>}
        {activity?.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-faint)' }}>No activity yet.</p>}
        {activity && activity.length > 0 && (
          <div className="metric-list">
            {activity.map((a) => (
              <div key={a.id}>
                <span>
                  <b style={{ color: 'var(--text)' }}>{a.actor_email || 'Someone'}</b> {ACTION_LABEL[a.action] || a.action}
                  {a.target_email ? <> <b style={{ color: 'var(--text)' }}>{a.target_email}</b></> : null}
                  {a.details?.new_role ? <> → {a.details.new_role}</> : null}
                </span>
                <b style={{ fontWeight: 500, color: 'var(--text-faint)' }}>{new Date(a.created_at).toLocaleString()}</b>
              </div>
            ))}
          </div>
        )}
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

      {confirmRole && (
        <div className="gate-backdrop" onClick={() => setConfirmRole(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">!</div>
            <h2>
              {confirmRole.newRole === 'admin'
                ? `Make ${confirmRole.user.email} an admin?`
                : `Change ${confirmRole.user.email}'s role to ${confirmRole.newRole}?`}
            </h2>
            <p>
              {confirmRole.newRole === 'admin'
                ? 'They will get full access to the admin panel, including inviting, suspending, and deleting other users.'
                : `Their access level will change from "${confirmRole.user.role}" to "${confirmRole.newRole}".`}
            </p>
            <div className="confirm-actions">
              <button className="wallet-btn" onClick={() => setConfirmRole(null)}>Cancel</button>
              <button className="wallet-btn primary" onClick={() => applyRoleChange(confirmRole.user, confirmRole.newRole)}>
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
