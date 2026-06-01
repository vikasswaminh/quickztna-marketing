import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id.replace(/\.md$/, "") },
    props: { post },
  }));
}

const categoryColor: Record<string, string> = {
  "post-quantum": "#7c3aed",
  compliance: "#0ea5e9",
  comparison: "#14b8a6",
  fundamentals: "#f59e0b",
  technical: "#ec4899",
  industry: "#64748b",
};

const categoryLabel: Record<string, string> = {
  "post-quantum": "Architecture",
  compliance: "Compliance",
  comparison: "Comparison",
  fundamentals: "Fundamentals",
  technical: "Technical",
  industry: "Industry",
};

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      if (line) lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line.trim());
  return lines.slice(0, 4);
}

export const GET: APIRoute = ({ props }) => {
  const post = (props as any).post;
  const { data } = post;

  const color = categoryColor[data.category] ?? "#7c3aed";
  const label = categoryLabel[data.category] ?? "Blog";
  const lines = wrap(data.title, 32);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0e14"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="accent" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1f2937" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)" opacity="0.4"/>
  <rect width="1200" height="630" fill="url(#accent)"/>

  <!-- Brand bar -->
  <g transform="translate(72, 72)">
    <rect x="0" y="0" width="10" height="40" rx="2" fill="${color}"/>
    <text x="24" y="28" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff">QuickZTNA</text>
    <text x="24" y="52" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12" font-weight="500" letter-spacing="2" fill="#9ca3af" text-transform="uppercase">REMOTE WORKFORCE SECURITY OS</text>
  </g>

  <!-- Category tag -->
  <g transform="translate(72, 180)">
    <rect x="0" y="0" width="${label.length * 11 + 28}" height="32" rx="16" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-opacity="0.5" stroke-width="1"/>
    <text x="14" y="21" font-family="ui-monospace, SFMono-Regular, monospace" font-size="13" font-weight="600" letter-spacing="1" fill="${color}">${escape(label.toUpperCase())}</text>
  </g>

  <!-- Title -->
  <g transform="translate(72, 252)" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="700" fill="#ffffff">
${lines
  .map(
    (l, i) =>
      `    <text x="0" y="${i * 60}" font-size="54">${escape(l)}</text>`
  )
  .join("\n")}
  </g>

  <!-- Footer -->
  <g transform="translate(72, 540)">
    <text x="0" y="0" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" fill="#d1d5db">${escape(data.author.name)}</text>
    <text x="0" y="28" font-family="ui-monospace, SFMono-Regular, monospace" font-size="14" fill="#6b7280">quickztna.com/blog</text>
  </g>

  <!-- Corner mark -->
  <g transform="translate(1060, 540)">
    <text x="0" y="0" font-family="ui-monospace, SFMono-Regular, monospace" font-size="12" fill="#6b7280" text-anchor="end">${new Date(data.publishedAt).getFullYear()} &middot; quickztna.com</text>
  </g>
</svg>`;

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800, immutable",
    },
  });
};
