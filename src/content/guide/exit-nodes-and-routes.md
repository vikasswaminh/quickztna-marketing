---
title: "Exit nodes, routes & split tunnel"
description: "Route all traffic through an exit node, reach a subnet behind a peer with subnet routes, and exclude CIDRs from the tunnel with split tunneling."
section: "getting-started"
order: 5
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA exit node subnet routes"
faq:
  - q: "How do I route my internet traffic through another device?"
    a: "Pick an approved exit node with 'ztna exit-node list' (or 'ztna exit-node suggest'), then 'ztna set --exit-node <ip|auto>'. Add '--exit-node-allow-lan-access' to keep your local LAN reachable. Turn it off with 'ztna set --exit-node off'. A machine can only act as an exit node after an admin approves it."
  - q: "How do I reach a server that isn't running QuickZTNA?"
    a: "Put a QuickZTNA device on the same network and have it advertise that subnet ('ztna up --advertise-routes 10.0.0.0/24'); an admin approves the route; then peers that accept routes can reach hosts on that subnet through it."
---

By default QuickZTNA connects your devices directly to each other. Three features extend that: exit nodes (egress through a peer), subnet routes (reach non-QuickZTNA hosts behind a peer), and split tunneling (keep some traffic off the tunnel).

## Exit nodes

An **exit node** routes a device's traffic out through a chosen peer — useful for a stable egress IP or reaching region-locked resources.

```bash
ztna exit-node list                  # available (approved) exit nodes
ztna exit-node suggest               # the recommended one
ztna set --exit-node 100.64.0.9      # route traffic through that peer
ztna set --exit-node auto            # let QuickZTNA pick
ztna set --exit-node-allow-lan-access # keep your local LAN reachable
ztna set --exit-node off             # stop using an exit node
```

A machine offers itself as an exit node with `ztna up --advertise-exit-node`, but it only becomes usable once an **admin approves** it (see the [admin access-control guide](/guide/admin/access-control/)).

## Subnet routes

A **subnet route** lets peers reach hosts that aren't running QuickZTNA, by going through a device that is on their network.

- **Advertise** a subnet from a device on that network:

  ```bash
  sudo ztna up --advertise-routes 10.0.0.0/24,192.168.1.0/24
  ```

  Advertised routes are inert until an **admin approves** them. View them with `ztna route list`.

- **Accept** approved routes on a device that should use them:

  ```bash
  ztna set --accept-routes          # or: ztna up --accept-routes
  ```

Subnet routing on the gateway side is a Linux capability (`ztna up --gateway` for a headless subnet gateway).

## Split tunneling

Split tunneling keeps specific destinations **off** the QuickZTNA tunnel (they use your normal network path). Inspect the current exclusions:

```bash
ztna split-tunnel list      # CIDRs excluded from the tunnel
```

## Next

- [Connecting & everyday commands](/guide/connecting/) — status, peers, DNS, profiles.
- [Admin: access control](/guide/admin/access-control/) — approving routes and exit nodes.
- [CLI reference](/docs/cli/) — every flag for `up`, `set`, `route`, and `exit-node`.
