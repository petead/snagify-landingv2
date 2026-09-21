import raw from './neighborhoods.json';
import {
  INDEXABLE_NEIGHBORHOOD_SLUGS,
  isIndexableNeighborhood,
} from './neighborhood-indexable';

export { INDEXABLE_NEIGHBORHOOD_SLUGS, isIndexableNeighborhood };

export type LocalGuideSource = {
  label: string;
  url: string;
};

export type LocalGuide = {
  intro: string;
  movingIn: string[];
  whatToDocument: string[];
  sources: LocalGuideSource[];
};

export type SnagifyInspections = {
  count: number;
  asOf: string;
};

type RawNeighborhood = (typeof raw)[keyof typeof raw];

export type Neighborhood = Omit<RawNeighborhood, 'localGuide' | 'snagifyInspections'> & {
  indexable: boolean;
  localGuide?: LocalGuide;
  snagifyInspections?: SnagifyInspections;
};

export const neighborhoods: Record<string, Neighborhood> = Object.fromEntries(
  Object.entries(raw).map(([slug, n]) => [
    slug,
    { ...n, indexable: isIndexableNeighborhood(n.slug) },
  ]),
);

/**
 * Nearby cards: indexable neighbors first (BFS on nearbyNeighborhoods),
 * then remaining KEEP slugs until `limit` (default 3).
 */
export function getIndexableNearbyNeighborhoods(
  neighborhood: Neighborhood,
  limit = 3,
): Neighborhood[] {
  const seen = new Set<string>([neighborhood.slug]);
  const result: Neighborhood[] = [];
  const queue = [...(neighborhood.nearbyNeighborhoods ?? [])];

  while (queue.length > 0 && result.length < limit) {
    const slug = queue.shift()!;
    if (seen.has(slug)) continue;
    seen.add(slug);
    const next = neighborhoods[slug];
    if (!next) continue;
    if (next.indexable) result.push(next);
    for (const hop of next.nearbyNeighborhoods ?? []) {
      if (!seen.has(hop)) queue.push(hop);
    }
  }

  if (result.length < limit) {
    for (const slug of INDEXABLE_NEIGHBORHOOD_SLUGS) {
      if (result.length >= limit) break;
      if (seen.has(slug)) continue;
      const fill = neighborhoods[slug];
      if (!fill) continue;
      result.push(fill);
      seen.add(slug);
    }
  }

  return result;
}
