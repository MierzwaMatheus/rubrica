/**
 * Fetches data from Convex and generates the static JSON files in public/data used as fallback by the Vite build.
 * Run: pnpm tsx scripts/fetch-static-data.ts
 *
 * Requires CONVEX_DEPLOY_KEY and CONVEX_URL in environment.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CONVEX_URL = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
if (!CONVEX_URL) {
  console.error('CONVEX_URL is not set');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

const OUTPUT_DIR = join(process.cwd(), 'public/data');

function write(filename: string, data: unknown) {
  const path = join(OUTPUT_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ ${filename}`);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Fetching data from Convex...\n');

  // Contact info
  const contactInfo = await client.query(api.contactInfo.get);
  write('contact.json', contactInfo);
  write('sidebar.json', contactInfo);

  // Home content (key/value pairs flattened to a map for static repository consumption)
  const homeContent = await client.query(api.homeContent.getAllPublic);
  const homeMap = Object.fromEntries(
    (homeContent ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value])
  );
  write('home.json', homeMap);

  // Projects
  const projects = await client.query(api.projects.list, {});
  write('portfolio.json', projects);

  // Resume
  const resumeItems = await client.query(api.resumeItems.listAll, {});
  write('resume.json', resumeItems);

  // Services
  const services = await client.query(api.services.list, {});

  // Testimonials
  const testimonials = await client.query(api.testimonials.list, {});

  // About: FAQ + daily routine
  const faq = await client.query(api.aboutFaq.list, {});
  const dailyRoutine = await client.query(api.aboutDailyRoutine.list, {});

  write('about.json', { services, testimonials, faq, dailyRoutine });

  // Plugin states
  const pluginStates = await client.query(api.plugins.getPluginStates);
  write('plugins.json', pluginStates);

  // Blog listing
  const published = await client.query(api.posts.listAllPublished, {});

  const blogIndex = published.map(({ content: _content, ...rest }) => rest);
  write('blog.json', blogIndex);

  // Individual post files
  const postsDir = join(OUTPUT_DIR, 'posts');
  mkdirSync(postsDir, { recursive: true });

  for (const post of published) {
    const safeSlug = post.slug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || post._id;
    write(`posts/${safeSlug}.json`, post);
  }

  console.log(`\n✓ ${published.length} posts written`);
  console.log('\nDone!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
