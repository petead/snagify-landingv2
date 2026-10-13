import { parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { Resend } from 'resend';
import { sbInsert, sbSelect } from './_supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { runtime: 'nodejs' };

const CODE_RE = /^[a-z0-9-]{3,40}$/;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body?.website) {
      return res.status(200).json({ ok: true });
    }

    const parsed = parsePhoneNumberFromString(String(body?.phone || ''));
    const type = parsed?.getType();
    if (!parsed || !parsed.isValid() || (type !== 'MOBILE' && type !== 'FIXED_LINE_OR_MOBILE')) {
      return res.status(400).json({ error: 'Please enter a valid phone number.' });
    }
    const phone = parsed.number;

    const rawCode = String(body?.code || '').trim().toLowerCase().slice(0, 40);
    const sourceUrl = typeof body?.sourceUrl === 'string' ? body.sourceUrl : null;

    let agent: { first_name?: string; agency?: string | null } | null = null;
    if (CODE_RE.test(rawCode)) {
      const rows = await sbSelect(
        `partner_agents?code=eq.${encodeURIComponent(rawCode)}&active=eq.true&select=first_name,agency&limit=1`
      );
      agent = rows[0] || null;
    }

    const agentCode = agent ? rawCode : null;
    await sbInsert('partner_leads', {
      agent_code: agentCode,
      raw_code: rawCode || null,
      phone,
      consent_agent: !!body?.consent && !!agentCode,
      source_url: sourceUrl,
    });

    const agentLine = agent
      ? [agent.first_name, agent.agency].filter(Boolean).join(', ')
      : 'unknown code';

    try {
      await resend.emails.send({
        from: 'Snagify Partners <contact@snagify.net>',
        to: ['hello@snagify.net'],
        subject: `[Partner lead] ${phone} via ${rawCode ? rawCode.toUpperCase() : 'no code'}`,
        text:
          `Phone: ${phone}\n` +
          `Country: ${parsed.country}\n` +
          `Agent: ${agentLine}\n` +
          `Consent: ${!!body?.consent && !!agentCode ? 'yes' : 'no'}\n` +
          `Source: ${sourceUrl || ''}\n\n` +
          `If no WhatsApp message arrives, contact this number yourself.\n`,
      });
    } catch (err: any) {
      console.error('partner lead email:', err?.message || err);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('partner lead:', err?.message || err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
