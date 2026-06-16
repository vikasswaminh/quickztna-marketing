---
title: "DNS filtering & threat feeds"
description: "Block malware, phishing, and C2 domains plus content categories at the DNS layer using free threat feeds and custom allow/blocklists, with per-query logging."
section: "admin"
order: 5
updatedAt: 2026-06-16
primaryKeyword: "DNS filtering threat feeds"
faq:
  - q: "Which threat feeds does QuickZTNA use, and do they cost extra?"
    a: "QuickZTNA ships ~14 free, public threat feeds — URLhaus, OpenPhish, PhishTank, abuse.ch Feodo/ThreatFox/SSL blacklist, Spamhaus DROP/EDROP, CrowdSec community, Steven Black's unified hosts, Disconnect tracking/ads, HageZi threat intelligence, and NoCoin. They cost nothing extra. You pick which to enable; the default set is URLhaus plus Steven Black."
  - q: "In what order are allow and block decisions made?"
    a: "Allowlist always wins first, then your custom blocklist, then the synced threat-feed cache, then CASB app policy, and finally a clean allow. So an explicit allowlist entry overrides every feed — use it to rescue a false positive without disabling a whole feed."
  - q: "Does enabling 'Log queries' have privacy implications?"
    a: "Yes — turning on query logging records the domains your devices resolve (domain, action, reason, timestamp) into dns_query_log. That log is also what powers CASB shadow-IT discovery. Leave it off if you don't want resolution history retained; turn it on if you want visibility and CASB."
  - q: "How fresh are the feeds?"
    a: "Synced feed entries are cached for 7 days and refreshed when an admin runs sync_feeds (capped at 50,000 domains and 10,000 IP ranges per feed). Run a sync after enabling new feeds; schedule periodic syncs to stay current."
---

DNS filtering is QuickZTNA's first line of network defence: it blocks known-bad domains — malware, phishing, command-and-control — and optional content categories **before a connection is ever made**, at the moment a managed device resolves a name. It's also the data source that powers [CASB shadow-IT discovery](/guide/admin/casb/), so the two features share one pipeline.

## 1. What it is

For every DNS lookup a managed device makes, its resolver asks the API for a verdict. The API checks the org's allowlist, blocklist, synced threat feeds, and CASB policy, returns allow/block, and (optionally) logs the query. Blocking is at the **resolution** layer — a blocked domain simply fails to resolve.

## 2. How it works — decision order

```
   check_domain("evil.example")
        │
        ▼
   1. custom ALLOWLIST   ── match → ALLOW   (allowlist always wins)
   2. custom BLOCKLIST    ── match → BLOCK  (reason: custom_blocklist)
   3. threat-FEED cache   ── match → BLOCK  (reason: feed:<name>)
   4. CASB app policy      ── block → BLOCK  (reason: casb:<app>)
                           └─ alert → allow + log (reason: casb_alert:<app>)
   5. clean               ──────── → ALLOW  (reason: clean)
        │
        └─► if log_queries: write dns_query_log (domain, action, reason, time)
```

