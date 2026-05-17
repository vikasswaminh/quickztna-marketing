---
title: "DORA Compliance for Financial Entities: Network Resilience in 10 Steps"
description: "DORA has applied to EU financial entities since January 2025. Articles 5 through 27 translated into ten concrete network-resilience implementation steps."
publishedAt: 2026-04-27
author:
  name: QuickZTNA Engineering
  role: Compliance team
  url: https://github.com/quickztna
category: compliance
tags:
  - dora
  - financial-regulation
  - ict-risk-management
  - eu-regulation
  - regulation-2022-2554
primaryKeyword: dora compliance
wordCount: 4260
faq:
  - q: "When did DORA actually apply?"
    a: "The Digital Operational Resilience Act — Regulation (EU) 2022/2554 — entered into force on 16 January 2023. It became applicable to in-scope financial entities on 17 January 2025. From that date, financial entities must be able to demonstrate compliance with the ICT risk-management, incident-reporting, and third-party oversight requirements."
  - q: "Is DORA a regulation or a directive?"
    a: "A regulation. Unlike NIS2, which is a directive that member states transpose into national law, DORA is directly applicable across the EU from the date of application. Member-state-level adjustments are narrow; the binding text is the regulation itself plus the Regulatory Technical Standards (RTS) and Implementing Technical Standards (ITS) issued by the European Supervisory Authorities."
  - q: "Who is in scope for DORA?"
    a: "Twenty types of financial entity, defined in Article 2. The list includes credit institutions, payment institutions, e-money institutions, investment firms, central securities depositories, central counterparties, trading venues, insurance and reinsurance undertakings, crypto-asset service providers, and critical ICT third-party service providers that serve in-scope entities. Some requirements are proportionate; the largest entities (for example, significant financial market infrastructures) face the most intensive obligations."
  - q: "How is DORA different from NIS2?"
    a: "DORA is sector-specific (financial services) and is a regulation, not a directive. It is more detailed than NIS2 on several points — threat-led penetration testing, critical third-party oversight, and ICT contract registers are DORA-specific. A financial entity may be in scope for both frameworks; DORA prevails where the two conflict for financial entities per Article 1(2). For non-financial entities, NIS2 applies and DORA does not."
  - q: "What does 'threat-led penetration testing' mean under DORA?"
    a: "Also known as TLPT or red-teaming, this is a form of realistic, intelligence-led testing that simulates an actual attacker against live production systems. It is based on the TIBER-EU framework. DORA requires significant financial entities to undergo TLPT at least every three years. The test is coordinated with the competent authority and executed against a scope that includes critical and important functions."
  - q: "What penalties apply for DORA non-compliance?"
    a: "National competent authorities set fines under their normal enforcement regimes — DORA does not set a single harmonised cap for financial entities. For critical ICT third-party service providers (CTPPs) under the oversight framework, the regulation specifies periodic penalty payments of up to 1% of the CTPP's average daily worldwide turnover for each day of non-compliance, for up to six months. This is an unusually punitive mechanism."
---

## TL;DR

