---
title: "CASB & Shadow IT discovery"
description: "Discover shadow-IT SaaS from DNS logs, classify apps by risk, and enforce per-app allow/block/alert policies with an approval workflow — QuickZTNA CASB Lite."
section: "admin"
order: 6
updatedAt: 2026-06-16
primaryKeyword: "CASB shadow IT discovery"
faq:
  - q: "Does CASB inspect the contents of SaaS traffic?"
    a: "No. QuickZTNA CASB Lite works at the DNS layer. It discovers which SaaS apps your fleet resolves by analysing DNS query logs, and it enforces by blocking DNS resolution for apps you mark as blocked. It does not proxy HTTPS, terminate TLS, or inspect payloads — so it sees that slack.com was queried, not what was sent. For content inspection on file transfers and remote sessions, see the file-scan DLP page."
  - q: "Why is my Shadow IT dashboard empty?"
    a: "CASB discovery is built entirely from the DNS query log. If DNS query logging is off, there is nothing to analyse. Turn on DNS filtering with 'Log queries' enabled (DNS filtering page), let the fleet generate traffic, and the hourly discovery cron will populate the catalog matches. Newly-seen apps appear with status 'discovered' and action 'monitor'."
  - q: "What happens when I mark an app as blocked?"
    a: "The next time any device's DNS resolver checks one of that app's domains, the API returns a block verdict and the lookup fails — the app stops resolving fleet-wide within seconds. A determined user who hardcodes an IP or uses an external resolver can bypass DNS-layer blocking; pair it with ACLs or an egress firewall for hard enforcement."
  - q: "Can a regular user request access to an app?"
    a: "Yes. Any org member can call request_app_access (or use the dashboard) to request that an app be sanctioned or unsanctioned, with a business justification. Admins review pending requests and approve or deny them; approving auto-applies the matching policy (sanctioned to allow, unsanctioned to block)."
---

CASB & Shadow IT discovery answers a question most teams cannot answer honestly: **which SaaS apps is my workforce actually using?** QuickZTNA calls this **CASB Lite** because it is deliberately scoped — it discovers and governs SaaS at the DNS layer, not with an inline forward proxy. That scope is the honest trade-off: zero extra agents, zero TLS interception, but visibility into *which* apps are touched, not *what* data moves through them.

## 1. What it is — and its honest scope

CASB Lite has two halves:

- **Discovery** — it reads your existing DNS query logs, matches resolved domains against a catalog of ~hundreds of known SaaS apps, and builds a ranked list of discovered apps with a risk score, category, vendor, and query volume.
- **Governance** — for each discovered (or custom-added) app you set a **status** (sanctioned / unsanctioned / under review / discovered) and an **action** (allow / block / alert / monitor). The action is enforced by the same DNS resolver that powers DNS filtering.

What it is **not**: it is not a reverse proxy, it does not do TLS termination or man-in-the-middle inspection, and it does not see file contents or form fields. If you need to catch a credit-card number leaving in a file or an SSH session, that is the [file-scan DLP](/guide/admin/dlp/) layer, not CASB.

## 2. How it works

```
                 device DNS resolver
                         │  check_domain("zoom.us")
                         ▼
        ┌──────────────────────────────────────┐
        │  POST /api/dns-filter  check_domain    │
        │   1. custom allowlist  (wins)          │
        │   2. custom blocklist                  │
        │   3. threat-feed cache                 │
        │   4. CASB policy  ◄── checkCasbPolicy() │
        │   5. clean → allow                     │
        └───────────────┬──────────────────────┘
                        │ match domain → saas_app_catalog
                        ▼
            casb_app_policies (org_id, app)
              action = block → DNS blocked
              action = alert → allowed + logged
              action = allow/monitor → allowed
                        │
   every DNS lookup ────┘ writes dns_query_log (if logging on)
                        │
        hourly cron: runCasbDiscovery()
          scans dns_query_log (last 24h)
          → upserts casb_app_usage
          → auto-creates 'discovered'/'monitor' policy
```

The loop is self-reinforcing: DNS logging feeds discovery, discovery surfaces apps, you set policy, and the policy is enforced on the next lookup. The discovery cron runs hourly and only touches orgs that already have at least one CASB policy row.

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Plan** | CASB is gated by the `casb` feature flag — available on paid plans. A gated call returns `403 FEATURE_GATED`. See [Plans & billing](/guide/admin/billing/). |
| **DNS query logging** | Discovery has no input without it. On the [DNS filtering](/guide/admin/dns-filtering/) page, enable the policy with **Log queries** on. |
| **Role** | Reading the dashboard and catalog needs org membership; setting policy, adding apps, and reviewing requests need **admin**. |

## 4. Step-by-step: govern a newly-discovered app

1. Open **Dashboard → Workforce → CASB / Shadow IT**. The summary shows total apps discovered, how many are sanctioned / unsanctioned / under review, how many are unknown, and how many are high-risk (risk score ≥ 7).
2. Sort by query volume. For each high-traffic unknown app, click it to open the detail view — domains, 30-day query trend, and per-domain activity.
3. Decide a **status** and **action**. A typical pattern: sanction the apps you've standardised on (`sanctioned` + `allow`), block the risky duplicates (`unsanctioned` + `block`), and leave the rest on `monitor` while you investigate.
4. For bulk clean-up, select several apps and apply one policy (up to 50 per request).
5. If users need an app you haven't catalogued, add it as a **custom app** with its domains, category, and a risk score, then set policy on it like any other.

## 5. Worked examples

All calls are `POST https://login.quickztna.com/api/casb` with a Bearer JWT and a JSON body containing `action` and `org_id`. The dashboard uses the exact same surface (via the `/api/functions/casb` alias).

