# quickztna-marketing

Marketing site for **QuickZTNA** — the "100 devices in 2 minutes, quantum-safe" landing page.

**Live at:** [quickztna.com](https://quickztna.com) (Cloudflare Pages, project `quickztna-marketing`)

## Stack

- Astro 5
- Tailwind CSS 3 (`@astrojs/tailwind`)
- OKLCH token system (Work Sans + JetBrains Mono not used — see `src/styles/globals.css` for the indigo/neutral palette from the design bundle)
- `lucide-astro` icons

## Develop

```bash
npm install
npm run dev           # http://localhost:4321
npm run build         # static output to dist/
```

## Deploy

```bash
npm run build
npx wrangler@latest pages deploy dist --project-name=quickztna-marketing --branch=main --commit-dirty=true
```

Requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` env vars.

## Pages

- `/` — hero, feature pillars, terminal mockup, bento feature grid, CTA
- `/features` — full feature matrix across 8 categories (56 features)
- `/pricing` — 3-tier pricing cards + comparison table + FAQ

## Related

- **Dashboard:** [login.quickztna.com](https://login.quickztna.com) — source in the main repo [`quickztna`](https://github.com/vikasswaminh/quickztna)
- **Docs:** [docs.quickztna.com](https://docs.quickztna.com) — source in [`quickztna-docs`](https://github.com/vikasswaminh/quickztna-docs)
