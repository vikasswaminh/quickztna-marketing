import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf()
  );

  return rss({
    title: "QuickZTNA Blog",
    description:
      "Post-quantum ZTNA, compliance, and mesh VPN engineering notes. Primary-sourced, technical, and honest.",
    site: context.site ?? "https://quickztna.com",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/blog/${post.id.replace(/\.md$/, "")}/`,
      categories: [post.data.category, ...post.data.tags],
      author: post.data.author.name,
    })),
    customData: `<language>en-us</language>`,
  });
}
