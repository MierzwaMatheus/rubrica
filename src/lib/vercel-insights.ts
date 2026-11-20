/**
 * Vercel Web Analytics e Speed Insights no site público. O Rubrica v2 só traz o Umami
 * (plugin `analytics`), então o astro.config.ts injeta este script em todas as páginas.
 * Os scripts e os eventos ficam em /_vercel/* (mesma origem): a CSP atual já libera.
 */
import { inject } from "@vercel/analytics";
import { injectSpeedInsights } from "@vercel/speed-insights";

/** Áreas privadas que não entram nas métricas: painel, login e fluxos de cliente. */
const PRIVATE = /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?(?:admin|login|proposta|checkout|payment-success)(?:\/|$)/;

function isPublic(url: string): boolean {
  try {
    return !PRIVATE.test(new URL(url, location.origin).pathname);
  } catch {
    return true;
  }
}

inject({
  framework: "astro",
  beforeSend: (event) => (isPublic(event.url) ? event : null),
});

injectSpeedInsights({
  framework: "astro",
  beforeSend: (event) => (isPublic(event.url) ? event : null),
});
