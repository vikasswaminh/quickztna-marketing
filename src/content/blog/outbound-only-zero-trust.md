---
title: "Outbound-Only Zero Trust: Eliminate Public IPs & Open Ports"
description: "Learn how Outbound-Only Zero Trust Architecture eliminates public IPv4 addresses and open inbound ports across AWS, Azure, and GCP using WireGuard P2P mesh networking."
publishedAt: 2026-08-19
author:
  name: QuickZTNA Engineering
  role: Security Architecture team
  url: https://github.com/quickztna
category: technical
tags:
  - zero-trust
  - outbound-only
  - wireguard
  - cloud-security
  - microsegmentation
  - technical
primaryKeyword: outbound-only zero trust
wordCount: 3950
faq:
  - q: "If my cloud server has no public IP and zero open inbound ports, how do administrators first install and access the node?"
    a: "Administrators initialize the server during cloud provisioning using host launch scripts (Cloud-Init, AWS User Data, or Custom Machine Images). The launch script installs the ztna agent package and passes a pre-authenticated deployment key (ZTNA_AUTH_KEY). Once executed, the daemon opens an outbound TLS connection to the control plane, receives its assigned 100.64.x.x tailnet IP address, registers its WireGuard public key, and begins listening on the virtual ztna0 interface. Administrators can then SSH directly to the internal tailnet domain over the encrypted P2P tunnel with zero exposed public IPs or open inbound physical ports."
  - q: "How does Outbound-Only Zero Trust handle legacy appliances that cannot run a software client agent?"
    a: "QuickZTNA uses Subnet Route Advertisements. A lightweight Linux node running the ztna daemon inside the private subnet is designated as a Subnet Router (e.g., ztna route advertise 192.168.1.0/24). It securely bridges traffic between authorized mesh peers and non-agent legacy devices (industrial PLCs, mainframes, legacy databases, network-attached storage) without exposing those devices to the public internet."
  - q: "Does outbound-only traffic slow down database query performance or web application response times?"
    a: "No. Because QuickZTNA establishes direct peer-to-peer (P2P) WireGuard UDP connections whenever NAT mappings permit, network packets travel across the shortest geographic path between peers. Lab benchmarks show direct P2P connection throughput exceeding 4.12 Gbps with sub-19ms latencies, significantly outperforming central proxy architectures and hub-and-spoke legacy VPN gateways."
  - q: "What happens if a corporate firewall blocks outbound UDP traffic entirely?"
    a: "If corporate outbound firewalls drop UDP packets, QuickZTNA automatically falls back to global DERP Relays (hosted in Bangalore and Frankfurt). The agent wraps WireGuard encrypted packets inside standard TCP/443 HTTPS frames to establish an outbound TLS connection. Because payload data remains encrypted using local WireGuard keys, relay servers cannot decrypt or view private data."
  - q: "Is it possible for a compromised device on the tailnet to attack other connected workloads?"
    a: "No. QuickZTNA evaluates Attribute-Based Access Control (ABAC) rules per connection. Unlike traditional VPNs that grant broad subnet access upon authentication, an endpoint tagged tag:finance-laptop is cryptographically restricted from communicating with tag:production-db unless an explicit ACL rule permits it. Furthermore, if a machine fails continuous posture checks, it is automatically quarantined from the network instantly."
---

## TL;DR

Publicly accessible IP addresses and open inbound firewall ports represent the single largest initial access attack vector in modern cloud and hybrid environments. Mass internet scanners like Shodan and Censys index exposed IPv4 addresses within minutes of provisioning, leaving services vulnerable to credential brute-forcing, zero-day Remote Code Execution (RCE) exploits, and DDoS floods. Outbound-Only Zero Trust Architecture eliminates this exposure by reversing the connection model: workloads never listen for inbound connections or bind public IPs. Instead, endpoints establish outbound-only stateful TLS signaling sessions to a central coordination plane and establish direct peer-to-peer encrypted WireGuard mesh tunnels dynamically based on authenticated identity, attribute-based access control (ABAC), and continuous device posture checks.

## Who this is for

Infrastructure Architects, CISOs, SecOps Engineers, and DevOps Lead Engineers responsible for multi-cloud network security across AWS, Azure, GCP, or on-premises data centers who want to eliminate bastion hosts, close all open inbound ports, and reduce cloud NAT gateway egress costs.

> [!NOTE]
> **Definition: Outbound-Only Zero Trust Architecture**
> A networking model where workload endpoints (servers, containers, databases) maintain **ZERO open inbound listening ports** and require **NO public IP addresses**. Endpoints establish outbound-only, encrypted TLS signaling tunnels to a central control plane, establishing peer-to-peer WireGuard mesh tunnels dynamically based on authenticated identity, attribute-based access control (ABAC), and continuous device posture checks.

### Key Takeaways for SecOps and Infrastructure Architects

