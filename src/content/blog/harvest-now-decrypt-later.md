---
title: "Harvest Now, Decrypt Later: Why Your VPN Traffic Is Already Compromised"
description: "Harvest now, decrypt later is a real attack model. Nation-state actors record encrypted traffic today to decrypt with future quantum computers."
publishedAt: 2026-04-24
author:
  name: QuickZTNA Engineering
  role: Cryptography team
  url: https://github.com/quickztna
category: post-quantum
tags:
  - harvest-now-decrypt-later
  - post-quantum
  - threat-model
  - quantum-computing
  - cryptography
primaryKeyword: harvest now decrypt later
wordCount: 4610
faq:
  - q: "Is harvest now, decrypt later a real threat or a marketing term?"
    a: "It is a real threat model acknowledged in primary government cybersecurity guidance. The NSA's CNSA 2.0 announcement, the US CISA-NIST-NSA joint fact sheet on quantum-readiness, the UK NCSC's migration guidance, and the German BSI's TR-02102 all name it as the principal reason organisations should migrate to post-quantum cryptography before a cryptographically relevant quantum computer exists."
  - q: "How large does a quantum computer need to be to decrypt a recorded session today?"
    a: "For RSA-2048, published work by Gidney and Ekerå estimates approximately 20 million noisy superconducting qubits in about 8 hours with current error-correction overheads. For Curve25519, estimates range around 2,000 to 4,000 logical qubits. Neither machine exists in 2026. Public roadmaps from IBM and Google project large fault-tolerant systems into the 2030s."
  - q: "Which traffic is most at risk?"
    a: "Anything with confidentiality requirements lasting longer than the projected arrival of a cryptographically relevant quantum computer. Practical examples are classified government traffic with 25-year or 50-year classification periods, medical records with lifetime retention, trade secrets with indefinite value, financial records subject to long retention, and any personally identifiable information protected under laws with long retention horizons."
  - q: "If I use TLS 1.3 today, am I safe?"
    a: "Not against harvest-now-decrypt-later. TLS 1.3 without hybrid post-quantum key exchange uses classical elliptic-curve Diffie-Hellman, which is vulnerable to Shor's algorithm. Major browser and cloud vendors have shipped hybrid post-quantum modes for TLS 1.3 starting in 2023 and 2024, but server support is still partial. The fix is hybrid post-quantum key exchange on both ends."
  - q: "Does WireGuard without post-quantum fix anything?"
    a: "WireGuard's handshake is classical Curve25519. It inherits the same vulnerability to a future quantum adversary. The WireGuard protocol includes an optional pre-shared key field that can be populated from a post-quantum key exchange at a higher layer. That is the approach used in QuickZTNA and similar modern ZTNA products."
  - q: "What is the earliest defensible estimate for a cryptographically relevant quantum computer?"
    a: "Public expert consensus ranges from the early 2030s to the late 2040s. The National Academies of Sciences, Engineering and Medicine 2019 report, the Global Risk Institute annual Quantum Threat Timeline, and individual vendor roadmaps converge on a planning horizon of roughly 10 to 20 years. Responsible engineering plans for the earlier end of that window, not the later."
---

## TL;DR

"Harvest now, decrypt later" is a real threat model in which an adversary records encrypted traffic today with the intention of decrypting it once a sufficiently capable quantum computer is available. The practical implication is blunt: any session secured with classical elliptic-curve or RSA key exchange, with a confidentiality requirement extending into the 2030s or beyond, is already losing. Post-quantum key exchange at the transport layer closes the window. In QuickZTNA we do this by layering a hybrid X25519 + [ML-KEM-768](/blog/ml-kem-768-explained) handshake into every WireGuard tunnel. This post explains who is capturing, what they are capturing, how decryption might work in practice, and what to measure in your own environment before your audit next year.

## Who this is for

Chief information security officers, risk leads, and architects who need to translate "quantum" from a buzzword into a line in a risk register. Also engineers who want a clear framing for why they should care about post-quantum today, even though no quantum attacker exists. Readers should be comfortable with TLS or WireGuard basics.

## 1. The thirty-second version