**Pull the Shadow IT dashboard (last 30 days):**

```bash
curl -s https://login.quickztna.com/api/casb \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_shadow_it_dashboard","org_id":"'"$ORG"'","days":30,"limit":200}'
# → { summary: { total_apps_discovered, sanctioned, unsanctioned, high_risk, ... }, apps: [ ... ] }
```

**Sanction an app and allow it:**

```bash
curl -s https://login.quickztna.com/api/casb \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"action":"set_app_policy","org_id":"'"$ORG"'",
       "app_catalog_id":"<uuid>","status":"sanctioned","policy_action":"allow",
       "notes":"Approved collaboration tool"}'
```

**Block an unsanctioned app:**

```bash
curl -s https://login.quickztna.com/api/casb \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"action":"set_app_policy","org_id":"'"$ORG"'",
       "app_catalog_id":"<uuid>","status":"unsanctioned","policy_action":"block"}'
```

**Add a custom (uncatalogued) app:**

```bash
curl -s https://login.quickztna.com/api/casb \
  -H "Authorization: Bearer $ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"action":"add_custom_app","org_id":"'"$ORG"'",
       "name":"Acme Internal Wiki","category":"productivity",
       "domains":["wiki.acme.com","*.acme-wiki.com"],"risk_score":3,"vendor":"Acme"}'
```

**The approval workflow** — a member requests, an admin reviews:

```bash
# Member requests an app be sanctioned, with justification:
curl -s https://login.quickztna.com/api/casb -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"request_app_access","org_id":"'"$ORG"'","app_catalog_id":"<uuid>",
       "requested_status":"sanctioned","business_justification":"Design team needs Figma"}'

# Admin lists pending requests:
curl -s https://login.quickztna.com/api/casb -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"list_app_requests","org_id":"'"$ORG"'","state":"pending"}'

# Admin approves — auto-applies the policy (sanctioned → allow):
curl -s https://login.quickztna.com/api/casb -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"approve_app_request","org_id":"'"$ORG"'","request_id":"<uuid>","decision":"approved"}'
```

## 6. Configuration reference

| Field | Values | Meaning |
| --- | --- | --- |
| `status` | `sanctioned`, `unsanctioned`, `under_review`, `discovered` | Governance label. `discovered` is the auto-assigned default. |
| `policy_action` | `allow`, `block`, `alert`, `monitor` | Enforcement behaviour at the DNS layer. `monitor` is the default. |
| `risk_score` | integer `1`–`10` | Catalog risk. Unknown apps surface as `9`. The dashboard treats `≥ 7` as high-risk. |
| `category` | `collaboration`, `storage`, `development`, `crm`, `hr`, `finance`, `marketing`, `social_media`, `ai`, `email`, `security`, `analytics`, `communication`, `productivity`, `design`, `project_management` | 16 fixed categories. |
| `domains` | array of patterns | Exact (`slack.com`) or wildcard (`*.slack.com`) matched case-insensitively. |
| `requested_status` | `sanctioned`, `unsanctioned` | What a member can request. |
| request `state` | `pending`, `approved`, `denied`, `cancelled` | Lifecycle of an access request. |

**Action semantics at enforcement time:** `block` fails the DNS lookup (`reason: casb_policy`); `alert` allows the lookup but logs it (`reason: casb_alert:<app>`); `allow` and `monitor` resolve normally. Approving a request auto-creates a policy — `sanctioned` → `allow`, `unsanctioned` → `block` — unless you pass `apply_policy: false`.

## 7. Enforcement & verification

Blocking is real but DNS-scoped. To confirm a block is live:

1. Set the app's action to `block`.
2. From a managed device, resolve one of its domains — the lookup should fail.
3. On the [DNS filtering](/guide/admin/dns-filtering/) page, open **Query logs** (or `get_query_logs`) and confirm a `blocked` row with reason `casb:<app_name>`.

Because enforcement runs through the device's DNS resolver, it applies fleet-wide the moment the policy is saved — there is no client redeploy.

## 8. Limits & honest scope

- **DNS-layer only.** No TLS inspection, no payload visibility, no per-user-within-an-app control. CASB sees domains, not data.
- **Discovery depends on DNS logging.** No `log_queries`, no discovery. It is also blind to apps reached by raw IP or a non-managed resolver.
- **Catalog matching is domain-based.** Apps not in the catalog show up as `unknown` (risk 9) keyed by domain until you add them as custom apps.
- **Bulk policy is capped at 50 apps per request**; the catalog query is capped at 1000 rows.
- This is governance, not a hard egress control. For non-bypassable enforcement, combine CASB with [ACLs](/guide/admin/access-control/) and network egress rules.

## 9. Audit events

Every governance action writes to the audit log (visible on the [Observability](/guide/admin/observability/) page):

| Event | When |
| --- | --- |
| `casb.policy_set` | An app's status/action is changed |
| `casb.bulk_policy_set` | A bulk policy update is applied |
| `casb.app_added` | A custom app is added to the catalog |
| `casb.request_created` | A member requests app access |
| `casb.request_reviewed` | An admin approves or denies a request |

## 10. Troubleshooting

- **Dashboard empty / no apps** → DNS query logging is off, or the fleet hasn't generated traffic yet. Enable logging and wait for the hourly cron.
- **`403 FEATURE_GATED`** → CASB isn't in your plan; upgrade or check the gate on [Plans & billing](/guide/admin/billing/).
- **Policy saved but app still resolves** → confirm DNS filtering is enabled (CASB enforcement runs inside the DNS check), and that the device uses the managed resolver. A cached or external resolver bypasses it.
- **Plan change didn't take effect** → the feature cache has a 600-second TTL per org; allow a minute or re-check.
