async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const EVENT_TYPES: Record<string, "contents" | "customer_action" | "plan_enrollment" | "custom"> = {
  page_viewed: "contents",
  contents_viewed: "contents",
  items_added: "contents",
  checkout_started: "contents",
  order_created: "contents",
  lead_created: "customer_action",
  registration_completed: "customer_action",
  appointment_scheduled: "customer_action",
  subscription_created: "plan_enrollment",
  trial_started: "plan_enrollment",
  custom: "custom",
};

const DATA_FIELDS: Record<string, string[]> = {
  contents: ["type", "amount", "currency", "contents"],
  customer_action: ["type", "amount", "currency"],
  plan_enrollment: ["type", "plan_id", "amount", "currency", "contents"],
  custom: ["type", "plan_id", "amount", "currency", "contents"],
};

const CONTENT_FIELDS = ["id", "name", "content_type", "quantity", "amount", "currency"];

export function measureOpenAI(
  event: string,
  data: Record<string, unknown> = {},
  options?: { event_id?: string; custom_event_name?: string; opt_out?: boolean }
): void {
  try {
    const w = window as unknown as { oaiq?: (...args: unknown[]) => void };
    if (typeof w.oaiq !== "function") return;
    const type = EVENT_TYPES[event];
    if (!type) return warn(`unsupported event "${event}"`);
    const payload: Record<string, unknown> = { type };
    for (const key of DATA_FIELDS[type]) {
      if (key !== "type" && data[key] !== undefined && data[key] !== null) payload[key] = data[key];
    }
    if (payload.amount !== undefined) {
      if (!Number.isInteger(payload.amount)) return warn(`${event}: amount must be an integer in minor units`);
      if (typeof payload.currency !== "string" || !payload.currency) return warn(`${event}: currency required with amount`);
      payload.currency = (payload.currency as string).toUpperCase();
    }
    if (Array.isArray(payload.contents)) {
      payload.contents = (payload.contents as Record<string, unknown>[]).map((item) => {
        const clean: Record<string, unknown> = {};
        for (const k of CONTENT_FIELDS) if (item[k] !== undefined && item[k] !== null && item[k] !== "") clean[k] = item[k];
        return clean;
      });
    }
    const opts: Record<string, unknown> = {};
    if (options?.event_id) opts.event_id = options.event_id;
    if (options?.opt_out !== undefined) opts.opt_out = options.opt_out;
    if (event === "custom") {
      const name = options?.custom_event_name ?? "";
      if (!/^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/.test(name) || EVENT_TYPES[name]) {
        return warn(`invalid custom_event_name "${name}"`);
      }
      opts.custom_event_name = name;
    }
    Object.keys(opts).length ? w.oaiq("measure", event, payload, opts) : w.oaiq("measure", event, payload);
  } catch {
    // tracking must never break the page
  }
}

function warn(msg: string): void {
  if (import.meta.env.DEV) console.warn(`[openai-pixel] ${msg}`);
}

export async function identifyOpenAIEmail(rawEmail: string | null | undefined): Promise<void> {
  try {
    const w = window as unknown as { oaiq?: (...args: unknown[]) => void };
    if (typeof w.oaiq !== "function" || !window.crypto?.subtle) return;
    const email = rawEmail?.trim().toLowerCase();
    if (!email) return;
    w.oaiq("init", { pixelId: "KySmbjq1qgZELV2tK7Smu8", user: { email_sha256: await sha256Hex(email) } });
  } catch {
    // tracking must never break the page
  }
}
