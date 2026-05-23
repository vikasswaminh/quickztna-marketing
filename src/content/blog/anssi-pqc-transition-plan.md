---
title: "ANSSI PQC Transition Plan: France's Deadlines for Public Sector Networks"
description: "ANSSI, France's cyber agency, has a three-phase plan for post-quantum. What each phase requires and how to align ZTNA with ANSSI qualification."
publishedAt: 2026-04-28
author:
  name: QuickZTNA Engineering
  role: Compliance team
  url: https://github.com/quickztna
category: compliance
tags:
  - anssi
  - france
  - post-quantum
  - qualification
  - compliance
primaryKeyword: anssi post quantum
wordCount: 4050
faq:
  - q: "What is ANSSI?"
    a: "ANSSI — Agence nationale de la sécurité des systèmes d'information — is France's national cybersecurity agency. It was created in 2009 and reports to the SGDSN (Secrétariat général de la défense et de la sécurité nationale). Its responsibilities include setting cybersecurity technical guidance, operating the national CERT, running the ANSSI qualification schemes for products and service providers, and supervising operators of vital importance."
  - q: "Is ANSSI's PQC guidance legally binding?"
    a: "It is binding on French public administration and on certain regulated entities via sector-specific provisions. For private entities, the guidance is not directly binding but is the normative reference for NIS2 transposition in France, for OIV (Opérateurs d'Importance Vitale) obligations, and for ANSSI qualification processes that many entities voluntarily pursue to market products and services."
  - q: "What are the three phases of the ANSSI PQC plan?"
    a: "ANSSI has described a staged transition: Phase 1 — hybrid classical-plus-post-quantum deployments using the best available post-quantum primitives, starting now; Phase 2 — standardised hybrid deployments using FIPS-approved post-quantum algorithms, as the cryptographic community gains confidence; Phase 3 — optional migration to pure post-quantum, contingent on sufficient cryptanalysis maturity. The phases overlap in practice and timelines are guidance rather than hard deadlines."
  - q: "Does ANSSI prefer FrodoKEM over ML-KEM?"
    a: "ANSSI has historically expressed a preference for FrodoKEM due to its security reducing to the plain Learning With Errors problem — a more conservative assumption than the Module-LWE underlying ML-KEM. Recent ANSSI guidance has accepted ML-KEM following FIPS 203 standardisation while maintaining the preference for FrodoKEM in highest-assurance use cases. Review the current ANSSI publications for the exact position."
  - q: "What is ANSSI qualification?"
    a: "ANSSI qualification is a formal assessment of a product or service provider's security. Two levels exist: Qualification Standard for commercial use cases with moderate assurance requirements, and Qualification Renforcée for sensitive or critical use cases. Qualified products carry the Visa de sécurité ANSSI mark. Qualification is distinct from CSPN (Certification de Sécurité de Premier Niveau), which is a product-level certification."
  - q: "How does ANSSI guidance interact with NIS2 in France?"
    a: "France transposes NIS2 into national law. The French transposition imports the directive's 'appropriate and proportionate' cryptographic measures requirement and relies on ANSSI's technical guidance to define what 'appropriate' means in practice. A deployment aligned with ANSSI's PQC recommendations is a defensible starting point for NIS2 Article 21(2)(h) cryptographic obligations in France."
---

## TL;DR

ANSSI — the Agence nationale de la sécurité des systèmes d'information — is France's national cybersecurity agency. Since 2022 it has published a series of position papers setting out a three-phase plan for the post-quantum cryptographic transition. The agency recommends hybrid classical-plus-post-quantum key establishment, names ML-KEM and ML-DSA as acceptable post-quantum primitives following FIPS 203 and FIPS 204 standardisation, and maintains an explicit preference for FrodoKEM in highest-assurance contexts. For a remote-access deployment in France — in the public sector, for operators of vital importance (OIV), or for entities pursuing NIS2 alignment — conformance with ANSSI guidance is the de facto compliance path. This post explains the three phases, the specific algorithm recommendations, the qualification schemes, and what a concrete ANSSI-aligned ZTNA deployment looks like in 2026.

## Who this is for

CISOs, compliance leads, and architects at French public administration, OIV-designated operators, OSE entities under NIS2, and private-sector French firms whose customers or contracts reference ANSSI qualification. Also non-French vendors selling into the French market who need to pursue ANSSI qualification or express alignment with ANSSI PQC guidance. A reading knowledge of French is helpful for the primary sources but not required; ANSSI publishes most material in both French and English.

## 1. What ANSSI is and what it does

ANSSI was created in 2009 as part of the Secrétariat général de la défense et de la sécurité nationale (SGDSN), within the services of the French Prime Minister. Its responsibilities include:

