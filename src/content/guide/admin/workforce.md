---
title: "Workforce security"
description: "The optional workforce-security layer: file-scan DLP, free remote SSH, remote desktop, software inventory, user-risk scoring, and the CASB approval workflow."
section: "admin"
order: 4
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA workforce security DLP"
faq:
  - q: "What does QuickZTNA DLP actually scan today?"
    a: "Filesystem file scanning. The agent watches common locations (Downloads, Documents, Desktop, and temp) and scans recently-modified files for secret patterns (e.g. cloud access keys); a match produces a masked DLP event and a security event. Clipboard and SSH-session DLP are not shipped today. DLP is a paid-plan feature."
  - q: "Is remote shell really free?"
    a: "Yes. Remote shell (SSH over the mesh) is available on every plan, including Free. It requires the SSH server to be enabled and a consent step for interactive peer sessions. Remote desktop is a paid-plan feature."
---

On top of the WireGuard mesh and access control, QuickZTNA offers a **workforce-security** layer. This page is deliberate about what ships **today** versus what doesn't — the layer is real, but narrower than some marketing shorthand implies.

## Data Loss Prevention (DLP) — file scanning

The agent runs filesystem DLP: it watches common locations (Downloads, Documents, Desktop, and the temp directory), and on a short interval scans recently-modified files for sensitive patterns (for example, cloud provider access keys). A match produces a **masked** DLP event (the secret is redacted, e.g. `AKIA****MPLE`) and a corresponding security event that reaches your audit/SIEM stream.

**Scope, honestly:** DLP today is **file scanning only**. Clipboard DLP and SSH-session-text DLP are **not** shipped. DLP is a paid-plan feature.

## Remote access

- **Remote shell (SSH over the mesh) — free on every plan.** Enable the SSH server (`ztna up --ssh` or `ztna set --ssh`); interactive peer sessions require a consent step on the target. Useful for support and administration without exposing a public SSH port.
- **Remote desktop — paid plans.** Screen/desktop sessions to a peer, with consent required for peer-initiated sessions, relayed through the mesh (TURN-assisted where direct connectivity isn't possible).

## Software inventory

The agent reports installed software / system information so you can see what's running across the fleet (useful for vulnerability and license posture). Available on paid plans; visible in the dashboard.

## User-risk scoring

QuickZTNA computes a per-user risk score from multiple factors (device posture, anomalous behavior signals, and threat-intelligence matches) so you can spot accounts that warrant attention. Paid plans.

## CASB approval workflow

For SaaS/app governance, QuickZTNA includes a **CASB approval workflow**: app-access requests are recorded and routed for approval rather than silently allowed or blocked. Admins review and approve/deny requests; the decisions are audited. Paid plans.

## Monitoring & consent

Workforce analytics (activity tracking) is **opt-in** and surfaces a consent dialog on monitored devices. By default activity tracking records activity level only — not window titles. Configure scope in the dashboard.

**Platform caveats worth knowing:**

- On macOS, a daemon running as root outside the user's GUI session has limited visibility into user-session context; production deployments run the agent in the user's session where that matters.
- On Windows, a service running as LocalSystem (session 0) cannot see the interactive user desktop — relevant for any screen/desktop or window-title feature, which need a user-context agent.

## Next

- [Observability](/guide/admin/observability/) — where DLP, posture, and access events land (audit, compliance, SIEM).
- [Access control](/guide/admin/access-control/) — the policy layer these features complement.
