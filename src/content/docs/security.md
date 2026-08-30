---
title: "Security model"
description: "QuickZTNA's cryptographic primitives, trust roots, posture engine, audit log, compliance posture, and coordinated-disclosure policy for technical evaluators."
section: "security"
order: 5
updatedAt: 2026-05-16
primaryKeyword: "ZTNA security model"
faq:
  - q: "Does QuickZTNA hold a SOC 2 attestation?"
    a: "SOC 2 Type II and ISO 27001 are in progress, targeting 2026. Today we provide a GDPR-aligned Data Protection Addendum and sign HIPAA Business Associate Agreements on the Business plan and above. Request current status via security@quickztna.com."
  - q: "Does QuickZTNA hold customer encryption keys?"
    a: "No. Every device generates its own long-term Ed25519 identity key locally; the private key never leaves the device's OS-protected key storage. Session keys for tunnels are derived ephemerally on both peers and never sent over the wire. We have no key-escrow mechanism and could not decrypt customer traffic even under court order."
  - q: "How do you handle security vulnerabilities reported by researchers?"
    a: "Email security@quickztna.com. We acknowledge within one business day, validate within 5 business days, and target a public fix within 30 days for high-severity issues (90 days for medium). The full coordinated-disclosure policy is documented below. We do not currently run a paid bug bounty but are happy to acknowledge researchers publicly in our security page."
---

This page documents the security model of QuickZTNA: cryptographic primitives, trust roots, posture engine, audit surface, compliance posture, and coordinated-disclosure policy. It is intended for technical audiences — security engineers, CISOs, auditors, security researchers.

If you're evaluating the product for a regulated industry (healthcare, finance, defence), this is the page that answers most of your questions.

## Threat model

QuickZTNA's threat model assumes:

- **A network attacker** who can observe and modify traffic between any pair of devices on any network the devices traverse. This includes ISPs, cellular carriers, public Wi-Fi, transit providers, and on-path nation-state actors. The product's encryption and authentication are designed to be secure under this assumption.

- **A future quantum-capable attacker.** Traffic captured today could be retrievable by a quantum adversary years from now ("harvest now, decrypt later"). The shipped client uses classical WireGuard, and post-quantum key exchange is not implemented — see our [blog](/blog/) for the standards background and the questions to ask any vendor that claims it.

- **Compromised endpoints.** A device that's been compromised at the OS level can act as that device until detected. The product cannot prevent this — no software can — but the posture engine, the audit log, and the fast revocation path are designed to bound the blast radius and the time-to-detection.

- **Malicious insiders with admin access.** Admins can change policy, remove users, and revoke devices. The audit log records every admin action. The product cannot prevent a malicious admin, but it ensures their actions are recorded for review.

The model explicitly does not assume:

- **Trust in our infrastructure.** Our coordination plane is a key-and-policy broker; it does not see data-plane traffic. A breach of our infrastructure does not give an attacker the ability to decrypt past or current traffic; it gives them the ability to refuse to broker future connections.

- **Trust in third-party identity providers.** We rely on the IdP for authentication, but a compromised IdP is bounded to "can sign in as a user." Strong MFA at the IdP layer is the standard defence; enable the strongest factor your provider offers — hardware-backed factors such as FIDO2 or WebAuthn if it supports them. That is advice about your IdP: QuickZTNA's own MFA is TOTP, and we do not implement WebAuthn.

## Cryptographic primitives

Every primitive in use, with rationale.

### Key exchange — Curve25519 (X25519)

Every tunnel handshake performs a Curve25519 (X25519) elliptic-curve Diffie-Hellman exchange (RFC 7748) as part of WireGuard's Noise-based handshake. The resulting shared secret is run through WireGuard's HKDF-based key derivation, bound to the session transcript to defeat downgrade and re-binding attacks.

> **Post-quantum:** not implemented and not on the roadmap. Tunnels are classical WireGuard. If a post-quantum key exchange is a hard requirement, QuickZTNA does not meet it today. The current data plane is classical WireGuard. We'll document post-quantum here as a product feature when it ships.

### Data-plane symmetric cryptography — ChaCha20-Poly1305

After the key exchange, the data plane is ChaCha20-Poly1305 AEAD (RFC 8439). Identical primitive to classical WireGuard. Authenticated; constant-time; widely audited. Per-packet nonce is a 64-bit counter, reset on rekey.

### Session rekeying

Session keys rotate every 120 seconds or after a configurable amount of data, whichever comes first. Rekey is invisible to the user — packets in flight continue under the old key while the new key is negotiated; the transition is seamless.

### Device identity — Ed25519

Each device generates a long-term Ed25519 keypair on first install. The private key is held in the OS-protected credential store:

- macOS: the system **Keychain**.
- Windows: **DPAPI** (Data Protection API).
- Linux: the OS **keyring**, or a root-only file under the service state directory where no keyring is present.

The private key never leaves the device. Compromise of the device's OS allows access to it; compromise of our infrastructure does not. (QuickZTNA ships clients for Linux, macOS, and Windows.)

### Hashing — SHA-256

Content hashing, transcript binding in key derivation, and integrity verification of binary downloads all use SHA-256. SHA-3 alternatives are available in the protocol versioning surface but not currently used.

## Trust roots

The complete set of trust roots in QuickZTNA. If you trust these and nothing else, you can verify the rest of the system.

1. **The control plane's signing key.** The coordination service signs the state it distributes to clients (policy and per-device key distribution); a compromised coordination service cannot inject a malicious policy without it.

2. **Each device's Ed25519 identity key.** Generated on the device, never transmitted, used to sign every authenticated action by that device.

