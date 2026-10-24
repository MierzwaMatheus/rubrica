/**
 * Generates a PDF version of the CV by rendering the public resume page.
 * Run: pnpm tsx scripts/generate-cv-pdf.ts
 *
 * Requires a running local public app or SITE_URL in environment.
 * Output: public/cv.pdf
 */

import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4321';
const OUTPUT_PATH = join(process.cwd(), 'public/cv.pdf');

async function main() {
  console.log(`Generating CV PDF from ${SITE_URL}/curriculo...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1200, height: 900 });
  await page.goto(`${SITE_URL}/curriculo?print=1`, {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for fonts and images to load
  await page.waitForTimeout(2000);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
  });

  await browser.close();

  mkdirSync(join(process.cwd(), 'public'), { recursive: true });
  writeFileSync(OUTPUT_PATH, pdf);

  console.log(`✓ CV PDF saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
