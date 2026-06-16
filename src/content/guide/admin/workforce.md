---
title: "Workforce security overview"
description: "The optional workforce-security layer: file-scan DLP, free remote SSH, remote desktop, software inventory, user-risk scoring, and CASB — where each is documented."
section: "admin"
order: 8
updatedAt: 2026-06-16
primaryKeyword: "QuickZTNA workforce security"
faq:
  - q: "What does the workforce layer include?"
    a: "File-scan DLP, remote access (free SSH/shell plus paid remote desktop), DNS/CASB shadow-IT governance, software inventory and patch posture, and per-user risk scoring. Each has its own deep-dive page in this guide. Most are paid-plan features; remote SSH and DNS filtering are part of the baseline."
  - q: "Are there platform caveats for monitoring features?"
    a: "Yes. On macOS, a daemon running as root outside the user's GUI session has limited visibility into user-session context, so production deployments run the agent in the user's session where that matters. On Windows, a LocalSystem service in session 0 cannot see the interactive desktop — anything needing the user desktop must run in a user-context agent."
---

On top of the WireGuard mesh and [access control](/guide/admin/access-control/), QuickZTNA offers an optional **workforce-security** layer. This page is the map; each capability has its own deep-dive with architecture, configuration, worked API/CLI examples, enforcement, limits, and audit events. The layer is real but deliberately scoped — the per-feature pages are honest about what ships today versus what doesn't.

## The capabilities

- **[Data Loss Prevention (DLP)](/guide/admin/dlp/)** — file-content scanning for secrets and PII, with masked events and SIEM emission. Detect-and-alert; file-scan only today.
- **[Remote access](/guide/admin/remote-access/)** — interactive shell over the mesh (free on every plan, consent-aware) and WebRTC remote desktop (paid).
- **[DNS filtering](/guide/admin/dns-filtering/)** + **[CASB & Shadow IT](/guide/admin/casb/)** — block threats and govern SaaS, with an app-access approval workflow.
- **[Workforce analytics & user-risk](/guide/admin/workforce-analytics/)** — opt-in session/schedule/productivity analytics, software inventory and patches, and seven-factor user-risk scoring.
- **[Device posture](/guide/admin/device-posture/)** — the health-of-device gate that underpins much of the above.

## What ships today — the honest summary

- **DLP is file-scan only.** Clipboard and SSH-session DLP are not in the shipping client. It detects and alerts; it does not block transfers inline. (Details on the [DLP page](/guide/admin/dlp/).)
- **Remote shell is free**, remote desktop is paid; both require the target device to consent.
- **Workforce analytics is opt-in and consent-gated** — off by default, per capability, with a monitoring acknowledgment per user. No keylogging or screen capture.
- Most workforce features are **paid-plan**; check the [feature-flag reference](/guide/admin/billing/) for what each gates.

## Platform caveats worth knowing

- **macOS:** a daemon running as root outside the user's GUI session has limited visibility into user-session context; run the agent in the user session where that matters.
- **Windows:** a LocalSystem service in session 0 cannot see the interactive user desktop — any desktop/window-context feature needs a user-context agent.

## Next

- [Observability](/guide/admin/observability/) — where DLP, posture, and access events land (audit, compliance, SIEM).
- [Plans & billing](/guide/admin/billing/) — which workforce features each plan gates.
