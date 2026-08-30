---
title: "Concepts: Zero Trust networking with QuickZTNA"
description: "The mental model behind QuickZTNA: how Zero Trust replaces the VPN perimeter, why a WireGuard mesh beats hub-and-spoke, and how identity-based access works."
section: "concepts"
order: 2
updatedAt: 2026-06-15
primaryKeyword: "Zero Trust network access concepts"
faq:
  - q: "Is QuickZTNA a VPN?"
    a: "Technically yes — it tunnels IP traffic over an encrypted overlay — but the product model is Zero Trust Network Access, not VPN. The difference matters: a VPN grants subnet-level access once you're connected; QuickZTNA authenticates and authorizes every connection between every pair of devices, every time. Same underlying technology, fundamentally different security posture."
  - q: "What encryption does QuickZTNA use?"
    a: "The data plane is WireGuard: Curve25519 (X25519) key exchange, ChaCha20-Poly1305 authenticated encryption, and BLAKE2s hashing, using WireGuard's Noise-based handshake. Device identity uses an on-device Ed25519 keypair held in the OS credential store. The coordination plane never holds data-plane keys and cannot decrypt your traffic."
  - q: "Does QuickZTNA support post-quantum cryptography?"
    a: "No. The data plane is classical WireGuard (Curve25519 + ChaCha20-Poly1305), and post-quantum key exchange is not implemented — it is not on the roadmap either, so please do not plan around it. Our blog covers the background and the standards timeline as vendor-neutral education. We would document it as a product feature here only if it ever shipped."
---

This page is the conceptual briefing for QuickZTNA. It assumes you're familiar with networking and security at the level of "I know what TLS does" but doesn't assume you've thought hard about Zero Trust specifically. By the end, you'll know what QuickZTNA does, what mental model it operates under, and why the technical choices are the choices.

## What QuickZTNA is, in one paragraph

QuickZTNA is a Zero Trust Network Access platform. It connects devices — laptops, servers, containers — into a single encrypted private network that you can grow from one device to ten thousand. Every connection between every pair of devices is authenticated against your identity provider, authorized against your access policy, and encrypted by WireGuard. There is no central concentrator to provision, no firewall rule to write, and no IP-level access granted by virtue of being on the network.

The rest of this page unpacks the four ideas in that paragraph: Zero Trust, mesh networking, identity-based authorization, and the encryption model.

## Zero Trust, briefly

Zero Trust is the model where every access request is authenticated and authorized at the point of access, regardless of where the request originates. The phrase comes from John Kindervag's 2010 Forrester research; the current canonical reference is NIST SP 800-207 ("Zero Trust Architecture," 2020).

The model exists because the network-perimeter model — castle and moat — failed at predictable scale. Once you decided that "inside the corporate network" implied trust, an attacker who breached the perimeter could move laterally with no further authentication. The 2013 Target breach, the 2015 Anthem breach, the 2020 SolarWinds incident — different details, same underlying failure mode. The perimeter is not where security lives anymore.

Zero Trust replaces "trust by network position" with "trust by current verification." Every connection answers the same three questions:

1. **Who is the requester?** Authenticated against an identity provider, with strong factors (MFA, hardware-backed credentials, certificate-bound sessions).
2. **What state is their device in?** Posture — disk encryption on, OS patched, screen lock enabled, no malware indicators.
3. **What are they allowed to reach?** Authorization, evaluated against an explicit policy.

A "yes" to all three lets the connection proceed; a "no" to any blocks it. There is no implicit trust to fall back on. Every request, every time.

QuickZTNA implements Zero Trust at the network layer. The identity question is answered by your identity provider (OIDC, SAML, or SCIM-integrated). The posture question is answered by the on-device agent that QuickZTNA installs. The authorization question is answered by the access-control rules you write (see the [access policies guide](/guide/access-policies/) for the operator-facing view). All three are evaluated for every connection attempt between every pair of devices.

## Mesh versus hub-and-spoke

Most traditional VPN products are hub-and-spoke: every client connects to a central concentrator, and traffic flows through that concentrator. Hub-and-spoke is simple to reason about and easy to deploy, but it has three structural problems.

**Latency.** Every packet between two clients takes a detour through the hub. If the hub is in one region and your two clients are in another, that's a multi-thousand-kilometre round trip for every packet. For interactive workloads (terminal SSH, live database connections, screen sharing) this is the difference between a working tool and an unusable one.

**Throughput.** The hub's bandwidth is shared across every client pair. As your fleet grows, the hub becomes the bottleneck. Adding more hubs introduces routing complexity that you then have to maintain.

**Blast radius.** When the hub is down, your network is down. When the hub is compromised, every connection through it is compromised. Hubs are single points of failure both operationally and in terms of trust.

Mesh networks invert the topology. Every device negotiates direct connections to every device it talks to. There's no central traffic chokepoint; packets flow over the shortest path the network can negotiate.

