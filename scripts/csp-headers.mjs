#!/usr/bin/env node
// Postbuild (QZ-002): add a Content-Security-Policy to dist/_headers.
//
// The site has no forms, no third-party scripts and no external fonts; Astro inlines a
// few small module scripts (e.g. the mobile-nav toggle). Each inline script is allowed
// by its SHA-256 hash, computed here from the built pages, so the policy can never
// drift from the code: change a script and the next build carries its new hash.
// JSON-LD blocks (type="application/ld+json") are data, not script, and need no hash.
//
// The build FAILS if a page loads a script from another origin or the policy grows
// past what Cloudflare Pages accepts — add the origin to SCRIPT_ORIGINS deliberately.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const SCRIPT_ORIGINS = []; // e.g. 'https://analytics.example.com' when analytics returns
const NON_SCRIPT_TYPES = /^(application\/(ld\+)?json|text\/template)$/i;

function htmlFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

const hashes = new Set();
const problems = [];
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs)?.[1] ?? '';
    if (NON_SCRIPT_TYPES.test(type)) continue;
    const src = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1];
    if (src) {
      if (/^(https?:)?\/\//i.test(src) && !SCRIPT_ORIGINS.some((o) => src.startsWith(o))) {
        problems.push(`${file}: script from another origin: ${src}`);
      }
      continue;
    }
    hashes.add(`'sha256-${createHash('sha256').update(m[2], 'utf8').digest('base64')}'`);
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...SCRIPT_ORIGINS, ...[...hashes].sort()].join(' ')}`.trim(),
  "style-src 'self' 'unsafe-inline'", // inline style attributes in the built pages
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

if (csp.length > 1900) problems.push(`CSP is ${csp.length} characters — too long for a _headers value`);
if (problems.length) {
  console.error('csp-headers: refusing to publish without a correct CSP:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const headersPath = join(DIST, '_headers');
const current = readFileSync(headersPath, 'utf8');
if (!/^\/\*\s*$/m.test(current)) {
  console.error('csp-headers: dist/_headers has no "/*" block to extend');
  process.exit(1);
}
const updated = current.replace(/^\/\*\s*$/m, `/*\n  Content-Security-Policy: ${csp}`);
writeFileSync(headersPath, updated);
console.log(`csp-headers: ${hashes.size} inline script hash(es); CSP ${csp.length} chars written to ${headersPath}`);
