---
title: "Device posture & compliance"
description: "Require a device security baseline — disk encryption, firewall, antivirus, patch age — in enforce, monitor, or disabled mode, with auto-quarantine of failing devices."
section: "admin"
order: 4
updatedAt: 2026-06-16
primaryKeyword: "device posture compliance ZTNA"
faq:
  - q: "What is the difference between enforce, monitor, and disabled?"
    a: "Disabled (the default) stores posture reports but never gates access. Monitor evaluates compliance and records violations, but a failing device is still allowed to connect — use it to measure impact before turning the screws. Enforce blocks: a non-compliant device that is online is auto-quarantined, and a quarantined device that becomes compliant again is auto-reactivated. Posture only denies access in enforce mode."
  - q: "Which posture signals does QuickZTNA check?"
    a: "The agent reports OS version, disk-encryption state, host-firewall state, antivirus/anti-malware presence, and patch age in days. Your posture policy chooses which to require (require_disk_encryption, require_firewall, require_antivirus, max_patch_age_days). Anything not required is recorded but doesn't cause a violation."
  - q: "A device is stuck quarantined even though it looks healthy — why?"
    a: "Access decisions read the latest posture report. If the most recent report is non-compliant (or stale and failing) and the org is in enforce mode, the device stays denied until a fresh compliant report arrives. Have the device re-report posture; if it's genuinely healthy, the next report flips it back to online automatically."
  - q: "Can posture trigger automatic remediation?"
    a: "Yes, if the AI Operator is enabled with remediation rules. When a device is auto-quarantined for a missing firewall or disk encryption, the operator can prepare a pending enable_firewall or enable_disk_encryption command for that machine (expiring in an hour). It is prepared, not silently run — see the AI Operator page for the confirm/apply model."
---

Device posture is the "healthy device" half of Zero Trust: an approved user on a **non-compliant** device should not reach sensitive resources. QuickZTNA evaluates a device's security baseline from what the agent reports and, in enforce mode, removes failing devices from the mesh automatically.

## 1. What it is — and its honest scope

The agent reports a small, well-defined set of signals; your org's posture policy decides which are **required**; the server evaluates compliance and (in enforce mode) acts on it. The signals are **self-reported attestation** from the client — practical and zero-friction, but not hardware-rooted. A fully-compromised endpoint could misreport. Treat posture as a strong hygiene gate, not a tamper-proof root of trust.

## 2. How it works

```
  agent → POST /api/posture-report   (node_key auth)
     { os_version, disk_encrypted, firewall_enabled, antivirus_enabled, patch_age_days }
         │
         ▼
   org_settings.posture_enforcement?
     ├─ disabled → store report, compliant=true, no gating
     ├─ monitor  → evaluate vs posture_policies, record violations, DO NOT block
     └─ enforce  → evaluate; if non-compliant & online → QUARANTINE
                                if compliant & quarantined → REACTIVATE
         │
         ├─ writes posture_reports (one row per machine, latest wins)
         ├─ updates the device risk score
         └─ enforce + AI Operator on → prepare remediation command(s)
```

Separately, the [access-control evaluator](/guide/admin/access-control/) reads the **latest** posture report on every connection: a non-compliant device is denied **only** when the org is in enforce mode. That design is deliberate — it means a stale failing report can't permanently isolate a node in monitor/disabled mode.

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Mode** | Set `org_settings.posture_enforcement` to `monitor` or `enforce` (default `disabled`). |
| **Policy** | Create an enabled row in `posture_policies` choosing the required signals. |
| **Client** | The agent reports posture automatically on the workforce build. |
| **Plan note** | Posture evaluation at connect is broadly available; **continuous** re-evaluation is a paid-plan capability. See [Plans & billing](/guide/admin/billing/). |

## 4. Step-by-step: roll out posture safely

