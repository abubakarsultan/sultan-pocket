export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();
    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
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
        reply_to: email,
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
