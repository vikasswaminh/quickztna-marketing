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

// \b matters: an unanchored "we"/"us" matches inside "However", "answer",
// "because" and fires on unrelated prose.
const OURS = String.raw`\b(quickztna|our|we)\b`;
// Negated framing is allowed everywhere — "QuickZTNA does not offer X" must be
// publishable, since saying so is the whole point of the correction.
const NEGATED = String.raw`(?!.*\b(no|not|never|without|removed|withdrawn|doesn't|deliberately)\b)`;
// Requires QuickZTNA/our/we near the term, so vendor-neutral discussion of the
// category (a DLP listicle, a CASB explainer) stays publishable.
// On product surfaces "we/our" reliably means QuickZTNA. In BLOG posts it does
// not — explainers say "we" about the industry constantly ("we recommend FIDO2
// at the IdP layer", "most teams we talk to"), so blog rules demand the literal
// product name. Without this split the guard cries wolf on vendor-neutral
// education, and a guard people learn to ignore is worse than no guard.
const SUBJ = String.raw`\b(quickztna)\b`;
const near = (term, strict = false) =>
  new RegExp(
    // (?:...) around `term` is load-bearing: several terms contain a top-level
    // `|`, and splicing them in bare created alternatives with no subject
    // requirement at all — the rule then matched every line mentioning the
    // word, which is how "Cloud-native SSE/CASB with inline DLP" (a sentence
    // about Netskope) got flagged as our product claim.
    String.raw`^${NEGATED}.*(?:${strict ? SUBJ : OURS}[^.\n]{0,90}(?:${term})|(?:${term})[^.\n]{0,60}${strict ? SUBJ : OURS})`,
    "i",
  );

