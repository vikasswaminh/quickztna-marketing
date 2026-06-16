---
title: "Identity & onboarding"
description: "Connect your identity provider (OIDC, SAML, Google, GitHub), provision users with SCIM, issue auth keys for headless onboarding, and approve and retire devices."
section: "admin"
order: 2
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA SSO SCIM auth keys"
faq:
  - q: "Which identity providers does QuickZTNA support?"
    a: "Any OIDC or SAML 2.0 provider — Google Workspace, Microsoft Entra (Azure AD), Okta, Authentik, and generic OIDC — plus GitHub and Google sign-in. Users authenticate against your IdP; QuickZTNA never stores passwords. SCIM 2.0 provisioning is available on paid plans."
  - q: "Do new devices need admin approval?"
    a: "It depends on your org's onboarding policy. Devices register, and depending on policy may sit in a pending state until an admin approves them in the dashboard. Auth-key onboarding can pre-approve fleet devices. A pending device re-registering stays pending — it can't self-approve."
---

Identity is the foundation of a Zero Trust deployment: every user is authenticated against your identity provider, and every device has its own cryptographic identity. This page covers connecting your IdP, provisioning users, onboarding devices with auth keys, and the device lifecycle.

## Connect your identity provider

QuickZTNA authenticates users against your IdP — it does not store passwords. Supported:

- **OIDC** — Google Workspace, Microsoft Entra (Azure AD), Okta, Authentik, and any standards-compliant OIDC provider.
- **SAML 2.0** — for enterprise IdPs that prefer SAML.
- **GitHub** and **Google** sign-in for quick starts.

Per-provider setup (redirect URIs, client IDs, claim mapping) is in the [SSO integrations doc](/docs/integrations/). Users then sign in with:

```bash
ztna login --sso <org-slug>     # OIDC/SAML via browser
ztna login --google             # Google
ztna login --github             # GitHub
```

Multiple IdPs can be active for organizations that use different identity sources for employees vs contractors.

## SCIM provisioning

On paid plans, **SCIM 2.0** keeps your user and group lists in sync with your IdP automatically. Provision a user upstream and they can onboard; deprovision them and QuickZTNA removes them and revokes their devices — no manual cleanup. Without SCIM, group membership comes from OIDC claims at sign-in.

## Auth keys (headless & fleet onboarding)

Interactive SSO is right for people; **auth keys** are right for servers, containers, and fleet rollouts. Create one in the dashboard (Settings → Keys) with:

- **Tags** applied to every device that uses the key (so devices are classified the moment they join).
- **Expiry** for the key itself (short for ad-hoc, longer for scheduled rollouts).
- **Single-use or multi-use** — single-use for production servers; multi-use for ephemeral fleets like CI runners.

The key is shown once. Use it non-interactively:

```bash
sudo ztna up --auth-key tskey-auth-xxx --hostname prod-db-01 --advertise-tags tag:prod,tag:db
# or via the installer / containers:
curl -fsSL https://login.quickztna.com/install.sh | ZTNA_AUTH_KEY=tskey-auth-xxx sh
```

Inspect keys from the CLI with `ztna auth-keys list`; create and revoke them in the dashboard (revoking a leaked key blocks new onboards but doesn't affect devices that already have their own identity).

## Device approval & lifecycle

Depending on your org's onboarding policy, a newly-registered device may sit in a **pending** state until an admin approves it in the dashboard. A pending device that re-registers stays pending — it cannot promote itself to approved.

Manage the fleet from **Devices** in the dashboard (or `ztna machines list` for a read view):

- **Approve / reject** pending devices.
- **Quarantine** a suspicious device (it stays listed but is cut off).
- **Remove** a device — it's dropped from the network within seconds and its key is revoked centrally; even with the key on disk it cannot reconnect.

For offboarding, remove the **user** (Settings → Members), which revokes all their devices at once — or, with SCIM, deprovision them in your IdP and QuickZTNA does it automatically. The [managing devices](/guide/managing-devices/) page covers tags, expiry, and bulk operations in depth.

## Next

- [Access control](/guide/admin/access-control/) — decide what approved users and devices can reach.
- [SSO integrations](/docs/integrations/) — per-provider setup details.
