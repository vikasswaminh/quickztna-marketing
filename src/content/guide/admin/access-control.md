---
title: "Access control: ACLs & ABAC"
description: "Write priority-ordered ACL rules over users, tags, and groups; layer ABAC conditions, posture, and threat-intel deny; and approve subnet routes and exit nodes."
section: "admin"
order: 3
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA ACL ABAC admin"
faq:
  - q: "In what order is an access decision made?"
    a: "The evaluator starts at default-deny, then checks machine status (quarantined/pending devices are denied), then org emergency lockdown, then your ACL rules in priority order (first match wins). If the match is allow, it then checks posture (deny only in enforce mode), then ABAC condition policies (a matching deny wins), then threat intelligence (a recent blocked verdict denies). The final answer is allow only if it survives every layer."
  - q: "Why can't a device reach a peer even though both are online?"
    a: "Most often an ACL deny (no rule grants it, since the model is default-deny once rules exist), a posture failure in enforce mode, a quarantined/pending status, an ABAC condition like a time-of-day or geo restriction, a threat-intel block, or org lockdown. Run an acl-evaluate test between the two machines — the response names the matched rule."
  - q: "What selectors can a rule's source and destination use?"
    a: "A wildcard (*), a specific machine ID or tailnet IP, a tag (tag:prod), an owner (user:<id>), a segmentation group (group:Engineering), or a CIDR (10.0.0.0/24). Tags and groups are the durable choice — they survive device churn, where IDs and IPs do not."
  - q: "Are subnet routes and exit nodes automatic?"
    a: "No. A device advertises a route or offers itself as an exit node, but it stays inert until an admin approves it — and only if the org allows subnet routing / exit nodes at all (org_settings). Approval is a deliberate grant, recorded in the audit log."
---

Access control is where Zero Trust becomes concrete: an approved user on a healthy device still reaches **only** what policy explicitly allows. QuickZTNA evaluates every connection through a fixed pipeline of layers — ACL rules, posture, ABAC conditions, and threat intelligence — and the connection is permitted only if it survives all of them.

## 1. What it is

The model is **ABAC** (attribute-based): rules are written against **users, groups, and device tags**, not brittle IP lists. The default posture is **deny** — once you write any rule, a subject reaches a destination only if a rule grants it. On top of rules, you can layer condition-based ABAC policies (time, geo, OS, status), require device posture, and let threat intelligence pull a compromised node out of the mesh.

## 2. How it works — the evaluation pipeline

Every peer connection is checked by `acl-evaluate`. The order is load-bearing:

```
  evaluate(source → destination, port, protocol)
        │
   1. DEFAULT DENY                              (zero-trust baseline)
   2. machine status   quarantined/pending  → DENY (machine_status_policy)
   3. org lockdown_mode = on                 → DENY (emergency_lockdown)
   4. ACL rules, priority ASC, FIRST match wins:
         source selector ∧ dest selector ∧ port ∧ protocol
         (skip expired JIT rules) → action allow|deny
   5. if allow → POSTURE: latest report non-compliant
         AND posture_enforcement = enforce    → DENY (posture_policy)
   6. if allow → ABAC policies (network/connection), priority ASC:
         all conditions met ∧ effect = deny    → DENY
   7. if allow → THREAT INTEL: blocked verdict in last 24h → DENY (threat_intel)
        │
        ▼
   allow only if it survives every layer
```

Rules are cached per-org for 300 seconds and the cache is invalidated when you create, edit, or delete a rule, so changes take effect within seconds.

## 3. Enable & prerequisites

| Requirement | How |
| --- | --- |
| **Rules** | ACL rules live in the `acl_rules` table — manage them in **Dashboard → Access control**, or via the [REST CRUD API](/docs/api/) for version-controlled / CI workflows. |
| **Fresh org default** | A brand-new org ships with a default allow-all rule so the mesh works out of the box. **Tightening this is the first real admin task** — replace it with explicit grants. |
| **ABAC** | Condition policies live in `abac_policies` (resource type `network`/`connection`). |
| **Routes / exit nodes** | Gated by `org_settings.allow_subnet_routing` and `allow_exit_nodes`; approvals are admin actions on `/api/machine-admin`. |
| **Role** | Inspecting/testing needs membership; writing rules and approving routes need **admin**. |

## 4. Step-by-step: tighten a fresh org

1. **Audit the default.** In Access control, find the default allow-all rule.
2. **Define your tags/groups.** Decide a tag convention (`tag:prod`, `tag:laptop`) and map IdP groups to `group:` selectors.
3. **Write explicit grants**, lowest `priority` number = evaluated first. Example: `group:Engineering → tag:dev` on `tcp:22,443`.
4. **Add a catch-all deny** at the highest priority number, then remove the allow-all.
5. **Test** every important path with `acl-evaluate` before and after (below).
6. Layer **ABAC** for context — e.g. deny `source_country not_in [IN, US]`, or restrict `time_hour between [9,18]`.

