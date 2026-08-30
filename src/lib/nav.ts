// Single source of truth for docs/guide navigation.
// Imported by both the top-nav dropdowns (components/site/Header.astro) and the
// in-page sidebar (components/docs/Sidebar.astro) so adding a page updates both
// without drift.

export type NavItem = { label: string; href: string };
export type NavGroup = { title: string; items: NavItem[] };

export const docsNav: NavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Introduction", href: "/docs/" }],
  },
  {
    title: "Concepts",
    items: [{ label: "Zero Trust concepts", href: "/docs/concepts/" }],
  },
  {
    title: "CLI",
    items: [{ label: "Command reference", href: "/docs/cli/" }],
  },
  {
    title: "API",
    items: [{ label: "REST API overview", href: "/docs/api/" }],
  },
  {
    title: "Security",
    items: [{ label: "Encryption & posture", href: "/docs/security/" }],
  },
  {
    title: "Integrations",
    items: [{ label: "SSO: OIDC, Google, GitHub", href: "/docs/integrations/" }],
  },
];

export const guideNav: NavGroup[] = [
  {
    title: "Getting started",
    items: [
      { label: "Welcome", href: "/guide/" },
      { label: "Quickstart — 2 minute setup", href: "/guide/quickstart/" },
      { label: "Connecting & everyday commands", href: "/guide/connecting/" },
      { label: "Exit nodes, routes & split tunnel", href: "/guide/exit-nodes-and-routes/" },
    ],
  },
  {
    title: "Install",
    items: [{ label: "Linux, macOS, Windows", href: "/guide/installation/" }],
  },
  {
    title: "Manage",
    items: [{ label: "Devices, tags & expiry", href: "/guide/managing-devices/" }],
  },
  {
    title: "Access control",
    items: [{ label: "Identity-based policies", href: "/guide/access-policies/" }],
  },
  {
    title: "Administration",
    items: [
      { label: "Admin guide overview", href: "/guide/admin/" },
      { label: "Identity & onboarding", href: "/guide/admin/identity/" },
      { label: "Access control: ACLs & ABAC", href: "/guide/admin/access-control/" },
      { label: "Device posture & compliance", href: "/guide/admin/device-posture/" },
      { label: "DNS filtering & threat feeds", href: "/guide/admin/dns-filtering/" },
      { label: "Security overview", href: "/guide/admin/workforce/" },
      { label: "Malware detection (file-hash)", href: "/guide/admin/dlp/" },
      { label: "Remote shell access", href: "/guide/admin/remote-access/" },
      { label: "Observability & audit", href: "/guide/admin/observability/" },
      { label: "Plans & billing", href: "/guide/admin/billing/" },
    ],
  },
  {
    title: "Help",
    items: [{ label: "Troubleshooting", href: "/guide/troubleshooting/" }],
  },
];
