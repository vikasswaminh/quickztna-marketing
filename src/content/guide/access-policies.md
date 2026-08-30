---
title: "Access policies: identity-based ACLs in Zero Trust"
description: "Write QuickZTNA access policies that scale past 200 people. Identity-based rules with tags and groups — readable today, auditable forever, drift-resistant."
section: "policies"
order: 5
updatedAt: 2026-05-16
primaryKeyword: "Zero Trust access policy"
faq:
  - q: "Are QuickZTNA policies stored in code or in the dashboard?"
    a: "Both. The canonical store is the QuickZTNA control plane, edited via the admin dashboard or the REST API. For teams that want policy-as-code, the CLI can pull the current policy as a versioned file, let you edit it locally, and push it back. Many teams keep the file in git and apply via CI."
  - q: "How fast does a policy change take effect?"
    a: "Within seconds. The control plane pushes policy updates to every connected device on the next coordination round. In-flight sessions are re-evaluated against the new policy and torn down if they no longer comply. There is no 'cache flush' step the operator needs to trigger."
  - q: "Can I test a policy change before applying it?"
    a: "Yes. Every policy edit can be applied in 'dry-run' mode, which logs what would have been blocked without actually blocking. Combined with the policy audit log, this lets you see the impact of a change before it's live. Dry-run mode is available on every plan."
  - q: "What happens when two policy rules contradict each other?"
    a: "Default-deny. QuickZTNA evaluates rules in declaration order and applies the first matching rule. If no rule matches, the connection is denied. There is no notion of an 'allow' rule overriding a 'deny' rule — you write deny-or-allow, in order, and the first match wins."
---

A QuickZTNA access policy answers one question: when device A tries to reach device B, should it be allowed?

This page covers how to write policies that scale — from the two-person team that just signed up to the four-hundred-person organization that's been running for a year. The principles are the same; only the volume changes.

## Why identity-based instead of IP-based

A short detour, because it's the thing that confuses people coming from VPN-shaped networks.

Traditional VPNs grant network access. Once a device is on the VPN, it can reach anything on the network subnet allowed by the IP-level firewall. The "access policy" is a set of firewall rules: source IP range, destination IP range, port. This works fine for small static networks. It does not work at any scale, for three reasons.

First, IPs are not stable. Phones move between networks. Laptops get new addresses every time they reconnect. Cloud workloads come and go. Pinning policy to IP means the policy ages out of correctness within hours.

Second, IPs do not carry identity. The fact that 10.20.30.40 is reaching 10.50.60.70 tells you nothing about who is at the keyboard or what role that machine plays. To answer "should this be allowed?" the firewall has to consult a separate identity system, and the binding between the two is brittle.

Third, the VPN model implicitly trusts everyone on the inside. Once you're on the network, you can probe everything else on the network. Network segmentation tries to fix this with subnets, but the segmentation rules age the same way IPs do, and the side effect is that you have to predict every access pattern upfront.

Zero Trust inverts the model. Every connection is authenticated, every access decision is made at connection time against the current identity and role of both ends, and the network itself grants no inherent trust. QuickZTNA policies are expressed against identity (who) and tags (what role) — never against IP addresses. The result is a policy file that stays correct as your network changes.

## The shape of a policy

A QuickZTNA policy is a small declarative document. Conceptually it's a list of rules, each saying "subjects with this property may reach destinations with that property over these services."

The admin dashboard shows policies in a structured editor. The CLI can pull the same policy as a JSON or YAML file, edit it in your favourite editor, and push it back. Both views describe the same thing — choose whichever fits your workflow.

A minimal example, in YAML form:

```yaml
rules:
  - description: "Engineers can reach development servers"
    subjects:
      - group: engineering
    destinations:
      - tag: dev
    services:
      - ssh
      - http
      - https

  - description: "Only the SRE group can reach production"
    subjects:
      - group: sre
    destinations:
      - tag: production
    services:
      - ssh
      - https
      - postgres

  - description: "Everyone can reach the internal wiki"
    subjects:
      - group: all-employees
    destinations:
      - tag: internal-wiki
    services:
      - https
```

Three concepts in play.

**Subjects** are who is making the connection. Subjects are expressed by group (a set of users from your identity provider — usually a Google group, an Okta group, or an Entra group) or by tag (a set of devices, e.g. all devices tagged `build-agent`). Both forms compose: a rule can require both, in which case the connection only passes if the user is in the group AND the device has the tag.

**Destinations** are what's being reached. Destinations are expressed by tag (the role of the destination device). Tags are the bridge between operator intent ("our payment processing servers") and the actual fleet ("these eleven specific machines whose role might change over time").

**Services** are the protocols and ports allowed for the matching subject/destination pair. QuickZTNA ships with named services (`ssh`, `http`, `https`, `postgres`, `mysql`, `rdp`, etc.) and you can define custom services for proprietary protocols. Defining a service is just naming a protocol/port combination so policies stay readable.

## Groups: where the leverage lives

Groups are the single highest-leverage primitive in a QuickZTNA policy. A well-defined group lets you express "engineers can reach development" as one rule; a poorly-defined group forces you to maintain a list of individual users that ages immediately.

The good news: you almost certainly already have the groups you need. Your identity provider — Google Workspace, Microsoft Entra, Okta, GitHub, Authentik, anything OIDC — already classifies your people. QuickZTNA syncs those groups via SCIM or via OIDC claims — both on every plan, including Free. Once synced, a group membership change in your IdP propagates to QuickZTNA's policy evaluator within seconds.

This is the right pattern: your identity provider is the source of truth for who belongs to the engineering team, the SRE team, the contractor pool. QuickZTNA's policy file references those groups by name. When someone joins or leaves a team, the policy doesn't need editing — the group membership change happens upstream and the policy automatically reflects it.

