---
title: "Quickstart: 100 devices on QuickZTNA in two minutes"
description: "From signing up to your first encrypted tunnel in under two minutes. Step-by-step quickstart for QuickZTNA — works on Linux, macOS, Windows, iOS, and Android."
section: "getting-started"
order: 2
updatedAt: 2026-05-16
primaryKeyword: "ZTNA quickstart"
howToSteps:
  - name: "Create your QuickZTNA account"
    text: "Sign up at login.quickztna.com using Google, GitHub, Microsoft, or email. No credit card. The first user becomes the organization admin."
  - name: "Run the install command"
    text: "Copy the one-line install command from your admin dashboard. Run it in a terminal on the device you want to connect. Linux, macOS, and Windows all use the same command shape."
  - name: "Authenticate the device"
    text: "The installer opens your browser to confirm the device belongs to you. Approve. The device shows up on the admin dashboard within seconds."
  - name: "Connect a second device and ping it"
    text: "Repeat steps 2 and 3 on a second machine. Try pinging it from the first machine using the QuickZTNA hostname shown in the dashboard."
faq:
  - q: "Do I need to open firewall ports on my devices?"
    a: "No. QuickZTNA tunnels are outbound-initiated from each device, so they work behind NAT, CGNAT, and most corporate firewalls without any inbound port forwarding. There is no listening port to expose."
  - q: "What if the one-line install command is blocked by my security policy?"
    a: "Every install path has a manual alternative. On Linux and macOS you can download the package directly from your admin dashboard; on Windows there's an MSI; on mobile there's the App Store or Play Store. The one-liner is for convenience; nothing about QuickZTNA requires it."
  - q: "Does the free tier really have the same encryption as paid?"
    a: "Yes. Hybrid X25519 + ML-KEM-768 post-quantum key exchange is enabled by default on every plan, including Free. There is no encryption downgrade path; we don't ship a 'classical-only' build."
---

This is the shortest page in the user guide on purpose. If it takes you more than two minutes the first time through, that's a documentation bug — please flag it.

We're going to do four things: create an account, install the client on one device, connect a second device, and verify the two can talk over the encrypted tunnel. After this you'll have a working QuickZTNA deployment that you can grow into a real one.

## Before you begin

You need:

- One device you can install software on as administrator (your laptop is fine). Linux, macOS, or Windows.
- A second device, ideally a different OS, to prove the cross-platform mesh works. Your phone is fine.
- A web browser to complete the sign-in.
- About two minutes.

You do **not** need: a credit card, a server, a static IP, a firewall change, a VPN concentrator, or any cryptographic configuration. The whole point of this product is that none of those should be your problem.

## Step 1 — Create your account

