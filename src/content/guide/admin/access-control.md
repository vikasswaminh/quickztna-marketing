---
title: "Access control: ACLs, posture, routes"
description: "Write identity-based ACL rules, require a device security baseline with posture (enforce vs monitor), and approve subnet routes and exit nodes."
section: "admin"
order: 3
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA ACL posture admin"
faq:
  - q: "What's the difference between posture 'enforce' and 'monitor'?"
    a: "In enforce mode, a device that fails a required posture check is blocked from connections. In monitor mode, the failure is recorded but the connection is allowed — useful for measuring impact before turning enforcement on. A device with a stale failing posture report under monitor/disabled must not be isolated; enforcement only blocks in enforce mode."
  - q: "Why can't a device reach a peer even though both are online?"
    a: "Almost always an ACL deny (check the audit log or run 'ztna acl test'), a posture failure in enforce mode, or a route that hasn't been approved yet. The first two are policy; the third is a routing approval."
---

Access control is where Zero Trust becomes concrete: an approved user on a healthy device still only reaches what policy explicitly allows. Three layers — ACLs, posture, and route approval — compose on every connection.

## ACL rules

QuickZTNA's access model is **ABAC** (attribute-based). Rules are written against **users**, **groups** (from your IdP), and **device tags** — not IP addresses. Each rule says, in effect, "subjects with attribute X may reach destinations with attribute Y (on these protocols/ports)."

Manage rules in the dashboard (or the [REST API](/docs/api/) for version-controlled / CI workflows). From the CLI you can inspect and test:

```bash
ztna acl list                                   # current rules
ztna acl test --src <machine> --dst <machine>   # is this allowed, and by which rule?
```

Two things to internalize:

- **Deny by default once you write rules.** A new tag has no access until a rule grants it. Pair every "new tag" with "a rule that references it."
- **Test before and after.** `ztna acl test` confirms a change does what you intend. Teams automating policy through the API typically run `acl test` (or a small synthetic suite) against a staging org before promoting to production.

The [access policies guide](/guide/access-policies/) covers rule design (groups over individuals, tag conventions, common mistakes) in depth.

## Device posture

Posture requires a security baseline on the device before (and, on paid plans, during) a connection. Built-in signals include disk encryption, OS version/patch level, screen lock, host firewall, and anti-malware presence; you can define custom signals in **Settings → Posture**.

A device checks its own posture and reports it; users can see their device's result with `ztna posture status`.

**Enforcement mode is the critical control:**

- **enforce** — a device failing a required signal is blocked.
- **monitor** — the failure is recorded but the connection is allowed (roll this out first to measure impact).
- **disabled** — posture isn't gating access.

Posture only blocks in **enforce** mode. A device carrying a stale, failing posture report under monitor or disabled must not be isolated — gate on the enforcement mode, not the raw report. (Free plan evaluates posture at connect; continuous re-evaluation is a paid-plan feature.)

Posture composes with ACLs: a connection must pass **both**. A patched contractor laptop still shouldn't reach production unless an ACL rule allows it.

## Subnet routes & exit nodes

By default QuickZTNA connects devices to each other. Two features extend that, and **both are admin-approved**:

- **Subnet routes** — a machine advertises a local subnet (`ztna up --advertise-routes 10.0.0.0/24`), letting peers reach non-QuickZTNA hosts behind it. Advertised routes are inert until an admin approves them. Review them with `ztna route list` and approve in the dashboard (or API).
- **Exit nodes** — a machine offers itself as an egress (`ztna up --advertise-exit-node`); approved exit nodes can route a peer's traffic. List candidates with `ztna exit-node list` / `ztna exit-node suggest`; a client selects one with `ztna set --exit-node <ip|auto>`.

Approval is deliberate: advertising a route or exit node is a request, not a grant — an admin decides whether that egress/bridge is allowed.

## Next

- [Workforce security](/guide/admin/workforce/) — the optional layer on top of access control.
- [Access policies guide](/guide/access-policies/) — rule design patterns.
