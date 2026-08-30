---
title: "QuickZTNA CLI: command reference"
description: "The complete QuickZTNA ztna CLI reference: every command and flag with runnable examples — the same binary on Linux, macOS, and Windows."
section: "cli"
order: 3
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA CLI reference"
faq:
  - q: "What is the CLI binary called?"
    a: "ztna. The same command name on Linux, macOS, and Windows. (The package and service may be named QuickZTNA, but every command you type is ztna.)"
  - q: "Is the CLI identical on every platform?"
    a: "The command names and flags are the same on Linux, macOS, and Windows. A few commands are platform-shaped — service install/uninstall, the system log location — but the command surface is identical and platform-specific behaviour is handled inside each command."
  - q: "Can I script against the CLI?"
    a: "Yes. Read-only commands accept --json (for example status, peers, ip, netcheck, update, metrics print) and that JSON is the surface to script against. Exit code 0 means success; non-zero means failure."
---

The QuickZTNA command-line client is **`ztna`**. It ships with every install and is identical on Linux, macOS, and Windows. This page is the reference for every command and its flags, with runnable examples.

It assumes you've installed the client (see the [installation guide](/guide/installation/)) and authenticated with `ztna login` or `ztna up`.

## Conventions

- The binary is `ztna`. `<placeholder>` is a value you substitute; `[--optional]` is optional.
- On Linux, commands that change network state or manage the service generally need `sudo`.
- **Global flag:** `--log-level <debug|info|warn|error>` is accepted by every command.
- **`--json`** is available on the read-only/status commands noted below and is the stable surface for scripting; human-readable output may change between releases.
- **Exit codes:** `0` on success, non-zero on failure. Where a command has a notable failure mode, it's called out.

> Networking note: QuickZTNA uses a kernel TUN interface on all three platforms (Linux `/dev/net/tun`, Windows Wintun, macOS `utun`). That's the default and the supported path.

---

## Getting connected

### `ztna login`

Authenticate with the QuickZTNA control plane. Browser-based by default.

```
ztna login                          # browser SSO (default)
ztna login --auth-key tskey-auth-xxx   # pre-auth key (non-interactive)
ztna login --github                 # GitHub OAuth via browser
ztna login --google                 # Google OAuth via browser
ztna login --sso <org-slug>         # SSO (OIDC) via browser
ztna login --interactive            # email/password in the terminal
```

Flags: `--auth-key <key>`, `--github`, `--google`, `--sso <org-slug>`, `--interactive`, `--hostname <name>` (register under a name other than the OS hostname — useful on cloned VM images where every machine has the same hostname), `--timeout <duration>` (browser callback timeout, default `5m`).

### `ztna up` (alias: `connect`)

Register the machine with the control plane if needed, configure WireGuard, and connect to the mesh.

```bash
# interactive first connect
sudo ztna up

# headless / fleet: register non-interactively with a pre-auth key + tags
sudo ztna up --auth-key tskey-auth-xxx --hostname prod-db-01 --advertise-tags tag:prod,tag:db
```

Key flags:

- `--auth-key <key>` — pre-auth key for non-interactive registration.
- `--hostname <name>` — set the machine hostname.
- `--advertise-tags <csv>` — apply ACL tags (e.g. `tag:prod,tag:k8s`).
- `--advertise-routes <cidrs>` — advertise local subnets (comma-separated CIDRs); requires admin approval to take effect.
- `--advertise-exit-node` — offer this machine as an exit node.
- `--exit-node <ip|auto>` — route all traffic through a peer.
- `--exit-node-allow-lan-access` — keep the local LAN reachable while using an exit node.
- `--accept-routes` — accept subnet routes advertised by peers.
- `--ssh` — enable the SSH server on the tailnet IP.
- `--shields-up` — block all incoming connections.
- `--dns` (default `true`) / `--dns-domain <domain>` — MagicDNS and search domain.
- `--gateway` — run as a headless subnet gateway (IP forwarding + masquerade; Linux).
- `--operator <user>` — allow a non-root user to manage the connection.
- `--daemon` — run the VPN in the background (logs to `~/.config/ztna/ztna.log`). This is how the system service runs it.
- `--force-reauth`, `--reset`.

