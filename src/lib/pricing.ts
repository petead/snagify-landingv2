export type CreditPack = {
  id: string;
  name: string;
  credits: number;
  priceAed: number;
  pricePerCreditAed: number | null;
  sortOrder: number;
  savePct: number | null;
  popular: boolean;
};

export type SubscriptionPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceMonthlyBilling: number;
  priceMonthlyAnnual: number;
  priceAnnualTotal: number;
  annualSaveAed: number;
  creditsPerMonth: number;
  maxUsers: number | null;
  extraCreditAed: number | null;
  rollMaxMultiplier: number;
  whiteLabel: boolean;
  popular: boolean;
  sortOrder: number;
};

export type PricingCatalog = {
  packs: CreditPack[];
  plans: SubscriptionPlan[];
  priceRangeLabel: string;
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
}

function boolish(v: unknown): boolean {
  return v === true || v === 'true' || v === 1 || v === '1';
}

export function formatAed(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

async function supabaseGet<T>(path: string): Promise<T> {
  const url = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL / SUPABASE_ANON_KEY (or PUBLIC_*). Set them in .env for pricing.',
    );
  }

  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${path}: ${res.status} ${body}`);
  }

  return res.json() as Promise<T>;
}

/** Fetch active credit packs + subscription plans from Supabase (build-time REST). */
export async function fetchPricingCatalog(): Promise<PricingCatalog> {
  type PackRow = Record<string, unknown>;
  type PlanRow = Record<string, unknown>;

  const [packRows, planRows] = await Promise.all([
    supabaseGet<PackRow[]>(
      'credit_packs?is_active=eq.true&order=sort_order.asc&select=id,name,credits,price_aed,price_per_credit_aed,sort_order',
    ),
    supabaseGet<PlanRow[]>(
      'subscription_plans?is_active=eq.true&order=sort_order.asc&select=id,slug,name,description,price_aed_monthly,price_aed_annual,price_aed_monthly_billing,credits_per_month,max_users,extra_credit_price_aed,roll_max_multiplier,white_label,highlight,sort_order',
    ),
  ]);

  const basePerCredit =
    packRows.length > 0
      ? num(
          packRows[0].price_per_credit_aed,
          num(packRows[0].price_aed) / Math.max(1, num(packRows[0].credits, 1)),
        )
      : 0;

  const packs: CreditPack[] = packRows.map((row, i) => {
    const priceAed = num(row.price_aed);
    const credits = Math.round(num(row.credits));
    const ppc =
      row.price_per_credit_aed != null
        ? num(row.price_per_credit_aed)
        : priceAed / Math.max(1, credits);
    let savePct: number | null = null;
    if (i > 0 && basePerCredit > 0 && ppc < basePerCredit) {
      savePct = Math.round(((basePerCredit - ppc) / basePerCredit) * 100);
    }
    return {
      id: String(row.id),
      name: String(row.name),
      credits,
      priceAed,
      pricePerCreditAed: ppc,
      sortOrder: Math.round(num(row.sort_order, i + 1)),
      savePct,
      popular: i === 1 || packRows.length === 1,
    };
  });

  const plans: SubscriptionPlan[] = planRows.map((row, i) => {
    const monthlyBilling = num(row.price_aed_monthly_billing, num(row.price_aed_monthly));
    const monthlyAnnual = num(row.price_aed_monthly);
    const annualTotal =
      row.price_aed_annual != null ? num(row.price_aed_annual) : monthlyAnnual * 12;
    const annualSave = Math.max(0, Math.round(monthlyBilling * 12 - annualTotal));
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: row.description != null ? String(row.description) : null,
      priceMonthlyBilling: monthlyBilling,
      priceMonthlyAnnual: monthlyAnnual,
      priceAnnualTotal: annualTotal,
      annualSaveAed: annualSave,
      creditsPerMonth: Math.round(num(row.credits_per_month)),
      maxUsers: row.max_users != null ? Math.round(num(row.max_users)) : null,
      extraCreditAed: row.extra_credit_price_aed != null ? num(row.extra_credit_price_aed) : null,
      rollMaxMultiplier: num(row.roll_max_multiplier, 1),
      whiteLabel: boolish(row.white_label),
      popular: boolish(row.highlight) || i === 1,
      sortOrder: Math.round(num(row.sort_order, i + 1)),
    };
  });

  const packMin = packs.length ? Math.min(...packs.map((p) => p.priceAed)) : 0;
  const planMaxAnnual = plans.length
    ? Math.max(...plans.map((p) => p.priceMonthlyAnnual))
    : 0;
  const priceRangeLabel =
    packMin && planMaxAnnual
      ? `AED ${formatAed(packMin)} - AED ${formatAed(planMaxAnnual)}`
      : 'AED';

  return { packs, plans, priceRangeLabel };
}

/** ROI calculator annual plans derived from subscription_plans. */
export function toRoiPlans(plans: SubscriptionPlan[]) {
  const out: Record<string, { name: string; credits: number; cost: number; extra: number }> = {};
  for (const p of plans) {
    out[p.slug] = {
      name: p.name,
      credits: p.creditsPerMonth,
      cost: Math.round(p.priceAnnualTotal),
      extra: Math.round(p.extraCreditAed ?? 0),
    };
  }
  return out;
}
