'use client';

import { useMemo, useState } from 'react';

const TYPE_OPTIONS = [
  ['income', '＋', 'Income', 'Money received'],
  ['expense', '−', 'Expense', 'Everyday spending'],
  ['transfer', '⇄', 'Transfer', 'Cash ↔ Online'],
  ['withdraw', '↓', 'Withdraw', 'Online → Cash'],
  ['savings_add', '◒', 'Add savings', 'Set money aside'],
  ['savings_use', '↑', 'Use savings', 'Return saved money'],
  ['etransit_add', '◉', 'E-Transit', 'Top up transport'],
  ['transport', '↗', 'Transport', 'Transport expense'],
  ['borrow', '↙', 'Borrow', 'Money received as debt'],
  ['repay', '↗', 'Repay', 'Pay a debt'],
  ['lend', '↗', 'Lend', 'Money lent out'],
  ['lend_repay', '↙', 'Receive repayment', 'Money returned'],
];

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚌', Bills: '💡', Shopping: '🛍️', Health: '🩺', Medical: '🩺',
  Education: '📚', Entertainment: '🎬', Rent: '🏠', Groceries: '🛒', Fuel: '⛽', Travel: '✈️',
  Salary: '💼', 'Monthly Salary': '💼', Freelance: '💻', Gifts: '🎁', Other: '📦',
};

function iconForCategory(name) {
  return CATEGORY_ICONS[name] || (String(name).toLowerCase().includes('transport') ? '🚌' : '📁');
}

