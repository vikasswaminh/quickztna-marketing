---
title: "Troubleshooting QuickZTNA: the issues we actually see"
description: "Real fixes for connection, DNS, authentication, and performance issues in QuickZTNA support tickets. Organized by symptom so you can find your problem fast."
section: "troubleshooting"
order: 6
updatedAt: 2026-06-15
primaryKeyword: "QuickZTNA troubleshooting"
faq:
  - q: "What does 'ztna netcheck' check?"
    a: "It runs network diagnostics in one shot: STUN discovery (your NAT type and reflexive address), DERP relay health, UDP connectivity, and firewall detection. Pair it with 'ztna status' (connection state + peers) — between them they explain most connectivity issues. These are the first commands we ask people to run in a support ticket."
  - q: "Is there a status page?"
    a: "Yes, at status.quickztna.com. It covers control-plane availability, identity provider integrations, and any active incidents."
  - q: "How do I get logs to send to support?"
    a: "Run 'ztna bugreport' to generate a sanitized diagnostic zip. It collects configuration, recent logs, status, and system information, with private keys and tokens excluded. Attach the resulting zip to your support email. For live logs, 'ztna log' shows the daemon log (use '--follow' to stream)."
---

This page collects the issues that show up most often in QuickZTNA support tickets, organized by symptom. Before reading further, the two commands worth knowing:

```bash
ztna netcheck     # STUN/NAT, DERP health, UDP connectivity, firewall detection
ztna status       # connection state, your tailnet IP, peers
```

Between them they diagnose most connectivity issues before you ever open a ticket. Run them whenever something feels off.

## Symptom: the client won't start

Service installed but won't run. `ztna status` returns nothing, or `ztna up` fails immediately.

**Check 1 — the service is actually installed.** On Linux: `systemctl status ztna`. On macOS: `sudo launchctl list | grep com.quickztna.daemon`. On Windows: `Get-Service QuickZTNA` (or look in Services.msc). If it's missing, the install didn't complete; rerun the installer or `sudo ztna install`.

**Check 2 — the service is running.** `sudo systemctl start ztna` on Linux; on Windows `Start-Service QuickZTNA`. If it starts but immediately exits, check the logs: `journalctl -u ztna -e` on Linux, `/var/log/quickztna.log` on macOS, or Event Viewer (Application channel, provider `QuickZTNA`) on Windows. `ztna log` also prints the daemon log. The most common cause is a permission error — the kernel TUN interface needs root / CAP_NET_ADMIN.

**Check 3 — disk space.** The client writes a small amount of state and rotates its logs. On a device with a full disk, the service fails on first write. Free up space and it starts cleanly.

**Check 4 — conflicting software.** Some products manage virtual network interfaces in ways that conflict: certain endpoint-protection suites that hook the network stack, some always-on VPN clients, and a few cloud-provider agents that take exclusive ownership of the routing table. The conflict usually shows up as the QuickZTNA interface coming up briefly then disappearing.

## Symptom: the client starts but won't connect

`ztna status` shows it isn't connected. The browser tab for sign-in never opens, or it opens but redirects to an error.

**Check 1 — DNS to the control plane.** The client needs to resolve `login.quickztna.com`. Test with `nslookup login.quickztna.com` or `dig login.quickztna.com`. Common causes of failure: misconfigured corporate DNS, an uncompleted captive portal, or a hosts-file entry pinning the domain to the wrong IP.

**Check 2 — outbound HTTPS to the control plane.** The client makes outbound HTTPS to `login.quickztna.com`. Test with `curl -v https://login.quickztna.com/`. If you get connection refused or TLS errors, an upstream firewall or middlebox is interfering — add `*.quickztna.com:443/tcp` to your egress allowlist.

**Check 3 — clock skew.** The client and control plane validate TLS certificates and signed tokens; a clock off by more than a few minutes fails validation in subtle ways. Check with `date -u` (Linux/macOS) or `Get-Date -AsUTC` (Windows) and sync via NTP if needed.

**Check 4 — proxy.** If your environment requires an HTTP proxy for outbound traffic, set `HTTPS_PROXY` in the service's environment. On systemd, add it via a drop-in under `/etc/systemd/system/ztna.service.d/`, then `systemctl daemon-reload && systemctl restart ztna`.

**Check 5 — identity-provider issues.** If sign-in opens the browser but the SSO step fails, the issue is usually upstream: an expired SSO session, an SCIM provisioning gap, or your IdP's app config rejecting the QuickZTNA callback. Sign into your IdP separately first to confirm it's working, then retry `ztna login`.

## Symptom: I can connect but I can't reach a peer

Your device shows online; the peer shows online; but reaching the peer fails or times out.

This is the most common production issue, and it's almost always one of three things.

**Cause 1 — policy denies the connection.** Check the audit log for the destination device, or run `ztna acl test` to see whether a connection is allowed. The most common policy mistake is forgetting that, once you start writing rules, access is deny-by-default — a new tag has no access until a rule grants it. Pair every "new tag" with "a rule that references it."

**Cause 2 — posture failure.** Continuous posture (paid plans) can isolate a device that drifts out of compliance. Check `ztna posture status` on the device and the audit log for the specific signal that failed. The fix is on the device, not the network.

