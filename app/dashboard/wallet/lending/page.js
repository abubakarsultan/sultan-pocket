'use client';

import {useMemo} from 'react';
import {useWallet} from '@/components/wallet/WalletProvider';
import {lendingSnapshot,money} from '@/lib/wallet/calc';

export default function LendingPage(){
  const {state,currency}=useWallet();
  const transactions=state?.transactions||[];
  const people=useMemo(()=>lendingSnapshot(transactions),[transactions]);
  const rows=Object.entries(people).filter(([,v])=>v.lent>0||v.recovered>0);
  const totalLent=rows.reduce((n,[,v])=>n+v.lent,0), totalRecovered=rows.reduce((n,[,v])=>n+v.recovered,0), totalOutstanding=rows.reduce((n,[,v])=>n+v.remaining,0);
  const add=(type)=>window.dispatchEvent(new CustomEvent('wallet:add',{detail:type}));
  return <main className="wallet-page"><section className="wallet-panel"><div className="wallet-panel-head"><div><span className="wallet-section-kicker">RECEIVABLES</span><h1>Money Lent</h1><p>Track money you have given to other people and what they still owe you.</p></div></div><div className="wallet-grid three"><div className="wallet-card"><small>Total lent</small><strong>{money(totalLent,currency)}</strong></div><div className="wallet-card"><small>Received back</small><strong>{money(totalRecovered,currency)}</strong></div><div className="wallet-card"><small>Still owed to you</small><strong>{money(totalOutstanding,currency)}</strong></div></div><div className="wallet-modal-foot"><button className="wallet-btn primary" onClick={()=>add('lend')}>+ Lend Money</button><button className="wallet-btn secondary" onClick={()=>add('lend_repay')}>Receive Repayment</button></div></section><section className="wallet-panel"><div className="wallet-panel-head"><div><span className="wallet-section-kicker">PEOPLE</span><h2>Outstanding amounts</h2></div></div>{!rows.length?<p className="chart-note">No money has been lent yet.</p>:<div className="table-wrap"><table className="wallet-table"><thead><tr><th>Person</th><th>Lent</th><th>Received</th><th>Outstanding</th></tr></thead><tbody>{rows.map(([person,v])=><tr key={person}><td>{person}</td><td>{money(v.lent,currency)}</td><td>{money(v.recovered,currency)}</td><td><strong>{money(v.remaining,currency)}</strong></td></tr>)}</tbody></table></div>}</section></main>;
}
