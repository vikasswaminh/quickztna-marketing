---
title: "Malware detection (file-hash)"
description: "How QuickZTNA detects malicious files on endpoints using SHA-256 hash reputation, what it records, how quarantine enforcement works, and what it deliberately does not do."
section: "admin"
order: 9
updatedAt: 2026-08-30
primaryKeyword: "QuickZTNA malware detection"
faq:
  - q: "Does QuickZTNA scan file contents for PII or secrets?"
    a: "No. Content scanning for credit cards, SSNs, API keys and private keys was removed in the 2026 lean pivot. The agent reports SHA-256 file hashes only — file contents never leave the device. If you need content-inspection DLP, keep a dedicated tool such as Purview or Forcepoint."
  - q: "What happens when a malicious file is found?"
    a: "The detection is recorded with the file hash, name and path, and raised as an audit event that can be forwarded to your SIEM via webhook. In enforce mode the device is quarantined — removed from the mesh until an admin clears it. In detect mode the event is recorded without changing access."
---

QuickZTNA's endpoint agent performs **file-hash malware detection**. It computes SHA-256 hashes of executable files and checks them against a malware-hash feed and VirusTotal; confirmed-malicious hits are recorded and can quarantine the device.

> **What this page used to describe.** Earlier versions documented filesystem scanning of Downloads, Documents, Desktop and `/tmp` for credit cards, SSNs, API keys and private keys, with match redaction. **That capability was removed in the 2026 lean pivot.** Only the malware path remains. Nothing on this page requires file contents to leave the device.

## How it works

1. The agent hashes executable files it encounters and reports the SHA-256 digests, with file name and path.
2. The server checks each hash against the malware-hash feed and VirusTotal reputation data.
3. A confirmed-malicious hash produces a detection record and an audit event.
4. In **enforce** mode, the device is quarantined — dropped from the mesh until an admin clears it. In **detect** mode, the event is recorded and access is unchanged.

## What is and is not collected

| Collected | Not collected |
| --- | --- |
| SHA-256 file hash | File contents — never uploaded |
| File name and path | Document text, clipboard, or keystrokes |
| Detection verdict and timestamp | Screen captures or session recordings |

Retention follows the standard audit retention of 90 days. See the [privacy policy](/privacy#workforce-monitoring) for the full data-collection disclosure.

## Configuration

Malware detection is configured per organization from the dashboard. Choose detect or enforce mode, and optionally register a webhook so detections are forwarded to your SIEM as they happen.

## Limits — stated plainly

- **Hash reputation only.** There is no heuristic, behavioural, or sandbox analysis. A brand-new malicious binary with no reputation will not be flagged.
- **Not an EDR.** This complements an endpoint protection product; it does not replace one.
- **No content inspection.** By design — see the note above.

## Next

- [Device posture](/guide/admin/device-posture/) — the compliance gate that pairs with quarantine.
- [Observability](/guide/admin/observability/) — where detections land in audit and SIEM export.
