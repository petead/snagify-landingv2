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
    locales: ['en', 'ar'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      ar: 'en',
    },
  },
  vite: {
    build: {
      cssCodeSplit: false,
      minify: false,
    },
  },
});
