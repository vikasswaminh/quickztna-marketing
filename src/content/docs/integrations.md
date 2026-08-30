---
title: "SSO integrations: OIDC, Google, GitHub, Microsoft, and more"
description: "Set up QuickZTNA SSO with any identity provider. Configure Google Workspace, Microsoft Entra, GitHub, Okta, Authentik, plus OIDC, SAML, and SCIM."
section: "integrations"
order: 6
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA SSO integration"
faq:
  - q: "Can I use more than one identity provider at the same time?"
    a: "Yes. Many teams use Google Workspace for full-time employees and GitHub for contractor access, with both sources mapped to different role groups in QuickZTNA. The admin dashboard supports any number of configured identity providers; users authenticate with the one their email or identity matches."
  - q: "Is SCIM provisioning required or optional?"
    a: "Optional but recommended on every plan. Without SCIM, users self-onboard on first sign-in (just-in-time provisioning) and group membership is read from OIDC claims. With SCIM, users and groups are pushed proactively from your IdP, which is the right pattern for tight offboarding and large group hierarchies."
  - q: "Do you support SAML?"
    a: "SAML login is currently DISABLED pending a security fix — sign-in attempts return SAML_DISABLED. The configuration surface is documented below for when it returns, but use OIDC today; every major IdP (Entra, Okta, Google, Authentik) speaks it. OIDC is preferred for new deployments because it's simpler and the security properties are equivalent or better; SAML is offered for compatibility with IdPs that don't speak OIDC or for procurement reasons."
---

QuickZTNA integrates with every major identity provider. This page covers the setup specifics for the common ones — Google Workspace, Microsoft Entra (formerly Azure AD), GitHub, Okta, Authentik — plus the generic OIDC, SAML, and SCIM paths for anything not specifically named.

The configuration patterns are similar across providers; each has a few peculiarities worth knowing. We've found that the IdP-side setup is usually the source of friction, not the QuickZTNA side, so the per-provider sections lean toward the IdP-specific gotchas.

## Decision: which protocol?

Three protocols, in order of preference:

**OIDC (OpenID Connect)** is the right default for new deployments. Every major IdP supports it. The security properties are well-understood; the configuration is simple; refresh tokens give you long-lived sessions without re-prompting users every hour.

**SAML 2.0** login is currently **disabled** pending a security fix — attempts return `SAML_DISABLED`. Use OIDC instead; every major IdP speaks it. The SAML setup below is retained for when it returns. Historically it was used when an IdP doesn't speak OIDC (legacy enterprise IdPs), when your procurement / security team insists on SAML for historical reasons, or when you need very specific SAML-only features like attribute mapping that doesn't translate cleanly to OIDC claims.

**SCIM 2.0** is not an authentication protocol — it's the provisioning protocol used alongside OIDC or SAML. Optional but recommended for fleets larger than 50 people. SCIM pushes user creation, group changes, and offboarding events from your IdP to QuickZTNA in near real time. Without SCIM, the same data flows on a slower, sign-in-triggered basis.

You can mix and match. A common pattern: OIDC for authentication, SCIM for provisioning, configured once on each side.

## Generic OIDC setup

Most IdPs are configured this way; the per-provider sections below are variations on the same theme.

In QuickZTNA's admin dashboard, go to **Settings → Identity providers → Add OIDC**. You'll be asked for:

- **Issuer URL** — the IdP's OpenID metadata endpoint. Usually `https://<idp-domain>/.well-known/openid-configuration` or similar.
- **Client ID** and **Client Secret** — credentials your IdP issues for this application.
- **Email domain** — the email domain users will sign in with (e.g. `yourcompany.com`). Users with email addresses in this domain are auto-routed to this IdP.
- **Allowed scopes** — typically `openid email profile groups`. The `groups` scope is required for group-based policy.
- **Group claim path** — the JSON path in the OIDC ID token where group membership lives. Common values: `groups`, `https://schemas.example.com/identity/claims/groups`. Documented per-provider below.

On the IdP side, register QuickZTNA as a relying-party application:

