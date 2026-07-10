import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const firstName = (body?.firstName || '').trim();
    const lastName = (body?.lastName || '').trim();
    const email = (body?.email || '').trim();
    const role = (body?.role || '').trim();
    const subject = (body?.subject || 'General question').trim();
    const message = (body?.message || '').trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!firstName || !lastName || !email || !message || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    // Basic length guard to avoid abuse
    if (message.length > 5000) {
      return res.status(400).json({ error: 'Message too long' });
    }

    await resend.emails.send({
      from: 'Snagify Contact <contact@snagify.net>',
      to: ['hello@snagify.net'],
      replyTo: email,
      subject: `[Contact] ${subject} — ${firstName} ${lastName}`,
      text:
        `New contact form submission\n\n` +
        `Name: ${firstName} ${lastName}\n` +
        `Email: ${email}\n` +
        `Role: ${role}\n` +
        `Subject: ${subject}\n\n` +
        `Message:\n${message}\n`,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('contact error:', err?.message || err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
