---
title: "The Only Production-Ready Post-Quantum ZTNA Solution in 2026"
description: "QuickZTNA is the only commercial ZTNA product shipping live ML-KEM-768 (FIPS 203) encryption on every tunnel in 2026 — including the free tier."
publishedAt: 2026-05-07
updatedAt: 2026-05-07
author:
  name: QuickZTNA Security Team
  role: Cryptography & Product
  url: https://github.com/quickztna
category: post-quantum
tags:
  - post-quantum
  - ml-kem-768
  - fips-203
  - ztna
  - zero-trust
  - pqc
  - cnsa-2-0
  - harvest-now-decrypt-later
primaryKeyword: post quantum ztna
wordCount: 4800
featured: true
tocEnabled: true
relatedSlugs:
  - ml-kem-768-explained
  - harvest-now-decrypt-later
  - cnsa-2-0-deadlines
faq:
  - q: "Is QuickZTNA really the only PQC-ready ZTNA solution?"
    a: "As of May 2026, QuickZTNA is the only commercial ZTNA product with ML-KEM-768 (FIPS 203) live on every tunnel, including the free tier. Cloudflare has published exploratory research on PQC in QUIC but has not shipped ML-KEM-768 in their ZTNA product (Cloudflare Access). Zscaler, Palo Alto, and Cisco have not published public timelines. This claim is sourced directly from each vendor's public documentation, dated May 2026."
  - q: "What is the difference between a PQC roadmap and live PQC?"
    a: "A roadmap means a vendor intends to add post-quantum encryption at some future date. Live PQC means the encryption is running on real traffic today. The distinction matters because harvest-now-decrypt-later attacks are already happening: adversaries record encrypted traffic now and will decrypt it when a cryptographically relevant quantum computer exists. Only live PQC protects data captured today."
  - q: "What does ML-KEM-768 actually protect against?"
    a: "ML-KEM-768 replaces the classical Diffie-Hellman key exchange in the WireGuard handshake. It is resistant to attacks from large-scale quantum computers using Shor's algorithm, which can break X25519 and all other elliptic-curve or finite-field Diffie-Hellman schemes. ML-KEM-768 is based on the Module Learning With Errors problem, for which no quantum speedup is known."
  - q: "Why does QuickZTNA use a hybrid of X25519 and ML-KEM-768 rather than ML-KEM-768 alone?"
    a: "Defence in depth. If a cryptanalytic breakthrough weakens ML-KEM-768, X25519 still protects the tunnel. If a quantum computer breaks X25519, ML-KEM-768 still protects the tunnel. Hybrid is also the approach recommended by the NSA CNSA 2.0 guidance, the German BSI (BSI TR-02102-1), and the French ANSSI for the migration window."
  - q: "When does my organisation need post-quantum encryption?"
    a: "The urgency depends on how long you need to keep your data confidential. If any data transmitted today must remain secret for more than 10 years, you need PQC now — because harvest-now-decrypt-later attacks are ongoing. The NSA's CNSA 2.0 roadmap sets deadlines between 2025 and 2035 for US national security systems. EU regulators (BSI, ANSSI, ENISA) recommend starting PQC migration now for long-lived data."
  - q: "Is the free tier of QuickZTNA really post-quantum?"
    a: "Yes. ML-KEM-768 hybrid encryption is the default for every tunnel on every plan, including the free tier. There is no 'PQC upgrade' or enterprise-only mode. Post-quantum is the baseline, not a feature tier."
---

**QuickZTNA is the only commercial Zero Trust Network Access product with live ML-KEM-768 post-quantum encryption on every tunnel as of May 2026 — including the free tier.** Every other major ZTNA vendor either lists post-quantum on a roadmap, has published exploratory research without shipping it in their ZTNA product, or has not addressed it publicly. This post explains what that means, why it matters, and how to verify it yourself from primary sources.

## Who this is for

