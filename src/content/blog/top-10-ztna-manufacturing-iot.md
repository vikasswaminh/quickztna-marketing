---
title: "Top 10 ZTNA Solutions for Manufacturing and Industrial IoT in 2026"
description: "OT and industrial IoT networks cannot use traditional VPN for secure access. Compare 10 ZTNA solutions built or adapted for manufacturing, ICS, and OT environments."
publishedAt: 2026-05-15
author:
  name: QuickZTNA Engineering
  role: Security team
  url: https://github.com/quickztna
category: industry
tags:
  - manufacturing
  - industrial-iot
  - ot-security
  - ics
  - ztna
  - zero-trust
primaryKeyword: ztna industrial iot
wordCount: 4200
listicle: true
faq:
  - q: "Why is traditional VPN unsuitable for industrial IoT and OT networks?"
    a: "VPN grants network-level access to the entire subnet it gives access to. In an OT environment, that subnet may contain PLCs, SCADA systems, HMIs, historians, and safety instrumentation systems that were never designed to be internet-accessible. A misconfigured or compromised VPN credential could grant an attacker access to every OT device on the network — including safety-critical systems. Additionally, many industrial devices run firmware that cannot support an agent-based VPN client. ZTNA is architecturally safer: it grants access to specific named resources, not to a network block."
  - q: "What is the Purdue Model and how does ZTNA relate to it?"
    a: "The Purdue Model (also called the ISA-95 model) is a hierarchical network architecture for industrial control systems, defining zones from Level 0 (physical process) through Level 4 (business networks) with the DMZ layer separating IT and OT. Traditional Purdue enforcement uses firewall rules and physical air gaps between levels. ZTNA replaces the implicit trust within each Purdue zone with per-connection identity verification — a vendor connecting to Level 2 HMI can be given access specifically to that one device without traversing any other zone level."
  - q: "How do you enforce zero trust for OT devices that cannot run an agent?"
    a: "The standard approach is connector-based or network relay architecture. A QuickZTNA, Zscaler, or Claroty connector is deployed on a purpose-built gateway (an industrial PC or ruggedised Linux device) on the OT network. The connector creates an outbound tunnel to the ZTNA cloud. Users authenticate through the ZTNA identity layer and reach OT resources through the connector, which performs the OT-side network access. The OT devices themselves require no software modifications."
  - q: "What is NERC CIP and how does it apply to remote access for utilities?"
    a: "NERC CIP (North American Electric Reliability Corporation Critical Infrastructure Protection) is the mandatory cyber security standard for the bulk electric system in North America. CIP-005 covers Electronic Security Perimeters and requires that interactive remote access to BES cyber systems uses multi-factor authentication and an intermediate authentication server. It also requires logging of all remote access sessions. ZTNA with MFA and session recording satisfies CIP-005 requirements for remote access to electronic security perimeters."
  - q: "What OT-specific protocols do ZTNA solutions need to support?"
    a: "OT environments use protocols that IT networks do not encounter: Modbus, DNP3, IEC 61850, OPC-UA, EtherNet/IP, PROFINET. A ZTNA or network security solution for OT environments must be able to pass these protocols transparently through its access proxy — not just TCP/UDP. Vendors with true OT protocol support include Claroty, Nozomi, and Fortinet. General-purpose ZTNA tools (Zscaler, Cloudflare) pass OT protocols as opaque TCP but cannot inspect or filter at the OT protocol level."
  - q: "How should a manufacturing company structure its ZTNA rollout?"
    a: "Start with remote access for vendors and contractors — the highest-risk access scenario in most manufacturing environments. Vendors often have broad, persistent access granted years ago that was never reviewed. Replace one vendor's VPN access with ZTNA, validate the workflow, then migrate remaining vendors. Internal employee access to OT assets is phase two. Device-to-device OT traffic enforcement (micro-segmentation at Level 1-2) is phase three and the most complex, typically requiring dedicated OT security platforms."
---

## TL;DR