Teams that try to maintain QuickZTNA-local group definitions end up with a second source of truth that drifts. Don't do that. Define groups in your IdP; reference them in your policy.

## Tags: the device half

Where groups handle "who is reaching," tags handle "what is being reached." We covered tag basics on the [managing devices](/guide/managing-devices/) page; here we'll cover their interaction with policy.

A few patterns work well at scale.

**Environment tags are exclusive.** A device is in one environment. `production`, `staging`, `dev` — pick one, never more. Policy rules can then trivially restrict by environment without worrying about a device sneaking past via membership in two environments.

**Role tags are additive.** A device can be `database` and `payment-processing`. Policies can require both (rule matches only when device has both tags) or either (one tag is enough). The structured editor makes the AND/OR explicit; the YAML/JSON form uses arrays.

**Sensitivity tags are orthogonal.** `pii`, `phi`, `pci` — these are claims about the data the device holds, separate from the environment or role. Combine them with environment to get rules like "anyone reaching a `pci`-tagged device must be in the `pci-authorized` group, regardless of environment."

A well-tagged fleet is one where any operator can look at the tag list of a device and predict what it's allowed to do. Tagging is documentation as much as it is policy input.

## Order matters: first match wins

QuickZTNA evaluates rules top-to-bottom and applies the first one that matches. If no rule matches, the connection is denied. This is the default-deny model that makes Zero Trust meaningful — no rule, no access.

Practical consequence: write your deny rules first, then your allow rules, then your broader allow rules. For example:

```yaml
rules:
  # Deny first — contractors should never touch production
  - description: "Contractors cannot reach production"
    subjects:
      - group: contractors
    destinations:
      - tag: production
    action: deny

  # Specific allows
  - description: "SRE can reach production"
    subjects:
      - group: sre
    destinations:
      - tag: production

  # Broad allows
  - description: "All employees can reach development"
    subjects:
      - group: all-employees
    destinations:
      - tag: dev
```

Without the explicit `deny` for contractors, a contractor who happens to be in `all-employees` could reach development — and if a typo gave them production access via some other rule, you'd want the explicit deny to catch it. Defence in depth is cheap to write.

## Dry-run: testing before applying

The most expensive policy change is the one that quietly breaks something three days from now. Dry-run mode is the antidote.

When you edit a policy in the dashboard, the **Apply** button has a small dropdown next to it: **Apply (live)** or **Apply (dry-run)**. Dry-run installs the new policy in evaluation mode — connections are evaluated against both the old and new policy in parallel, but the decision used is the old policy's. The new policy's would-be decisions are logged.

After a few days of dry-run with real traffic flowing, you can see exactly what would have been blocked and exactly what would have been newly allowed. If the diff is what you expected, promote to live. If something surprising shows up — a service you forgot existed, an integration you didn't know about — fix the policy and dry-run again.

Most surprise outages caused by policy changes are caught by 48 hours of dry-run. The feature is available on every plan; please use it for any non-trivial change.

## Audit and the why-was-this-blocked log

When a connection is denied, the action is logged with three pieces of information: the subject (who tried), the destination (what they tried to reach), and the rule (which policy rule produced the deny). The operator sees this in the audit log immediately.

When a user reports "I can't reach X," the answer is almost always in the audit log within seconds. Look up the user's last connection attempts to X; the matching rule is right there. Either the rule is correct and the user shouldn't have access (and your job is to explain why), or the rule is wrong (and your job is to fix it). Either way you have a concrete answer, not a guess.

The audit log is retained for 90 days on both plans, queryable from the dashboard and via the API, and exportable to your SIEM. Retention is not a paid upgrade — export on a schedule if you need a longer archive.

## Policy as code

For teams that want access rules under version control, manage them through the REST API rather than by hand in the dashboard. Pull the current ACL rules, keep the export in git, review changes through your normal PR process, and push updates back via the API on merge. See the [REST API docs](/docs/api/) for the ACL endpoints.

From the command line, inspect and test rules:

```bash
ztna acl list                                   # show the current ACL rules
ztna acl test --src <machine> --dst <machine>   # is this connection allowed, and by which rule?
```

`ztna acl test` is the quick way to confirm a change does what you intend. Teams that automate policy through the API typically run `acl test` (or a small synthetic-traffic suite) against a staging org before promoting a change to production.

## Common mistakes to avoid

A few patterns we see catch teams.

**Putting individual users into rules instead of groups.** Works for the first month. Becomes unmaintainable as the team grows. The fix is to find or create the right group in your IdP and reference it; the rule itself never needs to change as people come and go.

**Tagging by team in production.** A production database tagged `team-engineering` mixes the team owning the database (an org chart fact) with the access pattern (a security fact). When the database moves to the data team, the tag is stale. Better: tag by role and sensitivity (`database`, `pii`), and let groups (in the subject side of the rule) handle who owns it.

**Forgetting the deny.** When you remove the "engineers can reach production" rule, the engineers no longer have production access — but only if nothing else in the policy grants it. Use `ztna acl test` to confirm the effect of every change; explicit denies for sensitive destinations make this safer.

**Adding service ports inline instead of named services.** Inline `tcp:5432` works but is opaque. Define `postgres` as a named service once; reference it by name everywhere. When you migrate from one Postgres port to another the change is one line in one place.

## What's next

You can now express access intent that scales. The remaining piece of the operator's toolkit is the [troubleshooting page](/guide/troubleshooting/), which covers the issues that show up when something doesn't work as expected.

If you want the reference-level depth on how policy evaluation runs internally — performance characteristics, evaluation order rules, exact semantics of every rule field — the [developer docs](/docs/api/) cover the policy API in full.
