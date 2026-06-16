import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().max(90),
    description: z.string().min(140).max(170),
    slug: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    author: z.object({
      name: z.string(),
      role: z.string().optional(),
      url: z.string().url().optional(),
    }),
    category: z.enum([
      "post-quantum",
      "compliance",
      "comparison",
      "fundamentals",
      "technical",
      "industry",
    ]),
    tags: z.array(z.string()).default([]),
    primaryKeyword: z.string(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    score: z.number().min(0).max(10).optional(),
    wordCount: z.number().optional(),
    faq: z
      .array(
        z.object({
          q: z.string(),
          a: z.string(),
        })
      )
      .default([]),
    relatedSlugs: z.array(z.string()).default([]),
    tocEnabled: z.boolean().default(true),
    howToSteps: z
      .array(z.object({ name: z.string(), text: z.string() }))
      .default([]),
    listicle: z.boolean().default(false),
  }),
});

// ── Docs (developer reference: concepts, CLI, API, security, integrations) ──
const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string().max(90),
    description: z.string().min(120).max(170),
    section: z.enum([
      "overview",
      "concepts",
      "cli",
      "api",
      "security",
      "integrations",
    ]),
    order: z.number(),
    updatedAt: z.coerce.date(),
    tocEnabled: z.boolean().default(true),
    primaryKeyword: z.string().optional(),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
  }),
});

// ── Guide (operator-facing: install, invite team, policies, troubleshooting) ──
const guide = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/guide" }),
  schema: z.object({
    title: z.string().max(90),
    description: z.string().min(120).max(170),
    section: z.enum([
      "getting-started",
      "install",
      "manage",
      "policies",
      "admin",
      "billing",
      "troubleshooting",
    ]),
    order: z.number(),
    updatedAt: z.coerce.date(),
    tocEnabled: z.boolean().default(true),
    primaryKeyword: z.string().optional(),
    howToSteps: z
      .array(z.object({ name: z.string(), text: z.string() }))
      .default([]),
    faq: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
  }),
});

export const collections = { blog, docs, guide };
