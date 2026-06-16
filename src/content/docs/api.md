---
title: "REST API overview"
description: "QuickZTNA's REST API: authentication, versioning, rate limits, error format, and the endpoint catalogue for devices, users, policies, keys, and audit logs."
section: "api"
order: 4
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA REST API"
faq:
  - q: "Is there an OpenAPI specification?"
    a: "Yes — the canonical OpenAPI 3.1 specification is available at https://login.quickztna.com/api/openapi.json. It is the source of truth for the API surface. If the spec and this human-readable page diverge, the spec is correct; please file a docs ticket so we fix the page."
  - q: "How do I get an API token?"
    a: "Sign in to your admin dashboard, go to Settings → API tokens, and create a new token. Tokens are scoped to the organization, can be limited to read-only or specific endpoint groups, and have configurable expiry. Tokens are shown exactly once on creation and stored only as a hash thereafter."
  - q: "What's the rate limit?"
    a: "Default rate limits are 600 requests per minute per organization for read endpoints, 60 per minute for write endpoints. Limits are returned in the X-RateLimit-* response headers on every request. If you have a documented use case that requires higher limits — bulk migrations, fleet onboarding, exhaustive audit-log export — contact support; we can raise limits with appropriate justification."
---

The QuickZTNA REST API is the programmatic surface for managing devices, users, policies, pre-authentication keys, and audit logs. The admin dashboard is built on top of the same API; anything you can do in the dashboard, you can do via the API.

This page is the human-readable overview. The canonical specification is at:

```
https://login.quickztna.com/api/openapi.json
```

If you're generating client code, point your OpenAPI generator at that URL. We update it on every release.

## Base URL and versioning

All API requests go to:

```
https://login.quickztna.com/api/v1
```

The major version is in the URL path. We commit to no breaking changes within a major version — endpoint shapes, field names, and required parameters are stable. Backwards-compatible additions (new optional fields, new endpoints) ship continuously.

When we introduce a major version (next one would be `/api/v2`), the previous version continues to function for at least 12 months in parallel, with formal deprecation notices via the status page and admin email at least 90 days before sunset.

## Authentication

Every request must include a bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are created in the admin dashboard at **Settings → API tokens**. When you create a token you choose:

- **Scope** — read-only, read-write, or specific endpoint groups (devices, policies, audit, etc.).
- **Expiry** — anywhere from 1 hour to 12 months. Production tokens should expire on a documented rotation schedule.
- **Description** — human-readable label for the token. Shown in the audit log of every request the token makes.

Tokens are returned exactly once at creation. We store only a hash thereafter; if you lose a token, generate a new one.

Failed authentication returns `401 Unauthorized` with an `WWW-Authenticate` header indicating the scheme. Successful authentication that lacks the necessary scope for the requested endpoint returns `403 Forbidden`.

## Request and response format

Requests and responses are JSON unless explicitly noted. Request bodies use UTF-8 encoding; response bodies do the same.

Common request headers:

- `Authorization: Bearer <token>` — required.
- `Content-Type: application/json` — required for `POST`, `PUT`, `PATCH` with a body.
- `Accept: application/json` — optional; assumed.
- `X-Request-ID: <uuid>` — optional; if present, echoed in the response. Useful for correlating client logs to server logs in support tickets.

Common response headers:

- `Content-Type: application/json` — always.
- `X-Request-ID: <uuid>` — server-generated if you didn't supply one.
- `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` — rate-limit accounting.

## Pagination

List endpoints (`GET /devices`, `GET /audit-log`, etc.) return paginated results. Pagination is cursor-based:

Request:

```
GET /api/v1/devices?limit=100
```

Response:

```json
{
  "items": [ ... ],
  "next_cursor": "eyJ0c..."
}
```

To get the next page, pass `next_cursor` as the `cursor` query parameter:

```
GET /api/v1/devices?limit=100&cursor=eyJ0c...
```

When there are no more pages, `next_cursor` is `null`. The default `limit` is 50; the maximum is 200. Cursors are stateless tokens — they survive across server-side restarts and do not expire on any documented schedule.

## Filtering and search

List endpoints support filtering via query parameters. The exact filter syntax depends on the endpoint; common examples:

