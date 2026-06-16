---
title: "Data Loss Prevention (DLP)"
description: "Detect secrets and sensitive data — credit cards, SSNs, AWS keys, private keys — in files with regex patterns, then alert via SIEM and webhooks. Detection, not block."
section: "admin"
order: 7
updatedAt: 2026-06-16
primaryKeyword: "data loss prevention DLP"
faq:
  - q: "Does QuickZTNA DLP block a file transfer in progress?"
    a: "No. The shipping DLP is detect-and-alert: when a managed device scans a file and a pattern matches, it records a dlp_events row, emits a dlp_violation security event, and fires any configured webhook — but it does not interrupt the transfer inline. Treat it as a tripwire and detective control, not an inline gateway. A 'block' mode exists in the policy schema for future use; the deployed client agent detects and reports."
  - q: "What data does DLP actually scan today?"
    a: "File content on managed devices, against the enabled regex patterns. Clipboard and remote-session (SSH) content scanning are defined server-side but are not in the shipping client agent yet — do not rely on them. The matched content stored with each event is partially masked so the dashboard shows the hit without persisting the full secret."
  - q: "How do I test a pattern without waiting for a real hit?"
    a: "Use the scan_text action (or the dashboard's test box). Paste up to 100 KB of sample text and the API returns which enabled patterns matched and how many times, using your org's exact enabled-pattern set. It is a dry run — it does not create events."
  - q: "Can I add my own patterns?"
    a: "Yes. update_policy accepts custom_patterns — an array of { id, label, regex, severity } objects evaluated alongside the built-ins. Invalid regexes are skipped safely. Use this for internal identifiers like employee IDs or project codenames."
---

QuickZTNA's DLP is a **lightweight, detective** data-loss control: managed devices scan file content for sensitive patterns — secrets, PII, payment data — and report matches centrally with severity, machine, user, and a masked snippet. It is intentionally honest about its scope: it **detects and alerts**, it does not sit inline and kill transfers.

## 1. What it is — and its honest scope

- **In scope today:** regex pattern matching on **file content** on managed devices, central event collection, severity classification, SIEM (`dlp_violation`) emission, and webhook alerting.
- **Defined but not shipped in the client:** clipboard-content and remote-session (SSH) scanning exist in the data model and server contract, but the deployed client agent performs **file scanning only**. Don't position those to stakeholders as live.
- **Not a block:** the model carries a `mode` of `alert` or `block`, but the shipping agent is detect-and-alert. Nothing is interrupted mid-flight.

This is the truthful boundary. DLP here is a high-signal tripwire that tells you a secret left a machine — it is not a substitute for an inline secure web gateway.

## 2. How it works

```
  managed device (file scan)
        │ pattern match (e.g. AWS key in /tmp/creds.txt)
        ▼
  POST /api/dlp  report_from_agent   (node_key auth, batched ≤500)
        │
        ├─► dlp_events row  (severity, pattern_id, masked content, file_path, machine)
        ├─► security_events: dlp_violation   ──► SIEM export
        └─► webhook "dlp.violation"  ──► forwardWebhooks + policy alert_webhook (HTTPS)
```

The client pulls its config with `get_agent_config` (enabled flag, mode, and the resolved pattern set), scans locally, and batches matches back. Because matching happens on-device, raw secrets are masked before the snippet is sent — the dashboard shows `AKIA****MPLE`, not the full key.

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Plan** | DLP is gated by the `dlp` feature flag (paid plans). A gated call returns `403 FEATURE_GATED`. |
| **Policy** | Create/enable the org DLP policy with `update_policy` (or the dashboard), set `enabled: true`, and choose which patterns are active. |
| **Client** | Devices run the workforce build of the agent; it fetches `get_agent_config` and begins file scanning. |
| **Role** | Reading the policy needs membership; changing it, listing events, and deleting events need **admin**. |

## 4. Step-by-step: stand up DLP

1. **Dashboard → Workforce → DLP**. Toggle the policy on.
2. Pick your **enabled patterns** from the built-in set (below). Start with `critical`/`high` patterns (AWS keys, private keys, credit cards, SSNs) to keep noise down.
3. Optionally add **custom patterns** for your own identifiers.
4. Configure an **alert webhook** (HTTPS only) and an **alert severity** floor so you only page on, say, `critical`.
5. Use the **test box** (`scan_text`) to sanity-check your pattern set against representative samples before going live.
6. Watch **events** roll in; triage by severity, machine, and user.

## 5. Worked examples