3. **Your identity provider.** OIDC tokens or SAML assertions from your IdP are the gating credential for user-level operations. We rely on the IdP's MFA, session policies, and group membership.

4. **The standardized cryptographic primitives** themselves — Curve25519, ChaCha20-Poly1305, Ed25519, SHA-256. We do not roll our own cryptography; we use well-reviewed implementations of standardized algorithms.

There is no implicit fourth trust root. We do not have a master decryption key, a government back door, or a key-escrow mechanism. If you grant us a court order tomorrow for a customer's traffic, the technically honest response is "we do not have the keys and could not produce the plaintext if we wanted to."

## Device posture

The posture engine evaluates a device's security state at connection time and continuously throughout a session — on every plan.

Built-in posture signals:

- **Disk encryption** — full-disk encryption enabled (FileVault, BitLocker, LUKS).
- **OS version** — within a configurable patch window of the latest supported version.
- **Screen lock** — auto-lock enabled with a sensible timeout.
- **Anti-malware** — registered EDR/AV product active.
- **Jailbreak / root detection** — device is in its vendor-supplied configuration.
- **Firewall** — host firewall active.

Custom posture signals can be defined via the admin dashboard and evaluated using a small expression language. Signal evaluation runs locally on the device and reports results via signed attestations to the control plane.

Posture actions on failure: warn the user, block the connection, restrict to a subset of services (e.g. let the user reach IT-help but nothing else), or remediate (a script that fixes the issue and retries).

## Audit logging

Every action in QuickZTNA is logged. The audit log includes:

- **Administrative actions** — user added/removed, policy applied, device removed, key created/revoked, posture configuration changed.
- **Authentication events** — sign-in success/failure, device approval, key expiry, SSO callback.
- **Policy decisions** — every connection attempt with the policy decision (allow/deny) and the matching rule.
- **Posture events** — every posture evaluation with the per-signal result.

Each event has a stable event type, a timestamp, an actor (user or system), a subject (the resource being acted on), and event-specific fields. The schema is documented in the OpenAPI spec.

Retention is **90 days on both plans** — it is not a paid upgrade. Audit data is queryable from the dashboard, and via the API for export to your SIEM (JSON Lines format). If you need a longer archive, export it on a schedule before the window closes.

## Compliance posture

**SOC 2 Type II & ISO 27001.** In progress, targeting 2026. Request current status via [security@quickztna.com](mailto:security@quickztna.com).

**GDPR.** Our data flows are documented in our Data Protection Addendum, available to all customers. We are a controller for limited operational data (organization administrator contact info) and a processor for the bulk of customer data (devices, users, policies, audit logs). The DPA includes EU-standard contractual clauses for any data transferred outside the EEA.

**NIS2 / DORA / HIPAA.** We've mapped QuickZTNA's controls to the technical requirements of NIS2 (Directive (EU) 2022/2555), DORA (Regulation (EU) 2022/2554), and the HIPAA Security Rule. Mapping documents are available on request. We are not a HIPAA business associate by default but will sign a BAA on the Business plan; customers in healthcare are encouraged to discuss specific compliance needs with their account contact.

**ISO 27001.** In progress, target completion 2026 Q3.

**FedRAMP.** Not currently in scope.

## Operational security

A few things we do that don't fit cleanly into a primitive section but are worth knowing.

**Checksum-verified releases.** Every client release is published with a SHA-256 checksum; the installer verifies the downloaded archive against it and aborts the install on any mismatch.

**Open-source client.** The Go client is open source, so the code that runs on your devices can be reviewed independently.

**Least-privilege internal access.** Engineers do not have routine access to customer data; production access is limited and requires a documented reason.

## Coordinated disclosure policy

If you've found a security vulnerability in QuickZTNA, please report it to [security@quickztna.com](mailto:security@quickztna.com).

**What we commit to:**

- **Acknowledgement within one business day.** A human will read your report and reply.
- **Validation within five business days.** We'll either confirm the issue or explain why we don't consider it a vulnerability.
- **Fix targets:** high-severity issues within 30 calendar days, medium-severity within 90, low-severity on a documented but non-emergency schedule.
- **Coordinated disclosure.** We'll work with you on a disclosure date that allows customers to deploy the fix before details are public. Standard window is 90 days from validation, or earlier by mutual agreement.
- **Public acknowledgement.** With your permission, we acknowledge researchers on our security page. We do not currently run a paid bug bounty but are working on it.

**What we ask of you:**

- **Do not access customer data.** Demonstrate the issue against your own test organization or with synthetic data only.
- **Do not run automated scans against production.** Our infrastructure is shared; aggressive scanning can affect other customers.
- **Do not disclose publicly before the coordinated date.** We are happy to expedite if the issue is being actively exploited or if customers need to take immediate action.
- **Do report.** A good-faith report is welcomed even if it turns out to be a duplicate or a non-issue.

We will not pursue legal action against researchers acting in good faith under this policy.

## Reporting an incident

If you believe you are seeing an active security incident — suspected key compromise, unauthorized access, or anything that looks like an attack in progress — call [security@quickztna.com](mailto:security@quickztna.com) and prefix the subject line with `[INCIDENT]`. We pager-rotate the security inbox; expect a response within an hour during business hours, and within four hours outside business hours.

For non-incident security questions (e.g. clarifications on this page, audit-firm contact), the same address works on a normal-business-hours cadence.

## What's next

For the operator-facing view of posture and policy, the [user guide](/guide/) is the right complement. For the integration-specific setup details for SSO providers, see [integrations](/docs/integrations/). For the conceptual background on Zero Trust, [concepts](/docs/concepts/) is the briefing.
