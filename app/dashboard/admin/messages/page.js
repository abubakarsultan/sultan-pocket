'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const STATUS_LABEL = { unread: 'Unread', read: 'Read', replied: 'Replied' };

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setMessages(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setStatus(id, status) {
    setBusyId(id);
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id);
    if (error) setError(error.message);
    else load();
    setBusyId(null);
  }

  function toggleOpen(m) {
    setOpenId(openId === m.id ? null : m.id);
    if (m.status === 'unread') setStatus(m.id, 'read');
  }

  return (
    <div>
      <div className="wallet-panel">
        <div className="wallet-panel-head">
          <h2>Contact messages</h2>
          <span>{messages?.length ?? '…'} total</span>
        </div>

        {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div className="wallet-table-wrap">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>From</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Received</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {messages === null && (
                <tr><td colSpan={5} className="wallet-empty">Loading…</td></tr>
              )}
              {messages?.length === 0 && (
                <tr><td colSpan={5} className="wallet-empty">No messages yet.</td></tr>
              )}
              {messages?.map((m) => (
                <>
                  <tr key={m.id} style={{ cursor: 'pointer', fontWeight: m.status === 'unread' ? 700 : 400 }} onClick={() => toggleOpen(m)}>
                    <td>{m.name} <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>({m.email})</span></td>
                    <td>{m.subject}</td>
                    <td><span className="wallet-pill">{STATUS_LABEL[m.status]}</span></td>
                    <td>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions" onClick={(e) => e.stopPropagation()}>
                        {m.status !== 'replied' && (
                          <button className="table-action edit" disabled={busyId === m.id} onClick={() => setStatus(m.id, 'replied')}>
                            Mark replied
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {openId === m.id && (
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--surface-2)', whiteSpace: 'pre-wrap', fontWeight: 400 }}>
                        {m.message}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
