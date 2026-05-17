---
title: "Troubleshooting QuickZTNA: the issues we actually see"
description: "Real fixes for connection, DNS, authentication, and performance issues in QuickZTNA support tickets. Organized by symptom so you can find your problem fast."
section: "troubleshooting"
order: 6
updatedAt: 2026-05-16
primaryKeyword: "QuickZTNA troubleshooting"
faq:
  - q: "What does 'quickztna doctor' actually check?"
    a: "It runs about a dozen diagnostic probes — service status, network interface state, control-plane reachability, DNS resolution, peer reachability, posture compliance, and clock skew. The output is a pass/fail list with remediation hints. It's the single command we ask people to run first in support tickets."
  - q: "Is there a status page?"
    a: "Yes, at status.quickztna.com. It covers control-plane availability, identity provider integrations, and any active incidents. We also publish RSS and webhook notifications for incidents — subscribe if you operate a production deployment."
  - q: "How do I get logs to send to support?"
    a: "Run 'quickztna bug-report' to generate a redacted log bundle. The tool collects the last 24 hours of client logs, recent connection attempts, posture state, and the output of 'quickztna doctor', with sensitive fields (tokens, IPs of peers outside QuickZTNA) automatically redacted. It produces a single tar.gz you can attach to a support email."
---

This page collects the issues that show up most often in QuickZTNA support tickets, organized by symptom. Before reading further, the one command worth knowing:

```bash
quickztna doctor
```

That runs about a dozen diagnostic probes on the local device and prints a pass/fail report with remediation hints. About sixty percent of the issues we see are diagnosed entirely by `doctor` — meaning the user sees the answer before opening a ticket. Run it whenever something feels off.

## Symptom: the client won't start

Service installed but won't run. `quickztna status` returns nothing, or `quickztna up` fails immediately.

**Check 1 — the service is actually installed.** On Linux: `systemctl status quickztna`. On macOS: `sudo launchctl list | grep quickztna`. On Windows: open Services.msc and look for QuickZTNA. If it's missing, the install didn't complete; rerun the installer.

**Check 2 — the service is running.** `systemctl start quickztna`, the equivalent `launchctl load` on macOS, or Start in Services.msc on Windows. If it starts but immediately exits, check the service logs (`journalctl -u quickztna` on Linux, Console.app on macOS, Event Viewer on Windows). The most common cause is a permission error — the virtual network interface needs CAP_NET_ADMIN-equivalent on every platform.

**Check 3 — disk space.** The client writes a small amount of state (under 10 MB) and rotates its logs. On a device with a full disk, the service fails silently on first write. Free up space and the service starts cleanly.

**Check 4 — conflicting software.** A handful of products manage virtual network interfaces in ways that conflict with QuickZTNA: certain enterprise endpoint-protection suites that hook the network stack, some VPN clients in always-on mode, and a few cloud-provider agents (notably some Azure VM extensions) that take exclusive ownership of the local routing table. The conflict almost always shows up as the QuickZTNA interface coming up briefly then disappearing. The fix depends on the conflicting product; the doctor output names the conflict when it can identify it.

## Symptom: the client starts but won't connect

`quickztna status` shows "Connecting" indefinitely. The browser tab for sign-in never opens, or it opens but redirects to an error.

**Check 1 — DNS to the control plane.** The client needs to resolve `*.quickztna.com`. Test with `nslookup login.quickztna.com` or `dig login.quickztna.com`. If it fails, your local DNS is broken — fix that before continuing. Common causes: a misconfigured corporate DNS, a captive portal that hasn't been completed, or a host file entry that pins quickztna.com to the wrong IP.

**Check 2 — outbound HTTPS to the control plane.** The client makes outbound HTTPS connections to login.quickztna.com. Test with `curl -v https://login.quickztna.com/health`. You should get a 200 response. If you get connection refused or TLS errors, an upstream firewall or middlebox is interfering. Add `*.quickztna.com:443/tcp` to your egress allowlist.

**Check 3 — clock skew.** The control plane and the client both validate TLS certificates and signed tokens. A clock that's off by more than five minutes will fail validation in subtle ways. `date -u` on Linux and macOS; the same on Windows via Powershell `Get-Date -AsUTC`. If you're off by more than a minute, sync via NTP (`timedatectl set-ntp true` on systemd, "Set time automatically" on Windows/macOS).

