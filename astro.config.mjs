import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import { isIndexableNeighborhood } from './src/data/neighborhood-indexable.ts';

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src/content/resources');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[kv[1]] = v;
  }
  return out;
}

function isoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const lastmodByUrl = new Map();
for (const name of fs.readdirSync(contentDir)) {
  if (!name.endsWith('.md')) continue;
  const fm = parseFrontmatter(fs.readFileSync(path.join(contentDir, name), 'utf8'));
  const slug = name.replace(/\.md$/, '');
  const lastmod = isoDate(fm.updatedDate) || isoDate(fm.pubDate);
  if (!lastmod) continue;
  if (fm.category === 'tutorial') {
    lastmodByUrl.set(`https://snagify.net/resources/tutorials/${slug}`, lastmod);
  } else if (fm.category === 'blog' || fm.category === 'guide') {
    lastmodByUrl.set(`https://snagify.net/blog/${slug}`, lastmod);
  }
}

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
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url);
        if (lastmod) {
          return { ...item, lastmod };
        }
        const next = { ...item };
        delete next.lastmod;
        return next;
      },
    }),
  ],
});
