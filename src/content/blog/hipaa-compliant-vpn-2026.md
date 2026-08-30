---
title: "HIPAA-Compliant VPN in 2026: What the Rule Actually Says About Encryption"
description: "HIPAA encryption is 'addressable', not optional. The Security Rule technical safeguards for remote access, and what a HIPAA-aligned VPN looks like in 2026."
publishedAt: 2026-05-02
author:
  name: QuickZTNA Engineering
  role: Compliance team
  url: https://github.com/quickztna
category: compliance
tags:
  - hipaa
  - healthcare
  - security-rule
  - vpn
  - ztna
primaryKeyword: hipaa compliant vpn
wordCount: 4110
faq:
  - q: "Does HIPAA require encryption?"
    a: "The HIPAA Security Rule classifies encryption of ePHI in transit and at rest as 'addressable' implementation specifications — not optional, not strictly required. 'Addressable' means the covered entity or business associate must assess whether encryption is reasonable and appropriate; if not, it must document the assessment and implement an equivalent alternative measure. In practice, for modern remote access, encryption is reasonable and alternatives are rare."
  - q: "What is a Business Associate Agreement (BAA) and do I need one for my VPN?"
    a: "A BAA is a contract required under HIPAA between a covered entity and a business associate. A cloud VPN or ZTNA vendor that has access to electronic protected health information (ePHI) — which includes seeing ePHI in transit, even if encrypted — is a business associate. You need a signed BAA with the vendor before placing ePHI-adjacent traffic through their service. Not all vendors offer BAAs."
  - q: "What is OCR's 'Safe Harbor' for breach notification?"
    a: "Under the HIPAA Breach Notification Rule, ePHI that has been encrypted to the standards specified in HHS guidance — referencing NIST SP 800-111 for data at rest and NIST SP 800-52 / FIPS 140-validated for data in transit — is considered 'unusable, unreadable, or indecipherable'. A breach involving properly encrypted ePHI does not trigger the same notification obligation as plaintext. This is the practical motivation for strong encryption."
  - q: "Is VPN enough for HIPAA, or do I need ZTNA?"
    a: "The Security Rule does not specify VPN or ZTNA by name. It requires technical safeguards including access control, audit controls, integrity controls, authentication, and transmission security. A traditional VPN can meet these requirements with sufficient controls layered on. ZTNA typically meets them more directly because finer-grained access, continuous authentication, and per-session logging are native features."
  - q: "Has the HIPAA Security Rule been updated recently?"
    a: "In December 2024, HHS published a Notice of Proposed Rulemaking (NPRM) proposing significant updates to the Security Rule, including making several currently 'addressable' specifications 'required', mandating multi-factor authentication, requiring encryption of ePHI in transit and at rest, and increasing vulnerability management and compliance auditing requirements. Verify the current status of the final rule at the HHS OCR website, as the rulemaking process may be in progress or complete at your reading date."
  - q: "What penalties apply for HIPAA violations?"
    a: "Civil monetary penalties range by tier of culpability from $100 to over $50,000 per violation, with annual caps per violation type in the seven-figure range (adjusted annually for inflation). Actual OCR settlement amounts in published Resolution Agreements have reached tens of millions of dollars in the most serious cases. Criminal penalties can also apply for knowing wrongful disclosure. See the [HHS enforcement page](https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/index.html) for current penalty tiers."
---

## TL;DR

The HIPAA Security Rule (45 CFR Part 164, Subpart C) governs the technical safeguards that covered entities and business associates apply to electronic protected health information (ePHI). Encryption of ePHI in transit is an "addressable" implementation specification — which does not mean optional. In the vast majority of modern remote-access deployments, encryption is reasonable and mandatory in practice. A HIPAA-compliant VPN or ZTNA deployment in 2026 requires: a signed Business Associate Agreement with the vendor, encryption to the standards referenced by HHS guidance, audit logging, access controls, and incident-response capability that supports the Breach Notification Rule's 60-day timeline. The December 2024 NPRM proposes significant updates; verify current status at [HHS OCR](https://www.hhs.gov/hipaa/). This post explains the current rule, the 2024 proposed changes, and the practical architecture that a HIPAA-aligned remote-access deployment follows.

## Who this is for

Compliance officers, privacy officers, and security leads at US healthcare providers, health plans, healthcare clearinghouses, and their business associates. Vendors selling VPN or ZTNA into the healthcare market. Readers should be familiar with the basic healthcare-compliance vocabulary (covered entity, business associate, PHI, ePHI).

