import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export const config = { runtime: 'nodejs' };

export default async function handler(req: any, res: any) {
  // CORS + method guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = (body?.email || '').trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!AUDIENCE_ID) {
      return res.status(500).json({ error: 'Audience not configured' });
    }

    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: AUDIENCE_ID,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    // Resend returns an error if contact already exists — treat as success
    const msg = err?.message || '';
    if (msg.toLowerCase().includes('already')) {
      return res.status(200).json({ ok: true, existing: true });
    }
    console.error('subscribe error:', msg);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
