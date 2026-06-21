---
title: "Managing devices: tags, expiry, and lifecycle"
description: "How to organize devices on QuickZTNA with tags and groups, rotate keys on schedule, onboard fleets with pre-auth keys, and cleanly remove devices when people leave."
section: "manage"
order: 4
updatedAt: 2026-05-16
primaryKeyword: "ZTNA device management"
faq:
  - q: "How often should I rotate device keys?"
    a: "The default key lifetime is 180 days, which is appropriate for most teams. For high-security environments — payment processing, healthcare, defence — shorten it to 30 or 90 days. The trade-off is operator time: shorter rotation means users see the re-auth prompt more often. Continuous posture (paid plans) reduces the security benefit of aggressive rotation."
  - q: "What happens to a device's traffic when its key expires?"
    a: "Existing sessions complete normally; new sessions are rejected and the user is prompted to re-authenticate via SSO. No traffic is dropped mid-flight, and no in-flight connection is terminated."
  - q: "Can I bulk-tag devices instead of clicking each one?"
    a: "Yes. The admin dashboard supports multi-select with bulk tag apply/remove. For very large fleets, use the REST API — it accepts a device filter and applies tags in one call."
  - q: "What happens when I delete a device?"
    a: "The device is immediately removed from the network. Existing sessions are terminated. The device's public key is revoked centrally, so even if the binary still has the key on disk, it cannot reconnect. On-device, the client detects the revocation and clears its local state. The device's audit history is retained according to your plan's retention policy."
---

The first day of a QuickZTNA deployment is about getting devices on the network. Every day after that is about managing them — knowing which ones belong, who owns them, what they're allowed to reach, and when they should rotate or retire.

This page is the operator's reference for that lifecycle. It assumes you've finished the [quickstart](/guide/quickstart/) and have at least one device connected.

## The device list

Open the admin dashboard. The Devices view is the operational heart of QuickZTNA. Every device that has ever joined your network appears here, with columns for:

- **Hostname** — the QuickZTNA name (short, predictable, often the OS hostname unless you've customized it).
- **Owner** — the identity that authenticated the device. For human devices this is a person; for servers it's the pre-auth key's creator.
- **OS** — Linux distribution, macOS version, or Windows version.
- **Tags** — strings you've attached to the device (more on these below).
- **Last seen** — the most recent successful coordination check-in. A device that's been off for more than a few minutes shows a warning indicator.
- **Key expiry** — when the device's current authentication expires and the user will be prompted to re-auth.
- **Status** — Connected / Idle / Expired / Disabled / Removed.

Click any device to drill in. The detail view shows the same fields, plus the device's QuickZTNA address, its current peers (which other devices it's actively talking to), and the audit history for the device (connection events, posture state changes, tag changes, policy decisions).

## Tags: the core organizing primitive

A **tag** is a short string you attach to a device to express its role. Common examples:

- Environment: `production`, `staging`, `dev`
- Role: `database`, `application-server`, `build-agent`, `workstation`
- Sensitivity: `pii`, `financial`, `hipaa`
- Team: `engineering`, `data`, `marketing`, `contractor`
- Geography: `eu`, `us`, `apac`

Tags do two things. First, they're how access policies are expressed (see the [access policies](/guide/access-policies/) page). Second, they're how you filter the device list to find what you're looking for at any scale.

A device can have any number of tags. Tags are mutable — you can add or remove them at any time and the network reacts immediately, including re-evaluating any in-flight session against the new policy state.

Two conventions worth adopting from day one. First, write tags in lowercase-kebab-case (`build-agent`, not `Build Agent` or `BuildAgent`). The system is case-sensitive and a stray capital will cost you ten minutes of confused debugging at some point. Second, separate environment tags from role tags. A device that is both a database and in production should have two tags (`database` and `production`), not a single combined `prod-db` tag. Policies are easier to write when tags compose.

## Pre-auth keys: onboarding without browser interaction

The interactive sign-in flow is great for humans but awkward for servers. The answer is a **pre-authentication key** — a one-time or multi-use credential you generate on the admin dashboard, hand to your fleet-deployment tool, and use in place of the browser approval step.

On the dashboard: Settings → Keys → New pre-auth key. You'll be asked for:

- **Tags to apply** — the device gets these tags the moment it joins, so no post-onboarding tag step is needed.
- **Expiry** — how long the key itself is valid for use. We recommend short (one hour for ad-hoc onboarding, twenty-four hours for scheduled deployments).
- **Single-use or multi-use** — single-use is the right default for production servers; multi-use is convenient for ephemeral fleets like CI runners where you accept that the key is a shared secret.
- **Owner** — who in your organization is responsible for the resulting devices. Usually you.

Once created, the key is shown to you exactly once. Copy it; we do not store it in retrievable form afterwards (only a hash for audit). If you lose it, generate a new one.

To use the key, the device passes it to the CLI at first connect:

```bash
sudo ztna up --auth-key=<key>
```

Or as an environment variable in containers:

```bash
ZTNA_AUTH_KEY=<key> ztna up
```