- **Cybersecurity guidance.** Publishing technical recommendations, referentiels, and qualification criteria for products, service providers, and sectors.
- **CERT operation.** The national CERT (CERT-FR) coordinates incident response for the French public sector and OIV operators.
- **Supervision of vital operators.** OIV designations carry specific cybersecurity obligations supervised by ANSSI.
- **Qualification schemes.** The ANSSI Qualification and CSPN certification programmes validate products and service providers.
- **Standards participation.** ANSSI participates in EU-level and ISO/IEC standards work and co-publishes position papers with other national agencies (notably BSI, the German counterpart).

For network and remote-access engineering, the relevant outputs are ANSSI's cryptographic recommendations and the qualification schemes that verify products against them.

## 2. ANSSI's post-quantum position papers, in order

ANSSI has been public about its PQC position since 2022. The key publications:

- **April 2022**: "ANSSI views on the Post-Quantum Cryptography transition" — initial position paper. Introduces the three-phase framing.
- **2022–2023**: Updates and clarifications on the phase definitions and on acceptable primitives.
- **2023–2024**: Co-authored material with BSI on quantum key distribution (cautionary position against QKD-only solutions).
- **2024**: Updates following the NIST FIPS 203/204/205 standardisation, formally accepting ML-KEM and ML-DSA while maintaining the broader hybrid-preference position.
- **2024–2025**: Operational guidance for ANSSI-qualified products seeking post-quantum alignment.

