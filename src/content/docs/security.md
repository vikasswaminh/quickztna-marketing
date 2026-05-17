---
title: "Security model"
description: "QuickZTNA's cryptographic primitives, trust roots, posture engine, audit log, compliance posture (SOC 2, FIPS 203, GDPR), and coordinated-disclosure policy."
section: "security"
order: 5
updatedAt: 2026-05-16
primaryKeyword: "ZTNA security model"
faq:
  - q: "Is QuickZTNA SOC 2 certified?"
    a: "Yes. We hold a SOC 2 Type II report covering Security, Availability, and Confidentiality. The report is available under NDA — request via security@quickztna.com. ISO 27001 certification is in progress with target completion in 2026 Q3."
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

- **An eventual quantum-capable attacker.** Network traffic captured today is assumed to be retrievable by a quantum adversary in the future. The hybrid post-quantum key exchange (X25519 + ML-KEM-768) is the defence against this "harvest-now-decrypt-later" model.

- **Compromised endpoints.** A device that's been compromised at the OS level can act as that device until detected. The product cannot prevent this — no software can — but the posture engine, the audit log, and the fast revocation path are designed to bound the blast radius and the time-to-detection.

- **Malicious insiders with admin access.** Admins can change policy, remove users, and revoke devices. The audit log captures every admin action with cryptographic integrity (chained signing on Business and Workforce plans). The product cannot prevent a malicious admin, but it ensures their actions are recoverable and provable.

The model explicitly does not assume:

- **Trust in our infrastructure.** Our coordination plane is a key-and-policy broker; it does not see data-plane traffic. A breach of our infrastructure does not give an attacker the ability to decrypt past or current traffic; it gives them the ability to refuse to broker future connections.

- **Trust in third-party identity providers.** We rely on the IdP for authentication, but a compromised IdP is bounded to "can sign in as a user." Strong MFA at the IdP layer is the standard defence; we recommend hardware-backed factors (FIDO2, WebAuthn) and forbid configuration paths that would weaken your IdP's posture.

## Cryptographic primitives

Every primitive in use, with rationale.

### Key exchange — Hybrid X25519 + ML-KEM-768

Every tunnel handshake performs both an X25519 key exchange and an ML-KEM-768 key encapsulation. Both shared secrets are combined via HKDF-SHA256 with a domain-separation tag and the transcript of the handshake.

**X25519** is Curve25519 in elliptic-curve Diffie-Hellman form, specified in RFC 7748. We use the standard reference implementation from the BoringSSL project (audited; constant-time; resistant to invalid-curve attacks). Output: 32-byte shared secret.

**ML-KEM-768** is the NIST-standardized Module-Lattice-Based Key-Encapsulation Mechanism, specified in FIPS 203 (August 2024). Parameter set 768 targets NIST security category 3 (roughly comparable to AES-192). Public key: 1184 bytes. Ciphertext: 1088 bytes. Output: 32-byte shared secret. Our implementation passes the NIST Known Answer Tests and is reviewed against the reference implementation.

**HKDF-SHA256** is the key derivation function (RFC 5869). The transcript binding includes the protocol version, both peers' identity public keys, and both halves of the key exchange — this defeats downgrade and re-binding attacks.

### Data-plane symmetric cryptography — ChaCha20-Poly1305

After the key exchange, the data plane is ChaCha20-Poly1305 AEAD (RFC 8439). Identical primitive to classical WireGuard. Authenticated; constant-time; widely audited. Per-packet nonce is a 64-bit counter, reset on rekey.

### Session rekeying

Session keys rotate every 120 seconds or after a configurable amount of data, whichever comes first. Rekey is invisible to the user — packets in flight continue under the old key while the new key is negotiated; the transition is seamless.

### Device identity — Ed25519

Each device generates a long-term Ed25519 keypair on first install. The private key is stored in OS-protected key storage:

- macOS / iOS: **Secure Enclave** where available; system keychain otherwise.
- Windows: **TPM** where available; DPAPI otherwise.
- Linux: **TPM 2.0** where available; otherwise root-only file in `/var/lib/quickztna/`.
- Android: **hardware-backed Keystore**.

The private key never leaves the device. Compromise of the device's OS allows access to it; compromise of our infrastructure does not.

### Hashing — SHA-256

Content hashing, transcript binding in key derivation, and integrity verification of binary downloads all use SHA-256. SHA-3 alternatives are available in the protocol versioning surface but not currently used.

