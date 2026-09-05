---
title: "Security overview"
description: "The endpoint-security layer: file-hash malware detection, remote shell, and device posture — where each one is documented and what it does."
section: "admin"
order: 8
updatedAt: 2026-08-30
primaryKeyword: "QuickZTNA endpoint security"
faq:
  - q: "What does the endpoint-security layer include?"
    a: "File-hash malware detection, device posture with auto-quarantine, and remote shell for diagnostics. Every one of them is included on both plans — none is gated behind an upgrade."
  - q: "What was removed in 2026?"
    a: "The 2026 lean pivot removed DLP content scanning, CASB and shadow-IT discovery, workforce and productivity analytics, session recording, remote desktop, software inventory, and user-risk scoring. File-hash malware detection is the retained half of DLP. If you are reading an older comparison of QuickZTNA, those capabilities no longer exist."
---

On top of the WireGuard mesh and [access control](/guide/admin/access-control/), QuickZTNA runs an **endpoint-security** layer. This page is the map; each capability has its own deep-dive with architecture, configuration, worked API/CLI examples, enforcement, limits, and audit events.

## The capabilities

- **[Malware detection (file-hash)](/guide/admin/dlp/)** — agents report SHA-256 file hashes; confirmed-malicious hits are recorded and, in enforce mode, quarantine the device.
- **[Remote shell access](/guide/admin/remote-access/)** — interactive shell over the mesh, consent-aware, free on every plan.
- **[Device posture](/guide/admin/device-posture/)** — the health-of-device gate that underpins much of the above, with auto-quarantine.

## What ships today — the honest summary

- **Everything here is on both plans.** Free and Business have identical features; the plans differ only in seats and devices per seat. See [plans & billing](/guide/admin/billing/).
- **Malware detection is hash-based.** Agents send file hashes, never file contents. There is no PII or secret-pattern scanning — that half of DLP was removed in the 2026 lean pivot.
- **Remote shell only.** There is no remote desktop, screen capture, or session recording.
- **No workforce monitoring.** No activity tracking, productivity scoring, software inventory, or user-risk scoring. The client does not collect keyboard, mouse, or window-title data of any kind.

## Platform caveats worth knowing

- **macOS:** a daemon running as root outside the user's GUI session has limited visibility into user-session context; run the agent in the user session where that matters.
- **Windows:** a LocalSystem service in session 0 cannot see the interactive user desktop.

## Next

- [Observability](/guide/admin/observability/) — where posture and access events land (audit, compliance, SIEM).
- [Plans & billing](/guide/admin/billing/) — the two tiers and how seat + device limits are enforced.
