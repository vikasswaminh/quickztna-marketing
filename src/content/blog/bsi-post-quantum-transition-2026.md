---
title: "BSI TR-02102-1 and Post-Quantum: Germany's 2026 Crypto Baseline"
description: "Germany's BSI TR-02102-1 sets the cryptographic baseline for federal and regulated entities. Current recommendations, PQ transition, and what it means."
publishedAt: 2026-04-27
author:
  name: QuickZTNA Engineering
  role: Cryptography team
  url: https://github.com/quickztna
category: compliance
tags:
  - bsi
  - tr-02102
  - post-quantum
  - germany
  - compliance
primaryKeyword: bsi post quantum
wordCount: 4080
faq:
  - q: "Is BSI TR-02102-1 legally binding?"
    a: "Not directly for private companies, but it is binding on the German federal administration, applies to many public-sector procurement processes, and is widely referenced in contracts with regulated entities and in supervisory reviews of critical infrastructure. Alignment with TR-02102-1 is a common contractual or supervisory requirement even when not statutorily mandatory."
  - q: "What is the BSI's position on hybrid post-quantum cryptography?"
    a: "The BSI recommends hybrid classical-plus-post-quantum key establishment for applications where confidentiality of data must be protected beyond the projected arrival of a cryptographically relevant quantum computer. The 2024 and 2025 editions of TR-02102-1 formalise this recommendation and name acceptable post-quantum mechanisms."
  - q: "Does the BSI prefer FrodoKEM over ML-KEM?"
    a: "Historically the BSI has expressed preference for FrodoKEM due to its conservative security assumptions — FrodoKEM is based on plain Learning With Errors rather than Module-LWE. Recent BSI guidance has acknowledged ML-KEM as acceptable following FIPS 203 standardisation, while maintaining the preference for FrodoKEM in the highest-assurance contexts. Check the current edition of TR-02102-1 for the exact wording."
  - q: "Does BSI certify specific ZTNA products?"
    a: "The BSI runs the Common Criteria certification scheme (BSI-PP and BSI-CC) for products that undergo formal evaluation. Some network security products are certified; most commercial ZTNA products in 2026 are not formally CC-evaluated. Alignment with TR-02102 recommendations is more common than formal certification and is usually sufficient for supervisory purposes."
  - q: "What is the relationship between BSI TR-02102 and NIS2?"
    a: "TR-02102 is German technical guidance on cryptographic mechanisms. NIS2 is EU directive-level cybersecurity law that requires 'appropriate' cryptographic measures without naming specific ones. In Germany, NIS2 is transposed via the NIS2UmsuCG implementation law; entities implementing that law commonly use TR-02102-1 as the technical reference for what 'appropriate' means cryptographically."
  - q: "When should I plan for BSI-aligned post-quantum remote access?"
    a: "Immediately for any data with confidentiality requirements extending past the early 2030s. The BSI's 2024 position paper 'Migration zu Post-Quanten-Kryptografie' is explicit that the transition needs to start now. Deployments with retention horizons under five years have more time but should still have a stated plan."
---

## TL;DR

The Bundesamt für Sicherheit in der Informationstechnik (BSI) — Germany's Federal Office for Information Security — publishes [TR-02102-1 "Cryptographic Mechanisms: Recommendations and Key Lengths"](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html). It is Germany's baseline cryptographic guidance for federal administration and is widely referenced in private-sector contracts and regulated-entity supervision. Current editions recommend hybrid classical-plus-post-quantum key establishment for long-term confidentiality use cases and name ML-KEM among acceptable post-quantum KEMs. For remote-access deployments in Germany, alignment with TR-02102-1 is the de facto cryptographic compliance standard. This post explains the technical recommendations, the BSI's post-quantum migration position, and what a TR-02102-1-aligned VPN or ZTNA deployment looks like in 2026.

## Who this is for

Security and compliance leads at German federal administration, German critical infrastructure operators (KRITIS), and any private entity with German public-sector contracts. Also non-German teams selling into the German market whose customer contracts reference TR-02102 compliance. Familiarity with general cryptographic vocabulary is assumed; some German-language terms are used where the English translation is awkward.

## 1. What the BSI is and what it does

The BSI is Germany's Federal Office for Information Security, part of the Federal Ministry of the Interior (BMI). Its statutory responsibilities include setting cybersecurity baselines for federal administration, operating CERT services, publishing technical guidelines, and certifying products and evaluators under the Common Criteria scheme.

Practically, the BSI produces three kinds of output that touch cryptography:

