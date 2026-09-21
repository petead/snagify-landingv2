/** KEEP list: the only neighborhood slugs that stay indexable. */

export const INDEXABLE_NEIGHBORHOOD_SLUGS = [
  'dubai-marina',
  'jvc',
  'business-bay',
  'downtown-dubai',
  'jlt',
  'palm-jumeirah',
  'dubai-hills-estate',
  'dubai-creek-harbour',
  'dubai-silicon-oasis',
  'international-city',
] as const;

export type IndexableNeighborhoodSlug = (typeof INDEXABLE_NEIGHBORHOOD_SLUGS)[number];

const INDEXABLE = new Set<string>(INDEXABLE_NEIGHBORHOOD_SLUGS);

export function isIndexableNeighborhood(slug: string): boolean {
  return INDEXABLE.has(slug);
}