Visit [login.quickztna.com](https://login.quickztna.com/auth). You can sign in with Google, GitHub, Microsoft, or email — pick whichever matches the identity you want this account tied to. There is no credit card prompt. The first user becomes the organization admin automatically.

When you land on the dashboard, you'll see a panel labelled **Add your first device**. Keep that tab open; you'll come back to it in a moment.

A note on identity choice. If you're trying QuickZTNA personally and plan to use it for your team later, sign up with the identity provider that owns your work email — usually Google Workspace, Microsoft 365, or Okta. That makes the eventual transition to a real organization seamless: you'll just invite the rest of the team into the existing tenant. If you sign up with a personal Gmail and then later want to convert to a Workspace tenant, support can migrate you, but it's a small amount of friction worth avoiding.

## Step 2 — Install the client on your first device

The dashboard shows a one-line install command. It looks like this (the real one is copy-paste ready on your dashboard):

```bash
curl -fsSL https://login.quickztna.com/install.sh | sh
```

On Windows the equivalent is a PowerShell line; on macOS the same `curl` line works. Mobile devices use the App Store or Play Store — search for "QuickZTNA."

What this command does: it downloads the official client binary for your platform, verifies its signature against the public release key, and installs it as a system service. The whole step typically takes under thirty seconds on a reasonable connection. If you're behind a corporate proxy that blocks shell installs, the [installation page](/guide/installation/) covers manual download paths for every platform.

When the install finishes, your terminal will open a browser tab and ask you to confirm that the device belongs to you. Click **Approve**. You're now connected. Behind the scenes the client has generated a fresh key pair on the device, registered the public key with the coordination service, and established a tunnel. The private key never leaves the device — it stays in OS-protected key storage.

Glance back at your admin dashboard. The device should appear in the device list within a few seconds, with a green status indicator and the assigned QuickZTNA hostname (something like `your-laptop.tail-net.ts.net`-style; the exact format is shown on the dashboard).

## Step 3 — Add a second device

Repeat step 2 on your second device. If the first was your laptop, do this one on your phone (download the app, sign in with the same identity, approve) or on another machine you have handy. The same Approve flow happens.

You now have two devices on the same private network. That network exists only in software — there's no router to configure, no VPN concentrator to provision, no firewall rule to write. The devices reach each other directly when their networks allow it, and fall back to an encrypted relay when they don't. Either way, the traffic between them is end-to-end encrypted; the relay is a literal blind pipe with no ability to see plaintext.

## Step 4 — Prove it works

On the first device, look at the second device's QuickZTNA hostname in your admin dashboard. It'll be something short and predictable, like `phone-of-jane`.

Now ping it:

```bash
ping phone-of-jane
```

You should see replies inside about a second. If the second device is behind two different NATs (typical for a phone on cellular), the first packet may take a moment longer while the clients negotiate the path. Subsequent packets are at line rate.

That's it. You have a working post-quantum-encrypted Zero Trust network.

## What you just bypassed

This is worth a paragraph because it changes how you'll think about the rest of the guide.

You did not configure WireGuard. You did not exchange public keys manually. You did not set up a coordination server. You did not register DNS records. You did not write a firewall rule. You did not open a port. You did not generate or upload a certificate. None of that is your job; the product handles it.

If you've used a traditional VPN before, that list looks suspicious — those are the steps you remember spending an afternoon on. The trick is that the parts that matter (key management, hostname registration, NAT traversal, relay fallback) all run as a managed coordination plane. Your only job, as the operator, is to decide who is on the network and who can reach what. That's the rest of this guide.

## What to do next

Now that the product is in front of you, the most useful next moves depend on what you're trying to accomplish.

If you want to **add the rest of your team**, head to the admin dashboard and use the **Invite** flow. You can invite by email, by SSO domain (everyone in `@yourcompany.com` can self-onboard), or by sharing an invite link. Details on the [managing devices](/guide/managing-devices/) page.

If you want to **lock down what each person can reach**, jump to the [access policies](/guide/access-policies/) page. By default a new organization has an "everyone can reach everything" policy — which is fine for a two-person test but not for production. Most teams write their first real policy within an hour of finishing the quickstart.

If you want to **connect a server** (a database, a build agent, a Kubernetes node), the install command is the same as for a laptop. Tag the device as `server` and write a policy that lets only the right humans reach it. The [installation page](/guide/installation/) covers headless installs and containers in detail.

If you want to understand **how the encryption actually works**, especially the post-quantum part, the [security model](/docs/security/) page in the developer docs is where to go. Short version: every tunnel uses X25519 for classical key exchange and ML-KEM-768 (FIPS 203) for post-quantum key exchange, combined with HKDF-SHA256. The hybrid construction is symmetric-secure even if one of the two primitives is broken.

If you hit a problem, the [troubleshooting page](/guide/troubleshooting/) covers the issues we see most often. Run `quickztna doctor` on a stuck device before opening a ticket — it'll usually surface the cause on its own.

## A small calibration

You may notice that the dashboard, the CLI, and this guide all assume that you, the operator, want as little ceremony as possible. That is deliberate. QuickZTNA is built on the premise that the value of a Zero Trust network is the network — not the configuration ritual you had to perform to get one. The product fights for your time on every page.

If something in the product makes you do work that the product could have done for you, we consider that a defect. Tell us at [support@quickztna.com](mailto:support@quickztna.com) and we'll either fix it or explain why it's load-bearing.

Welcome aboard. [Next: how to install on every platform →](/guide/installation/)
