---
title: "QuickZTNA developer documentation"
description: "Reference documentation for QuickZTNA: CLI commands, REST API, security model, and SSO integrations. The contract between your systems and the QuickZTNA platform."
section: "overview"
order: 1
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA documentation"
faq:
  - q: "What's the difference between the developer docs and the user guide?"
    a: "The user guide at /guide/ teaches you to operate QuickZTNA — install clients, invite users, write a first policy. The developer docs you're reading now are the contract — exact CLI flag semantics, REST API endpoints, error codes, the cryptographic model, and SSO integration details. If you're building automation on QuickZTNA, the docs are your reference."
  - q: "Are these docs versioned?"
    a: "The current docs describe the latest stable client and API. Breaking changes are announced 90 days in advance via the status page and the release notes; deprecated endpoints continue to function during the deprecation window. We do not maintain historical doc versions because we do not ship breaking changes outside the documented deprecation policy."
  - q: "Is there an OpenAPI specification for the REST API?"
    a: "Yes. The OpenAPI 3.1 spec is available at https://login.quickztna.com/api/openapi.json. It is the source of truth for the REST API surface; if there is ever a discrepancy between the human-readable docs and the spec, the spec is correct and we'll fix the docs."
---

This is the developer reference for QuickZTNA. It documents the contract between your systems and ours: the CLI surface, the REST API, the cryptographic model, the SSO integration shape, and the security commitments we make.

The docs assume you're already comfortable with the product. If you're not yet — if you haven't installed a client and connected two devices — the [user guide](/guide/) is the better starting point. It's faster to read and gets you to a working network in two minutes.

## What's here

**[Concepts: Zero Trust networking](/docs/concepts/).** The mental model. Why Zero Trust replaces VPN, why mesh replaces hub-and-spoke, and how identity-based access works. If you have to explain QuickZTNA to a CISO, security architect, or engineering leader, this page is the briefing material.

**[CLI command reference](/docs/cli/).** Every command, every flag, every exit code. The CLI is the same on Linux, macOS, and Windows; differences where they exist are called out per-command.

**[REST API overview](/docs/api/).** Authentication, versioning, pagination, rate limits, error format, and the endpoint catalogue. The full OpenAPI specification is at `https://login.quickztna.com/api/openapi.json`; this page is the human-readable companion.

**[Security model](/docs/security/).** The cryptographic primitives in use, the trust model, the posture engine, audit logging, compliance posture, and the coordinated-disclosure policy for security researchers.

**[SSO integrations](/docs/integrations/).** Setup details for OIDC, Google Workspace, Microsoft Entra (formerly Azure AD), GitHub, Okta, and Authentik. Plus SAML notes and the SCIM provisioning surface.

## How these docs are organized

Each section is one page. We've made a deliberate choice to write fewer, deeper pages rather than many thin ones — the developer audience for these docs is technical enough to use a table of contents, and a single long page beats fifteen small ones for Ctrl+F navigation.

Every page has a table of contents on the right rail (desktop) or inline at the top (mobile). Every code example is copy-paste runnable; if it isn't, that's a docs bug and we want to know.

## Spec snapshot

For people scanning to confirm the technical particulars before reading further:

**Cryptographic primitives.** WireGuard data plane: Curve25519 (X25519) key exchange, ChaCha20-Poly1305 AEAD, BLAKE2s hashing. Ed25519 for device identity signatures. SHA-256 for content/integrity hashing. (Post-quantum key exchange is not implemented and is not planned.)

**Identity.** OIDC primary; SAML login is currently disabled pending a security fix; SCIM 2.0 for user/group sync — available on every plan. Per-user MFA enforced through your IdP — QuickZTNA does not maintain a separate password.

**API.** REST over HTTPS with bearer tokens. OpenAPI 3.1 specification. JSON request and response bodies. RFC 7807 error format. Rate-limited per organization with documented limits.

**Compliance.** GDPR-aligned with documented data flows and a DPA; HIPAA BAA on Business. SOC 2 Type II and ISO 27001 in progress (target 2026).

**Audit.** Every administrative action, every policy decision, and every authentication is logged, with 90-day retention on both plans — queryable from the dashboard and via the API, exportable to your SIEM, with real-time event streaming.

**Hosting.** Fully managed cloud service; self-hosting is not offered today. Contact sales@quickztna.com if it's a requirement.

## A note on stability

The CLI and REST API follow semantic versioning. Breaking changes to either surface are announced 90 days in advance via the status page (`status.quickztna.com`), the release notes, and email to organization admins. Deprecated endpoints and flags continue to function during the deprecation window and emit deprecation warnings.

Internal protocols — the wire format between the client and the coordination service — do not have a stability commitment; they're versioned and negotiated transparently. You should not build automation that assumes the on-wire protocol is stable, because it isn't (and doesn't need to be — the documented surfaces are stable enough that you never need to peek under the hood).

## How to read these docs

If you're evaluating QuickZTNA technically, read [Concepts](/docs/concepts/) and [Security](/docs/security/) first. Those answer the "is this credibly Zero Trust" question, with citations to NIST, IETF, and other primary sources where appropriate.

If you're integrating QuickZTNA into a CI/CD pipeline or other automation, the [CLI](/docs/cli/) and [API](/docs/api/) pages are your reference. The CLI is the easiest entry point for shell scripts; the API is what you want for anything that needs to react to events or query state in bulk.

If you're plugging QuickZTNA into your identity provider, the [Integrations](/docs/integrations/) page covers the setup specifics for the common IdPs. The patterns are similar across providers but each has a few peculiarities worth knowing.

For operator-level "how do I do X," cross-reference to the [user guide](/guide/) — every page has a "what's next" link to the relevant operator content.

## Updates and changelog

These docs are updated as part of every client release. The "Last updated" timestamp at the top of each page reflects the last meaningful content change (not just a typo fix). For a chronological view of what's changed, the release notes at `https://quickztna.com/blog/` (filed under the "Release notes" category) document every released change to clients, the API, and the service.

If you find an error in the docs — a wrong exit code, a stale endpoint description, an example that doesn't run — please tell us at [support@quickztna.com](mailto:support@quickztna.com). We treat docs bugs as product bugs and fix them on the same cadence.

## Contact

For technical questions about anything in these docs, [support@quickztna.com](mailto:support@quickztna.com) is the right place. Free plan support is best-effort; the Business plan has priority email support.

For security issues — vulnerabilities, suspected key compromise, anything that should not be discussed publicly — [security@quickztna.com](mailto:security@quickztna.com) is the right channel. Our coordinated-disclosure policy is on the [security page](/docs/security/).

For SSO and integration questions specifically, the [Integrations](/docs/integrations/) page covers the common providers and points to the right support contact for your IdP-specific questions.

Ready? [Start with concepts →](/docs/concepts/)
