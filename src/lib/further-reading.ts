/**
 * Curated blog deep-links for guide / SEO pages.
 * Only slugs that exist under src/content/resources/ (routed as /blog/{slug}).
 * checklist-before-renting-dubai is intentionally absent (not published yet).
 */

export type FurtherReadingItem = {
  href: string;
  title: string;
  description: string;
};

/** Verified blog posts only. */
export const BLOG_READING: Record<string, FurtherReadingItem> = {
  'security-deposit-refund-dubai': {
    href: '/blog/security-deposit-refund-dubai',
    title: 'How to Get Your Security Deposit Back in Dubai (2026 Guide)',
    description:
      'What Dubai law says about deposit refunds, lawful deductions, and the steps to recover your money at the RDC.',
  },
  'rdc-deposit-dispute-no-checkin-report': {
    href: '/blog/rdc-deposit-dispute-no-checkin-report',
    title: "What Happens at the RDC When There's No Check-in Report",
    description:
      'A first-person deposit hearing: AED 4,000 claimed for repainting, no check-in report, and how the RDC ruled.',
  },
  'can-landlord-keep-full-deposit-dubai': {
    href: '/blog/can-landlord-keep-full-deposit-dubai',
    title: 'Can Your Dubai Landlord Legally Keep Your Full Deposit?',
    description:
      'What landlords may deduct, when full withholding is illegal, and a demand-letter template.',
  },
  'rdc-evidence-photos-vs-signed-reports': {
    href: '/blog/rdc-evidence-photos-vs-signed-reports',
    title: 'Photos vs Signed Reports: What Counts as Evidence at the Dubai RDC',
    description:
      'Why WhatsApp photos fail and how signed, timestamped reports weigh at the RDC.',
  },
  'property-inspection-cost-dubai': {
    href: '/blog/property-inspection-cost-dubai',
    title: 'How Much Does a Property Inspection Cost in Dubai? (2026 Prices)',
    description:
      '2026 price ranges by property type, what you get for the fee, and cheaper alternatives.',
  },
  'best-property-inspection-apps-dubai': {
    href: '/blog/best-property-inspection-apps-dubai',
    title: 'Best Property Inspection Apps in Dubai (2026 Comparison)',
    description:
      'SnapInspect, HappyCo, Property Inspect and Snagify compared for Dubai agencies and landlords.',
  },
  'is-check-in-report-mandatory-dubai': {
    href: '/blog/is-check-in-report-mandatory-dubai',
    title: 'Is a Check-in Report Mandatory in Dubai?',
    description:
      'No, Dubai law does not require one, and that is exactly why you need one before you move in.',
  },
  'first-48-hours-dubai-rental': {
    href: '/blog/first-48-hours-dubai-rental',
    title: 'Just Got Your Keys? Your First 48 Hours in a Dubai Rental',
    description:
      'DEWA, Ejari, move-in permits, and the 20-minute task that protects your deposit for the whole tenancy.',
  },
};

function pick(...slugs: string[]): FurtherReadingItem[] {
  return slugs
    .map((s) => BLOG_READING[s])
    .filter((item): item is FurtherReadingItem => Boolean(item))
    .slice(0, 3);
}

/** Further reading by page key (use-case slug, persona slug, or special keys). */
const PAGE_MAP: Record<string, string[]> = {
  'dubai-rental-dispute-center-guide': [
    'rdc-evidence-photos-vs-signed-reports',
    'security-deposit-refund-dubai',
    'rdc-deposit-dispute-no-checkin-report',
  ],
  tenants: ['security-deposit-refund-dubai', 'first-48-hours-dubai-rental', 'is-check-in-report-mandatory-dubai'],
  landlords: [
    'can-landlord-keep-full-deposit-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'security-deposit-refund-dubai',
  ],
  'real-estate-agencies': [
    'property-inspection-cost-dubai',
    'best-property-inspection-apps-dubai',
    'rdc-evidence-photos-vs-signed-reports',
  ],
  'property-managers': [
    'property-inspection-cost-dubai',
    'best-property-inspection-apps-dubai',
    'security-deposit-refund-dubai',
  ],
  'holiday-homes': [
    'first-48-hours-dubai-rental',
    'property-inspection-cost-dubai',
    'rdc-evidence-photos-vs-signed-reports',
  ],
  'property-investors': [
    'security-deposit-refund-dubai',
    'property-inspection-cost-dubai',
    'can-landlord-keep-full-deposit-dubai',
  ],
  expats: [
    'first-48-hours-dubai-rental',
    'is-check-in-report-mandatory-dubai',
    'security-deposit-refund-dubai',
  ],
  'check-in-inspection-dubai': [
    'is-check-in-report-mandatory-dubai',
    'first-48-hours-dubai-rental',
    'rdc-evidence-photos-vs-signed-reports',
  ],
  'check-out-inspection-dubai': [
    'security-deposit-refund-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'can-landlord-keep-full-deposit-dubai',
  ],
  'deposit-protection-dubai': [
    'security-deposit-refund-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'can-landlord-keep-full-deposit-dubai',
  ],
  'move-in-checklist-dubai': [
    'first-48-hours-dubai-rental',
    'is-check-in-report-mandatory-dubai',
    'security-deposit-refund-dubai',
  ],
  'move-out-checklist-dubai': [
    'security-deposit-refund-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'can-landlord-keep-full-deposit-dubai',
  ],
  'handover-inspection-dubai': [
    'property-inspection-cost-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'best-property-inspection-apps-dubai',
  ],
  'snagging-inspection-dubai': [
    'property-inspection-cost-dubai',
    'best-property-inspection-apps-dubai',
    'rdc-evidence-photos-vs-signed-reports',
  ],
  'dilapidations-dubai': [
    'can-landlord-keep-full-deposit-dubai',
    'rdc-evidence-photos-vs-signed-reports',
    'security-deposit-refund-dubai',
  ],
  /** Shared set for neighborhood /inspections/* pages */
  neighborhood: [
    'first-48-hours-dubai-rental',
    'security-deposit-refund-dubai',
    'rdc-evidence-photos-vs-signed-reports',
  ],
  inspections: [
    'property-inspection-cost-dubai',
    'best-property-inspection-apps-dubai',
    'is-check-in-report-mandatory-dubai',
  ],
};

export function getFurtherReading(pageKey: string): FurtherReadingItem[] {
  const slugs = PAGE_MAP[pageKey] ?? PAGE_MAP.neighborhood;
  return pick(...slugs);
}
