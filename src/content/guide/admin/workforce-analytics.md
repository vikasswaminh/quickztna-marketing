---
title: "Workforce analytics & user-risk"
description: "Opt-in workforce analytics: session and schedule tracking, DNS productivity categories, software inventory and patch overview, plus seven-factor user-risk scoring."
section: "admin"
order: 9
updatedAt: 2026-06-16
primaryKeyword: "workforce analytics user risk scoring"
faq:
  - q: "Is workforce monitoring on by default?"
    a: "No. Every analytics capability is off by default and opt-in per org via workforce_settings — window_tracking_enabled, dns_analytics_enabled, software_inventory_enabled, each separately. Nothing is collected until an admin turns it on, and the platform records an explicit monitoring acknowledgment per user. Treat enabling this as a policy and legal decision, not just a toggle."
  - q: "What does user-risk scoring actually measure?"
    a: "Seven weighted behavioural factors per user: failed logins (25%), login-IP diversity / impossible travel (20%), posture violations on owned machines (20%), off-hours activity (15%), privilege level (10%), dormancy (10%), and threat-intel hits on owned machine IPs (10%). Each factor is surfaced with its detail so you can see why a score is what it is, not just the number."
  - q: "Does QuickZTNA log keystrokes or screen contents?"
    a: "No keylogging or screen capture. Activity reports record interval-level signals — activity level, active process name, window-switch counts, aggregate keyboard/mouse event counts, and whether a meeting app is in use — not the keys pressed or screen pixels. Data only exists if window tracking is enabled and the device reports it."
  - q: "How long is analytics data kept?"
    a: "By the activity_retention_days setting (default 90). Older activity is pruned. Set it to match your data-retention policy."
---

Workforce analytics is QuickZTNA's optional visibility layer for distributed teams: session and schedule tracking, DNS-based productivity categories, software inventory and patch posture, and per-user risk scoring. It is **off by default, opt-in per capability, and consent-gated** — because it is workforce monitoring, and that carries real policy and legal responsibility.

## 1. What it is — and the opt-in/consent model

Three independent switches in `workforce_settings` control collection: `window_tracking_enabled`, `dns_analytics_enabled`, and `software_inventory_enabled`. Each user records a **monitoring acknowledgment** (with a policy version) before their activity is shown. Retention is bounded by `activity_retention_days` (default 90).

Everything here is gated by the `workforce_analytics` feature (Business and above); user-risk scoring has its own `user_risk_scoring` gate.

## 2. How it works

```
  device agent (only what's enabled) ──► server tables ──► dashboard
    sessions       → machine_sessions      → session summary, schedule compliance
    DNS analytics  → dns_analytics          → productivity categories (work/neutral/distraction)
    window/activity→ activity_reports        → activity timeline, top apps  (consent required)
    software       → software_inventory      → approved vs unapproved, patch_status
  audit log + posture + threat → user-risk (7 weighted factors, cached)
```

## 3. Enable it

| Step | How |
| --- | --- |
| **Plan** | `workforce_analytics` gate (Business+); `user_risk_scoring` for risk scores. |
| **Settings** | Turn on only the collection you need (`update_settings`). |
| **Consent** | Ensure each user acknowledges monitoring (`acknowledge_monitoring`); the platform stamps a policy version. |
| **Schedule** | Optionally set a work schedule (timezone, hours, days) for compliance reporting. |

## 4. Step-by-step: stand up analytics responsibly

1. **Decide policy first.** Document what you collect and why, and make sure your monitoring notice is current.
2. **Enable selectively** — e.g. `software_inventory_enabled` for security hygiene without `window_tracking_enabled`.
3. **Confirm consent** is acknowledged across the org.
4. **Set retention** to your policy (`activity_retention_days`).
5. **Set a schedule** if you want schedule-compliance reporting.
6. **Review user-risk** for outliers and investigate the contributing factors, not just the score.

## 5. Worked examples

