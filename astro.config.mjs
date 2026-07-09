import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://snagify.net',
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
});