- **Zero Public Inbound Ports**: Workloads operate behind NAT or strict outbound-only firewalls with zero open inbound ports (`0.0.0.0/0` ingress: DENY ALL).
- **Zero Public IPv4 Addresses**: Cloud instances do not require elastic or public IPv4 addresses, cutting infrastructure exposure and cloud NAT gateway egress costs.
- **Peer-to-Peer Encryption**: Data paths use WireGuard primitives (X25519, ChaCha20-Poly1305) directly between peers whenever NAT mapping allows, bypassing centralized VPN bottleneck proxies.
- **Control vs. Data Plane Separation**: The coordination server manages public key exchanges, identity synchronization, and ACL policy evaluation, but never touches or inspects unencrypted data payloads.
- **Automatic Fallback Mechanics**: When symmetric NAT or strict corporate enterprise firewalls block direct UDP traffic, encrypted TCP-over-HTTPS fallback relays (DERP) guarantee 100% connectivity without breaking security boundaries.

---

## 1. Problem Statement: The Cost of Public IPs and Open Ports

Exposing workloads directly to the public internet creates systemic security vulnerabilities and operational friction across modern IT organizations.

### Automated Scanning and Zero-Day Exploitation
Attackers no longer target organizations through manual reconnaissance alone. Mass internet scanners continuously map the entire IPv4 space. When a new vulnerability (CVE) is disclosed in a common daemon—such as OpenSSH, OpenSSL, or web server software—automated exploit bots target exposed IPs before security teams can test and push security patches.

### The Fallacy of Bastion Hosts and Jump Boxes
Historically, engineering teams deployed Bastion hosts (Jump Boxes) to restrict access to private VPC subnets. However, Bastion hosts merely consolidate risk into a single, high-value target. A single compromised SSH key, misconfigured `sshd_config`, or unpatched vulnerability on a Bastion server grants an attacker unrestricted network visibility across all internal subnets. Furthermore, managing SSH keys (`authorized_keys`), rotation, and IP allowlisting across hundreds of developers introduces massive administrative overhead.

### Lateral Movement Risk
Traditional perimeter-based networks assume everything inside the internal subnet is trusted. Once an attacker breaches an exposed public IP or Bastion box, there are no internal microsegmentation boundaries. Traffic moves freely east-west across subnets to compromise sensitive databases, internal payment gateways, and code repositories.

### Cloud Cost Overhead
Cloud providers actively penalize public IPv4 usage. AWS, GCP, and Azure charge hourly fees for every public IPv4 address attached to an instance or NAT gateway. Operating public IPs across hundreds of cloud instances inflates monthly cloud bills while increasing attack surface management complexity.

---

## 2. Historical Evolution: DMZs to Outbound-Only Mesh

Network remote access architecture has evolved through four distinct generations:

1. **Era 1: Physical Perimeters and DMZs (1990s–2000s)**: Firewalls separated untrusted external networks from internal LANs using Demilitarized Zones (DMZs). Security depended entirely on physical location: being inside the office meant full network trust.
2. **Era 2: Hub-and-Spoke Corporate VPNs (2000s–2010s)**: Mobile workforces connected to central IPsec/OpenVPN concentrators. This anchored all traffic through corporate gateways, causing severe latency (hairpinning) and granting broad, unsegmented access once connected.
3. **Era 3: Centralized ZTNA Reverse Proxies (2010s–2020s)**: First-generation ZTNA introduced identity-aware reverse proxies. While removing direct IP exposure for web apps, it forced all organizational traffic through vendor cloud proxies, introducing latency and privacy concerns.
4. **Era 4: Outbound-Only Mesh Architecture (2026+)**: Modern ZTNA decouples control signaling from data transfer. Workloads initiate outbound-only connections to establish identity, then form direct WireGuard P2P tunnels to peer devices with zero exposed public IPs and zero open inbound ports.

---

## 3. Core Definition: What Is Outbound-Only Zero Trust?

Outbound-Only Zero Trust Architecture is a networking framework where endpoints establish network access exclusively through outbound cryptographic sessions. Instead of opening inbound ports (TCP 22, TCP 443, TCP 3389) and waiting for client requests, the server agent acts as a client to a secure control plane. It opens an outbound connection to register, discover peer nodes, and exchange encryption keys.

```text
                   OUTBOUND-ONLY TRAFFIC FLOW PARADIGM
                   
 Traditional Inbound Model:
 Attacker [Connect Inbound] ---> [ Open Port 22/443 ] ---> Server (VULNERABLE)
 
 Outbound-Only Model:
 Attacker [Connect Inbound] ---> [ DENY ALL / CLOSED ]    Server (INVISIBLE)
                                         |
                                         +--- (Outbound TLS Only) ---> Control Plane
```

### Core Architectural Axioms

- **Default Deny All Ingress**: All inbound firewall rules at host OS and cloud security group layers are set to `DROP / DENY ALL`.
- **Identity over IP**: Access permissions are bound to authenticated human or machine identities (OIDC/SAML claims, SCIM groups, machine tags) rather than IP addresses.
- **Continuous Posture Checks**: Tunnels maintain active connectivity only while endpoints satisfy device posture rules (antivirus state, disk encryption, OS build).
- **Outbound State Tracking**: Stateful firewalls track established outbound sessions, blocking unsolicited external connection attempts.

---

## 4. Control Plane vs. Data Plane Separation

QuickZTNA enforces strict separation between control plane orchestration and data plane encapsulation.

