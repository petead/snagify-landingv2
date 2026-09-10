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

/** Routable entries, drafts only outside production builds. */
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
  tags: string[];
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
    tags: entry.data.tags ?? [],
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
    tags: [],
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

function sharedTagCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const set = new Set(a.map((t) => t.toLowerCase()));
  return b.reduce((n, t) => n + (set.has(t.toLowerCase()) ? 1 : 0), 0);
}

/**
 * Related hub cards: score other published posts by shared tags, then
 * fill remaining slots with most recent. Excludes the current page by href.
 */
export async function getRelatedResourceCards(opts: {
  category: ResourceCategory;
  excludeHref: string;
  limit?: number;
}): Promise<HubCard[]> {
  const limit = opts.limit ?? 3;
  const exclude = opts.excludeHref;

  const [blogs, tutorials, guides] = await Promise.all([
    getPublishedResources('blog'),
    getPublishedResources('tutorial'),
    getAllGuideCards(),
  ]);

  const seen = new Set<string>();
  const pool: HubCard[] = [];
  for (const card of [...blogs.map(toHubCard), ...tutorials.map(toHubCard), ...guides]) {
    if (seen.has(card.href)) continue;
    seen.add(card.href);
    pool.push(card);
  }

  const current = pool.find((c) => c.href === exclude);
  const currentTags = current?.tags ?? [];
  const others = pool.filter((c) => c.href !== exclude);

  others.sort((a, b) => {
    const scoreA = sharedTagCount(currentTags, a.tags);
    const scoreB = sharedTagCount(currentTags, b.tags);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.pubDate.valueOf() - a.pubDate.valueOf();
  });

  const picked: HubCard[] = [];
  const pickedHrefs = new Set<string>();
  for (const card of others) {
    if (picked.length >= limit) break;
    if (sharedTagCount(currentTags, card.tags) > 0) {
      picked.push(card);
      pickedHrefs.add(card.href);
    }
  }

  if (picked.length < limit) {
    const byDate = [...others].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
    for (const card of byDate) {
      if (picked.length >= limit) break;
      if (pickedHrefs.has(card.href)) continue;
      picked.push(card);
      pickedHrefs.add(card.href);
    }
  }

  return picked;
}

/** Truncate breadcrumb title for UI (JSON-LD keeps full title). */
export function truncateCrumbTitle(title: string, max = 48): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1).trimEnd()}…`;
}