## 5. Worked examples

**Test a decision** (`POST /api/acl-evaluate`) — the response tells you the verdict *and the rule that decided it*:

```bash
curl -s https://login.quickztna.com/api/acl-evaluate -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"org_id":"'"$ORG"'","source_machine_id":"<src>","destination_machine_id":"<dst>",
       "port":22,"protocol":"tcp"}'
# → { allowed:true, decision:"allow", matched_rule:{id,name,priority},
#     posture_compliant:true, threat_blocked:false }
```

**Create a rule** via the CRUD API (`POST /api/db/acl_rules?org_id=…`):

```bash
curl -s "https://login.quickztna.com/api/db/acl_rules?org_id=$ORG" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"org_id":"'"$ORG"'","name":"Eng to dev SSH/HTTPS","source":"group:Engineering",
       "destination":"tag:dev","ports":"22,443","protocol":"tcp","action":"allow",
       "priority":100,"enabled":true}'
```

**A just-in-time (JIT) rule** is an ordinary rule with `expires_at` set — the evaluator skips it once expired:

```bash
  -d '{..., "name":"Temp prod access for incident", "expires_at":"2026-06-17T02:00:00Z"}'
```

**Approve a subnet route / exit node** (`POST /api/machine-admin`):

```bash
# Approve all routes a machine currently advertises:
curl -s https://login.quickztna.com/api/machine-admin -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve_routes","machine_id":"<id>"}'

# Approve a machine as an exit node:
curl -s https://login.quickztna.com/api/machine-admin -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve_exit_node","machine_id":"<id>"}'
```

From the CLI, an admin can inspect rules with `ztna acl list` and test a path with `ztna acl test --src <machine> --dst <machine>`. A device advertises a route at connect time with `ztna up --advertise-routes 10.0.0.0/24`; it stays inert until approved.

## 6. Configuration reference

**ACL rule fields:** `name`, `source`, `destination`, `ports`, `protocol`, `action` (`allow`/`deny`), `priority` (ASC = first), `enabled`, `expires_at` (JIT).

**Selectors** (source & destination): `*` (any) · `<machine_id>` · `<tailnet_ip>` · `tag:<name>` · `user:<owner_id>` · `group:<segmentation_group>` · `<cidr>` (e.g. `10.0.0.0/24`).

**Ports:** `*`/`any`, a single port, a comma list (`22,443`), or a range (`8000-8100`). **Protocol:** `*`/`any`, `tcp`, `udp`.

**ABAC condition attributes** (and operators):

| Attribute | Operators | Example value |
| --- | --- | --- |
| `time_hour` (UTC) | `between`, `not_between` | `[9, 18]` |
| `day_of_week` (0=Sun) | `in`, `not_in` | `[1,2,3,4,5]` |
| `source_os` | `eq`, `neq`, `in` | `"linux"` |
| `source_tag` / `dest_tag` | `contains`, `not_contains` | `"prod"` |
| `source_status` | `eq`, `neq` | `"active"` |
| `port` | `eq`, `in` | `[22, 3389]` |
| `protocol` | `eq` | `"tcp"` |
| `source_country` | `eq`, `neq`, `in`, `not_in` | `["IN","US"]` |

`source_country` is resolved from the device's public IP against your geo-CIDR data; an ABAC policy with a `deny` effect that matches all its conditions overrides an ACL allow.

## 7. Enforcement & verification

- **Verify intent:** run `acl-evaluate` for the path and read `matched_rule`. If `allowed` is false, the rule/layer named is the cause.
- **Posture interaction:** a `posture_compliant:false` with `allowed:true` means the device is non-compliant but posture is in monitor/disabled mode (see [Device posture](/guide/admin/device-posture/)).
- **Quarantine** a suspect device (`machine-admin` `quarantine`) to deny it everything immediately; **lockdown** the whole org for an incident.

## 8. Limits & honest scope

- **First-match-wins on priority.** A broad allow at a low priority number shadows narrower rules below it — order matters.
- **JIT expiry is evaluated lazily** at decision time; an expired rule is skipped, not auto-deleted.
- **ABAC time/day are UTC.** Convert local windows accordingly.
- **`source_country` needs geo-CIDR data** and a known public IP, or the condition simply doesn't match.
- ACLs gate the mesh, not the public internet.

## 9. Audit events

Route and device actions are audited: `machine.exit_node_approved`, `machine.exit_node_rejected`, plus approve/quarantine/lock/wipe events. Rule changes go through the gated CRUD API. Review them on [Observability](/guide/admin/observability/).

## 10. Troubleshooting

- **Everything is allowed** → you're still on the fresh-org default allow-all rule; replace it.
- **A change didn't apply** → rule cache TTL is 300s; it normally clears on write, but allow a moment.
- **Allowed but unreachable** → not an ACL problem; check posture (enforce), route approval, or the data plane.
- **Geo/time rule never triggers** → remember UTC for time, and that geo needs resolvable public IPs.
