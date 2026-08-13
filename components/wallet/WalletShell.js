'use client';

import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useWallet} from './WalletProvider';
import {monthLabel,shiftMonth} from '@/lib/wallet/calc';
import {useEffect,useState} from 'react';
import ProfileMenu from '@/components/ProfileMenu';

const NAV=[
  ['/dashboard/wallet','▦','Dashboard'],
  ['/dashboard/wallet/transactions','↔','Transactions'],
  ['/dashboard/wallet/transport','◉','Transport'],
  ['/dashboard/wallet/savings','▱','Savings'],
  ['/dashboard/wallet/debt','◌','Debt & Borrowing'],
  ['/dashboard/wallet/charts','◒','Charts & Stats']
];

export default function WalletShell({children,title='Wallet'}){
  const p=usePathname(),r=useRouter();
  const {user,saving,month,setMonth}=useWallet();
  const [gate,setGate]=useState(false);

  useEffect(()=>{
    const open=()=>setGate(true);
    window.addEventListener('wallet:gate',open);
    return()=>window.removeEventListener('wallet:gate',open);
  },[]);

  const protectedAction=fn=>user?fn():setGate(true);

  return <div className="wallet-shell">
    <aside className="wallet-sidebar">
      <Link href="/dashboard/wallet" className="wallet-brand"><span>SP</span><b>Sultan Pocket</b></Link>
      <nav>{NAV.map(([href,ic,label])=><Link className={p===href?'active':''} key={href} href={href}><i>{ic}</i>{label}</Link>)}</nav>
      <div className="wallet-side-foot">
        <Link href="/dashboard">← Main dashboard</Link>
        {user
          ? <Link href={`/u/${encodeURIComponent(user.user_metadata?.username||user.email?.split('@')[0]||'user')}`}>View profile</Link>
          : <button onClick={()=>setGate(true)}>Guest mode · Sign in</button>}
      </div>
    </aside>

    <section className="wallet-main">
      <header className="wallet-topbar">
        <div><h1>{title}</h1></div>
        <div className="wallet-actions">
          <button className="wallet-btn" aria-label="Previous month" onClick={()=>setMonth(shiftMonth(month,-1))}>‹</button>
          <div className="wallet-month">{monthLabel(month)}</div>
          <button className="wallet-btn" aria-label="Next month" onClick={()=>setMonth(shiftMonth(month,1))}>›</button>
          <button className="wallet-btn primary" onClick={()=>protectedAction(()=>window.dispatchEvent(new CustomEvent('wallet:add',{detail:'income'})))}>+ Income</button>
          <button className="wallet-btn danger" onClick={()=>protectedAction(()=>window.dispatchEvent(new CustomEvent('wallet:add',{detail:'expense'})))}>+ Expense</button>
          {user&&<ProfileMenu compact/>}
          {saving&&<span className="wallet-saving">Saving…</span>}
        </div>
      </header>
      <main className="wallet-content">{children}</main>
      <nav className="wallet-mobile-nav" aria-label="Wallet navigation">
        {NAV.slice(0,5).map(([href,ic,label])=><Link className={p===href?'active':''} key={href} href={href}>
          <i aria-hidden="true">{ic}</i><span>{label==='Debt & Borrowing'?'Debt':label}</span>
        </Link>)}
      </nav>
    </section>

    {gate&&<GateModal close={()=>setGate(false)} router={r}/>}
  </div>;
}

function GateModal({close,router}){
  return <div className="gate-backdrop">
    <div className="gate-modal">
      <button className="gate-x" onClick={close} aria-label="Close">×</button>
      <div className="gate-icon">↗</div>
      <span className="wallet-modal-kicker">GUEST MODE</span>
      <h2>Sign in to continue</h2>
      <p>You can browse the Wallet in guest mode, but saving, editing, deleting, categories, and personal data require an account.</p>
      <div className="gate-buttons">
        <button className="wallet-btn primary" onClick={()=>router.push('/signin?next=/dashboard/wallet')}>Sign in</button>
        <button className="wallet-btn" onClick={()=>router.push('/signup?next=/dashboard/wallet')}>Create account</button>
      </div>
    </div>
  </div>;
}
