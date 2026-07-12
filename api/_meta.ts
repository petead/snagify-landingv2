import crypto from 'node:crypto';

const PIXEL_ID = process.env.META_PIXEL_ID;
const TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_TEST_EVENT_CODE;
const API_VERSION = 'v21.0';

function hash(value?: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function normalizePhone(value?: string | null): string | undefined {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits || undefined;
}

export type MetaEventInput = {
  eventName: 'Lead' | 'Contact' | 'Purchase' | 'CompleteRegistration';
  eventId: string;
  eventSourceUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  clientIp?: string | null;
  clientUserAgent?: string | null;
  customData?: Record<string, unknown>;
};

export function readMetaCookies(cookieHeader?: string | null): {
  fbp?: string;
  fbc?: string;
} {
  if (!cookieHeader) return {};
  const get = (name: string) => {
    const m = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : undefined;
  };
  return { fbp: get('_fbp'), fbc: get('_fbc') };
}

export async function sendMetaEvent(input: MetaEventInput): Promise<void> {
  if (!PIXEL_ID || !TOKEN) {
    console.warn('[meta-capi] missing env vars, event skipped');
    return;
  }

  const userData: Record<string, unknown> = {};
  const em = hash(input.email);
  if (em) userData.em = [em];
  const ph = hash(normalizePhone(input.phone));
  if (ph) userData.ph = [ph];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        event_source_url: input.eventSourceUrl || undefined,
        action_source: 'website',
        user_data: userData,
        custom_data: input.customData ?? {},
      },
    ],
  };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      console.error('[meta-capi]', res.status, await res.text());
    }
  } catch (err) {
    console.error('[meta-capi] fetch failed', err);
  }
}
