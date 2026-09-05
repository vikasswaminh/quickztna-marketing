---
title: "QuickZTNA Admin Guide"
description: "Run a QuickZTNA organization: SSO and SCIM, auth keys, device approval, ACL and posture policies, access governance, audit, and billing."
section: "admin"
order: 1
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA admin guide"
faq:
  - q: "What's the difference between the user guide and the admin guide?"
    a: "The user guide covers operating a device — install, connect, troubleshoot. The admin guide covers running the organization — connecting your identity provider, issuing auth keys, approving devices, writing access and posture policies, and configuring access governance and the audit surface. Each feature has its own deep-dive page here with architecture, configuration, worked REST API/CLI examples, enforcement, limits, and audit events."
  - q: "Do admin tasks require the CLI?"
    a: "No. Everything is in the admin dashboard. The CLI (ztna acl, ztna machines, ztna auth-keys, ztna posture, etc.) gives read/inspection access and a few actions for scripting; the REST API is the full programmatic surface the dashboard itself uses, and every feature page shows the exact calls."
  - q: "How do I know what's actually shipped versus roadmap?"
    a: "Each page is explicit about scope and limits. Where a capability is narrower than common shorthand implies — 'DLP' is file-hash malware detection only with no content inspection, posture signals are self-reported, and PQC, CASB, workforce analytics and self-hosting do not exist at all — the page says so plainly. If you find a gap between a page and the product, that's a docs bug; tell us at support@quickztna.com."
---

This is the operator's manual for **running a QuickZTNA organization** — the work that happens in the admin dashboard, not on an individual device. If you're setting up a device, start with the [user guide](/guide/); if you're scripting, the [CLI reference](/docs/cli/) and [REST API](/docs/api/) are the contract.

QuickZTNA is a managed cloud service. You administer your organization through the dashboard at [login.quickztna.com](https://login.quickztna.com); the `ztna` CLI and the REST API expose the same surface for inspection and automation. **Every feature below has its own deep-dive page** with a how-it-works diagram, enable steps, worked API/CLI examples, a configuration reference, enforcement and verification, honest limits, and the audit events it emits.

## Identity & access

- **[Identity & onboarding](/guide/admin/identity/)** — connect OIDC/SAML/Google/GitHub, provision with SCIM, issue auth keys, approve and retire devices.
- **[Access control: ACLs & ABAC](/guide/admin/access-control/)** — priority-ordered rules over users/tags/groups, ABAC conditions, threat-intel deny, subnet routes and exit nodes.
- **[Device posture & compliance](/guide/admin/device-posture/)** — require a security baseline (disk encryption, firewall, AV, patch age) in enforce/monitor/disabled modes, with auto-quarantine.

## Network security



## Endpoint security

- **[Security overview](/guide/admin/workforce/)** — the map of the endpoint-security layer and what ships today.
- **[Malware detection (file-hash)](/guide/admin/dlp/)** — agents report SHA-256 file hashes; confirmed-malicious hits are recorded and can quarantine the device.

- **[Remote shell access](/guide/admin/remote-access/)** — consent-aware shell over the mesh, included on every plan.

## Operate


- **[Observability: audit, compliance, metrics](/guide/admin/observability/)** — audit log and SIEM export, compliance drift + signed reports, threat intel, Prometheus metrics.
- **[Plans & billing](/guide/admin/billing/)** — the two tiers, what's included (full feature parity), how seat + device limits are enforced, and billing.

## Plans at a glance

QuickZTNA's Free plan covers **5 users and up to 100 devices, forever**, with **every feature included** — the WireGuard mesh, MagicDNS, ABAC policies, device posture, JIT access, access reviews, remote SSH, SCIM, and compliance reports. Business ($10 per user / month) adds only scale: unlimited users (billed per seat) and a 10,000-device ceiling — the same features. Full breakdown on [Plans & billing](/guide/admin/billing/) and the [pricing page](/pricing/).

## A note on what's shipped

This guide describes what the product does **today**. Where a capability does not exist, it is said plainly rather than deferred to a roadmap: the data plane is classical WireGuard with no post-quantum key exchange, and QuickZTNA is managed cloud only with no self-hosting.
