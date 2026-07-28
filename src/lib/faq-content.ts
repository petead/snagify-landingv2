/** Single source of truth for homepage FAQ (UI + FAQPage JSON-LD). */

export type FaqItem = {
  q: string;
  /** Plain-text answer for UI <p> and JSON-LD (no markup). */
  a: string;
  /** Optional anchor id on the faq-item */
  id?: string;
  /** When set, UI also renders FaqCreditAnswer after the <p> */
  creditTable?: 'pro' | 'individual';
};

/** Shared Legal & RDC, rendered in BOTH persona tabs (never duplicated in data). */
export const sharedLegalCore: FaqItem[] = [
  {
    q: 'Is a Snagify report actually accepted by the Dubai Rental Dispute Center (RDC)?',
    a: 'No format is pre-approved by the RDC. No software can truthfully claim an official stamp. What the RDC weighs is the quality of the evidence: identification, dates, signatures from both parties, photographic backing, and integrity. Snagify reports are engineered on exactly those criteria: timestamped photos, dual signatures, a SHA-256 hash proving the file was not altered, and a verification page anyone can check. You submit the PDF as-is: no notarisation, no reformatting.',
  },
  {
    q: 'Is an electronic signature legally valid in the UAE?',
    a: 'Yes. UAE Federal Decree-Law No. 46 of 2021 on Electronic Transactions gives electronic signatures the same effect as handwritten ones. Every Snagify signature is timestamped, identity-verified, and bound to the document\'s hash, which is more than most paper signatures can say for themselves.',
  },
  {
    q: 'What if the other party refuses to sign?',
    a: 'The refusal becomes part of the report. It is recorded with its timestamp and the reason given, and the report remains filed with the signatures it has. A documented refusal shows you followed due process. In practice, most people sign once they see the report is balanced and photo-backed, because it protects them too.',
  },
  {
    q: 'What if they simply never respond?',
    a: 'Silence is documented too. This is where Snagify goes further than any paper process. The report prints when their signature was requested, whether they viewed it, when reminders were sent, and that the signing period lapsed without a response. The signing window is 7 days with automatic reminders on day 1 and day 3. Silence becomes part of the record instead of a hole in it.',
  },
  {
    q: "Can a report be modified after it's signed?",
    a: 'No, and that\'s the point. Every report is locked with a SHA-256 content hash and a scan-to-verify QR code. Change a single pixel and the file no longer matches the record: verification fails. That is what makes an editable Word file easy to challenge, and a Snagify report hard to.',
  },
  {
    q: 'Can I use a Snagify report as evidence in court?',
    a: 'Electronic documents and signatures are recognised under UAE law, and the weight given to any evidence is always for the tribunal to decide. What Snagify guarantees is that your report arrives with everything that makes evidence strong: both parties\' verified signatures (or their documented response), timestamps, photos, and cryptographic proof it was never altered. A lawyer can verify the hash in under a minute.',
  },
];

export const proGettingStarted: FaqItem[] = [
  {
    q: 'Do I need to train my inspectors?',
    a: 'No. Most inspectors are productive on their first real inspection. The flow is guided step by step: add property, walk room by room, photograph, tag, sign. Every inspector follows the same process, so reports stay consistent across your whole agency.',
  },
  {
    q: 'How long does an inspection actually take?',
    a: 'Around 20 minutes for a 1-bedroom apartment, 30 to 40 minutes for a villa with 4+ rooms. First-time setup adds 2 to 3 minutes for the address and rooms. At check-out, the check-in template is reused, which makes it faster.',
  },
  {
    q: 'Does the landlord or tenant need the app to sign?',
    a: 'No. They sign on your phone during the inspection, or receive an email link and sign from their own device: no account, no download. Remote links stay valid for 7 days with automatic reminders.',
  },
  {
    q: 'Does it work offline on-site?',
    a: 'Snagify installs on your phone like an app and is built for patchy connectivity. If an upload or AI analysis fails mid-inspection (a basement, a tower core), a one-tap retry recovers it as soon as you\'re back in signal. Nothing forces you to restart. A full offline mode is on our roadmap.',
  },
  {
    q: 'We already have our own template. Is switching mid-portfolio a problem?',
    a: 'No migration needed: start using Snagify on your next inspection. Older paper or Word check-ins remain what they are; from your first Snagify check-in onward, every check-out compares automatically against a signed digital baseline. Most agencies switch one property at a time as tenancies renew.',
  },
];

