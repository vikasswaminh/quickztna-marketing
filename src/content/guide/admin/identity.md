---
title: "Identity & onboarding"
description: "Connect your identity provider (OIDC, Google, GitHub), provision users with SCIM, issue auth keys for headless onboarding, and approve and retire devices."
section: "admin"
order: 2
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA SSO SCIM auth keys"
faq:
  - q: "Which identity providers does QuickZTNA support?"
    a: "Any OIDC provider — Google Workspace, Microsoft Entra (Azure AD), Okta, Authentik, and generic OIDC — plus GitHub and Google sign-in. SAML login is disabled product-wide: an IdP that also speaks OIDC should be connected over OIDC, and a SAML-only provider is not supported today. Users authenticate against your IdP; QuickZTNA never stores passwords. SCIM 2.0 provisioning is available on both plans."
  - q: "How does SCIM authenticate, and what does it sync?"
    a: "SCIM uses an API key that carries the 'scim' scope as its Bearer token — not an ordinary auth key. With it, your IdP can list, create, update, and deactivate org members against /api/scim/Users (PATCH is supported; bulk and filter are not). Provision a user upstream and they can onboard; deprovision them and QuickZTNA removes them."
  - q: "What's the difference between an auth key and an API key?"
    a: "An auth key (tskey-auth-…) onboards devices headlessly — it's consumed by 'ztna up'. An API key authenticates automation against the REST API and can carry scopes such as 'scim'. Auth keys are reusable with an expiry and an optional ephemeral flag; both are created by admins and revoked in the dashboard."
  - q: "Why did auth-key generation return an email-verification error?"
    a: "Issuing provisioning commands is gated on the admin's email being verified. If you signed up via OAuth and your email wasn't marked verified, generation is blocked until it is. Verify the email on the account and retry."
  - q: "Do new devices need admin approval?"
    a: "Depending on your org's onboarding policy, a registered device may sit pending until an admin approves it. Auth-key onboarding can pre-approve fleet devices. A pending device that re-registers stays pending — it cannot self-approve."
---

Identity is the foundation of a Zero Trust deployment: every **user** authenticates against your identity provider, and every **device** carries its own cryptographic identity (a node key). QuickZTNA never stores user passwords. This page covers connecting your IdP, provisioning with SCIM, onboarding devices with auth keys, and the device lifecycle.

## 1. What it is

- **User identity** comes from your IdP via OIDC (SAML login is disabled); QuickZTNA issues a short-lived signed session (ES256 JWT, `iss: quickztna`, `aud: quickztna-api`) after a successful sign-in.
- **Device identity** is a per-device node key minted at registration; the device proves itself with it on every server call (posture, heartbeat, ACL probe).
- **SCIM 2.0** keeps users/groups in lockstep with your IdP automatically — included on both plans.
- **Auth keys** onboard servers, containers, and fleets without a browser.

## 2. How it works

```
  Person          ztna login --sso → IdP (OIDC) → ES256 JWT session
  Device          ztna up → register → node_key (per-device identity)
  Automation      API key (Bearer) → REST API   [scope: scim, terraform, …]
  Headless fleet  auth key (tskey-auth-…) → ztna up consumes it → device joins
  IdP lifecycle   SCIM (API key w/ 'scim' scope) → /api/scim/Users → members synced
```

## 3. Connect your identity provider

