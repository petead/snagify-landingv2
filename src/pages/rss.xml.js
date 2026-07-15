import rss from '@astrojs/rss';
import { getPublishedBlogPosts } from '../lib/blog';

export async function GET(context) {
  const posts = await getPublishedBlogPosts();
  return rss({
    title: 'Snagify Blog',
    description:
      'Deposits, inspections and RDC disputes, explained by people who build inspection software in Dubai.',
    site: context.site ?? 'https://snagify.net',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.slug}`,
    })),
  });
}