```mermaid
graph TD
    subgraph Control Plane ["Central Control Plane (login.quickztna.com)"]
        AUTH["SSO / SCIM 2.0 Identity Engine"]
        POLICY["ABAC Policy Engine & Linter"]
        COORD["Coordination & Key Exchange Server"]
    end

    subgraph Peer Node A ["Developer Laptop (Client Peer)"]
        AGENT1["ztna Engine Daemon"]
        POSTURE1["Device Posture Engine"]
        KEY1["Private Key A / Public Key A"]
    end

    subgraph Peer Node B ["Cloud DB Node (Workload Peer)"]
        AGENT2["ztna Engine Daemon"]
        KEY2["Private Key B / Public Key B"]
        DB["PostgreSQL Database :5432"]
    end

    AGENT1 <-->|"1. Outbound TLS / Auth & Posture Check"| AUTH
    AGENT2 <-->|"2. Outbound TLS / Registration"| COORD
    COORD -->|"3. Push Public Key B & ABAC Policy"| AGENT1
    COORD -->|"4. Push Public Key A & ABAC Policy"| AGENT2

    AGENT1 <==|"5. Direct Encrypted WireGuard UDP Tunnel (100.64.0.x)"|==> AGENT2
    AGENT2 -->|"6. Local Loopback Forward"| DB

    style Control Plane fill:#e6f2ff,stroke:#333,stroke-width:1px
    style Peer Node A fill:#e6ffe6,stroke:#333,stroke-width:1px
    style Peer Node B fill:#fff0f5,stroke:#333,stroke-width:1px
```

- **The Control Plane**: Manages SSO/SCIM directory sync, public key distribution, ABAC policy evaluation, and device posture telemetry. The control plane never receives, decrypts, or proxies customer payload traffic.
- **The Data Plane**: Consists of local `ztna` daemons running directly on endpoints. It encrypts packets locally using WireGuard (ChaCha20-Poly1305) and routes them directly between peers over virtual tailnet IP addresses (`100.64.0.0/10`).

---

## 5. Protocol Mechanics: STUN, DERP Relays, and WireGuard

- **STUN NAT Discovery**: Endpoints send outbound UDP probes to STUN servers within QuickZTNA's network to discover their public IP and port mapping type (Full Cone, Restricted, or Symmetric NAT).
- **UDP Hole Punching**: Endpoints simultaneously initiate outbound UDP connections to each other's discovered public mapping ports. Stateful firewalls log outbound requests, opening return paths for direct P2P WireGuard communication without open inbound ports.
- **DERP Relay Fallback**: When strict symmetric NAT firewalls block UDP traffic, endpoints open outbound TCP/443 HTTPS connections to global DERP relays (located in Bangalore and Frankfurt). Packets are relayed in encrypted WireGuard format; relay servers cannot decrypt the underlying payload.
- **Cryptographic Primitives**: Uses Curve25519 (X25519) key exchange, ChaCha20-Poly1305 authenticated encryption, and BLAKE2s / Poly1305 message authentication.

---

## 6. Core Entities & Semantic Relationships

| Entity | System Role | Primary Attributes | Semantic Relationship |
| :--- | :--- | :--- | :--- |
| **User** | Authenticated Human Identity | `email`, `sub`, `scim_groups` | Authenticates via SSO; owns one or more fleet endpoints. |
| **Device (Node)** | Encrypted Endpoint Client | `node_id`, `tailnet_ip`, `pubkey` | Generates keypairs; executes posture checks; opens outbound tunnels. |
| **Tag** | Logical ABAC Security Group | `tag:prod`, `tag:db`, `tag:dev` | Attached to devices via API/IaC; target for ACL rules. |
| **Policy (ACL)** | Access Control Ruleset | `action`, `src`, `dst`, `ports` | Defines allowed traffic paths between tags/users. |
| **Tailnet IP** | Virtual Network Address | `100.64.0.0/10` address | Non-routable internal IP assigned uniquely to an endpoint in the mesh. |
| **DERP Relay** | Fallback Transport Node | `BLR-Relay`, `FRA-Relay` | Relays encrypted frames over outbound TCP/443 when UDP is blocked. |

---

## 7. Step-by-Step Connection Packet Flow

### Step 1: Admin Configures Server Behind Firewall (Zero-Ingress Hardening)
- **Physical State**: The cloud workload server (e.g., AWS EC2, Azure VM, or bare-metal host) is provisioned within a private subnet.
- **Firewall Rules Applied**:
  - **Ingress (Inbound)**: `0.0.0.0/0` -> `DROP ALL` (All physical interface listening ports, including SSH 22, RDP 3389, and HTTP 80/443, are completely blocked).
  - **Egress (Outbound)**: `ALLOW TCP/443` (Stateful outbound traffic to HTTPS endpoints is permitted).
- **Kernel Network Stack Behavior**: The host OS kernel network layer drops all incoming TCP SYN packets before they reach application sockets. Port scanners like Shodan or Nmap receive zero response (*Filtered / Closed*), making the server completely invisible on the public IPv4 internet.

### Step 2: Server Daemon Launches & Registers Outbound Control Connection
- **Daemon Initialization**: Systemd boots the `ztna` daemon binary:
  ```bash
  /usr/local/bin/ztna daemon --config=/etc/quickztna/config.yaml
  ```