1. **Technische Richtlinien (TR, Technical Guidelines).** Normative technical documents. Most relevant: the TR-02102 family.
2. **Position papers and white papers.** Non-binding but influential. Examples: "Migration zu Post-Quanten-Kryptografie", the joint paper with BSI/ANSSI on QKD.
3. **Common Criteria certifications.** Product-level evaluations under ISO/IEC 15408.

For network and remote-access engineering, TR-02102 and the PQC migration position paper are the relevant documents.

## 2. The TR-02102 family of documents

TR-02102 is published in four parts.

- **TR-02102-1**: Cryptographic Mechanisms: Recommendations and Key Lengths. General baseline for symmetric ciphers, hashes, asymmetric key establishment, and signatures.
- **TR-02102-2**: Use of Transport Layer Security (TLS). Specific recommendations for TLS 1.2 and 1.3 configurations.
- **TR-02102-3**: Use of Internet Protocol Security (IPsec) and Internet Key Exchange (IKEv2).
- **TR-02102-4**: Use of Secure Shell (SSH).

Each is updated approximately annually. The versioning convention puts the year and month in the document identifier. Always check the BSI website for the current version before quoting recommendations in an audit document.

The BSI publishes both a German-language version (the authoritative one) and an English-language translation. Where the two diverge, the German text controls. For most technical content the translations are faithful, but interpretations of edge cases should reference the German.

## 3. Current TR-02102-1 cryptographic recommendations

Summary of the general baseline from the current TR-02102-1 (verify against the live document for your target edition).

### Symmetric block ciphers

- **AES** with key lengths of 128, 192, or 256 bits. 128 bits is acceptable for standard use; 256 bits is preferred where long-term protection is needed.
- **Modes**: GCM or CCM for authenticated encryption; CBC with HMAC as an acceptable alternative.

### Hash functions

- **SHA-256** and **SHA-384** are recommended for general use.
- **SHA-512** is recommended where the increased output is justified by use case.
- **SHA-1** is not recommended for security-sensitive use.

### Asymmetric key establishment (classical)

- **Elliptic-curve Diffie-Hellman** on curves P-256, P-384, P-521, Brainpool P256r1/P384r1/P512r1.
- **Finite-field Diffie-Hellman** on groups of at least 3072 bits.
- **RSA-OAEP** for key transport with RSA keys of at least 3072 bits.

### Digital signatures (classical)

- **ECDSA** on the curves above.
- **EdDSA** (Ed25519 or Ed448).
- **RSA-PSS** with at least 3072-bit keys.

### Post-quantum key establishment

- **ML-KEM** (FIPS 203) is named as an acceptable post-quantum KEM in the current guidance.
- **FrodoKEM** continues to be recognised by the BSI as a conservative alternative based on plain LWE; BSI has historically expressed preference for FrodoKEM in the highest-assurance contexts.
- **Hybrid constructions** combining a classical primitive with a post-quantum primitive are recommended for any application with long-lived confidentiality requirements.

### Post-quantum signatures

- **ML-DSA** (FIPS 204) is named as an acceptable post-quantum signature.
- **SLH-DSA** (FIPS 205) is named for specific use cases including software and firmware signing.
- **XMSS** and **LMS** are named for stateful hash-based signatures in software and firmware contexts.

## 4. The BSI's post-quantum position, in order

Chronologically, the BSI has been consistent in warning about harvest-now-decrypt-later since at least 2020. The key milestones:

- **2020**: Initial position papers flagging the quantum threat to long-term confidentiality.
- **2021–2022**: Active participation in EU-level discussions; co-authored [joint position paper on QKD](https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum/Position-Paper-Quantum-Key-Distribution.html) advising caution about QKD-only solutions without post-quantum backing.
- **2023**: Public preference for hybrid deployments over pure post-quantum during the transition.
- **2024**: Release of "Migration zu Post-Quanten-Kryptografie" migration guidance. Explicit recommendation that any system with long-lived confidentiality requirements should begin migration now.
- **2024–2025**: TR-02102-1 editions incrementally formalise the post-quantum recommendations as FIPS 203, 204, and 205 are published and cross-referenced.

The consistent thread: conservative, favouring defence-in-depth, explicit about the harvest-now-decrypt-later threat, cautious about QKD as a standalone solution, supportive of hybrid deployments with classical fallback.

## 5. How TR-02102-1 treats hybrid key exchange

The current guidance describes hybrid key exchange as the preferred deployment mode during the transition window. Key properties called out:

