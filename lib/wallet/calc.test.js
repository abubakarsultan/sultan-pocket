import test from 'node:test';
import assert from 'node:assert/strict';
import {balances,stats,debtSnapshot,lastDayOfMonth,firstDayOfMonth,money} from './calc.js';

test('income increases the selected cash/online balance',()=>{
  const b=balances([{id:'1',type:'salary',amount:50000,date:'2026-08-01',method:'online'}]);
  assert.equal(b.online,50000);
  assert.equal(b.cash,0);
});

test('expense decreases the selected balance',()=>{
  const tx=[
    {id:'1',type:'salary',amount:50000,date:'2026-08-01',method:'cash'},
    {id:'2',type:'expense',amount:1200,date:'2026-08-02',method:'cash',category:'Food'},
  ];
  assert.equal(balances(tx).cash,48800);
});

test('transfer and withdraw only move money between accounts',()=>{
  const tx=[
    {id:'1',type:'salary',amount:50000,date:'2026-08-01',method:'online'},
    {id:'2',type:'transfer',amount:5000,date:'2026-08-02',from:'online'},
    {id:'3',type:'withdraw',amount:2000,date:'2026-08-03',from:'online'},
  ];
  const b=balances(tx);
  assert.equal(b.online,43000);
  assert.equal(b.cash,7000);
  assert.equal(b.available,50000);
});

test('savings and e-transit balances move without being counted as expenses',()=>{
  const tx=[
    {id:'1',type:'salary',amount:20000,date:'2026-08-01',method:'cash'},
    {id:'2',type:'savings_add',amount:5000,date:'2026-08-02',method:'cash'},
    {id:'3',type:'etransit_add',amount:1000,date:'2026-08-03',from:'cash'},
    {id:'4',type:'expense',amount:250,date:'2026-08-04',method:'etransit',category:'Transport'},
  ];
  const b=balances(tx);
  assert.equal(b.cash,14000);
  assert.equal(b.savings,5000);
  assert.equal(b.etransit,750);
});

test('borrow and repay update debt and balances',()=>{
  const tx=[
    {id:'1',type:'salary',amount:10000,date:'2026-08-01',method:'cash'},
    {id:'2',type:'borrow',amount:3000,date:'2026-08-02',method:'cash',person:'Ali',repayRequired:true},
    {id:'3',type:'repay',amount:1000,date:'2026-08-03',method:'cash',person:'Ali'},
  ];
  const b=balances(tx);
  assert.equal(b.cash,12000);
  assert.equal(b.owed,2000);
  assert.equal(debtSnapshot(tx).Ali.remaining,2000);
});

test('month stats expose opening and closing balances',()=>{
  const tx=[
    {id:'1',type:'salary',amount:10000,date:'2026-07-01',method:'cash'},
    {id:'2',type:'expense',amount:2000,date:'2026-08-05',method:'cash',category:'Food'},
  ];
  const s=stats(tx,'2026-08');
  assert.equal(s.openingBalances.cash,10000);
  assert.equal(s.closingBalances.cash,8000);
  assert.equal(s.expenses,2000);
});

test('month date helpers are deterministic',()=>{
  assert.equal(firstDayOfMonth('2026-02'),'2026-02-01');
  assert.equal(lastDayOfMonth('2026-02'),'2026-02-28');
});


test('money supports display currencies without changing the default',()=>{
  assert.equal(money(1000,'USD'),'$ 1,000');
  assert.equal(money(1000),'Rs. 1,000');
});