All at `POST https://login.quickztna.com/api/workforce-analytics` (or `/api/user-risk`) with a Bearer JWT.

**Enable only software inventory + DNS analytics:**

```bash
curl -s https://login.quickztna.com/api/workforce-analytics -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_settings","org_id":"'"$ORG"'",
       "software_inventory_enabled":true,"dns_analytics_enabled":true,
       "window_tracking_enabled":false,"activity_retention_days":60}'
```

**Set a work schedule, then read compliance:**

```bash
curl -s https://login.quickztna.com/api/workforce-analytics -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_schedule","org_id":"'"$ORG"'","timezone":"Asia/Kolkata",
       "work_start":"09:30","work_end":"18:30","work_days":[1,2,3,4,5]}'

curl -s https://login.quickztna.com/api/workforce-analytics -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"schedule_compliance","org_id":"'"$ORG"'"}'
# → compliance[]: { machine, date, first_seen, last_seen, started_late, left_early, compliant }
```

**Categorise productivity** (mark a domain a distraction):

```bash
curl -s https://login.quickztna.com/api/workforce-analytics -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"productivity_rules_add","org_id":"'"$ORG"'",
       "pattern":"news.example.com","pattern_type":"domain","category":"distraction"}'
```

**Compute a user-risk score** (`/api/user-risk`):

```bash
curl -s https://login.quickztna.com/api/user-risk -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"calculate_risk","org_id":"'"$ORG"'","target_user_id":"<user>"}'
# → { score, factors:[{type:"failed_logins", detail, impact, weight}, ...] }
```

## 6. Configuration reference

**`workforce_settings`:** `window_tracking_enabled`, `dns_analytics_enabled`, `software_inventory_enabled` (booleans), `activity_retention_days` (default 90).

**Work schedule:** `timezone`, `work_start`, `work_end`, `work_days` (array of 0–6, Sun–Sat).

**Productivity categories:** `work`, `neutral`, `distraction`, `uncategorized`. Rules: `pattern_type` ∈ {`domain`,`app`}, `category` ∈ {`work`,`neutral`,`distraction`}.

**Software inventory:** `software_list` (filter by `approval_status` approved/unapproved), `software_compliance`, `patch_overview`, plus `approved_software` patterns (optionally `required`).

**User-risk factors & weights:** failed_logins (0.25), ip_diversity (0.20), posture_violations (0.20), off_hours (0.15), privilege_level (0.10), dormancy (0.10), threat_intel (0.10). Scores are cached briefly; non-admins can only compute their own.

## 7. Enforcement & verification

Workforce analytics is **observational** — it does not gate connections. (User-risk does feed the broader risk picture, and posture/threat already gate access via [access control](/guide/admin/access-control/).) Verify a capability is live by enabling it, generating activity on a consenting device, and confirming rows appear in the relevant summary.

## 8. Limits & honest scope

- **Opt-in, off by default**, per capability; **consent acknowledged per user**.
- **No keylogging or screen capture** — interval-level aggregate signals only.
- **Data depends on the agent reporting it** and on the matching setting being on.
- **Schedule times are evaluated in the configured timezone**; user-risk time windows are UTC.
- **Some risk factors are zero until configured** (e.g. threat-intel needs a provider).
- This is monitoring — using it lawfully (notice, consent, proportionality) is your responsibility.

## 9. Audit events

`workforce.settings_updated`, `workforce.schedule_updated`, `workforce.activity_viewed`, `workforce.rule_added` / `rule_deleted`, `workforce.approved_software_added` / `deleted`, and `monitoring.consent_acknowledged`. See [Observability](/guide/admin/observability/).

## 10. Troubleshooting

- **No data** → the relevant setting is off, consent not acknowledged, or the agent isn't reporting.
- **Schedule compliance empty** → no schedule configured, or no sessions in range.
- **`403 FEATURE_GATED`** → `workforce_analytics` (or `user_risk_scoring`) not in plan.
- **Risk score looks flat** → check which factors have data; some need audit history or a threat provider.