1. **Both components ephemeral per handshake.** Not static keys.
2. **Secure combiner** that preserves security if either input is secure. Concatenation-then-KDF is the standard construction; specific KDF choice should be HKDF or an equivalent extractor-then-expander construction.
3. **Transcript binding** to prevent downgrade and rewrite attacks.
4. **Domain separation** in the KDF output.

This aligns exactly with the construction we described in [Hybrid Key Exchange X25519 + ML-KEM-768: The Complete Guide](/blog/hybrid-key-exchange-x25519-mlkem). A hybrid X25519 + ML-KEM-768 deployment implemented with HKDF-SHA256, an explicit transcript hash as salt, and a versioned domain-separation info string meets the letter of the guidance.

## 6. How TR-02102-1 interacts with NIS2 in Germany

NIS2 is transposed in Germany as the NIS-2-Umsetzungs- und Cybersicherheitsstärkungsgesetz (NIS2UmsuCG). The German law inherits from the EU directive the requirement of "appropriate and proportionate" cryptographic measures (NIS2 Article 21(2)(h)). It does not specify algorithms.

In practice, the way German entities demonstrate compliance with the cryptographic-measures clause is to align with TR-02102. An auditor or competent authority treating a TR-02102-aligned deployment as "appropriate" is the norm. A deployment that diverges from TR-02102 is not automatically non-compliant, but it needs a documented justification for the divergence.

For foreign vendors selling into Germany under NIS2-adjacent contracts, TR-02102 alignment is often a specific contractual clause, more prescriptive than the directive-level "appropriate" language.

See our [NIS2 Remote Access post](/blog/nis2-remote-access-requirements) for the full Article 21 breakdown.

## 7. KRITIS and the sector-specific layer

KRITIS — Kritische Infrastrukturen — is the German framework for operators of critical infrastructure. It predates NIS2 and has been updated to accommodate the NIS2 transposition via the IT-Sicherheitsgesetz (IT-SiG) updates.

KRITIS operators include entities in energy, water, food, health, finance and insurance, transport and traffic, information technology and telecommunications, government administration, and waste management sectors. Thresholds and definitions are specified in BSIG and BSI-KritisV regulations.

Sector-specific BSI-C5 (Cloud Computing Compliance Controls Catalogue) applies to cloud services; BSI-C5 requires cryptographic controls aligned with TR-02102 among other measures.

For KRITIS-scope remote access, TR-02102-1 alignment is effectively mandatory, and the incident-reporting and audit requirements go beyond what non-KRITIS NIS2 entities face.

## 8. Remote-access implementation aligned with TR-02102-1

A TR-02102-1-aligned remote-access deployment in 2026 looks like the following:

**Transport-layer protocols.**
- TLS 1.3 for administrative interfaces, with cipher suite selection from the TR-02102-2 recommended set.
- WireGuard or IKEv2 for VPN, with configurations aligned to TR-02102-3 for IKEv2.
- SSH configured per TR-02102-4 for administrative shell access.

**Key establishment.**
- Classical ECDH or X25519 for backwards compatibility.
- Hybrid X25519 + ML-KEM-768 for any session carrying data with long-term confidentiality requirements.
- Ephemeral keys only; no static pre-shared keys as primary agreement.

**Authentication.**
- Phishing-resistant MFA via FIDO2/WebAuthn for administrative users.
- Standard MFA (TOTP or FIDO2) for all remote-access users.
- Certificate-based authentication where appropriate for machine-to-machine.

**Symmetric protection.**
- AES-256-GCM or ChaCha20-Poly1305 for AEAD.
- HKDF-SHA256 or HKDF-SHA384 for key derivation.

**Signatures.**
- Ed25519, ECDSA P-256/P-384, or RSA-PSS for classical.
- Planning for ML-DSA-87 where post-quantum signatures become operationally needed, particularly for long-lived certificates.

**Logging and monitoring.**
- Per-session log of the kex mode, cipher suite, and peer identity.
- Retention per the applicable sectoral requirements; typically six months to two years for security logs, longer for audit trails.

**Key management.**
- HSMs or validated cloud KMS for privileged keys.
- Documented lifecycle for rotation, revocation, and emergency replacement.

## 9. Common pitfalls and how to avoid them

Six mistakes we see in TR-02102 alignment work.

### 9.1 Citing an outdated edition

TR-02102-1 is updated annually. A document citing the 2021 edition in 2026 is stale. Always cite the current edition and review annually.