- **Control Handshake**: The daemon reads a pre-authenticated deployment key (`ZTNA_AUTH_KEY=tskey-auth-prod-xxx`) and initiates an outbound TLS 1.3 encrypted WebSocket connection to `login.quickztna.com:443`.
- **Cryptographic Registration**:
  1. The server daemon generates a local Curve25519 (X25519) static keypair in host memory. The private key never leaves the host.
  2. The daemon sends its public key (`PubKey_Server`), hostname, and requested tags (`tag:prod-db`) over the TLS 1.3 control channel.
- **Network Interface Assignment**: The control plane validates the deployment key, registers the server, and assigns it an immutable internal CGNAT IPv4 address from the `100.64.0.0/10` address space (e.g., `100.64.12.44`). The daemon binds this address to a virtual network device (`ztna0`).

### Step 3: Developer Initiates Terminal SSH Request
- **User Action**: Developer Alice opens her local terminal and executes a standard SSH command:
  ```bash
  ssh admin@prod-db.myorg.zt.net
  ```
- **Operating System Behavior**: The operating system's standard networking stack prepares an IP packet. Before sending it out the physical Wi-Fi or Ethernet adapter, it queries the local DNS resolver to translate the domain name `prod-db.myorg.zt.net` into an IP address.

### Step 4: Local MagicDNS Interception & Address Translation
- **DNS Interception**: The `ztna` daemon running on Alice's laptop acts as a local stub resolver listening on `127.0.0.53:53` or binding to the OS DNS configuration via `systemd-resolved` (Linux) or `scutil` (macOS).
- **TLD Matching**: The local resolver detects the request ending in the organization's tailnet domain suffix (`*.zt.net`).
- **Instant In-Memory Lookup**: Instead of forwarding the DNS query to external resolvers (like Google `8.8.8.8` or Cloudflare `1.1.1.1`), MagicDNS consults its local encrypted cache table synchronized from the control plane:
  ```text
  prod-db.myorg.zt.net  ==>  100.64.12.44
  ```
- **Local Response**: MagicDNS returns `100.64.12.44` to Alice's SSH client in `< 1 millisecond`. The system routing table routes all traffic destined for `100.64.0.0/10` straight into the virtual `ztna0` interface.

### Step 5: Laptop Daemon Dispatches Signed Posture & Auth Request
- **Session Trigger**: Alice’s local `ztna` daemon detects outgoing traffic routed to `100.64.12.44:22`. It places the TCP handshake packets in a local queue while validating network permissions.
- **Local Posture Collection**: The local posture engine evaluates host security metrics:
  - **Disk Encryption**: Verifies BitLocker status (Windows), FileVault status (macOS), or LUKS status (Linux).
  - **Antivirus / EDR**: Checks for active running processes of enterprise EDR daemons (CrowdStrike, SentinelOne, Microsoft Defender).
  - **OS Version**: Confirms OS build matches minimum corporate security patch baselines.
- **Control Signaling**: The client daemon sends an outbound TLS 1.3 signaling request to `login.quickztna.com` containing:
  - User Alice’s authenticated OIDC/SAML token session identifier.
  - Signed device posture status payload.
  - Destination requested: `100.64.12.44` on port `22`.

### Step 6: Policy Engine Evaluates Attribute-Based Access Control (ABAC)
- **Attribute Aggregation**: QuickZTNA's ABAC Engine running on the control plane aggregates multi-dimensional security attributes:
  - **Identity Attributes**: `user.email = alice@company.com`, `user.groups = [devops, engineering]`
  - **Device Attributes**: `device.posture = COMPLIANT`, `device.os = macOS 14.6`
  - **Target Attributes**: `target.ip = 100.64.12.44`, `target.tags = [tag:prod-db]`, `target.port = 22`
  - **Contextual Attributes**: `time = 14:26 IST`, `location = India`
- **Policy Rule Evaluation**: The engine compares these attributes against active organization ACL rules:
  ```json
  {
    "Action": "accept",
    "Src": ["group:devops"],
    "Dst": ["tag:prod-db:22"],
    "RequirePosture": true
  }
  ```
- **Decision**: All conditions match on a Default-Deny basis. Access is **APPROVED**.

### Step 7: Key Distribution & Ephemeral Token Minting
- **Key Provisioning**: The control plane mints a short-lived, cryptographically signed connection grant.
- **Asymmetric Exchange**:
  1. The control plane sends Node B's WireGuard public key (`PubKey_Server`) and current NAT mapping details to Alice’s laptop.
  2. Simultaneously, the control plane pushes Alice’s WireGuard public key (`PubKey_Alice`) and NAT mapping details down to the target cloud server over its existing outbound TLS control channel.
- **Zero-Trust Boundary**: The control plane never receives or stores private keys. Private keys (`PrivKey_Alice` and `PrivKey_Server`) remain strictly inside local host RAM.

