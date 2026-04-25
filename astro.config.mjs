import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://snagify.net',
  output: 'static',
  build: {
    format: 'file',
  },
  trailingSlash: 'never',
  compressHTML: false,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar', 'ru'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  vite: {
    build: {
      cssCodeSplit: false,
      minify: false,
    },
  },
});
