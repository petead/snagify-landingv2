import { Resend } from 'resend';
import { sendMetaEvent, readMetaCookies } from './_meta';

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
    const eventId = body?.eventId;
    const eventSourceUrl = body?.eventSourceUrl;

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

    if (eventId) {
      const cookieHeader = req.headers?.cookie as string | undefined;
      const { fbp, fbc } = readMetaCookies(cookieHeader);
      const forwarded = (req.headers?.['x-forwarded-for'] as string | undefined) || '';
      const clientIp = forwarded.split(',')[0]?.trim() || null;

      await sendMetaEvent({
        eventName: 'Lead',
        eventId,
        eventSourceUrl,
        email,
        fbp,
        fbc,
        clientIp,
        clientUserAgent: (req.headers?.['user-agent'] as string | undefined) || null,
        customData: { content_name: 'contact_form' },
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('contact error:', err?.message || err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