export const proPricingData: FaqItem[] = [
  {
    q: 'Can I bill my client for inspections?',
    a: 'Yes, and most agencies already do. Move-in and move-out fees are standard practice in Dubai property management. Snagify gives you a branded report that justifies the fee and positions inspection as a premium service. Typical rates range from 150 to 300 AED per inspection. The ROI calculator above shows what this looks like at your volume.',
  },
  {
    q: 'How do credits work on Pro plans? Can my team share them?',
    a: 'One shared wallet for the whole team. The property sets the price, not the report type: an apartment (up to 2 bedrooms) is 1 credit per inspection, a villa/3BR+ and furnished-with-inventory properties cost more, as shown in the app. Credits refresh monthly and roll over up to your plan\'s cap while you\'re subscribed.',
    id: 'faq-credits-pro',
    creditTable: 'pro',
  },
  {
    q: 'Who owns the reports if an agent leaves the team?',
    a: 'The agency does. Reports belong to your company account, not to individual inspectors. When an agent leaves, their inspections, properties and tenancies stay with the agency. Nothing walks out the door.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. Monthly plans cancel in one click: no fees, no questions. You keep access until the end of your billing period, and your data remains safely stored: every report stays in your account, and you can reactivate anytime.',
  },
  {
    q: 'Where is my data stored? Is it secure?',
    a: 'Reports, photos and signatures are stored encrypted on our infrastructure, with access controls and TLS in transit. Photos sent for AI analysis are processed under our AI provider\'s commercial terms and are never used to train AI models. Your data is never sold, and it is only shared with the service providers needed to run Snagify, all listed transparently in our Privacy Policy.',
  },
  {
    q: 'Do I keep my reports if I stop my subscription?',
    a: 'Yes. Every report you\'ve generated stays in your account for as long as it exists, downloadable anytime. Cancelling only pauses new inspections. And signed reports go further: their verification stays live for at least five years even if the account is closed, so every party can always verify their document.',
  },
];

export const individualGettingStarted: FaqItem[] = [
  {
    q: 'Why are check-ins free?',
    a: 'An undocumented move-in is the single biggest cause of lost deposits in Dubai. We want every landlord and tenant to have that baseline protection, whether you ever pay us or not. You only spend credits at check-out: the report that settles the deposit.',
  },
  {
    q: 'How long does an inspection take?',
    a: 'Around 20 minutes for a 1-bedroom apartment, 30 to 40 for a villa. First time, add the address and rooms in 2 to 3 minutes. At check-out, everything is pre-filled from your check-in. You just compare room by room.',
  },
  {
    q: 'Does my landlord (or tenant) need the app to sign?',
    a: 'No. They sign on your phone on the spot, or receive an email link and sign from their own device: no account, no download needed. The link stays valid for 7 days with automatic reminders, and if they never respond, that is documented too.',
  },
  {
    q: 'My check-in was done on paper. Can I still use Snagify for the check-out?',
    a: 'Yes. A Snagify check-out alongside an older paper check-in still adds significant weight: dated photos, signatures, and a tamper-proof record of the property\'s final condition. The comparison against your paper baseline is just manual. And your next tenancy can start with a free digital check-in, so the full chain is automatic from then on.',
  },
  {
    q: 'Does Snagify work offline on-site?',
    a: 'It installs on your phone like an app and is built for patchy connectivity. If a photo upload or AI analysis fails in a low-signal spot, a one-tap retry recovers it once you\'re connected. A full offline mode is on our roadmap.',
  },
  {
    q: 'What languages does Snagify support?',
    a: 'The app and reports are in English, the working language of Dubai\'s rental market and the RDC. More languages are on our roadmap.',
  },
];

export const individualPricingData: FaqItem[] = [
  {
    q: 'How much does a check-out cost?',
    a: 'Check-in is always free. You only pay to lock the check-out report: the one that protects your deposit. An apartment (up to 2 bedrooms) is 2 credits; villas/3BR+ and furnished properties with inventory cost more, as shown in the app. That\'s roughly 10× cheaper than a traditional inspection company (AED 1,200+), and credits never expire.',
    id: 'faq-checkout-cost',
    creditTable: 'individual',
  },
  {
    q: 'Do my credit packs expire?',
    a: 'No, never. Buy credits today, use them in three years if you want. They stay in your account until you use them. Check-ins are always free, so credits only ever go toward check-outs.',
  },
  {
    q: 'Is my data safe?',
    a: 'Reports, photos and signatures are stored encrypted, with access controls. Photos sent for AI analysis are never used to train AI models. Your data is never sold, and it is only shared with the service providers needed to run Snagify, all listed in our Privacy Policy.',
  },
  {
    q: 'Do I keep my PDFs?',
    a: 'Yes, every report stays in your account for as long as it exists, downloadable anytime, no subscription required. And signed reports remain verifiable for at least five years even after an account closes, so both parties can always prove their document is authentic.',
  },
];

/** All FAQ entries for JSON-LD: shared core once, then per-tab arrays (no duplicates of shared). */
export function allFaqForLd(): FaqItem[] {
  return [
    ...sharedLegalCore,
    ...proGettingStarted,
    ...proPricingData,
    ...individualGettingStarted,
    ...individualPricingData,
  ];
}
