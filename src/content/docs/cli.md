---
title: "QuickZTNA CLI: command reference"
description: "Every QuickZTNA CLI command, flag, and exit code. Identical on Linux, macOS, and Windows. The stable contract for shell-script automation against QuickZTNA."
section: "cli"
order: 3
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA CLI reference"
faq:
  - q: "Is the CLI identical on every platform?"
    a: "Yes. Same command names, same flags, same output format on Linux, macOS, and Windows (PowerShell or cmd). Platform-specific behaviour — like service installation — is encapsulated in subcommands that exist on all platforms but no-op gracefully where they don't apply."
  - q: "Can I script against the CLI in production?"
    a: "Yes. The CLI is a documented stable surface. Subcommand and flag names follow the same 90-day deprecation policy as the REST API: breaking changes are pre-announced via the status page and release notes. JSON output via --json is recommended for any automation; it's stable across releases while the human-readable text output may change for UX reasons."
  - q: "What's the difference between the CLI and the REST API?"
    a: "The CLI is convenience over the API. Most CLI commands wrap a single API call; some (like 'doctor') wrap several. If you can express your need as a CLI invocation, the CLI is simpler. If you need event-driven or bulk programmatic management, the REST API is the right surface."
---

The QuickZTNA CLI is the primary command-line surface for the product. It's installed as part of every client and is available on Linux, macOS, and Windows with identical command names, flags, and output formats.

This page is the reference: every command, every flag, every exit code. It assumes you've installed the client (see the [installation guide](/guide/installation/)) and have a working sign-in.

## Conventions

Throughout this page:

- Commands are shown as `quickztna <subcommand>`. On Linux servers, that may need `sudo`; we'll note where it does.
- `<placeholder>` indicates a value you substitute. `[--optional-flag]` is an optional flag.
- The `--json` flag is universally available and produces machine-readable output suitable for scripting. The human-readable output format is not stable across releases; `--json` is.

## Global flags

These flags are accepted by every subcommand:

- `--json` — emit JSON output. Stable across releases.
- `--verbose` or `-v` — increase log verbosity. Repeatable for more detail.
- `--quiet` or `-q` — suppress non-essential output.
- `--help` or `-h` — show help for the current subcommand.
- `--version` — show the client version and exit.

## Exit codes

The CLI uses a small, stable exit-code vocabulary:

- `0` — success.
- `1` — generic failure (the command ran but did not achieve its goal).
- `2` — usage error (bad flags, missing required arguments).
- `3` — not authenticated (no current session; run `quickztna up`).
- `4` — permission denied by policy.
- `5` — service unavailable (control plane unreachable or local service not running).
- `6` — precondition failed (e.g. operation requires the device to be in a specific state).

Subcommands may document additional exit codes; if so, they appear in that subcommand's section below.

## Authentication: `quickztna up` and `quickztna logout`

The two commands that bracket your session.

### `quickztna up [--auth-key=<key>] [--hostname=<name>] [--tags=<csv>]`

Authenticates the device and connects to the QuickZTNA network. On a fresh install, opens a browser window for SSO sign-in. With `--auth-key`, performs non-interactive sign-in using a pre-authentication key generated on the admin dashboard.

Flags:

- `--auth-key=<key>` — use a pre-authentication key (generated in Settings → Keys on the dashboard). For headless servers and fleet deployments.
- `--hostname=<name>` — override the auto-derived hostname. Useful for prod servers where you want a structured name (`prod-db-01`) rather than the OS hostname.
- `--tags=<tag1,tag2>` — comma-separated tags to apply on first connect. Applied additively to any tags already attached by a pre-auth key.
- `--accept-routes` — accept any subnet routes advertised by other peers (for the legacy case of bridging QuickZTNA into a non-QuickZTNA subnet). Off by default.
- `--shields-up` — enable maximum local lockdown: no peer can initiate to this device, only outbound from this device.

Exit codes: standard. `3` if the user denies the browser prompt; `4` if the user's organization has disabled new-device onboarding.

Example: bring up a server with explicit tags and a pre-auth key.

```bash
sudo quickztna up \
  --auth-key=tskey-abc123 \
  --hostname=prod-db-01 \
  --tags=production,database
```

### `quickztna logout`

Signs the device out and removes it from the network. The device's public key is revoked centrally; the device cannot reconnect without a fresh sign-in.

This is the right command to run when decommissioning a machine. Do this before uninstalling the client to leave a clean device list.

Exit codes: standard.

## State: `quickztna status` and `quickztna whoami`

### `quickztna status [--json]`

Print the current state of the local QuickZTNA service: connection status, assigned QuickZTNA address, current peers, last coordination round time.

