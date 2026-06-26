---
title: "Plans & billing"
description: "QuickZTNA's two plans — Free and Business — with full feature parity, per-seat pricing, an org-wide device cap, and billing via Dodo Payments."
section: "admin"
order: 13
updatedAt: 2026-06-26
primaryKeyword: "QuickZTNA plans billing"
faq:
  - q: "Is the Free plan really free forever?"
    a: "Yes — up to 5 users and 100 devices, no trial timer, no credit card. Every feature is on Free: WireGuard mesh, MagicDNS, ABAC policies, device posture, DNS filtering, the AI assistant, remote SSH, DLP, CASB, SCIM, and remote desktop — the lot. You upgrade to Business only for more seats, never to unlock features."
  - q: "What's the difference between Free and Business?"
    a: "Scale, not features. Both plans include the entire platform (full parity). Free is capped at 5 users and 100 devices; Business is $10 per user / month with unlimited seats and a 10,000-device cap. Billing is per user — devices are never metered per seat."
  - q: "How quickly does a plan change take effect?"
    a: "Seat and device limits update on the next subscription/seat sync, and entitlements are cached per org for 600 seconds. Downgrades are non-destructive: nothing already registered is removed."
  - q: "What happens to child organizations' plans?"
    a: "A child org with no subscription of its own inherits its parent's effective plan, so entitlements flow down an org group from the parent's billing automatically."
---

This page covers the two plan tiers, how plan limits are enforced, and how billing is handled. For current prices and the full feature matrix, the [pricing page](/pricing/) is the source of truth — this page is the admin's mechanical view.

## 1. The tiers

QuickZTNA has **two plans with identical features** — you pay to scale, not to unlock.

- **Free** — up to **5 users** and **100 devices**, forever. Every feature is included: WireGuard mesh, MagicDNS, ABAC policies, device posture, DNS filtering, the AI assistant, remote SSH, DLP, CASB, SCIM, remote desktop, secrets vault, and compliance reports — the entire platform.
- **Business** — **$10 per user / month**, billed per seat. Unlimited users and a **10,000-device cap**. Same features as Free, plus priority email support. No trial and no card to start — you begin on Free and upgrade when you outgrow the seat limit.

Exact prices and limits can change — the [pricing page](/pricing/) is canonical.

## 2. How plan limits are enforced

Both plans are entitled to **every feature** (`plan_features` has all capabilities enabled for both Free and Business), so the difference is **scale**, enforced as two limits:

- **Seats (users)** — the billing meter. Business bills one seat per org member; seat count is reconciled to the payment provider when a member is added or removed.
- **Devices** — a single **org-wide cap** (100 on Free, 10,000 on Business), checked at machine registration. Devices are **not** metered per seat. When an org is at its cap, new device registration returns `QUOTA_EXCEEDED` until a slot is freed or the org upgrades.

Effective-plan resolution: an org with an active Business subscription is Business; otherwise (no subscription, cancelled, or billing period expired) it falls back to Free. An org with no subscription of its own inherits its parent org's effective plan. The result is cached in Valkey (`features:<org_id>`, 600 s TTL) and invalidated on subscription changes, so the dashboard, CLI, and API always agree.

## 3. Capabilities (on every plan)

Every capability below ships on **both** Free and Business — there are no paid-only feature flags:

| Capability | Page |
| --- | --- |
| DNS threat/category filtering | [DNS filtering](/guide/admin/dns-filtering/) |
| Shadow-IT discovery & app policy (CASB) | [CASB](/guide/admin/casb/) |
| File-scan data-loss detection (DLP) | [DLP](/guide/admin/dlp/) |
| SCIM 2.0 provisioning | [Identity](/guide/admin/identity/) |
| Workforce analytics (sessions, schedule, productivity, inventory) | [Workforce analytics](/guide/admin/workforce-analytics/) |
| Seven-factor user-risk scoring | [Workforce analytics](/guide/admin/workforce-analytics/) |
| Remote SSH/shell | [Remote access](/guide/admin/remote-access/) |
| WebRTC remote desktop | [Remote access](/guide/admin/remote-access/) |
| Encrypted secrets vault | [Observability](/guide/admin/observability/) |
| Drift evaluation + signed compliance reports | [Observability](/guide/admin/observability/) |
| AI Operator (NL ACL builder, event summarizer, security digest, AI chat, policy-drift) | [AI Operator](/guide/admin/ai-operator/) |

Posture, ACLs, and the mesh are part of the baseline on both plans.

## 4. Billing

Billing is handled by **Dodo Payments**, our **Merchant of Record** — Dodo processes the card and handles global tax and compliance — with **custom invoicing** available for larger contracts. Manage your subscription from the dashboard's billing area (`/api/manage-subscription`); checkout is created via `/api/create-checkout`, and subscription state is reconciled by the Dodo webhook. Changes apply immediately.

## 5. Verification & troubleshooting

- **New device registration returns `QUOTA_EXCEEDED`** → the org is at its device cap (100 on Free, 10,000 on Business). Free a slot or upgrade.
- **A seat change isn't reflected in billing** → seat count syncs to the provider on member add/remove; confirm the subscription `status` is `active`.
- **Upgraded but limits unchanged** → wait up to 600 s for the entitlement cache, or confirm the subscription `status` is `active`.
- **Child org missing seats/limits** → ensure the parent org's subscription carries them (children inherit the parent's effective plan).

## 6. Next

- [Pricing page](/pricing/) — current prices and the full feature matrix.
- [Admin guide home](/guide/admin/) — the rest of the administration topics.
