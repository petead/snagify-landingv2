#!/usr/bin/env node
/**
 * IndexNow ping for snagify.net
 *
 * Usage:
 *   node scripts/indexnow-ping.mjs            # POST urls from dist sitemap
 *   node scripts/indexnow-ping.mjs --dry-run  # log payload, skip POST
 *   npm run indexnow
 *   npm run build  → also runs via postbuild (Vercel/npm lifecycle)
 *
 * Never exits non-zero, safe for CI / postbuild.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const HOST = 'snagify.net';
const KEY = 'fe2618fe3cd7fe8759e456b49f192475';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const CHUNK = 10000; // IndexNow max urlList size

const dryRun = process.argv.includes('--dry-run') || process.env.INDEXNOW_DRY_RUN === '1';
const force = process.argv.includes('--force');
const onVercel = Boolean(process.env.VERCEL);
const lifecycle = process.env.npm_lifecycle_event || '';

function extractLocs(xml) {
  const locs = [];
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) locs.push(m[1].trim());
  return locs;
}

function loadSitemapUrls() {
  const candidates = [
    resolve(ROOT, 'dist/sitemap-0.xml'),
    resolve(ROOT, 'dist/sitemap-index.xml'),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const xml = readFileSync(file, 'utf8');
    const locs = extractLocs(xml);

    // sitemap-index → fetch child sitemaps from disk when local
    if (file.endsWith('sitemap-index.xml')) {
      const urls = [];
      for (const loc of locs) {
        const name = loc.split('/').pop();
        const local = resolve(ROOT, 'dist', name);
        if (existsSync(local)) {
          urls.push(...extractLocs(readFileSync(local, 'utf8')));
        } else {
          urls.push(loc);
        }
      }
      return { source: file, urls: [...new Set(urls.filter((u) => u.startsWith('https://')))] };
    }

    return { source: file, urls: [...new Set(locs.filter((u) => u.startsWith('https://')))] };
  }

  return { source: null, urls: [] };
}

async function postChunk(urlList) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  };

  if (dryRun) {
    console.log('[indexnow] DRY-RUN payload:');
    console.log(JSON.stringify({ ...body, urlList: `[${urlList.length} urls]` }, null, 2));
    console.log('[indexnow] First 5 urls:', urlList.slice(0, 5));
    console.log('[indexnow] Last 5 urls:', urlList.slice(-5));
    return { ok: true, status: 0, dryRun: true };
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => '');
  console.log(`[indexnow] POST ${ENDPOINT} → ${res.status} ${res.statusText}`);
  if (text) console.log(`[indexnow] body: ${text.slice(0, 500)}`);
  return { ok: res.ok, status: res.status };
}

async function main() {
  try {
    // postbuild on local machines: skip real ping (Vercel sets VERCEL=1).
    // Explicit: npm run indexnow | --force | --dry-run always run.
    if (!dryRun && !force && lifecycle === 'postbuild' && !onVercel) {
      console.log('[indexnow] postbuild skipped locally (runs on Vercel; use npm run indexnow)');
      return;
    }

    const { source, urls } = loadSitemapUrls();
    if (!source || urls.length === 0) {
      console.warn('[indexnow] No sitemap URLs found in dist/. Skipping.');
      return;
    }

    console.log(`[indexnow] source=${source}`);
    console.log(`[indexnow] urls=${urls.length} keyLocation=${KEY_LOCATION}`);
    if (dryRun) console.log('[indexnow] mode=dry-run (no POST)');

    for (let i = 0; i < urls.length; i += CHUNK) {
      const chunk = urls.slice(i, i + CHUNK);
      console.log(`[indexnow] chunk ${i / CHUNK + 1}: ${chunk.length} urls`);
      await postChunk(chunk);
    }

    console.log('[indexnow] done');
  } catch (err) {
    console.error('[indexnow] error (non-fatal):', err?.message || err);
  }
}

main();
