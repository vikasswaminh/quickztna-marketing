---
title: "REST API overview"
description: "QuickZTNA's REST API as it ships: API keys and scopes, the endpoints for keys, machines, policies and audit, unattended client install, and the OpenAPI spec."
section: "api"
order: 4
updatedAt: 2026-09-07
primaryKeyword: "QuickZTNA REST API"
faq:
  - q: "Is there an OpenAPI specification?"
    a: "Yes — the OpenAPI 3.1 specification is served at https://login.quickztna.com/api/docs/openapi.yaml (https://login.quickztna.com/api/openapi.json returns metadata that points to it). It documents the customer-facing surface only; if the spec and this page diverge, the spec is correct — please tell us so we fix the page."
  - q: "How do I get an API key?"
    a: "Sign in to the admin dashboard as an org admin, open Admin settings → API Keys, choose a role preset or specific scopes, and generate the key. Keys are bound to your organization, expire in 1–90 days, and are shown exactly once; only a hash is stored."
  - q: "What's the rate limit?"
    a: "Each API key is capped at 100 requests per minute (you choose 30, 60 or 100 when you create it). Hitting the cap returns 429 with a Retry-After header. If you need more for a bulk job, split it across keys or contact support."
---

The QuickZTNA API is the programmatic surface for managing API and enrolment keys, machines, access policies, users and the audit log. The admin dashboard is built on the same endpoints. This page describes the API **as it ships today** — every path below exists on `login.quickztna.com`.

The machine-readable specification is at:

```
https://login.quickztna.com/api/docs/openapi.yaml
```

Point an OpenAPI generator at that URL for a typed client. It documents the customer-facing surface only: the agent's own device protocol and platform-internal endpoints are deliberately not part of it.

## Base URL

All requests go to:

```
https://login.quickztna.com/api
```

There is no version segment in the path. Backwards-compatible additions (new optional fields, new actions) ship continuously; we do not rename existing endpoints, fields or action names.

## Authentication

Programmatic clients authenticate with an **organization API key**, sent either as its own header or as a bearer token — both are accepted:

```
X-Api-Key: qztna_…
```

```
Authorization: Bearer qztna_…
```

(Signed-in dashboard sessions use a short-lived JWT in the same `Authorization` header; you will not normally use that from automation.)

API keys are created by an org **admin** in the dashboard at **Admin settings → API Keys**, or via the key-management endpoint below. When you create a key you choose:

- **Scopes** — what the key may do (next section). A key must carry at least one scope; full access is only granted by the explicit `*` scope, never by leaving scopes empty.
- **Expiry** — 1 to 90 days (default 30). Expiry is mandatory: there are no permanent keys. Rotate on a documented schedule.
- **Rate limit** — 30, 60 or 100 requests per minute.
- **Name** — a label shown in the key list and the audit log.

Keys are returned exactly once, at creation. Only a hash is stored; if you lose a key, rotate it. A key is bound to the organization it was created in and stops working if its creator loses admin standing in that organization.

Missing or invalid credentials return `401`. A valid key that lacks the scope for the operation returns `403` with the error code `INSUFFICIENT_SCOPE`, and a key used against another organization returns `403 FORBIDDEN`.

### Scopes

Scopes follow a `resource:action` vocabulary:

| Scope | Grants |
|---|---|
| `*` | Full access (admin) — everything, including key management and policy writes |
| `<resource>:read` | Read the resource |
| `<resource>:write` | Read and write the resource |
| `read` | Read every ordinary resource |
| `write` | Read and write every ordinary resource (data only — see below) |

Resources: `machines`, `acls`, `dns`, `users`, `apps`, `settings`, `secrets`, `certificates`, `audit`. SCIM and Terraform integrations use their own `scim` and `terraform` scopes.

Two rules keep a broad automation key contained:

- **Policy writes need admin-grade.** Authoring ACL rules, DNS configuration, organization settings, and creating, rotating or revoking keys require `*` (or `admin`); a coarse `write` scope is not enough.
- **Secrets and certificates are never implied.** `read`/`write` do not reach them; use `secrets:*` / `certificates:*` explicitly.

The dashboard offers three role presets that expand to scope sets: **Auditor** (every `:read`), **Operator** (`machines:read`, `machines:write`, `acls:read`, `apps:read`, `dns:read`) and **Admin** (`*`).

## Request and response format

Requests and responses are JSON. Most endpoints are **action-based**: you `POST` a JSON body with an `action` field plus the organization id, and the endpoint dispatches on it. Every response uses one envelope:

```json
{ "success": true,  "data": { … },  "error": null }
{ "success": false, "data": null,   "error": { "code": "INSUFFICIENT_SCOPE", "message": "…" } }
```

Common error codes: `UNAUTHORIZED` (401), `FORBIDDEN` and `INSUFFICIENT_SCOPE` (403), `NOT_FOUND` (404), `INVALID_INPUT` / `INVALID_SCOPES` / `MISSING_FIELDS` (400), `RATE_LIMITED` (429).

## Rate limits

Limits are per API key, at the rate chosen when the key was created (30, 60 or 100 requests per minute; 100 is the maximum). When a limit is hit the response is `429` with a `Retry-After: <seconds>` header — honour it. For large jobs (fleet onboarding, full audit export), page through results and spread the work across keys.

## Endpoint catalogue

### Keys — `POST /api/key-management`

Requires an admin-grade key (`*`). Body: `{ "action": "…", "org_id": "…", … }`.

