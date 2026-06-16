---
title: "Welcome to the QuickZTNA user guide"
description: "Start here. Get your team onto QuickZTNA in two minutes, then learn how to manage devices, write identity-based access policies, and troubleshoot the rare problem."
section: "getting-started"
order: 1
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA user guide"
faq:
  - q: "Is QuickZTNA really free for 100 devices?"
    a: "Yes. The Free plan covers 100 devices and 3 users, forever, with no trial timer. Every tunnel uses the same WireGuard encryption on every plan — there is no downgraded free-tier build."
  - q: "Do I need to install anything on a server to use QuickZTNA?"
    a: "No. The coordination plane is fully managed. You install a small client on each device that should join the network. The client is open-source code and runs as an ordinary system service."
  - q: "What's the difference between the user guide and the developer docs?"
    a: "This user guide walks operators through everyday tasks — install, invite, write a policy, fix a connection. The developer docs at /docs/ are the reference: CLI flags, REST API endpoints, the encryption model, and SSO integrations."
---

This is the operator's manual for QuickZTNA. It's written for the person whose job is to get a team onto a Zero Trust network and keep it running — not for the person evaluating whether to buy. If you're still evaluating, the [features page](/features/) and the [pricing page](/pricing/) are better starting points.

The guide is small on purpose. QuickZTNA is designed so that most operators never need to read past the [quickstart](/guide/quickstart/). The rest of this guide exists for the edge cases — the day your CISO asks how device posture works, the day a contractor's laptop refuses to connect, the day your finance team wants to know why the SaaS line item exists.

## What you can do in two minutes

If you've never touched QuickZTNA before, the goal of the next two minutes is simple: get one device on the network, see it appear on your admin dashboard, and confirm the tunnel is encrypted (WireGuard). That's it. Everything else — policies, groups, SSO, audit logs — comes later, after you've felt the product work.

The [quickstart](/guide/quickstart/) walks you through exactly that flow. It is intentionally the shortest page in this guide. If it takes you more than two minutes the first time through, that's a documentation bug; please tell us at [support@quickztna.com](mailto:support@quickztna.com) so we can fix the friction.

## How this guide is organized

This guide follows the natural arc of a QuickZTNA deployment, from "I just signed up" to "we have hundreds of devices and a real policy story."

**Getting started** is where you are now. The [welcome page](/guide/) (this one) sets expectations. The [quickstart](/guide/quickstart/) gets a single device on the network. Most teams stop here for the first day and come back to the rest later.

**Install** is the [installation reference](/guide/installation/). It covers every supported platform — Linux, macOS, Windows, and headless servers including containers. Each platform has slightly different install ergonomics; the page covers all of them in one place so you don't have to hunt across multiple URLs.

**Manage** covers everything you do after a device is connected. The [managing devices](/guide/managing-devices/) page explains tags, groups, key expiry, re-authentication, and how to cleanly remove a device when an employee leaves. This is the page you'll come back to most often once your deployment is live.

**Access control** is the [identity-based policies](/guide/access-policies/) page. This is where Zero Trust stops being marketing and starts being concrete. You'll learn how QuickZTNA evaluates "who is allowed to reach what," why policies are written against identity rather than IP, and how to keep your policy file readable as your team grows past fifty people.

**Help** is the [troubleshooting](/guide/troubleshooting/) page. We've collected the issues that the support team sees most often, organized by symptom — "I can't connect," "I can connect but can't reach my peer," "my DNS isn't resolving the way I expect," and so on.

## A note on what this guide does not cover

This is the operator guide. It explains how to use the product. It does not document the wire protocol, the REST API, the CLI flag matrix, or the exact cryptographic constructions on the data plane. Those live in the [developer docs](/docs/).

The line between the two is not arbitrary. The user guide answers "how do I do X right now"; the developer docs answer "what is the contract between my system and QuickZTNA." If you find yourself reading the guide and wanting more technical depth, click through to the corresponding docs page — every section has a cross-link at the top of the sidebar.

## Vocabulary you'll see in this guide

A handful of QuickZTNA-specific terms show up throughout the guide. Worth knowing them up front so the rest reads cleanly.

A **device** is anything that runs the QuickZTNA client. That includes laptops, servers, containers, and the occasional Raspberry Pi. Devices are the unit of network membership.

A **user** is a human with an identity in your identity provider — typically Google Workspace, Microsoft Entra, Okta, GitHub, or a similar OIDC source. One user can own many devices.

A **tag** is a string you attach to a device to express its role: `server`, `production`, `payroll`, `contractor`. Tags are the primary building block of access policies, because they let you write rules like "anyone with the `engineering` tag can reach anything with the `dev` tag" without listing individual users or devices.

A **policy** is a small, readable file (managed in the admin UI or via the API) that maps tags to access rules. Policies are evaluated on every connection attempt — there is no concept of an "allowed" device that can reach everything by virtue of being on the network. This is what makes QuickZTNA Zero Trust rather than VPN.

A **session** is an authenticated, encrypted connection between two devices. Sessions are short-lived; keys are rotated automatically without operator action. You'll rarely think about sessions explicitly, but the term shows up in audit logs.

## What's new in 2026

A few things have changed in the last twelve months that are worth flagging if you've used QuickZTNA before or are evaluating it against an earlier version.

Free SSH (remote shell) is now available on every plan, including Free. The workforce-security layer expanded — DLP file scanning, continuous device posture, software inventory, user-risk scoring, and a CASB approval workflow — and the AI Operator can now preview, apply, and revert ACL and policy changes with one-click rollback and full audit logging. Details on the [features page](/features/).

Continuous device posture is now the default for paid plans. Instead of evaluating posture only at connection time, QuickZTNA re-evaluates posture signals throughout a session and disconnects devices that drift out of compliance — for example, a laptop that disables disk encryption mid-session. The free plan supports posture-at-connect; the Business plan adds continuous evaluation. See [managing devices](/guide/managing-devices/) for the operator-facing controls.

The CLI's `ztna netcheck` command diagnoses the most common connectivity issues in one shot — STUN discovery, DERP health, UDP connectivity, and firewall detection. If you have a stubborn device, run it before opening a support ticket.

## Getting help

When the guide isn't enough, you have three paths.

The [troubleshooting page](/guide/troubleshooting/) covers about ninety percent of the issues we see in support. Read it before assuming you've found a bug.

The [developer docs](/docs/) cover the contract — CLI flags, API responses, error codes. If your question is "what does this exit code mean" or "what fields can the API return," that's the place.

Direct support is via [support@quickztna.com](mailto:support@quickztna.com). Free plan support is best-effort with a typical first response inside one business day. Business plan support has a documented response-time SLA on the [pricing page](/pricing/). Workforce plan customers get a dedicated channel; talk to your account contact.

For security issues — vulnerabilities, suspected key compromise, anything that should not be discussed in a public ticket — write to [security@quickztna.com](mailto:security@quickztna.com). Our coordinated-disclosure policy is on the security page of the developer docs.

Ready to get a device connected? [Start the quickstart →](/guide/quickstart/)