- `GET /devices?filter=tag:production` — devices with the `production` tag.
- `GET /devices?filter=tag:production+os:linux` — AND (both filters).
- `GET /devices?filter=tag:production,tag:staging` — OR (either).
- `GET /audit-log?since=2026-01-01T00:00:00Z` — events since the given timestamp.

Sort order is most-recent-first by default for time-series endpoints (audit log, events) and unspecified for collection endpoints. To force a sort: `?sort=created_at:desc`.

## Errors

The API uses the RFC 7807 (Problem Details) format for errors:

```json
{
  "type": "https://quickztna.com/docs/api/#errors-invalid_argument",
  "title": "Invalid argument",
  "status": 400,
  "detail": "Field 'hostname' must match pattern [a-z0-9-]+",
  "instance": "/api/v1/devices",
  "request_id": "01HXY..."
}
```

The `type` is a stable URL identifying the error class. The `title` is a human-readable summary. `detail` provides specifics for the particular request. `instance` is the request path. `request_id` is the correlation ID we'll ask for in support tickets.

HTTP status codes follow standard semantics:

- `200 OK` — successful read.
- `201 Created` — successful resource creation.
- `204 No Content` — successful operation with no response body (e.g. successful DELETE).
- `400 Bad Request` — malformed request, invalid field values.
- `401 Unauthorized` — missing or invalid authentication.
- `403 Forbidden` — authenticated but lacking the necessary scope.
- `404 Not Found` — resource does not exist.
- `409 Conflict` — operation conflicts with current resource state.
- `422 Unprocessable Entity` — request was syntactically valid but semantically rejected.
- `429 Too Many Requests` — rate limit hit. Honour `Retry-After`.
- `500 Internal Server Error` — server-side bug. We treat any 5xx as a high-priority alert; please file a ticket with the `request_id`.
- `503 Service Unavailable` — transient unavailability. Retry with exponential backoff.

The API is fully idempotent for safe HTTP methods (`GET`, `HEAD`). Mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) on individual resources are idempotent against the same resource ID; bulk operations indicate their idempotency semantics in their per-endpoint docs.

## Rate limits

Default per-organization limits:

- **Read endpoints** (`GET`): 600 requests per minute.
- **Write endpoints** (`POST`, `PUT`, `PATCH`, `DELETE`): 60 requests per minute.
- **Burst capacity:** up to 30 seconds at 2x sustained rate.

These limits are documented to be sufficient for routine bulk operations (e.g. fetching every device on a 10,000-device fleet, applying a fresh policy across hundreds of rules). If your use case requires more — bulk migrations, large-scale audit-log exports, very high-frequency event processing — contact [support@quickztna.com](mailto:support@quickztna.com) and we can raise limits for your token with appropriate justification.