## Trust roots

The complete set of trust roots in QuickZTNA. If you trust these and nothing else, you can verify the rest of the system.

1. **The control plane's signing key.** The coordination service signs the policy state and the per-device key distribution to clients. Clients verify these signatures with a pinned public key, embedded in every client release. The key is rotated annually with a 6-month overlap window. The public key fingerprint is published in our release notes and is verifiable independently.

2. **Each device's Ed25519 identity key.** Generated on the device, never transmitted, used to sign every authenticated action by that device.

3. **Your identity provider.** OIDC tokens or SAML assertions from your IdP are the gating credential for user-level operations. We rely on the IdP's MFA, session policies, and group membership.

4. **The NIST-standardized post-quantum and classical primitives** themselves. We do not roll our own cryptography; we use well-reviewed implementations of standardized algorithms.

There is no implicit fourth trust root. We do not have a master decryption key, a government back door, or a key-escrow mechanism. If you grant us a court order tomorrow for a customer's traffic, the technically honest response is "we do not have the keys and could not produce the plaintext if we wanted to."

## Device posture

The posture engine evaluates a device's security state at connection time on every plan, and continuously throughout a session on Business and Workforce plans.

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

Retention is plan-dependent:

- **Free**: 90 days, queryable from the dashboard.
- **Business**: 1 year, queryable via API, exportable to SIEM (JSON Lines format).
- **Workforce**: configurable retention from 1 year to permanent, real-time streaming via SSE or webhook.

On Business and Workforce plans, audit log entries are signed in a hash chain — each entry references the cryptographic hash of the prior entry, with periodic anchor points signed by the control plane. This means a malicious admin (or a successful attacker who gains admin access) cannot tamper with historical log entries without the tampering being detectable. We publish weekly anchor digests to a public transparency log for independent verification.

## Compliance posture

**SOC 2 Type II.** We hold a current Type II report covering Security, Availability, and Confidentiality trust principles. The report is available under NDA; request via [security@quickztna.com](mailto:security@quickztna.com). Audit firm details are in the report.

**FIPS 203 conformance.** Our ML-KEM-768 implementation passes the NIST Known Answer Tests for FIPS 203. We are not currently FIPS 140-3 certified as a cryptographic module — that's a separate, much heavier certification — but the algorithmic conformance is documented and verifiable. FIPS 140-3 module certification is on the roadmap for 2027.

**GDPR.** Our data flows are documented in our Data Protection Addendum, available to all customers. We are a controller for limited operational data (organization administrator contact info) and a processor for the bulk of customer data (devices, users, policies, audit logs). The DPA includes EU-standard contractual clauses for any data transferred outside the EEA.

**NIS2 / DORA / HIPAA.** We've mapped QuickZTNA's controls to the technical requirements of NIS2 (Directive (EU) 2022/2555), DORA (Regulation (EU) 2022/2554), and the HIPAA Security Rule. Mapping documents are available on request. We are not a HIPAA business associate by default but will sign a BAA on the Business plan and above; Workforce-plan customers in healthcare are encouraged to discuss specific compliance needs with their account contact.

**ISO 27001.** In progress, target completion 2026 Q3.

**FedRAMP.** Not currently in scope. If you operate a US federal workload requiring FedRAMP, contact us — we can discuss self-hosted deployments that align with FedRAMP Moderate baseline controls.

## Operational security

A few things we do that don't fit cleanly into a primitive section but are worth knowing.

**Reproducible builds.** Client binaries are built from public source in a hermetic CI environment. The same source produces the same byte-identical binary on every reproducer. We publish the build manifest with each release so independent third parties can verify the binary they downloaded matches what we built.

**Signed releases.** Every client release is signed with our release key. The signing key is rotated annually; the public key is embedded in every previous client release, allowing detection of any signing-key compromise.

**Least-privilege internal access.** Engineers do not have routine access to customer data. Production access is audited, time-bound, and requires a documented reason. We use the same Zero Trust principles internally that we sell externally.

**Vulnerability scanning.** Continuous SCA against our dependencies; quarterly third-party penetration tests; an internal red team exercise twice per year. Findings are tracked publicly via our security page once disclosed responsibly.

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

For the operator-facing view of posture and policy, the [user guide](/guide/) is the right complement. For the integration-specific setup details for SSO providers, see [integrations](/docs/integrations/). For the conceptual background on Zero Trust and post-quantum, [concepts](/docs/concepts/) is the briefing.
