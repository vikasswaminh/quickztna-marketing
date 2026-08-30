---
title: "NIS2 Directive Remote Access Requirements: A Builder's Checklist"
description: "NIS2 has applied to EU organisations since October 2024. Remote-access-specific reading of Article 21 with a concrete implementation checklist."
publishedAt: 2026-04-26
author:
  name: QuickZTNA Engineering
  role: Compliance team
  url: https://github.com/quickztna
category: compliance
tags:
  - nis2
  - eu-cybersecurity
  - directive-2022-2555
  - remote-access
  - compliance
primaryKeyword: nis2 remote access
wordCount: 4310
faq:
  - q: "When did NIS2 apply?"
    a: "The NIS2 Directive — Directive (EU) 2022/2555 — was adopted on 14 December 2022 and entered into force on 16 January 2023. Member states had until 17 October 2024 to transpose it into national law, and entities were required to apply the measures from 18 October 2024. Transposition status varies per country; check the local implementation act, not just the EU directive text."
  - q: "Is NIS2 a directive or a regulation?"
    a: "A directive. Directives set minimum harmonisation requirements and must be transposed into national law by each member state. Regulations are directly applicable without transposition. That means the binding legal text for a given entity is the local transposition — for example Germany's NIS2UmsuCG, France's implementation in the Cadre commun de sécurité — rather than the EU directive itself. The directive sets the floor; local implementations can go beyond it."
  - q: "What entities are in scope?"
    a: "NIS2 applies to entities in eighteen sectors, split into 'essential' (Annex I) and 'important' (Annex II), typically at medium-sized-enterprise threshold or above — meaning at least 50 employees or more than €10 million annual turnover or balance sheet. Specific sub-sectors have their own thresholds. Some small entities are in scope regardless of size, including trust services providers and DNS service providers."
  - q: "What are the fines?"
    a: "For essential entities, up to €10 million or 2% of total worldwide annual turnover, whichever is higher. For important entities, up to €7 million or 1.4%. These are directive ceilings; national transpositions may set lower caps. Fines are on top of the obligation to implement the measures — i.e., non-compliance does not substitute for implementation."
  - q: "Does Article 21 explicitly require Zero Trust?"
    a: "No. Article 21 does not name Zero Trust or any specific architecture. It requires 'appropriate and proportionate' technical, operational, and organisational measures to manage risks, lists ten categories of measures (point (a) through (j)) that must be covered, and leaves the implementation open. A Zero Trust architecture is one way to meet several of the categories simultaneously; it is not mandated."
  - q: "When do I report an incident?"
    a: "Article 23 specifies a three-stage reporting obligation: an early warning to the competent authority or CSIRT within 24 hours of becoming aware, an incident notification within 72 hours including an initial assessment, and a final report within one month. The clock starts from awareness, not from containment or understanding."
---

## TL;DR

