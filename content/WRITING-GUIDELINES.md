# QuickZTNA Blog Writing Guidelines + Scoring Rubric

**Read this top-to-bottom before writing any post. Every post is scored against the rubric below before publishing. Target: 8/10 minimum, 9/10 stretch.**

---

## 0. Non-negotiables (instant rejection if violated)

1. **No fake facts, no fake statistics, no fake quotes, no fabricated studies.** If you cannot point to a publicly verifiable primary source (NIST doc, EU regulation text, RFC, GitHub code, peer-reviewed paper, vendor docs), do not write it. "According to a recent study…" without a URL = cut.
2. **No fake personas, no invented customer testimonials.** If we have a real case study, use it with their permission. Otherwise, use hypothetical framing ("A 50-person fintech running on AWS…") and label it as illustrative.
3. **No competitor trash talk.** Comparisons must be factual, sourced from competitor's own published docs, dated. If a competitor ships a feature we don't, say so. Credibility > short-term click.
4. **No AI-generated boilerplate that sounds like everyone else.** If a paragraph could appear on any vendor's blog, rewrite it or delete it.
5. **No broken internal links.** Every `/features`, `/pricing`, `/blog/...` link must resolve before publish.
6. **No scare tactics or FUD.** "Quantum computers will crack your VPN tomorrow" — wrong. Say what's true: harvest-now-decrypt-later is the real threat model, on a 10–15 year horizon.

If in doubt about a fact, put `[CITATION NEEDED]` inline and ship for review rather than invent.

---

## 1. Scoring Rubric (total 100 points, /10 score)

Every post gets scored before publish. Minimum acceptable = 80 (8/10).

### 1.1 Factual integrity (20 points) — the most important section

| Criterion | Points | What earns it |
|---|---|---|
| Every numeric claim has a cited source | 5 | Dates, versions, byte sizes, fine amounts — all link to primary source |
| No made-up studies or "research shows…" filler | 5 | Zero instances of uncited "studies show", "experts say", "many teams report" |
| Product claims match shipping reality | 5 | Only describe features that actually exist in QuickZTNA today (check `/features` page + CHANGELOG) |
| Competitor claims verified from their docs, dated | 5 | Screenshots or URLs with access dates; "as of 2026-04-23, Tailscale docs state…" |

### 1.2 On-page SEO (20 points)

| Criterion | Points | What earns it |
|---|---|---|
| Primary keyword in title, H1, first 100 words, URL slug, meta description | 5 | Check all 5 locations |
| 3–5 semantic/LSI keywords distributed naturally | 4 | Not stuffed — only if they flow |
| Meta title ≤60 chars, meta description 140–160 chars | 3 | Hits Google's SERP display limits |
| At least 1 H2 contains a question (matches "People Also Ask") | 3 | Targets PAA SERP feature |
| URL slug: short, keyword-first, no stop words | 2 | `/blog/ml-kem-768-explained` not `/blog/a-quick-guide-to-ml-kem-768` |
| Schema.org: `BlogPosting` + `FAQPage` when FAQ present | 3 | JSON-LD injected via layout |

### 1.3 Content depth + E-E-A-T (20 points)