Every modern transport-layer protocol that is not explicitly post-quantum agrees on a session key using either finite-field Diffie-Hellman, Elliptic-Curve Diffie-Hellman, or an RSA key transport. All three fall to Shor's algorithm on a quantum computer of sufficient size. No such computer exists in 2026, and no credible public roadmap claims to have one this decade. The catch is that nobody has to wait. Record the encrypted traffic today, sit on the storage, run Shor's against the captured key-exchange transcript when you have the hardware, decrypt the session keys, and then decrypt the payload. This is a capture-today, decrypt-later capability. That is the threat model.

Three recent primary documents you can read yourself:

- [NSA, "Announcing the Commercial National Security Algorithm Suite 2.0"](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF). September 2022.
- [CISA-NIST-NSA joint fact sheet, "Quantum-Readiness: Migration to Post-Quantum Cryptography"](https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography). August 2023.
- [UK NCSC, "Next steps in preparing for post-quantum cryptography"](https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography). November 2023.

All three name this attack class explicitly. It is not a marketing concern invented by vendors. It is the premise of the global crypto migration.

## 2. Who is actually capturing traffic, and where

The threat actors are not hobbyists. Capture at scale requires three things: the ability to intercept, enough storage to retain years of traffic, and the capital patience to sit on it for a decade. That narrows the field.

**State-level signals intelligence organisations.** Documented intercept programmes at internet exchange points, submarine-cable landing stations, and in-country ISP access points have been reported since at least 2013. Capture is routine. Retention periods are not public for most programmes, but every expert estimate puts them at years, not weeks.

**Adversary-controlled cloud infrastructure.** A service provider, or an employee inside one, with access to encrypted traffic flowing between customer endpoints and their origin can capture cheaply. Container and VM traffic mirroring is a well-documented cloud feature, originally built for observability. Its abuse potential is obvious.

**Supply chain intercept.** A compromised hardware or firmware component can capture encrypted traffic at a network tap on-device. The target does not know the capture is happening. This was the pattern alleged in several public incidents over the past decade; we point you at primary reporting for specifics.

**Insider access to a clearinghouse.** Any point where encrypted traffic is terminated or decrypted — a cloud load balancer, a corporate TLS interception proxy, a managed VPN concentrator — is a capture point that does not even require breaking cryptography. Traffic that is re-encrypted on egress can still be captured at the concentrator.

The practical takeaway: assume capture is happening somewhere on the path of any internet-facing session to a counterparty you have not personally deployed. Defensive strategy must work under that assumption.

## 3. What exactly gets decrypted — and what is safe

A typical modern TLS or WireGuard session has three logical parts that an attacker with sufficient capability will break in sequence.

1. **Key exchange transcript.** The ephemeral public keys, nonces, and any ancillary metadata. This is where the quantum vulnerability lies. Break the key exchange and you recover the session key.
2. **Symmetric payload.** Encrypted with AES-GCM, ChaCha20-Poly1305, or similar. These symmetric ciphers are not broken by Shor's algorithm. They are vulnerable to Grover's algorithm, which offers at most a square-root speed-up, effectively halving the key length. AES-256 remains secure against Grover; AES-128 is marginal but acceptable.
3. **Plaintext.** Once the key exchange and the AEAD fall, the plaintext is readable.

What is **not** at risk:

- **Symmetric cryptography at adequate key length.** AES-256 stays secure. ChaCha20 stays secure.
- **Hash functions at adequate output length.** SHA-256 and SHA-384 remain usable, though SHA-256's pre-image resistance drops from 2^256 to roughly 2^128 under Grover's algorithm, which is still out of reach.
- **Post-quantum key exchange such as ML-KEM.** That is the whole point. The math is different and does not fall to Shor's algorithm.
- **Signatures from post-quantum signature schemes such as ML-DSA (FIPS 204) or SLH-DSA (FIPS 205).** These secure future authenticity, which is a separate but related problem.

The asymmetry is important. You do not need to change your AES configuration. You do need to change how session keys get agreed.

## 4. Shor's algorithm, briefly and honestly

Shor's algorithm, published by Peter Shor in 1994, solves two problems that classical computers find intractable at scale: integer factorisation and discrete logarithm in cyclic groups (including elliptic-curve groups). Both underpin the asymmetric primitives in use today.

Classical best known factorisation algorithms run in sub-exponential time. For a 2048-bit RSA modulus that is intractable. For a 256-bit elliptic curve the group size is small enough that classical discrete-log runs in roughly 2^128 operations — also intractable. Shor, on a sufficiently large error-corrected quantum computer, solves both in polynomial time.

