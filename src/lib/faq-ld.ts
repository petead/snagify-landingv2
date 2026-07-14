import type { PricingCatalog } from './pricing';

type FaqQ = {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
};

/** Static FAQPage entities + live credit answers from PricingCatalog.faq */
export function buildFaqPageLd(pricingFaq: PricingCatalog['faq']) {
  const mainEntity: FaqQ[] = [
    {
      '@type': 'Question',
      name: 'Is a Snagify report actually accepted by the Dubai Rental Dispute Center (RDC)? (for professionals)',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Every Snagify report includes the evidence the RDC looks for: timestamped entries, dual signatures, photos with metadata, and a SHA-256 hash proving the file hasn't been altered after signature. You submit the PDF as-is. No notarisation, no reformatting. Your agency name, logo, and RERA number appear on every page.",
      },
    },
    {
      '@type': 'Question',
      name: 'What happens if the tenant refuses to sign? (for professionals)',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You document the refusal inside the report. A dedicated field logs the refusal with timestamp and optional reason. The report stays legally valid. A documented refusal is strong evidence. In practice, most people sign once they see the report is balanced and photo-backed.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does an inspection actually take?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Around 20 minutes for a 1 bedroom apartment. 30 to 40 minutes for a villa with 4 or more rooms. First time setup adds 2 to 3 minutes for the address and rooms. Once a property is in the system, every check-out reuses the check-in template.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does it work offline on-site?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Snagify is a PWA, so it installs on your phone and runs offline once loaded. Photos and AI tagging queue locally and sync when you're back online.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I bill my client for inspections?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, and most agencies already do. Move-in and move-out fees are standard practice in Dubai property management. Typical rates range from 150 to 300 AED per inspection.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do credits work on Pro plans? Can my team share them?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: pricingFaq.pro?.summary ?? pricingFaq.proCredits,
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel my subscription anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Monthly plans cancel in one click. No fees, no questions. You keep access until the end of your billing period, and every report you\'ve ever generated stays accessible forever.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is my data stored? Is it secure?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Reports, photos, and signatures are stored on encrypted servers. Photos are analysed by AI and then discarded. Only the final report is retained. SHA-256 hashes detect any tampering. Your data is never sold, shared, or used for AI training.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is a Snagify report actually accepted by the Dubai Rental Dispute Center (RDC)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes. Every Snagify report includes the evidence the RDC looks for: timestamped entries, dual signatures, photos with metadata, and a SHA-256 hash proving the file hasn't been altered after signature. If a dispute reaches the RDC, you submit the PDF as-is.",
      },
    },
    {
      '@type': 'Question',
      name: 'Why are check-ins free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An undocumented move-in is the single biggest cause of lost deposits in Dubai. We want every landlord and tenant to have that baseline protection. You only spend credits when you do a check-out.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does a check-out cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: pricingFaq.individual?.summary ?? pricingFaq.individualCheckout,
      },
    },
    {
      '@type': 'Question',
      name: 'Do my credit packs expire?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Credit packs for landlords and tenants never expire. Buy credits today, use them years later. Check-ins are always free, so you only spend credits on check-out.',
      },
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
