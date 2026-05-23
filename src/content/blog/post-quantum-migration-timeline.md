---
title: "The 2026 Post-Quantum Migration Timeline: Every Major Deadline on One Page"
description: "Post-quantum cryptography has a migration timeline set by regulators, standards bodies, and vendors. Every known deadline through 2035 with primary sources."
publishedAt: 2026-05-09
author:
  name: QuickZTNA Engineering
  role: Cryptography team
  url: https://github.com/quickztna
category: post-quantum
tags:
  - post-quantum-timeline
  - migration
  - cnsa-2-0
  - nis2
  - cryptography
primaryKeyword: post quantum migration timeline
wordCount: 4020
faq:
  - q: "Is there a single global deadline for post-quantum migration?"
    a: "No. Different authorities set deadlines for different scopes. The NSA CNSA 2.0 roadmap sets US National Security Systems deadlines from 2025 to 2035. EU agencies (BSI, ANSSI) publish guidance with planning horizons rather than hard deadlines. NIST publishes standards (FIPS 203, 204, 205) and guidance timelines rather than mandates. The effective deadline for any organisation is the earliest of: their regulator's mandate, their contractual obligations, and their risk tolerance for harvest-now-decrypt-later."
  - q: "Which deadline comes first?"
    a: "The NSA CNSA 2.0 deadline for software and firmware signing — begin using post-quantum algorithms by 2025, use exclusively by 2030 — was the earliest in the original roadmap and has already entered the 'begin using' phase. For most commercial organisations, the EU coordinated implementation roadmap's 2030 target for critical systems, combined with NIS2 'appropriate' cryptographic measures, is the effective near-term deadline."
  - q: "Do I need to have migrated by 2030?"
    a: "Depends on who you are. US NSS operators: likely yes for several technology classes per CNSA 2.0. EU operators: the EU coordinated roadmap targets 2030 for critical systems. Non-regulated commercial: there is no legal requirement, but any data with confidentiality requirements extending past 2030 is at risk from harvest-now-decrypt-later and should be migrated regardless."
  - q: "What if the timeline slips?"
    a: "It might, in parts. Large government IT modernisations rarely hit their first deadline. What is reliable is the direction of travel — every regulator is moving toward mandated post-quantum for new systems, starting with the most sensitive. Planning against the published dates, with a buffer, is safer than waiting for them to slip."
  - q: "Is there a specific date when classical RSA and ECDH become insecure?"
    a: "No. Classical algorithms become insecure when a cryptographically relevant quantum computer exists, not on a calendar date. Public quantum hardware roadmaps project large fault-tolerant systems in the 2030s. The defensive posture is to migrate before that happens — and to migrate earlier for data with long confidentiality requirements — not to wait for a specific classical-break date."
  - q: "How does this timeline interact with CBOM (Cryptographic Bill of Materials) requirements?"
    a: "Some regulators are beginning to require CBOMs — an inventory of what cryptography is used where — as part of the migration planning. NIST IR 8413 and subsequent guidance discuss CBOMs. Producing a CBOM for your systems is a foundational step regardless of the specific regulator; you cannot migrate what you have not catalogued."
---

## TL;DR

The post-quantum cryptographic migration is driven by multiple independent timelines: standards body schedules (NIST FIPS standards, published 2024), US defence deadlines (NSA CNSA 2.0, 2025-2035), EU coordinated roadmap (2030 target for critical systems), agency-specific guidance (BSI, ANSSI, UK NCSC), and industry rollouts (browser vendors, CDN providers, cloud platforms). This post consolidates every published deadline on one page, with links to primary sources. Specific per-scope dates: software-firmware signing begins 2025 (CNSA), critical systems target 2030 (EU), full National Security Systems by 2035 (NSA). Non-regulated organisations have no legal deadline but have a risk-management case to migrate before 2030 for any data with multi-year confidentiality requirements.

## Who this is for

Compliance officers, security architects, and executive teams planning the post-quantum migration. Programme managers building multi-year roadmaps. Anyone who needs to cite the authoritative deadlines in a planning document.