QuickZTNA is a mesh. The coordination plane — the service that authenticates devices, distributes public keys, holds policy state, and brokers NAT traversal — does not see data-plane traffic. Two devices on the same LAN reach each other over the LAN; two devices on opposite sides of the planet reach each other directly when their networks permit, and over an encrypted relay (DERP) when they don't. The relay, when used, is a literal blind pipe: it forwards encrypted bytes, has no decryption keys, and cannot inspect content. QuickZTNA runs DERP relays in two regions today (Bangalore and Frankfurt).

This matters for both performance (no detour) and for the trust model (no central traffic processor with privileged decryption ability). The coordination plane is a brokerage; it does not see your packets.

## Identity is the new perimeter

A consequence of Zero Trust is that "the network" stops being a meaningful security boundary. Two devices on the same VPN are not, by virtue of that fact, allowed to talk to each other. They have to satisfy the policy.

This shows up in how QuickZTNA expresses access rules. Rules are written against:

- **Users**, identified by your identity provider's user ID. Not by IP address, not by hostname.
- **Groups**, the same groups you already maintain in your identity provider. QuickZTNA syncs them via SCIM (paid plans) or via OIDC claims.
- **Tags**, strings you attach to devices to express their role: `prod`, `database`, `pci`, `contractor-laptop`.

No IP addresses. No subnets. No port ranges as the primary vocabulary. The policy language is built around identity and role because they're the right vocabulary for the security question.

This is the meaningful difference between "VPN with extras" and "Zero Trust." If your access rules reference IP addresses, you are operating under the network-perimeter model — even if marketing calls it Zero Trust. If your rules reference identity and role, you're in Zero Trust territory. The policy language is the giveaway.

The [access policies guide](/guide/access-policies/) covers the operator-facing view of writing those rules. The [REST API docs](/docs/api/) document how to manage them programmatically.

## Encryption

The data plane is **WireGuard**. Each pair of devices establishes a tunnel using WireGuard's Noise-based handshake:

- **Key exchange:** Curve25519 (X25519) ephemeral Diffie-Hellman.
- **Bulk encryption:** ChaCha20-Poly1305 authenticated encryption.
- **Hashing:** BLAKE2s.

This is the same, well-audited construction used by WireGuard everywhere — fast, small, and formally analysed. The coordination plane brokers public keys and NAT traversal but never holds the data-plane keys, so it cannot decrypt your traffic; the encrypted relay path is likewise a blind pipe.

### On post-quantum

Post-quantum cryptography — hybrid key exchange combining classical X25519 with a NIST-standardized KEM such as ML-KEM (FIPS 203) — defends against "harvest now, decrypt later," where traffic captured today is decrypted once a cryptographically-relevant quantum computer exists. It matters for data with long-lived value.

**The shipped QuickZTNA client uses classical WireGuard today.** Hybrid post-quantum key exchange is NOT on our roadmap, not a current product feature. Our [blog](/blog/) covers the background — ML-KEM, hybrid constructions, and the CNSA 2.0 / BSI / ANSSI timelines — and we would document it here as a product capability only if it ever shipped in the client.

## Trust roots

A Zero Trust network is only as trustworthy as its trust roots. QuickZTNA's are:

**The device identity.** When a device first joins, it generates a long-term Ed25519 keypair on-device. The public key is registered with the coordination service; the private key stays in the OS-protected credential store (DPAPI on Windows, the Keychain on macOS, the keyring on Linux). The device's identity is bound to this key.

**The user identity.** Authenticated by your identity provider via OIDC or SAML. QuickZTNA does not store passwords; the IdP is the source of truth for user identity, MFA, and (where SCIM is configured) group membership.

**The control plane's signing key.** The coordination service signs the state it distributes to clients. A compromised coordination service cannot inject a malicious policy without the signing key.

There is no hidden trust — no fourth party, no master key escrow, no back door. The trust roots above are the complete set.

## Performance characteristics

A few notes, for reference.

**Steady-state throughput:** WireGuard data-plane performance — within a small margin of raw link speed on commodity hardware, because the per-packet path is ChaCha20-Poly1305 with no concentrator detour.

**Path:** direct peer-to-peer wherever the two networks permit (LAN-local stays on the LAN); an encrypted DERP relay is the fallback only when NAT/firewall conditions block a direct path.

**Footprint:** a small resident client process plus modest per-peer state.

These characteristics are for the open Go client — the same one on the [installation page](/guide/installation/).

## What's next

You now have the conceptual frame. The natural next pages:

[Security model](/docs/security/) zooms in on the cryptographic and operational security properties — the trust model in detail, the audit surface, the compliance posture.

[CLI reference](/docs/cli/) is the command-line surface for everything `ztna` can do.

[REST API overview](/docs/api/) covers the HTTP API for programmatic management of devices, users, policies, and audit logs.

[Integrations](/docs/integrations/) covers SSO setup for the common identity providers.

If you'd rather see the product first, [the quickstart](/guide/quickstart/) gets a device on the network in two minutes.