export default function WalletModalMobile({
  kind,
  form,
  setField,
  categories,
  goals,
  busy,
  editingId,
  currency,
  onKindChange,
  onClose,
  onSubmit,
  closing,
  user,
}) {
  const [step, setStep] = useState(0);
  const isExpense = kind === 'expense';
  const isIncome = kind === 'income';
  const isBorrow = kind === 'borrow';
  const isRepay = kind === 'repay';
  const isLend = kind === 'lend';
  const isLendRepay = kind === 'lend_repay';
  const isSavings = kind === 'savings_add' || kind === 'savings_use';
  const isTransfer = kind === 'transfer' || kind === 'withdraw';
  const isTransit = kind === 'etransit_add';

  const visibleCategories = useMemo(() => categories || [], [categories]);

  function chooseKind(next) {
    onKindChange(next);
    setStep(1);
  }

  function next() {
    if (step === 1 && (!form.amount || Number(form.amount) <= 0)) return;
    if (step === 2) {
      if ((isExpense || isIncome) && !form.category) return;
      if ((isBorrow || isRepay || isLend || isLendRepay) && !String(form.person || '').trim()) return;
      if (isSavings && form.goal_id === '') return;
    }
    setStep(s => Math.min(3, s + 1));
  }

  function previous() { setStep(s => Math.max(0, s - 1)); }

  const title = editingId ? 'Edit transaction' : 'Add transaction';

  return (
    <div className={`wallet-mobile-modal${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="wallet-mobile-modal-head">
        <div><strong>{title}</strong><small>Step {step + 1} of 4</small></div>
        <button type="button" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="wallet-mobile-progress"><span style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>

      <div className="wallet-mobile-modal-body">
        {step === 0 && <section className="wallet-mobile-step">
          <h2>What are you adding?</h2>
          <p>Choose the transaction type first. You can fill in the details next.</p>
          <div className="wallet-type-grid">
            {TYPE_OPTIONS.map(([value, icon, label, description]) => (
              <button key={value} type="button" className={`wallet-type-option${kind === value ? ' selected' : ''}`} onClick={() => chooseKind(value)}>
                <i>{icon}</i><span><strong>{label}</strong><small>{description}</small></span>
              </button>
            ))}
          </div>
        </section>}

        {step === 1 && <section className="wallet-mobile-step">
          <h2>How much?</h2>
          <p>Enter the amount. Use the same currency configured for your wallet.</p>
          <div className="wallet-mobile-amount">
            <label>Amount</label><span className="currency-prefix">{currency}</span>
            <input type="number" min="1" step="1" inputMode="decimal" value={form.amount} onChange={e => setField('amount', e.target.value)} autoFocus placeholder="0" />
          </div>
        </section>}

        {step === 2 && <section className="wallet-mobile-step">
          <h2>Details</h2>
          <p>Pick a category and add the fields that matter for this transaction.</p>
          {(isExpense || isIncome) && <>
            <div className="wallet-category-grid">
              {visibleCategories.map(category => <button key={category} type="button" className={`wallet-category-option${form.category === category ? ' selected' : ''}`} onClick={() => setField('category', category)}><i>{iconForCategory(category)}</i>{category}</button>)}
            </div>
            <div className="wallet-mobile-field"><label>Payment method</label><select value={form.method} onChange={e => setField('method', e.target.value)}><option value="cash">Cash</option><option value="online">Online</option>{isExpense && form.category === 'Transport' && <option value="etransit">E-Transit Wallet</option>}</select></div>
            {isExpense && <div className="wallet-mobile-field"><label>Merchant (optional)</label><input value={form.merchant || ''} onChange={e => setField('merchant', e.target.value)} placeholder="e.g. McDonald's" /></div>}
          </>}
          {isSavings && <>
            <div className="wallet-mobile-field"><label>Savings goal</label><select value={form.goal_id} onChange={e => setField('goal_id', e.target.value)}><option value="">Select savings goal</option><option value="general">General Savings</option>{goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
            <div className="wallet-mobile-field"><label>{kind === 'savings_add' ? 'Save from' : 'Use from'}</label><select value={form.method} onChange={e => setField('method', e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></div>
          </>}
          {isTransit && <div className="wallet-mobile-field"><label>Load from</label><select value={form.from} onChange={e => setField('from', e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></div>}
          {isTransfer && <><div className="wallet-mobile-field"><label>{kind === 'withdraw' ? 'Withdraw from' : 'Transfer from'}</label><select value={form.from} onChange={e => setField('from', e.target.value)}>{kind === 'withdraw' ? <option value="online">Online</option> : <><option value="online">Online</option><option value="cash">Cash</option></>}</select></div>{kind === 'transfer' && <div className="wallet-mobile-field"><label>Transfer to</label><input value={form.from === 'cash' ? 'Online' : 'Cash'} readOnly /></div>}</>}
          {(isBorrow || isRepay || isLend || isLendRepay) && <><div className="wallet-mobile-field"><label>Person</label><input value={form.person} onChange={e => setField('person', e.target.value)} placeholder="Person name" /></div><div className="wallet-mobile-field"><label>{isBorrow ? 'Receive into' : isLend ? 'Lend from' : isLendRepay ? 'Receive into' : 'Repay from'}</label><select value={form.method} onChange={e => setField('method', e.target.value)}><option value="cash">Cash</option><option value="online">Online</option></select></div>{isBorrow && <div className="wallet-mobile-field"><label>Repayment required</label><select value={form.repayRequired ? 'yes' : 'no'} onChange={e => setField('repayRequired', e.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></div>}</>}
          <div className="wallet-mobile-field"><label>Date</label><input type="date" value={form.date} onChange={e => setField('date', e.target.value)} /></div>
          <div className="wallet-mobile-field"><label>Notes (optional)</label><textarea value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Add a note if needed" /></div>
          {!user && <small className="wallet-mobile-note">Receipt uploads are available after you create an account.</small>}
        </section>}

        {step === 3 && <section className="wallet-mobile-step wallet-mobile-confirm">
          <h2>Confirm & save</h2>
          <p>Review the transaction before adding it to your wallet.</p>
          <div className="wallet-mobile-summary">
            <div><span>Type</span><strong>{TYPE_OPTIONS.find(x => x[0] === kind)?.[2] || kind}</strong></div>
            <div><span>Amount</span><strong>{currency} {Number(form.amount || 0).toLocaleString('en-PK')}</strong></div>
            {(isExpense || isIncome) && <div><span>Category</span><strong>{iconForCategory(form.category)} {form.category || '—'}</strong></div>}
            <div><span>Date</span><strong>{form.date}</strong></div>
            {form.method && <div><span>Method</span><strong>{form.method === 'etransit' ? 'E-Transit Wallet' : form.method === 'online' ? 'Online' : 'Cash'}</strong></div>}
            {form.person && <div><span>Person</span><strong>{form.person}</strong></div>}
          </div>
        </section>}
      </div>

      <div className="wallet-mobile-modal-foot">
        {step > 0 ? <button type="button" className="wallet-btn secondary" onClick={previous} disabled={busy}>Back</button> : <button type="button" className="wallet-btn secondary" onClick={onClose} disabled={busy}>Cancel</button>}
        {step < 3 ? <button type="button" className="wallet-btn primary" onClick={next} disabled={busy}>{step === 0 ? 'Choose amount →' : step === 1 ? 'Continue →' : 'Review →'}</button> : <button type="button" className="wallet-btn primary" onClick={() => onSubmit()} disabled={busy}>{busy ? (editingId ? 'Updating…' : 'Saving…') : (editingId ? 'Update transaction' : 'Save transaction')}</button>}
      </div>
    </div>
  );
}
