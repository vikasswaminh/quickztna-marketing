#!/usr/bin/env node
// Content accuracy guard for the QuickZTNA marketing site.
//
// Rule sets:
//   PRODUCT_RULES — false QuickZTNA *product* claims (PQC, self-host). Checked
//     EVERYWHERE, including the blog, because comparison/explainer posts make
//     product claims too. Patterns stay narrow so PQC *topic* discussion is fine.
//   REMOVED — capabilities deleted in the 2026 lean pivot. Checked everywhere,
//     but attribution differs: see "Attribution" below.
//   FACT_RULES — wrong numbers/plans/certifications. Subject-independent: the
//     device cap is wrong no matter who the sentence is about.
//   SURFACE_RULES — wrong binary, removed commands, mobile apps, stale security
//     claims. Product surfaces only (pages/layouts/docs/guide), NOT the blog,
//     where e.g. "App Store" legitimately appears in a comparison.
//
// ── Clause scope (the 2026-08-30 rewrite) ───────────────────────────────────
// Every rule is evaluated against a CLAUSE, not the whole physical line. The
// previous version scanned lines, which produced two silent holes:
//
//   1. The negation exemption was line-wide, so ANY "no"/"not" anywhere on the
//      line disabled every rule for that line. The billing page's "10,000-device
//      cap" sentence passed purely because a later sentence said "No trial".
//   2. The ALLOW list returned early for the whole line, so a line opening with
//      an allowlisted WebRTC definition could then claim remote desktop freely.
//
// Splitting on sentence terminators and semicolons confines both exemptions to
// the clause that earned them.
//
// ── Attribution ─────────────────────────────────────────────────────────────
// The old rules required QuickZTNA/our/we within 60-90 characters of the term.
// That window is a bad proxy for "this sentence is about us": a feature
// enumeration ("...device posture, DNS filtering, the AI assistant, remote SSH,
// SCIM, workforce analytics, DLP, CASB, and remote desktop") outruns it, which
// is how three pages kept advertising withdrawn capabilities while lint stayed
// green. Replaced with scope-based attribution:
//
//   Product surfaces (pages/layouts/docs/guide) — NO subject required. These
//     surfaces describe our product by definition; a guide page listing a
//     "secrets vault" is claiming we have one. Genuine third-party mentions go
//     in ALLOW.
//   Blog — requires the literal product name in the clause, OR a markdown
//     heading that names QuickZTNA. Comparison posts put every claim under a
//     "## 5. QuickZTNA" heading and then write subject-less sentences
//     ("Business adds DLP, CASB, ... and workforce analytics"), which no
//     clause-local subject test can catch. Vendor-neutral education elsewhere
//     in the same post stays publishable.
//
// ── Known limits (do not mistake a green run for proof) ─────────────────────
// This is a regex backstop against regressions, not a proof of accuracy. Two
// limits are inherent and known:
//
//   1. DENIAL BINDING IS PROXIMITY, NOT PARSING. A denial is associated with an
//      assertion by a character window, so "QuickZTNA does not offer CASB today,
//      but QuickZTNA will offer CASB next quarter" is not reliably caught — the
//      second assertion sits inside the first denial's window. Splitting on ':'
//      and ';' narrows this, but a contrastive "but" clause in one sentence can
//      still hide a claim. Real coverage needs a parser, not a window.
//   2. CO-OCCURRENCE IS NOT ATTACHMENT. `re` + `also` only need to appear in the
//      same clause, so "QuickZTNA ships classical WireGuard while this article
//      discusses post-quantum cryptography" can flag even though the verb belongs
//      to WireGuard. Prefer rewording over widening the exemptions.
//
// Both were reported by review and are recorded here deliberately. When the guard
// passes, that means no KNOWN pattern matched — a human still has to read the copy.
//
// Run: node scripts/lint-content.mjs   (wired into `prebuild`)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "src");

