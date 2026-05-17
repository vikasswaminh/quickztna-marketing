---
title: "Installation: every platform, one page"
description: "Install QuickZTNA on Linux, macOS, Windows, iOS, Android, and headless servers including containers. Manual download paths included for restricted environments."
section: "install"
order: 3
updatedAt: 2026-05-16
primaryKeyword: "install ZTNA client"
faq:
  - q: "Can I install QuickZTNA without root or administrator privileges?"
    a: "The client needs administrator privileges to register itself as a system service and configure the virtual network interface. Once installed it runs without privileges for day-to-day operation. On macOS and Windows the installer prompts for credentials; on Linux you'll run it under sudo."
  - q: "Does QuickZTNA work in a Docker container?"
    a: "Yes. We ship an official container image suitable for sidecar and standalone deployments. The container needs CAP_NET_ADMIN to manage its network interface. See the headless server section below for the exact run command."
  - q: "What about ARM, RISC-V, and other architectures?"
    a: "We ship native binaries for x86_64 (amd64) and aarch64 (arm64) across Linux, macOS, and Windows. ARMv7 is supported on Linux for legacy single-board computers. RISC-V is on the roadmap but not currently released. Mobile clients are native for their respective platforms."
  - q: "Is the installer signed?"
    a: "Yes. Linux packages are signed with our APT and RPM repository keys (rotated annually). macOS builds are notarized by Apple. Windows installers are Authenticode-signed with an Extended Validation certificate. Mobile apps are signed by their respective stores."
---

QuickZTNA runs on every platform your team uses. This page covers the install path for each one, plus the manual download path for the security-conscious or proxy-restricted environments where piping `curl` into a shell is not an option.

The install ergonomics differ slightly by platform — that's unavoidable — but the result is the same on every one: a small system service, a virtual network interface, and a device registered with your QuickZTNA organization.

## Before you install

Three things to confirm before you start:

You have **administrator access** on the device. The install needs to register a system service and create a virtual network interface. After install, day-to-day operation needs no special privileges.

