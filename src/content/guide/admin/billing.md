---
title: "Plans & billing"
description: "QuickZTNA plans and what each one gates, the 60-day Business trial, how plan enforcement works, and billing via Razorpay or custom invoicing."
section: "admin"
order: 13
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA plans billing"
faq:
  - q: "Is the Free plan really free forever?"
    a: "Yes — 100 devices and 3 users, no trial timer, no credit card. WireGuard mesh, MagicDNS, ABAC policies, device posture (at-connect), DNS filtering, the AI assistant, and remote SSH are all on Free. You upgrade only for more users, unlimited devices, or paid features like SCIM, continuous posture, DLP, CASB, or remote desktop."
  - q: "Do platform superadmins bypass plan gates?"
    a: "No. Plan gates are enforced at the handler level via requireFeature(). A superadmin assisting a Free-tier org still hits the feature gate on paid endpoints — the gating is intentional and consistent across dashboard, CLI, and API."
  - q: "How quickly does a plan change take effect?"
    a: "Feature entitlements are cached per org for 600 seconds, so a plan change is visible within a minute (the cache is also invalidated on subscription/plan_features writes). Downgrades are immediate and non-destructive: downgrade then re-upgrade and everything resumes."
  - q: "What happens to child organizations' plans?"
    a: "A child org with no subscription of its own inherits its parent's effective plan. So entitlements flow down an org group from the parent's billing automatically."
---

This page covers the plan tiers, exactly **how plan enforcement works**, and how billing is handled. For current prices and the full feature matrix, the [pricing page](/pricing/) is the source of truth — this page is the admin's mechanical view.

## 1. The tiers

- **Free** — 100 devices and 3 users, forever. WireGuard mesh, MagicDNS, ABAC policies, device posture (at connect), DNS filtering, the AI assistant, and **remote SSH** are included.
- **Business** — per-user pricing with **unlimited devices** and a **60-day free trial** (no card). Adds SCIM, continuous posture, workforce analytics, DLP, CASB, remote desktop, and longer audit retention.
- **Workforce** — custom, for larger / regulated deployments; the deepest workforce-security and retention options.

Exact prices and limits change — the [pricing page](/pricing/) is canonical.

## 2. How plan enforcement works

Every gated handler calls `requireFeature(db, org_id, '<feature>', request)`, which resolves the org's **effective plan** and checks the `plan_features` table:

```
  requireFeature(org, feature)
        │
        ▼
   billing_subscriptions → resolveEffectivePlan()
     trialing & not expired → trial plan
     trialing & expired     → free
     paid & period expired / inactive status → free
     (no subscription)      → inherit parent org's plan, else free
        │
        ▼
   plan_features WHERE plan = <effective> AND enabled = true
        │
   feature in list? ── yes → allowed (null)
                     └ no  → 403 FEATURE_GATED  "requires an upgraded plan"
        │
   result cached in Valkey (key features:<org_id>, 600s TTL)
```

The cache is shared with the dashboard's feature-check and invalidated when a subscription or `plan_features` row changes — so the dashboard, CLI, and API always agree.

## 3. Feature-flag reference

Each admin capability is gated by a named feature flag. Which plan includes which flag is defined in `plan_features` (and shown on [pricing](/pricing/)); the flags themselves are:

| Feature flag | Gates | Page |
| --- | --- | --- |
| `dns_filtering` | DNS threat/category filtering | [DNS filtering](/guide/admin/dns-filtering/) |
| `casb` | Shadow-IT discovery & app policy | [CASB](/guide/admin/casb/) |
| `dlp` | File-scan data-loss detection | [DLP](/guide/admin/dlp/) |
| `scim` | SCIM 2.0 provisioning | [Identity](/guide/admin/identity/) |
| `workforce_analytics` | Sessions, schedule, productivity, inventory | [Workforce analytics](/guide/admin/workforce-analytics/) |
| `user_risk_scoring` | Seven-factor user risk | [Workforce analytics](/guide/admin/workforce-analytics/) |
| `remote_shell` | Remote SSH/shell (enabled on all plans) | [Remote access](/guide/admin/remote-access/) |
| `remote_desktop` | WebRTC remote desktop | [Remote access](/guide/admin/remote-access/) |
| `secrets_vault` | Encrypted secrets vault | [Observability](/guide/admin/observability/) |
| `compliance_reports` | Drift evaluation + signed reports | [Observability](/guide/admin/observability/) |
| `nl_acl_builder`, `event_summarizer`, `incident_response`, `ai_chat`, `ai_actions` | AI Operator capabilities | [AI Operator](/guide/admin/ai-operator/) |

Posture, ACLs, and the mesh are part of the baseline and are not paid-gated (posture enforcement modes and continuous re-evaluation differ by plan).

## 4. How the trial works

The Business trial runs 60 days with all Business features and no credit card. At the end the org auto-downgrades to Free (via the expire-trials job); **no data is deleted** — paid features simply gate down. Extend a trial through sales if a pilot needs more runway.

## 5. Billing

Billing is handled via **Razorpay**, with **custom invoicing** for larger contracts. Manage your subscription from the dashboard's billing area (`/api/manage-subscription`); checkout is created via `/api/create-checkout`, and subscription state is reconciled by the Razorpay webhook. Changes apply immediately.

## 6. Verification & troubleshooting

- **A paid call returns `403 FEATURE_GATED`** → that feature isn't in the org's effective plan; upgrade, or check the trial hasn't expired.
- **Upgraded but still gated** → wait up to 600 s for the entitlement cache, or confirm the subscription `status` is `active`.
- **Child org missing features** → ensure the parent org's subscription carries them (children inherit).
- **Trial ended unexpectedly** → check `trial_ends_at`; the org falls back to Free automatically.

## 7. Next

- [Pricing page](/pricing/) — current prices and the full feature matrix.
- [Admin guide home](/guide/admin/) — the rest of the administration topics.