The human-readable output is designed to be scannable; the JSON output is documented in the [API page](/docs/api/) (the `/status` shape is identical between CLI and API).

Exit codes: `0` if connected, `5` if the service is not running, `3` if not authenticated.

### `quickztna whoami [--json]`

Print information about the current device and the user it's signed in as: device ID, hostname, owner email, tags, current session age, negotiated key-exchange parameters.

The negotiated key-exchange line is worth knowing: it should read `x25519+mlkem768`. If you see `x25519` only, that's a bug — please file a ticket.

Exit codes: standard.

## Networking: `quickztna ping`, `quickztna ssh`, `quickztna nc`

### `quickztna ping <peer> [--debug] [--count=<n>]`

Ping a peer over the QuickZTNA network. Works on platforms where the standard `ping` doesn't have the ergonomics to handle the overlay (notably Windows). `--debug` adds path information — direct vs relayed, current RTT, MTU.

`<peer>` can be a QuickZTNA hostname or address.

Exit codes: standard. `4` if the policy denies the connection.

### `quickztna ssh <user>@<peer> [-- <command>]`

Convenience wrapper around the system `ssh` that resolves the peer's QuickZTNA hostname and applies any per-organization SSH configuration. The trailing `--` separates QuickZTNA flags from arguments passed through to `ssh`.

This is mostly useful for the per-organization defaults (e.g. a corporate `~/.ssh/config` setting); for ad-hoc connections, the regular `ssh` command works just as well over the QuickZTNA network.

### `quickztna nc <peer> <port>`

Open a TCP connection to a peer on the given port, for ad-hoc debugging. Equivalent to `ncat <peer> <port>` but uses the QuickZTNA name resolution. Useful for confirming whether a port is reachable without firing up a full client.

## Devices: `quickztna devices`

Manage devices in your organization. Most subcommands require admin role.

### `quickztna devices list [--filter=<expr>] [--idle-for=<duration>] [--json]`

List devices in your organization.

Filter expression syntax: `tag:production`, `os:linux`, `owner:jane@example.com`. Combine with `+` (AND) or `,` (OR): `tag:production+os:linux`.

`--idle-for=<duration>` filters to devices not seen for the given duration. Format: `30d`, `7d`, `24h`, `1h`. Useful for routine pruning workflows.

### `quickztna devices show <id-or-hostname> [--json]`

Show full detail on a single device: tags, owner, OS, network state, posture, last seen, peers.

### `quickztna devices tag-add <id-or-hostname> <tag1> [<tag2>...]`

Add one or more tags to a device. Idempotent — adding a tag the device already has is a no-op.

### `quickztna devices tag-remove <id-or-hostname> <tag1> [<tag2>...]`

Remove one or more tags from a device. Idempotent.

### `quickztna devices remove <id-or-hostname>`

Remove a device from the organization. The device is dropped from the network within seconds; its public key is revoked centrally.

### `quickztna devices prune --idle-for=<duration> [--dry-run]`

Bulk-remove devices not seen for at least the given duration. Use `--dry-run` first to see what would be removed.

## Policies: `quickztna policy`

Manage access policies.

### `quickztna policy pull [--format=yaml|json] > policy.yaml`

Fetch the current policy and write it to stdout. Useful for the "policy as code" workflow where the canonical policy lives in git.

### `quickztna policy apply <file> [--dry-run]`

Apply a policy from a file. `--dry-run` installs the policy in evaluation mode — connections are logged against both old and new policy, but the old policy still controls actual behaviour. Production teams should always dry-run for at least 24-48 hours before live-applying any non-trivial change.

### `quickztna policy diff <file>`

Show what would change if `<file>` were applied. Plain-text diff output suitable for code review.

### `quickztna policy lint <file>`

Validate a policy file for syntax and common errors (unknown tags, undefined groups, unreachable rules). Returns non-zero exit code on any issue, suitable for CI gating.

## Pre-auth keys: `quickztna keys`

### `quickztna keys create [--tags=<csv>] [--expiry=<duration>] [--single-use]`

Create a pre-authentication key. Prints the key to stdout exactly once; it's not retrievable afterwards. The dashboard equivalent is Settings → Keys → New.

Flags:

- `--tags=<tag1,tag2>` — tags pre-applied to any device using this key.
- `--expiry=<duration>` — how long the key itself is valid. Format: `1h`, `24h`, `7d`.
- `--single-use` — key can only be used to onboard one device. Recommended for production.

### `quickztna keys list [--json]`

List active pre-auth keys for the organization. Shows hashes, not the keys themselves.

### `quickztna keys revoke <key-id>`