Manufacturing and industrial environments have unique security requirements that general-purpose IT ZTNA tools may not address out of the box: OT protocols, air-gapped networks, agentless device access, and regulatory frameworks like NERC CIP and IEC 62443. This list covers the ten ZTNA and network access control solutions most relevant to manufacturing, ICS, and industrial IoT environments in 2026.

## Why industrial environments are at escalating risk

The IT/OT convergence trend is a double-edged sword. Connecting factory floor systems to business networks and cloud analytics improves production efficiency and enables predictive maintenance. It also exposes systems that have never been designed with network security in mind to threat actors who have a decade of experience attacking IT infrastructure.

The statistics are alarming. IBM Security found that manufacturing was the most attacked industry by X-Force threat actors for the third consecutive year in 2024. The primary attack path: remote access to OT systems via compromised VPN credentials.

The root cause is architectural: VPN grants network access. In an OT environment where Purdue zone separation was the primary security control, VPN access to any zone provides lateral movement potential to every device in that zone. A threat actor who compromises a legitimate vendor's VPN credentials for a remote maintenance session is now inside the OT network with all the privileges of that connection.

ZTNA does not guarantee security, but it structurally limits blast radius: access is granted to specific named OT resources, not to the OT network segment.

---

## 1. Claroty xDome Secure Access

**Category.** Purpose-built OT/IoT security with integrated remote access.

**How it works.** Claroty xDome is an OT/IoT security platform that combines asset discovery, vulnerability management, and secure remote access. The Secure Access module provides ZTNA-gated remote access to OT resources without requiring agents on OT devices. A Claroty service edge is deployed in the OT environment; vendors and technicians connect through the Claroty cloud after authentication.

**OT-specific capabilities.**
- Passive asset discovery via protocol detection — builds an inventory of all OT devices on the network without active scanning (which can crash PLCs).
- OT protocol-aware access policies — access restricted to specific protocols (allow OPC-UA to historian, deny Modbus write).
- Session recording for remote access sessions, including screen capture of HMI interactions.
- Vendor access management: time-limited, MFA-required, just-in-time access specifically designed for third-party maintenance scenarios.
- IEC 62443 and NERC CIP compliance reporting.

**Strengths.** The only tool in this list built specifically for OT environments. Claroty understands OT protocols deeply. The combination of asset inventory (you can't protect what you can't see) and access control makes it the most comprehensive OT security platform.

**Limitations.** Enterprise pricing. Deployment requires professional services engagement for large OT networks. Not a fit for small manufacturing environments without significant security budget.

**Best fit.** Critical infrastructure, large manufacturing enterprises, utilities, and energy companies with dedicated OT security programmes and NERC CIP obligations.

---

## 2. Nozomi Networks Vantage + Remote Access

**Category.** OT network monitoring with secure remote access.

**How it works.** Nozomi Vantage provides passive OT network monitoring and anomaly detection. The remote access capability (Nozomi Remote Access) provides ZTNA-gated vendor access with session recording and protocol-aware access policy.

**OT-specific capabilities.**
- Combined monitoring and access — the same platform that detects anomalous Modbus traffic also controls who can initiate Modbus sessions.
- Multi-site management for manufacturers with multiple facilities.
- SaaS delivery — reduced on-premises infrastructure compared to on-premises OT security appliances.

**Strengths.** Integration between continuous OT network monitoring and remote access management is valuable — alerts on anomalous remote access patterns can be correlated with network-level OT anomalies.

**Limitations.** Less deep on the access control side than Claroty. Primarily an OT monitoring platform with access control as a secondary capability.

**Best fit.** Manufacturers wanting OT network visibility and basic secure remote access in one platform, without Claroty's complexity.

---

## 3. Fortinet OT Security + FortiZTNA

**Category.** Network security vendor with OT-specific platform and ZTNA integration.

**How it works.** Fortinet's OT Security solution combines FortiGate firewalls with OT protocol inspection capabilities, FortiNAC for OT device identity, and FortiZTNA for remote access control. FortiGate supports deep packet inspection of Modbus, DNP3, IEC 61850, and other OT protocols at the network level.

