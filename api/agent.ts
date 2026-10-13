import { sbSelect } from './_supabase';

export const config = { runtime: 'nodejs' };

const CODE_RE = /^[a-z0-9-]{3,40}$/;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'public, s-maxage=300');

  try {
    const code = String(req.query.code || '').trim().toLowerCase();
    if (!CODE_RE.test(code)) {
      return res.status(200).json({ found: false });
    }

    const rows = await sbSelect(
      `partner_agents?code=eq.${encodeURIComponent(code)}&active=eq.true&select=first_name,agency,photo_url&limit=1`
    );
    const agent = rows[0];
    if (!agent) {
      return res.status(200).json({ found: false });
    }

    const origin = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
    const base = origin ? `${origin}/storage/v1/object/public/partner-agents/` : '';
    const photo = typeof agent.photo_url === 'string' ? agent.photo_url : '';
    const photoUrl = base && photo.startsWith(base) ? photo : null;

    return res.status(200).json({
      found: true,
      firstName: agent.first_name,
      agency: agent.agency ?? null,
      photoUrl,
    });
  } catch (err: any) {
    console.error('agent lookup:', err?.message || err);
    return res.status(200).json({ found: false });
  }
}