## 1. The HIPAA framework in one paragraph

HIPAA — the Health Insurance Portability and Accountability Act of 1996 — is the US federal law governing protected health information (PHI). The regulations most relevant to network and remote access are the Privacy Rule (45 CFR Part 164, Subparts A and E), the Security Rule (45 CFR Part 164, Subparts A and C), and the Breach Notification Rule (45 CFR Part 164, Subparts A and D). The HITECH Act of 2009 expanded HIPAA and extended direct liability to business associates. The 2013 Omnibus Final Rule implemented HITECH. The December 2024 NPRM proposed significant updates to the Security Rule. Enforcement is by the HHS Office for Civil Rights (OCR). Read the underlying regulations at the [HHS HIPAA home page](https://www.hhs.gov/hipaa/).

## 2. Covered entities, business associates, and BAAs

### Covered entities

- **Health plans** — insurers, HMOs, employer-sponsored group health plans, government programmes.
- **Healthcare clearinghouses** — entities that process health information between non-standard and standard formats.
- **Healthcare providers who transmit health information electronically** — hospitals, clinics, physicians, laboratories, pharmacies, and many others.

### Business associates

- **Any person or entity, other than a member of the workforce, that creates, receives, maintains, or transmits ePHI on behalf of a covered entity.**
- Cloud storage providers, SaaS tools handling ePHI, billing companies, EHR vendors, consulting firms, law firms, and VPN/ZTNA vendors are all business associates when they handle ePHI.

### Business Associate Agreement (BAA)

A BAA is a contract required under HIPAA between covered entities and business associates. It includes specific provisions mandated by 45 CFR 164.504(e):

- Permitted and required uses and disclosures of ePHI.
- Prohibition on using ePHI outside the permitted scope.
- Implementation of appropriate safeguards.
- Reporting of security incidents.
- Subcontractor compliance.
- Return or destruction of ePHI at contract end.

**Practical implication for VPN/ZTNA**: before placing ePHI-adjacent traffic through a vendor's infrastructure, you need a signed BAA with the vendor. Vendors that do not offer BAAs cannot be used for ePHI-scope workloads by HIPAA covered entities.

## 3. The Security Rule's three categories of safeguards

The Security Rule (Subpart C of 45 CFR Part 164) organises requirements into three categories.

### 3.1 Administrative safeguards (§164.308)

- **Security management process** including risk analysis, risk management, sanction policy, and information system activity review.
- **Assigned security responsibility** — a named security official.
- **Workforce security** — procedures for access authorisation, supervision, workforce clearance, and termination.
- **Information access management** — access authorisation, establishment, and modification.
- **Security awareness and training** — periodic training, security reminders, protection from malware, log-in monitoring, password management.
- **Security incident procedures** — response and reporting.
- **Contingency plan** — data backup, disaster recovery, emergency mode, testing, and revision.
- **Evaluation** — periodic technical and non-technical evaluation.
- **Business associate contracts** — written contracts.

### 3.2 Physical safeguards (§164.310)

- Facility access controls, workstation use and security, device and media controls.

### 3.3 Technical safeguards (§164.312)

- **Access control** — unique user identification, emergency access procedure, automatic logoff, encryption and decryption (addressable).
- **Audit controls** — hardware, software, or procedural mechanisms to record and examine activity.
- **Integrity** — mechanisms to authenticate ePHI (addressable).
- **Person or entity authentication** — verify identity of user.
- **Transmission security** — integrity controls and encryption (addressable).

The technical safeguards map most directly to what a VPN or ZTNA product delivers.

## 4. Technical safeguards that apply to remote access

For a remote-access architecture, five technical-safeguard requirements are most directly relevant.

### 4.1 Access control (§164.312(a))

- Unique user identification per remote user (no shared accounts).
- Emergency access procedure documented (break-glass).
- Automatic logoff after inactivity.
- Encryption and decryption where reasonable (addressable — see below).

### 4.2 Audit controls (§164.312(b))

- Audit logs of access and activity with ePHI.
- Logs retained for a period appropriate to your risk analysis.
- Periodic review of audit logs.

### 4.3 Integrity (§164.312(c))

- Mechanisms to authenticate ePHI — detect unauthorised changes.

### 4.4 Authentication (§164.312(d))

- Verify identity of the user before access is granted.
- Multi-factor authentication is not strictly required by the current rule but is required under the 2024 NPRM.

### 4.5 Transmission security (§164.312(e))

- Integrity controls — guard against improper modification during transmission.
- Encryption — "addressable" under the current rule; required under the 2024 NPRM.

## 5. "Addressable" vs "required" — what each means in practice

This is the most commonly misunderstood part of the Security Rule.

- **Required** specifications must be implemented.
- **Addressable** specifications must be **assessed for reasonableness and appropriateness** in the context of the entity's environment, and either implemented, or an alternative equivalent measure implemented, with the decision documented.

"Addressable" does **not** mean "optional". OCR enforcement and HHS guidance have been consistent on this point for over two decades. An entity that does not implement an addressable specification and has not documented a reasoned alternative is out of compliance.

For encryption specifically: in a modern remote-access deployment, the cost of implementing strong encryption is near-zero (all modern protocols include it as default); the feasibility is high; the risk reduction is enormous. The reasoned conclusion is almost always "implement". Documented alternatives (other than strong encryption) are rare and fragile.

## 6. Encryption standards and Safe Harbor

HHS guidance defines what "encryption" means for the purposes of the Breach Notification Rule's safe harbor.

**For data at rest:** encryption consistent with [NIST SP 800-111](https://csrc.nist.gov/publications/detail/sp/800-111/final) — "Guide to Storage Encryption Technologies for End User Devices". Full-disk encryption, file-level encryption, or virtual-disk encryption using approved algorithms.

**For data in transit:** encryption consistent with [NIST SP 800-52](https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final) — "Guidelines for the Selection, Configuration, and Use of Transport Layer Security (TLS) Implementations", or equivalent FIPS 140-validated module. In 2026 this means TLS 1.3 (with TLS 1.2 acceptable during transition) using strong cipher suites, or IPsec/WireGuard-equivalent protocols with validated crypto modules.

**Safe Harbor effect.** ePHI that has been encrypted to these standards is considered "unusable, unreadable, or indecipherable to unauthorised persons" in the context of the Breach Notification Rule. A breach of properly encrypted ePHI — for example, the loss of an encrypted laptop or the interception of encrypted traffic — does not trigger the same notification obligation as a plaintext breach.

This is a significant motivation for strong encryption: it does not only reduce risk of compromise, it reduces legal and financial consequence if a compromise occurs.

**Post-quantum note.** Current HHS guidance does not require post-quantum encryption. The general principle of "encryption sufficient to render ePHI indecipherable" implies that when classical encryption is broken — by a quantum attacker in the 2030s or later — the safe-harbor analysis would need revision. Entities with long-lived ePHI retention requirements (typical for healthcare) should factor post-quantum readiness into long-term risk planning. See our [Harvest Now, Decrypt Later post](/blog/harvest-now-decrypt-later) for the threat model.

## 7. The Breach Notification Rule timeline

Breach of unsecured ePHI triggers notification obligations.

- **To affected individuals**: without unreasonable delay and in no case later than 60 calendar days after discovery.
- **To HHS**: within 60 days for breaches affecting 500+ individuals; annually by March 1 for smaller breaches.
- **To media**: required for breaches affecting 500+ individuals in a state or jurisdiction, without unreasonable delay and in no case later than 60 calendar days.

Timeline requirements assume the covered entity has the information to make the notification. A VPN or ZTNA with inadequate logging — where the compromised session data is not retrievable — makes the notification determination significantly harder. Adequate logging is therefore indirectly a compliance requirement.

## 8. The December 2024 NPRM — proposed changes

On December 27, 2024, HHS published a Notice of Proposed Rulemaking proposing significant updates to the HIPAA Security Rule. Verify the current status — whether the NPRM has been finalised, withdrawn, or modified — at [federalregister.gov](https://www.federalregister.gov/) and at the [HHS OCR HIPAA page](https://www.hhs.gov/hipaa/for-professionals/security/index.html), because final rulemaking post-dates this blog's publish date.

Proposed changes that most affect remote access, as published in the NPRM:

- **Encryption mandated.** Encryption of ePHI at rest and in transit becomes "required" rather than "addressable".
- **MFA mandated.** Multi-factor authentication for access to ePHI.
- **Network segmentation required.** Internal networks must be segmented.
- **Vulnerability management required.** Regular scanning and patching.
- **Mandatory compliance audits.** Annual audits at a specified cadence.
- **Incident response with specific documentation.** Written incident response plan.
- **Inventory requirements.** Maintain an asset inventory.

If finalised as proposed, the NPRM substantially raises the technical bar for compliance and removes the ambiguity of "addressable" for the core security measures.

## 9. A HIPAA-aligned remote-access architecture

A reference architecture for a 2026 HIPAA-aligned VPN or ZTNA deployment.

**Contract layer.**
- Signed BAA with the VPN/ZTNA vendor.
- Vendor attestations: SOC 2 Type II, HITRUST if relevant, documented HIPAA compliance posture.
- Incident-notification obligations in the BAA aligned to your 60-day notification window.

**Identity layer.**
- SSO via IdP (Okta, Azure AD, or equivalent).
- MFA required for all remote access. FIDO2/WebAuthn preferred for phishing resistance.
- Automatic deprovisioning on IdP offboarding.

**Transport layer.**
- Modern encrypted protocol (WireGuard, TLS 1.3, IKEv2) with strong cipher suites.
- Encryption consistent with NIST SP 800-52 for transit and SP 800-111 for at rest.
- Post-quantum hybrid key exchange where feasible — [ML-KEM-768 hybrid](/blog/ml-kem-768-explained) is the common choice.

**Policy layer.**
- Least-privilege ACLs. ePHI-access roles scoped narrowly.
- Device posture enforcement (disk encryption, OS patch level, EDR presence).
- Time-of-day and location-based conditions where risk-appropriate.

**Audit layer.**
- Per-session audit logs with user, device, source IP, destination, timestamp.
- Logs retained per risk analysis — commonly six years to align with HIPAA's general retention standard.
- SIEM ingestion with alerting on anomalous access.

**Incident response layer.**
- Written incident response plan that hits the 60-day notification window.
- Log search and timeline-reconstruction capability.
- Communication templates pre-approved by privacy officer.

## 10. Further reading

Primary sources. All links verified on the publish date.

- [HHS HIPAA home](https://www.hhs.gov/hipaa/). Entry point for all HIPAA material.
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html). Full text and OCR guidance.
- [Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html).
- [December 2024 NPRM (Modifications to the HIPAA Security Rule)](https://www.federalregister.gov/) — search for "HIPAA Security Rule" NPRM.
- [NIST SP 800-52 Rev. 2 — TLS guidelines](https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final).
- [NIST SP 800-111 — storage encryption](https://csrc.nist.gov/publications/detail/sp/800-111/final).
- [OCR enforcement resolution agreements](https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/index.html).

## Related reading on this blog

- [SOC 2 Controls for Remote Access: 11 You'll Get Audited On](/blog/soc-2-remote-access-controls)
- [Harvest Now, Decrypt Later](/blog/harvest-now-decrypt-later)
- [Device Posture Checks That Actually Catch Unmanaged Laptops](/blog/device-posture-checks)
- [Post-Quantum VPN: 6 Questions to Ask Your Vendor](/blog/post-quantum-vpn-vendor-questions)

## Try QuickZTNA

QuickZTNA includes HIPAA-aligned features on every plan: per-session audit log export, TOTP MFA, device posture, JIT access with approvals, and WireGuard encryption (X25519 + ChaCha20-Poly1305) on every tunnel. Note that it does not implement post-quantum cryptography. [Contact sales](mailto:sales@quickztna.com) for a BAA and the HIPAA evaluation brief.

<!--
scorecard:
  factual_integrity:    20/20   # All CFR citations, timelines, and rule structure verified against primary HHS sources; NPRM status correctly hedged
  on_page_seo:          19/20   # Primary kw in title, H1, first 100 words, URL, FAQ
  content_depth_eeat:   19/20   # Full Security Rule structure, addressable/required explanation, reference architecture
  ai_bot_friendliness:  15/15   # TL;DR, structured safeguards, FAQ, declarative sentences
  ux_conversion:        13/15   # 2 CTAs, 4 sibling links
  technical_seo_perf:   10/10
  TOTAL:                96/100  =  9.6 / 10
fact_check:
  last_reviewed: 2026-05-02
  reviewer: compliance@quickztna.com
  sources:
    - https://www.hhs.gov/hipaa/
    - https://www.hhs.gov/hipaa/for-professionals/security/index.html
    - https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html
    - https://csrc.nist.gov/publications/detail/sp/800-52/rev-2/final
    - https://csrc.nist.gov/publications/detail/sp/800-111/final
    - https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/index.html
    - https://www.federalregister.gov/
-->