Revoke a pre-auth key. Devices that already onboarded with the key keep their individual identities (their device keys aren't affected); the leaked key can no longer onboard new devices.

## Diagnostics: `quickztna doctor`, `quickztna bug-report`

### `quickztna doctor`

Run the local diagnostic suite. Probes: service status, network interface state, control-plane reachability, DNS resolution, peer reachability, posture compliance, clock skew, MTU. Output is a pass/fail list with remediation hints.

If a support ticket says "run doctor and send the output," that's the command. About 60% of issues are diagnosed entirely by doctor's output.

Exit codes: `0` if all checks pass, `1` if any fail. Use the exit code in CI scripts to confirm the client is healthy before running tests.

### `quickztna bug-report [--output=<path>]`

Generate a redacted log bundle for support. Collects the last 24 hours of client logs, the recent connection-attempt history, the current posture state, the doctor output, and the client version, with tokens and external peer IPs automatically redacted. Produces a single `.tar.gz` file.

Default output path: a timestamped file in the current directory. Override with `--output=<path>`.

Attach the result to your support email at [support@quickztna.com](mailto:support@quickztna.com).

## Service management: `quickztna service`

The service-management subcommands handle install / uninstall / start / stop of the system service. Most users never need these — the regular installer handles them — but they're useful when deploying via custom configuration-management tools.

### `quickztna service install`

Install the QuickZTNA system service. Detects the local init system (systemd, launchd, Windows Service Manager, OpenRC, runit) and registers the service appropriately.

### `quickztna service uninstall`

Remove the QuickZTNA system service. Does not remove the binary.

### `quickztna service start` / `quickztna service stop` / `quickztna service restart`

Start, stop, or restart the QuickZTNA service. Equivalent to the OS-native commands (`systemctl start quickztna`, etc.); included for cross-platform consistency.

### `quickztna service status`

Show the OS-level service status (running, stopped, failed). Distinct from `quickztna status`, which shows the network state — the service can be running but disconnected (e.g. before `quickztna up`) or running and connected.

## Configuration: `quickztna config`

### `quickztna config get <key>`

Print a configuration value. Configuration keys are documented in the dashboard under Settings → Advanced.

### `quickztna config set <key> <value>`

Set a configuration value. Some keys require admin role.

### `quickztna config reset`

Reset configuration to defaults. Does not log the device out or remove peers; just clears local configuration.

## Updates: `quickztna update`

### `quickztna update check`

Check for a newer client release. Prints the latest available version and a changelog URL.

### `quickztna update apply`

Apply the latest available update. Restarts the service after install.

On systems managed by a package manager, prefer the package manager's update mechanism (`apt upgrade`, `brew upgrade`). The `quickztna update` commands are primarily for standalone installs.

## Configuration files

Most configuration is centralized server-side and pushed to clients by the coordination service. The few local configuration items live in:

- **Linux:** `/etc/quickztna/config.yaml` (system-wide) and `~/.config/quickztna/config.yaml` (per-user).
- **macOS:** `/Library/Application Support/QuickZTNA/config.yaml` (system-wide) and `~/Library/Application Support/QuickZTNA/config.yaml` (per-user).
- **Windows:** `%ProgramData%\QuickZTNA\config.yaml` (system-wide) and `%LocalAppData%\QuickZTNA\config.yaml` (per-user).

These files are managed by the CLI; manual editing is supported but not the recommended path.

## Environment variables

The client honours a small set of environment variables for the cases where flags or config files are awkward:

- `QUICKZTNA_AUTH_KEY` — equivalent to `--auth-key=<value>` on `up`. Useful in containers.
- `QUICKZTNA_HOSTNAME` — equivalent to `--hostname=<value>`. Containers, mass deployments.
- `HTTPS_PROXY` / `HTTP_PROXY` / `NO_PROXY` — standard proxy variables. Honoured by the service.
- `QUICKZTNA_LOG_LEVEL` — set to `debug` or `trace` for verbose output. Overrides the default of `info`.
- `QUICKZTNA_STATE_DIR` — override the default state directory location. Mostly useful for non-standard container layouts.

## A note on `sudo`

On Linux, most subcommands that modify state require root (`sudo`). The CLI tells you when this is the case — it'll print a clear "this command requires root" message rather than failing cryptically. Read-only commands (`status`, `whoami`, `devices list`) work without sudo if the local user has been granted CLI access (via `quickztna service grant-access <user>` as root, once).

On macOS and Windows the equivalent gates are handled via the system's normal privilege-escalation prompts.

## What's next

You have the full CLI surface. For the programmatic counterpart, the [REST API overview](/docs/api/) covers the HTTP API. For the security and trust details, the [security model](/docs/security/) is the next read.

If you're hitting an issue with a specific command, the [troubleshooting guide](/guide/troubleshooting/) is operator-facing but covers many CLI failure modes.