Threat-feed data is fetched from public sources by `sync_feeds`, parsed (hosts files, plain domain lists, URL lists, and IP/CIDR lists), and cached in the database with a 7-day expiry. IP/CIDR feeds (Spamhaus, CrowdSec) populate a separate blocked-IP set.

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Plan** | Gated by the `dns_filtering` feature flag. (DNS filtering is part of even the Free plan's security baseline — confirm on [Plans & billing](/guide/admin/billing/).) |
| **Policy** | Create/enable with `update_policy`: set `enabled`, choose `blocked_categories` and `enabled_feeds`, and decide `log_queries` and `block_uncategorized`. |
| **Sync** | Run `sync_feeds` to populate the cache from your enabled feeds. |
| **Role** | Reading policy needs membership; changing policy, editing lists, and syncing need **admin**. |

## 4. Step-by-step: turn on filtering

1. **Dashboard → Security → DNS filtering**. Enable the policy.
2. Choose **feeds**. Start with `urlhaus` + `steven_black`; add `abuse_ch_threatfox`, `abuse_ch_feodo`, `phishtank_community`, and `spamhaus_drop` for broader coverage.
3. Choose **blocked categories** (e.g. `adult`, `gambling`) if you want content control beyond pure threats.
4. Decide **Log queries**. On = visibility + CASB discovery; off = no resolution history retained.
5. Run a **feed sync**. Re-sync periodically.
6. Add **allowlist** entries for any internal or wrongly-flagged domains, and **blocklist** entries for anything you want gone regardless of feeds.

## 5. Worked examples

All calls are `POST https://login.quickztna.com/api/dns-filter` with a Bearer JWT and `{action, org_id, …}`.

**Enable filtering with feeds, categories, and logging:**

```bash
curl -s https://login.quickztna.com/api/dns-filter -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"update_policy","org_id":"'"$ORG"'","enabled":true,"log_queries":true,
       "blocked_categories":["malware","phishing","c2"],
       "enabled_feeds":["urlhaus","steven_black","abuse_ch_threatfox","spamhaus_drop"]}'
```

**Sync the feeds (admin):**

```bash
curl -s https://login.quickztna.com/api/dns-filter -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"sync_feeds","org_id":"'"$ORG"'"}'
# → { total_domains: 412903, feeds: [{feed:"urlhaus", domains: 1234, status:"synced"}, ...] }
```

**Rescue a false positive (allowlist wins over every feed):**

```bash
curl -s https://login.quickztna.com/api/dns-filter -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"add_entry","org_id":"'"$ORG"'","list_type":"allow",
       "domain":"internal-tool.example.com","reason":"Internal app flagged by Steven Black"}'
```

**Block a domain outright:**

```bash
curl -s https://login.quickztna.com/api/dns-filter -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"add_entry","org_id":"'"$ORG"'","list_type":"block",
       "domain":"sketchy-file-share.example","reason":"Unsanctioned file sharing"}'
```

**Review what was blocked (last 24h stats + recent rows):**

```bash
curl -s https://login.quickztna.com/api/dns-filter -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"get_query_logs","org_id":"'"$ORG"'","action_filter":"blocked","limit":100}'
```

## 6. Configuration reference

| Field | Values | Notes |
| --- | --- | --- |
| `enabled` | boolean | Master switch |
| `blocked_categories` | `malware`, `phishing`, `c2`, `tracking`, `advertising`, `adult`, `gambling`, `social_media`, `streaming`, `gaming` | Content categories to block |
| `enabled_feeds` | feed keys (below) | Default: `urlhaus`, `steven_black` |
| `log_queries` | boolean | Records `dns_query_log`; required for CASB discovery |
| `block_uncategorized` | boolean | Stricter posture for unknown domains |
| `list_type` (entry) | `block`, `allow` | Custom per-domain override; allow wins |

**Threat feeds available:** `urlhaus`, `phishtank` (OpenPhish), `disconnect_tracking`, `disconnect_ad`, `steven_black`, `phishtank_community`, `abuse_ch_feodo`, `abuse_ch_threatfox`, `abuse_ch_ssl`, `spamhaus_drop`, `spamhaus_edrop`, `crowdsec_community`, `hagezi_threat`, `nocoin`.

**Query-log reason codes:** `allowlisted`, `custom_blocklist`, `feed:<name>`, `casb:<app>`, `casb_alert:<app>`, `clean`.

## 7. Enforcement & verification

1. Enable filtering and sync feeds.
2. From a managed device, resolve a known-bad test domain from one of your feeds — it should fail to resolve.
3. With `log_queries` on, call `get_query_logs` with `action_filter: blocked` and confirm the row with the matching `feed:<name>` reason.

## 8. Limits & honest scope

- **DNS-layer blocking.** Bypassable by a client hardcoding an IP or using a non-managed resolver — pair with [ACLs](/guide/admin/access-control/) and egress firewalling for hard enforcement.
- **Feed freshness is 7 days** per cache entry; you must run `sync_feeds` to refresh.
- **Per-org caps:** 10,000 custom filter entries; 50,000 cached domains and 10,000 IP ranges per feed.
- Feeds are third-party and public — false positives happen; that's what the allowlist is for.

## 9. Audit & data surface

DNS filtering writes to `dns_query_log` (when logging is on), `dns_feed_cache`, and `threat_blocked_ips`. Policy and list changes are admin-gated API calls; review them with the rest of your [audit trail](/guide/admin/observability/).

## 10. Troubleshooting

- **Nothing blocked** → policy not `enabled`, no feeds synced, or the device isn't using the managed resolver.
- **Legit site blocked** → add an **allowlist** entry (it overrides feeds); optionally drop the noisy feed.
- **CASB dashboard empty** → `log_queries` must be on; CASB reads `dns_query_log`.
- **`409 QUOTA_EXCEEDED`** → you've hit 10,000 custom entries; prune before adding more.