- **Redirect URI** — `https://login.quickztna.com/api/sso-auth/callback`. Exact match; no trailing slash, no query parameters.
- **Logout redirect URI** — `https://login.quickztna.com/auth` (optional).
- **Required scopes** — `openid email profile groups`.

Save on both sides. Test by signing out and signing back in with a user whose email matches the configured domain — you should be redirected to your IdP, authenticate there, and land back in QuickZTNA. The user appears in the Members tab with their email and group memberships populated from the OIDC claims.

## Google Workspace

Google Workspace is OIDC under the hood.

**Setup on Google:**

1. Open the Google Cloud Console. Create a new project or pick the one your org uses for identity.
2. Navigate to **APIs & Services → Credentials → Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Authorized redirect URIs: `https://login.quickztna.com/api/sso-auth/callback`.
5. Save. Copy the Client ID and Client Secret.

**Setup in QuickZTNA:**

- Issuer URL: `https://accounts.google.com`
- Client ID and Secret: from the previous step.
- Email domain: your Workspace domain (e.g. `yourcompany.com`).
- Group claim path: `groups`.

**Groups via Workspace.** Google's OIDC ID tokens do not include group membership by default. Two ways to get groups into QuickZTNA:

- **SCIM provisioning** (recommended). In QuickZTNA, generate a SCIM provisioning URL and bearer token under **Settings → Identity providers → Provisioning**. In Google Admin → Apps → Web and mobile apps → QuickZTNA, configure auto-provisioning with the URL and token. Groups now sync proactively.
- **Directory API** (less preferred). QuickZTNA can poll Google's Directory API for group membership using a service account with read-only Directory scope. Slower than SCIM and rarer in modern deployments; available if SCIM doesn't fit.

**Workspace tip.** Restrict the OAuth app to your domain in the Google Admin Console — by default a Cloud OAuth client accepts sign-ins from any Google account, which is rarely what you want. Apps → Configure OAuth → Authorized for: only users in your organization.

## Microsoft Entra (formerly Azure AD)

Entra also speaks OIDC; the older SAML configuration is still supported but the OIDC path is simpler.

**Setup on Entra:**

