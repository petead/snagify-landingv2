import { Resend } from 'resend';
import { sendMetaEvent, readMetaCookies } from './_meta';

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export const config = { runtime: 'nodejs' };

async function sendLeadEvent(req: any, body: any, email: string) {
  const eventId = body?.eventId;
  if (!eventId) return;

  const cookieHeader = req.headers?.cookie as string | undefined;
  const { fbp, fbc } = readMetaCookies(cookieHeader);
  const forwarded = (req.headers?.['x-forwarded-for'] as string | undefined) || '';
  const clientIp = forwarded.split(',')[0]?.trim() || null;

  await sendMetaEvent({
    eventName: 'Lead',
    eventId,
    eventSourceUrl: body?.eventSourceUrl,
    email,
    fbp,
    fbc,
    clientIp,
    clientUserAgent: (req.headers?.['user-agent'] as string | undefined) || null,
    customData: { content_name: 'newsletter' },
  });
}

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

    await sendLeadEvent(req, body, email);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    // Resend returns an error if contact already exists — treat as success
    const msg = err?.message || '';
    if (msg.toLowerCase().includes('already')) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const email = (body?.email || '').trim().toLowerCase();
        if (email) await sendLeadEvent(req, body, email);
      } catch {
        // never fail the subscribe response because of Meta
      }
      return res.status(200).json({ ok: true, existing: true });
    }
    console.error('subscribe error:', msg);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
