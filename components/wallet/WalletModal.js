'use client';

import { useEffect, useState } from 'react';
import { useWallet } from './WalletProvider';

const INITIAL_FORM = {
  type: 'expense',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'Food',
  method: 'cash',
  source: '',
  person: '',
  notes: '',
  repayRequired: true,
  from: 'cash',
  destination: 'cash',
};

const TITLES = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  withdraw: 'Withdraw cash',
  etransit_add: 'Add E-Transit',
  savings_add: 'Add Savings',
  savings_use: 'Use Savings',
  borrow: 'Borrow Money',
  repay: 'Repay Money',
};

const CATEGORIES = [
  'Transport',
  'Food',
  'Shopping',
  'Bills',
  'Entertainment',
  'Education',
  'Personal',
  'Other',
];

export default function WalletModal() {
  const { user, add } = useWallet();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('expense');
  const [form, setForm] = useState(INITIAL_FORM);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function handleAdd(event) {
      if (!user) return;

      const nextKind = event.detail || 'expense';
      setKind(nextKind);
      setForm({
        ...INITIAL_FORM,
        type: nextKind,
        date: new Date().toISOString().slice(0, 10),
      });
      setOpen(true);
    }

    window.addEventListener('wallet:add', handleAdd);
    return () => window.removeEventListener('wallet:add', handleAdd);
  }, [user]);

  if (!open) return null;

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.amount) return;

    setBusy(true);

    let transaction = {
      ...form,
      amount: Number(form.amount),
      type: kind,
    };

    if (kind === 'income') {
      transaction = {
        ...transaction,
        type: 'income_other',
        source: form.source || 'Other income',
      };
    }

    const saved = await add(transaction);
    setBusy(false);

    if (saved) {
      setOpen(false);
    }
  }

  const isExpense = kind === 'expense';
  const isIncome = kind === 'income';
  const isBorrow = kind === 'borrow';
  const isRepay = kind === 'repay';
  const isSavings = kind === 'savings_add' || kind === 'savings_use';
  const isTransfer = kind === 'transfer' || kind === 'withdraw';
  const isTransit = kind === 'etransit_add';

  return (
    <div className="gate-backdrop">
      <form className="wallet-modal" onSubmit={submit}>
        <div className="wallet-modal-head">
          <h2>{TITLES[kind] || 'Transaction'}</h2>
          <button type="button" onClick={() => setOpen(false)}>
            ×
          </button>
        </div>

        <div className="wallet-form-grid">
          <label>
            Amount
            <input
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={(event) => setField('amount', event.target.value)}
              required
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => setField('date', event.target.value)}
            />
          </label>

          {isExpense && (
            <>
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(event) => setField('category', event.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Payment
                <select
                  value={form.method}
                  onChange={(event) => setField('method', event.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="etransit">E-Transit</option>
                </select>
              </label>
            </>
          )}

          {isIncome && (
            <>
              <label>
                Source
                <input
                  value={form.source}
                  onChange={(event) => setField('source', event.target.value)}
                  placeholder="Salary, client, family..."
                />
              </label>

              <label>
                Method
                <select
                  value={form.method}
                  onChange={(event) => setField('method', event.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </label>
            </>
          )}

          {(isBorrow || isRepay) && (
            <>
              <label>
                Person
                <input
                  value={form.person}
                  onChange={(event) => setField('person', event.target.value)}
                  required
                />
              </label>

              <label>
                Method
                <select
                  value={form.method}
                  onChange={(event) => setField('method', event.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </label>

              {isBorrow && (
                <label>
                  <span style={{ display: 'block' }}>Repayment required</span>
                  <select
                    value={form.repayRequired ? 'yes' : 'no'}
                    onChange={(event) =>
                      setField('repayRequired', event.target.value === 'yes')
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
              )}
            </>
          )}

          {isSavings && (
            <label>
              Destination / source
              <select
                value={
                  kind === 'savings_add' ? form.method : form.destination
                }
                onChange={(event) =>
                  setField(
                    kind === 'savings_add' ? 'method' : 'destination',
                    event.target.value
                  )
                }
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </label>
          )}

          {isTransit && (
            <label>
              Load from
              <select
                value={form.from}
                onChange={(event) => setField('from', event.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </label>
          )}

          {isTransfer && (
            <label>
              {kind === 'withdraw' ? 'From' : 'Transfer from'}
              <select
                value={form.from}
                onChange={(event) => setField('from', event.target.value)}
              >
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </label>
          )}

          {kind === 'transfer' && (
            <label>
              To
              <select
                value={form.from === 'cash' ? 'online' : 'cash'}
                onChange={(event) =>
                  setField(
                    'from',
                    event.target.value === 'online' ? 'cash' : 'online'
                  )
                }
              >
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </label>
          )}

          <label className="full">
            Notes
            <textarea
              value={form.notes}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </label>
        </div>

        <div className="wallet-modal-foot">
          <button
            type="button"
            className="wallet-btn"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>

          <button className="wallet-btn primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
