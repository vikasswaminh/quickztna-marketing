---
title: "Remote access: shell & desktop"
description: "Remote SSH/shell to managed devices over the mesh (free across plans, consent-gated) and WebRTC remote desktop with TURN relay — both ACL-checked and audited."
section: "admin"
order: 12
updatedAt: 2026-06-16
primaryKeyword: "remote shell remote desktop ZTNA"
faq:
  - q: "Is remote shell a paid feature?"
    a: "No — remote SSH/shell is available across all plans, including Free. It is gated by the remote_shell feature, which is enabled on every plan. Remote desktop (graphical RDP-style sessions) is the paid capability, gated by remote_desktop."
  - q: "How is a remote shell session secured?"
    a: "Several ways: the target device must be online and have opted into SSH; the dashboard mints a one-time token that expires in 300 seconds; the connection runs over the encrypted mesh to the device (port 2222), not the public internet; and every session is audited (remote.session_created). The device side governs consent — it must have SSH enabled."
  - q: "Why does remote desktop need TURN?"
    a: "Remote desktop is WebRTC-based and prefers a direct peer connection, but many devices sit behind NAT that blocks direct media. A TURN relay is the fallback path that lets the stream traverse those NATs. QuickZTNA runs TURN in two regions; the API performs the offer/answer/ICE signaling and a consent step before media flows."
  - q: "Can I run scripts across the fleet?"
    a: "Yes. Remote shell includes a script library (per-OS scripts) with execute_script and an execution_history. Use it for repeatable diagnostics or remediation, with the same audit trail as interactive sessions."
---

Remote access lets an admin reach a managed device without exposing it to the public internet: an interactive **shell** over the encrypted mesh (free across plans), and a graphical **remote desktop** (paid) for when a terminal isn't enough. Both are consent-aware, ACL-checked, and audited.

## 1. What it is

- **Remote shell** (`/api/remote-shell`, feature `remote_shell` — enabled on every plan) — an interactive session to an online device over the mesh, plus a reusable script library.
- **Remote desktop** (`/api/remote-desktop`, feature `remote_desktop` — paid) — a WebRTC graphical session with TURN-relay fallback for NAT'd devices.

## 2. How it works

```
  REMOTE SHELL
   admin → create_session(machine) → one-time token (300s), tailnet_ip:2222
        → agent registers token (shell_session command)
        → interactive stream over the mesh  (/api/remote-shell/ws)
        → audit: remote.session_created

  REMOTE DESKTOP (WebRTC)
   admin → initiate → consent (approve_consent / reject_consent)
        → offer / answer / ICE candidates exchanged via API
        → direct P2P media, else TURN relay (2 regions)
        → status / disconnect / terminate
```

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Remote shell** | Available on all plans; the device must be **online**, have a tailnet IP, and have **SSH enabled** (the device opt-in). |
| **Remote desktop** | Requires the `remote_desktop` feature (paid) and a consent approval per session. |
| **Role** | Admin to initiate; the target device governs consent. |
| **Reachability** | Both ride the mesh; remote desktop additionally needs TURN reachability for NAT'd peers. |

## 4. Step-by-step: open a remote shell

1. In **Dashboard → Devices**, pick an online device.
2. Ensure the device has **SSH enabled** (a device flag; toggle via `machine-admin` `update_flags` `ssh_enabled`).
3. Start a session — the API mints a **one-time 300-second token** and tells the agent to accept it.
4. The interactive shell connects over the mesh to the device on port 2222.
5. The session is recorded as `remote.session_created` in the audit log.

For headless/automated use, the device's SSH must be enabled and the session auto-approved on the device side; otherwise sessions wait for device consent.

## 5. Worked examples

**Create a remote-shell session** (`POST /api/remote-shell`):

```bash
curl -s https://login.quickztna.com/api/remote-shell -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"create_session","org_id":"'"$ORG"'","machine_id":"<id>"}'
# → { token:"<one-time>", tailnet_ip:"100.64.x.x", port:2222, expires_in:300 }
```

**Manage the script library:**

```bash
-d '{"action":"add_script","org_id":"'"$ORG"'","name":"Collect diag","os_target":"linux","script":"uname -a; df -h"}'
-d '{"action":"list_scripts","org_id":"'"$ORG"'","os_target":"linux"}'
-d '{"action":"execute_script","org_id":"'"$ORG"'","machine_id":"<id>","script_id":"<id>"}'
-d '{"action":"execution_history","org_id":"'"$ORG"'"}'
```

**Remote desktop signaling** (`POST /api/remote-desktop`) — initiate, then the device consents:

```bash
-d '{"action":"initiate","org_id":"'"$ORG"'","machine_id":"<id>"}'      # admin starts
-d '{"action":"approve_consent","org_id":"'"$ORG"'","session_id":"<id>"}' # device approves
-d '{"action":"status","org_id":"'"$ORG"'","session_id":"<id>"}'
-d '{"action":"terminate","org_id":"'"$ORG"'","session_id":"<id>"}'
```

## 6. Configuration reference

| Thing | Detail |
| --- | --- |
| Shell token | One-time, 300-second expiry, server-enforced |
| Shell transport | Mesh to device, port 2222; interactive via `/api/remote-shell/ws` |
| Device opt-in | `ssh_enabled` flag (machine-admin `update_flags`) |
| Script targets | `linux`, `windows`, `darwin`, `all` |
| Desktop transport | WebRTC; direct P2P or TURN relay (2 regions) |
| Desktop lifecycle | `initiate` → consent → `offer`/`answer`/`ice_candidate` → `connected` → `disconnect`/`terminate` |

## 7. Enforcement & verification

- **Shell:** confirm a `remote.session_created` audit entry and that the token is rejected after 300 s.
- **Desktop:** a session won't carry media until consent is approved; ACL rules are checked at initiation.
- Both refuse offline devices and devices without a tailnet IP.

## 8. Limits & honest scope

- **Device must be online** with a tailnet IP; offline devices can't be reached.
- **Consent is device-side** — admins initiate, devices approve (or auto-approve if configured for headless).
- **Tokens are one-time and short-lived** (300 s) — re-create per session.
- **Remote desktop needs TURN** for NAT'd peers; without reachable TURN, NAT-to-NAT media can fail.
- Privilege of a shell reflects how the device runs its daemon — manage that on the endpoint.

## 9. Audit events

`remote.session_created` for shell sessions; remote-desktop initiation, consent, and termination are tracked through the session lifecycle. Review on [Observability](/guide/admin/observability/).

## 10. Troubleshooting

- **`MACHINE_OFFLINE` / `NO_TAILNET_IP`** → the device isn't connected; bring it online first.
- **Shell won't open** → SSH not enabled on the device, or the token expired (300 s).
- **Desktop connects then drops** → TURN reachability; see the RDP/TURN notes in operations.
- **`403 FEATURE_GATED` on desktop** → `remote_desktop` isn't in your plan; see [Plans & billing](/guide/admin/billing/).