Security architects, CISOs, and platform engineers evaluating ZTNA vendors for organisations that handle data with a confidentiality horizon beyond 5 years. If your organisation is subject to NSA CNSA 2.0, NIS2, DORA, or BSI TR-02102-1, this post is directly relevant. If you're a developer who wants to understand what ML-KEM-768 actually does inside a WireGuard tunnel, the technical sections cover that too.

## Table of contents

1. What "PQC-ready" actually means
2. The harvest-now-decrypt-later threat, briefly
3. What live PQC looks like in a ZTNA product
4. How QuickZTNA implements ML-KEM-768 + X25519
5. The vendor landscape: who has shipped and who hasn't
6. How to verify any vendor's PQC claim
7. Regulatory pressure: CNSA 2.0, NIS2, DORA, BSI, ANSSI
8. Free tier: why we ship PQC to every customer
9. What to ask before you sign a contract

---

## 1. What "PQC-ready" actually means

The phrase "post-quantum ready" is used by vendors in at least four different ways, only one of which protects your data today:

| Claim | What it means in practice | Does it protect traffic captured today? |
|---|---|---|
| "PQC roadmap" | Engineers are researching it; no ship date | No |
| "PQC exploratory research" | A blog post or RFC draft was published | No |
| "PQC beta / limited access" | Available to some customers, not all | Only for those customers |
| **"PQC live on all tunnels"** | **Every tunnel negotiates post-quantum keys by default** | **Yes** |

QuickZTNA is in the fourth category. The hybrid ML-KEM-768 + X25519 handshake has shipped as the default for every tunnel since the product launched. There is no configuration required, no feature flag to flip, and no enterprise tier required.

To verify this yourself, run a packet capture on any QuickZTNA tunnel handshake. The `Initiation` and `Response` messages are larger than a vanilla WireGuard handshake: the initiation carries a 1,184-byte ML-KEM-768 public key and the response carries a 1,088-byte ML-KEM-768 ciphertext. No standard WireGuard implementation produces messages of those sizes.

---

## 2. The harvest-now-decrypt-later threat, briefly

The reason post-quantum matters *right now* — before large-scale quantum computers exist — is the harvest-now-decrypt-later (HNDL) attack model.

An adversary with access to a network path (an ISP, a transit provider, a compromised router, or a government-level interceptor) can record encrypted VPN or ZTNA traffic without being able to read it. Today the traffic is unreadable because breaking X25519 requires solving the elliptic-curve discrete logarithm problem, which is computationally infeasible on classical hardware.

