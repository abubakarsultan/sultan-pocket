export const DEFAULT_EXPENSE_CATEGORIES = ['Transport','Food','Shopping','Bills','Entertainment','Education','Personal','Other'];
export const DEFAULT_INCOME_CATEGORIES = ['Monthly Salary','Family','Other Income'];

export const TYPES = {
  salary:'Monthly Salary',
  income_other:'Other Income',
  expense:'Expense',
  transfer:'Cash / Online Transfer',
  withdraw:'Withdraw Online → Cash',
  etransit_add:'E-Transit Top-up',
  savings_add:'Savings Added',
  savings_use:'Savings Used',
  borrow:'Borrowed Money',
  repay:'Debt Repayment',
};

export const todayISO = () => new Date().toISOString().slice(0,10);
export const monthOf = d => String(d || '').slice(0,7);
export const lastDayOfMonth = m => {
  const [y, mo] = String(m).split('-').map(Number);
  return `${m}-${String(new Date(y, mo, 0).getDate()).padStart(2,'0')}`;
};
export const firstDayOfMonth = m => `${m}-01`;
export const shiftMonth = (m, delta) => {
  let [y, mo] = String(m).split('-').map(Number);
  mo += delta;
  while (mo > 12) { mo -= 12; y += 1; }
  while (mo < 1) { mo += 12; y -= 1; }
  return `${y}-${String(mo).padStart(2,'0')}`;
};
export const monthLabel = m => new Date(`${m}-01T00:00:00`).toLocaleString('en-US',{month:'long',year:'numeric'});
export const monthCutoff = m => {
  const today = todayISO();
  return m === today.slice(0,7) ? today : lastDayOfMonth(m);
};

export const CURRENCY_SYMBOLS = {
  PKR: 'Rs.',
  USD: '$',
  GBP: '£',
  EUR: '€',
};

export const CURRENCY_LOCALES = {
  PKR: 'en-PK',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
};

export const money = (n, currency = 'PKR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || 'Rs.';
  const locale = CURRENCY_LOCALES[currency] || 'en-US';
  return `${symbol} ${Math.round(Number(n) || 0).toLocaleString(locale)}`;
};
export const sum = (xs, fn=x=>x) => xs.reduce((a,x) => a + (Number(fn(x)) || 0), 0);

export function debtSnapshot(transactions, upto) {
  const people = {};
  for (const t of transactions) {
    if (upto && String(t.date) > upto) continue;
    if (!['borrow','repay'].includes(t.type)) continue;
    const person = String(t.person || 'Unknown').trim() || 'Unknown';
    if (!people[person]) people[person] = {borrowed:0,repaid:0,remaining:0};
    const amount = Number(t.amount) || 0;
    if (t.type === 'borrow' && t.repayRequired !== false) people[person].borrowed += amount;
    if (t.type === 'repay') people[person].repaid += amount;
  }
  Object.values(people).forEach(v => { v.remaining = Math.max(0, v.borrowed - v.repaid); });
  return people;
}

export function balances(transactions, upto) {
  let cash=0, online=0, etransit=0, savings=0;
  let borrowed=0, repaid=0;
  const list = transactions
    .filter(x => !upto || String(x.date) <= upto)
    .slice()
    .sort((a,b) => String(a.date).localeCompare(String(b.date)) || String(a.created_at||'').localeCompare(String(b.created_at||'')) || String(a.id||'').localeCompare(String(b.id||'')));

  for (const t of list) {
    const a = Number(t.amount) || 0;
    if (a <= 0) continue;
    if (['salary','income_other'].includes(t.type)) {
      if (t.method === 'cash') cash += a; else online += a;
    } else if (t.type === 'borrow') {
      if (t.method === 'cash') cash += a; else online += a;
      if (t.repayRequired !== false) borrowed += a;
    } else if (t.type === 'repay') {
      if (t.method === 'cash') cash -= a; else online -= a;
      repaid += a;
    } else if (t.type === 'expense') {
      if (t.method === 'cash') cash -= a;
      else if (t.method === 'online') online -= a;
      else etransit -= a;
    } else if (t.type === 'transfer') {
      if (t.from === 'cash') { cash -= a; online += a; }
      else { online -= a; cash += a; }
    } else if (t.type === 'withdraw') {
      online -= a; cash += a;
    } else if (t.type === 'etransit_add') {
      if (t.from === 'cash') cash -= a; else online -= a;
      etransit += a;
    } else if (t.type === 'savings_add') {
      if (t.method === 'cash') cash -= a; else online -= a;
      savings += a;
    } else if (t.type === 'savings_use') {
      savings -= a;
      if (t.destination === 'cash') cash += a; else online += a;
    }
  }

  const debt = debtSnapshot(list, upto);
  const owed = Object.values(debt).reduce((a,v) => a + v.remaining, 0);
  return {
    cash, online, etransit, savings,
    borrowed, repaid, owed,
    available: cash + online,
    total: cash + online + savings + etransit,
  };
}

export function stats(transactions, m) {
  const tx = transactions.filter(t => monthOf(t.date) === m);
  const expenses = tx.filter(t => t.type === 'expense');
  const incomes = tx.filter(t => ['salary','income_other'].includes(t.type));
  const income = sum(incomes, t => t.amount);
  const expenseTotal = sum(expenses, t => t.amount);
  const byCategory = {};
  const incomeByCategory = {};
  expenses.forEach(t => {
    const key = t.category || 'Other';
    byCategory[key] = (byCategory[key] || 0) + (Number(t.amount) || 0);
  });
  incomes.forEach(t => {
    const key = t.category || t.source || 'Other Income';
    incomeByCategory[key] = (incomeByCategory[key] || 0) + (Number(t.amount) || 0);
  });
  const transport = sum(expenses, t => t.category === 'Transport' ? t.amount : 0);
  const savingsAdded = sum(tx, t => t.type === 'savings_add' ? t.amount : 0);
  const savingsUsed = sum(tx, t => t.type === 'savings_use' ? t.amount : 0);
  const borrowed = sum(tx, t => t.type === 'borrow' && t.repayRequired !== false ? t.amount : 0);
  const repaid = sum(tx, t => t.type === 'repay' ? t.amount : 0);
  const closingBalances = balances(transactions, monthCutoff(m));
  const previousMonth = shiftMonth(m,-1);
  const openingBalances = balances(transactions, lastDayOfMonth(previousMonth));
  return {
    tx, income, expenses: expenseTotal, byCategory, incomeByCategory, transport,
    savingsAdded, savingsUsed, borrowed, repaid,
    balances: closingBalances,
    openingBalances,
    closingBalances,
    debtByPerson: debtSnapshot(transactions, monthCutoff(m)),
    net: income - expenseTotal,
  };
}

export function monthSummary(transactions,m){
  const s=stats(transactions,m);
  return {
    opening:s.openingBalances.total,
    income:s.income,
    expenses:s.expenses,
    savings:s.savingsAdded,
    transport:s.transport,
    closing:s.closingBalances.total,
  };
}

export function transactionLabel(t) {
  return TYPES[t?.type] || t?.type || 'Transaction';
}