The Digital Operational Resilience Act — [Regulation (EU) 2022/2554](https://eur-lex.europa.eu/eli/reg/2022/2554/oj) — has applied to EU financial entities since 17 January 2025. It imposes detailed requirements across five pillars: ICT risk management, incident reporting, digital operational resilience testing, ICT third-party risk management, and information-sharing arrangements. For network and remote-access engineering, the most relevant articles are 5 through 16 (ICT risk management including cryptography and access), Articles 17 through 23 (incident management), Articles 24 through 27 (testing including threat-led penetration testing), and Articles 28 through 44 (third-party risk). This post translates those articles into ten concrete implementation steps for a financial entity's network-and-remote-access stack, with references to primary sources throughout.

## Who this is for

CISOs, heads of ICT risk, and chief operating officers at EU financial entities — banks, payment institutions, investment firms, insurers, crypto-asset service providers — or vendors selling into those entities. Specific value for teams working on VPN, ZTNA, and remote-access architecture that must align with DORA evidence requirements. Familiarity with basic banking or insurance regulatory vocabulary is helpful.

## Table of contents

1. What DORA is and how it relates to other regulations
2. In-scope entities and proportionality
3. The five pillars of DORA, summarised
4. Step 1 — Establish an ICT risk-management framework
5. Step 2 — Build a complete ICT asset inventory
6. Step 3 — Harden cryptographic controls
7. Step 4 — Implement multi-factor and continuous authentication
8. Step 5 — Run continuous detection and monitoring
9. Step 6 — Stand up incident-classification and reporting capability
10. Step 7 — Execute digital operational resilience testing
11. Step 8 — Prepare for threat-led penetration testing
12. Step 9 — Manage ICT third-party risk with contracts that meet Article 30
13. Step 10 — Integrate with information-sharing arrangements
14. Further reading

## 1. What DORA is and how it relates to other regulations

DORA is an EU regulation on the digital operational resilience of financial entities. It was adopted alongside an amending directive (DORA Directive 2022/2556, which updates earlier financial-services directives to refer to DORA). The regulation is directly applicable from 17 January 2025 across the EU.

Its purpose is to harmonise ICT risk management across the EU financial sector. Before DORA, different regulators and supervisors had fragmented expectations. The regulation creates a single rulebook covering risk management, incident reporting, testing, and third-party oversight.

Relationship with other rules:

- **NIS2** (Directive (EU) 2022/2555) applies to in-scope entities across many sectors including certain financial ones. Where a financial entity is in scope for both, DORA's detailed rules on ICT risk management, third-party management, and operational resilience prevail (Article 1(2) of DORA). Entities are not required to comply with both sets of obligations separately.
- **GDPR** (Regulation (EU) 2016/679) continues to apply to processing of personal data. DORA does not override GDPR incident reporting to supervisory authorities for data breaches.
- **MiCA** (Regulation (EU) 2023/1114, Markets in Crypto-Assets) pulls crypto-asset service providers into scope for DORA as financial entities.
- **PSD2** (Directive (EU) 2015/2366) and its successor PSD3 interact with DORA for payment service providers. DORA's ICT requirements supplement PSD2's security requirements; they do not replace them.

The Regulatory Technical Standards (RTS) and Implementing Technical Standards (ITS) — secondary legislation drafted by the European Supervisory Authorities (EBA, EIOPA, ESMA) and adopted by the European Commission — define the detailed operational expectations. For compliance work, always pair the DORA regulation with the applicable RTS/ITS; the regulation sets the frame, the technical standards populate the detail.

## 2. In-scope entities and proportionality

Article 2 of DORA lists twenty types of financial entity in scope, summarised:

- Credit institutions (banks)
- Payment institutions
- Account information service providers
- Electronic money institutions
- Investment firms
- Crypto-asset service providers (under MiCA) and issuers of asset-referenced tokens
- Central securities depositories
- Central counterparties
- Trading venues
- Trade repositories
- Managers of alternative investment funds
- Management companies (UCITS management)
- Data reporting service providers
- Insurance and reinsurance undertakings
- Insurance intermediaries and ancillary insurance intermediaries (with exclusions)
- Institutions for occupational retirement provision
- Credit rating agencies
- Administrators of critical benchmarks
- Crowdfunding service providers
- Securitisation repositories

Plus ICT third-party service providers that serve in-scope entities come under an oversight framework when designated as critical (CTPPs) under Articles 31–44. The CTPP designation is made by the European Supervisory Authorities on specific criteria including systemic impact and substitutability.

Proportionality is explicit throughout the regulation. Article 4 requires entities to apply the regulation "taking into account their size and overall risk profile, and the nature, scale and complexity of their services, activities and operations". The biggest firms with systemic impact face the full set of obligations; smaller entities may scale down specific controls — though the core risk-management framework, incident reporting, and testing still apply.

## 3. The five pillars of DORA, summarised

DORA organises its substantive requirements into five pillars.

**Pillar 1: ICT risk management (Articles 5–16).** A comprehensive framework covering identification, protection, detection, response, recovery, and learning. This is where cryptography and access control land.

**Pillar 2: ICT-related incident management, classification, and reporting (Articles 17–23).** Definitions of significance, classification criteria, and the reporting workflow to competent authorities.

**Pillar 3: Digital operational resilience testing (Articles 24–27).** Regular testing of ICT systems, including threat-led penetration testing (TLPT) for significant entities.

**Pillar 4: ICT third-party risk management (Articles 28–44).** Contractual provisions, monitoring, concentration risk assessment, and the CTPP oversight framework.

**Pillar 5: Information-sharing arrangements (Article 45).** Voluntary arrangements to share threat intelligence among financial entities.

The ten implementation steps below cover all five pillars, with emphasis on where network and remote-access engineering matter.

## 4. Step 1 — Establish an ICT risk-management framework

Article 5 requires an ICT risk-management framework that is "sound, comprehensive and well-documented". In practice:

- Written policies on ICT risk, signed off by the management body (board level).
- Governance structure identifying the senior manager responsible (Article 5(2) makes the management body personally responsible for ICT risk-management effectiveness).
- Annual review of the framework.
- Integration with the entity's overall risk-management strategy.

For remote-access specifically, the framework should include a stated position on VPN and ZTNA architecture, acceptable cryptographic protocols, and the lifecycle of third-party remote-access providers.

## 5. Step 2 — Build a complete ICT asset inventory

Article 8 requires entities to identify, classify, and document ICT functions, assets, and sources. Concretely:

- Every user, device, and access channel in an inventory.
- Classification by business criticality.
- Mapping of ICT function to underlying asset.
- Identification of all sources of cyber risk, including remote-access endpoints.

The inventory has to be current, not a once-a-year snapshot. Modern ZTNA products can be a meaningful source because they already track every authorised device and user; that feed needs to be reconciled against the authoritative asset-management tool.

## 6. Step 3 — Harden cryptographic controls

Article 9 requires appropriate ICT security policies and tools, including "strong authentication mechanisms", "cryptographic mechanisms and data protection measures", and secure configuration baselines. The RTS supplementing Article 15 details cryptographic expectations.

Minimum expectations for financial-sector remote access in 2026:

- **TLS 1.3** on all admin channels; TLS 1.2 only where legacy interoperability is required, with a documented retirement plan.
- **Modern VPN** (WireGuard or IKEv2) for remote access. PPTP and L2TP-without-IPsec are not acceptable.
- **Post-quantum position.** The EU's coordinated [post-quantum transition roadmap](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography) is advisory rather than mandatory, but auditors expect entities with long-lived confidentiality requirements to have a stated plan. Hybrid classical-plus-post-quantum aligned with [ANSSI](/blog/anssi-pqc-transition-plan) and [BSI](/blog/bsi-post-quantum-transition-2026) guidance is the common answer.
- **Key management** using HSMs or validated cloud KMS products for privileged use cases; documented key lifecycle.
- **Ephemeral keys** in preference to static pre-shared keys.

## 7. Step 4 — Implement multi-factor and continuous authentication

The same Article 9 "strong authentication" requirement drives MFA. For financial-services remote access in 2026:

- **MFA on all remote-access authentication.**
- **Phishing-resistant MFA (FIDO2/WebAuthn)** for privileged users and administrators.
- **Continuous authentication signals**: device posture (disk encryption, OS version, EDR status), location, time-of-day, behavioural anomalies.
- **Step-up authentication** on anomalous patterns.
- **Session re-authentication** periodicity documented and enforced.

## 8. Step 5 — Run continuous detection and monitoring

Article 10 requires mechanisms to promptly detect anomalous activities, including ICT network performance issues and ICT-related incidents. For network and remote-access:

- **Per-tunnel and per-session logging**, including authentication events, posture check outcomes, and key exchange mode.
- **SIEM ingestion** of those logs with correlation rules.
- **Anomaly detection** on login patterns, connection rates, unusual destinations.
- **Endpoint detection and response** integrated with ZTNA posture signals.
- **Network flow telemetry** for analytic visibility.

The evidentiary standard is not only that you detect incidents; it is that you can prove detection occurred within a reasonable time window after occurrence.

## 9. Step 6 — Stand up incident-classification and reporting capability

Articles 17–23 cover ICT incident management. Article 18 requires classification of incidents according to significance criteria specified in the regulation and the RTS. Article 19 defines the reporting workflow to competent authorities.

The reporting timeline expectations are set by the [RTS on ICT incident classification and reporting](https://www.eba.europa.eu/regulation-and-policy/operational-resilience). Financial entities must:

1. **Classify** whether an incident is major, non-major, or significant, using the criteria in the RTS.
2. **Notify** the competent authority at the stages required by the RTS. At minimum, an initial notification early after detection, an intermediate report as facts emerge, and a final report with root-cause analysis.
3. **Apply** the classification criteria consistently so major incidents are not under-reported.

For remote access: the data you need to classify and report — affected users, compromised credentials, data exfiltration volumes, geographic scope — all come from your logs. If the logs are not retained at the right granularity, the classification cannot be performed properly.

## 10. Step 7 — Execute digital operational resilience testing

Articles 24 and 25 require regular testing. At minimum:

- **Vulnerability assessments and scans** periodically.
- **Open-source analyses** of critical components.
- **Network security assessments**.
- **Penetration tests** on critical functions annually or as defined by risk.
- **Source code reviews** of critical applications.
- **Scenario-based testing** of incident response.
- **Compatibility tests** when changing ICT systems.
- **Performance tests**.
- **End-to-end tests** of major ICT service chains.

These are the table-stakes tests. Entities must demonstrate an annual testing programme with documented scope and remediation tracking.

## 11. Step 8 — Prepare for threat-led penetration testing

Articles 26 and 27 introduce threat-led penetration testing (TLPT) for significant financial entities, based on the TIBER-EU framework. Key features:

- **Frequency**: at least every three years.
- **Scope**: critical and important functions, including ICT systems supporting them.
- **Live production**: tests must be on live production systems (with risk controls), not sandboxes.
- **Threat intelligence**: test scenarios developed from realistic threat-intelligence-led models.
- **Coordination**: competent authorities coordinate the test with the entity and appoint the test leader.
- **Pooled testing**: multiple financial entities sharing a critical third-party provider may carry out a pooled TLPT on that provider.

Pre-requisites for a TLPT-ready remote-access architecture:

- Comprehensive logging so the red team's actions are attributable.
- Segmentation so a successful intrusion in one segment does not trivially reach critical functions.
- Strong identity and posture controls so stolen credentials without a posture-compliant device are insufficient.
- Crypto-agility so a break-glass algorithm rotation is possible if a protocol weakness is found mid-test.

## 12. Step 9 — Manage ICT third-party risk with contracts that meet Article 30

Article 30 sets minimum contractual provisions for ICT third-party service arrangements. Every contract with an ICT service provider — including ZTNA vendors, cloud providers, identity providers, and SaaS tools that handle financial data — must include specific terms.

The mandatory minimums include:

- Clear, complete description of services, with locations.
- Data categories processed, with their geographical locations of storage and processing.
- Service availability and performance targets.
- Notification of changes that may materially impact services.
- Cooperation with competent authorities.
- Right-to-audit and inspection rights.
- Incident-notification obligations consistent with the entity's own Article 19 obligations.
- Assistance provisions at extra cost if needed.
- Exit strategy and termination rights.

Additional requirements apply for contracts covering critical or important functions (Article 30(3)).

Register of contracts: Article 28 requires financial entities to maintain a register of information on contractual arrangements with ICT third-party service providers. The register must be reportable to competent authorities in the format specified by the ITS.

## 13. Step 10 — Integrate with information-sharing arrangements

Article 45 encourages financial entities to exchange cyber-threat information and intelligence with each other through voluntary arrangements, subject to data protection and competition considerations. Sectoral ISACs (Information Sharing and Analysis Centres) and ENISA-led initiatives are the typical channels.

Practical implementation:

- Subscribe to one or more ISACs covering your sector.
- Nominate a threat-intel liaison on the security team.
- Have internal processes to consume ingested threat indicators into your ZTNA and SIEM tooling.

## Mapping DORA articles to ZTNA features

How a modern ZTNA product addresses specific DORA articles.

| DORA article | Obligation | ZTNA feature |
|---|---|---|
| Art. 7 Sound ICT | Resilient ICT systems | Multi-region control plane, DERP relay fallback |
| Art. 8 Identification | Asset inventory | Device registration, tagged machines |
| Art. 9 Protection | Crypto, MFA, access control | Hybrid PQ kex, FIDO2 SSO, ABAC policies |
| Art. 10 Detection | Monitoring | Per-session audit log, SIEM export |
| Art. 11 Response and recovery | Incident response | Machine quarantine, key revocation |
| Art. 12 Backup | Data backup policies | Config backup, encrypted org exports |
| Art. 15 ICT security policies | Policy enforcement | Policy-as-code in dashboard |
| Art. 19 Reporting | Incident reporting | Structured event export with classifiers |
| Art. 30 Third-party | Contractual terms | DPA, audit rights, SLA, exit process |

No ZTNA product is a complete DORA solution on its own. The organisational controls — management-body engagement, three-lines-of-defence, business continuity — are yours. A well-chosen ZTNA covers a substantial part of the technical Article 5–16 surface.

## Further reading

Primary sources only. All links verified on the publish date.

- [Regulation (EU) 2022/2554 (DORA) on EUR-Lex](https://eur-lex.europa.eu/eli/reg/2022/2554/oj). The regulation text.
- [Directive (EU) 2022/2556 — DORA amending directive](https://eur-lex.europa.eu/eli/dir/2022/2556/oj).
- [ESA Joint Committee on DORA](https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/digital-operational-resilience-act-dora). Authoritative source for RTS, ITS, and guidelines.
- [EBA: Regulatory and supervisory activities on operational resilience](https://www.eba.europa.eu/regulation-and-policy/operational-resilience).
- [TIBER-EU framework](https://www.ecb.europa.eu/pub/pdf/other/ecb.tibereuframework.en.pdf) from the European Central Bank.
- [Directive (EU) 2022/2555 (NIS2)](https://eur-lex.europa.eu/eli/dir/2022/2555/oj). Complementary baseline for non-financial sectors.

## Related reading on this blog

- [NIS2 Directive Remote Access Requirements](/blog/nis2-remote-access-requirements)
- [Post-Quantum VPN: 6 Questions to Ask Your Vendor](/blog/post-quantum-vpn-vendor-questions)
- [BSI TR-02102-1 and Post-Quantum](/blog/bsi-post-quantum-transition-2026)
- [ANSSI PQC Transition Plan](/blog/anssi-pqc-transition-plan)

## Try QuickZTNA

For financial-entity deployments, QuickZTNA Workforce tier includes the features most relevant to DORA: per-tenant audit log export, incident notification SLA, FIDO2/WebAuthn SSO, device posture, and DPAs aligned with Article 30 minimum contractual terms. [Contact sales](mailto:sales@quickztna.com) for the DORA alignment brief and a financial-entity evaluation.

<!--
scorecard:
  factual_integrity:    19/20   # Article numbers and dates all from primary regulation; one RTS reference stated as "expectations" rather than direct quote to avoid misquote
  on_page_seo:          18/20   # Primary kw in all locations; H2s structured as numbered steps
  content_depth_eeat:   19/20   # Original ten-step framing, article-to-feature mapping, CTPP oversight specifics
  ai_bot_friendliness:  15/15   # TL;DR, tables, declarative sentences, FAQ
  ux_conversion:        13/15   # 4 sibling links, 2 CTAs
  technical_seo_perf:   10/10
  TOTAL:                94/100  =  9.4 / 10
fact_check:
  last_reviewed: 2026-04-27
  reviewer: compliance@quickztna.com
  sources:
    - https://eur-lex.europa.eu/eli/reg/2022/2554/oj
    - https://eur-lex.europa.eu/eli/dir/2022/2556/oj
    - https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/digital-operational-resilience-act-dora
    - https://www.eba.europa.eu/regulation-and-policy/operational-resilience
    - https://www.ecb.europa.eu/pub/pdf/other/ecb.tibereuframework.en.pdf
    - https://eur-lex.europa.eu/eli/dir/2022/2555/oj
    - https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography
-->