- `create_auth_key` — create an **enrolment (pre-auth) key** for installing the client on machines without an interactive login. Fields: `name` (required), `expiry_days` (1–365, default 90), `reusable` (multi-use), `ephemeral`, `allowed_tags` (tags the machine receives), `allowed_cidrs`. The key is returned once.
- `revoke_auth_key`, `rotate_auth_key` — by `key_id`.
- `create_api_key` — mint an API key: `name`, `scopes` (required, non-empty), `expiry_days` (1–90), `rate_limit_rpm`. Returns `key` (once) and `key_prefix`.
- `revoke_api_key`, `rotate_api_key` — by `key_id`. Rotation revokes the old key and returns a new one with the same scopes.

Listing keys is a table read: `GET /api/db/auth_keys?org_id=…` and `GET /api/db/api_keys?org_id=…` (hashes and prefixes only — keys are never retrievable after creation).

### Machines — `GET /api/db/machines` and `POST /api/machine-admin`

Read the fleet through the table API:

- `GET /api/db/machines?org_id=…` — list machines. Filter with `field=op.value` query parameters: `?status=eq.online`, `?status=neq.offline`, `?id=eq.<uuid>`. Rows are under `data.data`.

Change machines through the admin endpoint (`machines:write`; body `{ "action": "…", "org_id": "…", "machine_id": "…", … }`):

- `approve` — approve a machine that enrolled while approval was required.
- `enable` / `disable` / `quarantine` — control whether the machine may connect.
- `rename` — field `name`.
- `update_tags` — replace the machine's tags (tags drive access policy).
- `update_flags` — per-machine flags.
- `update_routes`, `approve_routes`, `reject_routes` — advertised subnet routes.
- `approve_exit_node`, `reject_exit_node` — exit-node offers.
- `set_key_expiry` — control node-key expiry.
- `delete` — remove the machine; it is dropped from the network and its key revoked.

Remote-control actions that can lock, wipe or execute on a device exist for the dashboard's admin flows and are intentionally **not** part of the public API surface.

### Access policies — `/api/db/acl_rules` and `POST /api/acl-evaluate`

- `GET /api/db/acl_rules?org_id=…` — list rules. `POST` / `PATCH` / `DELETE` on the same path author them (admin-grade key). `PATCH` takes its `WHERE` in a `_filters` object in the body, and `DELETE` needs `Content-Type: application/json` with a `{}` body.
- `POST /api/acl-evaluate` — dry-run a decision: `org_id`, `source_machine_id`, `destination_machine_id` → allow/deny and the matching rule.

### Users — `/api/db/org_members` and `/api/db/profiles`

`users:read` / `users:write`. Members with their role (`owner`, `admin`, `member`) and profiles. Provisioning at scale is better done through the SCIM endpoint with a `scim`-scoped key.

### Audit log — `GET /api/audit` and `/api/db/audit_logs`

`audit:read`. `GET /api/audit?org_id=…` returns events newest first with `limit`/`offset` paging; `GET /api/db/audit_logs?org_id=…` is the raw table with `field=op.value` filters. Retention is 90 days on both plans. `POST /api/export` produces a full organization export for offline analysis.

### Health and spec

- `GET /api/health` — service health, unauthenticated.
- `GET /api/docs/openapi.yaml` — the OpenAPI 3.1 specification, unauthenticated.

## Real-time updates and webhooks

The dashboard's live updates use a WebSocket at `/api/realtime` authenticated with a dashboard session; it is not part of the API-key surface. For event delivery to your own systems use **webhooks**: configure destinations in the dashboard (Admin settings → Webhooks); each delivery is a signed POST (HMAC-SHA256 over the body with the per-webhook secret) with retries. Delivery history is readable at `GET /api/db/webhook_delivery_logs?org_id=…`.

## Remote client install and management

There is no MDM or MSI package; the client installs from a script on every platform, and an **enrolment key** makes that install fully unattended. From your API key:

1. `POST /api/key-management` with `action: create_auth_key`, `reusable: true`, a short `expiry_days`, and the `allowed_tags` you want the machines to carry.
2. Deliver the key to the machine through your provisioning tool (cloud-init, Ansible, Intune/GPO script, image build) and run the installer with it:

```bash
# Linux and macOS
curl -fsSL https://login.quickztna.com/install.sh | ZTNA_AUTH_KEY=<key> sh
```

```powershell
# Windows (silent; installs and starts the service)
$env:ZTNA_AUTH_KEY = "<key>"; irm https://login.quickztna.com/install.ps1 | iex
```

3. The machine enrols and appears in `GET /api/db/machines` within seconds. If your organization requires approval, `machine-admin` → `approve` it (or pre-tag it so policy applies immediately).
4. Manage it from then on with the machine-admin actions above; revoke the enrolment key when the rollout is done.

Client updates are managed centrally by staged rollout; a machine's client version is visible on its row in `GET /api/db/machines`.

## Common patterns

**Cleaning up stale machines from CI** — `GET /api/db/machines?org_id=…`, filter on `last_seen`, then `machine-admin` → `delete` for each stale row. `ztna machines list` is the CLI's read-only view of the same data.

**Read-only monitoring** — use the **Auditor** preset. It can read machines, policies, users and audit events and cannot change anything.

**Least-privilege automation** — give each job its own key with only the scopes it needs and a short expiry; keep `*` keys for humans and break-glass.

## What's next

For the security and trust model this API operates against, read the [security model page](/docs/security/). For SSO and SCIM setup see [integrations](/docs/integrations/). For the operator view of the same surface, [managing devices](/guide/managing-devices/) and [access policies](/guide/access-policies/) cover the dashboard equivalents.