All calls are `POST https://login.quickztna.com/api/dlp` with a Bearer JWT (except `report_from_agent`, which authenticates with a device `node_key`).

**Read the policy + built-in patterns:**

```bash
curl -s https://login.quickztna.com/api/dlp -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_policy","org_id":"'"$ORG"'"}'
# → { policy: {...}, builtin_patterns: [ {id:"aws_access_key", severity:"critical", ...}, ... ] }
```

**Enable DLP with a chosen pattern set and a custom pattern:**

```bash
curl -s https://login.quickztna.com/api/dlp -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_policy","org_id":"'"$ORG"'","enabled":true,"mode":"alert",
       "enabled_patterns":["aws_access_key","private_key","credit_card","ssn"],
       "custom_patterns":[{"id":"acme_empid","label":"Acme Employee ID",
                           "regex":"ACME-[0-9]{6}","severity":"medium"}],
       "alert_webhook":"https://hooks.example.com/dlp"}'
```

**Dry-run a scan (no event created):**

```bash
curl -s https://login.quickztna.com/api/dlp -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"scan_text","org_id":"'"$ORG"'","text":"key=AKIAIOSFODNN7EXAMPLE"}'
# → { matches: [{pattern_id:"aws_access_key", severity:"critical", match_count:1}], scanned_length: 22 }
```

**List recent events (admin), filter by severity:**

```bash
curl -s https://login.quickztna.com/api/dlp -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_events","org_id":"'"$ORG"'","severity":"critical","limit":50}'
# → { events: [...], stats: [{severity, count}, ...] }  (stats = last 30 days)
```

## 6. Built-in patterns & configuration reference

| Pattern ID | Detects | Severity |
| --- | --- | --- |
| `aws_access_key` | AWS access key ID (`AKIA…`) | **critical** |
| `private_key` | PEM private-key header | **critical** |
| `credit_card` | Visa / MC / Amex / Discover PANs | high |
| `ssn` | US Social Security Number | high |
| `api_key_generic` | `api_key = …` style secrets (20+ chars) | high |
| `password_in_text` | `password: …` in plaintext | high |
| `email_bulk` | 5+ email addresses together | medium |
| `jwt_token` | JWT (`eyJ….eyJ….sig`) | medium |

| Policy field | Values | Notes |
| --- | --- | --- |
| `enabled` | boolean | Master switch |
| `mode` | `alert`, `block` | Shipping agent honours `alert` (detect). `block` is reserved. |
| `enabled_patterns` | array of built-in IDs | Empty/unset → all built-ins active |
| `custom_patterns` | `[{id,label,regex,severity}]` | Bad regexes skipped safely |
| `alert_webhook` | HTTPS URL | Validated; HTTP and private endpoints rejected |
| `alert_severity` | `low`/`medium`/`high`/`critical` | Severity floor for the policy webhook |
| event `severity` | `low`/`medium`/`high`/`critical` | Per-event classification |

## 7. Enforcement & verification

DLP "enforcement" is detection. To verify the pipeline end-to-end:

1. Enable DLP with `aws_access_key` active.
2. On a managed device, write a file containing a sample key (`AKIAIOSFODNN7EXAMPLE`).
3. Within a scan cycle, confirm a new **critical** `dlp_events` row (masked content), a `dlp_violation` entry in the security event stream, and — if configured — a webhook delivery.

## 8. Limits & honest scope

- **Detect, not block.** No inline interruption of the transfer.
- **File content only** in the shipping client. Clipboard / SSH-session scanning is not deployed.
- **Regex matching** has the usual false-positive/negative trade-offs; tune `enabled_patterns` and severities.
- `scan_text` caps at **100 KB**; agent batches cap at **500 events** per report.
- Matched content is **masked** by design — you get enough to triage, not the raw secret.

## 9. Audit & event surface

DLP writes operational data to three places: `dlp_events` (the triage list), the `dlp_violation` **security event** (for SIEM), and a `dlp.violation` **webhook**. Policy changes themselves are made by admins through the gated API; review who changed what alongside the rest of your [audit log](/guide/admin/observability/).

## 10. Troubleshooting

- **No events ever** → policy not `enabled`, no patterns active, devices not on the workforce build, or no matching content generated.
- **Webhook not firing** → it must be **HTTPS** to a public endpoint; private/HTTP URLs are rejected at save time.
- **Too noisy** → narrow `enabled_patterns`, raise the `alert_severity` floor, or refine custom regexes; delete stale events with `delete_event`.
- **Expecting an inline block** → that's not what this is; pair DLP detection with [ACLs](/guide/admin/access-control/) and egress controls for prevention.