> `--userspace` exists for niche no-TUN/no-root cases but is **not** the supported path — QuickZTNA runs on kernel TUN on all platforms.

### `ztna down` (alias: `disconnect`)

Stop the VPN and send an offline heartbeat.

```bash
sudo ztna down
```

`--accept-risk lose-ssh` confirms the action when bringing the tunnel down would drop the SSH session you're on.

### `ztna status`

Show connection status, machine info, and the peer list.

```bash
ztna status
ztna status --json          # scriptable
ztna status --active        # only active peers
```

Flags: `--json`, `--active`, `--peers` (default `true`).

### `ztna ip`

Print this device's tailnet IP, or look up a peer's IP by name.

```bash
ztna ip
ztna ip prod-db-01
ztna ip --json
```

### `ztna whois <tailnet-ip>`

Look up a tailnet IP to find the machine and the user it belongs to.

```bash
ztna whois 100.64.0.6
```

### `ztna logout`

Clear local auth tokens. Run this when decommissioning a machine.

---

## Profiles & organizations

### `ztna profile`

Saved connection profiles for switching between accounts/orgs.

```bash
ztna profile list
ztna profile create <name>
ztna profile delete <name>
```

### `ztna switch [org-slug-or-profile]`

Switch organization or profile without logging out. No argument = interactive picker.

```bash
ztna switch                 # interactive org picker
ztna switch acme-corp       # switch org by slug
ztna switch --list          # list orgs/profiles
ztna switch --profile work  # switch by profile name
```

---

## Names, DNS & certificates

### `ztna dns status`

Show the MagicDNS resolver status (whether peers resolve by hostname, the search domain, the resolver bind).

```bash
ztna dns status
```

### `ztna peers [name]`

List peers in the mesh with connection details and NAT-traversal info (direct vs relayed, endpoint, latency).

```bash
ztna peers
ztna peers --active
ztna peers --json
```

### `ztna cert [domain]`

Request a TLS certificate for the machine's tailnet hostname. If no domain is given, uses the machine's registered name. Wildcards are not supported.

```bash
ztna cert
ztna cert my-server.myorg.ztna
ztna cert --cert-file /etc/ssl/certs/ztna.crt --key-file /etc/ssl/private/ztna.key
ztna cert --serve-demo      # start a demo HTTPS server on :443 using the cert
```

---

## Network diagnostics

### `ztna netcheck`

Comprehensive network diagnostics: STUN discovery, DERP health, UDP connectivity, firewall detection.

```bash
ztna netcheck
ztna netcheck --json
```

### `ztna debug`

Low-level daemon diagnostics.

```bash
ztna debug derp         # DERP relay connection status
ztna debug snapshot     # full forensic state as JSON (sockets, peers, routes, NAT, interfaces)
ztna debug goroutines   # dump goroutine stacks
ztna debug metrics      # daemon metrics (Prometheus format)
```

### `ztna log`

View the background VPN daemon's logs.

```bash
ztna log                # last 50 lines
ztna log -n 200         # last 200 lines
ztna log --follow       # stream like tail -f
ztna log --clear        # clear the log file
```

### `ztna bugreport`

Create a sanitized diagnostic zip (config, logs, status, system info). **Private keys and tokens are excluded.**

```bash
ztna bugreport
ztna bugreport --output /tmp/ztna-report.zip
```

### `ztna metrics`

Client metrics in Prometheus format.

```bash
ztna metrics print                              # to stdout
ztna metrics write /var/lib/node_exporter/ztna.prom   # node_exporter textfile collector
```

### `ztna version` · `ztna licenses`

`ztna version` prints the client version and build. `ztna licenses` shows open-source license information for bundled components.

---

## Routing & exit nodes

### `ztna route list`

List advertised and approved subnet routes in the tailnet. (Advertise routes with `ztna up --advertise-routes` / `ztna set --advertise-routes`; approval is an admin action — see the [admin guide](/guide/admin/routes/).)

### `ztna exit-node`

