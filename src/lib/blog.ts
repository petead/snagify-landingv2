/**
 * Blog helpers, thin re-exports from the unified resources module.
 * Blog posts remain at /blog/{slug}; collection is now `resources`.
 */
export {
  formatBlogDate,
  getPublishedBlogPosts,
  getRoutableBlogPosts,
  readingTimeMinutes,
  type ResourceEntry as BlogPost,
} from './resources';
