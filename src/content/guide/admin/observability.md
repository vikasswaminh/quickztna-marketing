---
title: "Observability: audit, compliance, metrics"
description: "Audit logs and SIEM export, compliance reports and policy-drift findings, threat-intelligence lookups, client metrics in Prometheus format, and the secrets vault."
section: "admin"
order: 11
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA audit compliance metrics"
faq:
  - q: "How long are audit logs retained, and where do they live?"
    a: "Audit events are stored in a log backend (Loki) and queried through /api/audit. Retention is plan-dependent — roughly 90 days on Free (dashboard-queryable), longer on paid plans (API-queryable and exportable to SIEM). Events cover admin actions, authentication, policy decisions, and posture results, each with a stable type, timestamp, actor, and subject."
  - q: "What's the difference between compliance 'evaluate' and a compliance 'report'?"
    a: "Evaluate runs policy-drift analysis right now — it compares your live configuration against baselines (NIST/CIS/OWASP-aligned checks) and returns concrete findings such as overly broad ACL rules or missing posture enforcement. A report (generate_report / verify_report) produces a point-in-time compliance artifact you can store and later verify. Both are gated by the compliance_reports feature."
  - q: "Can I scrape QuickZTNA client metrics into Prometheus?"
    a: "Yes. 'ztna metrics print' emits Prometheus-format metrics to stdout, and 'ztna metrics write <path>' writes them for the node_exporter textfile collector. The daemon also exposes diagnostics via 'ztna debug metrics'. Scrape them to dashboard peer counts, relay-vs-direct ratios, and connectivity."
  - q: "How do I get events into my SIEM?"
    a: "Two paths: webhooks (DLP and other violation events are pushed to your configured HTTPS endpoint via the forwarding pipeline), and the data export endpoint (/api/export) for bulk pulls. On paid plans the audit log itself is API-queryable for scheduled SIEM ingestion."
---

Once QuickZTNA is enforcing access and running workforce features, the questions become observability ones: *what happened, did it meet a control, and how is the fleet doing?* This page covers the audit log, compliance evaluation and signed reports, threat intelligence, client metrics, and the secrets vault.

## 1. Audit log

Every meaningful action is logged: admin actions (user/device/key/policy changes), authentication events, policy decisions, and posture results — each with a stable event type, timestamp, actor, and subject. Audit data is stored in a log backend (Loki) and served through `/api/audit`.

```bash
# Recent entries (default 14-day window, max 5000):
curl -s "https://login.quickztna.com/api/audit?org_id=$ORG&mode=recent&limit=500" \
  -H "Authorization: Bearer $JWT"

# Count of a specific event type over a window:
curl -s "https://login.quickztna.com/api/audit?org_id=$ORG&mode=count&action=auth.login_failed&since_hours=720" \
  -H "Authorization: Bearer $JWT"
```

From the CLI: `ztna audit list`. When a user reports "I can't reach X," the audit log usually has the answer in seconds — the denied connection and the rule that produced it. (Writing audit entries via the API requires admin; reading requires membership.)

## 2. Compliance: drift evaluation + signed reports

**Policy-drift evaluation** (`POST /api/compliance`, action `evaluate`) compares your live configuration against NIST/CIS/OWASP-aligned baselines and returns concrete findings — e.g. wildcard ACL rules, missing posture enforcement, weak settings:

```bash
curl -s https://login.quickztna.com/api/compliance -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"evaluate","org_id":"'"$ORG"'"}'
```

**Signed reports** (`POST /api/compliance/reports`) capture a point-in-time artifact you can store and later verify:

```bash
# Generate, list, fetch, and verify:
-d '{"action":"generate_report","org_id":"'"$ORG"'"}'
-d '{"action":"list_reports","org_id":"'"$ORG"'"}'
-d '{"action":"get_report","org_id":"'"$ORG"'","report_id":"<id>"}'
-d '{"action":"verify_report","org_id":"'"$ORG"'","report_id":"<id>"}'
```

Both are gated by `compliance_reports`. Our [compliance blog posts](/blog/nis2-remote-access-requirements) map QuickZTNA controls to frameworks like NIS2 and DORA. The CLI shortcut is `ztna compliance report`.

## 3. Threat intelligence

Check an indicator against threat intelligence (`/api/threat-check`); matches are recorded in `threat_checks` and feed both the [ACL evaluator](/guide/admin/access-control/) (a recent `blocked` verdict denies) and the [user-risk score](/guide/admin/workforce-analytics/).

```bash
ztna threat check 203.0.113.10
ztna threat check evil.example.com
```

## 4. Client metrics (Prometheus)

The client exposes Prometheus-format metrics for fleet monitoring:

```bash
ztna metrics print                                    # to stdout
ztna metrics write /var/lib/node_exporter/ztna.prom   # node_exporter textfile collector
ztna debug metrics                                    # daemon-internal diagnostics
```

Scrape these into your Prometheus/Grafana stack to chart connectivity, peer counts, and relay-vs-direct path ratios.

## 5. Secrets vault

An encrypted, org-scoped vault for storing and rotating credentials (`/api/secrets`, gated by `secrets_vault`). Full lifecycle: `list_secrets`, `get_secret`, `create_secret`, `update_secret`, `delete_secret`, `rotate_secret`, version history (`list_versions`, `get_version`), and scheduled rotation (`configure_rotation`); built-in generators produce `uuid`, `hex`, `alphanumeric`, or `random` values.

```bash
ztna secrets list
ztna secrets set <name>
ztna secrets get <name>        # prints to stdout
ztna secrets rotate <name>
ztna secrets delete <name>
```

## 6. SIEM export & data export

- **Webhooks** — violation events (e.g. `dlp.violation`) are pushed to your configured HTTPS endpoint by the forwarding pipeline.
- **Bulk export** — `/api/export` pulls org data for archival or SIEM ingestion.
- **Audit query** — on paid plans, `/api/audit` is API-queryable for scheduled ingestion.

## 7. Audit event taxonomy (selected)

| Domain | Example events |
| --- | --- |
| CASB | `casb.policy_set`, `casb.request_reviewed`, `casb.app_added` |
| Posture | `machine.auto_quarantine`, `machine.auto_unquarantine` |
| Devices | `machine.exit_node_approved`, approve / quarantine / lock / wipe |
| Identity | `provisioning.commands_generated`, SCIM member changes |
| AI | `ai.acl_generated`, `ai.chat`, `ai.hard_blocked`, `ai.auto_remediation_prepared` |
| Workforce | `workforce.settings_updated`, `monitoring.consent_acknowledged` |
| Auth | `auth.login`, `auth.login_failed` |

## 8. Limits & honest scope

- **Retention is plan-dependent**; Free is the shortest window.
- **Audit reads need membership; writes need admin.**
- **Compliance evaluation reflects current config** — re-run after changes; reports are point-in-time.
- **Client metrics are per-node** — aggregate them in your own monitoring stack.

## 9. Verification

- **Audit:** make a change (e.g. set a CASB policy) and confirm the matching event appears in `mode=recent`.
- **Compliance:** run `evaluate` and confirm findings reflect a deliberately-broad rule.
- **Metrics:** `ztna metrics print` should emit non-empty Prometheus lines on a connected node.

## 10. Next

- [Plans & billing](/guide/admin/billing/) — what's gated where, and how billing works.
- [Security model](/docs/security/) — the cryptographic and trust details behind the audit surface.
