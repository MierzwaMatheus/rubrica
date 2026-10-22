import { RSSFeedGenerator } from "../domain/use-cases/rss-feed-generator.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { rubricalConfig } from "../rubrica.config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DATA_PATH = join(__dirname, "..", "public", "data", "blog.json");
const OUTPUT_PATH = join(__dirname, "..", "public", "rss.xml");

const SITE_URL = (process.env.SITE_URL || rubricalConfig.siteUrl).replace(/\/+$/, "");
const AUTHOR = rubricalConfig.authorName || rubricalConfig.siteName;

const RSS_CONFIG = {
  siteUrl: SITE_URL,
  rssUrl: `${SITE_URL}/rss.xml`,
  siteTitle: rubricalConfig.rssTitle,
  siteDescription: rubricalConfig.rssDescription,
  authorName: AUTHOR,
  authorEmail: rubricalConfig.authorEmail,
  language: rubricalConfig.lang,
  copyright: `Copyright © ${AUTHOR}. Todos os direitos reservados.`,
};

function generateRSSFeed(): void {
  console.log("[RSS Feed] Starting generation...");

  if (!existsSync(BLOG_DATA_PATH)) {
    throw new Error(`[RSS Feed] Blog data file not found at ${BLOG_DATA_PATH}`);
  }

  const blogData = readFileSync(BLOG_DATA_PATH, "utf-8");
  const posts = JSON.parse(blogData);

  console.log(`[RSS Feed] Found ${posts.length} blog posts`);

  const publishedPosts = posts.filter(
    (post: { status: string }) => post.status === "published"
  );
  console.log(
    `[RSS Feed] ${publishedPosts.length} published posts will be included`
  );

  const generator = new RSSFeedGenerator(RSS_CONFIG);
  const rssXml = generator.generate(publishedPosts);

  const publicDir = join(__dirname, "..", "public");
  if (!existsSync(publicDir)) {
    mkdirSync(publicDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, rssXml, "utf-8");
  console.log(`[RSS Feed] Successfully generated at ${OUTPUT_PATH}`);
}

generateRSSFeed();