You have a **QuickZTNA account**. Sign up at [login.quickztna.com](https://login.quickztna.com/auth) if you haven't yet. The free plan covers 100 devices.

You have **outbound network access** to `*.quickztna.com` over standard HTTPS (TCP/443). That's it. No additional inbound ports, no upstream firewall changes. If your environment blocks anything but HTTPS to a strict allowlist, see the "Restricted networks" section near the bottom.

## Linux

Linux is the platform most commonly used for servers and developer workstations, so it gets the most polish. Three install paths.

### Linux: one-line install (recommended for new users)

```bash
curl -fsSL https://login.quickztna.com/install.sh | sh
```

The script detects your distribution (Debian/Ubuntu, Fedora, RHEL/CentOS/Rocky/Alma, openSUSE, Arch) and uses the native package manager. It adds our repository, imports the signing key, installs the `quickztna` package, and starts the service. On a typical cloud VM this completes in under fifteen seconds.

After install, run:

```bash
quickztna up
```

The CLI prints a URL — open it in a browser, sign in with your QuickZTNA identity, and approve the device. You're connected.

### Linux: native package manager (recommended for production)

If you'd rather not pipe a script into a shell — totally reasonable — add our repository manually. The repository configuration files are stable and human-readable; the signing key is published with reproducible fingerprints on our security page.

On Debian or Ubuntu:

```bash
curl -fsSL https://login.quickztna.com/install.sh.gpg | sudo gpg --dearmor -o /usr/share/keyrings/quickztna.gpg
echo "deb [signed-by=/usr/share/keyrings/quickztna.gpg] https://packages.quickztna.com/deb stable main" | sudo tee /etc/apt/sources.list.d/quickztna.list
sudo apt update && sudo apt install -y quickztna
sudo systemctl enable --now quickztna
```

On Fedora, RHEL, Rocky, or Alma:

```bash
sudo dnf config-manager --add-repo https://packages.quickztna.com/rpm/quickztna.repo
sudo dnf install -y quickztna
sudo systemctl enable --now quickztna
```

On Arch the package is in our community repository; instructions are on the [CLI reference](/docs/cli/).

### Linux: standalone binary (no package manager)

For Alpine, NixOS, ChromeOS Linux containers, and anything else outside the major distributions, download the standalone binary from the dashboard or via:

```bash
curl -fsSL https://login.quickztna.com/releases/quickztna-linux-amd64.tar.gz | tar xz
sudo install -m0755 quickztna /usr/local/bin/
sudo quickztna service install
```

The `service install` subcommand sets up the correct service unit for your init system (systemd, OpenRC, runit).

## macOS

Two paths on macOS. The dashboard install command works on macOS too; the Homebrew route is preferred if you already have brew.

### macOS: Homebrew

```bash
brew install quickztna
quickztna up
```

The cask is in the main Homebrew tap. Updates flow through your normal `brew upgrade` cycle. The signed binary lives under `/opt/homebrew/bin` on Apple silicon and `/usr/local/bin` on Intel.

### macOS: signed installer (.pkg)

If you'd rather not use Homebrew, download the notarized `.pkg` installer from your admin dashboard or from `https://login.quickztna.com/releases/`. Double-click to install. The installer is signed and notarized by Apple, so Gatekeeper won't complain.

On Apple silicon (M1 and later) the binary is native arm64; on Intel it's x86_64. Universal binaries are not needed because we ship both natively.

## Windows

Windows uses an MSI installer, deployable via Group Policy or Intune if you're a Windows-shop admin.

### Windows: interactive install

Download `QuickZTNA-Setup.msi` from your admin dashboard. Double-click. Approve the User Account Control prompt. Done.

Alternatively, the one-line PowerShell install:

```powershell
iwr -useb https://login.quickztna.com/install.ps1 | iex
```

After install, launch **QuickZTNA** from the Start menu and sign in.

### Windows: silent install for fleet deployment

For Intune, SCCM, or your favourite endpoint-management tool, the MSI supports silent install:

```powershell
msiexec /i QuickZTNA-Setup.msi /quiet /norestart
```

Combine with a pre-auth key (generated on the admin dashboard) to onboard devices without any user interaction. The pre-auth flow is documented in detail on the [managing devices](/guide/managing-devices/) page; short version: generate a one-time key with the right tags pre-applied, hand it to the deployment tool, and the device shows up on the network already correctly classified.

## iOS

Install **QuickZTNA** from the App Store. The app uses Apple's NetworkExtension framework — there's no special profile to download. Sign in with your QuickZTNA identity, accept the VPN configuration prompt (Apple requires this once per app), and the device is connected.

On iPad the same app installs and runs natively in either landscape or split-view mode. The "On Demand" toggle (Settings → VPN → QuickZTNA → On Demand) keeps the tunnel active whenever the device is on a network that's not your home Wi-Fi.

## Android

Install **QuickZTNA** from the Google Play Store. The app uses Android's VpnService API; you'll see the standard Android VPN consent prompt the first time you connect. Sign in, approve, done.

Android for Work / Android Enterprise managed deployments are supported. Push the app via your MDM and combine with a pre-auth key to onboard managed devices without user friction. The app respects the Android work profile boundary; you can run QuickZTNA in the work profile only if you want personal traffic to be unaffected.

## Headless servers, including containers

The headless install is the same Linux binary, just configured for a non-interactive environment. The trick is pre-authentication — there's no browser to open.

### Server: pre-auth key

On the admin dashboard, generate a pre-auth key (Settings → Keys → New). Set the tags you want the server to receive (`server`, `production`, `database`, etc.) and the expiry — pre-auth keys can be single-use or multi-use; we recommend single-use for production servers and multi-use for ephemeral build agents.

Install the client and authenticate with the key:

```bash
curl -fsSL https://login.quickztna.com/install.sh | sh
sudo quickztna up --auth-key=<key>
```

The server appears on the dashboard immediately, with the tags you pre-applied.

### Server: Docker / container

Official container image:

```bash
docker run -d \
  --name quickztna \
  --cap-add=NET_ADMIN \
  --device=/dev/net/tun \
  -v quickztna-state:/var/lib/quickztna \
  -e QUICKZTNA_AUTH_KEY=<pre-auth-key> \
  -e QUICKZTNA_HOSTNAME=my-container \
  quickztna/quickztna:latest
```

CAP_NET_ADMIN is required to bring up the virtual interface. The state volume preserves the device's identity across container restarts — without it, the container will re-register as a fresh device on every start, which fills your device list with ghosts.

For Kubernetes, deploy the client as a sidecar in any pod that needs to reach the QuickZTNA network, or as a DaemonSet for node-wide membership. A reference Helm chart and example manifests are linked from the [developer docs](/docs/integrations/).

## Restricted networks: behind a proxy or strict firewall

QuickZTNA's outbound network requirements are intentionally minimal: HTTPS to `*.quickztna.com` (control plane) and UDP for data-plane peer-to-peer where allowed. If UDP is blocked, the client transparently falls back to an encrypted TCP-over-HTTPS relay — no operator action needed. There is no scenario where you have to "ask the firewall team for a UDP port" to get connectivity.

If your environment has an explicit HTTP proxy, configure it via the standard `HTTPS_PROXY` environment variable. The CLI and service both honour it.

For air-gapped environments — where outbound to `*.quickztna.com` is not possible at all — the Workforce plan offers a self-hosted coordination plane. Talk to [sales@quickztna.com](mailto:sales@quickztna.com) about self-host requirements.

## Verifying your install

After install, three quick checks confirm everything is wired correctly.

Check service status:

```bash
quickztna status
```

You should see your device's hostname, the network state (`Connected`), and the assigned QuickZTNA address.

Check the network:

```bash
quickztna ping <some-other-device-on-your-network>
```

If you only have one device so far, install on a second and try this. Replies within a second mean the mesh is working.

Check the encryption parameters:

```bash
quickztna whoami --json
```

The output includes the negotiated key exchange (you'll see `x25519+mlkem768`) and the current session age. If you see `x25519` only — without the `mlkem768` part — that's a bug; file a ticket. We do not ship a classical-only build.

## Updating

The client checks for updates automatically and notifies the operator (a small system-tray icon change on desktop, a push on mobile). Updates do not happen silently in production by default; we'd rather you approve them on your schedule. To enable unattended updates (recommended for fleets), enable **Auto-update** in the admin dashboard under Settings → Updates.

Package-manager installs (apt, dnf, brew) update through the normal package channels — `apt upgrade`, `brew upgrade`, etc. The standalone binary installs check for updates on a configurable interval and download to a staging path; the next service restart picks them up.

## Uninstalling

If you want to remove QuickZTNA from a device entirely:

```bash
sudo quickztna logout
sudo apt remove quickztna     # or dnf, brew, etc.
```

The `logout` step removes the device from your QuickZTNA organization so it doesn't sit in your device list as a ghost. The package removal cleans up the binary, the service, and the virtual network interface.

On Windows, use **Apps & features** in the Settings panel. On macOS, the Homebrew uninstall is `brew uninstall quickztna`; the pkg install is `sudo /usr/local/bin/quickztna service uninstall`.

## What's next

You have a client installed. Two pages will be the most useful next:

[Managing devices](/guide/managing-devices/) covers the day-to-day operator tasks — tagging, expiry, removing devices for departed employees, fleet rollouts with pre-auth keys.

[Access policies](/guide/access-policies/) covers how to write the rules that decide who can reach what. By default a new organization permits everything between members; the first real policy file is usually written within an hour of finishing the quickstart.

If your install hit a snag, the [troubleshooting page](/guide/troubleshooting/) has the answers to the issues we see most often.