Every response includes:

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 587
X-RateLimit-Reset: 1715852400
```

When a limit is hit, the response is `429 Too Many Requests` with a `Retry-After: <seconds>` header. Honour it; aggressive ignoring of `Retry-After` can result in temporary token suspension.

## Endpoint catalogue

A high-level tour of the surface. Full request/response schemas are in the OpenAPI spec.

### Devices

- `GET /devices` — list devices in the organization. Supports filtering by tag, OS, owner, last-seen.
- `GET /devices/{id}` — single device, with full detail (tags, peers, posture state, audit history).
- `PATCH /devices/{id}` — update mutable fields (hostname, tags, owner reassignment with admin role).
- `DELETE /devices/{id}` — remove device from the organization. Drops it from the network and revokes its key centrally.
- `POST /devices/{id}/tags` — add tags.
- `DELETE /devices/{id}/tags/{tag}` — remove a tag.
- `POST /devices/{id}/expire-key` — force-expire the device's current authentication. Device's owner will be prompted for fresh SSO on next connect.

### Users

- `GET /users` — list users in the organization.
- `GET /users/{id}` — single user, with their devices and group memberships.
- `POST /users` — invite a user. Sends invitation email or creates an SSO-domain rule depending on parameters.
- `DELETE /users/{id}` — remove a user. All of their devices are removed in the same operation.
- `GET /users/{id}/devices` — devices owned by this user.

### Groups

- `GET /groups` — list groups synced from your identity provider.
- `GET /groups/{id}/members` — users in the group.

Groups are read-only via the QuickZTNA API; the source of truth is your identity provider. Modify membership upstream (Google Workspace, Microsoft Entra, Okta, etc.) and the change syncs to QuickZTNA within seconds via SCIM or on the next OIDC sign-in.

### Policies

- `GET /policy` — current policy as YAML or JSON (negotiated via `Accept` header).
- `PUT /policy` — replace the policy in its entirety. Supports `dry_run=true` query parameter.
- `POST /policy/diff` — submit a candidate policy; returns the diff against the current live policy without applying.
- `POST /policy/lint` — validate a candidate policy without applying.
- `GET /policy/history` — list previous policy versions.
- `GET /policy/history/{version}` — fetch a specific historical version.

### Pre-auth keys

- `GET /keys` — list active pre-auth keys (hashes only; keys themselves are not retrievable post-creation).
- `POST /keys` — create a pre-auth key. Response includes the key, exactly once.
- `DELETE /keys/{id}` — revoke a key.

### Audit log

- `GET /audit-log` — paginated event stream. Supports `since`, `until`, `event_type`, `actor`, `subject` filters.
- `GET /audit-log/{event_id}` — single event with full detail.

The audit log retention depends on your plan: 90 days on Free, one year on Business, configurable on Workforce. Workforce plans can also stream events in real time via the events endpoint below.

### Real-time events

- `GET /events?stream=true` — Server-Sent Events stream of audit and system events. Workforce-plan only.

The same data as the audit log, but pushed as it happens. Useful for SIEM ingestion or real-time alerting.

### Posture

- `GET /posture/config` — current posture configuration (which signals are required, what action on failure).
- `PUT /posture/config` — update posture configuration. Supports `dry_run=true`.
- `GET /devices/{id}/posture` — current posture state of a specific device.

### Health and meta

- `GET /health` — service health. Unauthenticated.
- `GET /version` — service version. Unauthenticated.
- `GET /openapi.json` — the OpenAPI 3.1 specification. Unauthenticated.

## Webhooks

The API supports outbound webhooks for organizations on Business and Workforce plans. Configure webhook destinations in the admin dashboard under Settings → Webhooks.

Each webhook receives a signed POST request when an interesting event happens (device added, device removed, policy applied, posture violation, sign-in failure, etc.). The signature is HMAC-SHA256 over the request body with the per-webhook secret; verify it on your side before trusting the payload.

Webhook delivery is at-least-once with exponential backoff; we retry for up to 24 hours on 5xx responses or timeouts. Always treat webhook handlers as idempotent.

## SDKs and client libraries

We do not currently ship official client libraries because the OpenAPI specification is the single source of truth and generators like `openapi-generator` produce idiomatic clients for every major language. Pick your generator of choice; we keep the spec quality high enough that generated clients work cleanly.

A small number of community-maintained libraries exist for Go, Python, and TypeScript. They are listed on the [integrations page](/docs/integrations/) under "community-maintained tools." We don't formally endorse them, but they're known to work and are written by people we trust.

## Common patterns

A few quick reference patterns for common automation.

**Onboarding a fleet of servers via Terraform / Pulumi / CDK:**

1. Create a multi-use pre-auth key with the desired tags and a short expiry.
2. Pass the key to each server's user-data via your IaC tool.
3. The server's first-boot script runs `ztna up --auth-key=<key>` (or sets `ZTNA_AUTH_KEY` and runs the installer).
4. After fleet rollout, revoke the key.

**Bulk audit-log export to your SIEM:**

```bash
# Ad-hoc, from the CLI:
ztna audit list
```

For automation, query the audit-log API endpoint with the cursor-pagination pattern and stream the JSON to your SIEM. On paid plans the audit log is exportable via the API.

**Cleaning up stale devices in CI:**

Use the machine-management API endpoints (the same surface the dashboard uses): list machines, filter by `last_seen`, and remove the stale ones. `ztna machines list` is the CLI's read-only view of the same data. Run on a weekly schedule.

## What's next

For the security and trust model that this API operates against, the [security model page](/docs/security/) is the next read. For SSO setup, see [integrations](/docs/integrations/). For the operator-facing view of the same surface, [managing devices](/guide/managing-devices/) and [access policies](/guide/access-policies/) cover the dashboard equivalents.