**OT-specific capabilities.**
- OT-protocol-aware firewall policies at the network layer.
- FortiNAC controls device admission — only known, authorised devices connect to the OT network.
- FortiZTNA provides per-application access control for remote users.
- SD-WAN integration for multi-site OT network management.

**Strengths.** Fortinet's large installed base of FortiGate firewalls in OT environments means many manufacturers already have the hardware. Upgrading the firewall to FortiGate OT edition and adding FortiZTNA builds on existing infrastructure.

**Limitations.** Not as deep on passive OT protocol monitoring as Claroty or Nozomi. ZTNA feature set is less rich than dedicated ZTNA vendors.

**Best fit.** Manufacturers already running Fortinet firewalls who want OT ZTNA without deploying a new platform.

---

## 4. Cisco Cyber Vision + Cisco ZTNA

**Category.** Industrial network visibility and ZTNA from a tier-1 networking vendor.

**How it works.** Cisco Cyber Vision provides OT asset discovery and network monitoring using embedded intelligence within Cisco industrial networking hardware (Cisco IE switches). Cisco ZTNA (via Duo and Cisco Secure) provides remote access control. The combination provides Purdue-zone aware security from inside the switches.

**OT-specific capabilities.**
- Embedded in Cisco IE series switches — zero additional hardware deployment if already using Cisco OT switching.
- Deep asset inventory from the switch level, including firmware versions and CVE exposure.
- Integration with Cisco ISE for network access control at the device level.

**Strengths.** For Cisco-standardised OT networks, Cyber Vision adds OT security without deploying new hardware. The embedded switch approach is particularly cost-effective at scale.

**Limitations.** Locked into Cisco hardware. Less deep on remote access management than Claroty or Nozomi.

**Best fit.** Manufacturers with Cisco IE-series OT switching who want embedded OT security and are already Cisco customers.

---

## 5. TeamViewer Tensor / TeamViewer IoT

**Category.** Managed remote access widely deployed in manufacturing.

**How it works.** TeamViewer Tensor provides enterprise-grade managed remote access. TeamViewer IoT extends remote access capabilities to embedded and IoT devices through lightweight agents. Both route through TeamViewer's global infrastructure without requiring inbound ports.

**OT-specific capabilities.**
- Lightweight TeamViewer IoT agent runs on industrial PCs and edge gateways.
- Role-based access control per device.
- Session recording and audit logging.
- Attended and unattended access modes — technicians can request access to a device, or remote sessions can be established without operator intervention for autonomous monitoring.
- Integration with CMMS (Computerised Maintenance Management Systems) for maintenance workflow.

**Strengths.** Extremely wide deployment in manufacturing — many OT vendors already have TeamViewer connectivity to end-customer devices. Ease of deployment. Strong CMMS integration for maintenance workflows.

**Limitations.** TeamViewer does not provide OT protocol awareness, passive monitoring, or asset discovery. It is a remote access tool, not an OT security platform.

**Best fit.** Manufacturing OT vendor remote support workflows. Good starting point for replacing ad-hoc remote access with managed, authenticated connectivity.

---

## 6. Zscaler Private Access for OT

**Category.** Enterprise ZTNA with OT connector deployment.

**How it works.** Zscaler Private Access (ZPA) provides application-level ZTNA — users access named applications (by hostname/IP and port), not network segments. For OT environments, Zscaler App Connectors are deployed on gateway devices inside the OT DMZ or OT zone. No inbound connections to the OT network; connectors make outbound connections to the Zscaler cloud. Users authenticate to ZPA and access OT resources through the connector.

**OT-specific capabilities.**
- Connector-based architecture means OT devices need no software changes.
- Private Application discovery automatically maps OT resources accessible through connectors.
- Conditional access: access policies can require MFA, device certificate check, and geolocation verification.

