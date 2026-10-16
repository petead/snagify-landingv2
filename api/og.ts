import { ImageResponse } from '@vercel/og';
import { sbSelect } from './_supabase';

export const config = { runtime: 'edge' };

const CODE_RE = /^[a-z0-9-]{3,40}$/;

type Node = { type: string; props: Record<string, unknown> };
type Child = Node | string | false | null | undefined;

function el(type: string, props: Record<string, unknown> | null, ...children: Child[]): Node {
  const kids = children.filter((child) => child !== false && child !== null && child !== undefined);
  return { type, props: { ...(props || {}), children: kids } };
}

type AgentCard = {
  firstName: string;
  agency: string | null;
  photoUrl: string | null;
};

async function lookupAgent(code: string): Promise<AgentCard | null> {
  if (!CODE_RE.test(code)) return null;
  const rows = await sbSelect(
    `partner_agents?code=eq.${encodeURIComponent(code)}&active=eq.true&select=first_name,agency,photo_url&limit=1`
  );
  const agent = rows[0];
  if (!agent || typeof agent.first_name !== 'string' || !agent.first_name.trim()) return null;

  const origin = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const base = origin ? `${origin}/storage/v1/object/public/partner-agents/` : '';
  const photo = typeof agent.photo_url === 'string' ? agent.photo_url : '';
  const photoUrl = base && photo.startsWith(base) ? photo : null;

  return {
    firstName: agent.first_name.trim(),
    agency: typeof agent.agency === 'string' && agent.agency.trim() ? agent.agency.trim() : null,
    photoUrl,
  };
}

async function loadFont(origin: string): Promise<ArrayBuffer | null> {
  try {
    const remote = await fetch(`${origin}/fonts/poppins-latin-700-normal.woff`);
    if (remote.ok) {
      const data = await remote.arrayBuffer();
      if (data.byteLength > 1000) return data;
    }
  } catch {
    /* public woff is optional */
  }
  try {
    const bundled = await fetch(
      new URL('../node_modules/@fontsource/poppins/files/poppins-latin-700-normal.woff', import.meta.url)
    );
    if (bundled.ok) {
      const data = await bundled.arrayBuffer();
      if (data.byteLength > 1000) return data;
    }
  } catch {
    /* system sans */
  }
  return null;
}

function card(agent: AgentCard | null, inspector: string, fontFamily: string): Node {
  const pill = agent ? 'SENT BY' : 'SNAGIFY';
  return el(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#9A88FD',
        color: '#0A0810',
        fontFamily,
        padding: '56px 64px',
        position: 'relative',
      },
    },
    el(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '640px',
          gap: '10px',
        },
      },
      el(
        'div',
        {
          style: {
            display: 'flex',
            alignSelf: 'flex-start',
            background: '#FCFCFC',
            color: '#0A0810',
            fontSize: '22px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            padding: '8px 16px',
            borderRadius: '999px',
          },
        },
        pill
      ),
      agent
        ? el(
            'div',
            {
              style: {
                display: 'flex',
                fontSize: '110px',
                fontWeight: 700,
                lineHeight: 0.95,
                letterSpacing: '-0.04em',
              },
            },
            agent.firstName
          )
        : false,
      agent && agent.agency
        ? el(
            'div',
            {
              style: {
                display: 'flex',
                fontSize: '36px',
                fontWeight: 700,
                lineHeight: 1.15,
                color: '#3D3850',
              },
            },
            agent.agency
          )
        : false,
      el(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: agent ? '56px' : '72px',
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginTop: '8px',
          },
        },
        'Move in protected.'
      )
    ),
    el(
      'div',
      {
        style: {
          display: 'flex',
          background: '#FCFCFC',
          padding: '12px',
          borderRadius: '32px',
          border: '8px solid #FCFCFC',
          transform: 'rotate(3deg)',
        },
      },
      el('img', {
        src: agent?.photoUrl || inspector,
        width: 360,
        height: 440,
        style: {
          objectFit: 'cover',
          borderRadius: '22px',
        },
      })
    ),
    el(
      'div',
      {
        style: {
          position: 'absolute',
          left: '64px',
          bottom: '36px',
          display: 'flex',
          fontSize: '28px',
          fontWeight: 700,
        },
      },
      'snagify.net'
    )
  );
}

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const code = (url.searchParams.get('code') || '').trim().toLowerCase();
  const origin = `${url.protocol}//${url.host}`;

  let agent: AgentCard | null = null;
  if (code) {
    try {
      agent = await lookupAgent(code);
    } catch (err) {
      console.error('og agent lookup:', err instanceof Error ? err.message : err);
    }
  }

  const font = await loadFont(origin);
  const fontFamily = font ? 'Poppins' : 'sans serif';

  return new ImageResponse(card(agent, `${origin}/images/by-snagify.jpg`, fontFamily) as never, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: 'Poppins', data: font, weight: 700, style: 'normal' }] : undefined,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
