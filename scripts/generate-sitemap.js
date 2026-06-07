import fs from "fs";
import { seoPages } from "../src/data/seoPages.js";

const BASE_URL = "https://aliinas.com";

const staticPages = [
  { slug: "", priority: "1.0" },
  { slug: "ordering", priority: "0.8" },
  { slug: "careers", priority: "0.5" },
];

const seoUrls = seoPages
  .filter((page) => page.published !== false)
  .map((page) => ({
    slug: page.slug,
    priority: page.priority || "0.8",
  }));

const urls = [...staticPages, ...seoUrls];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    ({ slug, priority }) => `  <url>
    <loc>${BASE_URL}/${slug}</loc>
    <priority>${priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

fs.writeFileSync("./public/sitemap.xml", sitemap);

console.log("✅ sitemap.xml generated");