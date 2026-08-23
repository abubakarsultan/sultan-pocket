import { rateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const rl = rateLimit(request, { limit: 5, windowMs: 60_000, keyPrefix: 'contact' });
    if (!rl.ok) return rateLimitResponse(rl.retryAfterSeconds);

    const { name, email, subject, message } = await request.json();
    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (String(message).length > 5000) {
      return Response.json({ error: 'Message is too long.' }, { status: 400 });
    }

    // Save to the database first so the message survives even if the email
    // send below fails or Resend is having issues. Non-fatal if this errors.
    try {
      const admin = supabaseAdmin();
      await admin.from('contact_messages').insert({
        name: String(name).trim(),
        email: String(email).trim(),
        subject: String(subject).trim(),
        message: String(message).trim(),
      });
    } catch (dbErr) {
      console.error('Failed to save contact message to DB:', dbErr);
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sultan Pocket Contact <noreply@sultanpocket.online>',
        to: [process.env.CONTACT_RECEIVER_EMAIL],
        reply_to: [email],
        subject: `[Contact] ${subject}`,
        text: `From: ${name} <${email}>\n\n${message}`,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', errText);
      return Response.json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error('Contact form error:', e);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