**Strengths.** Zscaler ZPA is a mature, battle-tested ZTNA platform. The connector model works well for OT environments where device agents are not possible.

**Limitations.** Not OT-aware. Zscaler ZPA treats OT protocols as opaque TCP — it provides access control but no protocol-level inspection or behavioural detection. Requires pairing with an OT monitoring tool for visibility.

**Best fit.** Enterprises with Zscaler SSE who want to extend ZTNA to OT environments without deploying separate OT remote access infrastructure.

---

## 7. Cyolo Zero Trust Access for OT

**Category.** ZTNA platform with OT-specific vendor access management.

**How it works.** Cyolo provides a ZTNA platform with an on-premises component (Cyolo IDAC — Identity-Defined Access Controller) that addresses OT environments where cloud connectivity is restricted or prohibited. The IDAC runs on-premises inside the OT DMZ; vendor sessions transit the IDAC, which enforces access policy and records sessions without requiring cloud connectivity.

**OT-specific capabilities.**
- On-premises deployment option is critical for air-gapped facilities.
- OT application catalogue with pre-defined connectors for common industrial software (Siemens TIA Portal, Rockwell FactoryTalk, Schneider Electric EcoStruxure).
- Vendor access portal with JIT access workflows.
- Session recording for remote access sessions.

**Strengths.** On-premises ZTNA with zero cloud connectivity requirement is rare and important for high-security manufacturing environments. The OT application catalogue reduces integration time.

**Limitations.** Smaller vendor than Claroty, Cisco, or Fortinet. Less deep on OT monitoring (asset discovery, anomaly detection).

**Best fit.** Air-gapped or internet-restricted OT environments requiring on-premises ZTNA without cloud dependency.

---

## 8. PTC Vuforia Instruct + Axeda Remote Access

**Category.** Manufacturing IoT platform with secure remote access (OEM/service use case).

**How it works.** PTC's Axeda platform provides IoT device management and secure remote access for IoT device OEMs. Device manufacturers embed the Axeda agent in their products; customers grant remote access sessions to authorised service technicians through the Axeda portal.

**OT-specific capabilities.**
- Designed for OEM-to-customer remote support workflows.
- Device-level access control — technicians access specific named devices, not networks.
- Session recording and audit trail.

**Strengths.** The right tool for connected product manufacturers who need to provide remote service access to products they have sold to customers. This is a different use case from most tools in this list.

**Limitations.** Narrow applicability. Primarily for embedded product manufacturers, not for general industrial infrastructure security.

**Best fit.** OEM manufacturers shipping industrial equipment with remote service capability built in.

---

## 9. Palo Alto Networks NGFW + Prisma Access for OT

**Category.** Enterprise firewall with OT application identification and ZTNA.

**How it works.** Palo Alto Networks' industrial firewall capabilities extend App-ID and ML-based threat detection to OT protocols (Modbus, DNP3, Ethernet/IP) when deployed inline in the OT network. Prisma Access provides ZTNA for remote access, and the PA-series NGFWs provide physical OT protocol inspection.

**OT-specific capabilities.**
- App-ID for OT protocols identifies industrial transactions in firewall policy.
- ML-based threat detection for OT protocol anomalies.
- IoT Security module provides asset discovery and vulnerability management.

**Strengths.** Deep OT protocol inspection at the network firewall layer. For manufacturers that already use Palo Alto NGFWs at the OT DMZ, adding IoT Security and OT app-IDs builds on existing infrastructure.

**Limitations.** Physical firewall deployment required for OT protocol inspection.

**Best fit.** Manufacturers with Palo Alto NGFW at the OT DMZ boundary.

---

## 10. QuickZTNA for Manufacturing Networks

**Category.** Modern ZTNA platform for manufacturing IT + OT access.

**How it works.** QuickZTNA addresses manufacturing remote access at the IT/OT boundary — specifically the scenario of bringing modern zero-trust access control to manufacturing environments where legacy VPN grants overly broad access. QuickZTNA connector deployment on the IT-side OT gateway enables per-resource access control for manufacturing engineering workstations, historians, MES systems, and SCADA HMIs in the OT DMZ. Device posture checks prevent unmanaged or non-compliant laptops from connecting to OT assets.

