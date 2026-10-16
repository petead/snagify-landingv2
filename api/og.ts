import { ImageResponse } from '@vercel/og';
import { sbSelect } from './_supabase';

export const config = { runtime: 'edge' };

const CODE_RE = /^[a-z0-9-]{3,40}$/;

const DARK = '#0A0810';
const LIME = '#CAFE87';
const PURPLE = '#9A88FD';
const WHITE = '#FCFCFC';
const MUTED = '#2B2735';

type Node = { type: string; props: Record<string, unknown> };
type Child = Node | string | false | null | undefined;

function el(type: string, props: Record<string, unknown> | null, ...children: Child[]): Node {
  const kids = children.filter((child) => child !== false && child !== null && child !== undefined);
  return { type, props: { ...(props || {}), children: kids } };
}

function text(content: string, style: Record<string, unknown>): Node {
  return el('div', { style: { display: 'flex', ...style } }, content);
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

type FontWeight = 500 | 600 | 700 | 800;

const FONT_ORIGINS = ['https://snagify.net'];

async function loadFont(origin: string, weight: FontWeight): Promise<ArrayBuffer | null> {
  const origins = origin.startsWith('http') && !FONT_ORIGINS.includes(origin) ? [origin, ...FONT_ORIGINS] : FONT_ORIGINS;
  for (const base of origins) {
    try {
      const res = await fetch(`${base}/fonts/poppins-latin-${weight}-normal.woff`);
      if (res.ok) {
        const data = await res.arrayBuffer();
        if (data.byteLength > 1000) return data;
      }
    } catch {
      /* try the next origin */
    }
  }
  return null;
}

function logo(): Node {
  return el(
    'div',
    { style: { position: 'absolute', left: '64px', top: '48px', display: 'flex', alignItems: 'center', gap: '14px' } },
    el(
      'svg',
      { width: 40, height: 40, viewBox: '100 100 500 500', fill: DARK },
      el('path', {
        d: 'M485.977 349.973v118.175L357.375 596.746H232.219L106.332 470.863l-2.813-2.715V349.973h110.457v72.472l80.774 80.672 80.722-80.672V349.973z',
      }),
      el('path', {
        d: 'M596.48 231.852v118.125H485.973v-72.473l-21.191-21.156v-44.047h-31.098v12.957l-28.426-28.383-80.773 80.629v72.473H213.984V231.852l128.641-128.598h125.113l125.879 125.883z',
      })
    ),
    text('Snagify', { fontSize: '34px', fontWeight: 700, letterSpacing: '-0.8px' })
  );
}

function giftIcon(): Node {
  return el(
    'svg',
    {
      width: 34,
      height: 34,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: DARK,
      strokeWidth: 2.2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    el('path', {
      d: 'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    })
  );
}

function pill(agent: AgentCard | null): Node {
  const label = agent ? `Sent by ${agent.firstName}` : 'Snagify';
  const avatar = agent?.photoUrl
    ? el('img', {
        src: agent.photoUrl,
        width: 42,
        height: 42,
        style: { borderRadius: '999px', objectFit: 'cover' },
      })
    : el(
        'div',
        {
          style: {
            width: '42px',
            height: '42px',
            borderRadius: '999px',
            background: PURPLE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 800,
            color: WHITE,
          },
        },
        (agent ? agent.firstName : 'S').charAt(0).toUpperCase()
      );
  return el(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: WHITE,
        borderRadius: '999px',
        padding: '10px 20px 10px 10px',
        fontSize: '24px',
        fontWeight: 700,
        boxShadow: '0 6px 16px rgba(10,8,16,0.12)',
        whiteSpace: 'nowrap',
      },
    },
    avatar,
    text(label, {})
  );
}

function giftTag(firstName: string): Node {
  return el(
    'div',
    {
      style: {
        position: 'absolute',
        left: '230px',
        top: '54px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transform: 'rotate(-9deg)',
        transformOrigin: '50% -10px',
      },
    },
    el('div', { style: { display: 'flex', width: '3px', height: '20px', background: DARK } }),
    el(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: LIME,
          border: `3px solid ${DARK}`,
          borderRadius: '18px',
          padding: '12px 20px',
          boxShadow: `0 7px 0 ${DARK}`,
        },
      },
      giftIcon(),
      el(
        'div',
        { style: { display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' } },
        text('10% off', { fontSize: '32px', fontWeight: 800, lineHeight: 1.02 }),
        text(`${firstName}'s gift to you`, { fontSize: '16px', fontWeight: 600, lineHeight: 1.02, color: '#3D3850' })
      )
    )
  );
}

function card(agent: AgentCard | null, inspector: string, fontFamily: string): Node {
  return el(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        position: 'relative',
        background: PURPLE,
        color: DARK,
        fontFamily,
      },
    },
    logo(),
    el(
      'div',
      { style: { position: 'absolute', left: '64px', top: '136px', width: '680px', display: 'flex', flexDirection: 'column' } },
      el(
        'div',
        { style: { position: 'relative', display: 'flex', alignSelf: 'flex-start' } },
        pill(agent),
        agent ? giftTag(agent.firstName) : false
      ),
      el(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            marginTop: agent ? '106px' : '40px',
            fontSize: '62px',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-2.4px',
          },
        },
        text('Protect your deposit.', {}),
        text('Protect your unit.', {})
      ),
      text('One independent move-in report, signed by both sides.', {
        marginTop: '16px',
        fontSize: '25px',
        fontWeight: 500,
        color: MUTED,
        maxWidth: '540px',
      })
    ),
    el(
      'div',
      {
        style: {
          position: 'absolute',
          right: '64px',
          top: '100px',
          width: '380px',
          height: '430px',
          display: 'flex',
          border: `12px solid ${WHITE}`,
          borderRadius: '40px',
          overflow: 'hidden',
          transform: 'rotate(3deg)',
          boxShadow: '0 30px 60px rgba(10,8,16,0.3)',
          background: '#EFEBFF',
        },
      },
      el('img', {
        src: inspector,
        width: 356,
        height: 406,
        style: { objectFit: 'cover', borderRadius: '28px' },
      })
    ),
    text('snagify.net', { position: 'absolute', left: '64px', bottom: '44px', fontSize: '24px', fontWeight: 600 })
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

  const weights: FontWeight[] = [500, 600, 700, 800];
  const loaded = await Promise.all(weights.map((weight) => loadFont(origin, weight)));
  const fonts = weights
    .map((weight, i) => ({ name: 'Poppins', data: loaded[i], weight, style: 'normal' as const }))
    .filter((font): font is { name: string; data: ArrayBuffer; weight: FontWeight; style: 'normal' } => font.data !== null);
  const fontFamily = fonts.length ? 'Poppins' : 'sans serif';

  return new ImageResponse(card(agent, `${origin}/images/og-inspector.jpg`, fontFamily) as never, {
    width: 1200,
    height: 630,
    fonts: fonts.length ? fonts : undefined,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
