---
title: "Connecting & everyday commands"
description: "Everyday QuickZTNA: check status and peers, resolve names with MagicDNS, get a TLS cert, switch between orgs with profiles, view logs, and update the client."
section: "getting-started"
order: 4
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA everyday commands"
faq:
  - q: "How do I see whether I'm connected and who my peers are?"
    a: "Run 'ztna status' for connection state, your tailnet IP, and the peer list, and 'ztna peers' for per-peer detail including whether each connection is direct or relayed. Both accept --json for scripting."
  - q: "Can one machine belong to more than one organization?"
    a: "Yes, via profiles. 'ztna profile create/list/delete' manages saved connection profiles, and 'ztna switch' moves between organizations or profiles without logging out."
---

After install and `ztna login`, day-to-day use is a handful of commands. This page is the task-oriented tour; the [CLI reference](/docs/cli/) has every flag.

## Connect, disconnect, status

```bash
sudo ztna up          # connect (alias: ztna connect)
ztna status           # connection state, your tailnet IP, peers
sudo ztna down        # disconnect (alias: ztna disconnect)
```

`ztna status --json` is the stable, scriptable view. Add `--active` to show only active peers.

## See your peers and addresses

```bash
ztna peers            # peers with direct/relayed path, latency, endpoint
ztna ip               # this device's tailnet IP
ztna ip prod-db-01    # a peer's IP by name
ztna whois 100.64.0.6 # which machine/user owns a tailnet IP
```

Use your system's own `ping`/`ssh` against the names and IPs `ztna status` shows to test reachability.

## Names & DNS

MagicDNS lets you reach peers by hostname instead of IP. Check the resolver:

```bash
ztna dns status       # is MagicDNS enabled, the search domain, resolver bind
```

Need a TLS certificate for a service on your tailnet hostname?

```bash
ztna cert                       # uses this machine's registered name
ztna cert my-server.myorg.ztna  # explicit domain
```

## Multiple organizations (profiles)

If you belong to more than one org — or run separate work and personal tailnets — use profiles:

```bash
ztna profile list
ztna profile create work
ztna switch                 # interactive org picker
ztna switch acme-corp       # switch org by slug
ztna switch --profile work  # switch by profile name
```

## Logs & updates

```bash
ztna log              # recent daemon log (use --follow to stream, -n N for more lines)
ztna update --check   # is a newer client available?
ztna update           # download and apply
```

Enable unattended updates with `ztna set --auto-update`.

## Adjusting settings without a restart

`ztna set` changes settings on the running client:

```bash
ztna set --hostname web-03
ztna set --tags prod,linux,web
ztna set --shields-up         # block all incoming connections
ztna set --ssh                # enable the SSH server on this device
```

## Next

- [Exit nodes, routes & split tunnel](/guide/exit-nodes-and-routes/) — route traffic through a peer or reach a subnet.
- [CLI reference](/docs/cli/) — every command and flag.
- [Troubleshooting](/guide/troubleshooting/) — when something doesn't connect.