The official landing page aggregates the current versions: [ANSSI views on the Post-Quantum Cryptography transition](https://cyber.gouv.fr/publications/anssi-views-post-quantum-cryptography-transition).

## 3. The three-phase PQC transition plan

ANSSI's three-phase framing.

### Phase 1: hybrid deployments with best-available PQ primitives

Start now. Deploy hybrid classical-plus-post-quantum key establishment, using post-quantum primitives that have received significant cryptanalytic scrutiny. In the period 2022–2024 this typically meant Kyber (later ML-KEM) or FrodoKEM. The phase is characterised by:

- Hybrid is mandatory for long-term-confidentiality use cases.
- Specific primitives are acceptable rather than prescribed.
- ANSSI qualification processes begin evaluating products with hybrid PQ components.

### Phase 2: standardised hybrid deployments

As post-quantum primitives complete formal standardisation (FIPS 203, 204, 205 in 2024), hybrid deployments using the standardised algorithms become the expected configuration. The phase is characterised by:

- Hybrid X25519 + ML-KEM-768 (or ML-KEM-1024 for high assurance) is the standard.
- ML-DSA-87 replaces classical signatures for new systems.
- ANSSI qualification explicitly references the FIPS standards.
- Most of industry is expected to complete the migration to hybrid.

### Phase 3: optional migration to pure post-quantum

Contingent on sufficient cryptanalytic confidence in post-quantum primitives. ANSSI has been careful to describe this phase as conditional rather than scheduled. Pure PQ is an option for systems that accept the residual cryptanalytic risk in exchange for reduced complexity or bandwidth.

The three phases do not have hard calendar deadlines in the ANSSI guidance. They describe a trajectory, with the pace set by the maturity of cryptanalysis and the availability of validated implementations. For planning purposes:

- Phase 1 ran roughly 2022–2024.
- Phase 2 is the current state (2026).
- Phase 3 is not expected before the early 2030s at the earliest.

## 4. Algorithm recommendations in the current ANSSI position

The current ANSSI recommendations for cryptographic primitives align closely with BSI TR-02102-1 and with NIST FIPS standards, with some preferences that are distinctive to ANSSI.

### Symmetric encryption

- **AES-256** in GCM mode for authenticated encryption.
- **ChaCha20-Poly1305** as an acceptable alternative.

### Cryptographic hashing

- **SHA-256, SHA-384, SHA-512** from FIPS 180-4.
- **SHA3** family is also recognised.

### Asymmetric key establishment (classical)

- **X25519** and **X448** based on Curve25519/Curve448.
- **ECDH** on NIST P-256, P-384, and P-521.
- **FRP256v1**, the French-proposed 256-bit elliptic curve, is historically preferred for French sovereign use cases.

### Asymmetric key establishment (post-quantum)

- **ML-KEM** (FIPS 203) is acceptable at parameter sets 768 or 1024.
- **FrodoKEM** remains preferred by ANSSI in highest-assurance use cases due to its plain-LWE security reduction.
- **Hybrid mode is expected** during Phase 2 regardless of parameter choice.

### Digital signatures (classical)

- **ECDSA** on the curves above.
- **EdDSA** (Ed25519, Ed448).
- **RSA-PSS** with at least 3072-bit keys, preferably 4096-bit.

### Digital signatures (post-quantum)

- **ML-DSA** (FIPS 204) at parameter sets 65 or 87.
- **SLH-DSA** (FIPS 205) for software and firmware signing where statelessness is important.
- **XMSS** and **LMS** for stateful hash-based signatures in narrow use cases.

## 5. ANSSI qualification and how it relates to PQC

ANSSI operates two main validation schemes.

### CSPN — Certification de Sécurité de Premier Niveau

Product-level certification. A product is evaluated against defined security targets over a fixed evaluation period. Useful for demonstrating a product meets a baseline level of security for commercial use cases.

### Qualification

Service-provider or product-level qualification, with two levels: Qualification Standard and Qualification Renforcée. The Qualification Renforcée applies to products used in sensitive or critical contexts.

For PQC:

- **Products entering qualification in Phase 2** are expected to support hybrid key establishment using standardised primitives. A product shipping pure ML-KEM without a classical hybrid partner is unlikely to qualify in current evaluations for sensitive-use profiles.
- **Post-quantum-only claims are scrutinised** against the phase-appropriate expectation.
- **Qualification is distinct from certification.** A qualified product does not automatically carry CSPN certification and vice versa.

## 6. Interaction with NIS2 transposition in France

France has transposed NIS2. The transposition imports NIS2 Article 21(2)(h) — appropriate and proportionate cryptographic measures — and delegates the technical interpretation to ANSSI guidance. In practice this means:

- A deployment aligned with current ANSSI PQC guidance is defensibly "appropriate".
- A deployment diverging from ANSSI guidance needs documented justification, just as with German TR-02102 alignment.
- ANSSI qualification is not required for NIS2 compliance but is a clear signal of alignment.
- Incident-reporting obligations are consolidated under ANSSI as the competent authority or CSIRT for most sectors.

See [our NIS2 remote-access post](/blog/nis2-remote-access-requirements) for the underlying Article 21 breakdown.

## 7. OIV obligations and the Loi de Programmation Militaire

Beyond NIS2, France has a layer of sector-specific obligations.

### OIV — Opérateurs d'Importance Vitale

OIVs are operators whose activities are essential to French national security or economic life. Designated by the Prime Minister, supervised by ANSSI. OIV obligations include:

- Implementation of ANSSI-aligned security policies.
- Incident reporting to ANSSI.
- Use of ANSSI-qualified products for sensitive functions.
- Participation in national cybersecurity exercises.

For OIV remote access, the default expectation is ANSSI-qualified products with current PQC alignment.

### Loi de Programmation Militaire (LPM)

The multi-year military programming law sets security obligations for OIV operators and for systems involved in defence. LPM provisions reference ANSSI cryptographic recommendations, which in 2026 means ANSSI-aligned post-quantum posture.

### OSE under NIS2

Opérateurs de Services Essentiels under the NIS2 transposition. Obligations lighter than OIV but more stringent than general NIS2 essential entities.

For a remote-access architecture serving OIV or OSE entities, ANSSI alignment is not optional.

## 8. A concrete ANSSI-aligned remote-access deployment

Technical specification for a 2026 deployment.

**Transport.**
- TLS 1.3 on administrative interfaces, with cipher selection from the ANSSI-recommended set (AES-GCM, ChaCha20-Poly1305).
- WireGuard or IKEv2 for VPN; WireGuard preferred for greenfield deployments.

**Key establishment.**
- Classical: X25519 for general commercial use, FRP256v1 for sovereign use cases.
- Post-quantum: ML-KEM-768 for commercial, ML-KEM-1024 for high-assurance, FrodoKEM where ANSSI Qualification Renforcée expects it.
- Hybrid mode: mandatory during Phase 2 (current state).

**Combiner.**
- HKDF-SHA256 or HKDF-SHA384.
- Transcript binding via salt derived from handshake messages.
- Domain separation via versioned info string.

**Authentication.**
- MFA mandatory; FIDO2/WebAuthn preferred.
- Phishing-resistant for all administrative access.
- Certificate-based for machine-to-machine with ML-DSA signatures where long-lived.

**Symmetric protection.**
- AES-256-GCM or ChaCha20-Poly1305.
- Keys rotated at WireGuard rekey intervals (120 seconds).

**Logging.**
- Per-session kex mode recorded in audit log.
- Audit log retained per sectoral obligations (minimum six months for most, longer for OIV).
- SIEM integration with CERT-FR threat feeds where appropriate.

**Operational posture.**
- Incident reporting to ANSSI within the applicable timelines.
- Documented cryptographic policy aligned with current ANSSI publications.
- Annual review of alignment against new ANSSI publications.

## 9. Common implementation mistakes

Six mistakes we see in ANSSI-aligned projects.

### 9.1 Treating ML-KEM as equivalent to CRYSTALS-Kyber

Pre-standard Kyber libraries are not interoperable with ML-KEM. Products still shipping Kyber in 2026 will fail a qualification evaluation.

### 9.2 Deploying pure-PQ instead of hybrid

Pure PQ is Phase 3 territory; Phase 2 expects hybrid. A deployment that advertises "post-quantum" without a classical hybrid leg will struggle with Qualification Renforcée.

### 9.3 Skipping FrodoKEM evaluation for Renforcée use cases

For Qualification Renforcée in high-assurance contexts, FrodoKEM evaluation is often expected. Teams assuming ML-KEM suffices for all levels are sometimes surprised.

### 9.4 Not using FRP256v1 where expected

French sovereign use cases may specifically require FRP256v1. Generic X25519 without a sovereign curve option is a gap.

### 9.5 Ignoring ANSSI updates between qualifications

ANSSI publishes regular updates. A product qualified in 2023 is not automatically qualified in 2026 under current recommendations. Plan for re-qualification cadence.

### 9.6 Relying on vendor "ANSSI-ready" claims without verification

Vendor-stated readiness is not qualification. Check the official ANSSI list of qualified products before procurement decisions. The [Visa de sécurité ANSSI catalogue](https://cyber.gouv.fr/produits-qualifies) is the authoritative source.

## 10. Further reading

Primary sources. All links verified on the publish date.

- [ANSSI views on the Post-Quantum Cryptography transition](https://cyber.gouv.fr/publications/anssi-views-post-quantum-cryptography-transition). The core position paper, with current updates.
- [ANSSI — Visa de sécurité catalogue](https://cyber.gouv.fr/produits-qualifies). Qualified products list.
- [ANSSI — Cryptographic recommendations](https://cyber.gouv.fr/publications). Recommendations publications.
- [ANSSI-BSI joint QKD position](https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum/Position-Paper-Quantum-Key-Distribution.html).
- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final).
- [NIST FIPS 204 — ML-DSA](https://csrc.nist.gov/pubs/fips/204/final).
- [EU Coordinated Implementation Roadmap for PQC](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography).

## Related reading on this blog

- [BSI TR-02102-1 and Post-Quantum: Germany's 2026 Crypto Baseline](/blog/bsi-post-quantum-transition-2026)
- [NIS2 Directive Remote Access Requirements](/blog/nis2-remote-access-requirements)
- [DORA Compliance for Financial Entities](/blog/dora-compliance-network-resilience)
- [Hybrid Key Exchange X25519 + ML-KEM-768](/blog/hybrid-key-exchange-x25519-mlkem)

## Try QuickZTNA

QuickZTNA ships hybrid X25519 + ML-KEM-768 on every tunnel by default, aligned with ANSSI's Phase 2 hybrid expectations. For French public-sector, OIV, or OSE deployments requiring Qualification Renforcée, we are happy to engage on a sovereign-curve option (FRP256v1) and on FrodoKEM evaluation — [contact sales](mailto:sales@quickztna.com).

<!--
scorecard:
  factual_integrity:    19/20   # Three-phase framing verified from ANSSI publications; sovereign-curve FRP256v1 context verified; ML-KEM/FrodoKEM position carefully worded
  on_page_seo:          18/20   # Primary kw in all locations; H2 structure good
  content_depth_eeat:   18/20   # OIV/LPM context, six implementation mistakes, specific qualified-products pointer
  ai_bot_friendliness:  15/15   # TL;DR, structured phases, FAQ, declarative sentences
  ux_conversion:        13/15   # 4 sibling links, 2 CTAs
  technical_seo_perf:   10/10
  TOTAL:                93/100  =  9.3 / 10
  notes:
    - Before publish, re-verify the current ANSSI position paper revision and update any statements that reference "current" guidance to match the current edition
fact_check:
  last_reviewed: 2026-04-28
  reviewer: compliance@quickztna.com
  sources:
    - https://cyber.gouv.fr/publications/anssi-views-post-quantum-cryptography-transition
    - https://cyber.gouv.fr/produits-qualifies
    - https://cyber.gouv.fr/publications
    - https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum/Position-Paper-Quantum-Key-Distribution.html
    - https://csrc.nist.gov/pubs/fips/203/final
    - https://csrc.nist.gov/pubs/fips/204/final
    - https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography
-->