### Step 8: STUN NAT Traversal & Simultaneous UDP Hole Punching
- **STUN Discovery**: Both endpoints send outbound UDP discovery packets to STUN servers within QuickZTNA’s global relay infrastructure (e.g., `STUN-BLR-01`). The STUN servers reply with each node's public IP address and port mapping.
- **Simultaneous UDP Hole Punching**:
  1. Alice’s laptop sends an outbound WireGuard UDP packet to Server B’s public NAT mapping (`203.0.113.45:41194`).
  2. Server B simultaneously sends an outbound WireGuard UDP packet to Alice’s public NAT mapping (`198.51.100.12:52110`).
  3. The stateful firewalls on both sides record these outbound requests, dynamically adding state entries that allow incoming packets from that specific remote IP/port. Direct peer-to-peer UDP connectivity is established without open inbound ports.

```text
          FALLBACK MECHANISM (IF UDP HOLE PUNCHING FAILS)
          
 If symmetric NAT or corporate enterprise firewalls drop UDP packets:
 Dev Laptop ---> (Outbound TCP/443 TLS) ---> DERP Relay (BLR) <--- (Outbound TCP/443 TLS) <--- Cloud Server
 
 * The DERP relay forwards WireGuard-encrypted frames without decrypting payload data.
```

### Step 9: WireGuard NoiseIK Handshake & P2P Tunnel Creation
- **1-RTT Cryptographic Handshake**: Alice’s laptop and Server B exchange initial WireGuard NoiseIK handshake packets over the newly established UDP path.
- **Key Agreement**:
  - Endpoints execute a Curve25519 (X25519) ECDH key agreement.
  - Symmetric encryption keys are derived locally using BLAKE2s key derivation functions.
- **Session Channel Activation**: The `ztna0` virtual interfaces on both endpoints transition to active state. A secure peer-to-peer WireGuard tunnel is established using ChaCha20-Poly1305 AEAD authenticated encryption.

### Step 10: Encapsulated SSH Traffic Streaming & Continuous Verification
- **Packet Encapsulation**:
  1. Alice’s SSH client transmits raw TCP data destined for `100.64.12.44:22`.
  2. The local `ztna` daemon captures the raw IP packet from the `ztna0` virtual interface.
  3. The daemon encrypts the payload using ChaCha20-Poly1305 and appends a Poly1305 MAC authentication tag.
  4. The encrypted payload is wrapped inside an outer UDP datagram (`SrcPort: 52110`, `DstPort: 41194`) and sent across the physical internet.
- **Packet Decapsulation**:
  1. Server B receives the UDP packet on its outer socket.
  2. The server’s `ztna` daemon decrypts and verifies the Poly1305 MAC tag using `PubKey_Alice`.
  3. The inner decrypted TCP packet (`100.64.12.44:22`) is injected into the local OS network loopback interface directly to the listening OpenSSH daemon (`sshd`).
- **Continuous Verification**: While the SSH session streams at native P2P speeds (up to 4.12 Gbps), the client daemon sends periodic posture heartbeats to the control plane. If Alice turns off disk encryption or disables her antivirus mid-session, the control plane immediately revokes session keys, instantly terminating the WireGuard tunnel.

---

## 8. Real-World Deployment Configurations & Code Examples

### 8.1 Host Hardening: Linux Stateful Outbound-Only Firewall Script

Save as `/usr/local/bin/apply-ztna-firewall.sh`:

```bash
#!/usr/bin/env bash
# Strict Outbound-Only Firewall Script for Linux Workloads
set -euo pipefail

# 1. Flush existing rules
iptables -F
iptables -X

# 2. Set default policies: DROP ALL INBOUND, ALLOW OUTBOUND
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# 3. Allow loopback traffic
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# 4. Allow established outbound state tracking (Crucial for Outbound-Only ZTNA)
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# 5. Allow QuickZTNA Virtual Mesh Interface (ztna0)
iptables -A INPUT -i ztna0 -j ACCEPT
iptables -A FORWARD -i ztna0 -j ACCEPT

# 6. Verify zero open inbound physical ports
iptables -L -v -n
```

### 8.2 Production Linux Systemd Service Configuration

Save as `/etc/systemd/system/ztna.service`:

```ini
[Unit]
Description=QuickZTNA Outbound-Only Zero Trust Network Daemon
Documentation=https://www.quickztna.com/docs/
After=network-online.target systemd-resolved.service
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/ztna daemon --config=/etc/quickztna/config.yaml
ExecReload=/usr/local/bin/ztna reload
Restart=always
RestartSec=5s
LimitNOFILE=65536
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

### 8.3 Docker Compose Outbound Sidecar Setup

Save as `docker-compose.yml`:

```yaml
version: '3.8'

services:
  quickztna-agent:
    image: quickztna/agent:latest
    container_name: ztna-outbound-sidecar
    restart: always
    network_mode: "host"
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - ZTNA_AUTH_KEY=tskey-auth-k8s-prod-9988776655
      - ZTNA_HOSTNAME=app-db-sidecar-01
      - ZTNA_ADVERTISE_TAGS=tag:prod,tag:database
      - ZTNA_ACCEPT_ROUTES=true
    volumes:
      - ztna-state:/var/lib/quickztna

  postgres-database:
    image: postgres:16-alpine
    container_name: production-postgres
    restart: always
    environment:
      POSTGRES_DB: app_production
      POSTGRES_USER: db_admin
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
    # NOTICE: NO PORTS EXPOSED TO HOST OR PUBLIC INTERNET!
    expose:
      - "5432"
    secrets:
      - db_password

