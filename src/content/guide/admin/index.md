---
title: "QuickZTNA Admin Guide"
description: "Run a QuickZTNA organization: SSO and SCIM, auth keys, device approval, ACL and posture policies, the workforce-security features, audit, and billing."
section: "admin"
order: 1
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA admin guide"
faq:
  - q: "What's the difference between the user guide and the admin guide?"
    a: "The user guide covers operating a device — install, connect, troubleshoot. The admin guide covers running the organization — connecting your identity provider, issuing auth keys, approving devices, writing access and posture policies, and configuring the workforce-security and audit features. Most admin tasks are done in the dashboard; the ztna CLI and REST API cover the same surface for automation."
  - q: "Do admin tasks require the CLI?"
    a: "No. Everything is in the admin dashboard. The CLI (ztna acl, ztna machines, ztna auth-keys, ztna posture, etc.) gives read/inspection access and a few actions for scripting; the REST API is the full programmatic surface the dashboard itself uses."
---

This is the operator's manual for **running a QuickZTNA organization** — the work that happens in the admin dashboard, not on an individual device. If you're setting up a device, start with the [user guide](/guide/); if you're scripting, the [CLI reference](/docs/cli/) and [REST API](/docs/api/) are the contract.

QuickZTNA is a managed cloud service. You administer your organization through the dashboard at [login.quickztna.com](https://login.quickztna.com); the `ztna` CLI and the REST API expose the same surface for inspection and automation.

## The admin's job, in four parts

1. **Identity & onboarding** — connect your identity provider, decide how devices join (interactive SSO or auth keys), and approve/retire devices. See [Identity & onboarding](/guide/admin/identity/).
2. **Access control** — decide who can reach what with ACL rules, require a device security baseline with posture, and approve subnet routes and exit nodes. See [Access control](/guide/admin/access-control/).
3. **Workforce security** — the optional layer on top of the mesh: DLP file scanning, remote shell/desktop, software inventory, user-risk scoring, and the CASB approval workflow. See [Workforce security](/guide/admin/workforce/).
4. **Observability & billing** — audit logs, compliance reports, threat intelligence, client metrics, the secrets vault, and plan/billing management. See [Observability](/guide/admin/observability/) and [Plans & billing](/guide/admin/billing/).

## Plans at a glance

QuickZTNA's Free plan covers **100 devices and 3 users, forever**, including the WireGuard mesh, MagicDNS, ABAC policies, device posture, DNS filtering, the AI assistant, and remote SSH. Paid plans add more users, unlimited devices, SCIM provisioning, continuous posture, workforce analytics, DLP, CASB, and remote desktop. Full breakdown on [Plans & billing](/guide/admin/billing/) and the [pricing page](/pricing/).

## A note on what's shipped

This guide describes what the product does **today**. Where a capability is on the roadmap rather than shipped (for example post-quantum key exchange, or self-hosting), it's marked as such — the data plane today is classical WireGuard, and QuickZTNA is managed cloud only. If you find a gap between this guide and the product, that's a docs bug: tell us at [support@quickztna.com](mailto:support@quickztna.com).

## Where to go next

- [Identity & onboarding](/guide/admin/identity/) — SSO, SCIM, auth keys, device approval.
- [Access control](/guide/admin/access-control/) — ACLs, posture, routes, exit nodes.
- [Workforce security](/guide/admin/workforce/) — DLP, remote access, inventory, user-risk, CASB.
- [Observability](/guide/admin/observability/) — audit, compliance, threat, metrics, secrets.
- [Plans & billing](/guide/admin/billing/) — plans, gates, billing.