1. **Entra admin center → Identity → Applications → App registrations → New registration.**
2. Name: QuickZTNA.
3. Supported account types: **Single tenant** unless you have a specific multi-tenant need.
4. Redirect URI: **Web** type, value `https://login.quickztna.com/api/sso-auth/callback`.
5. After creation, in **Certificates & secrets → Client secrets**, create a new secret. Note the value (it's only shown once).
6. In **API permissions**, add Microsoft Graph delegated permissions: `openid`, `profile`, `email`, `User.Read`, and `GroupMember.Read.All`.
7. **Grant admin consent** for the permissions in the same panel.
8. In **Token configuration → Add groups claim**, choose **Security groups** and ensure they appear in **ID tokens**.

**Setup in QuickZTNA:**

- Issuer URL: `https://login.microsoftonline.com/<tenant-id>/v2.0`
- Client ID and Secret: from app registration.
- Email domain: your Entra domain.
- Group claim path: `groups`.

**Group IDs vs group names.** Entra emits group **object IDs** (GUIDs) in tokens by default, not human-readable names. QuickZTNA accepts either, but most operators prefer to see names. To get names, add the **Optional claims → groups** with the **Cloud-only group display names** setting enabled in the token configuration.

**Conditional Access.** If your org uses Entra Conditional Access policies (most do), the QuickZTNA app respects them — MFA, location restrictions, device compliance requirements, etc. all flow through normally. No QuickZTNA-side configuration needed.

## GitHub

GitHub OAuth is a common choice for engineering-heavy teams. The OIDC support is limited compared to Workspace or Entra — GitHub doesn't have a rich group concept beyond organization-and-team membership — but it's the right pick when GitHub is already the authentication source of truth.

**Setup on GitHub:**

1. **GitHub → Your organizations → Settings → Developer settings → OAuth Apps → New OAuth App.**
2. Application name: QuickZTNA.
3. Homepage URL: `https://quickztna.com`.
4. Authorization callback URL: `https://login.quickztna.com/api/sso-auth/callback`.
5. Save. Copy the Client ID. Generate a new client secret and copy it.

**Setup in QuickZTNA:**

- Issuer URL: `https://github.com`
- Client ID and Secret: from app registration.
- Email domain: usually `@github.com` (we authenticate via GitHub's API, not email domain matching).
- Group claim path: `teams`. QuickZTNA maps GitHub organization teams to groups.

**GitHub team / group mapping.** If a user is a member of your GitHub organization with team `@yourorg/engineering`, QuickZTNA sees the group `engineering`. Reference these groups in policy rules normally.

**Limitations.** GitHub OAuth doesn't support SCIM provisioning in the standard sense; if you need proactive provisioning, GitHub Enterprise has SCIM but it's an Enterprise-tier feature. For most GitHub-using teams the JIT provisioning (user is created in QuickZTNA on first sign-in) is sufficient.

## Okta

Generic OIDC. Okta has excellent OIDC and SCIM support; this is the smoothest enterprise integration.

**Setup in Okta:**

1. **Okta admin → Applications → Create App Integration → OIDC - OpenID Connect → Web application.**
2. App integration name: QuickZTNA.
3. Sign-in redirect URI: `https://login.quickztna.com/api/sso-auth/callback`.
4. Sign-out redirect URI: `https://login.quickztna.com/auth`.
5. Assignments: assign to the groups that should have QuickZTNA access.
6. In the **Sign On** tab, enable the **Groups claim** with filter "matches regex `.*`" (or narrow it to specific groups if you prefer).

**Setup in QuickZTNA:**

- Issuer URL: `https://<your-org>.okta.com/oauth2/default` (or your custom authorization server URL).
- Client ID and Secret: from the Okta application.
- Email domain: your email domain.
- Group claim path: `groups`.

**SCIM in Okta.** In the Okta app, **Provisioning → Configure API Integration → Enable API integration**. Paste the QuickZTNA SCIM URL and bearer token (generated in QuickZTNA's admin dashboard under Settings → Identity providers → Provisioning). Push users and groups; offboarding via Okta's standard deprovisioning flow.

## Authentik (self-hosted IdP)

Authentik is a popular open-source self-hosted IdP. It speaks both OIDC and SAML; the OIDC path is preferred.

**Setup in Authentik:**

1. **Applications → Providers → Create → OAuth2/OpenID Provider.**
2. Name: QuickZTNA.
3. Client type: Confidential.
4. Redirect URIs: `https://login.quickztna.com/api/sso-auth/callback`.
5. Scopes: select the openid, email, profile, and groups scope mappings.
6. Save. The Client ID and Secret are shown on the provider detail page.

Then create the application:

1. **Applications → Create.**
2. Name: QuickZTNA. Provider: select the OIDC provider you just created.
3. Assign user/group access policies as needed.

**Setup in QuickZTNA:**

- Issuer URL: `https://<authentik-domain>/application/o/quickztna/`
- Client ID and Secret: from the Authentik provider.
- Group claim path: `groups`.

Authentik's SCIM provider plugin is available if you want proactive provisioning; configuration is similar to the Okta flow.

## SAML 2.0

> **Currently disabled.** SAML login was switched off on 2026-07-17 pending a security fix; sign-in attempts return `SAML_DISABLED`. This section documents the configuration for when it returns. Use OIDC in the meantime.

For IdPs that don't speak OIDC or for procurement reasons. Available on every plan.

**Setup in QuickZTNA:**

In the admin dashboard, **Settings → Identity providers → Add SAML**. You'll get a metadata XML URL to provide to your IdP:

```
https://login.quickztna.com/api/sso-auth/saml/metadata?org=<your-org-slug>
```

**Setup in your IdP:**

Configure QuickZTNA as a SAML SP using the metadata URL above. Your IdP fetches the metadata, populates the necessary endpoint URLs and certificate, and presents you with a metadata URL of its own.

**In QuickZTNA:**

Paste your IdP's metadata URL into the QuickZTNA SAML configuration. QuickZTNA fetches it on the spot and confirms the cryptographic parameters.

**Attribute mapping:**

Map your IdP's SAML attributes to QuickZTNA's expected attributes:

- `email` → user's email.
- `groups` (or whatever your IdP calls the multi-valued group attribute) → group membership.
- `display_name` → optional human-readable name.

The default mapping works with Microsoft Entra, Okta, and most ADFS deployments. Custom IdPs may need explicit mapping.

## SCIM 2.0 provisioning

SCIM is the proactive-provisioning protocol. With SCIM configured, your IdP pushes user creation, group changes, and deprovisioning events to QuickZTNA in near real time. Without SCIM, the same events propagate on the slower path of "user signs in, JIT-provisioned."

**Setup in QuickZTNA:**

**Settings → Identity providers → SCIM provisioning → Enable**. The dashboard generates two things:

- A SCIM **base URL** (`https://login.quickztna.com/api/scim/v2/...`).
- A SCIM **bearer token** for authentication.

Paste both into your IdP's SCIM configuration. The exact location depends on the IdP:

- **Entra:** App → Provisioning → Automatic.
- **Okta:** App → Provisioning → Configure API integration.
- **Google Workspace:** Apps → Web and mobile apps → QuickZTNA → Auto-provisioning.
- **Authentik:** Applications → Create → SCIM provider.

Once configured, push users and groups from your IdP. Existing QuickZTNA users with matching emails are reconciled (not duplicated). New users are created with the appropriate group membership.

**Offboarding via SCIM.** When a user is deactivated or removed in your IdP, your IdP sends a DELETE request to QuickZTNA's SCIM endpoint. QuickZTNA removes the user and all their devices in a single operation. This is the right pattern for clean offboarding — one place to remove an employee, automatic cleanup everywhere.

## Multiple identity providers

You can configure any number of IdPs on a single QuickZTNA organization. The most common pattern is two:

- **Employees** via Google Workspace, Microsoft Entra, or Okta.
- **Contractors** via GitHub or a separate Okta tenant.

When a user lands on the sign-in page, QuickZTNA detects their identity (by email or by explicit IdP choice) and routes them to the right provider. Group claims from each provider populate group memberships in QuickZTNA independently; you can write policy rules that reference "Google Workspace's engineering group" or "Okta's contractor pool" without ambiguity.

## Troubleshooting

Issues with SSO setup almost always fall into one of these categories:

**Redirect URI mismatch.** The single most common issue. The redirect URI in your IdP must exactly match `https://login.quickztna.com/api/sso-auth/callback` — no trailing slash, no query parameters, no http vs https mismatch.

**Missing scopes.** If sign-in succeeds but groups don't populate, your IdP likely didn't request (or didn't grant) the groups scope. Re-check the application's scope configuration.

**Group claim format.** Some IdPs emit groups as an array of strings; others as an array of objects with `id` and `name`. QuickZTNA accepts both, but for the latter you need to map either the `id` or `name` field via the "Group claim path" configuration.

**Clock skew.** SAML in particular is sensitive to clock skew between the IdP, the user's browser, and QuickZTNA. Skews of more than 5 minutes break signature validation. If SAML mysteriously fails, check NTP everywhere.

**Token expiry / refresh.** If users are repeatedly prompted to sign in, the refresh token configuration on the IdP side is likely the issue — verify the application is allowed to issue refresh tokens.

For anything not on this list, [support@quickztna.com](mailto:support@quickztna.com) is the right contact. Include the IdP product name, the QuickZTNA error message you're seeing, and (if comfortable) a redacted screenshot of the IdP-side application configuration. We've debugged hundreds of SSO setups and the resolution is usually fast.

## Community-maintained tools

A few third-party tools that integrate with QuickZTNA. Not officially endorsed but known to work:

- **Terraform provider** — community-maintained on GitHub; covers most of the device/user/policy API.
- **Backstage plugin** — surfaces QuickZTNA device status in Backstage developer-portal pages.
- **Datadog integration** — webhook-driven ingestion of audit events into Datadog.

Search the QuickZTNA GitHub org or ask in our community channels for current pointers.

## What's next

For the API surface that powers all of this, [REST API overview](/docs/api/) is the reference. For the operator-facing view of user management, the [user guide](/guide/) covers the day-to-day side.