volumes:
  ztna-state:

secrets:
  db_password:
    file: ./db_password.txt
```

### 8.4 Kubernetes Pod Deployment Manifest

Save as `ztna-sidecar.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: internal-api-deployment
  namespace: production
  labels:
    app: internal-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: internal-api
  template:
    metadata:
      labels:
        app: internal-api
    spec:
      containers:
      - name: api-server
        image: myorg/internal-api:v2.4.1
        ports:
        - containerPort: 8080

      - name: ztna-sidecar
        image: quickztna/agent:latest
        securityContext:
          capabilities:
            add: ["NET_ADMIN", "NET_RAW"]
        env:
        - name: ZTNA_AUTH_KEY
          valueFrom:
            secretKeyRef:
              name: ztna-secrets
              key: auth-key
        - name: ZTNA_HOSTNAME
          value: "k8s-internal-api"
        - name: ZTNA_ADVERTISE_TAGS
          value: "tag:k8s,tag:api"
```

### 8.5 Infrastructure-as-Code: Terraform Provider Rules

Save as `main.tf`:

```hcl
terraform {
  required_providers {
    quickztna = {
      source  = "quickztna/quickztna"
      version = "~> 1.4.0"
    }
  }
}

provider "quickztna" {
  api_token = var.quickztna_api_token
}

# Generate Ephemeral Pre-Auth Key for Auto-Scaling Group
resource "quickztna_pre_auth_key" "asg_key" {
  reusable      = true
  ephemeral     = true
  expiration_s  = 86400 # 24 hours
  tags          = ["tag:prod", "tag:web"]
}