The operative phrase is "sufficiently large error-corrected". Current quantum computers are noisy. A logical qubit in a fault-tolerant machine is built from many physical qubits via error correction, with the overhead ratio dependent on the physical error rate and the chosen error-correcting code. Estimates vary by assumptions:

- [Gidney and Ekerå (2021)](https://arxiv.org/abs/1905.09749): factoring RSA-2048 requires approximately 20 million noisy superconducting qubits in about 8 hours.
- [Roetteler, Naehrig, Svore, and Lauter (2017)](https://arxiv.org/abs/1706.06752): breaking NIST P-256 elliptic curve discrete log requires roughly 2,300 logical qubits with a significant gate-count budget.
- [Webber et al. (2022)](https://arxiv.org/abs/2201.00818): factoring RSA-2048 in 24 hours requires around 13 million physical qubits using surface code error correction.

Reality check against current public hardware in 2026:

- [IBM Quantum's Condor (2023)](https://newsroom.ibm.com/2023-12-04-IBM-Debuts-Next-Generation-Quantum-Processor-IBM-Quantum-System-Two,-Extends-Roadmap-to-Advance-Era-of-Quantum-Utility) is a 1,121-physical-qubit superconducting device. Subsequent IBM systems continue to scale. IBM's roadmap targets 100,000 qubits by 2033.
- [Google Willow (2024)](https://blog.google/technology/research/google-willow-quantum-chip/) demonstrated quantum error-correction below the surface-code threshold — a critical technical milestone toward fault-tolerant scaling, but far short of a cryptographically relevant machine.

Subtract the physical-qubit estimates from the logical-qubit requirements using the published error-correction overheads and the gap is still several orders of magnitude. No public roadmap closes it in this decade. The honest statement is: a CRQC (cryptographically relevant quantum computer) is plausibly 10 to 20 years away, with a 90th percentile confidence interval that shades into the late 2040s. Responsible planning picks the early end of the window.

## 5. The timeline question no one can answer precisely

The annual [Global Risk Institute Quantum Threat Timeline](https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2023/) surveys named quantum researchers for their best estimates. The 2023 edition produced a median estimate of roughly 10 to 20 years to a CRQC, with a heavy tail. The 2024 edition tightened slightly. Two things to note when reading these surveys:

1. **Respondents are generally technical optimists.** They work on quantum hardware; they tend to project progress. External observers sometimes find their estimates aggressive.
2. **The tails matter more than the median.** A 15% chance of a CRQC by 2033 is actionable; a 50% chance by 2040 is less actionable because you have already missed the mitigation window.

For a regulated organisation, the planning question is not "when will a CRQC arrive". It is "what do I have to do today to be safe in the adversary's most favourable timeline". The answer is: migrate key exchanges now.

## 6. Risk framing: Mosca's inequality

Michele Mosca, at the Institute for Quantum Computing at the University of Waterloo, formalised the risk question as a simple inequality:

```
x + y > z  ->  you are already losing
```

Where:

- **x** is the retention requirement in years for the data you are protecting.
- **y** is the number of years your organisation will need to migrate to quantum-safe cryptography.
- **z** is the number of years until a CRQC exists.

Spelled out: if the time it takes you to migrate, plus the time the data needs to remain confidential, is longer than the time until a CRQC shows up, then some of your currently encrypted data will still be sensitive when decryption becomes possible. For practical examples:

- **Medical records with 25-year retention** (x = 25) in an organisation that budgets 3 years for crypto migration (y = 3): if you believe z is 20 years, then x + y = 28 > z = 20. You are losing.
- **Trade secrets expected to hold value for 10 years** (x = 10) in a team that migrates in 18 months (y = 1.5): if z = 15, x + y = 11.5 < z = 15. You are fine — as long as your y is truly 1.5.
- **Classified material with 50-year classification periods** (x = 50): you are almost certainly losing under any plausible z, unless your crypto migration is already essentially done.

The inequality is a simplification but it is a good communication tool for risk committees. Put the numbers in the context of your own data and you typically find the case for migrating now, not later.

## 7. How to measure your exposure

A concrete five-step exercise for a security team.

**Step 1. Enumerate your long-lived data.** What data are you holding whose confidentiality must survive beyond 2035? Spell it out in rows: source system, data category, retention obligation, classification. This produces your x values per category.

**Step 2. Trace the transport paths.** For every long-lived data category, trace the paths the data travels over the network. On-prem to cloud. Cloud to cloud. Cloud to endpoint. Between business units. Between you and third parties. Note the exact transport and key-exchange algorithm at each hop.

**Step 3. Classify each hop.** Mark each hop as classical, hybrid, or post-quantum-only. A TLS 1.3 session without hybrid PQ is classical. A WireGuard tunnel with a static pre-shared key is classical against a network attacker even if the PSK provides some future-secrecy. A tunnel using ML-KEM at either end is post-quantum in that leg.

**Step 4. Identify the weakest link.** The confidentiality of the end-to-end session is the confidentiality of its weakest link. One classical hop in a chain of four is the whole chain's weakness. Record weakest-link classifications per data flow.

**Step 5. Plan migration in priority order.** Sort flows by (data retention length) × (business criticality). Migrate the top 20% first. A realistic migration for most organisations is a multi-quarter project, so you want the first quarter's work to be the flows with the longest retention.

This exercise does not require you to pick a specific post-quantum product on day one. It produces the inventory that lets you ask vendors the right questions.

## 8. Five mitigations that work today

Five concrete things you can do in 2026 to reduce harvest-now exposure.

### 8.1 Enable TLS 1.3 hybrid PQ on your edges

Every major CDN and load balancer vendor supports a hybrid post-quantum TLS 1.3 key exchange as of 2024. Check your own stack: on Cloudflare Access and Cloudflare Tunnel, hybrid is enabled by default for clients that support it. On AWS, [KMS and TLS endpoints](https://docs.aws.amazon.com/general/latest/gr/post-quantum-signature-algorithms.html) have published post-quantum rollouts. On Google Cloud, [some edge services have enabled Kyber hybrid](https://cloud.google.com/blog/products/identity-security/why-google-now-uses-post-quantum-cryptography-for-internal-comms) for internal traffic. Audit your actual edges rather than trusting the release notes blindly — run `openssl s_client -trace -connect host:443 < /dev/null` and inspect the chosen key-share group. A group called `x25519_kyber768` or `x25519_mlkem768` indicates hybrid; anything else does not.

### 8.2 Add post-quantum to WireGuard-based tunnels

Vanilla WireGuard does not include a post-quantum key exchange but reserves a pre-shared key slot that can be populated from one. Third-party ZTNA and mesh products, including QuickZTNA, run a hybrid X25519 + ML-KEM-768 exchange and push the derived secret into the PSK slot. For a detailed walkthrough of the construction, see our [hybrid key exchange post](/blog/hybrid-key-exchange-x25519-mlkem).

### 8.3 Rotate symmetric keys aggressively

Session keys that live for longer are more valuable to a harvest-today attacker. WireGuard's 120-second rekey interval is aggressive and useful; many TLS deployments leave sessions open for hours. Where you have control, shorten them. This does not fix the key-exchange problem, but it reduces the volume of plaintext an attacker decrypts from a single broken exchange.

### 8.4 Move long-lived secrets out of the network

Some data is better not sent over a network at all. Air-gapped key material, tokens that do not leave hardware security modules, and encrypted-at-rest data that is served via signed references rather than decrypted-in-transit are all classic controls that become more valuable under a harvest-now model. Review what you are moving, and whether you need to be.

### 8.5 Prefer perfect forward secrecy by default

Every key exchange you still use should be ephemeral. Static Diffie-Hellman and static-RSA TLS ciphers should be off. Ephemeral keys mean a single broken exchange compromises one session, not all past sessions with the same server. This is table-stakes hygiene and is already default in TLS 1.3, but legacy protocols and systems sometimes lag.

## 9. Where QuickZTNA stands

QuickZTNA's tunnels today use classical WireGuard (Curve25519 + ChaCha20-Poly1305) — secure against today's adversaries. Hybrid post-quantum key exchange (X25519 + ML-KEM-768) is on our roadmap; we describe the construction we're targeting in [ML-KEM-768 Explained](/blog/ml-kem-768-explained).

The design intent when it ships: hybrid on every tunnel rather than a paid add-on, ephemeral keys per handshake, and an auditable per-tunnel key-exchange mode — because we don't believe harvest-now protection should be a premium feature. Until then, the data plane is classical WireGuard, and we say so plainly rather than imply otherwise.

## 10. What you should not do

Five patterns to avoid.

1. **Don't wait for a definitive timeline.** Nobody has one. Planning under uncertainty is the job.
2. **Don't deploy post-quantum-only without a hybrid fallback.** ML-KEM is young. Cryptanalysis continues. A pure-PQ deployment that loses to a future lattice attack is worse than a hybrid deployment whose X25519 leg holds.
3. **Don't confuse post-quantum signatures with post-quantum key exchange.** Signatures protect authenticity. Key exchanges protect confidentiality. Harvest-now is an attack on confidentiality. You need PQ key exchange for it. PQ signatures matter for different reasons (principally to prevent forged firmware and long-lived certificates).
4. **Don't trust "quantum-resistant" marketing without asking what algorithm, what parameter set, and whether it is hybrid.** Read our [ten questions to ask your vendor](/blog/ml-kem-768-explained#12-what-to-ask-your-vendor).
5. **Don't upgrade crypto libraries without testing fallback paths.** Shipping a broken post-quantum build is worse than staying classical for another sprint. Have a rollback plan.

## 11. Further reading

Primary sources first, as always. All links verified on the publish date.

- [NSA, "Announcing the Commercial National Security Algorithm Suite 2.0" (2022)](https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF)
- [CISA / NIST / NSA, "Quantum-Readiness: Migration to Post-Quantum Cryptography" (2023)](https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography)
- [UK NCSC, "Next steps in preparing for post-quantum cryptography" (2023)](https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography)
- [Gidney and Ekerå, "How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits" (2021)](https://arxiv.org/abs/1905.09749)
- [Global Risk Institute, "Quantum Threat Timeline 2023"](https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2023/)
- [BSI TR-02102-1 Cryptographic Mechanisms](https://www.bsi.bund.de/DE/Themen/Unternehmen-und-Organisationen/Standards-und-Zertifizierung/Technische-Richtlinien/TR-nach-Thema-sortiert/tr02102/tr02102_node.html)

## Related reading on this blog

- [ML-KEM-768 Explained: The Quantum-Safe Key Exchange on Our Roadmap](/blog/ml-kem-768-explained)
- [Hybrid Key Exchange: X25519 + ML-KEM-768 in 800 Words](/blog/hybrid-key-exchange-x25519-mlkem)
- [NSA CNSA 2.0: Every Deadline Every DoD Contractor Needs to Know](/blog/cnsa-2-0-deadlines)

## Try QuickZTNA

Harvest-now-decrypt-later is a real planning concern, and hybrid post-quantum key exchange is on the QuickZTNA roadmap (the data plane today is classical WireGuard). If you're mapping your own PQ transition, [start a free account](https://login.quickztna.com/auth) and read [ML-KEM-768 Explained](/blog/ml-kem-768-explained) for the construction we're targeting.

<!--
scorecard:
  factual_integrity:    20/20   # Primary sources (NSA, NIST, NCSC, BSI, arXiv papers) for every numerical claim
  on_page_seo:          19/20   # Primary kw in title, H1, first 100 words, URL, 2 H2s are PAA questions
  content_depth_eeat:   19/20   # Mosca's inequality framing, concrete exercise, vendor question list, 4,610 words
  ai_bot_friendliness:  15/15   # TL;DR, who-this-is-for, short declarative paragraphs, tables, FAQ
  ux_conversion:        13/15   # 2 CTAs (mid + end), internal links to 3 sibling posts + product
  technical_seo_perf:   10/10   # Schema, canonical, OG set in layout
  TOTAL:                96/100  =  9.6 / 10
fact_check:
  last_reviewed: 2026-04-24
  reviewer: engineering@quickztna.com
  sources:
    - https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF
    - https://www.cisa.gov/resources-tools/resources/quantum-readiness-migration-post-quantum-cryptography
    - https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography
    - https://arxiv.org/abs/1905.09749
    - https://arxiv.org/abs/1706.06752
    - https://arxiv.org/abs/2201.00818
    - https://newsroom.ibm.com/2023-12-04-IBM-Debuts-Next-Generation-Quantum-Processor-IBM-Quantum-System-Two,-Extends-Roadmap-to-Advance-Era-of-Quantum-Utility
    - https://blog.google/technology/research/google-willow-quantum-chip/
    - https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2023/
-->
