---
title: "Observability: audit, compliance, metrics"
description: "Audit logs and SIEM export, compliance reports and policy-drift findings, threat-intelligence lookups, client metrics in Prometheus format, and the secrets vault."
section: "admin"
order: 5
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA audit compliance metrics"
faq:
  - q: "How long are audit logs retained?"
    a: "Plan-dependent: 90 days on Free (queryable from the dashboard), one year on Business (queryable via API, exportable to SIEM), and configurable on Workforce. Events cover admin actions, authentication, policy decisions, and posture results."
  - q: "Can I scrape QuickZTNA client metrics into Prometheus?"
    a: "Yes. 'ztna metrics print' emits Prometheus-format metrics to stdout, and 'ztna metrics write <path>' writes them for the node_exporter textfile collector. The daemon also exposes diagnostics via 'ztna debug metrics'."
---

Once QuickZTNA is enforcing access and running workforce-security features, the questions become observability ones: what happened, did it meet a compliance control, and how is the fleet doing. This page covers the audit log, compliance reporting, threat intelligence, client metrics, and the secrets vault.

## Audit log

Every meaningful action is logged: admin actions (user/device/key/policy changes), authentication events, policy decisions (allow/deny with the matching rule), and posture results. Each entry has a stable event type, timestamp, actor, and subject.

Retention is plan-dependent — **90 days (Free), one year (Business), configurable (Workforce)** — and the log is queryable from the dashboard and, on paid plans, the API, with export to SIEM formats. From the CLI:

```bash
ztna audit list      # recent audit entries
```

When a user reports "I can't reach X," the audit log usually has the answer in seconds: the denied connection and the rule that produced it.

## Compliance reporting

Generate a compliance report from the CLI or dashboard:

```bash
ztna compliance report
```

QuickZTNA also performs **policy-drift analysis** — comparing your configuration against baselines (e.g. NIST / CIS / OWASP-aligned checks) and surfacing concrete findings such as overly broad ACL rules or missing posture enforcement. Our [compliance blog posts](/blog/nis2-remote-access-requirements) map QuickZTNA controls to frameworks like NIS2 and DORA.

## Threat intelligence

Check an indicator (IP, domain, or file hash) against threat intelligence:

```bash
ztna threat check 203.0.113.10
ztna threat check evil.example.com
```

Threat-intel matches also feed the user-risk score (see [Workforce security](/guide/admin/workforce/)).

## Client metrics

The client exposes Prometheus-format metrics for fleet monitoring:

```bash
ztna metrics print                                 # to stdout
ztna metrics write /var/lib/node_exporter/ztna.prom  # node_exporter textfile collector
ztna debug metrics                                 # daemon-internal diagnostics
```

Scrape these into your existing Prometheus/Grafana stack to dashboard connectivity, peer counts, and relay vs direct path ratios.

## Secrets vault

QuickZTNA includes an encrypted **secrets vault** for storing and rotating credentials accessible to your org:

```bash
ztna secrets list
ztna secrets set <name>
ztna secrets get <name>       # prints to stdout
ztna secrets rotate <name>
ztna secrets delete <name>
```

## Next

- [Plans & billing](/guide/admin/billing/) — what's gated where, and how billing works.
- [Security model](/docs/security/) — the cryptographic and trust details behind the audit surface.