QuickZTNA authenticates users against your IdP. Supported: **OIDC** (Google Workspace, Microsoft Entra/Azure AD, Okta, Authentik, generic OIDC) and **GitHub**/**Google** sign-in. **SAML login is disabled product-wide** — IdPs that also speak OIDC should be connected over OIDC; SAML-only providers are not supported today for quick starts. Per-provider setup (redirect URIs, client IDs, claim mapping) is in the [SSO integrations doc](/docs/integrations/). Users sign in with:

```bash
ztna login --sso <org-slug>     # OIDC via browser
ztna login --google             # Google
ztna login --github             # GitHub
```

Multiple IdPs can be active (e.g. employees vs contractors from different sources).

## 4. SCIM provisioning

SCIM 2.0 automates user lifecycle on both plans. It authenticates with an **API key that has the `scim` scope** as its Bearer token (an ordinary auth key won't work). Point your IdP's SCIM connector at:

- **Base URL:** `https://login.quickztna.com/api/scim`
- **ServiceProviderConfig:** `GET /api/scim/ServiceProviderConfig` (no auth) — advertises PATCH supported; bulk and filter not supported.
- **Users:** `GET/POST/PATCH /api/scim/Users`

Provision a user upstream and they can onboard; deactivate them in your IdP and QuickZTNA removes them and their access. Without SCIM, group membership is derived from OIDC claims at each sign-in.

## 5. Auth keys (headless & fleet onboarding)

Interactive SSO is for people; **auth keys** are for servers, containers, and rollouts. An admin generates one (the email-verified gate applies), with an **expiry** (default 7 days), an optional **ephemeral** flag (for short-lived nodes like CI runners), and optional **tags** baked into every device that joins with it. The key is shown once.

**Generate provisioning commands** (`POST /api/provisioning`) — returns the key plus ready-to-paste install commands:

```bash
curl -s https://login.quickztna.com/api/provisioning -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"generate_commands","org_id":"'"$ORG"'","machine_name":"prod-db-01",
       "tags":["tag:prod","tag:db"],"expiry_days":7,"ephemeral":false}'
# → { auth_key:"tskey-auth-…", auth_key_prefix:"tskey-auth-xxxxxxxx…",
#     expires_in_days:7, commands:{ linux, windows, macos, npm, docker } }
```

Use the key non-interactively:

```bash
sudo ztna up --auth-key tskey-auth-xxx --hostname prod-db-01 --advertise-tags tag:prod,tag:db
# or via the installer:
curl -fsSL https://login.quickztna.com/install.sh | ZTNA_AUTH_KEY=tskey-auth-xxx sh
$env:ZTNA_AUTH_KEY="tskey-auth-xxx"; irm https://login.quickztna.com/install.ps1 | iex
```

List live keys with `list_provisioning_keys` (or `ztna auth-keys list`); revoke in the dashboard. Revoking a leaked key blocks new onboards but doesn't disturb devices that already hold their own identity.

## 6. Device approval & lifecycle

Depending on onboarding policy, a newly-registered device may sit **pending** until an admin approves it (a pending device re-registering stays pending — it can't self-approve). Manage the fleet from **Devices** (or `ztna machines list` for a read view), backed by `/api/machine-admin`:

- **Approve / reject** pending devices.
- **Quarantine** a suspicious device — listed but cut off (`action: quarantine`).
- **Lock / wipe** a lost device (`lock_device`, `wipe_device`).
- **Remove** a device — dropped within seconds, key revoked centrally; even with the key on disk it cannot reconnect.

For offboarding, remove the **user** (revokes all their devices at once), or deprovision in your IdP via SCIM and QuickZTNA does it automatically.

## 7. Configuration reference

| Thing | Field / value | Notes |
| --- | --- | --- |
| Auth-key expiry | `expiry_days` (default 7) | Key-level expiry; device identities outlive it |
| Auth-key reuse | reusable | Provisioning keys are reusable for fleet rollout |
| Auth-key ephemeral | `ephemeral` boolean | For short-lived nodes |
| Auth-key tags | `tags: ["tag:…"]` | Applied to every joining device |
| API key scope | `scim`, `terraform`, … | SCIM requires the `scim` scope |
| Device status | `pending`, `online`, `quarantined`, … | Drives ACL gating |

## 8. Enforcement & verification

- **Confirm SSO** by signing in with `ztna login --sso <slug>` and checking the session is issued.
- **Confirm SCIM** with `GET /api/scim/ServiceProviderConfig` (open) and an authenticated `GET /api/scim/Users` using the scoped API key.
- **Confirm onboarding** by watching a device move from pending → online (or join pre-approved via auth key).

## 9. Limits & honest scope

- **Managed cloud only** — QuickZTNA is a hosted service; self-hosting is not offered.
- **No mobile client** — onboarding is Linux, macOS, and Windows.
- **SCIM is paid-plan** and needs an API key with the `scim` scope; bulk and filter SCIM operations are not supported.
- **Auth-key generation requires a verified admin email.**

## 10. Audit events & troubleshooting

Audit: `provisioning.commands_generated` (auth-key issued), SCIM member changes, and device `machine.approved` / `quarantine` / lock / wipe events — all on [Observability](/guide/admin/observability/).

- **SCIM 401** → token isn't an API key with the `scim` scope.
- **Auth-key gen blocked** → admin email not verified; verify and retry.
- **Device stuck pending** → approve it in Devices; it can't self-promote.
- **`403 FEATURE_GATED` on SCIM** → SCIM isn't in your plan; see [Plans & billing](/guide/admin/billing/).

## Next

- [Access control](/guide/admin/access-control/) — decide what approved users and devices reach.
- [SSO integrations](/docs/integrations/) — per-provider setup details.
