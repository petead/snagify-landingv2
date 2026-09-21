import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import { isIndexableNeighborhood } from './src/data/neighborhood-indexable.ts';

export default defineConfig({
  site: 'https://snagify.net',
  output: 'static',

  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },

  trailingSlash: 'never',
  compressHTML: false,

  vite: {
    build: {
      cssCodeSplit: true,
      cssMinify: true,
    },
  },

  integrations: [
    sitemap({
      filter: (page) => {
        if (page === 'https://snagify.net/blog') return false;
        const match = page.match(/^https:\/\/snagify\.net\/inspections\/([^/]+?)(?:\.html)?\/?$/);
        if (match && !isIndexableNeighborhood(match[1])) return false;
        return true;
      },
    }),
  ],
});
