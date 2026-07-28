import { defineCollection, z } from 'astro:content';

const resourceSchema = z.object({
  title: z.string(),
  description: z.string().max(160),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  author: z.string().default('Pierre Adam'),
  heroAlt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.enum(['guide', 'blog', 'tutorial']),
  featured: z.boolean().default(false),
  readingMinutes: z.number().int().positive().optional(),
  faq: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .optional(),
  /** HowTo steps for tutorials (JSON-LD). */
  howToSteps: z
    .array(
      z.object({
        name: z.string(),
        text: z.string(),
      })
    )
    .optional(),
  draft: z.boolean().default(false),
});

/** Unified resources collection: blog posts + tutorials (+ future guides). */
const resources = defineCollection({
  type: 'content',
  schema: resourceSchema,
});

export const collections = { resources };
