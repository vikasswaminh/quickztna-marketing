---
title: "Concepts: Zero Trust and post-quantum cryptography"
description: "The mental model behind QuickZTNA. How Zero Trust replaces VPN, why mesh beats hub-and-spoke, and why hybrid post-quantum key exchange matters today."
section: "concepts"
order: 2
updatedAt: 2026-05-16
primaryKeyword: "Zero Trust post-quantum"
faq:
  - q: "Is QuickZTNA a VPN?"
    a: "Technically yes — it tunnels IP traffic over an encrypted overlay — but the product model is Zero Trust Network Access, not VPN. The difference matters: a VPN grants subnet-level access once you're connected; QuickZTNA authenticates and authorizes every connection between every pair of devices, every time. Same underlying technology, fundamentally different security posture."
  - q: "Why hybrid post-quantum instead of pure post-quantum?"
    a: "Hybrid is the conservative engineering choice. Classical X25519 is well-understood and well-audited; ML-KEM-768 is the NIST standard but newer. Combining the two means the attacker must break both to recover the shared secret. If a flaw is found in ML-KEM later, our tunnels remain at least as secure as classical WireGuard. If quantum computers break X25519, ML-KEM still protects us. Defence in depth at the cryptographic primitive layer."
  - q: "Does the post-quantum encryption slow things down?"
    a: "Per-tunnel handshake is a few milliseconds slower because ML-KEM ciphertexts are larger than classical ones. Per-packet data-plane overhead is unchanged — encryption after the handshake is ChaCha20-Poly1305, identical to classical WireGuard. In practice, you cannot measure the difference outside of microbenchmarks. The throughput numbers on our pricing page are real-world."
---

This page is the conceptual briefing for QuickZTNA. It assumes you're familiar with networking and security at the level of "I know what TLS does" but doesn't assume you've thought hard about Zero Trust or post-quantum cryptography specifically. By the end, you'll know what QuickZTNA does, what mental model it operates under, and why the technical choices are the choices.

## What QuickZTNA is, in one paragraph

QuickZTNA is a Zero Trust Network Access platform. It connects devices — laptops, servers, containers, phones — into a single encrypted private network that you can grow from one device to ten thousand. Every connection between every pair of devices is authenticated against your identity provider, authorized against your access policy, and encrypted with hybrid post-quantum cryptography. There is no central concentrator to provision, no firewall rule to write, and no IP-level access granted by virtue of being on the network.

The rest of this page unpacks the four ideas in that paragraph: Zero Trust, mesh networking, identity-based authorization, and post-quantum encryption.

## Zero Trust, briefly

Zero Trust is the model where every access request is authenticated and authorized at the point of access, regardless of where the request originates. The phrase comes from John Kindervag's 2010 Forrester research; the current canonical reference is NIST SP 800-207 ("Zero Trust Architecture," 2020).

The model exists because the network-perimeter model — castle and moat — failed at predictable scale. Once you decided that "inside the corporate network" implied trust, an attacker who breached the perimeter could move laterally with no further authentication. The 2013 Target breach, the 2015 Anthem breach, the 2020 SolarWinds incident — different details, same underlying failure mode. The perimeter is not where security lives anymore.

Zero Trust replaces "trust by network position" with "trust by current verification." Every connection answers the same three questions:

1. **Who is the requester?** Authenticated against an identity provider, with strong factors (MFA, hardware-backed credentials, certificate-bound sessions).
2. **What state is their device in?** Posture — disk encryption on, OS patched, screen lock enabled, no malware indicators.
3. **What are they allowed to reach?** Authorization, evaluated against an explicit policy.

A "yes" to all three lets the connection proceed; a "no" to any blocks it. There is no implicit trust to fall back on. Every request, every time.

QuickZTNA implements Zero Trust at the network layer. The identity question is answered by your identity provider (OIDC, SAML, or SCIM-integrated). The posture question is answered by an on-device agent that QuickZTNA installs. The authorization question is answered by the policy file you write (see the [access policies guide](/guide/access-policies/) for the operator-facing view of that). All three are evaluated for every connection attempt between every pair of devices.

## Mesh versus hub-and-spoke

Most traditional VPN products are hub-and-spoke: every client connects to a central concentrator, and traffic flows through that concentrator. Hub-and-spoke is simple to reason about and easy to deploy, but it has three structural problems.

