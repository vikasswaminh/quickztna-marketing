---
title: "AI Operator"
description: "The AI Operator: natural-language ACL building, event summaries, incident response, and tool-calling chat — every write goes through preview, confirm, and revert."
section: "admin"
order: 10
updatedAt: 2026-06-16
primaryKeyword: "AI operator ZTNA assistant"
faq:
  - q: "Can the AI make changes on its own?"
    a: "No. Every write action — regardless of its risk level — is generated as a preview and requires an admin to confirm before it takes effect. The AI never silently changes anything; it prepares an action, shows you exactly what it will do (with a LOW/MEDIUM/HIGH risk label), and waits. Confirmed actions can also be reverted. Some operations (emergency lockdown, billing, user management) are permanently hard-blocked from AI execution."
  - q: "What does the AI Operator need to work?"
    a: "A platform-level LLM key (OpenRouter or Groq) must be configured by the platform administrator; without it, AI calls return AI_NOT_CONFIGURED. Beyond that, each capability is feature-gated per plan: nl_acl_builder, event_summarizer, incident_response, ai_chat for reasoning/queries, and ai_actions for write/preview tools."
  - q: "Is the AI a security risk — could a prompt trick it into doing damage?"
    a: "It's defended on several fronts: prompt-injection patterns are stripped from input, input is length-capped, write actions always require human confirmation, high-risk operations are hard-blocked entirely, and read/write are rate-limited per user and per org. The AI only acts through a fixed set of tools — it cannot reach outside them."
  - q: "Does the AI see my secrets or raw IDs?"
    a: "It is instructed never to expose internal IDs, node keys, API keys, passwords, or hashes, and to reference machines by human-readable name and IP only. Read tools return org state scoped to your org; write tools only produce previews."
---

The AI Operator is QuickZTNA's natural-language control surface: an admin can ask for an ACL rule in plain English, get a 24-hour security briefing, work through an incident, or chat with an assistant that can both **query** your org and **prepare** changes. Its defining property is restraint — **it proposes, you dispose.** Every change is a preview until you confirm it.

## 1. What it is

Five capabilities, all admin-only and org-scoped:

- **Natural-language ACL builder** (`nl_acl_builder`) — describe access in English, get a structured ACL rule to review.
- **Event summarizer** (`event_summarizer`) — a structured 24-hour briefing across audit, threat, posture, and JIT events.
- **Incident response** (`incident_response`) — severity assessment and step-by-step recommendations for a quarantine or threat event.
- **Tool-calling chat** (`ai_chat`) — converse with an assistant that can query org state and prepare actions.
- **Actions lifecycle** (`ai_actions`) — confirm / cancel / revert the changes chat prepares.

## 2. How it works — preview → confirm → apply → revert

```
  admin asks (chat / NL builder)
        │
        ▼
   LLM (Groq / OpenRouter) with a fixed tool set
        │
        ├─ read tool  → executes immediately, returns org data
        └─ write tool → generateActionPreview()  (NOTHING changes yet)
                              │  risk = LOW | MEDIUM | HIGH (advisory)
                              ▼
                    admin confirm_action  → applied
                    admin cancel_action   → discarded
                    admin revert_action   → rolled back
   hard-blocked tools (lockdown, billing, user mgmt) → refused + audited
```

The risk label helps you prioritise review; it never bypasses confirmation. Confirmed actions are tracked (`list_actions`) and many are reversible (`revert_action`).

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Platform LLM key** | A platform admin sets an OpenRouter or Groq key in Platform Settings. Without it: `AI_NOT_CONFIGURED` (503). |
| **Feature gates** | Per plan: `nl_acl_builder`, `event_summarizer`, `incident_response`, `ai_chat`, and `ai_actions` (for write/preview). |
| **Role** | All AI Operator actions require **org admin**. |

## 4. Step-by-step: from question to confirmed change

1. Open **Dashboard → AI Operator** (or call `/api/ai-assist`).
2. Ask a question — e.g. *"which machines are non-compliant?"* The AI uses read tools and answers.
3. Ask for a change — e.g. *"block the finance laptops from prod."* The AI returns an **action preview** with a risk label.
4. **Review the preview.** It states exactly what will change.
5. **Confirm** to apply, **cancel** to discard.
6. If a confirmed change misbehaves, **revert** it.