```bash
ztna exit-node list       # available exit nodes
ztna exit-node suggest    # recommend the best one
```

Use one with `ztna set --exit-node <ip|auto>` (or `ztna up --exit-node ...`).

### `ztna split-tunnel list`

Show the CIDRs excluded from the tunnel (split-tunnel configuration).

### `ztna wg-config export`

Export the underlying WireGuard configuration (for inspection / interop).

---

## Settings

### `ztna set`

Change settings on the running client without a full restart (updates local config and the control plane where applicable).

```bash
ztna set --hostname web-03
ztna set --tags prod,linux,web
ztna set --accept-routes
ztna set --exit-node 100.64.0.9
ztna set --exit-node off
ztna set --advertise-exit-node
ztna set --advertise-routes 10.0.0.0/24,192.168.1.0/24
ztna set --shields-up
ztna set --ssh
ztna set --auto-update
ztna set --exit-node-allow-lan-access
```

---

## Access control & security

### `ztna acl`

Network access control rules.

```bash
ztna acl list                                   # current ACL rules
ztna acl test --src <machine> --dst <machine>   # is this connection allowed?
```

### `ztna posture status`

Show this device's posture-compliance status (the checks evaluated against it and pass/fail).

### `ztna threat check <ip|domain|hash>`

Check an indicator against threat intelligence.

```bash
ztna threat check 203.0.113.10
ztna threat check evil.example.com
```

### `ztna secrets`

Encrypted credentials vault.

```bash
ztna secrets list
ztna secrets set <name>
ztna secrets get <name>        # prints to stdout
ztna secrets rotate <name>
ztna secrets delete <name>
```

---

## Compliance & audit

### `ztna compliance report`

Generate a compliance report.

### `ztna audit list`

List recent audit-log entries.

---

## Organization & device administration

These wrap the same control-plane API the dashboard uses; most require an admin role.

### `ztna machines list`

List all machines in the organization (name, OS, owner, tailnet IP, status).

### `ztna auth-keys list`

List the organization's auth keys. (Create/revoke keys from the dashboard, or via the admin API — see the [admin guide](/guide/admin/auth-keys/).)

---

## Install & service lifecycle

### `ztna install` · `ztna uninstall`

Install or remove the QuickZTNA daemon as a system service that starts on boot.

```bash
sudo ztna install         # systemd unit (Linux) / launchd plist (macOS) / Windows service
sudo ztna install --force # overwrite existing service files
sudo ztna uninstall
```

`ztna configure install-service` / `ztna configure remove-service` are equivalent service-management helpers.

### `ztna update`

Check for and apply client updates.

```bash
ztna update --check       # only check, don't download
ztna update               # check and download/apply
ztna update --yes         # skip the confirmation prompt
ztna update --json
```

On package-manager installs, prefer the package manager. Standalone installs use `ztna update`.

### `ztna completion <bash|zsh|fish|powershell>`

Generate a shell-completion script.

```bash
# bash, current shell
source <(ztna completion bash)
# zsh, persistent
ztna completion zsh > "${fpath[1]}/_ztna"
```

---

## Configuration files & environment

Most configuration is centralized server-side and pushed to clients. The local items:

- **Daemon log:** `~/.config/ztna/ztna.log` (Linux, when run with `--daemon`). On Windows the service logs to the Windows Event Log (Application channel, provider `QuickZTNA`); on macOS to `/var/log/quickztna.log`.
- **Config / state:** under the per-OS app-support / config directory for the user or service account.

Environment variables honoured at install/connect time:

- `ZTNA_AUTH_KEY` — equivalent to `--auth-key`. Used by the install scripts and containers.

```bash
curl -fsSL https://login.quickztna.com/install.sh | ZTNA_AUTH_KEY=tskey-auth-xxx sh
```

---

## What's next

- [Installation guide](/guide/installation/) — install per platform.
- [Managing devices](/guide/managing-devices/) — day-to-day operator tasks.
- [Access policies](/guide/access-policies/) — write the rules that decide who reaches what.
- [Admin guide](/guide/admin/) — org setup, SSO, auth keys, posture, ACLs, and the workforce-security features.