// Applied to EVERY file, blog included. Target shipped-product claims only.
// Negative guard: lines that frame PQC/self-host honestly (roadmap / not
// shipped / not offered) are allowed even if they mention ML-KEM or self-host.
const PRODUCT_RULES = [
  // PQC is WITHDRAWN — never wired into the data plane. Any claim that a
  // QuickZTNA tunnel ships/uses/has ML-KEM or post-quantum is false.
  //
  // Two evasions this rule used to have, both found live on 2026-08-30:
  //   1. `every (quickztna )?tunnel` missed "every CURRENT QuickZTNA tunnel" —
  //      filler words are now allowed between "every" and "tunnel".
  //   2. The honest-framing exemption was LINE-WIDE, so a sentence opening
  //      "If PQ migration is on your 2026 roadmap" could then claim "every
  //      tunnel ships with hybrid X25519 + ML-KEM-768" freely. The exemption is
  //      gone: there is no honest way to say our tunnels ship PQC.
  {
    re: new RegExp(
      String.raw`^${NEGATED}.*(` +
        String.raw`every[^.\n]{0,40}\b(quickztna|tunnel)\b[^.\n]{0,70}(ml-?kem|post-quantum)[^.\n]{0,40}\b(ship|ships|uses|runs|by default|included)\b` +
        String.raw`|(ml-?kem|post-quantum)[^.\n]{0,40}(on |for )?every[^.\n]{0,20}(tunnel|tier|plan|quickztna)` +
        String.raw`|${OURS}[^.\n]{0,60}\b(ships?|uses?|runs?|provides?|implements?|includes?)\b[^.\n]{0,40}(ml-?kem|hybrid post-quantum|post-quantum (key|kex|encryption))` +
        String.raw`|post-quantum[- ](default|by default|on every))`,
      "i",
    ),
    msg: "PQC-as-shipped claim — PQC was WITHDRAWN; tunnels are classical WireGuard",
  },
  {
    re: new RegExp(String.raw`^${NEGATED}.*${OURS}[^.\n]{0,50}(ml-?kem|post-quantum)[^.\n]{0,30}(roadmap|planned|coming|targeting|will ship)`, "i"),
    msg: "PQC-roadmap claim — PQC was withdrawn, not deferred; do not promise it",
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
    re: new RegExp(String.raw`^${NEGATED}.*(App Store|Play Store|iOS app|Android app)`, "i"),
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

// Capabilities removed in the 2026 lean pivot. Checked EVERYWHERE.
const removedRules = (strict) => [
  { re: near(String.raw`ai[- ]operator`, strict), msg: "AI Operator was removed in the 2026 lean pivot" },
  { re: near(String.raw`\bcasb\b`, strict), msg: "CASB was removed in the 2026 lean pivot" },
  { re: near(String.raw`workforce analytics`, strict), msg: "workforce analytics was removed in the 2026 lean pivot" },
  { re: near(String.raw`session record(ing|er)`, strict), msg: "session recording was removed in the 2026 lean pivot" },
  { re: near(String.raw`remote desktop`, strict), msg: "remote desktop was removed — QuickZTNA has remote SHELL only" },
  { re: near(String.raw`software inventory`, strict), msg: "software inventory was removed in the 2026 lean pivot" },
  { re: near(String.raw`user[- ]risk scor`, strict), msg: "user-risk scoring was removed in the 2026 lean pivot" },
  { re: near(String.raw`secrets vault`, strict), msg: "there is no secrets vault — no handler exists" },
  { re: near(String.raw`(fido2|webauthn)`, strict), msg: "no FIDO2/WebAuthn in the product — MFA is TOTP only" },
  {
    re: near(String.raw`(file[- ]scan|content[- ]scan|inline)[^.\n]{0,20}dlp|dlp[^.\n]{0,40}(pii|credit card|ssn|secrets)`, strict),
    msg: "DLP content scanning was removed — only file-hash malware detection remains",
  },
  { re: new RegExp(String.raw`^${NEGATED}.*(\bquickztna workforce\b|workforce (plan|tier)\b)`, "i"), msg: "there is no Workforce plan — exactly two plans, Free and Business" },
  { re: new RegExp(String.raw`^${NEGATED}.*\b(100|10,?000) devices\b(?!\s*online)`, "i"), msg: "wrong device cap — Free is 5 per user (25), Business 10 per user" },
  { re: new RegExp(String.raw`^${NEGATED}.*(soc ?2[^.\n]{0,25}(certified|compliant\b)|iso ?27001[^.\n]{0,20}certified)`, "i"), msg: "not certified — SOC 2 / ISO 27001 are IN PROGRESS" },
];


// Explicit, auditable exceptions. Each entry is a snippet of the ALLOWED line
// plus the reason it is not a product claim. Keyed on text, not line numbers,
// so edits above don't silently re-suppress something else. Keep this list
// short — if it grows, the rule is wrong, not the content.
const ALLOW = [
  ["Harvest now, decrypt later\" is a real threat model", "defines the industry threat model; makes no QuickZTNA claim"],
  ["ML-KEM-768 is the NIST-standardised post-quantum key encapsulation", "defines the NIST algorithm; no product claim"],
  ["pre-standard Kyber library from 2022", "interop advice about Kyber vs ML-KEM; no product claim"],
  ["Log the key exchange mode in your session table", "generic implementation advice to the reader"],
  ["WebRTC (Web Real-Time Communication) is a browser standard", "defines WebRTC; no product claim"],
  ["Adding up your tool bill?", "shared cost-consolidation callout; names categories, not our features"],
  ["Strong MFA at the IdP layer is the standard defence", "advice about the reader's IdP, not our MFA support"],
  ["For 100 devices via Ansible", "fleet-rollout example, not a plan cap"],
  ["Threat model, cryptographic primitives in detail", "link description for the security-model page"],
];
const allowed = (line) => ALLOW.some(([snippet]) => line.includes(snippet));

const SKIP_DIRS = new Set(["node_modules", "dist", ".astro"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(p, out);
    } else if (/\.(md|mdx|astro|txt)$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

// public/ and content/ were NOT walked before. That gap let public/llms.txt —
// the fact sheet AI crawlers read — tell the world every tunnel ships ML-KEM,
// and let content/WRITING-GUIDELINES.md teach that claim to every future post.
const ROOTS = [SRC, join(process.cwd(), "public"), join(process.cwd(), "content")];

let problems = 0;
for (const file of ROOTS.flatMap((r) => walk(r))) {
  const isBlog = /[\\/]blog[\\/]/.test(file);
  const rules = isBlog
    ? [...PRODUCT_RULES, ...removedRules(true)]
    : [...PRODUCT_RULES, ...removedRules(false), ...SURFACE_RULES];
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (allowed(line)) return;
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