// \b matters: an unanchored "we"/"us" matches inside "However", "answer",
// "because" and fires on unrelated prose.
const OURS = String.raw`\b(quickztna|our|we)\b`;
// On product surfaces "we/our" reliably means QuickZTNA. In BLOG posts it does
// not — explainers say "we" about the industry constantly ("we recommend FIDO2
// at the IdP layer") — so blog rules demand the literal product name.
const SUBJ = String.raw`\b(quickztna)\b`;

// Negated framing is allowed — "QuickZTNA does not offer X" must be publishable,
// since saying so is the whole point of the correction.
//
// This is a whitelist of DENIAL CONSTRUCTIONS, not a bare list of negative words.
// Matching any stray "no"/"not"/"without" was the hole: "Organisations using
// QuickZTNA Workforce who need JIT access WITHOUT a separate PAM deployment"
// exempted itself on a "without" that negates nothing, and a marketing line
// ending "No card." excused every claim before it. A denial has to actually deny.
// NOTE: markdown emphasis is stripped before these run ("does **not** ship"),
// so patterns need not tolerate * or _ themselves.
const DENIAL = [
  /\b(?:does|do|did|is|are|was|were|has|have|will|would|can|could)\s+not\b/i,
  // Active voice: "The 2026 lean pivot removed DLP content scanning, CASB, ..."
  // Only counts when a withdrawn-capability noun follows close behind, so a bare
  // "removed" in unrelated prose does not become a blanket exemption.
  /\b(?:removed|withdrew|deleted|retired|dropped)\b(?=[^.\n]{0,60}\b(?:dlp|casb|workforce|session|remote|software|inventory|scoring|analytics|vault|operator|assistant|recording|desktop|post-quantum|ml-?kem|fido2|webauthn)\b)/i,
  /\b(?:doesn't|don't|didn't|isn't|aren't|wasn't|weren't|won't|can't|cannot|hasn't|haven't)\b/i,
  /\bnever\b|\bno longer\b|\bneither\b/i,
  /\bnot\s+(?:implemented|shipped|offered|supported|planned|available|certified|on the roadmap|a\b|one of)/i,
  // Explicitly hypothetical framing — "we would document it only if it ever shipped"
  // is the opposite of a claim, but names the capability and a ship-verb.
  // Deliberately NOT a bare "would ship/add": that would exempt a positive
  // conditional promise like "QuickZTNA would add CASB for enterprise customers".
  // The FULL construction is required: "would <verb> … only if it ever ship(ped)".
  // A bare "if it ever ships" still let a positive promise through
  // ("QuickZTNA will ship ML-KEM if it ever ships version 2").
  /\bwould\s+\w+[^.\n]{0,60}\bonly\s+if\s+it\s+ever\s+(?:ships|shipped)\b/i,
  /\bthere\s+(?:is|are|'s)\s+no\b/i,
  /\b(?:was|were|has been|have been|are|is)\s+(?:removed|withdrawn|deleted|retired)\b/i,
  /\b(?:we|quickztna)\s+(?:removed|withdrew|deleted|dropped)\b/i,
  /\bremoved\s+in\s+\d{4}\b|\bremoved\s+(?:from|in)\s+the\b/i,
  /\bdeliberately\s+(?:no|not|has no)\b/i,
  // The writing guidelines' own forbidden list, and any prose that labels the
  // enumeration that follows as withdrawn.
  /\bnever\s+claim\b|\bwithdrawn capabilities\b|\bdo not claim\b/i,
  // "no session recording", "no secrets vault", "no content inspection" — a bare
  // "no" counts only when a withdrawn-capability noun follows close behind.
  /\bno\b(?=[^.\n]{0,40}\b(?:recording|vault|desktop|analytics|inspection|scanning|inventory|scoring|casb|dlp|fido2|webauthn|workforce|post-quantum|ml-?kem|assistant|operator)\b)/i,
];
// Strip markdown emphasis first: "QuickZTNA does **not** implement PQC" must read
// as a denial, and "*never* collected" likewise.
//
// `upto` scopes the denial to the text PRECEDING the assertion it supposedly
// negates, within a short window. A clause-wide boolean let a denial at the start
// excuse an unrelated positive claim later in the same clause.
const denied = (s, matchIndex = null) => {
  let text = s;
  if (matchIndex !== null) {
    // Window around the assertion. Symmetric because a removal enumeration can
    // put the denial after the list ("DLP, CASB, ... were all removed") as well as
    // before it. The window is what stops a denial at one end of a long clause
    // from excusing an unrelated claim at the other; the ':' clause split handles
    // the "What will not move: <positive promise>" shape.
    // 350 chars: long enough to span a full withdrawn-capability enumeration
    // ("… removed DLP PII-scanning, CASB, workforce analytics, … and the secrets
    // vault"), short enough that a denial cannot reach across a whole paragraph.
    text = s.slice(Math.max(0, matchIndex - 350), matchIndex + 350);
  }
  const flat = text.replace(/[*_`]/g, "");
  return DENIAL.some((re) => re.test(flat));
};

// Split text into clauses at sentence terminators and semicolons.
// Deliberately NOT split on em dashes or colons: "Every feature is included:
// mesh, ..., secrets vault" and "Free plan covers X — the mesh, ..., CASB" both
// carry the subject on the far side of that punctuation, and splitting there
// would strip the very attribution the rules depend on.
// Also split at HTML tag boundaries. In .astro files a sentence often ends
// directly against a tag ("...+ AI Operator.</p>") with no whitespace, so a
// whitespace-only sentence split left whole markup blocks coalesced into one
// giant clause — which then inherited any denial or allowlisted phrase in it.
// A colon is a clause boundary too. "What will not move: our commitment that every
// tunnel ships with hybrid PQ by default" put a denial and the claim it does NOT
// negate in one clause, and the clause-wide exemption hid the claim. Splitting on
// ':' is safe now that attribution is scope-based rather than proximity-based —
// a surface needs no subject, so "Every feature is included: mesh, ..., vault"
// is still caught after the split.
// The ':' branch deliberately excludes object-literal keys (`job: "…"`), which
// would otherwise separate a savings-page entry from the `note:` explaining it.
const CLAUSE_SPLIT =
  /(?<=[.!?])\s+|(?<=[.!?])(?=<)|\s*;\s+|(?<=[a-z)])\s*:\s+(?!["'])|(?<=>)\s*(?=<)|<br\s*\/?>/i;

const splitClauses = (text) =>
  text
    .split(CLAUSE_SPLIT)
    .filter(Boolean);

// Same split, but reports whether each clause followed a COLON. A colon keeps the
// subject in the prefix ("QuickZTNA includes: CASB, …"), so blog attribution has
// to carry across that one boundary — but NOT across sentence boundaries, which
// would attribute vendor-neutral sentences in any paragraph that names us.
const splitClausesMeta = (text) => {
  const parts = text.split(new RegExp(`(${CLAUSE_SPLIT.source})`, "i"));
  const out = [];
  let afterColon = false;
  for (let k = 0; k < parts.length; k++) {
    if (k % 2 === 0) {
      if (parts[k]) out.push({ text: parts[k], afterColon });
    } else {
      afterColon = (parts[k] || "").includes(":");
    }
  }
  return out;
};

// Group physical lines into SENTENCE units before splitting into clauses.
// Prose wraps across lines, so a sentence's own qualifier and its terms can land
// on different lines — the privacy policy's "Removed in 2026: earlier versions of
// this policy described workforce analytics, session recording, ..." disclosure
// is spread over four lines, and a line-based check sees only a bare list of
// withdrawn features. Judging wrapped prose line-by-line either flags honest
// disclosures or forces an ever-growing ALLOW list.
//
// Structural lines (headings, table rows, fenced code, list-item starts) stay
// line-scoped so unrelated table rows never merge into one unit.
function units(lines) {
  const out = [];
  let buf = "";
  let start = 0;
  let open = false;
  let inFence = false;

  const flush = () => {
    if (buf.trim()) out.push({ text: buf, line: start });
    buf = "";
    open = false;
  };

  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      inFence = !inFence;
      return;
    }
    if (inFence) {
      out.push({ text: line, line: i });
      return;
    }
    const isBlank = /^\s*$/.test(line);
    const isStructural = /^\s*#{1,6}\s/.test(line) || /^\s*\|/.test(line);
    const isListStart = /^\s*([-*+]|\d+[.)])\s/.test(line);

    if (isBlank || isStructural) {
      flush();
      if (isStructural) out.push({ text: line, line: i });
      return;
    }
    if (isListStart) flush();

    if (!open) {
      start = i;
      open = true;
      buf = line;
    } else {
      buf += " " + line;
    }
    // Flush as soon as the buffer completes a sentence, so each unit is about
    // one assertion rather than a whole paragraph.
    if (/[.!?]["'’)\]]?\s*$/.test(buf)) flush();
  });
  flush();
  return out;
}

// Applied to EVERY file, blog included. Target shipped-product claims only.
const PRODUCT_RULES = [
  // PQC is WITHDRAWN — never wired into the data plane. Any claim that a
  // QuickZTNA tunnel ships/uses/has ML-KEM or post-quantum is false.
  // "every (quickztna )?tunnel" once missed "every CURRENT QuickZTNA tunnel";
  // filler words between "every" and "tunnel" are now allowed for.
  {
    re: new RegExp(
      String.raw`(` +
        String.raw`every[^.\n]{0,40}\b(quickztna|tunnel)\b[^.\n]{0,70}(ml-?kem|post-quantum)[^.\n]{0,40}\b(ship|ships|uses|runs|by default|included)\b` +
        String.raw`|(ml-?kem|post-quantum)[^.\n]{0,40}(on |for )?every[^.\n]{0,20}(tunnel|tier|plan|quickztna)` +
        String.raw`|${OURS}[^.\n]{0,60}\b(ships?|uses?|runs?|provides?|implements?|includes?)\b[^.\n]{0,40}(ml-?kem|hybrid post-quantum|post-quantum (key|kex|encryption))` +
        String.raw`|post-quantum[- ](default|by default|on every)` +
        // "hybrid post-quantum is on by default" slipped past the forms above:
        // no verb from the list, and "by default" not adjacent to the term.
        String.raw`|(ml-?kem|post-quantum|hybrid pq)[^.\n]{0,30}\bon by default\b` +
        // Link text / headings that promise it as ours: "…Key Exchange on Our Roadmap".
        String.raw`|(ml-?kem|post-quantum|quantum-safe)[^.\n]{0,40}on (our|the quickztna) roadmap)`,
      "i",
    ),
    msg: "PQC-as-shipped claim — PQC was WITHDRAWN; tunnels are classical WireGuard",
  },
  {
    re: new RegExp(String.raw`${OURS}[^.\n]{0,50}(ml-?kem|post-quantum)[^.\n]{0,30}(roadmap|planned|coming|targeting|will ship)`, "i"),
    msg: "PQC-roadmap claim — PQC was withdrawn, not deferred; do not promise it",
  },
  {
    re: new RegExp(String.raw`(ml-?kem|post-quantum)[^.\n]{0,40}(is |are )?on[^.\n]{0,15}(the |our )?roadmap`, "i"),
    msg: "PQC-roadmap claim — PQC was withdrawn, not deferred; do not promise it",
    // Third parties legitimately have PQC roadmaps — the EU's coordinated
    // transition roadmap, NIST's, a competitor's. Only OUR roadmap is forbidden.
    // The roadmap must be POSSESSED by the third party, and the leading lookahead
    // makes sure a nearby third-party name can't launder a claim about ours:
    // "NIST's ML-KEM is on QuickZTNA's roadmap" must still fail.
    // The possessive is REQUIRED — "NIST ML-KEM is on the roadmap" must still fail,
    // because an unqualified roadmap on our own surface means ours.
    unless:
      /^(?!.*\b(?:our|quickztna['’]s|we)\s+roadmap\b)(?=.*(?:\b(?:EU|European Commission|NIST|NSA|BSI|ANSSI|NCSC|IBM|Tailscale|Cloudflare|industry|vendor|their)(?:['’]s)\s[^.\n]{0,40}roadmap\b|\bthe\s+EU['’]s\b|roadmap\]\(http))/i,
  },
  {
    re: /(self-host(ed|ing)?[^.\n|]{0,30}workforce|workforce[^.\n|]{0,25}self-host)/i,
    msg: "self-host-on-Workforce claim — QuickZTNA is managed cloud only",
  },
];

// Capabilities removed in the 2026 lean pivot. Attribution per the header:
// no subject needed on product surfaces; product name or heading on the blog.
const REMOVED = [
  { re: /\bai[- ](operator|assistant)\b/i, msg: "the AI Operator/assistant was removed in the 2026 lean pivot" },
  { re: /\bcasb\b/i, msg: "CASB was removed in the 2026 lean pivot" },
  { re: /workforce analytics/i, msg: "workforce analytics was removed in the 2026 lean pivot" },
  { re: /session record(ing|er)/i, msg: "session recording was removed in the 2026 lean pivot" },
  { re: /remote desktop/i, msg: "remote desktop was removed — QuickZTNA has remote SHELL only" },
  { re: /software inventory/i, msg: "software inventory was removed in the 2026 lean pivot" },
  { re: /user[- ]risk scor/i, msg: "user-risk scoring was removed in the 2026 lean pivot" },
  { re: /secrets vault/i, msg: "there is no secrets vault — no handler exists" },
  { re: /\b(fido2|webauthn)\b/i, msg: "no FIDO2/WebAuthn in the product — MFA is TOTP only" },
  // PQC-as-shipped, matched by CO-OCCURRENCE inside an attributed clause rather
  // than by character distance. The old rules used 40-60 char windows, so an
  // assertion separated from the product name by a feature preamble slipped
  // through ("...QuickZTNA ... implements hybrid post-quantum key exchange").
  // `also` means: both patterns must appear in the same clause, in any order.
  {
    re: /\b(ml-?kem|post-quantum|quantum-safe|hybrid pq)\b/i,
    // Assertion forms, not just shipping verbs. Declarative promises evade a
    // verb-only list: "an ML-KEM-1024 opt-in", "hybrid PQ encryption default-on",
    // "uses ML-KEM on every tier", and bare table cells reading "Yes".
    // The table-cell alternative lives OUTSIDE the \b(...)\b wrapper: "|" is not a
    // word character, so a leading \b can never match at a cell boundary. That is
    // why "| QuickZTNA | ML-KEM-768 | Yes (X25519) | Yes, all tiers |" passed.
    also: /\b(ships?|shipped|uses?|using|runs?|implements?|implemented|provides?|includes?|included|enabled|enables?|adds?|offers?|opt-in|scheduled|planned|commitment|default-on|by default|on every|in every|every tier|every plan)\b|\|\s*yes\b/i,
    msg: "PQC-as-shipped claim — PQC was WITHDRAWN; tunnels are classical WireGuard",
  },
  // "QuickZTNA ships it on every tunnel" after an allowlisted definition: the
  // definition is redacted, so no PQC term survives for the co-occurrence rule.
  // Catch the anaphor itself.
  {
    re: /\b(ships?|uses?|runs?|implements?|enables?)\s+(it|them|this|that)\b/i,
    also: /\bevery[^.\n]{0,25}(tunnel|tier|plan)\b|by default/i,
    msg: "anaphoric shipped claim — name what is shipped; PQC is not shipped",
  },
  // A third anaphor: the PQC term sits in the PREVIOUS clause and this one refers
  // back by category noun — "…the level chosen in QuickZTNA", where "the level"
  // means ML-KEM-768. Requires our name, so vendor-neutral prose is unaffected.
  {
    re: /\bthe (level|parameter set|variant|algorithm|suite)\b/i,
    also: /\b(chosen|selected|used|adopted|shipped|standard)\b[^.\n]{0,30}\bin quickztna\b|\bquickztna\b[^.\n]{0,30}\b(chose|selected|uses|adopted)\b/i,
    // Without a PQC antecedent this rejects accurate classical prose
    // ("Curve25519 is the algorithm used in QuickZTNA tunnels") — and since lint
    // runs in `prebuild`, that would block the build on correct content.
    needsPqcContext: true,
    msg: "anaphoric PQC selection claim — QuickZTNA implements no ML-KEM parameter set",
  },
  // "We use this construction in every QuickZTNA tunnel" names no PQC term at all,
  // so the co-occurrence rule above cannot see it — the referent is anaphoric.
  // Deliberately narrow to "this construction": widening it to handshake/exchange
  // rejected accurate classical prose ("This handshake runs in every QuickZTNA
  // tunnel"), and since lint runs in `prebuild` a false positive BLOCKS THE BUILD.
  // The `unless` lets a clause that names the classical primitives through.
  {
    re: /\bthis construction\b/i,
    also: /\b(in|on) every[^.\n]{0,25}tunnel\b|every quickztna tunnel/i,
    // The exception must POSITIVELY identify the construction as classical.
    // A contrastive mention ("Unlike classical WireGuard, this construction runs
    // in every QuickZTNA tunnel") names a classical primitive while asserting the
    // opposite, so contrastive connectives disqualify the exemption.
    unless:
      /^(?!.*\b(unlike|rather than|instead of|whereas|as opposed to|not just)\b).*\b(classical|x25519 \+ chacha|chacha20|curve25519|noise)\b/i,
    msg: "anaphoric PQC-as-shipped claim — name the crypto explicitly; PQC is not shipped",
  },
  {
    re: /(file[- ]scan|content[- ]scan|inline)[^.\n]{0,20}dlp|dlp[^.\n]{0,40}(pii|credit card|ssn|secrets)|(text|content|clipboard)[- ]scanning|content inspection/i,
    msg: "DLP content scanning was removed — only file-hash malware detection remains",
  },
];

// Wrong facts. Subject-independent: a bad device cap is wrong regardless of who
// the sentence is about, so these need no attribution test.
const FACT_RULES = [
  {
    // The third form catches a plan enumeration that labels a tier in bold
    // ("- **Workforce**: configurable retention...") — how a phantom third plan
    // survived in docs/security.md's retention list.
    re: /(\bquickztna workforce\b|workforce (plan|tier)\b|\*\*workforce\*\*\s*:)/i,
    msg: "there is no Workforce plan — exactly two plans, Free and Business",
    // A phantom plan name is wrong regardless of an unrelated negation elsewhere
    // in the sentence: "Organisations using QuickZTNA Workforce who need JIT
    // access WITHOUT a separate PAM deployment" was exempting itself on the
    // "without". Only an actual denial of the plan's existence is allowed.
    noExempt: true,
    unless: /\b(no|not a|never a|there is no)\s+(quickztna\s+)?workforce\b/i,
  },
  {
    // The ENFORCED ceiling is org-wide: Free 100, Business 10,000
    // (services/billing.ts FREE_LIMITS/BUSINESS_LIMITS, applied in
    // register-machine.ts as max(planCap, stored)). `machines_per_user` (5/10)
    // is explicitly "legacy/display only and no longer enforces anything", so
    // "5 devices per user" / "25 total" understates the real allowance and is
    // the claim to forbid — not the correct 100/10,000 figures.
    // "\d+ devices each" not bare "device each" — the latter matches innocent
    // prose like "re-registers as a new device each start".
    re: /\b(25|50) (total )?devices?\b|\b\d+ devices? per user\b|\b\d+ devices? each\b|\b25 total\b/i,
    msg: "wrong device cap — machines_per_user is NOT enforced; the org-wide cap is 100 (Free) / 10,000 (Business)",
  },
  {
    re: /(soc ?2[^.\n]{0,25}(certified|compliant\b)|iso ?27001[^.\n]{0,20}certified)/i,
    msg: "not certified — SOC 2 / ISO 27001 are IN PROGRESS",
  },
];

// Applied to product surfaces only (not blog).
const SURFACE_RULES = [
  {
    re: /\bquickztna (up|down|status|peers|login|logout|set|ip|dns|cert|acl|machines|auth-keys|netcheck|posture|route|secrets|exit-node|split-tunnel|threat|audit|compliance|install|uninstall|update|version|whois|configure|debug|log|metrics|wg-config|bugreport|doctor|devices|policy|keys|ping|nc|ssh|shell|whoami|service|config|bug-report)\b/,
    msg: 'wrong CLI binary — use "ztna", not "quickztna" (case-sensitive)',
    noExempt: true, // a wrong binary name is wrong even in a negative sentence
  },
  {
    re: /\bztna (ping|nc|ssh|shell|shell-token|doctor|devices|policy|keys|whoami)\b/,
    msg: "removed/nonexistent ztna subcommand (case-sensitive)",
    noExempt: true,
  },
  { re: /(App Store|Play Store|iOS app|Android app)/i, msg: "mobile-app claim — there is no iOS/Android client" },
  { re: /post-quantum[- ]encrypted/i, msg: "post-quantum-as-shipped claim — PQC was withdrawn" },
  { re: /self-hosted? (is )?available on|air-?gapped[^.\n]{0,25}(are |is )?supported/i, msg: "self-host-offered claim — managed cloud only today" },
  {
    re: /reproducible builds?|transparency log|hash-?chain(ed)? (audit|log)|quarterly[^.\n]{0,30}penetration test|red team exercise|FIPS 203 conform/i,
    msg: "unverified security claim removed per the 2026-06 audit",
  },
];

// Explicit, auditable exceptions. Each entry is a snippet of the ALLOWED clause
// plus the reason it is not a product claim. Keyed on text, not line numbers, so
// edits above don't silently re-suppress something else. Keep this list short —
// if it grows, the rule is wrong, not the content.
const ALLOW = [
  ["Harvest now, decrypt later\" is a real threat model", "defines the industry threat model; makes no QuickZTNA claim"],
  ["ML-KEM-768 is the NIST-standardised post-quantum key encapsulation", "defines the NIST algorithm; no product claim"],
  ["pre-standard Kyber library from 2022", "interop advice about Kyber vs ML-KEM; no product claim"],
  ["Log the key exchange mode in your session table", "generic implementation advice to the reader"],
  ["WebRTC (Web Real-Time Communication) is a browser standard", "defines WebRTC; no product claim"],
  ["Adding up your tool bill?", "shared cost-consolidation callout; names categories, not our features"],
  [
    "enable the strongest factor your provider offers — hardware-backed factors such as FIDO2 or WebAuthn if it supports them",
    "advice about the reader's IdP; the very next sentence states our own MFA is TOTP and that we do not implement WebAuthn",
  ],
  ["For 100 devices via Ansible", "fleet-rollout example, not a plan cap"],
  ["Threat model, cryptographic primitives in detail", "link description for the security-model page"],
];
// REDACT the allowlisted phrase rather than exempting the clause that contains it.
// Skipping the whole clause was a hole: public/llms.txt's security-model entry opens
// with the allowlisted "Threat model, cryptographic primitives in detail" and then
// goes on to claim hash-chained audit logs, FIPS 203 and reproducible builds — all
// of which the guard silently skipped, in the very file written for AI crawlers.
// Redaction exempts exactly the text that earned the exception and nothing else.
const redactAllowed = (clause) => {
  let out = clause;
  for (const [snip] of ALLOW) {
    if (out.includes(snip)) out = out.split(snip).join(" ");
    // A clause wholly inside an allowed snippet is itself the exception.
    else if (snip.includes(out.trim()) && out.trim().length > 20) return "";
  }
  return out;
};

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

const SUBJ_RE = new RegExp(SUBJ, "i");

let problems = 0;
for (const file of ROOTS.flatMap((r) => walk(r))) {
  // Blog POSTS are vendor-neutral-ish and need explicit attribution. The blog
  // INDEX and its layouts/templates are product surfaces — they carry sidebars and
  // CTAs written in our voice. Treating src/pages/blog/index.astro as a "post" made
  // its CTA ("WireGuard mesh + DLP + AI Operator.") unattributed and unchecked.
  const isBlog =
    /[\\/]blog[\\/]/.test(file) &&
    /[\\/]content[\\/]/.test(file) &&
    !/[\\/](index|_)[^\\/]*$/.test(file);
  // Split on \r?\n, not \n. A trailing \r breaks heading detection, because JS
  // treats \r as a line terminator that `.` will not match — so /^#{2,6}\s+(.*)$/
  // failed on every CRLF file and blog section attribution silently never fired.
  // That made the guard pass on Windows and fail on Linux CI for the same tree.
  const lines = readFileSync(file, "utf8").split(/\r?\n/);

  // Markdown section scope: everything under "## 5. QuickZTNA — ..." is about
  // us, even when individual sentences omit the name.
  let sectionOurs = false;
  // Anaphoric rules refer back to a PQC term in an EARLIER clause ("…the level
  // chosen in QuickZTNA"). Without requiring that antecedent they fire on
  // accurate classical prose. Reset at each heading so context cannot leak
  // across sections.
  let pqcContext = false;
  const PQC_TERM = /\b(ml-?kem|post-quantum|quantum-safe|kyber|hybrid pq)\b/i;

  for (const { text, line: i } of units(lines)) {
    const heading = text.match(/^#{2,6}\s+(.*)$/);
    if (heading) {
      sectionOurs = SUBJ_RE.test(heading[1]);
      pqcContext = PQC_TERM.test(heading[1]);
    }

    // Blog attribution carries across a COLON only — see splitClausesMeta.
    let prevAttributed = false;

    for (const { text: rawClause, afterColon } of splitClausesMeta(text)) {
      // PQC context is taken from the RAW clause, before redaction — otherwise an
      // allowlisted definition ("ML-KEM-768 is the NIST-standardised …") has its
      // PQC term removed and the anaphor in the next clause loses its antecedent.
      const rawHasPqc = PQC_TERM.test(rawClause);
      const clause = redactAllowed(rawClause);
      if (!clause.trim()) {
        if (rawHasPqc) pqcContext = true;
        continue;
      }
      // Denial is evaluated per MATCH below, not once per clause.

      // Attribution: surfaces describe our product by definition; the blog needs
      // the product name in the clause or in the enclosing heading.
      const attributed = isBlog
        ? SUBJ_RE.test(clause) || sectionOurs || (afterColon && prevAttributed)
        : true;
      prevAttributed = attributed;

      const rules = [
        ...PRODUCT_RULES,
        ...FACT_RULES,
        ...(attributed ? REMOVED : []),
        ...(isBlog ? [] : SURFACE_RULES),
      ];

      for (const { re, msg, noExempt, unless, also, needsPqcContext } of rules) {
        if (needsPqcContext && !pqcContext) continue;
        if (unless && unless.test(clause)) continue;
        if (also && !also.test(clause)) continue;
        // Iterate EVERY match: taking only the first meant a denied first
        // assertion skipped the rule entirely, so "QuickZTNA does not offer CASB
        // today, but QuickZTNA will offer CASB next quarter" passed clean.
        const gre = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
        let m = null;
        for (let hit; (hit = gre.exec(clause)); ) {
          if (hit[0].length === 0) gre.lastIndex++; // never loop on a zero-width match
          if (noExempt || !denied(clause, hit.index)) {
            m = hit;
            break;
          }
        }
        if (m) {
          console.error(`  ${file}:${i + 1}  ${msg}`);
          console.error(`    > ${clause.trim().slice(0, 130)}`);
          problems++;
        }
      }
      // Carry PQC context forward to the NEXT clause, so an anaphor can resolve
      // against an antecedent in the sentence before it.
      if (rawHasPqc) pqcContext = true;
    }
  }
}

if (problems > 0) {
  console.error(`\n✗ content lint FAILED: ${problems} forbidden claim(s).`);
  process.exit(1);
}
console.log("✓ content lint passed: no forbidden claims.");