**Latency.** Every packet between two clients takes a detour through the hub. If the hub is in one region and your two clients are in another, that's a multi-thousand-kilometre round trip for every packet. For interactive workloads (terminal SSH, live database connections, screen sharing) this is the difference between a working tool and an unusable one.

**Throughput.** The hub's bandwidth is shared across every client pair. As your fleet grows, the hub becomes the bottleneck. Adding more hubs introduces routing complexity that you then have to maintain.

**Blast radius.** When the hub is down, your network is down. When the hub is compromised, every connection through it is compromised. Hubs are single points of failure both operationally and in terms of trust.

Mesh networks invert the topology. Every device negotiates direct connections to every device it talks to. There's no central traffic chokepoint; packets flow over the shortest path the network can negotiate.

QuickZTNA is a mesh. The coordination plane — the service that authenticates devices, distributes public keys, holds policy state, and brokers NAT traversal — does not see data-plane traffic. Two devices on the same LAN reach each other over the LAN; two devices on opposite sides of the planet reach each other directly when their networks permit, and over an encrypted relay when they don't. The relay, when used, is a literal blind pipe: it forwards encrypted bytes, has no decryption keys, and cannot inspect content.

This matters for both performance (no detour) and for the trust model (no central traffic processor with privileged decryption ability). The coordination plane is a brokerage; it does not see your packets.

## Identity is the new perimeter

A consequence of Zero Trust is that "the network" stops being a meaningful security boundary. Two devices on the same VPN are not, by virtue of that fact, allowed to talk to each other. They have to satisfy the policy.

This shows up in how QuickZTNA expresses access rules. Policies are written against:

- **Users**, identified by your identity provider's user ID. Not by IP address, not by hostname.
- **Groups**, the same groups you already maintain in your identity provider for HR and access-management purposes. QuickZTNA syncs them via SCIM (paid plans) or via OIDC claims (every plan).
- **Tags**, strings you attach to devices to express their role: `production`, `database`, `pci`, `contractor-laptop`.

No IP addresses. No subnets. No port ranges. The policy language is intentionally devoid of network primitives because they're not the right vocabulary for the security question.

This is the meaningful difference between "VPN with extras" and "Zero Trust." If your access rules reference IP addresses, you are operating under the network-perimeter model — even if marketing calls it Zero Trust. If your rules reference identity and role exclusively, you're in Zero Trust territory. The policy language is the giveaway.

The [access policies guide](/guide/access-policies/) covers the operator-facing view of writing those rules. The [REST API docs](/docs/api/) document the policy schema and how to manage policies programmatically.

## Post-quantum cryptography: the why

A long detour, because this is the part of the product most often misunderstood.

The classical key-exchange primitives we use today — Diffie-Hellman, ECDH, X25519 — derive their security from problems that are hard for classical computers but easy for quantum computers. Shor's algorithm (Peter Shor, 1994) solves discrete logarithm in polynomial time on a sufficiently large quantum computer. The same algorithm breaks RSA, DSA, ECDSA, and every classical asymmetric primitive in current use.

The argument for caring about this now is "harvest now, decrypt later." Network traffic encrypted today with X25519 can be captured today and stored cheaply. When a cryptographically-relevant quantum computer becomes available — opinions vary on when, but every credible estimate puts it inside a 15-25 year window — the stored traffic can be retroactively decrypted. For traffic that has long-lived value (intellectual property, regulated personal data, state secrets, financial records, medical records), this is a real exposure today.

NIST began standardizing post-quantum algorithms in 2016. The first round of standards published in August 2024: ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205). ML-KEM is the key encapsulation mechanism — the post-quantum replacement for ECDH/X25519. ML-KEM comes in three parameter sets; ML-KEM-768 targets NIST security category 3 (roughly comparable to AES-192).

The US NSA has issued CNSA 2.0 (September 2022), requiring National Security Systems to transition to post-quantum by 2035, with intermediate milestones starting 2025. The German BSI, French ANSSI, and other national cryptographic agencies have published similar timelines. The direction is set.

## Why hybrid

The conservative engineering choice is "hybrid" — combining classical X25519 with post-quantum ML-KEM-768 in a single key exchange. The resulting shared secret is derived from both halves; an attacker who breaks one but not the other still cannot recover it.

