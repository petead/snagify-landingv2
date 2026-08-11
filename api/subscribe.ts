import { Resend } from 'resend';
import { sendMetaEvent, readMetaCookies } from './_meta';

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
const CHECKLIST_URL = 'https://snagify.net/downloads/dubai-move-in-checklist.pdf';

export const config = { runtime: 'nodejs' };

function contentNameForSource(source?: string | null): string {
  if (source === 'checklist') return 'checklist_download';
  return source?.trim() || 'newsletter';
}

async function sendLeadEvent(req: any, body: any, email: string, source?: string | null) {
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
    customData: { content_name: contentNameForSource(source) },
  });
}

async function upsertAudienceContact(email: string, source?: string | null) {
  if (!AUDIENCE_ID) {
    throw new Error('Audience not configured');
  }

  const payload: Record<string, unknown> = {
    email,
    unsubscribed: false,
    audienceId: AUDIENCE_ID,
  };
  // Tag source when Resend supports contact properties on this account.
  if (source) {
    payload.properties = { source };
  }

  try {
    await resend.contacts.create(payload as any);
  } catch (err: any) {
    const msg = (err?.message || '').toLowerCase();
    // Retry without properties if the account rejects the field.
    if (source && (msg.includes('propert') || msg.includes('unknown') || msg.includes('invalid'))) {
      await resend.contacts.create({
        email,
        unsubscribed: false,
        audienceId: AUDIENCE_ID,
      });
      return;
    }
    throw err;
  }
}

async function sendChecklistEmail(email: string) {
  await resend.emails.send({
    from: 'Snagify <hello@snagify.net>',
    to: [email],
    subject: 'Your Dubai Move-in Checklist',
    text:
      `Here is your printable Dubai move-in checklist.\n\n` +
      `One A4 page, 20 checkboxes, in the order that protects your deposit.\n\n` +
      `Download: ${CHECKLIST_URL}\n\n` +
      `Pierre\nSnagify`,
    html:
      `<p>Here is your printable Dubai move-in checklist.</p>` +
      `<p>One A4 page, 20 checkboxes, in the order that protects your deposit.</p>` +
      `<p><a href="${CHECKLIST_URL}" style="display:inline-block;padding:12px 20px;background:#0E0E10;color:#FCFCFC;border-radius:999px;text-decoration:none;font-weight:700;">Download the PDF</a></p>` +
      `<p style="color:#666;font-size:13px;">Or open: <a href="${CHECKLIST_URL}">${CHECKLIST_URL}</a></p>` +
      `<p>Pierre<br>Snagify</p>`,
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const email = (body?.email || '').trim().toLowerCase();
    const source = typeof body?.source === 'string' ? body.source.trim().toLowerCase() : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    if (!AUDIENCE_ID) {
      return res.status(500).json({ error: 'Audience not configured' });
    }

    await upsertAudienceContact(email, source || null);

    if (source === 'checklist') {
      try {
        await sendChecklistEmail(email);
      } catch (mailErr: any) {
        // Soft gate: never fail subscribe because the transactional email failed.
        console.error('checklist email error:', mailErr?.message || mailErr);
      }
    }

    await sendLeadEvent(req, body, email, source || null);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.toLowerCase().includes('already')) {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const email = (body?.email || '').trim().toLowerCase();
        const source = typeof body?.source === 'string' ? body.source.trim().toLowerCase() : '';
        if (email && source === 'checklist') {
          try {
            await sendChecklistEmail(email);
          } catch (mailErr: any) {
            console.error('checklist email error:', mailErr?.message || mailErr);
          }
        }
        if (email) await sendLeadEvent(req, body, email, source || null);
      } catch {
        // never fail the subscribe response because of Meta / email
      }
      return res.status(200).json({ ok: true, existing: true });
    }
    console.error('subscribe error:', msg);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
