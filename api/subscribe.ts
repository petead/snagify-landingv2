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

const REMINDER_HORIZON_MS = 30 * 24 * 60 * 60 * 1000 - 60 * 60 * 1000;
const SIGNUP_URL = 'https://app.snagify.net/signup?ref=move-in-reminder';

function parseMoveInDate(raw: string): { reminderAt: Date; remindOn: string; immediate: boolean } | { error: string } {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return { error: 'Use the date format dd/mm/yyyy.' };

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const stamp = new Date(Date.UTC(year, month - 1, day));
  const valid =
    month >= 1 &&
    month <= 12 &&
    stamp.getUTCFullYear() === year &&
    stamp.getUTCMonth() === month - 1 &&
    stamp.getUTCDate() === day;
  if (!valid) return { error: 'That move-in date is not valid.' };

  const moveInStart = Date.UTC(year, month - 1, day) - 4 * 60 * 60 * 1000;
  if (Date.now() >= moveInStart) {
    return { error: 'That move-in date has already started. Start the free report now.' };
  }

  const reminderAt = new Date(Date.UTC(year, month - 1, day - 1, 5, 0, 0));
  if (reminderAt.getTime() > Date.now() + REMINDER_HORIZON_MS) {
    return { error: 'We can set this reminder up to 30 days ahead.' };
  }

  const remindOn = reminderAt.toLocaleDateString('en-GB', { timeZone: 'UTC' });
  return { reminderAt, remindOn, immediate: reminderAt.getTime() <= Date.now() + 2 * 60 * 1000 };
}

async function sendMoveInReminder(email: string, moveInLabel: string, scheduledAt?: string) {
  const subject = 'Your move-in is tomorrow';
  const text =
    `Your move-in is tomorrow, ${moveInLabel}.\n\n` +
    `A signed check-in is what protects the deposit. It is free, and it takes about 20 minutes on your phone.\n\n` +
    `Start the report: ${SIGNUP_URL}\n\n` +
    `Pierre A\nSnagify`;
  const html =
    `<p>Your move-in is tomorrow, ${moveInLabel}.</p>` +
    `<p>A signed check-in is what protects the deposit. It is free, and it takes about 20 minutes on your phone.</p>` +
    `<p><a href="${SIGNUP_URL}" style="display:inline-block;padding:12px 20px;background:#0E0E10;color:#FCFCFC;border-radius:999px;text-decoration:none;font-weight:700;">Start my free move-in report</a></p>` +
    `<p>Pierre A<br>Snagify</p>`;

  const sent = await resend.emails.send({
    from: 'Snagify <hello@snagify.net>',
    to: [email],
    subject,
    text,
    html,
    ...(scheduledAt ? { scheduledAt } : {}),
  });
  if (sent?.error) {
    throw new Error(sent.error.message || 'Could not schedule the reminder');
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
      `Pierre A\nSnagify`,
    html:
      `<p>Here is your printable Dubai move-in checklist.</p>` +
      `<p>One A4 page, 20 checkboxes, in the order that protects your deposit.</p>` +
      `<p><a href="${CHECKLIST_URL}" style="display:inline-block;padding:12px 20px;background:#0E0E10;color:#FCFCFC;border-radius:999px;text-decoration:none;font-weight:700;">Download the PDF</a></p>` +
      `<p style="color:#666;font-size:13px;">Or open: <a href="${CHECKLIST_URL}">${CHECKLIST_URL}</a></p>` +
      `<p>Pierre A<br>Snagify</p>`,
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
    const moveInRaw = typeof body?.moveInDate === 'string' ? body.moveInDate : '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    let reminder: ReturnType<typeof parseMoveInDate> | null = null;
    if (source === 'reminder') {
      reminder = parseMoveInDate(moveInRaw);
      if ('error' in reminder) return res.status(400).json({ error: reminder.error });
    }

    if (!AUDIENCE_ID) {
      return res.status(500).json({ error: 'Audience not configured' });
    }

    await upsertAudienceContact(email, source || null);

    if (reminder && !('error' in reminder)) {
      const moveInLabel = new Date(Date.UTC(
        Number(moveInRaw.slice(6, 10)),
        Number(moveInRaw.slice(3, 5)) - 1,
        Number(moveInRaw.slice(0, 2)),
      )).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      await sendMoveInReminder(
        email,
        moveInLabel,
        reminder.immediate ? undefined : reminder.reminderAt.toISOString(),
      );
      await sendLeadEvent(req, body, email, source || null);
      return res.status(200).json({ ok: true, remindOn: reminder.remindOn, immediate: reminder.immediate });
    }

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
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const email = (body?.email || '').trim().toLowerCase();
      const source = typeof body?.source === 'string' ? body.source.trim().toLowerCase() : '';
      if (email && source === 'reminder') {
        const again = parseMoveInDate(typeof body?.moveInDate === 'string' ? body.moveInDate : '');
        if ('error' in again) return res.status(400).json({ error: again.error });
        const moveInLabel = new Date(Date.UTC(
          Number(String(body.moveInDate).slice(6, 10)),
          Number(String(body.moveInDate).slice(3, 5)) - 1,
          Number(String(body.moveInDate).slice(0, 2)),
        )).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
        await sendMoveInReminder(
          email,
          moveInLabel,
          again.immediate ? undefined : again.reminderAt.toISOString(),
        );
        try { await sendLeadEvent(req, body, email, source); } catch { /* lead is optional */ }
        return res.status(200).json({ ok: true, existing: true, remindOn: again.remindOn, immediate: again.immediate });
      }
      try {
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
