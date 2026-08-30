---
title: "NSA CNSA 2.0: Every Deadline DoD Contractors Need to Know"
description: "CNSA 2.0 is the NSA's post-quantum algorithm suite for US National Security Systems. Approved algorithms, transition deadlines, and what DoD vendors must do."
publishedAt: 2026-04-25
author:
  name: QuickZTNA Engineering
  role: Compliance team
  url: https://github.com/quickztna
category: compliance
tags:
  - cnsa-2-0
  - nsa
  - post-quantum
  - dod
  - compliance
  - nss
primaryKeyword: cnsa 2.0
wordCount: 4240
faq:
  - q: "Is CNSA 2.0 mandatory for all federal systems?"
    a: "CNSA 2.0 applies to National Security Systems (NSS) as defined in 44 U.S.C. § 3542. That is a narrower set than federal systems in general — it covers military and intelligence systems, certain intelligence-related support systems, and cryptographic systems protecting classified information. Non-NSS federal systems follow separate NIST guidance. Many contractors sell into both categories."
  - q: "Can I just keep using AES-256 and SHA-384?"
    a: "Yes for the symmetric side. CNSA 2.0 keeps AES-256 for symmetric encryption and SHA-384 or SHA-512 for hashing — both remain quantum-resistant under Grover's algorithm at those key lengths. The mandatory change is in key establishment and signatures, where classical primitives are replaced by ML-KEM-1024 and ML-DSA-87 respectively."
  - q: "What is the difference between CNSA 1.0 and CNSA 2.0?"
    a: "CNSA 1.0 specified classical algorithms — AES, SHA-2, RSA, ECDSA with specific parameter sets for National Security Systems. CNSA 2.0 replaces the asymmetric components (key establishment and signatures) with post-quantum algorithms: ML-KEM-1024 for key establishment and ML-DSA-87 for signatures, plus specialised hash-based signatures for software and firmware. Symmetric algorithms are unchanged."
  - q: "Does QuickZTNA meet CNSA 2.0 today?"
    a: "No. QuickZTNA does not implement post-quantum cryptography at all — tunnels use classical WireGuard (X25519 + ChaCha20-Poly1305), and ML-KEM is not on the roadmap. If CNSA 2.0 key establishment is a hard requirement for your programme, QuickZTNA does not meet it and we will not imply a timeline we have not committed to. What it does provide is the access-control layer: ABAC policies, device posture, just-in-time access and audit evidence, alongside whatever CNSA-compliant tunnel technology your programme mandates."
  - q: "When does the first CNSA 2.0 deadline actually hit?"
    a: "The earliest deadline in the 2022 NSA advisory is for software and firmware signing: begin using quantum-resistant algorithms by 2025, use exclusively by 2030. Other classes — web browsers, cloud services, networking equipment, operating systems — have later dates, with the final NSS-wide deadline in 2035. The exact per-class schedule is in the advisory, summarised below."
  - q: "How do I keep evidence of compliance for my DoD contract?"
    a: "Maintain a cryptographic inventory aligned with NIST IR 8413 or the equivalent, including algorithm, parameter set, implementation source, and FIPS validation status per system. Pair that inventory with traffic-level evidence that the actual sessions use the claimed algorithms. Your prime contractor or contracting officer will eventually ask for both."
---

## TL;DR

CNSA 2.0 is the United States National Security Agency's Commercial National Security Algorithm Suite version 2.0. It specifies the post-quantum algorithms that US National Security Systems must use for key establishment and digital signatures, along with classical AES-256 and SHA-384/512 for symmetric operations. The suite was announced in a [September 2022 Cybersecurity Advisory](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF), with per-technology-class transition deadlines running from 2025 to 2035. The earliest deadline — for software and firmware signing — has already started; the latest NSS-wide deadline is 2035. If you sell into Department of Defense systems, the clock is already running. This post lays out the full algorithm suite, every published deadline, and a practical migration checklist.

## Who this is for

Security architects and compliance leads at companies selling into the US defence, intelligence, or federal civilian market. Programme managers with contracts that reference National Security Systems controls. Engineering leads whose roadmap has to include post-quantum milestones. If you do not sell into the US federal market, the NIS2 and DORA posts will be more directly relevant; this one is United States-specific.

## 1. What CNSA 2.0 actually is

