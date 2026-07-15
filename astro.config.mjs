import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

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

  integrations: [sitemap()],
});
