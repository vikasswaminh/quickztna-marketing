---
title: "Plans & billing"
description: "QuickZTNA plans and what each one gates, the 60-day Business trial, how plan enforcement works, and billing via Razorpay or custom invoicing."
section: "admin"
order: 6
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA plans billing"
faq:
  - q: "Is the Free plan really free forever?"
    a: "Yes — 100 devices and 3 users, no trial timer, no credit card. WireGuard mesh, MagicDNS, ABAC policies, device posture (at-connect), DNS filtering, the AI assistant, and remote SSH are all on Free. You upgrade only for more users, unlimited devices, or paid features like SCIM, continuous posture, DLP, CASB, or remote desktop."
  - q: "Do platform superadmins bypass plan gates?"
    a: "No. Plan gates are enforced at the handler level. A superadmin assisting a Free-tier org still hits the feature gate on paid endpoints — the gating is intentional and consistent."
---

This page covers the plan tiers, what each gates, and how billing works. For current prices and the full feature matrix, see the [pricing page](/pricing/) — this page focuses on the admin's view.

## The tiers

- **Free** — 100 devices and 3 users, forever. WireGuard mesh, MagicDNS, ABAC policies, device posture (at connect), DNS filtering, the AI assistant, and **remote SSH** are included.
- **Business** — per-user pricing with **unlimited devices**, a **60-day free trial** (no card). Adds SCIM provisioning, continuous device posture, workforce analytics, DLP, CASB, remote desktop, and longer audit retention.
- **Workforce** — custom, for larger / regulated deployments; adds the deepest workforce-security and retention options.

(Exact prices and limits change — the [pricing page](/pricing/) is the source of truth.)

## How the trial works

The Business trial runs 60 days with all Business features and no credit card. At the end, the org auto-downgrades to Free (via the expire-trials job); no data is deleted, paid features simply gate down. You can extend a trial through sales if you need more runway for a pilot.

## How plan enforcement works

Features are gated server-side per organization. The gate is checked on the relevant API handlers, so the enforcement is consistent across the dashboard, CLI, and API — and **superadmins do not bypass it** (a superadmin helping a Free-tier org still hits the gate on paid endpoints). Downgrades take effect immediately and are non-destructive: downgrade then re-upgrade and everything resumes where it left off.

## Billing

Billing is handled via **Razorpay**, with **custom invoicing** available for larger contracts. Manage your subscription from the dashboard's billing area; changes apply from the billing page immediately.

## Next

- [Pricing page](/pricing/) — current prices and the full feature matrix.
- [Admin guide home](/guide/admin/) — the rest of the administration topics.