## 5. Worked examples

All at `POST https://login.quickztna.com/api/ai-assist` with an admin Bearer JWT.

**Generate an ACL rule from English (preview only):**

```bash
curl -s https://login.quickztna.com/api/ai-assist -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"nl_acl_builder","org_id":"'"$ORG"'",
       "prompt":"allow engineering laptops to reach the dev servers on SSH and HTTPS"}'
# → { rule:{name,source,destination,ports,protocol,action,priority}, preview:true }
```

**Get a 24-hour security summary:**

```bash
curl -s https://login.quickztna.com/api/ai-assist -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"event_summarizer","org_id":"'"$ORG"'"}'
# → { summary:"...", period:"24h", event_counts:{audit,threats,posture,jit} }
```

**Chat (may return an action preview):**

```bash
curl -s https://login.quickztna.com/api/ai-assist -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"chat","org_id":"'"$ORG"'","message":"quarantine the laptop named sales-7"}'
# → { reply:"I have prepared the change as a preview...", conversation_id,
#     action_preview:{ action_id, riskLevel:"high", summary:"Quarantine machine sales-7" } }
```

**Confirm, then (if needed) revert:**

```bash
curl -s https://login.quickztna.com/api/ai-assist -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"confirm_action","org_id":"'"$ORG"'","action_id":"<id>"}'

curl -s https://login.quickztna.com/api/ai-assist -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"revert_action","org_id":"'"$ORG"'","action_id":"<id>"}'
```

## 6. Capability reference

**Read (no confirmation):** query machines, ACLs, ABAC, JIT grants, posture, risk scores, DNS, audit logs, DLP events, honeypots, software inventory, approved software, patch status, pending approvals, agent commands; detect stale secrets, shadow IT, DNS-threat correlations, session anomalies; explain ZTNA concepts; generate API code.

**Write (preview → confirm, needs `ai_actions`):** create/modify ACL & ABAC rules; quarantine/unquarantine; rename/tag machines; approve/deny registrations & JIT; manage DNS; manage DLP patterns/mode; manage honeypots; manage software compliance; remediate (enable firewall / disk encryption / reboot / lock); manage segmentation groups.

**Hard-blocked (never AI-executable):** emergency lockdown, billing, user management — admin-only, by hand.

**Guardrails:** prompt-injection stripping, 2,000-char input cap, chat rate limits (20/user/min, 100/org/min), write rate limit (30/org/hour).

## 7. AI-assisted posture remediation

The AI Operator also has a hands-off mode tied to [device posture](/guide/admin/device-posture/): with `ai_operator_mode` on and remediation rules set, an auto-quarantine for a missing firewall or disk encryption can **prepare** an `enable_firewall` / `enable_disk_encryption` command (expiring in an hour). It is prepared, not silently executed — consistent with the confirm-first model — and audited as `ai.auto_remediation_prepared`.

## 8. Limits & honest scope

- **Not autonomous.** Writes require human confirmation; high-risk ops are hard-blocked.
- **Needs a platform LLM key.** No key → `AI_NOT_CONFIGURED`.
- **LLM output is reviewed, not trusted blindly** — the NL ACL builder returns a preview you create yourself; generated rules are validated and clamped.
- **Per-plan gating** across the five features; rate-limited to prevent abuse.

## 9. Audit events

`ai.acl_generated`, `ai.events_summarized`, `ai.incident_recommendation`, `ai.chat`, `ai.tool_called`, `ai.hard_blocked`, plus action confirm/revert and `ai.auto_remediation_prepared`. All on [Observability](/guide/admin/observability/).

## 10. Troubleshooting

- **`AI_NOT_CONFIGURED`** → platform LLM key isn't set; ask your platform admin.
- **`403 FEATURE_GATED`** → the specific AI feature isn't in your plan.
- **`429 RATE_LIMITED`** → you've hit the per-minute or per-hour AI limit; wait.
- **"It said it made a change but nothing happened"** → by design: chat prepares a preview; you must confirm it.