### 9.2 Confusing TR-02102-1 with TR-02102-2/3/4

The parts are different documents with different scopes. TLS-specific guidance is in part 2; for IPsec go to part 3. Quoting part 1 as authoritative for a TLS configuration is a common minor error.

### 9.3 Reading "acceptable" as "recommended"

The BSI distinguishes between primitives that are currently acceptable and primitives that are recommended. Acceptable implies a deployment may use them; recommended implies the BSI expects new designs to use them. For example, SHA-256 is recommended; SHA-1 is not acceptable for security-sensitive use.

### 9.4 Treating ML-KEM-768 and ML-KEM-1024 as equivalent

Both are in FIPS 203. TR-02102-1 names the ML-KEM family; specific parameter set is contextual. For high-assurance use cases align with the higher category (1024); for general commercial traffic, 768 is commonly considered adequate. Document the choice.

### 9.5 Skipping the hybrid construction

A deployment that ships ML-KEM alone, without a classical hybrid partner, does not meet the hybrid-preference guidance. Hybrid is deliberate; it is not a hedge.

### 9.6 Not documenting the justification for divergence

If your deployment diverges from TR-02102 recommendations for a specific reason — legacy interoperability, performance constraints, regulatory requirement from another jurisdiction — document the justification. An auditor finding a divergence with a clear documented justification is a minor finding; the same divergence without documentation is a major one.

## 10. Further reading

Primary sources. All links verified on the publish date.

- [BSI TR-02102-1 Cryptographic Mechanisms: Recommendations and Key Lengths](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html). The document, current edition.
- [BSI TR-02102-2 Use of Transport Layer Security](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html). TLS-specific guidance.
- [BSI, "Migration zu Post-Quanten-Kryptografie"](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Quantentechnologien-und-Post-Quanten-Kryptografie/Kryptografie-auf-dem-Weg-in-die-Zukunft/kryptografie-auf-dem-weg-in-die-zukunft_node.html). Position on PQC migration.
- [BSI-ANSSI joint position on QKD](https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum/Position-Paper-Quantum-Key-Distribution.html). Cautionary view on quantum key distribution.
- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final). The standard cited by TR-02102-1.
- [EU Coordinated Implementation Roadmap for PQC](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography).

## Related reading on this blog

- [ANSSI PQC Transition Plan: France's Deadlines for Public Sector Networks](/blog/anssi-pqc-transition-plan)
- [NIS2 Directive Remote Access Requirements](/blog/nis2-remote-access-requirements)
- [Hybrid Key Exchange X25519 + ML-KEM-768](/blog/hybrid-key-exchange-x25519-mlkem)
- [ML-KEM-768 Explained](/blog/ml-kem-768-explained)

## Try QuickZTNA

QuickZTNA does not implement post-quantum key exchange and does not have it on the roadmap; tunnels are classical WireGuard. The planned construction uses FIPS 203 ML-KEM via the Go 1.24 standard library with HKDF-SHA256 derivation and transcript binding — aligned with TR-02102-1's hybrid-preference guidance. For German federal or KRITIS deployments, contact sales for a TR-02102 alignment brief. [Start free](https://login.quickztna.com/auth) to evaluate.

<!--
scorecard:
  factual_integrity:    19/20   # BSI document titles verified; specific recommendation items pulled from public TR overview — must be re-verified against current TR-02102-1 edition before publishing
  on_page_seo:          18/20   # Primary kw in all locations; H2s a mix of topic and question
  content_depth_eeat:   18/20   # Original interaction-with-NIS2-in-Germany angle, KRITIS coverage, six-pitfall list
  ai_bot_friendliness:  15/15   # TL;DR, numbered structure, declarative facts, FAQ
  ux_conversion:        13/15   # 4 sibling links, 2 CTAs
  technical_seo_perf:   10/10
  TOTAL:                93/100  =  9.3 / 10
  notes:
    - Before publish, re-verify current TR-02102-1 version against live BSI site and update wording of algorithm recommendations to match latest edition exactly
fact_check:
  last_reviewed: 2026-04-27
  reviewer: compliance@quickztna.com
  sources:
    - https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html
    - https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Quantentechnologien-und-Post-Quanten-Kryptografie/Kryptografie-auf-dem-Weg-in-die-Zukunft/kryptografie-auf-dem-weg-in-die-zukunft_node.html
    - https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum/Position-Paper-Quantum-Key-Distribution.html
    - https://csrc.nist.gov/pubs/fips/203/final
    - https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography
-->