**Cause 3 — the peer is in a hard network position.** Some networks block UDP between peers (symmetric NAT, strict guest Wi-Fi). The client falls back to an encrypted DERP relay in those cases — higher latency than a direct path. Run `ztna peers` to see whether each peer is **direct** or **via relay**, plus latency and endpoint. If two devices on the same LAN show as relayed, run `ztna netcheck` on both to investigate the NAT/firewall.

> Note: use your system's own `ping`/`ssh` to test reachability (e.g. `ping <peer-tailnet-ip>`). `ztna peers` is the tool for *path* info, not a reachability test.

## Symptom: DNS isn't resolving tailnet hostnames

You connected fine but a peer hostname won't resolve.

QuickZTNA's MagicDNS answers queries for tailnet hostnames via a local resolver; everything else flows to your normal DNS. Start with:

```bash
ztna dns status      # is MagicDNS enabled? what's the search domain + resolver bind?
```

**Check the interface/resolver.** On Linux with systemd-resolved: `resolvectl status ztna0` should show the QuickZTNA resolver. On macOS check `scutil --dns`; on Windows `Get-DnsClientServerAddress`. If it's missing, the service didn't fully come up — restart it.

**Conflicts with custom resolvers.** A custom resolver (Pi-hole, AdGuard, corporate DNS) can shadow MagicDNS. Forward queries for your tailnet domain to the QuickZTNA resolver; the exact config depends on your resolver.

## Symptom: the connection is slow

The tunnel works but throughput or latency is worse than the underlying network.

**Check the path.** Run `ztna peers`. If a peer is **via relay** but shouldn't be (you're on the same network), there's a NAT issue — `ztna netcheck` helps. If it's **direct**, the bottleneck is elsewhere.

**It isn't the encryption.** The data plane is WireGuard (ChaCha20-Poly1305) — per-packet overhead is single-digit percent at line rate. If you're seeing dramatic throughput loss (more than 20%), something else is wrong.

**Check MTU.** Some networks have a smaller-than-typical MTU. QuickZTNA negotiates MTU automatically, but a misconfigured network in between can cause fragmentation that tanks throughput. `ztna netcheck` and `ztna debug snapshot` surface interface/MTU details.

**Check the underlying link.** Run `iperf3` between the two devices over their public addresses (where possible) and compare to QuickZTNA throughput. If both match, the link is the bottleneck, not QuickZTNA.

## Symptom: a user is locked out

A user can sign into your IdP but can't onboard or re-onboard their device.

**Check 1 — they have a seat.** The Free plan has 3 user seats; paid plans are per-license. At the seat cap, new users can't onboard until you remove someone or upgrade.

**Check 2 — deprovisioned upstream.** If SCIM is wired up and the user was removed from your IdP, QuickZTNA removes them automatically; they'll get a clear "user not in organization" error.

**Check 3 — wrong organization.** At companies with multiple QuickZTNA tenants, an SSO mapping can land a user in the wrong tenant. Fix the IdP application configuration so each tenant maps correctly.

**Check 4 — admin reset.** After a lost-device incident, an admin may need to clear a user's device list (Settings → Members → the user → Reset devices) so they can re-onboard.

## Symptom: an upgrade broke something

A client upgrade or service-side change correlates with a new issue.

**Check the release notes** at `https://quickztna.com/blog/` for behavioural changes that match your symptom. **Check the status page** at `status.quickztna.com` for service-side changes. **Downgrade if needed:** prior versions are available under `https://login.quickztna.com/releases/` — downgrade, then file a ticket so we can fix the regression.

## When to escalate

If `ztna netcheck`, `ztna status`, and this page haven't surfaced the issue:

1. **Generate a bug report:**

   ```bash
   ztna bugreport --output /tmp/ztna-report.zip
   ```

   This produces a sanitized zip (private keys and tokens excluded). Attach it to your ticket.

2. **Email [support@quickztna.com](mailto:support@quickztna.com)** with the bug report, what you expected, and what you saw. Include the device's tailnet hostname so we can correlate with service-side logs.

3. **For active production issues on Business or Workforce plans**, use the priority support channel (admin dashboard → Settings → Support).

4. **For suspected security issues**, write to [security@quickztna.com](mailto:security@quickztna.com) instead of regular support.

## A short list of things that are not actually broken

**Periodic session re-keys.** WireGuard rotates the keys for an in-flight tunnel about every two minutes. This is a feature — it limits the exposure of any single key.

**Sub-second NAT-traversal delay on the first packet to a new peer.** The clients negotiate the path (direct vs relayed) before the first packet flows, adding a few hundred milliseconds to the first connection. Subsequent connections use the cached path.

**The data path lagging the control plane after a restart.** After a daemon restart, a peer can show online (control plane) a few seconds before the direct/relayed data path re-establishes (up to ~a minute). Don't judge re-mesh on the first ping.

**`ztna status` showing fewer details when not run as root.** Some fields come from the daemon over a privileged socket; run with `sudo` (Linux) to see the full peer view.

## Still stuck?

Don't suffer in silence — we'd rather have a bug report that turns out to be a config issue than a customer who quietly worked around something. [support@quickztna.com](mailto:support@quickztna.com).