# Define Attribute-Based Access Control (ABAC) Rules
resource "quickztna_acl_policy" "production_policy" {
  policy_json = jsonencode({
    ACLs = [
      {
        Action = "accept"
        Src    = ["group:devops", "tag:ci-cd"]
        Dst    = ["tag:prod:22", "tag:prod:443"]
      },
      {
        Action = "accept"
        Src    = ["tag:web"]
        Dst    = ["tag:database:5432"]
      }
    ]
    TagOwners = {
      "tag:prod"     = ["group:security-admins"]
      "tag:database" = ["group:database-team"]
    }
  })
}
```

---

## 9. Empirical Benchmarks & Performance Metrics

### Test Topology
- **Client**: Apple MacBook Pro (M3 Max, macOS 14.6), `ztna` v2.4.1.
- **Server**: AWS `c6i.xlarge` (Ubuntu 24.04 LTS, 4 vCPU, 8 GB RAM, AWS East).
- **Tools**: `iperf3` (Throughput), `ping` (Latency RTT), `psrecord` (RAM/CPU footprint).

### Benchmark Results

| Access Architecture | Transport Protocol | TCP Throughput | Avg Latency RTT | RAM Footprint | CPU Usage | Open Inbound Ports |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QuickZTNA (Direct P2P)** | WireGuard UDP | **4.12 Gbps** | **18.4 ms** | **24 MB** | **2.1%** | **0 (Zero)** |
| **QuickZTNA (DERP Relay)** | TCP/443 Fallback | 1.84 Gbps | 34.2 ms | 28 MB | 3.8% | 0 (Zero) |
| **Legacy OpenVPN** | UDP Tunnel | 0.84 Gbps | 48.6 ms | 112 MB | 14.6% | Yes (UDP 1194) |
| **Traditional IPsec** | ESP / IKEv2 | 2.10 Gbps | 28.1 ms | 180 MB | 8.4% | Yes (UDP 500/4500) |
| **Centralized ZTNA Proxy** | Reverse HTTP | 1.15 Gbps | 62.8 ms | N/A (Cloud) | N/A (Cloud) | No (Vendor Agent) |
| **Bastion Host (SSH Tunnel)**| TCP / SSH | 0.42 Gbps | 42.1 ms | 48 MB | 6.2% | Yes (TCP 22) |

QuickZTNA delivers 4.12 Gbps direct P2P throughput with sub-19ms latency while utilizing only 24 MB of memory, outperforming legacy VPN concentrators and centralized reverse proxies.

---

## 10. Security Threat Vector Containment

| Threat Vector | Traditional Firewall & VPN | Outbound-Only ZTNA Architecture | Risk Containment Mechanism |
| :--- | :--- | :--- | :--- |
| **Shodan / Censys Scanning** | **High Risk**: Exposed IPs and open ports cataloged publicly. | **Zero Risk**: No public IPs; firewalls drop all probes. | Endpoints do not respond to external SYN packets. |
| **Zero-Day Vulnerability (RCE)** | **High Risk**: Flaws in exposed web servers or SSH exploited. | **Mitigated**: Exploits cannot reach unauthenticated ports. | Attackers cannot initiate TCP SYN without valid WireGuard keys. |
| **Credential Brute Forcing** | **High Risk**: SSH port 22 or RDP port 3389 hammered. | **Eliminated**: No exposed login interface visible to internet. | Authentication occurs prior to network path setup via SSO/MFA. |
| **Ransomware Lateral Spread** | **High Risk**: Flat internal network allows uninhibited spread. | **Blocked**: Default-deny ABAC isolates infected peers. | Compromised laptops cannot communicate with un-tagged servers. |
| **DDoS Volumetric Attacks** | **High Risk**: Public IPs overwhelmed by SYN/UDP floods. | **Eliminated**: Firewalls drop unauthenticated ingress. | Infrastructure is unroutable from public internet. |

---

## 11. Diagnostic & Troubleshooting Playbook

### Diagnostic CLI Commands

#### `ztna netcheck` — Local Network & NAT Diagnostic
- **What it does**: Tests your local internet link, discovers your public NAT firewall type (Full Cone vs. Symmetric NAT), checks STUN resolution, and measures latency to global DERP relays (BLR & FRA).
- **When to use**: Run first when troubleshooting to verify your local machine can establish outbound UDP/TCP connections.

#### `ztna status` — Live Tailnet Mesh & Peer Inspector
- **What it does**: Shows all connected devices across your network, their internal `100.64.x.x` IPs, host OS versions, idle times, round-trip latency, and connection type (*direct P2P vs DERP relay fallback*).
- **When to use**: Run to check if a specific server or laptop is online and see how it is connected.

---

## 12. Enterprise Best Practices & Common Mistakes

### Best Practices
- **Short-Lived Pre-Auth Keys**: Issue short-lived, ephemeral auth keys for Terraform/Cloud-Init auto-scaling group deployments.
- **Granular ABAC Tags**: Avoid default broad tags (`tag:all`). Assign environment-specific tags (`tag:prod-db`, `tag:staging-api`).
- **Automated SCIM Deprovisioning**: Enable SCIM 2.0 sync so employee departure instantly revokes device certificates mesh-wide.
- **Redundant Subnet Routers**: Deploy dual Linux subnet routers for legacy non-agent appliances (mainframes, industrial PLCs).

### Pitfalls to Avoid
- ❌ **Leaving Port 22 Open**: Operating traditional SSH port 22 alongside ZTNA invalidates outbound-only protection. Close all physical ingress rules.
- ❌ **Hardcoding Auth Keys in Git**: Store API keys strictly in environment variables or secret vaults (AWS Secrets Manager, HashiCorp Vault).
- ❌ **Binding Apps to `0.0.0.0`**: Bind internal web apps to `127.0.0.1` or the specific QuickZTNA virtual interface (`ztna0`).

---

## 13. Technical Comparison Matrix

| Technical Feature | Legacy IPsec / OpenVPN | Bastion Host / Jump Box | Centralized ZTNA Proxy | Outbound-Only ZTNA (QuickZTNA) |
| :--- | :--- | :--- | :--- | :--- |
| **Inbound Firewall Ports** | Requires Open Port (1194/500) | Requires Open Port (22) | Vendor Dependent | **Zero Open Ports (DENY ALL)** |
| **Public IP Requirement** | Mandatory | Mandatory | Vendor Proxy IP | **Zero Public IPs Required** |
| **Data Plane Architecture** | Hub-and-Spoke Bottleneck | Single Point Failure | Vendor Cloud Bottleneck | **Peer-to-Peer (P2P) Encrypted Mesh** |
| **Data Encryption Protocol** | OpenVPN / IPsec | SSH Tunneling | TLS 1.3 | **WireGuard (ChaCha20-Poly1305)** |
| **Control / Data Separation** | None | None | Partial | **100% Strict Separation** |
| **Data Payload Privacy** | Decrypted at VPN Hub | Decrypted at Bastion | Decrypted at Vendor Cloud | **End-to-End Encrypted (Zero-Knowledge)** |
| **Continuous Posture Check** | Static at Auth | None | Basic HTTP Header | **Continuous Real-Time Telemetry** |
| **Built-in Endpoint DLP** | No | No | Additional Charge | **Integrated (Local File Scanning)** |
| **Deployment Time** | Hours / Days | Hours | Days / Weeks | **< 2 Minutes** |

---

## 14. Enterprise Multi-Cloud Rollout Blueprint

### Phase 1: Identity & Directory Integration (Day 1)
- **Goal**: Establish the central identity foundation for Zero Trust authentication.
- **What Happens**:
  1. Connect your existing Single Sign-On (SSO) provider (Google Workspace, Microsoft Entra ID, or Okta) via SAML 2.0 / OIDC.
  2. Enable SCIM 2.0 directory sync so user groups and departments update automatically. When an employee leaves the company, revoking their SSO account instantly terminates all their device sessions across the network.
  3. Require mandatory Multi-Factor Authentication (MFA) using hardware TOTP security keys.

### Phase 2: ABAC Policy Definition (Day 1)
- **Goal**: Define access control rules before connecting workloads.
- **What Happens**:
  1. Establish a logical tag schema across your organization (e.g., `tag:production`, `tag:database`, `tag:developer`, `tag:staging`).
  2. Enforce a strict Default-Deny security posture. Traffic flows only when an explicit Attribute-Based Access Control (ABAC) rule grants permission based on matching identity, tags, target port, and device health.

### Phase 3: Cloud Workload Automation (Day 2)
- **Goal**: Automate server onboarding across AWS, Azure, GCP, and on-premises environments.
- **What Happens**:
  1. Add single-line `ztna` daemon installation scripts into your Infrastructure-as-Code (IaC) tools (Terraform, Cloud-Init, Ansible, Docker Compose).
  2. Update cloud security groups and host firewalls across all cloud providers to drop all inbound traffic (`0.0.0.0/0` ingress: DROP). Workloads now operate behind outbound-only stateful connections with zero exposed public IPs.

### Phase 4: Endpoint Fleet & Posture Enforcement (Day 3–5)
- **Goal**: Secure employee workstations and prevent data exfiltration.
- **What Happens**:
  1. Silently deploy QuickZTNA client installers across company laptops via Mobile Device Management (MDM) tools like Microsoft Intune or Jamf Pro.
  2. Enable Continuous Device Posture rules, requiring active disk encryption (BitLocker/FileVault), running EDR daemons, and updated OS patch levels.
  3. Activate Local Filesystem DLP scanning on developer workstations to automatically block API keys, SSH private keys, and sensitive data from leaking.

---

## 15. Frequently Asked Questions (FAQs)

### If my cloud server has no public IP and zero open inbound ports, how do administrators first install and access the node?
Administrators initialize the server during cloud provisioning using host launch scripts (Cloud-Init, AWS User Data, or Custom Machine Images). The launch script installs the `ztna` agent package and passes a pre-authenticated deployment key (`ZTNA_AUTH_KEY`). Once executed, the daemon opens an outbound TLS connection to the control plane, receives its assigned `100.64.x.x` tailnet IP address, registers its WireGuard public key, and begins listening on the virtual `ztna0` interface. Administrators can then SSH directly to the internal tailnet domain (e.g., `ssh admin@prod-server.myorg.zt.net`) over the encrypted P2P tunnel with zero exposed public IPs or open inbound physical ports.

### How does Outbound-Only Zero Trust handle legacy appliances that cannot run a software client agent?
QuickZTNA uses Subnet Route Advertisements. A lightweight Linux node running the `ztna` daemon inside the private subnet is designated as a Subnet Router (e.g., `ztna route advertise 192.168.1.0/24`). It securely bridges traffic between authorized mesh peers and non-agent legacy devices (industrial PLCs, mainframes, legacy databases, network-attached storage) without exposing those devices to the public internet.

### Does outbound-only traffic slow down database query performance or web application response times?
No. Because QuickZTNA establishes direct peer-to-peer (P2P) WireGuard UDP connections whenever NAT mappings permit, network packets travel across the shortest geographic path between peers. Lab benchmarks show direct P2P connection throughput exceeding 4.12 Gbps with sub-19ms latencies, significantly outperforming central proxy architectures and hub-and-spoke legacy VPN gateways.

### What happens if a corporate firewall blocks outbound UDP traffic entirely?
If corporate outbound firewalls drop UDP packets, QuickZTNA automatically falls back to global DERP Relays (hosted in Bangalore and Frankfurt). The agent wraps WireGuard encrypted packets inside standard TCP/443 HTTPS frames to establish an outbound TLS connection. Because payload data remains encrypted using local WireGuard keys, relay servers cannot decrypt or view private data.

### Is it possible for a compromised device on the tailnet to attack other connected workloads?
No. QuickZTNA evaluates Attribute-Based Access Control (ABAC) rules per connection. Unlike traditional VPNs that grant broad subnet access upon authentication, an endpoint tagged `tag:finance-laptop` is cryptographically restricted from communicating with `tag:production-db` unless an explicit ACL rule permits it. Furthermore, if a machine fails continuous posture checks, it is automatically quarantined from the network instantly.

---

## 16. References & Standards RFCs

- [RFC 6598](https://datatracker.ietf.org/doc/html/rfc6598): IETF Shared Address Space for Carrier-Grade NAT (CGNAT) (`100.64.0.0/10`)
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446): The Transport Layer Security (TLS) Protocol Version 1.3
- [NIST Special Publication 800-207](https://csrc.nist.gov/publications/detail/sp/800-207/final): Zero Trust Architecture (ZTA)
- [WireGuard Protocol Specification](https://www.wireguard.com/papers/wireguard.pdf): Fast, Modern, Secure VPN Tunneling
- [RFC 5389](https://datatracker.ietf.org/doc/html/rfc5389): Session Traversal Utilities for NAT (STUN)
- [RFC 7644](https://datatracker.ietf.org/doc/html/rfc7644): System for Cross-domain Identity Management (SCIM) 2.0 Protocol

---

## 17. Conclusion & Strategic Next Steps

Eliminating public IP exposure and inbound firewall ports is a foundational requirement for securing modern cloud operations. Automated scanning botnets, credential brute-forcing, and rapid zero-day exploitation have rendered traditional perimeter firewalls, exposed Bastion hosts, and legacy hub-and-spoke VPNs obsolete.

By deploying an Outbound-Only Zero Trust Architecture, organizations transform their cloud infrastructure into an invisible, default-deny mesh network. Workloads require no public IPv4 addresses, open zero inbound listening ports, and maintain continuous identity and posture verification for every byte transferred.