1. **Start in monitor.** Set `posture_enforcement: monitor` and define your policy (e.g. require disk encryption + firewall, max patch age 30 days).
2. **Measure.** Watch which devices report violations and who they belong to — without blocking anyone.
3. **Remediate the long tail.** Fix or exempt the devices that would break.
4. **Flip to enforce.** Now a non-compliant online device is auto-quarantined; fixing it auto-reactivates it.
5. **Optionally wire AI remediation** so common failures (firewall off, encryption off) get a prepared fix command.

## 5. Worked examples

**Set enforcement mode** (org setting; via the settings/CRUD surface the dashboard uses):

```bash
curl -s "https://login.quickztna.com/api/db/org_settings?org_id=$ORG" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -X PATCH -d '{"_filters":{"org_id":"'"$ORG"'"},"posture_enforcement":"monitor"}'
```

**Define a posture policy:**

```bash
curl -s "https://login.quickztna.com/api/db/posture_policies?org_id=$ORG" \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"org_id":"'"$ORG"'","enabled":true,"require_disk_encryption":true,
       "require_firewall":true,"require_antivirus":false,"max_patch_age_days":30}'
```

**What the agent reports** (`POST /api/posture-report`, node_key auth — shown for reference; the client does this):

```json
{ "node_key":"<node_key>", "os_version":"14.5", "disk_encrypted":true,
  "firewall_enabled":false, "antivirus_enabled":true, "patch_age_days":12 }
// → { compliant:false, violations:["firewall_required"], quarantined:true, mode:"enforce" }
```

A user can check their own device with `ztna posture` from the CLI.

## 6. Configuration reference

| Setting / field | Values | Meaning |
| --- | --- | --- |
| `posture_enforcement` (org) | `disabled`, `monitor`, `enforce` | Gating behaviour; default `disabled` |
| `require_disk_encryption` | boolean | Require FileVault / BitLocker / LUKS on |
| `require_firewall` | boolean | Require the host firewall on |
| `require_antivirus` | boolean | Require AV / anti-malware present |
| `max_patch_age_days` | integer | Max days since last OS patch |

**Reported signals:** `os_version`, `disk_encrypted`, `firewall_enabled`, `antivirus_enabled`, `patch_age_days`.

**Violation codes:** `disk_encryption_required`, `firewall_required`, `antivirus_required`, `patch_age_exceeded (<n> > <max> days)`.

## 7. Enforcement & verification

- **Verify a quarantine:** in enforce mode, a non-compliant report flips the device to `quarantined`; the [ACL evaluator](/guide/admin/access-control/) then denies it with `matched_rule: machine_status_policy`. Confirm in the device list and the audit log.
- **Verify recovery:** fix the device, let it re-report; status returns to `online` and the `machine.auto_unquarantine` event is written.
- **Composes with ACLs:** a connection must pass posture **and** ACLs — a compliant contractor laptop still can't reach prod unless a rule allows it.

## 8. Limits & honest scope

- **Self-reported signals.** Posture is attestation from the agent; it is not a hardware-rooted measurement.
- **Latest report governs.** There is one report per machine; the newest wins. A device that stops reporting keeps its last verdict.
- **Enforce auto-quarantines only `online` devices** at report time; offline devices are flagged but acted on when they return.
- **Posture only denies in enforce mode** — monitor records violations without blocking.

## 9. Audit events

`machine.auto_quarantine` (with the violation list), `machine.auto_unquarantine`, and — when AI remediation is wired — `ai.auto_remediation_prepared`. All visible on [Observability](/guide/admin/observability/).

## 10. Troubleshooting

- **No reports** → device not on the workforce build, or mode is `disabled` and you're not looking at stored reports.
- **Device won't leave quarantine** → it must send a *fresh compliant* report; have it re-evaluate posture.
- **Monitor shows violations but nothing's blocked** → expected; that's monitor mode. Flip to enforce when ready.
- **Want automatic isolation** → enable auto-quarantine so a failed posture check removes the device from the mesh until it complies.
