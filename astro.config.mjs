import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.snagify.net',
  output: 'static',

  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },

  trailingSlash: 'never',
  compressHTML: false,

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar', 'ru', 'hi'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  vite: {
    build: {
      cssCodeSplit: true,
      cssMinify: true,
    },
  },

  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          ar: 'ar',
          ru: 'ru',
          hi: 'hi',
        },
      },
    }),
  ],
});