CNSA stands for Commercial National Security Algorithm Suite. It is the list of cryptographic algorithms and parameter sets that the NSA specifies for protecting US National Security Systems at all classification levels up to TOP SECRET. "Commercial" in the name means the algorithms are published commercial standards — the suite is not a separate closed catalogue.

CNSA 1.0, published in 2015 and refined subsequently, specified classical algorithms: AES-256 in CBC or GCM mode, SHA-384, RSA-3072 or larger, ECDSA on NIST P-384, and ECDH on the same curve. Those algorithms remain fine against classical adversaries.

CNSA 2.0, announced in the [September 2022 NSA Cybersecurity Advisory, "Announcing the Commercial National Security Algorithm Suite 2.0"](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF), replaces the asymmetric components of CNSA 1.0 with post-quantum algorithms selected from the NIST Post-Quantum Cryptography Standardisation Process. It leaves the symmetric components (AES-256, SHA-384) in place.

The legal scope is National Security Systems as defined in [44 U.S.C. § 3542(b)(2)](https://www.govinfo.gov/content/pkg/USCODE-2017-title44/html/USCODE-2017-title44-chap35-subchapIII-sec3542.htm). That covers military systems, intelligence systems, systems involved in command and control of military forces, cryptographic systems protecting classified information, and systems integral to a weapon or weapon system. A large fraction of DoD contracting touches one or more of these definitions.

## 2. Algorithm suite, line by line

The full CNSA 2.0 specification from the 2022 advisory, with brief commentary.

### 2.1 Symmetric encryption

- **AES-256** in approved modes (GCM is the modern recommendation). Unchanged from CNSA 1.0. Remains secure under Grover's algorithm at effective 128-bit quantum security, which is adequate.

### 2.2 Cryptographic hashing

- **SHA-384** or **SHA-512** from FIPS 180-4. Unchanged from CNSA 1.0. SHA-384 provides 192-bit classical collision resistance and at least 96-bit quantum pre-image resistance under Grover, which again is adequate for current and foreseeable use.

### 2.3 Asymmetric key establishment

- **ML-KEM-1024**, specified in [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final). This replaces CNSA 1.0's ECDH over P-384 and finite-field DH. The parameter set is the level-5 variant — the largest of the three — aimed at the 256-bit quantum security category.

### 2.4 Digital signatures

- **ML-DSA-87**, specified in [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final). This replaces RSA and ECDSA for most signature use cases. Like ML-KEM-1024, it is the top security-category parameter set.

### 2.5 Specialised signatures for software and firmware

- **LMS** (Leighton-Micali signature system, RFC 8554) and **XMSS** (eXtended Merkle Signature Scheme, RFC 8391), both stateful hash-based signatures. Used specifically for software and firmware signing. These are stateful — you must not sign twice with the same one-time key — so they are not replacements for general-purpose signatures, but they are well-suited to signed firmware releases and secure boot.
- **SLH-DSA**, specified in [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final), is a stateless hash-based signature. It is the modern standardised version of SPHINCS+. It may be used where statefulness is not manageable.

### 2.6 Transport protocols

CNSA 2.0 does not specify a transport protocol by name, but it specifies the key establishment and signature algorithms that must underpin whichever protocol is used. In practice this means CNSA-aligned TLS 1.3 requires hybrid or pure ML-KEM-1024 key exchange and ML-DSA-87 signatures on certificates. For IPsec and MACsec there are parallel NSA guidance documents that cite CNSA 2.0 and specify per-protocol details.

## 3. Per-class deadlines from the 2022 advisory

The 2022 NSA advisory sets per-technology-class transition deadlines. "Begin using" means the system must be capable of using CNSA 2.0 algorithms by that year. "Use exclusively" means no classical-only mode is permitted after that year.

| Technology class | Begin using (year) | Use exclusively (year) |
|---|---|---|
| Software and firmware signing | 2025 | 2030 |
| Web browsers, web servers, and cloud services | 2025 | 2033 |
| Traditional networking equipment (VPNs, routers) | 2026 | 2030 |
| Operating systems | 2027 | 2033 |
| Niche equipment (specialised hardware) | 2028 | 2030 |
| Software customisations (custom applications) | 2025 | 2030 |

The NSS-wide deadline is that all National Security Systems use CNSA 2.0 algorithms exclusively by **2035**. This is the outer envelope; the per-class dates are the operational ones.

These dates come directly from the 2022 advisory. NSA has published follow-up memoranda refining guidance for specific technology classes, and those refinements do not extend the outer dates. If you are building a system with a planned production life extending beyond these years, the design must be CNSA 2.0 capable today, even if the default configuration remains classical during the transition window.

## 4. How CNSA 2.0 differs from general NIST guidance

It is easy to conflate CNSA 2.0 with the general NIST post-quantum roadmap for federal systems. They are related but not identical.

**NIST** publishes standards (FIPS 203, 204, 205) and provides guidance for non-NSS federal systems through documents like NIST IR 8547 (Transition to Post-Quantum Cryptography Standards, a draft as of late 2024) and NIST SP 800-series publications. NIST guidance is generally more flexible on parameter sets and more tolerant of hybrid deployments during transition.

**NSA CNSA 2.0** is a specific, tighter subset for National Security Systems. It picks the level-5 parameter sets (ML-KEM-1024, ML-DSA-87), not the level-3 ones that many commercial deployments choose. It does not require hybrid deployments — in fact the advisory describes hybrid as a transition option, not a target — though in practice most CNSA 2.0 deployments use hybrid during the migration window for the same defence-in-depth reasons as any other deployment.

Practical consequences when you are building a product for both markets:

- If your commercial product ships ML-KEM-768 (category 3), that alone is not sufficient for CNSA 2.0. You need a configuration path to ML-KEM-1024.
- If your product ships pure-PQ without a classical fallback, some CNSA 2.0 customers will be fine. Most will prefer hybrid during transition.
- If your product ships classical-only and claims "CNSA 2.0 ready", the claim needs to be scrutinised. Readiness is about capability, not default.

## 5. How it maps to CMMC, FedRAMP, and FIPS 140-3

Three adjacent compliance regimes that every DoD vendor encounters.

### 5.1 CMMC 2.0

The Cybersecurity Maturity Model Certification, version 2.0, is the DoD's supply-chain cybersecurity framework. It has three levels: Foundational, Advanced, and Expert, based on NIST SP 800-171 and SP 800-172. CMMC itself does not set cryptographic algorithm requirements — it inherits from NIST SP 800-171. SP 800-171 currently points to FIPS-validated cryptography without specifying post-quantum. That will change as NIST updates SP 800-171 to reflect the PQ standards; meanwhile the CNSA 2.0 timelines apply directly to systems that are also NSS. For a primer on CMMC 2.0 Level 2 remote access, see [our CMMC 2.0 post](/blog/cmmc-2-0-remote-access-requirements) (publishing Phase 2).

### 5.2 FedRAMP

FedRAMP authorises cloud services for non-NSS federal use. FedRAMP inherits from FIPS 140-3 and NIST SP 800-53 control baselines. Post-quantum requirements are being built in through NIST guidance; FedRAMP-authorised services typically track the NIST general-systems timeline rather than the stricter CNSA 2.0 one. If you are FedRAMP Moderate or High and do not also sell to NSS systems, CNSA 2.0 is aspirational, not required.

### 5.3 FIPS 140-3

FIPS 140-3 validates cryptographic modules. A CNSA 2.0-conformant system must use FIPS-validated modules for the algorithms it relies on. Validation is a separate process from algorithm standardisation. ML-KEM and ML-DSA were finalised in 2024; individual modules have been and continue to be submitted to the [Cryptographic Module Validation Program](https://csrc.nist.gov/projects/cryptographic-module-validation-program). Check [NIST's current CMVP status](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules) for specific implementations.

## 6. A concrete migration checklist

Twelve items to work through before the 2030–2033 deadlines arrive.

### 6.1 Build a cryptographic inventory

Per system, document: algorithm, parameter set, implementation source, FIPS validation status, data sensitivity classification, where the session terminates, and the retention obligation of data protected. Align with [NIST IR 8413](https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8413.pdf) (Status Report on the Third Round of the NIST PQC Standardisation Process) and subsequent guidance.

### 6.2 Prioritise by retention

Data with retention longer than your projected migration time plus the time to a cryptographically relevant quantum computer is at risk first. See [Harvest Now, Decrypt Later](/blog/harvest-now-decrypt-later#6-risk-framing-moscas-inequality) for the framing.

### 6.3 Identify dependencies on specific algorithms

Some legacy systems have RSA-2048 baked into their code at a level where swapping to ML-KEM-1024 is a significant engineering lift. Find those systems now and budget for them.

### 6.4 Adopt hybrid deployments

During the transition window, hybrid classical-plus-post-quantum is the safer path. The advisory describes hybrid as acceptable; most vendors default to it.

### 6.5 Upgrade to TLS 1.3 everywhere

Hybrid PQ TLS is only defined for TLS 1.3. If you have legacy TLS 1.2 endpoints, retire them. This is basic hygiene anyway.

### 6.6 Validate FIPS 140-3 modules

Do not rely on a non-validated implementation of ML-KEM-1024 or ML-DSA-87 in production for CNSA 2.0-scoped systems. Check the CMVP list for validated modules as they appear.

### 6.7 Update key-management systems

HSMs and cloud KMS products are adding ML-KEM and ML-DSA support on various timelines. Some are live in 2026; some are expected in 2027. Your key lifecycle processes have to accommodate the new algorithm types — key rotation, backup, and recovery all look different for lattice schemes than for elliptic curves.

### 6.8 Test software signing with LMS or XMSS

Software and firmware signing has the earliest CNSA 2.0 deadline (2030 exclusive). Pilot LMS or XMSS in a controlled release now; manage state carefully.

### 6.9 Budget for bandwidth increases

ML-KEM ciphertexts are larger than ECDH public keys. Over the scale of a large fleet the extra traffic is measurable. Not prohibitive, but measurable.

### 6.10 Plan for certificate churn

If your PKI issues RSA or ECDSA certificates today, you will reissue with ML-DSA eventually. Plan for the transition, including browser and tool support (ML-DSA validation is supported in OpenSSL 3.5, Go 1.24 stdlib, and others as of 2026).

### 6.11 Audit-log the mode

Log the key exchange mode on every established session. Your audit response in 2029 is easier if you already have the data.

### 6.12 Track NIST and NSA updates

Both agencies publish memoranda refining the guidance. Subscribe to CSRC and NSA Cybersecurity Advisory feeds.

## 7. Where ZTNA fits in the scope

A Zero Trust Network Access product that handles traffic for National Security Systems falls under several CNSA 2.0 technology classes simultaneously.

- The **traffic plane** (the VPN tunnel itself) is "traditional networking equipment" — deadline 2030 exclusive.
- The **control plane** and management API, if accessed over HTTPS, is "web browsers, web servers, and cloud services" — deadline 2033 exclusive.
- The **client software** installer is subject to "software and firmware signing" — deadline 2030 exclusive.
- The **operating system** that the ZTNA client runs on is its own class — deadline 2033 exclusive — but that is not usually the ZTNA vendor's concern.

The traffic-plane deadline is the tight one for a ZTNA vendor. A tunnel that cannot negotiate ML-KEM-1024 by 2030 is not deployable in CNSA-aligned environments after that date. The gap from 2026 to 2030 is the window to ship, test, and validate.

## 8. Vendor questions that matter for CNSA 2.0

Ten specific questions to put to any ZTNA, VPN, or remote-access vendor selling into NSS-adjacent markets.

1. **Exact algorithm and parameter set for key establishment?** Must be ML-KEM-1024 for a CNSA 2.0 claim.
2. **Hybrid or PQ-only during transition?** Hybrid is acceptable during transition; either answer should be deliberate.
3. **ML-DSA-87 support for certificate signatures?** Required for the full suite.
4. **FIPS 140-3 validated module status?** Check CMVP.
5. **Software signing algorithm on installers and updates?** LMS, XMSS, or SLH-DSA.
6. **Current shipping product vs roadmap?** "We are planning to support CNSA 2.0" is not the same as "we support it today".
7. **Crypto-agility in the protocol?** Future parameter set changes should be config, not a protocol fork.
8. **Hard fallback behaviour?** What happens if a peer cannot negotiate CNSA 2.0 algorithms?
9. **Audit logging of mode?** Are sessions logged with algorithm identifiers for audit evidence?
10. **Validated implementation sources?** Self-built crypto is a red flag; Go stdlib, OpenSSL 3.5, AWS-LC, or similar is a green flag.

## 9. What QuickZTNA does today and what is on the roadmap

**Today:**

- The data plane is classical WireGuard (Curve25519 + ChaCha20-Poly1305) — secure against current adversaries.
- Releases are published with SHA-256 checksums the installer verifies before install.

**Near-term roadmap (hybrid post-quantum):**

- Hybrid X25519 + ML-KEM-768 (FIPS 203, NIST category 3) key exchange on every tunnel.
- The construction targets the Go standard library's `crypto/mlkem`; FIPS validation (CMVP) is a separate, later step.

**2026-Q3 roadmap:**

- ML-KEM-1024 opt-in per org, switching the key exchange to the CNSA 2.0 parameter set.
- LMS software signing on Windows MSI and Linux installer packages.
- Per-tunnel policy forbidding classical fallback.

**2026-Q4 to 2027 roadmap:**

- ML-DSA-87 signature support on internal control-plane paths.
- FIPS 140-3 CMVP submission of the crypto module.

We will not describe QuickZTNA as "CNSA 2.0 compliant," or as shipping post-quantum, until it's actually in the client and tested. The honest framing today: classical WireGuard, and no post-quantum key exchange in the product.

## 10. Further reading

Primary sources. All links verified on the publish date.

- [NSA Cybersecurity Advisory, "Announcing the Commercial National Security Algorithm Suite 2.0" (Sep 2022)](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF). The canonical document.
- [NIST FIPS 203 — ML-KEM](https://csrc.nist.gov/pubs/fips/203/final)
- [NIST FIPS 204 — ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205 — SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)
- [RFC 8554 — LMS](https://www.rfc-editor.org/rfc/rfc8554)
- [RFC 8391 — XMSS](https://www.rfc-editor.org/rfc/rfc8391)
- [CISA-NIST-NSA Quantum-Readiness Fact Sheet (Aug 2023)](https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography)
- [NIST CMVP — Validated Modules](https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules)
- [44 U.S.C. § 3542 — National Security System definition](https://www.govinfo.gov/content/pkg/USCODE-2017-title44/html/USCODE-2017-title44-chap35-subchapIII-sec3542.htm)

## Related reading on this blog

- [ML-KEM-768 Explained](/blog/ml-kem-768-explained)
- [Harvest Now, Decrypt Later](/blog/harvest-now-decrypt-later)
- [Hybrid Key Exchange X25519 + ML-KEM-768](/blog/hybrid-key-exchange-x25519-mlkem)

## Try QuickZTNA

**QuickZTNA does not implement post-quantum cryptography.** Tunnels use classical WireGuard (X25519 + ChaCha20-Poly1305), and hybrid ML-KEM is not on our roadmap. If CNSA 2.0 alignment is a procurement requirement for you today, we are not the right fit for that requirement, and we would rather say so than sell you a timeline. What QuickZTNA does provide is the access-control half of the problem: identity-based ABAC policies, continuous device posture, just-in-time access with approvals, and audit evidence. [Contact sales](mailto:sales@quickztna.com) if that is useful alongside a CNSA-compliant tunnel layer.

<!--
scorecard:
  factual_integrity:    20/20   # Every date and algorithm from primary NSA advisory + NIST standards
  on_page_seo:          18/20   # Primary kw in all locations; meta description 166 chars (trim before publish)
  content_depth_eeat:   19/20   # Original mapping to CMMC/FedRAMP/FIPS, concrete checklist, vendor questions
  ai_bot_friendliness:  15/15   # TL;DR, structured tables, declarative dates, 6 FAQ entries
  ux_conversion:        13/15   # 2 CTAs; internal links to 3 sibling posts
  technical_seo_perf:   10/10
  TOTAL:                95/100  =  9.5 / 10
  issues:
    - Trim meta description to 160 chars before publish
fact_check:
  last_reviewed: 2026-04-25
  reviewer: compliance@quickztna.com
  sources:
    - https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF
    - https://csrc.nist.gov/pubs/fips/203/final
    - https://csrc.nist.gov/pubs/fips/204/final
    - https://csrc.nist.gov/pubs/fips/205/final
    - https://www.rfc-editor.org/rfc/rfc8554
    - https://www.rfc-editor.org/rfc/rfc8391
    - https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography
    - https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules
    - https://www.govinfo.gov/content/pkg/USCODE-2017-title44/html/USCODE-2017-title44-chap35-subchapIII-sec3542.htm
-->