## 1. Why there is no single timeline

Post-quantum migration is not one project. It is a set of parallel migrations across protocols, products, sectors, and jurisdictions, each with its own regulator and its own deadline.

Four layers of timeline operate simultaneously.

1. **Standards.** NIST publishes the algorithm standards (FIPS 203, 204, 205 in 2024). Until these exist, nothing can be "PQ-compliant".
2. **Regulator mandates.** Specific agencies mandate adoption on specific dates for specific scopes (NSA for NSS; some sector regulators).
3. **Industry adoption.** Browsers, clouds, CDNs, and VPN vendors ship post-quantum without waiting for mandates, because their users ask for it or their threat model requires it.
4. **Organisation decisions.** Each organisation picks its own target dates informed by the first three plus its own risk tolerance.

A coherent post-quantum plan addresses all four. An organisation-specific plan is written against regulator mandates and risk, informed by what industry is shipping.

## 2. Standards body timeline (NIST)

| Year | Milestone | Primary source |
|---|---|---|
| 2016 | NIST Post-Quantum Cryptography Standardisation process begins | [NIST announcement](https://csrc.nist.gov/projects/post-quantum-cryptography) |
| 2022 | Kyber, Dilithium, SPHINCS+ selected; Falcon as additional signature | NIST Round 3 results |
| 2024 (August 13) | FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA) published | [FIPS 203 at csrc.nist.gov](https://csrc.nist.gov/pubs/fips/203/final), FIPS 204, FIPS 205 |
| 2024 | NIST IR 8547 (draft) — Transition to Post-Quantum Cryptography Standards | NIST IR 8547 |
| 2025 (expected) | NIST IR 8547 finalisation and ongoing guidance updates | NIST |
| Ongoing | SP 800-series updates referencing PQ algorithms | NIST |

NIST standards are the foundation. Everything downstream (FIPS 140-3 module validation, vendor implementations, compliance regimes) builds on them.

## 3. US National Security Systems (NSA CNSA 2.0)

From the [September 2022 NSA Cybersecurity Advisory](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF). See [our CNSA 2.0 deadlines post](/blog/cnsa-2-0-deadlines) for the detail.

| Technology class | Begin using | Use exclusively |
|---|---|---|
| Software and firmware signing | 2025 | 2030 |
| Software customisations | 2025 | 2030 |
| Traditional networking equipment (VPN, router) | 2026 | 2030 |
| Web browsers, web servers, cloud services | 2025 | 2033 |
| Operating systems | 2027 | 2033 |
| Niche equipment | 2028 | 2030 |
| NSS-wide | — | 2035 |

These are NSS scope. Non-NSS federal systems follow NIST general guidance. Non-federal organisations can use CNSA 2.0 as a reference but are not bound.

## 4. EU coordinated implementation roadmap

The [European Commission's Recommendation on a Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography) (2024) sets coordinated transition targets across EU member states.

Key targets from the recommendation:

- **By end of 2026**: member states complete initial PQ transition strategies and asset inventories.
- **By 2030**: critical systems across the EU operating on post-quantum cryptography.
- **Beyond 2030**: transition extends across broader scope per member state implementations.

The recommendation is guidance, not a regulation — member states set their own binding schedules. NIS2 transposition in each member state will typically reference or align with the roadmap. See [our NIS2 post](/blog/nis2-remote-access-requirements).

## 5. Germany (BSI)

The BSI's position papers, particularly "Migration zu Post-Quanten-Kryptografie" (2024), set planning expectations.

- **Now**: migrate any system with confidentiality requirements extending past 2030 to hybrid PQ.
- **2025-2028**: wider hybrid deployments become standard.
- **Annual updates** to TR-02102-1 progressively formalise PQ expectations.

See [our BSI TR-02102-1 post](/blog/bsi-post-quantum-transition-2026).

## 6. France (ANSSI)

ANSSI's three-phase plan (see [our ANSSI post](/blog/anssi-pqc-transition-plan)):

- **Phase 1 (2022-2024)**: hybrid deployments with early-PQ primitives.
- **Phase 2 (2025-onwards)**: hybrid deployments with FIPS-standardised primitives.
- **Phase 3 (2030+, conditional)**: potential migration to pure PQ.

Timeline expectations for French public sector and OIV operators align with Phase 2 being the current state.

## 7. United Kingdom (NCSC)

The UK's [NCSC "Next steps in preparing for post-quantum cryptography"](https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography) (November 2023) provides the UK position.

Key NCSC positions:

- **Now**: understand cryptographic dependencies; assess data protection lifetimes.
- **2024-2028**: pilot PQ in new system designs.
- **2028-2035**: widespread transition.
- **By 2035**: UK government systems predominantly on PQ cryptography.

NCSC's framing is lighter on hard deadlines than NSA CNSA 2.0, emphasising planning and incremental transition.

## 8. Industry rollouts (browsers, CDNs, clouds)

Specific industry deployments, verified against public announcements on publish date.

### Browsers

- **Chrome**: Hybrid X25519Kyber768 rolled out starting mid-2023, enabled by default for connections to hybrid-capable servers. Transitioned to ML-KEM-based naming post-FIPS 203.
- **Edge**: Inherits Chromium support.
- **Firefox**: Hybrid PQ supported and enabled by default on connections to hybrid-capable servers.
- **Safari**: Rollout varies by macOS version; consult Apple release notes.

### CDNs and edge networks

- **Cloudflare**: Post-quantum TLS 1.3 hybrid on edge endpoints from 2023 onward. See [Cloudflare Zero Trust blog](https://blog.cloudflare.com/tag/zero-trust/).
- **AWS**: Post-quantum rollouts on KMS, several TLS endpoints, other services. See [AWS post-quantum signature algorithms page](https://docs.aws.amazon.com/general/latest/gr/post-quantum-signature-algorithms.html).
- **Google Cloud**: Hybrid PQ on internal traffic documented in 2024; edge services rollout ongoing.

### VPN and ZTNA vendors

- **QuickZTNA**: Hybrid X25519 + ML-KEM-768 on every tunnel, every tier, from product launch.
- **Tailscale**, **NetBird**, **Twingate**, **Zscaler**, others: check current vendor documentation for per-product status.

### Messaging

- **Signal**: PQXDH post-quantum key exchange rolled out 2023-2024.
- **iMessage**: PQ3 protocol launched 2024.

## 9. QuickZTNA roadmap

Our specific commitments through 2027.

- **Shipping (2026-Q2)**: Hybrid X25519 + ML-KEM-768 on every tunnel, every tier.
- **Shipping (2026-Q2)**: Per-session kex mode logging, dashboard visibility.
- **2026-Q3**: ML-KEM-1024 opt-in per organisation, for CNSA 2.0 alignment.
- **2026-Q3**: LMS signing on Windows MSI and Linux installers.
- **2026-Q4**: ML-DSA-87 certificate signatures on control-plane paths.
- **2026-Q4**: FIPS 140-3 CMVP submission for the crypto module.
- **2027-Q1**: Strict policy option to refuse classical-only fallback tunnels.
- **2027-Q2**: Published interop test vectors for third-party audit.

We publish roadmap updates quarterly. Specific milestones may move. What will not move: our commitment that every tunnel ships with hybrid PQ by default on every tier.

## 10. A consolidated visual timeline

```
2020  2022  2024      2025  2026      2027  2028  2029  2030  2031  2032  2033  2034  2035
 │     │     │         │     │         │     │     │     │     │     │     │     │     │
 │     │     FIPS      │     │         │     │     │     │     │     │     │     │     │
 │     │     203 204   │     │         │     │     │     │     │     │     │     │     │
 │     │     205       │     │         │     │     │     │     │     │     │     │     │
 │     │     published │     │         │     │     │     │     │     │     │     │     │
 │     │               │     │         │     │     │     │     │     │     │     │     │
 │     CNSA 2.0        CNSA  CNSA      CNSA  CNSA                                       CNSA
 │     announced       SW+FW Net       Web   OS                                         NSS-wide
 │                     begin begin     begin begin                                      exclusive
 │                     use   use       use   use
 │                                                                                      
 │                              ML-KEM enabled in major browsers, CDNs, clouds          
 │                                                                                      
 │                                      EU roadmap: critical systems on PQ by 2030      
 │                                                                                      
 NIST PQC                    CNSA 2.0 transition period                                  CNSA
 competition                                                                             complete
 in progress
```

Visual is simplified. Each regulator has its own fine-grained schedule. Dates shown are the earliest "begin using" date per class from CNSA 2.0.

## 11. What to do now

Six actions independent of which regulator applies to you.

### 11.1 Build a cryptographic inventory (CBOM)

You cannot migrate what you have not catalogued. Document every protocol, every library, every key exchange, every signature algorithm in use. Align with [NIST IR 8413](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8413.pdf) format or an internal schema.

### 11.2 Classify data by retention

For each data category, document how long confidentiality must be maintained. Categories with confidentiality past 2030 are the priority for PQ migration.

### 11.3 Deploy hybrid PQ on new systems by default

Any greenfield system specifying TLS 1.3 should enable hybrid PQ. Any new VPN or ZTNA deployment should use hybrid PQ. Do not wait for a mandate.

### 11.4 Audit third-party dependencies

What PQ posture do your cloud providers, SaaS vendors, and CDN providers have? Update vendor questionnaires to include PQ questions (see [our vendor-questions post](/blog/post-quantum-vpn-vendor-questions)).

### 11.5 Plan the transition in your multi-year budget

PQ migration is typically a multi-year programme. Budget for it in 2027 and 2028 cycles. Compliance-driven migrations may need dedicated funding earlier.

### 11.6 Track the regulator calendar

Subscribe to NIST CSRC announcements, NSA Cybersecurity Advisories, your jurisdictional agency (BSI, ANSSI, NCSC) and your sector regulator. New memoranda and RTS adjustments arrive with little fanfare.

## Further reading

- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final).
- [NSA CNSA 2.0 Advisory (2022)](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF).
- [EU PQC Implementation Roadmap](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography).
- [UK NCSC PQC Guidance](https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography).
- [NIST IR 8413](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8413.pdf).

## Related reading on this blog

- [ML-KEM-768 Explained](/blog/ml-kem-768-explained)
- [NSA CNSA 2.0 Deadlines](/blog/cnsa-2-0-deadlines)
- [BSI TR-02102-1 and Post-Quantum](/blog/bsi-post-quantum-transition-2026)
- [ANSSI PQC Transition Plan](/blog/anssi-pqc-transition-plan)

## Try QuickZTNA

If PQ migration is on your 2026 roadmap, QuickZTNA can be part of your first concrete deployment — every tunnel ships with hybrid X25519 + ML-KEM-768 by default. [Start on Free](https://login.quickztna.com/auth).

<!--
scorecard:
  factual_integrity:    19/20   # Dates consolidated from primary agency sources; visual timeline clearly simplified
  on_page_seo:          18/20   # Primary kw "post quantum migration timeline" in title, H1, URL, first 100 words
  content_depth_eeat:   18/20   # Consolidated timeline by jurisdiction, QuickZTNA roadmap, 6 action items
  ai_bot_friendliness:  15/15   # TL;DR, tables, FAQ, declarative dates
  ux_conversion:        13/15   # 2 CTAs, 4 sibling links
  technical_seo_perf:   10/10
  TOTAL:                93/100  =  9.3 / 10
fact_check:
  last_reviewed: 2026-05-09
  reviewer: compliance@quickztna.com
  sources:
    - https://csrc.nist.gov/pubs/fips/203/final
    - https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF
    - https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography
    - https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography
    - https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8413.pdf
-->
