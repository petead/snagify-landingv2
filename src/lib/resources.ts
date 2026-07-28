import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

export type ResourceEntry = CollectionEntry<'resources'>;
export type ResourceCategory = 'guide' | 'blog' | 'tutorial';

/** Lightweight hub entries for standalone pages (not in the content collection). */
export type HubGuide = {
  title: string;
  description: string;
  href: string;
  category: 'guide';
  featured: boolean;
  readingMinutes: number;
  pubDate: Date;
};

/**
 * RDC guide stays at its root URL as a standalone .astro page.
 * Registered here so the hub can feature it without moving the page.
 */
export const hubGuides: HubGuide[] = [
  {
    title: 'Dubai Rental Dispute Center (RDC): The Complete 2026 Guide',
    description:
      'Filing process, fees, timelines, evidence requirements, and what actually wins deposit cases at the Dubai RDC.',
    href: '/dubai-rental-dispute-center-guide',
    category: 'guide',
    featured: true,
    readingMinutes: 18,
    pubDate: new Date('2026-04-25'),
  },
];

function isPublished(data: { draft?: boolean }) {
  return data.draft !== true;
}

function sortByDateDesc<T extends { data: { pubDate: Date } }>(items: T[]): T[] {
  return items.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Published collection entries only (drafts excluded). */
export async function getPublishedResources(
  category?: ResourceCategory
): Promise<ResourceEntry[]> {
  const posts = await getCollection('resources', ({ data }) => {
    if (!isPublished(data)) return false;
    if (category) return data.category === category;
    return true;
  });
  return sortByDateDesc(posts);
}

/** Routable entries — drafts only outside production builds. */
export async function getRoutableResources(
  category?: ResourceCategory
): Promise<ResourceEntry[]> {
  const posts = await getCollection('resources', ({ data }) => {
    if (import.meta.env.PROD && data.draft === true) return false;
    if (category) return data.category === category;
    return true;
  });
  return sortByDateDesc(posts);
}

/** Published blog-category posts only (footer / blog index). */
export async function getPublishedBlogPosts(): Promise<ResourceEntry[]> {
  return getPublishedResources('blog');
}

/**
 * Entries rendered at /blog/{slug}: blog posts + collection guides.
 * Keeps existing guide URLs stable when a post is re-categorized.
 */
export async function getRoutableBlogPosts(): Promise<ResourceEntry[]> {
  const posts = await getCollection('resources', ({ data }) => {
    if (import.meta.env.PROD && data.draft === true) return false;
    return data.category === 'blog' || data.category === 'guide';
  });
  return sortByDateDesc(posts);
}

export function readingTimeMinutes(body: string, override?: number): number {
  if (override && override > 0) return override;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatBlogDate(date: Date): string {
  return date.toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function resourceHref(entry: ResourceEntry): string {
  if (entry.data.category === 'tutorial') {
    return `/resources/tutorials/${entry.slug}`;
  }
  // Blog posts and collection guides keep stable /blog/{slug} URLs.
  if (entry.data.category === 'blog' || entry.data.category === 'guide') {
    return `/blog/${entry.slug}`;
  }
  return `/resources/${entry.slug}`;
}

export type HubCard = {
  title: string;
  description: string;
  href: string;
  category: ResourceCategory;
  featured?: boolean;
  readingMinutes: number;
  pubDate: Date;
};

export function toHubCard(entry: ResourceEntry): HubCard {
  return {
    title: entry.data.title,
    description: entry.data.description,
    href: resourceHref(entry),
    category: entry.data.category,
    featured: entry.data.featured,
    readingMinutes: readingTimeMinutes(entry.body, entry.data.readingMinutes),
    pubDate: entry.data.pubDate,
  };
}

export function guideToHubCard(g: HubGuide): HubCard {
  return {
    title: g.title,
    description: g.description,
    href: g.href,
    category: 'guide',
    featured: g.featured,
    readingMinutes: g.readingMinutes,
    pubDate: g.pubDate,
  };
}

/** Hub + index guide cards: standalone registry + published collection guides. */
export async function getAllGuideCards(): Promise<HubCard[]> {
  const fromCollection = (await getPublishedResources('guide')).map(toHubCard);
  const fromHub = hubGuides.map(guideToHubCard);
  return [...fromHub, ...fromCollection].sort(
    (a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()
  );
}

/** Fixed tutorial sequence for "Next up" (wraps). */
export const TUTORIAL_ORDER = [
  'perfect-check-in-20-minutes',
  'photographing-findings',
  'when-they-wont-sign',
  'checkout-comparison',
] as const;

export async function getNextTutorialCard(currentSlug: string): Promise<HubCard | null> {
  const idx = (TUTORIAL_ORDER as readonly string[]).indexOf(currentSlug);
  if (idx < 0) return null;
  const nextSlug = TUTORIAL_ORDER[(idx + 1) % TUTORIAL_ORDER.length];
  const tutorials = await getPublishedResources('tutorial');
  const next = tutorials.find((t) => t.slug === nextSlug);
  return next ? toHubCard(next) : null;
}

/**
 * Related hub cards: same category first (by date), then recent others.
 * Excludes the current page by href.
 */
export async function getRelatedResourceCards(opts: {
  category: ResourceCategory;
  excludeHref: string;
  limit?: number;
}): Promise<HubCard[]> {
  const limit = opts.limit ?? 3;
  const exclude = opts.excludeHref;

  let same: HubCard[];
  if (opts.category === 'guide') {
    same = await getAllGuideCards();
  } else {
    same = (await getPublishedResources(opts.category)).map(toHubCard);
  }
  same = same
    .filter((c) => c.href !== exclude)
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  const sameHrefs = new Set(same.map((c) => c.href));
  const [blogs, tutorials, guides] = await Promise.all([
    getPublishedResources('blog'),
    getPublishedResources('tutorial'),
    getAllGuideCards(),
  ]);
  const others = [...blogs.map(toHubCard), ...tutorials.map(toHubCard), ...guides]
    .filter((c) => c.href !== exclude && !sameHrefs.has(c.href))
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  // Dedupe others by href (guides appear in both collection + hubGuides path)
  const seen = new Set<string>();
  const othersUnique = others.filter((c) => {
    if (seen.has(c.href)) return false;
    seen.add(c.href);
    return true;
  });

  return [...same, ...othersUnique].slice(0, limit);
}

/** Truncate breadcrumb title for UI (JSON-LD keeps full title). */
export function truncateCrumbTitle(title: string, max = 48): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1).trimEnd()}…`;
}
