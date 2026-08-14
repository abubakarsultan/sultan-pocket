'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from './WalletProvider';
import { supabase } from '@/lib/supabaseClient';

import {
  money,
  monthLabel,
  monthOf,
  shiftMonth,
  stats,
  transactionLabel,
  todayISO,
  monthSummary,
  TYPES
} from '@/lib/wallet/calc';


/* =========================
   QUICK ACTIONS
========================= */

function Actions({ items }) {
  const { user, guest, guestLimitReached } = useWallet();

  const run = (detail) => {
    if (user || (guest && !guestLimitReached)) {
      window.dispatchEvent(
        new CustomEvent('wallet:add', {
          detail
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('wallet:guest-limit')
      );
    }
  };

  return (
    <section className="wallet-action-panel">

      <div className="wallet-panel-head action-panel-head">

        <div>
          <span className="wallet-section-kicker">
            QUICK ACTIONS
          </span>
        </div>

        <span>
          {items.length} actions
        </span>

      </div>

      <div className="wallet-action-grid">

        {items.map(
          ([kind, label, icon, detail]) => (
            <button
              key={`${kind}-${label}`}
              className={`wallet-action-card action-${kind}`}
              onClick={() =>
                run(detail || kind)
              }
            >

              <span className="action-icon">
                {icon}
              </span>

              <span>
                <b>{label}</b>

                <small>
                  {actionDescription(kind)}
                </small>
              </span>

              <span className="action-arrow">
                →
              </span>

            </button>
          )
        )}

      </div>

      {!user && (
        <small className="wallet-action-note">
          Guest mode: transactions are saved only on this device. You can save up to 3 transactions; create a free account for unlimited cloud storage.
        </small>
      )}

    </section>
  );
}


function actionDescription(kind) {
  const d = {
    income: 'Record money received',
    expense: 'Record a new expense',
    transfer: 'Move money between balances',
    withdraw: 'Move online money to cash',
    savings_add: 'Set money aside',
    savings_use: 'Return money from savings',
    etransit_add: 'Top up transport wallet',
    transport: 'Record transport spending',
    borrow: 'Record money received as debt',
    repay: 'Record a debt repayment'
  };

  return d[kind] || 'Add a transaction';
}


/* =========================
   CARD
========================= */

function Card({
  label,
  value,
  sub,
  accent
}) {
  return (
    <div
      className="wallet-card"
      style={{
        '--accent':
          accent || 'var(--signal)'
      }}
    >

      <small>
        {label}
      </small>

      <strong>
        {value}
      </strong>

      {sub && (
        <span>
          {sub}
        </span>
      )}

    </div>
  );
}


/* =========================
   DEMO NOTICE
========================= */

function DemoNotice() {
  const router = useRouter();
  const {guestTransactionsUsed, guestTransactionLimit, basePath} = useWallet();

  return (
    <div className="wallet-demo">
      <b>Guest mode</b>
      <span>
        Your data is saved on this device only. {guestTransactionsUsed}/{guestTransactionLimit} transaction slots used. Create a free account to keep your data safely in the cloud and use Sultan Pocket across devices.
      </span>
      <button
        className="wallet-btn primary"
        onClick={() => router.push(`/signup?next=${encodeURIComponent(basePath)}`)}
      >
        Create free account
      </button>
    </div>
  );
}

/* =========================
   DATA
========================= */

function useData() {
  const {
    state,
    user,
    month,
    currency,
    add
  } = useWallet();

  const tx = state.transactions;

  const s = stats(tx, month);

  return {
    user,
    tx,
    month,
    s,
    b: s.balances,
    state,
    currency,
    add
  };
}



function UpcomingRecurring({rules,transactions,add,currency,user,basePath}){
  const currentMonth=todayISO().slice(0,7);
  const today=Number(todayISO().slice(8,10));
  const upcoming=(rules||[]).filter(rule=>{
    if(!rule.active||Number(rule.day_of_month)>today)return false;
    return !(transactions||[]).some(t=>
      monthOf(t.date)===currentMonth &&
      t.type===rule.type &&
      Number(t.amount)===Number(rule.amount) &&
      String(t.category||'')===String(rule.category||'')
    );
  });

  if(!user||!rules?.length)return null;

  async function addRule(rule){
    const ok=await add({
      type:rule.type,
      amount:Number(rule.amount),
      date:todayISO(),
      category:rule.category||'',
      method:rule.method||'',
      source:rule.source||rule.category||'',
      person:rule.person||'',
      notes:rule.notes||'',
      repayRequired:true
    });
    if(!ok)return;
  }

  return <section className="wallet-panel upcoming-panel">
    <div className="wallet-panel-head">
      <div><span className="wallet-section-kicker">UPCOMING THIS MONTH</span><h2>Recurring transactions</h2></div>
      <Link className="wallet-text-link" href={`${basePath}/recurring`}>Manage rules →</Link>
    </div>
    {!upcoming.length?<p className="chart-note">Nothing is waiting to be added for {monthLabel(currentMonth)}.</p>:<div className="upcoming-list">
      {upcoming.map(rule=><div className="upcoming-row" key={rule.id}>
        <div><strong>{rule.category||transactionLabel(rule)}</strong><small>{transactionLabel(rule)} · Day {rule.day_of_month}</small></div>
        <b>{money(rule.amount,currency)}</b>
        <button className="wallet-btn primary" onClick={()=>addRule(rule)}>+ Add to Wallet</button>
      </div>)}
    </div>}
  </section>;
}

/* =========================
   DASHBOARD
========================= */

export function Dashboard() {
  return (
    <Page>
      <DashboardInner />
    </Page>
  );
}


function DashboardInner() {

  const {
    user,
    tx,
    month,
    s,
    b,
    currency,
    add,
    state
  } = useData();

  const {basePath}=useWallet();

  const recent = tx
    .slice()
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        Number(b.id) - Number(a.id)
    )
    .slice(0, 8);

  const incomeCats =
    Object.entries(
      s.incomeByCategory
    );

  const expenseCats =
    Object.entries(s.byCategory);

  const actions = [
    ['income', 'Add Income', '+'],
    ['expense', 'Add Expense', '−'],
    [
      'transfer',
      'Cash ↔ Online Transfer',
      '⇄'
    ],
    [
      'withdraw',
      'Withdraw Online → Cash',
      '↓'
    ],
    [
      'savings_add',
      'Add Savings',
      '◒'
    ],
    [
      'savings_use',
      'Use Savings',
      '↑'
    ],
    [
      'etransit_add',
      'Add to E-Transit',
      '◉'
    ],
    [
      'transport',
      'Transport Expense',
      '↗',
      {
        type: 'expense',
        category: 'Transport',
        method: 'etransit'
      }
    ],
    [
      'borrow',
      'Borrow Money',
      '↙'
    ],
    [
      'repay',
      'Repay Money',
      '↗'
    ]
  ];

  return (
    <>

      <Actions items={actions} />

      <UpcomingRecurring
        rules={state?.recurringRules||[]}
        transactions={tx}
        add={add}
        currency={currency}
        user={user}
        basePath={basePath}
      />

      <div className="wallet-grid four">

        <Card
          label="Available spending"
          value={money(b.available, currency)}
          sub="Cash + online"
        />

        <Card
          label="Cash balance"
          value={money(b.cash, currency)}
          sub="Physical cash"
        />

        <Card
          label="Online balance"
          value={money(b.online, currency)}
          sub="Bank / digital"
        />

        <Card
          label="Savings"
          value={money(b.savings, currency)}
          sub="Money set aside"
          accent="var(--success)"
        />

        <Card
          label="E-Transit wallet"
          value={money(b.etransit, currency)}
          sub="Transport balance"
          accent="#8656C4"
        />

        <Card
          label="Money owed"
          value={money(b.owed, currency)}
          sub="Outstanding borrowing"
          accent="var(--danger)"
        />

        <Card
          label="Total money"
          value={money(b.total, currency)}
          sub="Cash + online + savings + E-Transit"
        />

        <Card
          label="Expenses this month"
          value={money(s.expenses, currency)}
          sub={monthLabel(month)}
          accent="var(--danger)"
        />

      </div>

      <MonthlySummary transactions={tx} month={month} currency={currency} />

      <div className="wallet-grid two">

        <section className="wallet-panel">

          <div className="wallet-panel-head">

            <div>
              <span className="wallet-section-kicker">
                MONTHLY OVERVIEW
              </span>

              <h2>
                {monthLabel(month)}
              </h2>
            </div>

            <span>
              {s.net >= 0
                ? 'Positive month'
                : 'Spending exceeded income'}
            </span>

          </div>

          <div className="metric-list">

            <div>
              <span>Opening balance</span>
              <b>
                {money(
                  s.openingBalances.total
                , currency)}
              </b>
            </div>

            <div>
              <span>Income</span>
              <b className="positive">
                {money(s.income, currency)}
              </b>
            </div>

            <div>
              <span>Expenses</span>
              <b className="negative">
                {money(s.expenses, currency)}
              </b>
            </div>

            <div>
              <span>Net cash flow</span>
              <b
                className={
                  s.net >= 0
                    ? 'positive'
                    : 'negative'
                }
              >
                {money(s.net, currency)}
              </b>
            </div>

            <div>
              <span>Savings added</span>
              <b>
                {money(s.savingsAdded, currency)}
              </b>
            </div>

            <div>
              <span>Savings used</span>
              <b>
                {money(s.savingsUsed, currency)}
              </b>
            </div>

            <div>
              <span>Transport</span>
              <b>
                {money(s.transport, currency)}
              </b>
            </div>

            <div>
              <span>Borrowed / repaid</span>
              <b>
                {money(s.borrowed, currency)} /{' '}
                {money(s.repaid, currency)}
              </b>
            </div>

            <div>
              <span>Closing balance</span>
              <b>
                {money(
                  s.closingBalances.total
                , currency)}
              </b>
            </div>

          </div>

        </section>


        <section className="wallet-panel">

          <div className="wallet-panel-head">

            <div>
              <span className="wallet-section-kicker">
                RECENT ACTIVITY
              </span>

              <h2>
                Recent transactions
              </h2>
            </div>

            <Link
              className="wallet-text-link"
              href={`${basePath}/transactions`}
            >
              View all →
            </Link>

          </div>

          <TxTable
            tx={recent}
            empty="No transactions yet."
          />

        </section>

      </div>


      <div className="wallet-grid two">

        <CategorySummary
          title="Income breakdown"
          data={incomeCats}
          positive
          currency={currency}
        />

        <CategorySummary
          title="Expense breakdown"
          data={expenseCats}
          currency={currency}
        />

      </div>


      <section className="wallet-panel carry-forward">

        <div>

          <span className="wallet-section-kicker">
            CARRY FORWARD
          </span>

          <h2>
            {monthLabel(month)}
            {' '}opening balance
          </h2>

          <p>
            Previous month closing balances are
            automatically carried into the selected
            month.
          </p>

        </div>

        <div className="carry-values">

          <span>
            Cash{' '}
            <b>
              {money(
                s.openingBalances.cash
              , currency)}
            </b>
          </span>

          <span>
            Online{' '}
            <b>
              {money(
                s.openingBalances.online
              , currency)}
            </b>
          </span>

          <strong>
            {money(
              s.openingBalances.total
            , currency)}
          </strong>

        </div>

      </section>

    </>
  );
}



function MonthlySummary({transactions,month,currency}){
  const summary=monthSummary(transactions,month);
  const rows=[
    ['Opening',summary.opening],
    ['Income',summary.income],
    ['Expenses',summary.expenses],
    ['Savings',summary.savings],
    ['Transport',summary.transport],
    ['Closing',summary.closing]
  ];
  return <section className="wallet-panel monthly-summary">
    <div className="wallet-panel-head">
      <div><span className="wallet-section-kicker">MONTHLY CLOSING SUMMARY</span><h2>{monthLabel(month)}</h2></div>
    </div>
    <div className="monthly-summary-grid">
      {rows.map(([label,value])=><div key={label}><span>{label}</span><strong>{money(value,currency)}</strong></div>)}
    </div>
  </section>;
}

/* =========================
   CATEGORY SUMMARY
========================= */

function CategorySummary({
  title,
  data,
  positive,
  currency
}) {

  const max = Math.max(
    1,
    ...data.map(
      ([, v]) => Number(v) || 0
    )
  );

  return (
    <section className="wallet-panel">

      <div className="wallet-panel-head">

        <h2>
          {title}
        </h2>

        <span>
          {data.length} categories
        </span>

      </div>

      {data.length ? (
        data.map(([k, v]) => (

          <div
            className="bar"
            key={k}
          >

            <div>
              <span>{k}</span>

              <b
                className={
                  positive
                    ? 'positive'
                    : ''
                }
              >
                {money(v, currency)}
              </b>
            </div>

            <i>
              <em
                className={
                  positive
                    ? 'income-bar'
                    : ''
                }
                style={{
                  width: `${
                    (Number(v) || 0) /
                    max *
                    100
                  }%`
                }}
              />
            </i>

          </div>

        ))
      ) : (
        <div className="wallet-empty">
          No data for this month.
        </div>
      )}

    </section>
  );
}


/* =========================
   TRANSACTIONS
========================= */

export function Transactions() {
  return (
    <Page title="Transactions">
      <TransactionsInner />
    </Page>
  );
}


function TransactionsInner() {

  const { user, tx, importTransactions } = useData();
  const { guest } = useWallet();

  const [search, setSearch] =
    useState('');

  const [type, setType] =
    useState('all');

  const [category, setCategory] =
    useState('all');

  const [method, setMethod] =
    useState('all');

  const [person, setPerson] =
    useState('');

  const [filterMonth, setFilterMonth] =
    useState('all');

  const [importRows,setImportRows]=useState([]);
  const [importErrors,setImportErrors]=useState([]);
  const [importFileName,setImportFileName]=useState('');
  const [importBusy,setImportBusy]=useState(false);

  const categories = [
    ...new Set(
      tx
        .map(t => t.category)
        .filter(Boolean)
    )
  ].sort();


  const types = [
    ...new Set(
      tx.map(t => t.type)
    )
  ].sort();


  const months = [
    ...new Set(
      tx.map(t => monthOf(t.date))
    )
  ]
    .sort()
    .reverse();


  const filtered = useMemo(
    () =>
      tx.filter(t => {

        const q =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !q ||
          [
            t.category,
            t.source,
            t.person,
            t.notes,
            t.merchant,
            t.type,
            t.method
          ].some(v =>
            String(v || '')
              .toLowerCase()
              .includes(q)
          );

        return (
          matchesSearch &&
          (type === 'all' ||
            t.type === type) &&
          (category === 'all' ||
            t.category === category) &&
          (method === 'all' ||
            (t.method || t.from) ===
              method) &&
          (filterMonth === 'all' ||
            monthOf(t.date) ===
              filterMonth) &&
          (!person ||
            String(t.person || '')
              .toLowerCase()
              .includes(
                person.toLowerCase()
              ))
        );
      }),
    [
      tx,
      search,
      type,
      category,
      method,
      filterMonth,
      person
    ]
  );


  async function handleImportFile(e){
    const file=e.target.files?.[0];
    e.target.value='';
    setImportRows([]);setImportErrors([]);setImportFileName('');
    if(!file)return;
    if(!/\.csv$/i.test(file.name)){setImportErrors([{row:0,error:'Please select a CSV file.'}]);return;}
    try{
      const text=await file.text();
      const parsed=parseWalletCSV(text);
      setImportFileName(file.name);
      setImportRows(parsed.rows);
      setImportErrors(parsed.errors);
    }catch(err){
      setImportErrors([{row:0,error:err.message||'Could not read the CSV file.'}]);
    }
  }

  async function confirmImport(){
    if(!importRows.length)return;
    setImportBusy(true);
    const result=await importTransactions(importRows);
    setImportBusy(false);
    setImportErrors(prev=>[...prev,...(result.errors||[])]);
    if(result.imported>0){
      setImportRows([]);
      setImportFileName('');
    }
  }

  function reset() {
    setSearch('');
    setType('all');
    setCategory('all');
    setMethod('all');
    setPerson('');
    setFilterMonth('all');
  }


  return (
    <section className="wallet-panel">

      <div className="wallet-panel-head">

        <div>

          <span className="wallet-section-kicker">
            LEDGER
          </span>

          <h2>
            All transactions
          </h2>

        </div>

        <div className="wallet-panel-tools">

          <span>
            {filtered.length} shown
          </span>

          <>
            <button
              className="wallet-btn export-btn"
              onClick={() => exportCSV(filtered)}
            >
              ↓ Export CSV
            </button>
            <input id="wallet-csv-import" type="file" accept=".csv,text/csv" hidden onChange={handleImportFile}/>
            <label className="wallet-btn secondary csv-import-trigger" htmlFor="wallet-csv-import">↑ Import CSV</label>
          </>

        </div>

      </div>

      {importFileName&&<div className="csv-import-wrap"><span className="csv-import-file">{importFileName}</span></div>}

      {(importRows.length>0||importErrors.length>0)&&<div className="csv-import-preview">
        <div className="wallet-panel-head">
          <div><span className="wallet-section-kicker">CSV IMPORT PREVIEW</span><h2>{importRows.length} transactions found, ready to import</h2></div>
          <button className="wallet-btn secondary" onClick={()=>{setImportRows([]);setImportErrors([]);setImportFileName('');}}>Clear</button>
        </div>
        {importRows.length>0&&<div className="csv-preview-table"><table className="wallet-table"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Category</th><th>Merchant</th></tr></thead><tbody>{importRows.slice(0,8).map((r,i)=><tr key={i}><td>{r.date}</td><td>{transactionLabel(r)}</td><td>{r.amount}</td><td>{r.category||'—'}</td><td>{r.merchant||'—'}</td></tr>)}</tbody></table></div>}
        {importRows.length>8&&<p className="chart-note">Showing the first 8 rows.</p>}
        {importErrors.length>0&&<div className="csv-import-errors">{importErrors.map((e,i)=><div key={`${e.row}-${i}`}>Row {e.row||'—'}: {e.error}</div>)}</div>}
        {importRows.length>0&&<button className="wallet-btn primary" onClick={confirmImport} disabled={importBusy}>{importBusy?'Importing…':`Confirm import (${importRows.length})`}</button>}
      </div>}

      <div className="wallet-filters">

        <input
          placeholder="Search transactions…"
          value={search}
          onChange={e =>
            setSearch(e.target.value)
          }
        />

        <select
          value={filterMonth}
          onChange={e =>
            setFilterMonth(e.target.value)
          }
        >
          <option value="all">
            All months
          </option>

          {months.map(m => (
            <option
              key={m}
              value={m}
            >
              {monthLabel(m)}
            </option>
          ))}
        </select>


        <select
          value={type}
          onChange={e =>
            setType(e.target.value)
          }
        >
          <option value="all">
            All types
          </option>

          {types.map(t => (
            <option
              key={t}
              value={t}
            >
              {transactionLabel({
                type: t
              })}
            </option>
          ))}
        </select>


        <select
          value={category}
          onChange={e =>
            setCategory(e.target.value)
          }
        >
          <option value="all">
            All categories
          </option>

          {categories.map(c => (
            <option
              key={c}
              value={c}
            >
              {c}
            </option>
          ))}
        </select>


        <select
          value={method}
          onChange={e =>
            setMethod(e.target.value)
          }
        >
          <option value="all">
            All methods
          </option>

          <option value="cash">
            Cash
          </option>

          <option value="online">
            Online
          </option>

          <option value="etransit">
            E-Transit Wallet
          </option>

        </select>


        <input
          placeholder="Filter by person"
          value={person}
          onChange={e =>
            setPerson(e.target.value)
          }
        />


        <button
          className="wallet-btn secondary"
          onClick={reset}
        >
          Reset filters
        </button>

      </div>


      {!user && (
        <div className="wallet-readonly-note">
          Guest transactions can be edited or deleted on this device. Cloud storage, attachments, recurring rules, and unlimited transactions require an account.
        </div>
      )}


      <TxTable
        tx={filtered
          .slice()
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date
              ) ||
              Number(b.id) -
                Number(a.id)
          )}
        empty="No transactions match your filters."
      />

    </section>
  );
}


