import { sbUpdate } from './_supabase';

export const config = { runtime: 'nodejs' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const id = String(body?.id || '');
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    try {
      await sbUpdate(`partner_leads?id=eq.${id}`, { whatsapp_opened: true });
    } catch (err: any) {
      console.error('partner lead opened:', err?.message || err);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('partner lead opened:', err?.message || err);
    return res.status(400).json({ error: 'Missing or invalid fields' });
  }
}
