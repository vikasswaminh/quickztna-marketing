---
title: "Installation: Linux, macOS, and Windows"
description: "Install the QuickZTNA ztna client on Linux, macOS, and Windows: one-line installer, headless auth-key onboarding, and checksum-verified downloads."
section: "install"
order: 3
updatedAt: 2026-06-15
primaryKeyword: "install ZTNA client"
faq:
  - q: "Do I need root / administrator to install?"
    a: "Yes for install — the client registers a system service and creates a kernel TUN network interface. After install, day-to-day commands like status and peers work without elevation; state-changing commands need sudo on Linux."
  - q: "Can I install headless, with no browser?"
    a: "Yes. Generate a pre-auth key in the dashboard and pass it as the ZTNA_AUTH_KEY environment variable to the installer. The client registers itself and (after admin approval, if required) connects automatically. This is the path for servers, containers, and fleet rollouts."
  - q: "Which architectures are supported?"
    a: "amd64 (x86_64) and arm64 (aarch64) on Linux, macOS, and Windows, plus armv7 on Linux. The installer detects your OS and architecture and downloads the matching build."
  - q: "Is the download verified?"
    a: "Yes. The installer resolves the latest version, downloads the matching archive, and verifies its SHA-256 against the published .sha256 before installing. A checksum mismatch aborts the install."
---

QuickZTNA's client is a single binary, **`ztna`**, on Linux, macOS, and Windows. The installer downloads the right build for your OS/architecture, verifies its checksum, installs it to `/usr/local/bin` (or the Windows program directory), and sets up a system service. Kernel TUN is used on every platform (Linux `/dev/net/tun`, Windows Wintun, macOS `utun`).

## Before you install

- **Administrator access** on the device (to register a service and create the network interface).
- A **QuickZTNA account** — sign up at [login.quickztna.com](https://login.quickztna.com/auth). The Free plan covers up to 5 users (and up to 100 devices), with every feature included.
- **Outbound HTTPS** to `login.quickztna.com` (TCP/443). Peer-to-peer data uses UDP where possible and transparently falls back to an encrypted relay (DERP) when UDP is blocked. No inbound ports.

## Linux & macOS — one-line install

```bash
curl -fsSL https://login.quickztna.com/install.sh | sh
```

The script detects your OS and architecture, resolves the latest version via the control plane, downloads the matching archive from `https://login.quickztna.com/api/releases/…`, **verifies its SHA-256 checksum**, installs `ztna` to `/usr/local/bin`, and registers the system service (systemd on Linux, launchd on macOS). Then authenticate:

```bash
ztna login
```

`ztna login` opens a browser for SSO sign-in; approve the device and you're connected. (Other auth methods — GitHub, Google, a pre-auth key, or interactive terminal login — are on the [CLI reference](/docs/cli/).)

### Headless / fleet (auth key, no browser)

For servers, containers, and mass rollouts, generate a **pre-auth key** in the dashboard and pass it to the installer as an environment variable — the client registers itself non-interactively:

```bash
curl -fsSL https://login.quickztna.com/install.sh | ZTNA_AUTH_KEY=tskey-auth-xxx sh
```

On Linux the installer writes the key into the service's environment so the daemon self-registers on start; on a fresh device it prints either **"Connected"** or **"Registered. Waiting for admin approval"** depending on your org's onboarding policy.

## Windows

```powershell
irm https://login.quickztna.com/install.ps1 | iex
```

This downloads the Windows bundle (a `.zip` containing `ztna.exe`, the service binary, and the Wintun driver), installs it, and registers the **QuickZTNA** Windows service. Then run `ztna login` (or set `$env:ZTNA_AUTH_KEY` before the install command for headless onboarding).

## Manual / offline download

If piping a script to a shell isn't an option, download the archive directly. The release artifacts live under:

```
https://login.quickztna.com/api/releases/v<version>/ztna-<version>-<os>-<arch>.tar.gz     # linux, darwin
https://login.quickztna.com/api/releases/v<version>/ztna-<version>-windows-<arch>.zip     # windows
```

A matching `.sha256` is published next to each archive — verify it before installing. Then place the binary on your `PATH` and register the service:

```bash
sudo install -m0755 ztna /usr/local/bin/ztna
sudo ztna install            # sets up the systemd/launchd service
ztna login
```

## Headless servers & containers

The headless path is the same binary with a pre-auth key. The client needs the `CAP_NET_ADMIN` capability and access to `/dev/net/tun` to bring up its kernel interface, and a persisted state directory so it keeps its identity across restarts (otherwise it re-registers as a new device each start). Use `ZTNA_AUTH_KEY` to register non-interactively, set a structured name with `--hostname`, and pre-classify the device with tags via `ztna up --advertise-tags tag:prod,tag:server`.

## Verifying your install

```bash
ztna version          # confirm the installed version
ztna status           # connection state, your tailnet IP, peers
ztna peers            # peers and whether each is direct or relayed
```

If you have a second device on the network, confirm reachability with your system's normal tools (e.g. `ping <peer-tailnet-ip>` or `ssh user@<peer>`), using the names/IPs from `ztna status`.

## Updating

```bash
ztna update --check   # see if a newer version is available
ztna update           # download and apply
```

Enable unattended updates with `ztna set --auto-update`. Re-running the install script also upgrades in place.

## Uninstalling

```bash
sudo ztna logout      # remove this device from your organization (no ghost in the device list)
sudo ztna uninstall   # stop + remove the service and clean up local config
```

On Windows, uninstall from **Apps & features** (or run `ztna uninstall`).

## Restricted networks

QuickZTNA needs only outbound HTTPS to `login.quickztna.com`. Peer-to-peer connections use UDP NAT traversal where possible; when UDP is blocked, traffic falls back to an encrypted relay (DERP) in one of our two regions (Bangalore and Frankfurt) — no operator action and no inbound ports required. For an explicit HTTP proxy, set the standard `HTTPS_PROXY` environment variable.

## What's next

- [Quickstart](/guide/quickstart/) — from install to your first connection.
- [Managing devices](/guide/managing-devices/) — tags, approval, removing departed devices, fleet rollouts.
- [CLI reference](/docs/cli/) — every `ztna` command.
- [Troubleshooting](/guide/troubleshooting/) — the issues we see most often.