**Check 4 — proxy.** If your environment requires an HTTP proxy for outbound traffic, set `HTTPS_PROXY` in the service's environment. On systemd: edit `/etc/systemd/system/quickztna.service.d/proxy.conf` to set the environment variable, then `systemctl daemon-reload && systemctl restart quickztna`. On other init systems, the equivalent.

**Check 5 — identity-provider issues.** If sign-in opens the browser but the SSO step fails, the issue is usually upstream: an expired SSO session, an SCIM provisioning gap, or your IdP's app config rejecting the QuickZTNA callback. Try signing into your IdP separately first to confirm it's working, then try QuickZTNA's sign-in again.

## Symptom: I can connect but I can't reach a peer

Your device shows Connected on the dashboard. The peer device also shows Connected. But pinging or connecting to the peer fails or times out.

This is the most common production issue, and it's almost always one of three things.

**Cause 1 — policy denies the connection.** Check the audit log for the destination device. If your connection is being denied, the matching rule shows up there with the reason. Either the policy is correct (and you don't have access), or the policy needs adjustment.

The most common policy mistake is forgetting that QuickZTNA defaults to deny. When you create a new tag and put a device behind it, no rule grants access to it until you write one. Always pair "new tag" with "rule that references the new tag."

**Cause 2 — posture failure.** Continuous posture (paid plans) can disconnect a device mid-session when it drifts out of compliance. The audit log shows posture failures with the specific signal that failed (`disk-encryption=false`, `os-up-to-date=false`, etc.). The fix is on the device, not on the network.

**Cause 3 — the peer is in a weird network position.** Some networks aggressively block UDP between peers — symmetric NATs, certain double-NAT setups, very strict guest Wi-Fi. The client transparently falls back to an encrypted TCP-over-HTTPS relay in these cases, but the relay path has higher latency and lower throughput than direct peer-to-peer. If your peer is on a phone on cellular and you're on a corporate network, expect relay; if you're both on the same LAN and yet relayed, something is wrong. Run `quickztna ping --debug <peer>` to see the path actually being used.

## Symptom: DNS isn't resolving QuickZTNA hostnames

You connected fine but `ping <peer>` says "unknown host."

QuickZTNA injects a small piece of DNS configuration on connection: queries for QuickZTNA hostnames (`*.quickztna.net` or your custom search domain) get answered by the local QuickZTNA resolver; everything else flows to your normal DNS. Issues here are usually about the boundary between the two.

**Check the resolver configuration.** On Linux with systemd-resolved: `resolvectl status quickztna0` should show the QuickZTNA DNS server. If it doesn't, the service didn't fully come up; restart it. On macOS the equivalent is in `scutil --dns`. On Windows: `Get-DnsClientServerAddress -InterfaceAlias 'QuickZTNA'`.

**Conflicts with custom resolvers.** If you've configured a custom DNS resolver (Pi-hole, AdGuard, a corporate DNS), it can shadow QuickZTNA's. The fix is to forward queries for your QuickZTNA domain to the QuickZTNA resolver. The exact configuration depends on your custom resolver; reach out to support with your resolver type if needed.

**Macs and "split DNS."** macOS's split-DNS handling has historically been quirky. The current QuickZTNA macOS client uses the official NetworkExtension framework, which behaves reliably. If you're on an older client, update — many DNS quirks resolve with the upgrade.

## Symptom: the connection is slow

The tunnel works but throughput or latency is worse than the underlying network.

**Check the path.** Run `quickztna ping --debug <peer>`. Look for whether the connection is direct or relayed. If it's relayed and shouldn't be (you and the peer are on the same network), there's a NAT issue worth investigating. If it's direct, the bottleneck is elsewhere.

**Check encryption-cycle overhead.** Per-packet overhead from the hybrid post-quantum key exchange is roughly the same as classical WireGuard — single-digit percent at line rate. If you're seeing dramatic throughput loss (more than 20%), something else is wrong; it's not the encryption.

**Check MTU.** Some networks have a smaller-than-typical MTU (1280 on certain mobile networks, lower on PPPoE). QuickZTNA negotiates MTU automatically but a misconfigured network in between can cause packet fragmentation that tanks throughput. `quickztna ping --debug` reports the negotiated MTU; if it's unusually small, that's a clue.

**Check the underlying link.** Sometimes the answer is that the link itself is the bottleneck. Run iperf3 between the same two devices over their public addresses (where possible) and compare to the QuickZTNA throughput. If both are the same, the link is the bottleneck and QuickZTNA isn't adding noticeable overhead.

## Symptom: a user is locked out

A user can sign into your IdP but can't onboard or re-onboard their QuickZTNA device.

**Check 1 — they have a seat.** On the Free plan you have 3 user seats; on Business it's per-license. If you're at the seat cap, new users can't onboard until you remove someone or upgrade. The dashboard shows the current count.

**Check 2 — the user has been deprovisioned upstream.** If SCIM is wired up and the user was removed from your IdP, QuickZTNA removes them automatically. If they're trying to sign in after that, they get a clear "user not in organization" error.

**Check 3 — the user is in a different organization.** Common at companies with multiple QuickZTNA tenants (uncommon but it happens). The user signs into their IdP and lands in the wrong tenant by virtue of the SSO mapping. The fix is to clean up the IdP application configuration so each tenant is mapped correctly.

**Check 4 — admin reset.** Sometimes an admin needs to clear a user's device list to let them re-onboard from scratch (typically after a lost-device incident). Settings → Members → click the user → Reset devices. The user can then sign in on a fresh device.

## Symptom: an upgrade broke something

A client upgrade or a service-side change correlates with a new issue.

**Check the release notes.** Every client release has notes at `https://quickztna.com/blog/` (we publish release notes as blog posts so they're indexable and searchable). Look for behavioural changes that match your symptom.

**Check the status page.** Service-side changes are announced at `status.quickztna.com`. We pre-announce non-emergency changes 48-72 hours before they ship; emergency changes (security fixes) are announced as they happen.

**Downgrade if needed.** If a client upgrade introduces a regression for you specifically, the previous version is available for download from `https://login.quickztna.com/releases/`. Downgrade, then file a ticket so we can fix the regression in the next release.

## When to escalate

If `quickztna doctor` and this page haven't surfaced the issue, the next steps are:

1. **Generate a bug report:**

   ```bash
   sudo quickztna bug-report
   ```

   This produces a redacted log bundle (tokens removed, peer IPs hashed) suitable for sharing. Attach it to your ticket.

2. **Email [support@quickztna.com](mailto:support@quickztna.com)** with the bug-report attachment, a description of what you expected to happen, and what you saw instead. Include the device's QuickZTNA hostname so we can correlate against the service-side logs.

3. **For active production issues on Business or Workforce plans**, use the priority support channel (the URL is in your admin dashboard under Settings → Support). Free plan support is best-effort; paid plans have documented response-time SLAs on the [pricing page](/pricing/).

4. **For suspected security issues**, write to [security@quickztna.com](mailto:security@quickztna.com) instead of regular support. Anything that should not be discussed in a public ticket — possible key compromise, suspected vulnerabilities, unauthorized access — goes there. We respond within one business day for security mail.

## A short list of things that are not actually broken

A handful of behaviours look like bugs at first but are intentional. Worth knowing so you don't chase a non-issue.

**Two-minute session re-keys.** The encryption keys for an in-flight tunnel rotate every two minutes. This is a feature, not a bug; it limits the exposure of any single key. You may see a small (microsecond-scale) hiccup in latency-sensitive workloads exactly at the rekey moment. It's harmless.

**Sub-second NAT-traversal delays on the first packet to a new peer.** When two devices first start talking, the clients negotiate the path (direct vs relayed) before the first packet flows. This adds a few hundred milliseconds to the first connection. Subsequent connections to the same peer use the cached path and have no warm-up cost.

**The dashboard occasionally showing "Idle" for an active device.** "Idle" means no recent coordination check-in, not "no recent traffic." The two are different — a device can be transferring data for hours without checking in with coordination, because the data plane and the control plane are decoupled. The status updates the next coordination round (under a minute).

## Still stuck?

Don't suffer in silence. We'd rather have a bug report that turns out to be a configuration issue than a customer who quietly worked around something that needed fixing. The product is built by a small enough team that every support email is read by someone who can actually act on it. [support@quickztna.com](mailto:support@quickztna.com).
