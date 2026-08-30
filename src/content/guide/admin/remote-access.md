---
title: "Remote shell access"
description: "Remote shell to managed devices over the mesh: one-time tokens, device consent, the script library, and audit events. Free on every plan."
section: "admin"
order: 12
updatedAt: 2026-06-16
primaryKeyword: "remote shell ZTNA"
faq:
  - q: "Is remote shell a paid feature?"
    a: "No — remote SSH/shell is available across all plans, including Free. It is gated by the remote_shell feature, which is enabled on every plan. Remote desktop (graphical RDP-style sessions) is the paid capability, gated by remote_desktop."
  - q: "How is a remote shell session secured?"
    a: "Several ways: the target device must be online and have opted into SSH; the dashboard mints a one-time token that expires in 300 seconds; the connection runs over the encrypted mesh to the device (port 2222), not the public internet; and every session is audited (remote.session_created). The device side governs consent — it must have SSH enabled."
  - q: "Is there a remote desktop?"
    a: "No. Remote desktop and session recording were removed in the 2026 lean pivot. QuickZTNA provides an interactive shell for diagnostics; if you need screen control, keep a dedicated tool such as TeamViewer or AnyDesk."
  - q: "Can I run scripts across the fleet?"
    a: "Yes. Remote shell includes a script library (per-OS scripts) with execute_script and an execution_history. Use it for repeatable diagnostics or remediation, with the same audit trail as interactive sessions."
---

Remote access lets an admin reach a managed device without exposing it to the public internet: an interactive **shell** over the encrypted mesh, gated by device consent and a one-time token.

## 1. What it is

- **Remote shell** (`/api/remote-shell`, feature `remote_shell` — enabled on every plan) — an interactive session to an online device over the mesh, plus a reusable script library.
- **Removed in 2026:** the WebRTC remote-desktop session (`/api/remote-desktop`) no longer exists. This page covers remote shell only.

## 2. How it works

```
  REMOTE SHELL
   admin → create_session(machine) → one-time token (300s), tailnet_ip:2222
        → agent registers token (shell_session command)
        → interactive stream over the mesh  (/api/remote-shell/ws)
        → audit: remote.session_created

```

## 3. Enable it

| Requirement | How |
| --- | --- |
| **Remote shell** | Available on all plans; the device must be **online**, have a tailnet IP, and have **SSH enabled** (the device opt-in). |
| **Role** | Admin to initiate; the target device governs consent. |

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


## 6. Configuration reference

| Thing | Detail |
| --- | --- |
| Shell token | One-time, 300-second expiry, server-enforced |
| Shell transport | Mesh to device, port 2222; interactive via `/api/remote-shell/ws` |
| Device opt-in | `ssh_enabled` flag (machine-admin `update_flags`) |
| Script targets | `linux`, `windows`, `darwin`, `all` |

## 7. Enforcement & verification

- **Shell:** confirm a `remote.session_created` audit entry and that the token is rejected after 300 s.
- Both refuse offline devices and devices without a tailnet IP.

## 8. Limits & honest scope

- **Device must be online** with a tailnet IP; offline devices can't be reached.
- **Consent is device-side** — admins initiate, devices approve (or auto-approve if configured for headless).
- **Tokens are one-time and short-lived** (300 s) — re-create per session.
- Privilege of a shell reflects how the device runs its daemon — manage that on the endpoint.

## 9. Audit events


## 10. Troubleshooting

- **`MACHINE_OFFLINE` / `NO_TAILNET_IP`** → the device isn't connected; bring it online first.
- **Shell won't open** → SSH not enabled on the device, or the token expired (300 s).