**Manufacturing use cases.**
- **Remote engineering vendor access.** Replace legacy VPN for machine vendors (Siemens, Rockwell, FANUC) with per-machine JIT access via QuickZTNA, recorded and time-limited.
- **Multi-site manufacturing.** Engineers in one facility accessing another facility's systems use QuickZTNA with per-site access policies and posture enforcement.
- **Manufacturing employee remote work.** Production planners, quality engineers, and maintenance managers working from home access MES and historian systems through QuickZTNA without exposing those systems to broader VPN access.
- **Post-M&A network consolidation.** Newly acquired manufacturing facilities accessed by corporate IT and engineering teams through QuickZTNA while network consolidation is planned.

**Strengths.**
- Fast deployment in manufacturing environments. No changes to OT devices; QuickZTNA connector on a gateway PC or ruggedised Linux device creates the access path.
- Post-Quantum WireGuard encryption satisfies the growing requirement for quantum-resistant cryptography in critical infrastructure supply chain assessments.
- Per-resource access policy replaces VPN subnet access — vendors reach specifically the machine they need, not the entire OT VLAN.
- MagicDNS resolves manufacturing device hostnames without requiring public DNS records.

**Limitations.** Not an OT-specific platform. No passive OT protocol monitoring, no OT-specific asset discovery, no Modbus/DNP3 protocol inspection. QuickZTNA is the access layer; it should be combined with an OT monitoring tool (Claroty, Nozomi) for the monitoring layer.

**Best fit.** Small to mid-market manufacturers wanting a modern ZTNA replacement for legacy VPN vendor access. Excellent for the remote engineering vendor access use case without the cost and complexity of a full Claroty deployment. Also the right tool for the IT side of the IT/OT convergence boundary.

---

## Comparison table

| Tool | OT protocol-aware | Agentless OT devices | On-premises deployment | Asset discovery | Best use case |
|---|---|---|---|---|---|
| Claroty xDome | ✅ Best-in-class | ✅ | ✅ | ✅ Passive | Enterprise OT security |
| Nozomi Vantage | ✅ | ✅ | ✅ | ✅ | OT monitoring + access |
| Fortinet OT | ✅ Firewall-level | ✅ | ✅ | ✅ FortiNAC | Fortinet-standardised OT |
| Cisco Cyber Vision | ✅ Switch-embedded | ✅ | ✅ | ✅ | Cisco IE switching |
| TeamViewer Tensor | ❌ | Agent-light | ❌ SaaS | ❌ | Vendor remote support |
| Zscaler ZPA | ❌ (opaque TCP) | ✅ Connector | ❌ SaaS | ❌ | Zscaler-standardised IT+OT |
| Cyolo | ❌ | ✅ | ✅ | ❌ | Air-gapped OT |
| PTC Axeda | Partial | ✅ Agent | ❌ | ❌ | OEM connected products |
| PA Networks | ✅ | ✅ Connector | ✅ | ✅ | PA-standardised OT |
| QuickZTNA | ❌ (opaque TCP) | ✅ Connector | ❌ SaaS | ❌ | IT/OT boundary access |

---

## Related reading

- [ZTNA vs VPN: 8 Real Differences](/blog/ztna-vs-vpn)
- [Post-Quantum Cryptography for Networks in 2026](/blog/post-quantum-cryptography-networks)
- [Zero Trust for Remote Access: 2026 Guide](/blog/what-is-zero-trust)

## QuickZTNA for Manufacturing

QuickZTNA provides modern zero-trust remote access for engineering vendor management, multi-site connectivity, and IT/OT boundary access — replacing the legacy VPN patterns that have made manufacturing the most attacked industry three years running. [Contact our team](mailto:sales@quickztna.com) to discuss your manufacturing access architecture.
