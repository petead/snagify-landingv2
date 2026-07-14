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

export type CreditCost = {
  action: string;
  accountType: 'individual' | 'pro' | string;
  credits: number;
  creditsLarge: number;
  furnishedAddon: number;
  description: string | null;
};

export type FaqCostRow = {
  label: string;
  unfurnished: string;
  furnished: string;
};

export type FaqExample = {
  title: string;
  detail: string;
  total: string;
};

export type FaqCreditBlock = {
  intro: string;
  rows: FaqCostRow[];
  examples: FaqExample[];
  note: string;
  /** Plain text for JSON-LD */
  summary: string;
};

export type PricingCatalog = {
  packs: CreditPack[];
  plans: SubscriptionPlan[];
  costs: CreditCost[];
  priceRangeLabel: string;
  faq: {
    individual: FaqCreditBlock;
    pro: FaqCreditBlock;
    /** @deprecated alias for JSON-LD / old callers */
    individualCheckout: string;
    proCredits: string;
  };
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

function formatPpc(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
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

function creditLabel(n: number): string {
  if (n === 0) return 'Free';
  return n === 1 ? '1 credit' : `${n} credits`;
}

function costCells(base: number, furnishedAddon: number) {
  const furnished = base + furnishedAddon;
  return {
    unfurnished: creditLabel(base),
    furnished:
      furnishedAddon > 0
        ? `${creditLabel(furnished)} (+${furnishedAddon})`
        : creditLabel(furnished),
  };
}

function buildFaqCopy(packs: CreditPack[], plans: SubscriptionPlan[], costs: CreditCost[]) {
  const indCheckout = costs.find((c) => c.action === 'individual_checkout');
  const indCheckin = costs.find((c) => c.action === 'individual_checkin');
  const proCheckout = costs.find((c) => c.action === 'pro_checkout');
  const proCheckin = costs.find((c) => c.action === 'pro_checkin');

  const indIn = indCheckin?.credits ?? 0;
  const indOut = indCheckout?.credits ?? 2;
  const indOutLarge = indCheckout?.creditsLarge ?? indOut * 2;
  const indFurn = indCheckout?.furnishedAddon ?? 0;

  const proIn = proCheckin?.credits ?? 1;
  const proInLarge = proCheckin?.creditsLarge ?? proIn * 2;
  const proOut = proCheckout?.credits ?? 1;
  const proOutLarge = proCheckout?.creditsLarge ?? proOut * 2;
  const proFurn = proCheckout?.furnishedAddon ?? proCheckin?.furnishedAddon ?? 0;

  const examplePack =
    packs.find((p) => p.popular) || packs[Math.min(1, packs.length - 1)] || packs[0];
  const ppc = examplePack?.pricePerCreditAed ?? 0;
  const packName = examplePack?.name ?? 'Essential';

  const aedCost = (credits: number) =>
    ppc > 0 ? `≈ ${formatAed(credits * ppc)} AED on ${packName}` : `${creditLabel(credits)}`;

  const individualRows: FaqCostRow[] = [
    { label: 'Check-in (any size)', ...costCells(indIn, indCheckin?.furnishedAddon ?? 0) },
    { label: 'Check-out · standard home', ...costCells(indOut, indFurn) },
    { label: 'Check-out · larger home', ...costCells(indOutLarge, indFurn) },
  ];

  const individualExamples: FaqExample[] = [
    {
      title: 'Studio check-out, empty',
      detail: `${creditLabel(indOut)} from your pack`,
      total: aedCost(indOut),
    },
    {
      title: '1BR check-out, furnished',
      detail: `${indOut} base + ${indFurn} furnished`,
      total: aedCost(indOut + indFurn),
    },
    {
      title: 'Big villa check-out, furnished',
      detail: `${indOutLarge} base + ${indFurn} furnished`,
      total: aedCost(indOutLarge + indFurn),
    },
  ];

  const individualSummary =
    `Check-in is free. Standard check-out is ${creditLabel(indOut)}` +
    (indFurn ? ` (+${indFurn} if furnished)` : '') +
    `; larger homes use ${creditLabel(indOutLarge)}` +
    (indFurn ? ` (+${indFurn} furnished)` : '') +
    `. Credits never expire — buy packs in the app.`;

  const individual: FaqCreditBlock = {
    intro:
      'Deposit drama, meet simple math. Check-in is always free — you only spend when you lock the check-out report.',
    rows: individualRows,
    examples: individualExamples,
    note:
      (indFurn
        ? `Furnished homes add +${indFurn} on top of the base. `
        : '') +
      '“Larger home” kicks in for bigger villas / layouts detected in-app. Credits never expire.',
    summary: individualSummary,
  };

  const proRows: FaqCostRow[] = [
    { label: 'Check-in · standard', ...costCells(proIn, proFurn) },
    { label: 'Check-in · larger property', ...costCells(proInLarge, proFurn) },
    { label: 'Check-out · standard', ...costCells(proOut, proFurn) },
    { label: 'Check-out · larger property', ...costCells(proOutLarge, proFurn) },
  ];

  const growth = plans.find((p) => p.slug === 'growth') || plans[1] || plans[0];
  const growthExtra = growth?.extraCreditAed ?? 0;
  const growthName = growth?.name ?? 'Growth';

  const proExamples: FaqExample[] = [
    {
      title: 'Move-in, empty apartment',
      detail: `${creditLabel(proIn)} from the team pool`,
      total: creditLabel(proIn),
    },
    {
      title: 'Furnished 2BR check-out',
      detail: `${proOut} base + ${proFurn} furnished`,
      total: creditLabel(proOut + proFurn),
    },
    {
      title: `Pool empty? Grab one extra (${growthName})`,
      detail: 'Top-up, same shared wallet',
      total: growthExtra ? `${formatAed(growthExtra)} AED` : 'In-app price',
    },
  ];

  const extrasLine = plans
    .filter((p) => p.extraCreditAed != null)
    .map((p) => `${p.name} ${formatAed(p.extraCreditAed!)} AED`)
    .join(' · ');

  const proSummary =
    `Pros: check-in and check-out start at ${creditLabel(proIn)} each` +
    (proFurn ? ` (+${proFurn} if furnished)` : '') +
    `; larger homes use ${creditLabel(proInLarge)}` +
    (proFurn ? ` (+${proFurn} furnished)` : '') +
    `. Shared monthly pool with rollover` +
    (extrasLine ? `. Extra credits: ${extrasLine}.` : '.');

  const pro: FaqCreditBlock = {
    intro:
      'One shared wallet for the whole squad. Less math, more inspections out the door.',
    rows: proRows,
    examples: proExamples,
    note:
      (proFurn ? `Furnished always adds +${proFurn} on top. ` : '') +
      (extrasLine ? `Need more than your plan? Extras: ${extrasLine}. ` : '') +
      'Credits refresh monthly and roll over while you’re subscribed.',
    summary: proSummary,
  };

  return {
    individual,
    pro,
    individualCheckout: individual.summary,
    proCredits: pro.summary,
  };
}

/** Fetch active credit packs + subscription plans + credit costs from Supabase (build-time REST). */
export async function fetchPricingCatalog(): Promise<PricingCatalog> {
  type PackRow = Record<string, unknown>;
  type PlanRow = Record<string, unknown>;
  type CostRow = Record<string, unknown>;

  const [packRows, planRows, costRows] = await Promise.all([
    supabaseGet<PackRow[]>(
      'credit_packs?is_active=eq.true&order=sort_order.asc&select=id,name,credits,price_aed,price_per_credit_aed,sort_order',
    ),
    supabaseGet<PlanRow[]>(
      'subscription_plans?is_active=eq.true&order=sort_order.asc&select=id,slug,name,description,price_aed_monthly,price_aed_annual,price_aed_monthly_billing,credits_per_month,max_users,extra_credit_price_aed,roll_max_multiplier,white_label,highlight,sort_order',
    ),
    supabaseGet<CostRow[]>(
      'credit_costs?is_active=eq.true&order=sort_order.asc&select=action,account_type,credits,credits_large,furnished_addon,description',
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

  const costs: CreditCost[] = costRows.map((row) => ({
    action: String(row.action),
    accountType: String(row.account_type),
    credits: Math.round(num(row.credits)),
    creditsLarge: Math.round(num(row.credits_large, num(row.credits))),
    furnishedAddon: Math.round(num(row.furnished_addon)),
    description: row.description != null ? String(row.description) : null,
  }));

  const packMin = packs.length ? Math.min(...packs.map((p) => p.priceAed)) : 0;
  const planMaxAnnual = plans.length
    ? Math.max(...plans.map((p) => p.priceMonthlyAnnual))
    : 0;
  const priceRangeLabel =
    packMin && planMaxAnnual
      ? `AED ${formatAed(packMin)} - AED ${formatAed(planMaxAnnual)}`
      : 'AED';

  return {
    packs,
    plans,
    costs,
    priceRangeLabel,
    faq: buildFaqCopy(packs, plans, costs),
  };
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