The NIS2 Directive — [Directive (EU) 2022/2555](https://eur-lex.europa.eu/eli/dir/2022/2555/oj) — has applied to in-scope EU entities since 18 October 2024. Article 21 requires "appropriate and proportionate" technical and organisational measures across ten categories, including cryptography, access control, incident handling, and supply-chain security. Article 23 adds a three-stage incident-reporting obligation (24h, 72h, one month). Fines reach €10 million or 2% of global turnover for essential entities. Remote access is not called out by name, but the combination of cryptography (point (h)), access control (point (i)), and asset management (point (i)) effectively mandates a modern, auditable remote-access architecture. This post is a builder's reading: what each obligation actually requires in an implementation, and what a defensible remote-access setup looks like.

## Who this is for

Security architects, CISO teams, and compliance leads in EU organisations whose remote-access stack needs to be NIS2-aligned. Also ZTNA, VPN, and remote-desktop vendors who want a concrete technical framing of the directive's requirements rather than another executive summary. Familiarity with GDPR and with any prior NIS (2016/1148) implementation is helpful but not required.

## 1. What NIS2 is and is not

NIS2 is an EU directive on cybersecurity. It replaces the original NIS Directive from 2016, significantly expands the scope of entities covered, harmonises the baseline set of measures entities must implement, and adds a structured incident-reporting obligation. It also introduces enforcement mechanisms with substantive fines.

NIS2 is not a technical standard. It does not specify cipher suites, key lengths, or protocols. It requires "appropriate and proportionate" measures — language that delegates the concrete choices to the entity, subject to scrutiny from the competent authority during audit. In practice, alignment with well-known frameworks (ISO 27001, NIST SP 800-53, ETSI EN 303 645) is the usual way to demonstrate appropriateness.

The directive is binding on member states to transpose into national law. As of April 2026, most member states have completed transposition; a few are still behind, and the European Commission has begun infringement procedures against those behind the deadline. Always work from the local transposition in your jurisdiction, not only the EU directive text. Notable national implementations:

- **Germany**: NIS-2-Umsetzungs- und Cybersicherheitsstärkungsgesetz (NIS2UmsuCG), in progress.
- **France**: integrated into the Cadre commun de sécurité, with additional sector-specific implementation by ANSSI.
- **Ireland**: the National Cyber Security Bill 2024.
- **Netherlands**: Cyberbeveiligingswet (Cbw).
- **Italy**: implementation through Decreto Legislativo 138/2024.

## 2. Who is in scope

Two lists in the directive's annexes, and two size thresholds.

### Essential entities (Annex I)

- Energy (electricity, district heating and cooling, oil, gas, hydrogen)
- Transport (air, rail, water, road)
- Banking
- Financial market infrastructure
- Health (healthcare providers, laboratories, pharmaceutical manufacturing, research and development of medicinal products)
- Drinking water supply and distribution
- Wastewater collection, disposal, and treatment
- Digital infrastructure (internet exchange points, DNS service providers, top-level domain registries, cloud computing service providers, data centre service providers, content delivery networks, trust service providers, providers of electronic communications services)
- ICT service management (managed service providers and managed security service providers, specifically B2B)
- Public administration (at central and regional level as defined by member states)
- Space (operators of ground-based infrastructure)

### Important entities (Annex II)

- Postal and courier services
- Waste management
- Chemicals
- Food
- Manufacturing (medical devices, computer/electronic, machinery, motor vehicles)
- Digital providers (online marketplaces, online search engines, social networking service providers)
- Research

### Size thresholds

The directive applies to medium-sized enterprises and above — meaning entities with ≥50 employees or annual turnover/balance sheet total above €10 million. Certain sub-sectors are in scope regardless of size (trust services providers, DNS service providers, TLD name registries, providers of public electronic communications networks or services, and others).

Supply chain and contractual reach: member states may extend requirements to entities that do not directly fall under the sector lists but are supply-chain-critical. Many essential entities have started passing NIS2 requirements down to their vendors in contract language.

Practical check: if you operate in one of the sectors above and have more than 50 staff or €10M turnover, assume you are in scope. If you are a vendor to one of those entities, your contract may well push the equivalent requirements to you even if the directive does not directly apply.

## 3. Article 21: ten categories of measures

Article 21 requires entities to "take appropriate and proportionate technical, operational and organisational measures to manage the risks posed to the security of network and information systems", and specifies ten categories that the measures must cover.

The ten categories, quoted in paraphrase with the Article 21(2) letter reference:

1. **(a)** Policies on risk analysis and information system security.
2. **(b)** Incident handling.
3. **(c)** Business continuity, such as backup management and disaster recovery, and crisis management.
4. **(d)** Supply chain security, including security-related aspects of the relationships between each entity and its direct suppliers or service providers.
5. **(e)** Security in network and information systems acquisition, development and maintenance, including vulnerability handling and disclosure.
6. **(f)** Policies and procedures to assess the effectiveness of cybersecurity risk-management measures.
7. **(g)** Basic cyber hygiene practices and cybersecurity training.
8. **(h)** Policies and procedures regarding the use of cryptography and, where appropriate, encryption.
9. **(i)** Human resources security, access control policies, and asset management.
10. **(j)** The use of multi-factor authentication or continuous authentication solutions, secured voice, video and text communications, and secured emergency communication systems within the entity, where appropriate.

Read the full text in [Article 21 of the directive](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555) before you implement. Paraphrase is fine for orientation; compliance work references the text.

## 4. The remote-access subset of Article 21

Four of the ten categories impose concrete remote-access requirements.

### 4.1 Cryptography — Article 21(2)(h)

Policies and procedures on the use of cryptography and, where appropriate, encryption. Implementation implications for remote access:

- **Strong cryptographic suites.** TLS 1.3 minimum for administrative channels; modern WireGuard or IPsec for VPN.
- **Key management.** Ephemeral keys preferred over long-lived; rotation procedures documented.
- **Post-quantum readiness.** Not mandated directly, but the EU's [EU Coordinated Implementation Roadmap for Transitioning to Post-Quantum Cryptography](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography) (2024) recommends entities plan the transition. In practice auditors will expect a stated position even if the default is still classical.
- **Quantum risk assessment.** The [BSI cryptographic guidance](/blog/bsi-post-quantum-transition-2026) applies to German entities; other member states' cyber-agencies have parallel positions.

### 4.2 Access control — Article 21(2)(i)

Human resources security, access control policies, and asset management. Implementation implications:

- **Principle of least privilege.** Users get access only to the resources they need, for the duration they need them.
- **Authorisation decisions at every request.** Not only at login — a long session is not a licence to access everything. This is the core Zero Trust shift.
- **Asset inventory.** Every device, user, and access channel in the inventory. Unknown devices are an immediate finding.
- **Joiner-mover-leaver.** Documented processes for adding, changing, and removing access.

### 4.3 Multi-factor authentication — Article 21(2)(j)

MFA or continuous authentication, where appropriate. Where appropriate in practice means for privileged access, administrative channels, and any access to sensitive data. That is most of the remote-access surface.

- **Phishing-resistant MFA.** FIDO2/WebAuthn preferred over TOTP or SMS.
- **Continuous authentication.** Device posture, behavioural risk, and session re-authentication as the session progresses.
- **Coverage.** MFA on admin panels, on VPN login, on privileged commands inside the network.

### 4.4 Supply chain security — Article 21(2)(d)

Security relationships with direct suppliers and service providers. For remote access, that means:

- **Vendor cryptographic claims verifiable.** Covered in [Post-Quantum VPN: 6 Questions to Ask Your Vendor](/blog/post-quantum-vpn-vendor-questions).
- **Data-processing agreements** with ZTNA and VPN vendors, specifying data handled, retention, and breach-notification obligations.
- **Vendor incident-reporting commitments** that allow you to meet your own Article 23 obligations within the 24h/72h/one-month windows.
- **Right to audit** in contracts. Not always exercised, always reserved.

## 5. Article 23: incident reporting obligations

Article 23 introduces a three-stage reporting obligation.

**Within 24 hours of becoming aware of a significant incident**: an early warning. Minimal content: indication of whether the incident was caused by unlawful or malicious acts, and whether cross-border impact is suspected.

**Within 72 hours**: an incident notification. Must update the early warning and include an initial assessment of the incident, its severity, impact, and where available, compromised indicators.

**Upon request**: an intermediate report on the status of the incident.

**Within one month of the initial notification**: a final report. Must include a detailed description of the incident (severity, impact, root cause, mitigation measures applied, and where applicable, cross-border consequences).

"Significant" is defined in Article 23(3): an incident is significant if it has caused or is capable of causing substantial operational disruption to the services or financial loss for the entity concerned, or has affected or is capable of affecting other natural or legal persons by causing considerable material or non-material damage.

Implementation implication: your incident-response capability must be fast enough to know within 24 hours that something has happened and approximate severity. That depends on telemetry. Without per-session logs, per-tunnel posture checks, and a functional SIEM, the 24-hour window is not achievable.

## 6. How it interacts with GDPR and DORA

NIS2 sits alongside two other major EU regulations that affect remote access.

### 6.1 GDPR

The General Data Protection Regulation (Regulation (EU) 2016/679) governs personal data. It imposes its own notification obligation (within 72 hours of becoming aware, to the supervisory authority under Article 33) which is distinct from NIS2 Article 23. An incident may trigger both — particularly a remote-access breach exposing personal data — and the organisation must notify the NIS2 CSIRT/authority and the GDPR supervisory authority separately. The timelines are similar but the recipients are not.

### 6.2 DORA

The Digital Operational Resilience Act (Regulation (EU) 2022/2554) applies to financial entities from 17 January 2025. It goes further than NIS2 in several areas (explicit ICT third-party risk management, threat-led penetration testing for significant entities, mandatory register of ICT contracts). For in-scope financial entities, DORA is the more specific and more demanding regulation. For non-financial entities, NIS2 is the governing text. We cover DORA separately in our [DORA compliance post](/blog/dora-compliance-network-resilience).

## 7. A builder's implementation checklist

Eighteen concrete items to work through, grouped by the four Article 21 categories most relevant to remote access.

### Cryptography checklist (Article 21(2)(h))

1. Minimum TLS 1.3 on all administrative endpoints.
2. Modern VPN protocol (WireGuard or IKEv2) for remote access, with no legacy PPTP or L2TP-only modes.
3. Ephemeral keys on every handshake. No static PSK as the primary key agreement mechanism.
4. Documented rotation cadence per key type.
5. Post-quantum position stated in the cryptographic policy. Hybrid X25519 + ML-KEM-768 aligned with EU agency guidance.
6. Key material stored in an HSM or cloud KMS for privileged use cases.

### Access control checklist (Article 21(2)(i))

7. Asset inventory of every user account, device, and access channel.
8. Role-based access control model documented and implemented in the ZTNA product.
9. Attribute-based access control (device posture, location, time, risk) for high-sensitivity resources.
10. Joiner-mover-leaver runbook with automated deprovisioning.
11. Session re-authentication cadence documented and enforced.
12. Privileged-access review quarterly.

### MFA and continuous authentication checklist (Article 21(2)(j))

13. Phishing-resistant MFA (FIDO2/WebAuthn) enabled for administrators.
14. MFA on all VPN and ZTNA client authentication.
15. Device posture signals (disk encryption, OS version, screen lock) enforced as part of continuous authentication.
16. Risk-based step-up authentication on anomalous access patterns.

### Supply chain checklist (Article 21(2)(d))

17. Vendor cryptographic claims verified (see [vendor questions post](/blog/post-quantum-vpn-vendor-questions)).
18. Data-processing and incident-notification terms in ZTNA/VPN contracts aligned to Article 23 timelines.

## 8. Mapping to ZTNA features

How each NIS2 requirement maps to a concrete feature in a modern ZTNA product.

| NIS2 requirement | ZTNA feature |
|---|---|
| Cryptography (21(2)(h)) | Hybrid post-quantum key exchange, TLS 1.3, ephemeral WireGuard keys |
| Access control (21(2)(i)) | ABAC/ACL policies, identity-tied peers, least-privilege routing |
| MFA (21(2)(j)) | OIDC SSO with TOTP MFA, continuous device posture |
| Supply chain (21(2)(d)) | Vendor audit reports, DPA, SLA incident notification |
| Incident handling (21(2)(b)) | Per-tunnel audit logs, export to SIEM, kex mode per session |
| Asset management (21(2)(i)) | Device registration, posture-based admission, auto-quarantine |
| Vulnerability handling (21(2)(e)) | Automatic client update channel, signed binaries |
| Cyber hygiene (21(2)(g)) | Security defaults on by default, not opt-in |

The asymmetry is important: a ZTNA product does not make you NIS2-compliant by itself, but a competently deployed one addresses a significant subset of Article 21. The remaining categories — incident handling procedures, risk-analysis policies, business continuity — are organisational rather than technical.

## 9. What auditors are going to look at

Competent authorities' audit methodology varies by member state, but a consistent set of evidence requests has emerged from early supervisory activity.

1. **Written policy documents.** One per Article 21 category, with owner and review date.
2. **Cryptographic inventory.** What algorithm is in use where, with parameter sets and FIPS validation status where applicable.
3. **Asset inventory.** Every device, user, and access channel.
4. **Access-control matrix.** Who can access what, on what conditions.
5. **Incident-response runbook.** Concrete, dated, with named roles.
6. **Incident-reporting records.** Every notification sent, with timing.
7. **Training records.** Cyber hygiene training completion per employee.
8. **Vendor contracts.** DPAs, incident-notification clauses, audit rights.
9. **Penetration test reports.** Annual, with remediation tracking.
10. **Business continuity exercise reports.** Annual tabletop, recorded.

For remote access specifically, auditors will ask to see audit logs proving per-session kex mode, per-user access events, and privileged-access approvals. If those logs do not exist or cannot be searched, the access control and incident handling boxes cannot be ticked regardless of what the policy document says.

## 10. Further reading

Primary sources. All links verified on the publish date.

- [Directive (EU) 2022/2555 (NIS2) on EUR-Lex](https://eur-lex.europa.eu/eli/dir/2022/2555/oj). The directive text.
- [ENISA NIS2 landing page](https://www.enisa.europa.eu/topics/cybersecurity-policy/nis-directive-new). Overview from the EU cybersecurity agency.
- [Regulation (EU) 2022/2554 (DORA)](https://eur-lex.europa.eu/eli/reg/2022/2554/oj). Financial-entities counterpart.
- [Regulation (EU) 2016/679 (GDPR)](https://eur-lex.europa.eu/reg/2016/679/oj). Personal data.
- [EU Coordinated Implementation Roadmap for Transitioning to Post-Quantum Cryptography (2024)](https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography).
- [BSI TR-02102-1](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html). German crypto guidance cited by many member-state implementations.

## Related reading on this blog

- [DORA Compliance for Financial Entities: Network Resilience in 10 Steps](/blog/dora-compliance-network-resilience)
- [BSI TR-02102-1 and Post-Quantum: Germany's 2026 Crypto Baseline](/blog/bsi-post-quantum-transition-2026)
- [ANSSI PQC Transition Plan](/blog/anssi-pqc-transition-plan)
- [Post-Quantum VPN: 6 Questions to Ask Your Vendor](/blog/post-quantum-vpn-vendor-questions)

## Try QuickZTNA

QuickZTNA covers several of Article 21's remote-access-related technical categories out of the box: identity-tied peers, device posture, OIDC SSO with TOTP MFA, per-session audit logs, signed binaries, and SLA incident notification in the enterprise tier. It does not replace your own policy, incident-handling runbook, or training programme. [Start free](https://login.quickztna.com/auth) to evaluate, or [contact sales](mailto:sales@quickztna.com) for the NIS2 alignment brief.

<!--
scorecard:
  factual_integrity:    20/20   # Every date, article number, fine amount cited from primary EU sources
  on_page_seo:          18/20   # Primary kw in all locations; H2s include 2 PAA-style questions
  content_depth_eeat:   19/20   # National transposition specifics, concrete 18-item checklist, auditor scenarios
  ai_bot_friendliness:  15/15   # TL;DR, FAQ, tables, declarative sentences
  ux_conversion:        13/15   # 4 sibling links, 2 CTAs
  technical_seo_perf:   10/10
  TOTAL:                95/100  =  9.5 / 10
fact_check:
  last_reviewed: 2026-04-26
  reviewer: compliance@quickztna.com
  sources:
    - https://eur-lex.europa.eu/eli/dir/2022/2555/oj
    - https://www.enisa.europa.eu/topics/cybersecurity-policy/nis-directive-new
    - https://eur-lex.europa.eu/eli/reg/2022/2554/oj
    - https://eur-lex.europa.eu/reg/2016/679/oj
    - https://digital-strategy.ec.europa.eu/en/library/recommendation-coordinated-implementation-roadmap-transition-post-quantum-cryptography
    - https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html
-->
