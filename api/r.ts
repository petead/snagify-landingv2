import { sbSelect } from './_supabase';

export const config = { runtime: 'nodejs' };

const CODE_RE = /^[a-z0-9-]{3,40}$/;
const FALLBACK_PAGE = 'https://snagify.net/r';

let cachedHtml: string | null = null;

type AgentName = { firstName: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function upsertMeta(html: string, attr: 'property' | 'name', key: string, content: string): string {
  const value = escapeHtml(content);
  const tag = `<meta ${attr}="${key}" content="${value}">`;
  const pattern = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+content="[^"]*"\\s*/?>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `${tag}\n</head>`);
}

export function personalize(html: string, host: string, code: string, firstName: string): string {
  const title = `Sent by ${firstName} | Move in protected`;
  const description = `Independent move-in report, signed by both sides. 10% off through ${firstName}'s link.`;
  const image = `https://${host}/api/og?code=${encodeURIComponent(code)}`;
  const pageUrl = `https://${host}/r/${code}`;

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  next = upsertMeta(next, 'property', 'og:title', title);
  next = upsertMeta(next, 'property', 'og:description', description);
  next = upsertMeta(next, 'property', 'og:image', image);
  next = upsertMeta(next, 'property', 'og:url', pageUrl);
  next = upsertMeta(next, 'property', 'og:image:width', '1200');
  next = upsertMeta(next, 'property', 'og:image:height', '630');
  next = upsertMeta(next, 'name', 'twitter:title', title);
  next = upsertMeta(next, 'name', 'twitter:description', description);
  next = upsertMeta(next, 'name', 'twitter:image', image);
  next = upsertMeta(next, 'name', 'twitter:card', 'summary_large_image');
  return next;
}

function requestHost(req: { headers: Record<string, string | string[] | undefined> }): string {
  const raw = req.headers['x-forwarded-host'] || req.headers.host || 'snagify.net';
  return String(Array.isArray(raw) ? raw[0] : raw).split(',')[0].trim() || 'snagify.net';
}

function requestOrigin(req: { headers: Record<string, string | string[] | undefined> }): string {
  const host = requestHost(req);
  if (host === 'snagify.net') return 'https://snagify.net';
  const raw = req.headers['x-forwarded-proto'] || 'https';
  const proto = String(Array.isArray(raw) ? raw[0] : raw).split(',')[0].trim() || 'https';
  return `${proto}://${host}`;
}

async function loadPage(origin: string): Promise<string> {
  if (cachedHtml) return cachedHtml;
  const primary = `${origin}/r`;
  let res = await fetch(primary);
  if (!res.ok && primary !== FALLBACK_PAGE) {
    res = await fetch(FALLBACK_PAGE);
  }
  if (!res.ok) {
    throw new Error(`referral page ${res.status}`);
  }
  const html = await res.text();
  cachedHtml = html;
  return html;
}

async function lookupName(code: string): Promise<AgentName | null> {
  if (!CODE_RE.test(code)) return null;
  const rows = await sbSelect(
    `partner_agents?code=eq.${encodeURIComponent(code)}&active=eq.true&select=first_name&limit=1`
  );
  const agent = rows[0];
  if (!agent || typeof agent.first_name !== 'string' || !agent.first_name.trim()) return null;
  return { firstName: agent.first_name.trim() };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }

  const code = String(req.query.code || '').trim().toLowerCase();
  const host = requestHost(req);

  try {
    const html = await loadPage(requestOrigin(req));
    let agent: AgentName | null = null;
    if (code) {
      try {
        agent = await lookupName(code);
      } catch (err) {
        console.error('r agent lookup:', err instanceof Error ? err.message : err);
      }
    }

    const body = agent ? personalize(html, host, code, agent.firstName) : html;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).send(body);
  } catch (err) {
    console.error('r page:', err instanceof Error ? err.message : err);
    return res.status(502).send('Something went wrong');
  }
}
