export const DEFAULT_EXPENSE_CATEGORIES=['Transport','Food','Shopping','Bills','Entertainment','Education','Personal','Other'];
export const DEFAULT_INCOME_CATEGORIES=['Monthly Stipend','Family','Other Income'];
export const TYPES={stipend:'Monthly Stipend',income_other:'Other Income',expense:'Expense',transfer:'Transfer',withdraw:'Withdraw Cash',etransit_add:'E-Transit Top-up',savings_add:'Savings Added',savings_use:'Savings Used',borrow:'Borrowed Money',repay:'Repayment'};
export const todayISO=()=>new Date().toISOString().slice(0,10);
export const monthOf=d=>String(d).slice(0,7);
export const lastDayOfMonth=m=>{const[y,mo]=m.split('-').map(Number);return `${m}-${String(new Date(y,mo,0).getDate()).padStart(2,'0')}`};
export const firstDayOfMonth=m=>`${m}-01`;
export function shiftMonth(m,delta){let[y,mo]=m.split('-').map(Number);mo+=delta;while(mo>12){mo-=12;y++}while(mo<1){mo+=12;y--}return `${y}-${String(mo).padStart(2,'0')}`}
export function monthLabel(m){return new Date(`${m}-01T00:00:00`).toLocaleString('en-US',{month:'long',year:'numeric'})}
export function monthCutoff(m){const today=todayISO();return m===today.slice(0,7)?today:lastDayOfMonth(m)}
export const money=n=>`Rs. ${Math.round(Number(n)||0).toLocaleString('en-US')}`;
export const sum=(xs,fn=x=>x)=>xs.reduce((a,x)=>a+(Number(fn(x))||0),0);
export function balances(transactions,upto){
 let cash=0,online=0,etransit=0,savings=0,owed=0,repaid=0,borrowed=0;
 for(const t of transactions.filter(x=>!upto||x.date<=upto)){
  const a=Number(t.amount)||0;
  if(['stipend','income_other'].includes(t.type)){t.method==='cash'?cash+=a:online+=a}
  else if(t.type==='borrow'){t.method==='cash'?cash+=a:online+=a;if(t.repayRequired){owed+=a;borrowed+=a}}
  else if(t.type==='repay'){t.method==='cash'?cash-=a:online-=a;owed=Math.max(0,owed-a);repaid+=a}
  else if(t.type==='expense'){if(t.method==='cash')cash-=a;else if(t.method==='online')online-=a;else etransit-=a}
  else if(t.type==='transfer'){if(t.from==='cash'){cash-=a;online+=a}else{online-=a;cash+=a}}
  else if(t.type==='withdraw'){online-=a;cash+=a}
  else if(t.type==='etransit_add'){t.from==='cash'?cash-=a:online-=a;etransit+=a}
  else if(t.type==='savings_add'){t.method==='cash'?cash-=a:online-=a;savings+=a}
  else if(t.type==='savings_use'){savings-=a;t.destination==='cash'?cash+=a:online+=a}
 }
 return {cash,online,etransit,savings,owed:Math.max(0,owed),repaid,borrowed,available:cash+online,total:cash+online+savings+etransit};
}
export function stats(transactions,m){
 const tx=transactions.filter(t=>monthOf(t.date)===m),exp=tx.filter(t=>t.type==='expense');
 const income=sum(tx,t=>['stipend','income_other'].includes(t.type)?t.amount:0),expenses=sum(exp,t=>t.amount);
 const byCategory={},incomeByCategory={};
 exp.forEach(t=>byCategory[t.category||'Other']=(byCategory[t.category||'Other']||0)+Number(t.amount||0));
 tx.filter(t=>['stipend','income_other'].includes(t.type)).forEach(t=>incomeByCategory[t.category||t.source||'Other Income']=(incomeByCategory[t.category||t.source||'Other Income']||0)+Number(t.amount||0));
 const transport=sum(exp,t=>t.category==='Transport'?t.amount:0);
 const monthBalances=balances(transactions,monthCutoff(m));
 const debtByPerson={};
 transactions.filter(t=>t.date<=monthCutoff(m)&&['borrow','repay'].includes(t.type)).forEach(t=>{
  const person=t.person||'Unknown';
  if(!debtByPerson[person])debtByPerson[person]={borrowed:0,repaid:0,remaining:0};
  if(t.type==='borrow'&&t.repayRequired!==false)debtByPerson[person].borrowed+=Number(t.amount)||0;
  if(t.type==='repay')debtByPerson[person].repaid+=Number(t.amount)||0;
 });
 Object.values(debtByPerson).forEach(v=>v.remaining=Math.max(0,v.borrowed-v.repaid));
 return {tx,income,expenses,byCategory,incomeByCategory,transport,savingsAdded:sum(tx,t=>t.type==='savings_add'?t.amount:0),savingsUsed:sum(tx,t=>t.type==='savings_use'?t.amount:0),borrowed:sum(tx,t=>t.type==='borrow'?t.amount:0),repaid:sum(tx,t=>t.type==='repay'?t.amount:0),balances:monthBalances,debtByPerson};
}
