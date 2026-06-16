#!/usr/bin/env node
// Content accuracy guard for the QuickZTNA marketing site.
//
// Two rule sets:
//   PRODUCT_RULES — false QuickZTNA *product* claims. Checked EVERYWHERE,
//     including the blog, because comparison/explainer posts make product
//     claims too. Patterns are narrow so PQC *topic* discussion is fine.
//   SURFACE_RULES — wrong binary, removed commands, mobile apps, stale
//     security claims. Checked on product surfaces (pages/layouts/docs/guide),
//     NOT the blog (where, e.g., "App Store" may appear in a comparison).
//
// Run: node scripts/lint-content.mjs   (wired into `prebuild`)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

// Applied to EVERY file, blog included. Target shipped-product claims only.
// Negative guard: lines that frame PQC/self-host honestly (roadmap / not
// shipped / not offered) are allowed even if they mention ML-KEM or self-host.
const PRODUCT_RULES = [
  {
    re: /^(?!.*(roadmap|not shipped|not in the shipped|not a current|not yet|on the roadmap)).*(ml-?kem[- ]?768?[^.\n]{0,30}(on )?every (tunnel|tier)|every (quickztna )?tunnel[^.\n]{0,70}ml-?kem|\b(ships|uses|runs|provides)\b[^.\n]{0,50}ml-?kem[^.\n]{0,50}every (tunnel|tier)|post-quantum[- ](default|by default|on every))/i,
    msg: "PQC-as-shipped product claim — use 'roadmap' framing (PQC isn't in the shipped client)",
  },
  {
    re: /^(?!.*(not offered|no self-host|managed cloud only)).*(self-host(ed|ing)?[^.\n|]{0,30}workforce|workforce[^.\n|]{0,25}self-host)/i,
    msg: "self-host-on-Workforce claim — QuickZTNA is managed cloud only",
  },
];

// Applied to product surfaces only (not blog).
const SURFACE_RULES = [
  {
    re: /\bquickztna (up|down|status|peers|login|logout|set|ip|dns|cert|acl|machines|auth-keys|netcheck|posture|route|secrets|exit-node|split-tunnel|threat|audit|compliance|install|uninstall|update|version|whois|configure|debug|log|metrics|wg-config|bugreport|doctor|devices|policy|keys|ping|nc|ssh|shell|whoami|service|config|bug-report)\b/,
    msg: 'wrong CLI binary — use "ztna", not "quickztna" (case-sensitive)',
  },
  {
    re: /\bztna (ping|nc|ssh|shell|shell-token|doctor|devices|policy|keys|whoami)\b/,
    msg: "removed/nonexistent ztna subcommand (case-sensitive)",
  },
  {
    re: /App Store|Play Store|iOS app|Android app/i,
    msg: "mobile-app claim — there is no iOS/Android client",
  },
  {
    re: /post-quantum[- ]encrypted/i,
    msg: "post-quantum-as-shipped claim — PQC is roadmap, not shipped",
  },
  {
    re: /self-hosted? (is )?available on|air-?gapped[^.\n]{0,25}(are |is )?supported/i,
    msg: "self-host-offered claim — managed cloud only today",
  },
  {
    re: /reproducible builds?|transparency log|hash-?chain(ed)? (audit|log)|quarterly[^.\n]{0,30}penetration test|red team exercise|FIPS 203 conform/i,
    msg: "unverified security claim removed per the 2026-06 audit",
  },
];

const SKIP_DIRS = new Set(["node_modules", "dist", ".astro"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(p, out);
    } else if (/\.(md|mdx|astro)$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

let problems = 0;
for (const file of walk(SRC)) {
  const isBlog = /[\\/]blog[\\/]/.test(file);
  const rules = isBlog ? PRODUCT_RULES : [...PRODUCT_RULES, ...SURFACE_RULES];
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const { re, msg } of rules) {
      if (re.test(line)) {
        console.error(`  ${file}:${i + 1}  ${msg}`);
        console.error(`    > ${line.trim().slice(0, 130)}`);
        problems++;
      }
    }
  });
}

if (problems > 0) {
  console.error(`\n✗ content lint FAILED: ${problems} forbidden claim(s).`);
  process.exit(1);
}
console.log("✓ content lint passed: no forbidden claims.");