The reason is risk management. Classical X25519 has 20+ years of cryptanalytic scrutiny behind it; we know its threat surface well. ML-KEM-768 is the NIST standard but it's been a standard for less than two years. If a flaw is found in ML-KEM down the road, hybrid tunnels remain at least as secure as classical WireGuard. If quantum computers arrive on schedule and X25519 falls, ML-KEM still protects us. The hybrid construction is symmetric-secure against breakage on either side.

The exact construction QuickZTNA uses:

1. Both peers generate ephemeral X25519 keypairs and ML-KEM-768 keypairs.
2. They exchange public keys.
3. Each side computes the X25519 shared secret and the ML-KEM-768 shared secret independently.
4. Both shared secrets are fed into HKDF-SHA256 with a domain-separation tag and the transcript of the exchange (binding the derivation to the specific session).
5. The output is the symmetric encryption key for the tunnel.

The transcript binding (step 4) is the defence against downgrade and re-binding attacks. The data plane after the handshake uses ChaCha20-Poly1305, identical to classical WireGuard — the post-quantum work happens entirely in key establishment.

Per-tunnel handshake adds a few milliseconds (ML-KEM ciphertexts are larger than X25519 public keys — 1088 bytes for ML-KEM-768 ciphertext vs 32 bytes for X25519). Steady-state data-plane throughput is unchanged. In practice the post-quantum cost is invisible outside of microbenchmarks.

## Trust roots

A Zero Trust network is only as trustworthy as its trust roots. QuickZTNA's are:

**The device identity.** When a device first joins, it generates a long-term Ed25519 keypair on-device. The public key is registered with the coordination service; the private key never leaves the device's OS-protected key storage (Secure Enclave on Apple, TPM on Windows with TPM, keychain APIs on Linux with TPM, hardware-backed Keystore on Android, Secure Enclave on iOS). The device's identity is bound to this key, not to a re-issuable certificate.

**The user identity.** Authenticated by your identity provider via OIDC or SAML. QuickZTNA does not store passwords; the IdP is the source of truth for user identity, MFA, and (where SCIM is configured) group membership.

**The control plane's signing key.** The coordination service signs the policy state and key distribution to clients. Clients verify these signatures with a pinned public key (rotated annually, with overlap windows). A compromised coordination service cannot inject a malicious policy without the signing key.

**The post-quantum primitives.** ML-KEM-768 (FIPS 203) is the formally specified algorithm. Our implementation passes the NIST Known Answer Tests and is reviewed against the reference implementation. The classical half (X25519) uses well-audited library code.

There is no hidden trust — no fourth party, no master key escrow, no government-mandated back door. The trust roots above are the complete set; if you trust them, you can verify that the rest of the system is sound.

## Performance characteristics

A few numbers, for reference. All measured on commodity hardware (mid-range laptop, mid-range server) with the current client release.

**Tunnel handshake:** ~3-5 milliseconds added latency for the post-quantum portion, on top of the round-trip time required by the handshake itself. End-user impact for interactive workloads: imperceptible.

**Steady-state throughput:** Within 1-2% of classical WireGuard on the same hardware. The data plane is ChaCha20-Poly1305 either way; the post-quantum work is bounded to the handshake.

**Memory:** Approximately 12 MB resident per client process, plus per-peer state (under 1 KB per active peer).

**CPU:** Below 1% of one core at typical workstation traffic volumes. Servers handling gigabit-class traffic see single-digit-percent CPU on a modern core.

These numbers are for the open client — the same one on the [installation page](/guide/installation/).

## What's next

You now have the conceptual frame. The natural next pages:

[Security model](/docs/security/) zooms in on the cryptographic and operational security properties of the system — the trust model in detail, the audit surface, the compliance posture.

[CLI reference](/docs/cli/) is the command-line surface for everything QuickZTNA can do. If you're scripting against the product, this is where the contract is.

[REST API overview](/docs/api/) covers the HTTP API for programmatic management of devices, users, policies, and audit logs.

[Integrations](/docs/integrations/) covers SSO setup for the common identity providers.

If you'd rather see the product before reading further, [/guide/quickstart/](/guide/quickstart/) gets a device on the network in two minutes.
