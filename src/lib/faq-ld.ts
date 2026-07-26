import { allFaqForLd } from './faq-content';

type FaqQ = {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
};

/** FAQPage JSON-LD for the homepage — single shared legal core, no duplicate Qs. */
export function buildFaqPageLd() {
  const mainEntity: FaqQ[] = allFaqForLd().map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity,
  };
}
