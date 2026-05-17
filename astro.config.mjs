import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://quickztna.com',
  trailingSlash: 'always',
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) => !page.includes('/og/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
});
