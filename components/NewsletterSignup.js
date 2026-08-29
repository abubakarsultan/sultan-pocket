'use client';
import {useState} from 'react';
import {supabase} from '@/lib/supabaseClient';
export default function NewsletterSignup(){
 const [email,setEmail]=useState(''),[status,setStatus]=useState('idle'),[message,setMessage]=useState('');
 async function submit(e){e.preventDefault();const value=email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(value)){setStatus('error');setMessage('Enter a valid email address.');return}setStatus('loading');const {error}=await supabase.from('newsletter_signups').insert({email:value});if(error&&error.code!=='23505'){setStatus('error');setMessage('Could not subscribe right now. Please try again.');return}setStatus('success');setMessage("Thanks — you're on the list!");setEmail('');}
 return <div className="footer-newsletter"><div><h3>Stay in the loop</h3><p>Occasional money tips and Sultan Pocket updates.</p></div><form onSubmit={submit}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" disabled={status==='loading'}/><button type="submit" disabled={status==='loading'}>{status==='loading'?'Joining…':'Subscribe'}</button></form>{message&&<small className={status==='error'?'is-error':'is-success'}>{message}</small>}</div>;
}
