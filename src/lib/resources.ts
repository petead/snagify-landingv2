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

/** @deprecated Prefer getPublishedResources('blog') — kept for call-site clarity. */
export async function getPublishedBlogPosts(): Promise<ResourceEntry[]> {
  return getPublishedResources('blog');
}

export async function getRoutableBlogPosts(): Promise<ResourceEntry[]> {
  return getRoutableResources('blog');
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
  if (entry.data.category === 'blog') {
    return `/blog/${entry.slug}`;
  }
  // Future in-collection guides would need an explicit path map.
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