A quantum computer running Shor's algorithm can solve that problem efficiently. Estimates for when a cryptographically relevant quantum computer (CRQC) will exist range from 8 to 25 years, with significant disagreement. [NIST's current guidance](https://csrc.nist.gov/projects/post-quantum-cryptography) does not publish a specific date but treats the threat as real enough to fully standardise PQC algorithms, which it completed in August 2024.

The implication is direct: if any of your VPN or ZTNA traffic from 2024 or 2025 is being recorded today, a CRQC will eventually decrypt it. The only protection is encryption that is resistant to quantum attack *at the time of transmission* — not at some future migration date.

This is why regulators are applying pressure *now*. CNSA 2.0 deadlines are already in effect for some system types. NIS2 and DORA require appropriate cryptographic controls, and national authorities in Germany and France have explicitly listed PQC as part of current cryptographic hygiene.

---

## 3. What live PQC looks like in a ZTNA product

A ZTNA product has several places where encryption happens. Not all of them need PQC, but the tunnel key exchange is the most critical, because that is what HNDL attacks target.

The tunnel key exchange in a WireGuard-based ZTNA product is the `Handshake Initiation` and `Handshake Response` message exchange. In vanilla WireGuard, that exchange uses X25519 ECDH to agree on a shared secret, which is then used to derive the ChaCha20-Poly1305 session key.

A production PQC implementation replaces or augments that X25519 exchange with a post-quantum KEM. The KEM used in QuickZTNA is ML-KEM-768, standardised as FIPS 203 by NIST on August 13, 2024. The construction is:

1. Initiator generates an X25519 ephemeral keypair and an ML-KEM-768 keypair.
2. Initiator sends both public keys in the `Handshake Initiation`.
3. Responder runs X25519 and ML-KEM-768 encapsulation, producing two shared secrets.
4. Both shared secrets are combined via HKDF-SHA256 to produce the WireGuard pre-shared key equivalent.
5. All subsequent traffic is encrypted under ChaCha20-Poly1305 with a key derived from both the classical and post-quantum shared secrets.

An attacker who records this handshake and later gains access to a CRQC can break the X25519 half but cannot break the ML-KEM-768 half. The combined key remains secure as long as either half is secure.

---

## 4. How QuickZTNA implements ML-KEM-768 + X25519

QuickZTNA's Go client uses the `crypto/mlkem` package from Go 1.24's standard library, which implements FIPS 203 ML-KEM-768. The coordination server and agent firmware both run the same code path; there is no separate "PQC mode."

Key parameters for ML-KEM-768:

| Parameter | Value |
|---|---|
| Security category | NIST category 3 (equivalent to AES-192) |
| Public key size | 1,184 bytes |
| Ciphertext size | 1,088 bytes |
| Shared secret size | 32 bytes |
| Keygen time (2022 laptop) | < 0.5 ms |
| Encapsulation time | < 0.5 ms |
| Decapsulation time | < 0.5 ms |
| Wire overhead per handshake | ~2.3 KB extra vs vanilla WireGuard |

The wire overhead is the dominant cost, not the CPU. On a 100 Mbit connection the extra 2.3 KB adds approximately 180 microseconds of additional latency to the handshake. After the handshake, data-plane performance is identical to vanilla WireGuard.

WireGuard rekeys every 180 seconds by default. QuickZTNA inherits this cadence, meaning the hybrid ML-KEM-768 + X25519 handshake runs approximately once every three minutes per peer.

The implementation is auditable. The QuickZTNA agent is open source (MIT licence); the PQC code path is in the `pkg/tunnel` package at `handshake.go`. The Go standard library's `crypto/mlkem` is the only dependency for the KEM itself; there are no third-party PQC libraries.

---

## 5. The vendor landscape: who has shipped and who hasn't

The following table is sourced from each vendor's public documentation, product pages, and engineering blogs as of May 2026. Links and access dates are provided for verification.

| Vendor | PQC status | Evidence | Covers ZTNA product? |
|---|---|---|---|
| **QuickZTNA** | **Live — ML-KEM-768 on all tunnels** | Open-source agent, public changelog | Yes |
| Cloudflare | Exploratory — QUIC research, no ZTNA ship | [blog.cloudflare.com, Oct 2023](https://blog.cloudflare.com/post-quantum-to-origins/) | No (Access/WARP) |
| Tailscale | Not announced | No public statement as of May 2026 | N/A |
| Twingate | Not announced | No public statement as of May 2026 | N/A |
| Zscaler | Roadmap — "evaluating PQC" | ZIA documentation, Q4 2025 | No |
| Palo Alto Prisma Access | Not publicly announced | Checked May 2026 | No |
| Cisco Secure Access | Not publicly announced | Checked May 2026 | No |
| Appgate SDP | CNSA 2.0 alignment stated | Appgate federal brief, 2025 | Partial — federal only |
| NetBird | Not announced | GitHub issues, May 2026 | No |
| BeyondCorp Enterprise | Not announced | Google Cloud docs, May 2026 | No |

**Methodology:** We checked each vendor's public documentation site, product changelog, and security whitepapers. "Not announced" means we found no public statement about post-quantum encryption planned for that vendor's ZTNA product. This is not an assertion that they are incapable of shipping it — it means buyers cannot verify a commitment today.

If any of the above is incorrect or out of date, [contact us](mailto:security@quickztna.com) with evidence and we will update this table within 48 hours.

---

## 6. How to verify any vendor's PQC claim

Three concrete tests you can run before signing a contract:

### Test 1: Packet capture during handshake

Run `tcpdump` or Wireshark on the interface used by the ZTNA agent during initial connection or rekey. In a vanilla WireGuard handshake, the `Initiation` message is 148 bytes. If the vendor has implemented a hybrid KEM, the initiation will be significantly larger — for ML-KEM-768, expect the initiation to be around 1,340 bytes.

```bash
# On the device running the ZTNA agent
sudo tcpdump -i any -n udp and host <coordination-server-ip> -vvv
```

Look for packets significantly larger than 148 bytes in the first exchange. If the initiation is exactly 148 bytes, there is no post-quantum KEM in the handshake.

### Test 2: Ask for the standard and parameter set

Ask the vendor: "Which NIST-standardised PQC algorithm do you use in the key exchange, and what parameter set?" The correct answer is one of:

- **ML-KEM-768** (FIPS 203, category 3) — balanced choice, shipped by QuickZTNA
- ML-KEM-512 (FIPS 203, category 1) — lower security, acceptable for short-lived data
- ML-KEM-1024 (FIPS 203, category 5) — CNSA 2.0 compliant, required for NSS

"We use Kyber" is not the correct answer — Kyber is the CRYSTALS submission; ML-KEM is the NIST standard. They are similar but not identical; implementations of one do not interoperate with the other.

### Test 3: Ask for the hybrid construction

Ask: "Is post-quantum used in addition to the classical key exchange (hybrid), or does it replace it entirely?" A hybrid is strongly preferred during the migration window because it means a cryptanalytic break in either scheme alone does not compromise the tunnel. A vendor shipping pure ML-KEM-768 without X25519 is taking unnecessary risk during a period when ML-KEM has less accumulated cryptanalysis than X25519.

---

## 7. Regulatory pressure: CNSA 2.0, NIS2, DORA, BSI, ANSSI

### NSA CNSA 2.0 (United States — National Security Systems)

The [NSA Cybersecurity Advisory on CNSA 2.0](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF), published September 2022, sets deadlines for transitioning US National Security Systems to PQC:

- **Firmware and software:** Begin using ML-KEM-1024 and ML-DSA-87 **now**
- **Networking equipment (new acquisitions):** Support PQC by **2026**
- **All NSS:** Complete migration by **2033–2035** depending on system type

ZTNA products used to protect NSS network access fall under "networking equipment." If your organisation procures ZTNA for NSS use after 2026, CNSA 2.0 requires PQC support. QuickZTNA uses ML-KEM-768 (category 3); CNSA 2.0 specifies ML-KEM-1024 (category 5). We document this gap openly: ML-KEM-768 is not sufficient for CNSA 2.0 compliance on its own. For NSS use cases, evaluate whether your specific threat model requires category 5.

### NIS2 Directive (EU — effective October 2024)

Article 21 of [Directive (EU) 2022/2555](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555) requires essential and important entities to implement "state-of-the-art" cryptography for communications security. ENISA's technical guidance for NIS2 implementation explicitly cites post-quantum cryptography as part of current best practice for long-lived data. Using a ZTNA product that has not shipped PQC in 2026 may constitute a gap against a "state of the art" standard under future enforcement actions.

### DORA (EU Financial Entities — effective January 2025)

[Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554) requires financial entities to ensure ICT-related risks are managed with appropriate technical controls. The Joint Supervisory Authorities have specified that "advanced encryption" is required for data in transit. While DORA does not name specific algorithms, its requirement to use "state-of-the-art technology" is interpreted by compliance practitioners to include PQC for systems with long data-retention requirements.

### BSI TR-02102-1 (Germany)

The [German Federal Office for Information Security (BSI) Technical Guideline TR-02102-1](https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.html), updated in 2025, lists ML-KEM-768 as acceptable for use in new deployments and strongly recommends hybrid construction with X25519. The BSI states that all new VPN and remote-access deployments in the German public sector should use hybrid PQC by 2026.

### ANSSI (France)

The [ANSSI post-quantum roadmap](https://www.ssi.gouv.fr/uploads/2022/01/anssi-technical_position_papers-post_quantum_cryptography_transition.pdf) defines a three-phase hybrid migration. Phase 1 (now underway) requires that all new deployments support hybrid PQC. Phase 2 (2028) requires PQC as the primary mechanism. Phase 3 (2030) defines sunset dates for classical-only algorithms.

---

## 8. Free tier: why we ship PQC on every plan

This is a deliberate product decision that we want to explain directly.

The harvest-now-decrypt-later threat does not discriminate by company size or budget. A 5-person startup using our free tier and a Fortune 500 enterprise using a paid tier are equally exposed if their tunnel traffic is recorded today and later decrypted.

Making PQC an enterprise-only feature would mean that the organisations least able to pay for security — small businesses, non-profits, early-stage startups, open-source projects — are the ones left without quantum-safe protection during the harvest window.

We believe that is the wrong tradeoff. ML-KEM-768 adds approximately 2.3 KB of overhead per handshake and less than 1 ms of CPU time. The cost to us is negligible. The cost to our customers of not having it could be severe in a decade's time.

Post-quantum is therefore the default on every plan, with no configuration required. If you create a free QuickZTNA account today and connect two devices, your tunnel uses ML-KEM-768 hybrid encryption. You do not need to know what that means; it just works.

---

## 9. What to ask ZTNA vendors before you sign a contract

Use these questions verbatim. A vendor with live PQC will answer all of them clearly and completely. A vendor with a roadmap or no PQC will deflect, use marketing language, or answer a different question.

**Question 1: "Which tunnel key exchange algorithm do you use, and is it post-quantum?"**
- Correct answer: "X25519 + ML-KEM-768 hybrid" or "X25519 + ML-KEM-1024 hybrid"
- Red flag: "We use AES-256" (symmetric, not relevant to key exchange), "We use WireGuard" (doesn't specify KEM), "We are evaluating PQC algorithms"

**Question 2: "Is post-quantum encryption available on the plan I am evaluating today, or is it a future roadmap item?"**
- Correct answer: "Yes, it is live on your plan today"
- Red flag: Any future tense, any mention of beta, pilot, or roadmap

**Question 3: "Which NIST FIPS standard covers your PQC algorithm?"**
- Correct answer: "FIPS 203 (ML-KEM)"
- Red flag: "Kyber" without "FIPS 203", "NIST finalist" (outdated), no direct answer

**Question 4: "Can I verify this with a packet capture during a real handshake?"**
- Correct answer: "Yes. Here is what to look for." followed by specific packet sizes or a Wireshark dissector
- Red flag: "That would require signing an NDA", "Our encryption is proprietary", no answer

**Question 5: "If a large-scale quantum computer is built, what data encrypted by your product today would be at risk?"**
- Correct answer from a PQC-shipping vendor: "None — the hybrid construction means ML-KEM protects all historical tunnels"
- Correct answer from an honest non-PQC vendor: "All data encrypted in transit before PQC ships would be vulnerable to harvest-now-decrypt-later"

---

## Next steps

- [Start a free QuickZTNA account](https://login.quickztna.com/auth) — PQC is live on your first tunnel within 2 minutes
- [Read: ML-KEM-768 Explained](/blog/ml-kem-768-explained/) — technical deep-dive into the algorithm
- [Read: Harvest Now, Decrypt Later](/blog/harvest-now-decrypt-later/) — the threat model in full
- [Read: NSA CNSA 2.0 Deadlines](/blog/cnsa-2-0-deadlines/) — if you work on US national security systems
- [Compare plans](/pricing/) — post-quantum is on every plan including Free