/* =========================
   TRANSACTION TABLE
========================= */

function TxTable({
  tx,
  empty
}) {

  const {
    remove,
    user,
    guest,
    currency
  } = useWallet();

  const [confirmId, setConfirmId] =
    useState(null);

  const [attachment, setAttachment] =
    useState(null);

  const [attachmentBusy, setAttachmentBusy] =
    useState(false);

  const [attachmentError, setAttachmentError] =
    useState('');

  async function viewAttachment(transaction){
    if(!transaction?.attachment_path)return;
    setAttachmentError('');
    setAttachmentBusy(true);
    const {data,error}=await supabase.storage
      .from('wallet-attachments')
      .createSignedUrl(transaction.attachment_path,60);
    setAttachmentBusy(false);
    if(error||!data?.signedUrl){
      setAttachmentError(error?.message||'Could not open this attachment.');
      return;
    }
    setAttachment({transaction,url:data.signedUrl});
  }

  if (!tx.length) {
    return (
      <div className="wallet-empty">
        {empty}
      </div>
    );
  }

  const confirmTx =
    tx.find(
      t => t.id === confirmId
    );


  return (
    <>

      <div className="wallet-table-wrap">

        <table className="wallet-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Details</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>

          </thead>


          <tbody>

            {tx.map(t => (

              <tr key={t.id}>

                <td>
                  {t.date}
                </td>


                <td>
                  <span
                    className={`wallet-pill pill-${t.type}`}
                  >
                    {transactionLabel(t)}
                  </span>
                </td>


                <td>

                  {t.category ||
                    t.source ||
                    t.person ||
                    t.notes ||
                    '—'}

                  {t.person && (
                    <small className="table-sub">
                      {t.person}
                    </small>
                  )}

                  {t.attachment_path && (
                    <button
                      type="button"
                      className="attachment-button"
                      onClick={() => viewAttachment(t)}
                      title="View receipt"
                      aria-label="View receipt"
                      disabled={attachmentBusy}
                    >
                      📎
                    </button>
                  )}

                </td>


                <td>
                  {displayMethod(
                    t.method ||
                    t.from
                  )}
                </td>


                <td
                  className={
                    [
                      'salary',
                      'income_other',
                      'borrow',
                      'savings_use'
                    ].includes(t.type)
                      ? 'positive'
                      : 'negative'
                  }
                >
                  {money(t.amount, currency)}
                </td>


                <td>

                  <div className="table-actions">

                    {user || guest ? (
                      <>
                        <button
                          className="table-action edit"
                          onClick={() =>
                            window.dispatchEvent(
                              new CustomEvent(
                                'wallet:edit',
                                {
                                  detail: t
                                }
                              )
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="table-action delete"
                          onClick={() =>
                            setConfirmId(
                              t.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="table-locked">
                        Read only
                      </span>
                    )}

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>


      <div className="wallet-mobile-transactions">

        {tx.map(t => (

          <article
            className="wallet-mobile-tx"
            key={`mobile-${t.id}`}
          >

            <div className="wallet-mobile-tx-top">

              <span
                className={`wallet-pill pill-${t.type}`}
              >
                {transactionLabel(t)}
              </span>

              <time>
                {t.date}
              </time>

            </div>


            <div className="wallet-mobile-tx-main">

              <div>

                <strong>
                  {t.category ||
                    t.source ||
                    t.person ||
                    t.notes ||
                    'Transaction'}

                  {t.attachment_path && (
                    <button
                      type="button"
                      className="attachment-button mobile-attachment-button"
                      onClick={() => viewAttachment(t)}
                      title="View receipt"
                      aria-label="View receipt"
                      disabled={attachmentBusy}
                    >
                      📎
                    </button>
                  )}
                </strong>

                {t.person && (
                  <small>
                    {t.person}
                  </small>
                )}

                <small>
                  {displayMethod(
                    t.method ||
                    t.from
                  )}
                </small>

              </div>


              <b
                className={
                  [
                    'salary',
                    'income_other',
                    'borrow',
                    'savings_use'
                  ].includes(t.type)
                    ? 'positive'
                    : 'negative'
                }
              >
                {money(t.amount, currency)}
              </b>

            </div>


            <div className="wallet-mobile-tx-actions">

              {user || guest ? (
                <>
                  <button
                    className="table-action edit"
                    onClick={() =>
                      window.dispatchEvent(
                        new CustomEvent(
                          'wallet:edit',
                          {
                            detail: t
                          }
                        )
                      )
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="table-action delete"
                    onClick={() =>
                      setConfirmId(
                        t.id
                      )
                    }
                  >
                    Delete
                  </button>
                </>
              ) : (
                <span className="table-locked">
                  Read only
                </span>
              )}

            </div>

          </article>

        ))}

      </div>


      {attachmentBusy && (
        <div className="wallet-attachment-loading" role="status">
          Opening attachment…
        </div>
      )}

      {attachmentError && (
        <div className="wallet-attachment-toast" role="alert">
          {attachmentError}
          <button type="button" onClick={() => setAttachmentError('')}>×</button>
        </div>
      )}

      {attachment && (
        <div
          className="wallet-attachment-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Transaction attachment"
          onClick={() => setAttachment(null)}
        >
          <div
            className="wallet-attachment-lightbox-inner"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              className="wallet-attachment-close"
              aria-label="Close attachment"
              onClick={() => setAttachment(null)}
            >
              ×
            </button>
            <img
              src={attachment.url}
              alt={`Receipt for ${attachment.transaction?.date || 'transaction'}`}
            />
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDelete
          transaction={confirmTx}
          currency={currency}
          close={() =>
            setConfirmId(null)
          }
          confirm={async () => {
            await remove(confirmId);
            setConfirmId(null);
          }}
        />
      )}

    </>
  );
}


/* =========================
   DELETE CONFIRMATION
========================= */

function ConfirmDelete({
  transaction,
  close,
  confirm,
  currency
}) {

  const [busy, setBusy] =
    useState(false);


  async function go() {
    setBusy(true);

    await confirm();

    setBusy(false);
  }


  return (
    <div className="gate-backdrop">

      <div className="confirm-modal">

        <div className="confirm-icon">
          !
        </div>

        <span className="wallet-modal-kicker">
          DELETE TRANSACTION
        </span>

        <h2>
          Delete this transaction?
        </h2>

        <p>
          This cannot be undone.{' '}
          {transaction?.category ||
            transaction?.source ||
            transactionLabel(
              transaction
            )}{' '}
          ·{' '}
          {money(
            transaction?.amount
          , currency)}
        </p>


        <div className="confirm-actions">

          <button
            className="wallet-btn secondary"
            onClick={close}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            className="wallet-btn danger-fill"
            onClick={go}
            disabled={busy}
          >
            {busy
              ? 'Deleting…'
              : 'Yes, delete'}
          </button>

        </div>

      </div>

    </div>
  );
}


/* =========================
   HELPERS
========================= */


function parseWalletCSV(text){
  const rows=parseCSVText(text);
  if(rows.length<2)return {rows:[],errors:[{row:0,error:'CSV must contain a header row and at least one transaction.'}]};
  const headers=rows[0].map(v=>String(v||'').trim().toLowerCase());
  const index=name=>headers.indexOf(name.toLowerCase());
  const required=['date','type','amount'];
  const missing=required.filter(name=>index(name)<0);
  if(missing.length)return {rows:[],errors:[{row:1,error:`Missing required column(s): ${missing.join(', ')}`}]};
  const typeMap={
    'salary':'salary','monthly salary':'salary',
    'income_other':'income_other','other income':'income_other',
    'expense':'expense',
    'transfer':'transfer','cash / online transfer':'transfer',
    'withdraw':'withdraw','withdraw online → cash':'withdraw','withdraw online -> cash':'withdraw',
    'etransit_add':'etransit_add','e-transit top-up':'etransit_add',
    'savings_add':'savings_add','savings added':'savings_add',
    'savings_use':'savings_use','savings used':'savings_use',
    'borrow':'borrow','borrowed money':'borrow',
    'repay':'repay','debt repayment':'repay'
  };
  const methodMap={'cash':'cash','online':'online','e-transit wallet':'etransit','etransit':'etransit'};
  const validTypes=new Set(Object.keys(TYPES));
  const out=[],errors=[];
  rows.slice(1).forEach((raw,i)=>{
    const rowNumber=i+2;
    if(raw.every(v=>!String(v||'').trim()))return;
    const get=name=>index(name)>=0?String(raw[index(name)]||'').trim():'';
    const rawType=get('type').toLowerCase();
    const type=typeMap[rawType]||rawType;
    const amount=Number(get('amount'));
    const date=get('date');
    if(!validTypes.has(type)){errors.push({row:rowNumber,error:`Unknown transaction type "${get('type')}".`});return;}
    if(!Number.isFinite(amount)||amount<=0){errors.push({row:rowNumber,error:'Amount must be a positive number.'});return;}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){errors.push({row:rowNumber,error:'Date must use YYYY-MM-DD.'});return;}
    const d=new Date(`${date}T00:00:00Z`);
    if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==date){errors.push({row:rowNumber,error:'Date is invalid.'});return;}
    const rawMethod=get('method');
    const tx={
      type,amount,date,
      category:get('category'),
      source:get('source'),
      method:methodMap[rawMethod.toLowerCase()]||rawMethod.toLowerCase(),
      person:get('person'),
      merchant:get('merchant'),
      notes:get('notes')
    };
    if(type==='transfer'||type==='withdraw'||type==='etransit_add')tx.from=tx.method==='cash'?'cash':'online';
    if(type==='borrow')tx.repayRequired=true;
    out.push(tx);
  });
  return {rows:out,errors};
}

function parseCSVText(text){
  const rows=[];let row=[];let cell='';let quoted=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(ch==='"'){
      if(quoted&&text[i+1]==='"'){cell+='"';i++;}
      else quoted=!quoted;
    }else if(ch===','&&!quoted){row.push(cell);cell='';}
    else if((ch==='\\n'||ch==='\\r')&&!quoted){
      if(ch==='\\r'&&text[i+1]==='\\n')i++;
      row.push(cell);cell='';
      if(row.some(v=>v!==''))rows.push(row);
      row=[];
    }else cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);if(row.some(v=>v!==''))rows.push(row);}
  return rows;
}

function displayMethod(method) {

  return {
    cash: 'Cash',
    online: 'Online',
    etransit: 'E-Transit Wallet'
  }[method] || '—';

}


function exportCSV(tx) {

  const headers = [
    'Date',
    'Type',
    'Amount',
    'Category',
    'Source',
    'Method',
    'Person',
    'Notes'
  ];


  const rows = tx.map(t => [
    t.date,
    transactionLabel(t),
    t.amount,
    t.category || '',
    t.source || '',
    displayMethod(
      t.method || t.from
    ),
    t.person || '',
    t.notes || ''
  ]);


  const csv = [
    headers,
    ...rows
  ]
    .map(row =>
      row
        .map(v =>
          `"${String(
            v ?? ''
          ).replaceAll(
            '"',
            '""'
          )}"`
        )
        .join(',')
    )
    .join('\n');


  const blob = new Blob(
    [`\ufeff${csv}`],
    {
      type:
        'text/csv;charset=utf-8;'
    }
  );


  const url =
    URL.createObjectURL(blob);

  const a =
    document.createElement('a');

  a.href = url;

  a.download =
    `sultan-pocket-transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  URL.revokeObjectURL(url);
}


/* =========================
   TRANSPORT
========================= */

export function Transport() {

  return (
    <Page title="Transport">
      <TransportInner />
    </Page>
  );

}


function TransportInner() {

  const { user, s, currency } =
    useData();


  const transitUsed =
    s.tx
      .filter(
        t =>
          t.type === 'expense' &&
          t.method === 'etransit'
      )
      .reduce(
        (a, t) =>
          a +
          (Number(t.amount) || 0),
        0
      );


  const otherTransport =
    s.tx
      .filter(
        t =>
          t.type === 'expense' &&
          t.category ===
            'Transport' &&
          t.method !==
            'etransit'
      )
      .reduce(
        (a, t) =>
          a +
          (Number(t.amount) || 0),
        0
      );


  const topups =
    s.tx
      .filter(
        t =>
          t.type ===
          'etransit_add'
      )
      .reduce(
        (a, t) =>
          a +
          (Number(t.amount) || 0),
        0
      );


  return (
    <>

      <Actions
        items={[
          [
            'etransit_add',
            'Add to E-Transit',
            '◉'
          ],
          [
            'transport',
            'Add Transport Expense',
            '↗',
            {
              type: 'expense',
              category:
                'Transport',
              method:
                'etransit'
            }
          ]
        ]}
      />


      <div className="wallet-grid four">

        <Card
          label="Transport this month"
          value={money(
            s.transport
          , currency)}
        />

        <Card
          label="E-Transit used"
          value={money(
            transitUsed
          , currency)}
          accent="#8656C4"
        />

        <Card
          label="Other transport"
          value={money(
            otherTransport
          , currency)}
        />

        <Card
          label="Top-ups"
          value={money(topups, currency)}
          accent="var(--success)"
        />

      </div>


      <section className="wallet-panel">

        <div className="wallet-panel-head">

          <h2>
            Transport activity
          </h2>

          <span>
            {user
              ? 'Your data'
              : 'Demo data'}
          </span>

        </div>

        <TxTable
          tx={s.tx
            .filter(
              t =>
                t.category ===
                  'Transport' ||
                t.type ===
                  'etransit_add'
            )
            .sort(
              (a, b) =>
                b.date.localeCompare(
                  a.date
                )
            )}
          empty="No transport activity this month."
        />

      </section>

    </>
  );
}


/* =========================
   SAVINGS
========================= */

export function Savings() {

  return (
    <Page title="Savings">
      <SavingsInner />
    </Page>
  );

}


function SavingsInner() {

  const { s, b, currency } =
    useData();


  return (
    <>

      <Actions
        items={[
          [
            'savings_add',
            'Add Savings',
            '◒'
          ],
          [
            'savings_use',
            'Use Savings',
            '↑'
          ]
        ]}
      />


      <div className="wallet-grid four">

        <Card
          label="Savings balance"
          value={money(b.savings, currency)}
          accent="var(--success)"
        />

        <Card
          label="Added this month"
          value={money(
            s.savingsAdded
          , currency)}
        />

        <Card
          label="Used this month"
          value={money(
            s.savingsUsed
          , currency)}
          accent="var(--danger)"
        />

        <Card
          label="Available to spend"
          value={money(
            b.available
          , currency)}
        />

      </div>


      <section className="wallet-panel">

        <h2>
          Savings activity
        </h2>

        <TxTable
          tx={s.tx
            .filter(
              t =>
                t.type.startsWith(
                  'savings_'
                )
            )
            .sort(
              (a, b) =>
                b.date.localeCompare(
                  a.date
                )
            )}
          empty="No savings activity this month."
        />

      </section>

    </>
  );
}


/* =========================
   DEBT
========================= */

export function Debt() {

  return (
    <Page title="Debt & Borrowing">
      <DebtInner />
    </Page>
  );

}


function DebtInner() {

  const { s, b, currency } =
    useData();


  const people =
    Object.entries(
      s.debtByPerson
    );


  return (
    <>

      <Actions
        items={[
          [
            'borrow',
            'Borrow Money',
            '↙'
          ],
          [
            'repay',
            'Repay Money',
            '↗'
          ]
        ]}
      />


      <div className="wallet-grid three">

        <Card
          label="Still owed"
          value={money(b.owed, currency)}
          accent="var(--danger)"
        />

        <Card
          label="Borrowed total"
          value={money(
            s.borrowed
          , currency)}
        />

        <Card
          label="Repaid total"
          value={money(
            s.repaid
          , currency)}
          accent="var(--success)"
        />

      </div>


      <section className="wallet-panel">

        <div className="wallet-panel-head">

          <h2>
            Outstanding by person
          </h2>

          <span>
            {people.length} people
          </span>

        </div>


        {people.length ? (

          <div className="debt-list">

            {people.map(
              ([person, v]) => (

                <div
                  className="debt-row"
                  key={person}
                >

                  <div>

                    <strong>
                      {person}
                    </strong>

                    <span>
                      Borrowed{' '}
                      {money(
                        v.borrowed
                      , currency)}{' '}
                      · Repaid{' '}
                      {money(
                        v.repaid
                      , currency)}
                    </span>

                  </div>


                  <b
                    className={
                      v.remaining
                        ? 'negative'
                        : 'positive'
                    }
                  >
                    {v.remaining
                      ? `${money(
                          v.remaining
                        , currency)} remaining`
                      : 'Paid'}
                  </b>

                </div>

              )
            )}

          </div>

        ) : (

          <div className="wallet-empty">
            No debt activity yet.
          </div>

        )}

      </section>


      <section className="wallet-panel">

        <h2>
          Borrowing & repayments this month
        </h2>

        <TxTable
          tx={s.tx
            .filter(
              t =>
                t.type === 'borrow' ||
                t.type === 'repay'
            )
            .sort(
              (a, b) =>
                b.date.localeCompare(
                  a.date
                )
            )}
          empty="No debt activity this month."
        />

      </section>

    </>
  );
}


/* =========================
   CHARTS
========================= */

export function Charts() {

  return (
    <Page title="Charts & statistics">
      <ChartsInner />
    </Page>
  );

}


function ChartsInner() {

  const {
    tx,
    month,
    s,
    currency
  } = useData();


  const history =
    Array.from(
      { length: 6 },
      (_, i) =>
        shiftMonth(
          month,
          i - 5
        )
    ).map(m => ({
      ...stats(tx, m),
      month: m
    }));


  const expenseCats =
    Object.entries(
      s.byCategory
    );


  const incomeCats =
    Object.entries(
      s.incomeByCategory
    );


  const maxSpend =
    Math.max(
      1,
      ...history.map(
        x => x.expenses
      )
    );


  const maxSave =
    Math.max(
      1,
      ...history.map(
        x => x.savingsAdded
      )
    );


  return (
    <>

      <div className="wallet-chart-grid">

        <ChartBars
          title="Income vs expenses · last 6 months"
          items={history.map(
            x => ({
              label:
                shortMonth(
                  x.month
                ),
              a: x.income,
              b: x.expenses
            })
          )}
          aLabel="Income"
          bLabel="Expenses"
          currency={currency}
        />


        <ChartBars
          title="Savings added · last 6 months"
          items={history.map(
            x => ({
              label:
                shortMonth(
                  x.month
                ),
              a:
                x.savingsAdded,
              b: 0
            })
          )}
          aLabel="Savings"
          bLabel=""
          currency={currency}
        />


        <CategorySummary
          title="Expenses by category"
          data={expenseCats}
          currency={currency}
        />


        <CategorySummary
          title="Income by category"
          data={incomeCats}
          positive
          currency={currency}
        />

      </div>


      <section className="wallet-panel">

        <div className="wallet-panel-head">

          <h2>
            Balance distribution
          </h2>

          <span>
            {monthLabel(month)}
            {' '}closing
          </span>

        </div>


        <div className="distribution">

          <BalanceStat
            label="Cash"
            value={
              s.balances.cash
            }
            currency={currency}
          />

          <BalanceStat
            label="Online"
            value={
              s.balances.online
            }
            currency={currency}
          />

          <BalanceStat
            label="Savings"
            value={
              s.balances.savings
            }
            currency={currency}
          />

          <BalanceStat
            label="E-Transit"
            value={
              s.balances.etransit
            }
            currency={currency}
          />

        </div>

      </section>


      <div className="wallet-chart-grid">

        <ChartBars
          title="Transport spending · last 6 months"
          items={history.map(
            x => ({
              label:
                shortMonth(
                  x.month
                ),
              a: x.transport,
              b: 0
            })
          )}
          aLabel="Transport"
          bLabel=""
          currency={currency}
        />


        <ChartBars
          title="Savings balance · last 6 months"
          items={history.map(
            x => ({
              label:
                shortMonth(
                  x.month
                ),
              a:
                x.balances.savings,
              b: 0
            })
          )}
          aLabel="Savings balance"
          bLabel=""
          currency={currency}
        />

      </div>


      <section className="wallet-panel">

        <h2>
          Chart scale
        </h2>

        <p className="chart-note">
          Highest monthly expense:{' '}
          {money(maxSpend, currency)}
          {' '}· Highest monthly savings added:{' '}
          {money(maxSave, currency)}.
          Charts use the selected month
          and the five preceding months.
        </p>

      </section>

    </>
  );
}


function shortMonth(m) {

  return new Date(
    `${m}-01T00:00:00`
  ).toLocaleString(
    'en-US',
    {
      month: 'short'
    }
  );

}


function ChartBars({
  title,
  items,
  aLabel,
  bLabel,
  currency
}) {

  const max =
    Math.max(
      1,
      ...items.map(
        x =>
          Math.max(
            Number(x.a) || 0,
            Number(x.b) || 0
          )
      )
    );


  return (
    <section className="wallet-panel">

      <div className="wallet-panel-head">

        <h2>
          {title}
        </h2>

        <span>
          {aLabel}
          {bLabel
            ? ` · ${bLabel}`
            : ''}
        </span>

      </div>


      <div className="chart-bars">

        {items.map(x => (

          <div
            className="chart-col"
            key={x.label}
          >

            <div className="chart-values">

              <i
                style={{
                  height: `${Math.max(
                    4,
                    (Number(x.a) ||
                      0) /
                      max *
                      100
                  )}%`
                }}
                title={`${aLabel}: ${money(
                  x.a
                , currency)}`}
              />

              {bLabel && (
                <em
                  style={{
                    height: `${Math.max(
                      4,
                      (Number(x.b) ||
                        0) /
                        max *
                        100
                    )}%`
                  }}
                  title={`${bLabel}: ${money(
                    x.b
                  , currency)}`}
                />
              )}

            </div>

            <span>
              {x.label}
            </span>

          </div>

        ))}

      </div>

    </section>
  );
}


function BalanceStat({
  label,
  value,
  currency
}) {

  return (
    <div className="balance-stat">

      <span>
        {label}
      </span>

      <strong>
        {money(value, currency)}
      </strong>

    </div>
  );
}


/* =========================
   PAGE WRAPPER
========================= */

function Page({
  title,
  children
}) {

  const { user } =
    useWallet();

  return (
    <div className="wallet-page">

      {title && (
        <div className="wallet-page-title">

          <div>

            <h2>
              {title}
            </h2>

          </div>

        </div>
      )}


      {!user && (
        <DemoNotice />
      )}


      {children}

    </div>
  );
}