# Working on this site

You are helping a **non-technical writer** publish blog posts for **quickztna.com**.
This folder (`/root/site`) IS the live marketing site.

## Rule #1 — never run git, npm, build, or deploy commands

Just create and edit files, and save them. That is the whole job.
Saving is enough: this box auto-commits and the site rebuilds and goes **live by itself**
about 60-90 seconds after the last save. There is no preview and no approval step —
**what you save gets published.** Do not run `git`, `npm run build`, `wrangler`, or any
deploy command.

## Rule #2 — READ `content/WRITING-GUIDELINES.md` BEFORE WRITING

It is the house style and scoring rubric, and it is binding. The short version:
**no invented facts, statistics, studies, quotes, or customer testimonials.** If a claim
cannot be traced to a primary source (NIST, an RFC, EU regulation text, vendor docs),
either cite it or write `[CITATION NEEDED]` inline — **never invent it.** No competitor
trash talk, no FUD.

## Adding a blog post = ONE markdown file

Create `src/content/blog/<slug>.md`. The **filename is the URL** —
`src/content/blog/my-post.md` becomes `quickztna.com/blog/my-post/`.
There is no index or manifest to update; the site picks it up automatically.

## The frontmatter schema is STRICT — get it wrong and the post never publishes

The site validates every post at build time. **If any rule below is broken, the build
fails and the post silently does NOT go live** (the existing site stays up, so nothing
breaks — your post just never appears). Check these before saving:

- `title` — required, **max 90 characters**
- `description` — required, **must be between 140 and 170 characters.** This is the
  single most common failure. Count them.
- `publishedAt` — required, `YYYY-MM-DD`
- `author` — required, an object with `name` (and optional `role`, `url`)
- `category` — required, **exactly one of**: `post-quantum`, `compliance`,
  `comparison`, `fundamentals`, `technical`, `industry`
- `primaryKeyword` — required, the search phrase the post targets
- `tags` — a list, optional
- `faq` — a list of `q`/`a` pairs, optional but expected (generates FAQ rich-results)
- `draft: true` — set this to park a post **without publishing it**. Remove it to go live.

### Template

```markdown
---
title: "A headline of 90 characters or fewer"
description: "Between 140 and 170 characters. This is the sentence shown in Google results and on the blog index, so make it specific and useful to a searcher."
publishedAt: 2026-07-17
author:
  name: QuickZTNA Engineering
  role: Product team
  url: https://github.com/quickztna
category: comparison
tags:
  - ztna
  - wireguard
primaryKeyword: the phrase this post targets
faq:
  - q: "A question a reader would actually type?"
    a: "A direct, self-contained answer of 2-4 sentences."
---

Opening paragraph — plain markdown from here down.

## A section heading

More writing.
```

**Copy an existing post's frontmatter** (e.g. `src/content/blog/twingate-alternative.md`)
rather than writing it from memory — 37 posts are already there as reference.

## Do not touch

`astro.config.mjs`, `package.json`, `src/content.config.ts`, `src/components/`,
`src/layouts/`, `src/lib/`, `src/pages/`, `scripts/`, `tailwind.config.mjs` — that is site
infrastructure, not content. If a request seems to need changes there, tell the writer to
ask the infra team instead.
