'use client';

import { useMemo } from 'react';
import { useWallet } from '@/components/wallet/WalletProvider';
import { money, monthLabel, shiftMonth, stats } from '@/lib/wallet/calc';

function pct(value, total) {
  if (!total) return 0;
  return Math.round((Number(value) / Number(total)) * 100);
}

export default function ReportsPage() {
  const { state, month, setMonth, currency, loading, guest } = useWallet();
  const transactions = state?.transactions || [];
  const report = useMemo(() => stats(transactions, month), [transactions, month]);
  const categories = Object.entries(report.byCategory).sort((a, b) => b[1] - a[1]);
  const incomes = Object.entries(report.incomeByCategory).sort((a, b) => b[1] - a[1]);
  const expenseTotal = report.expenses || 0;
  const savingsRate = report.income ? Math.round((report.net / report.income) * 100) : 0;

  if (loading) return <div className="wallet-page"><div className="wallet-card"><p>Loading reports…</p></div></div>;

  return (
    <div className="wallet-page">
      <div className="wallet-page-head">
        <div>
          <span className="wallet-kicker">ANALYTICS</span>
          <h2>Reports & Insights</h2>
          <p>Understand where your money came from, where it went, and what you kept.</p>
        </div>
        <div className="wallet-actions">
          <button className="wallet-btn" onClick={() => setMonth(shiftMonth(month, -1))}>‹</button>
          <div className="wallet-month">{monthLabel(month)}</div>
          <button className="wallet-btn" onClick={() => setMonth(shiftMonth(month, 1))}>›</button>
        </div>
      </div>

      {guest && <div className="wallet-card" style={{ marginBottom: 16 }}><strong>Guest report</strong><p>Your report uses the transactions stored on this device. Create an account to keep your financial history across devices.</p></div>}

      <div className="wallet-stats-grid">
        <div className="wallet-stat-card"><span>Income</span><strong>{money(report.income, currency)}</strong><small>{report.tx.length} transactions</small></div>
        <div className="wallet-stat-card"><span>Expenses</span><strong>{money(report.expenses, currency)}</strong><small>{report.income ? `${pct(report.expenses, report.income)}% of income` : 'No income recorded'}</small></div>
        <div className="wallet-stat-card"><span>Net flow</span><strong>{money(report.net, currency)}</strong><small>{savingsRate >= 0 ? `${savingsRate}% retained` : 'Spending exceeded income'}</small></div>
        <div className="wallet-stat-card"><span>Savings added</span><strong>{money(report.savingsAdded, currency)}</strong><small>{money(report.savingsUsed, currency)} used</small></div>
      </div>

      <div className="wallet-grid-2">
        <section className="wallet-card">
          <div className="wallet-card-head"><div><h3>Expense breakdown</h3><p>Where this month's spending went.</p></div></div>
          {categories.length ? <div className="report-list">{categories.map(([name, value]) => <div className="report-row" key={name}><div className="report-row-top"><span>{name}</span><b>{money(value, currency)}</b></div><div className="report-bar"><i style={{ width: `${Math.min(100, pct(value, expenseTotal))}%` }} /></div><small>{pct(value, expenseTotal)}% of expenses</small></div>)}</div> : <div className="wallet-empty"><strong>No expenses yet</strong><p>Add an expense to start building your spending report.</p></div>}
        </section>

        <section className="wallet-card">
          <div className="wallet-card-head"><div><h3>Income sources</h3><p>How this month's income was received.</p></div></div>
          {incomes.length ? <div className="report-list">{incomes.map(([name, value]) => <div className="report-row" key={name}><div className="report-row-top"><span>{name}</span><b>{money(value, currency)}</b></div><div className="report-bar"><i style={{ width: `${Math.min(100, pct(value, report.income))}%` }} /></div><small>{pct(value, report.income)}% of income</small></div>)}</div> : <div className="wallet-empty"><strong>No income yet</strong><p>Add salary or other income to see the breakdown.</p></div>}
        </section>
      </div>

      <div className="wallet-grid-3">
        <div className="wallet-card"><span className="wallet-kicker">TRANSPORT</span><h3>{money(report.transport, currency)}</h3><p>Transport spending this month.</p></div>
        <div className="wallet-card"><span className="wallet-kicker">BORROWED</span><h3>{money(report.borrowed, currency)}</h3><p>{money(report.repaid, currency)} repaid this month.</p></div>
        <div className="wallet-card"><span className="wallet-kicker">LENT</span><h3>{money(report.lent, currency)}</h3><p>{money(report.recovered, currency)} received back this month.</p></div>
      </div>

      <section className="wallet-card">
        <div className="wallet-card-head"><div><h3>Financial position</h3><p>Balances at the end of {monthLabel(month)}.</p></div></div>
        <div className="wallet-stats-grid compact">
          <div><span>Available</span><strong>{money(report.balances.available, currency)}</strong></div>
          <div><span>Cash</span><strong>{money(report.balances.cash, currency)}</strong></div>
          <div><span>Online</span><strong>{money(report.balances.online, currency)}</strong></div>
          <div><span>Savings</span><strong>{money(report.balances.savings, currency)}</strong></div>
          <div><span>People owe you</span><strong>{money(report.balances.dueToYou, currency)}</strong></div>
          <div><span>You owe</span><strong>{money(report.balances.owed, currency)}</strong></div>
        </div>
      </section>
    </div>
  );
}