*(Experience, Expertise, Authoritativeness, Trustworthiness — Google's quality framework.)*

| Criterion | Points | What earns it |
|---|---|---|
| 4,000+ words of substantive content (not padding) | 5 | Minimum for pillar-grade posts |
| Original angle, data, or analysis no competitor post has | 5 | Our own benchmarks, our own PQC packet captures, our own code snippets |
| Concrete examples with working code, commands, or configs | 4 | Not "here's how you might…" — actual runnable snippets |
| Author byline + bio visible, links to LinkedIn/GitHub | 3 | Builds E-E-A-T |
| "Last reviewed" date, updated at least annually | 3 | Freshness signal |

### 1.4 AI bot friendliness (15 points)

*(Optimising for ChatGPT, Perplexity, Claude, Gemini citations — increasingly how buyers discover vendors in 2026.)*

| Criterion | Points | What earns it |
|---|---|---|
| TL;DR / key takeaways block in first 150 words | 4 | LLMs lift the summary into answers |
| Self-contained paragraphs (each 2–4 sentences, own claim + proof) | 3 | LLMs chunk at paragraph level |
| Facts written as declarative sentences, not buried in clauses | 3 | "FIPS 203 was published on August 13, 2024" — easy to extract |
| Tables for comparisons, lists for steps | 3 | LLMs preserve structure when citing |
| Explicit "who this is for" section | 2 | Intent matching |

### 1.5 User experience + conversion (15 points)

| Criterion | Points | What earns it |
|---|---|---|
| Reading level grade 8–10 (Flesch 50–70) | 3 | Technical but accessible |
| Avg sentence ≤20 words, avg paragraph ≤4 sentences | 2 | Scannable |
| One hero image, ≥3 diagrams/screenshots/tables | 3 | Broken up visually |
| Internal links: 1 pillar, 2 sibling, 1 product page | 3 | Link equity + journey |
| Two CTAs: one mid-post, one end-of-post | 2 | `/pricing`, `/download`, or newsletter |
| No motion that can't be paused, WCAG AA contrast | 2 | Accessibility |

### 1.6 Technical SEO + performance (10 points)

| Criterion | Points | What earns it |
|---|---|---|
| LCP < 2.5s, CLS < 0.1, INP < 200ms (Core Web Vitals) | 3 | Lighthouse >90 mobile |
| Hero image: AVIF/WebP, `loading="lazy"` on below-fold | 2 | Weight budget 200KB hero |
| `<article>` + `<time>` + `<address>` (author) semantic HTML | 2 | |
| Canonical URL set correctly | 1 | |
| OG image 1200×630 with title overlay | 2 | Social preview quality |

### Scoring conversion

| Total points | /10 |
|---|---|
| 90–100 | **10** — flagship, pin to top |
| 80–89 | **8–9** — publish |
| 70–79 | **7** — revise one section |
| < 70 | Do not publish. Return to draft. |

---

## 2. Writing rules

### 2.1 Voice

- **Second person ("you"), active voice, present tense.** "You can run QuickZTNA in…" not "QuickZTNA can be run by users in…".
- **Write like a smart senior engineer talking to a peer.** Skip condescension, skip "simply", skip "just".
- **One idea per paragraph.** If it has two points, split it.
- **Strong nouns + verbs.** Kill adverbs ("really", "very", "quite"). Kill hedges ("perhaps", "might") unless genuinely uncertain.
- **Concrete > abstract.** "1,184-byte public key" beats "large public key".

### 2.2 Structure every post must follow

```
<title>                                    # H1, primary kw first
<meta description>                         # 140–160 chars
<TL;DR block, 80–150 words>                # ≤ 150 words, answer the query
<Who this is for>                          # 1 paragraph
<Table of contents (for posts > 2k words)> # auto-generated
<Body: H2/H3 hierarchy>                    # H2 = question or kw phrase
<FAQ section>                              # 4–6 PAA-style Qs
<Related reading (3 internal links)>
<CTA>                                      # pricing / download / newsletter
<Author byline>
<Last reviewed date>
```

### 2.3 Headings

- **H1**: one per page, contains primary keyword
- **H2**: section headers; at least 2 should match common PAA questions
- **H3**: sub-sections; use sparingly
- **Never** skip levels (no H2 → H4)
- **Never** use H2 for decoration — every H2 should be a scannable answer unit

### 2.4 Links

- **External**: `target="_blank" rel="noopener noreferrer"` on external. Prefer primary sources (NIST, IETF, EUR-Lex) over secondary (news sites summarising primary).
- **Internal**: descriptive anchor text. "Read our [guide to ML-KEM-768](…)" not "click here".
- **Affiliate/paid**: we do not do this. Ever.

### 2.5 Code blocks

- Language-tagged fenced blocks (` ```bash `, ` ```powershell `, ` ```typescript `).
- Must run as pasted. If not, mark clearly: `# pseudo-code, not runnable`.
- Prefer shell one-liners over GUI screenshots for reproducibility.

### 2.6 Images

- Original diagrams preferred (Excalidraw exports or our SVG brand system).
- Every image has descriptive `alt` text — not "diagram" or "image of".
- Hero 1200×630, ≤200KB, AVIF with WebP/JPG fallback.
- Screenshots: redact real org names, auth keys, IPs (except documented examples).

### 2.7 Citation format

Inline Markdown links to the primary source on first mention. Full list at the bottom under "References".

Good:
> [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) specifies ML-KEM across three parameter sets.

Bad:
> According to NIST, ML-KEM has three parameter sets.

### 2.8 Dates

- ISO format in code/metadata: `2024-08-13`.
- "August 13, 2024" in body prose.
- Always include year. Never "last year" or "recently" — these stale.

### 2.9 Claims about our own product

Cross-check against `f:/quickztna/quickztna/docs/FEATURES.md` (the feature matrix, keyed to
the handler that implements each one) and `/features` before writing. **If no handler
implements it, it is not a feature — do not write it.** State shipped facts plainly:

> **Shipped:** WireGuard tunnels (X25519 + ChaCha20-Poly1305) on every plan.
> **Not shipped:** post-quantum key exchange. Do not describe ML-KEM/PQC as ours.

**Withdrawn capabilities — never claim these.** The 2026 lean pivot removed DLP
PII-scanning (only file-hash malware detection remains), CASB, workforce analytics,
session recording, remote desktop, software inventory, user-risk scoring, the AI
Operator/assistant, and the secrets vault. There is no FIDO2/WebAuthn (TOTP only), no SAML
login (disabled), no self-host, and no "Workforce" plan — there are exactly two plans,
Free and Business. `scripts/lint-content.mjs` blocks these at build time; if the linter
stops you, the copy is wrong, not the linter.

---

## 3. SEO checklist (run before publish)

- [ ] Primary keyword in: URL slug, H1, first 100 words, meta title, meta description, at least 1 H2, image alt
- [ ] Meta title ≤ 60 chars, meta description 140–160 chars
- [ ] At least 1 H2 phrased as a question that matches People Also Ask for this kw
- [ ] 3+ internal links (1 pillar, 2 sibling cluster, 1 product)
- [ ] 2+ outbound authoritative links (primary sources)
- [ ] FAQ section with 4–6 Qs → JSON-LD `FAQPage` schema
- [ ] `BlogPosting` JSON-LD with `author`, `datePublished`, `dateModified`, `image`, `headline`
- [ ] Canonical URL set
- [ ] OG image 1200×630 with title overlay
- [ ] Reading level: paste into [Hemingway](https://hemingwayapp.com) — grade ≤ 10, 0 "very hard to read" sentences
- [ ] Lighthouse mobile score ≥ 90 on Performance + SEO + Accessibility

## 4. AI bot optimisation checklist

- [ ] TL;DR block in first 150 words (LLMs lift this into answers)
- [ ] Each paragraph self-contained with claim + proof (LLM chunk boundary)
- [ ] Declarative key-fact sentences, not clauses ("FIPS 203 was published on August 13, 2024.")
- [ ] Tables for comparisons, numbered lists for procedures
- [ ] "Who this is for" section
- [ ] llms.txt entry added at site root (post-publish)
- [ ] Schema.org JSON-LD valid (test at [Schema.org validator](https://validator.schema.org))

## 5. Legal + brand

- No specific pricing claims in body copy that could age badly ("costs $10/user/month as of 2026-04"). Link to `/pricing` instead.
- Company name: **QuickZTNA** (one word, capital Q, capital Z, capital T, capital N, capital A). Not "Quick ZTNA", not "QuickZtna", not "quickztna" in body prose.
- Legal entity for regulatory posts: **Victor Chasex Pvt Ltd (operating as QUICK ZTNA)**.
- Product is not a "VPN" in contexts where we're comparing to ZTNA — say "ZTNA" or "mesh overlay". VPN OK in casual comparisons.

## 6. Fact-check log per post

Every published post carries a `fact-check` comment block at the top of its markdown source:

```yaml
fact_check:
  last_reviewed: 2026-04-23
  reviewer: vikas@networkershome.com
  sources:
    - https://csrc.nist.gov/pubs/fips/203/final  # ML-KEM spec
    - https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF  # CNSA 2.0
    - ...
```

Reviewer must have clicked every URL and confirmed the claim we make from it.

---

## 7. Scorecard format (end of every published post)

Each post ships with a scorecard comment in source markdown (not rendered), and we log the final score in `content/scorecards.md`:

```
Post: ml-kem-768-explained
Date: 2026-04-23
Word count: 4,234
Scores:
  Factual integrity:    20/20
  On-page SEO:          18/20
  Content depth/EEAT:   18/20
  AI bot friendliness:  14/15
  UX + conversion:      13/15
   Technical SEO/perf:   10/10
  TOTAL:                93/100 = 9.3/10
Notes: Excellent factual rigor. Ding on meta description length (162 chars, trim to 158).
```