Pre-auth keys are scoped to your organization, audited like everything else, and revocable from the dashboard. If you suspect a key has leaked, click **Revoke** — existing devices that used the key keep their independent device identity (their keys aren't compromised), but no new device can use the leaked key to onboard.

## Key expiry and rotation

Every device's authentication has a finite lifetime. The default is 180 days. When a device's key expires, the user is prompted to re-authenticate via SSO. In-flight sessions are not interrupted; only new connections after expiry require the re-auth.

You can adjust the lifetime in Settings → Network → Key lifetime. Shorter lifetimes (30 or 90 days) are appropriate for regulated industries — HIPAA, PCI, financial — where periodic forced re-auth is a control auditors expect. The trade-off is operator time: shorter rotation means the prompt fires more often.

You can also enforce **per-tag lifetime overrides**. For example, devices tagged `payment-processing` can be required to rotate every 30 days, while general workstations stay on the default 180. This is the right pattern when most of your fleet is low-sensitivity but a small fraction touches regulated data.

A separate concept worth not confusing with key expiry: **session keys** (the actual encryption keys for an in-flight tunnel) rotate automatically every two minutes regardless of the device key lifetime. That rotation is invisible to users and uninterrupted. Device key expiry is a re-authentication event; session key rotation is a cryptographic hygiene event. Different concerns, different intervals.

## Removing a device

Three reasons to remove a device: an employee leaves, a piece of hardware is decommissioned, or a device is suspected stolen / compromised.

The procedure is the same in all three cases. On the admin dashboard, find the device, click **Remove**. The action is immediate:

- The device is dropped from the network. Active sessions terminate within seconds.
- The device's public key is revoked centrally. Even if the binary still has the private key on disk, it cannot reconnect.
- The on-device client detects the revocation on its next coordination check-in (under a minute) and clears its local state, including cached policy and peer lists.
- The device's audit history is preserved according to your plan's log retention policy (90 days on Free, one year on Business).

For employee offboarding specifically, the better pattern is to remove the **user** rather than each of their devices individually. Removing a user in Settings → Members revokes every device they own in one operation and prevents them from authenticating any new device. If you've correctly tied users to your SSO source, deprovisioning the user in your identity provider triggers the QuickZTNA user removal automatically (SCIM, available on every plan).

For a suspected-stolen device, the additional step is to investigate before removing. The device's audit log shows what it has accessed recently — usually enough to scope the blast radius. If you remove the device first you lose nothing operationally, but you'll want the access trail captured before the device disappears from the active view.

## Bulk operations

Once your fleet is past a hundred devices, individual clicks stop scaling. Two paths.

**The dashboard's multi-select.** Click the checkbox at the top of the device list to enter selection mode. Filter by tag, OS, or last-seen to narrow the set. Apply tags, remove tags, or remove devices in bulk. The action is atomic — either all of them succeed or you get a per-device error report.

**The REST API.** Device administration at scale is done through the REST API — the same surface the dashboard uses. List machines, filter by tag / OS / last-seen, and apply tag or removal changes programmatically in bulk. (`ztna machines list` is the CLI's read-only view of the same data; bulk tagging and removal of other devices are admin operations exposed via the dashboard and the API, not the local CLI.)

For programmatic management at scale, the [REST API](/docs/api/) is the same surface the dashboard uses. The API is rate-limited per organization but the limits are designed to support routine bulk operations.

## Stale devices

In a healthy deployment, the device list is mostly "currently active" plus a small tail of "haven't been seen in a few days" (laptops on vacation, servers turned off for maintenance). A long tail of "haven't been seen in months" is a sign of operator drift — old devices that should have been retired but weren't.

We recommend a small routine: monthly, list devices not seen in 60+ days, audit them with the owner if needed, and remove the genuinely retired ones. The dashboard has a "Stale devices" filter under Devices → Filters, and the REST API supports the same query for automation.

For Business plans and above, the dashboard also offers **automatic pruning** — devices idle for a configurable period are removed automatically, with the owner notified by email a few days before so they can re-onboard if needed.

## Posture and compliance

A device's **posture** is the set of signals about its security state — disk encryption on, OS up to date, screen lock enabled, no jailbreak / root, anti-malware running. QuickZTNA evaluates posture at connection time on every plan; the Business plan adds **continuous** posture evaluation, re-checking signals throughout a session and disconnecting devices that drift out of compliance.

Posture controls live in Settings → Posture. You choose which signals are required (`disk-encryption`, `os-up-to-date`, `screen-lock`, plus custom signals you define), the **action** when posture fails (warn the user, block the connection, restrict access to a subset of services), and the **scope** (everyone, or only devices with certain tags).

Posture is not a substitute for access policy — a healthy laptop owned by a contractor should not reach your production database just because the laptop is patched. Posture is necessary, not sufficient. The [access policies](/guide/access-policies/) page covers the identity-and-role side of the equation, which composes with posture (a connection has to pass both checks).

## Naming and hostnames

By default, a device's QuickZTNA hostname is derived from its OS hostname (e.g. `janes-mbp` from a Mac whose system name is "Jane's MBP," sanitized to lowercase-with-hyphens). For most teams this is the right default.

If you want stricter naming — `prod-db-01`, `build-agent-12` — there are two paths. For new devices, pass `--hostname=<name>` to `ztna up` (or `ztna login`). For existing devices, the operator can rename via the admin dashboard or the CLI; the network picks up the rename within a coordination round (under a minute). DNS resolves the new name immediately; the old one stops resolving.

Hostnames must be unique within your organization. The system enforces this on creation — duplicate names are rejected with a clear error.

## What's next

You can now run a healthy device list at scale. The next concern is access — who is allowed to reach what. That's the [access policies](/guide/access-policies/) page.

If you run into something this page doesn't cover, the [troubleshooting page](/guide/troubleshooting/) catches the common operational issues, and the [developer docs](/docs/cli/) document every CLI subcommand and API endpoint in full.
