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
import { countWords } from '../src/utils/readingTime';
import { compactProject, projectIndexEntry } from './lib/portfolioIndex';
import { isAppTextKey } from '../src/lib/appRoutes';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
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

  // Projects: índice enxuto (vai no HTML das páginas que listam projetos) e um arquivo
  // completo por projeto, para a página do case e o modal do portfólio.
  const projects = await client.query(api.projects.list, {});
  write('portfolio.json', projects.map((p) => projectIndexEntry(p as Record<string, unknown>)));
  const projectsDir = join(OUTPUT_DIR, 'projects');
  rmSync(projectsDir, { recursive: true, force: true });
  mkdirSync(projectsDir, { recursive: true });
  for (const project of projects) {
    write(`projects/${project._id}.json`, compactProject(project as Record<string, unknown>));
  }

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

  // Configuração pública do site (SEO, cores) e textos fixos, para entrarem no HTML pré-renderizado
  const siteConfig = await client.query(api.siteConfig.getPublic, {});
  write('site-config.json', siteConfig.map(({ key, value }) => ({ key, value })));

  const siteTexts = await client.query(api.siteTexts.getAll, {});
  // Textos do painel, do login e das propostas à parte: as páginas públicas não os usam.
  const texts = siteTexts.map(({ key, ptBR, enUS }) => ({ key, ptBR, enUS }));
  write('site-texts.json', texts.filter((t) => !isAppTextKey(t.key)));
  write('site-texts-app.json', texts.filter((t) => isAppTextKey(t.key)));

  // Blog listing
  const published = await client.query(api.posts.listAllPublished, {});

  // O índice não leva o texto dos posts (cada post tem o seu arquivo em posts/): a lista só
  // precisa da contagem de palavras para o tempo de leitura. Sem isso, a página /blog levava
  // o conteúdo de todos os posts, nos dois idiomas, dentro do HTML.
  const blogIndex = published.map(({ content, contentTranslations, ...rest }) => ({
    ...rest,
    wordCount: {
      ptBR: countWords(contentTranslations?.ptBR ?? content),
      enUS: countWords(contentTranslations?.enUS ?? contentTranslations?.ptBR ?? content),
    },
  }));
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
