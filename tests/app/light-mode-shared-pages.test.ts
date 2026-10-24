import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// As páginas e os componentes públicos compartilhados por todos os layouts precisam
// funcionar no modo claro e no escuro, com qualquer esquema. Por isso não podem usar
// cores fixas pensadas para fundo escuro (texto branco, overlay preto, hex literal):
// tudo passa pelos tokens do esquema (text-foreground-strong, bg-background, var(--primary)…).

const ROOT = resolve(import.meta.dirname, "../..");

const FILES = [
  "src/pages/BlogPost.tsx",
  "src/pages/ProjectCaseStudy.tsx",
  "src/pages/Testimonials.tsx",
  "src/pages/Proposal.tsx",
  "src/pages/ProposalAccept.tsx",
  "src/pages/Checkout.tsx",
  "src/pages/PaymentSuccess.tsx",
  "src/pages/NotFound.tsx",
  "src/components/AvailabilityBadge.tsx",
  "src/components/BlogCoverFallback.tsx",
  "src/components/ContactWizard.tsx",
  "src/components/ContactWizardModal.tsx",
  "src/components/ContractModal.tsx",
  "src/components/Terminal.tsx",
  "src/components/TestimonialWizard.tsx",
  "src/components/ui/skeleton.tsx",
];

// Exceções conscientes: superfícies que são brancas de propósito em qualquer modo.
const ALLOWED = [
  // QR Code PIX precisa de fundo branco para ser lido
  /<div className="bg-white rounded-lg p-4">/,
  // Área de assinatura vira papel no PDF: fundo branco, tinta escura
  /bg-white" style=\{\{ height: 120 \}\}/,
  /backgroundColor: "rgba\(255,255,255,0\)"/,
  /penColor: "#1a1a1a"/,
  // Botão verde de "Baixar PDF": texto branco sobre verde sólido nos dois modos
  /bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white/,
];

const FORBIDDEN: Array<[string, RegExp]> = [
  ["texto/borda branca fixa", /(?<![\w:-])(text|border|from|via|to)-white\b/],
  ["preto fixo", /(?<![\w:-])(bg|text|from|via|to)-black\b/],
  ["cinza fixo", /(?<![\w:-])(bg|text|from|via|to|border)-(gray|zinc|slate|stone)-\d/],
  ["fundo branco translúcido", /(?<![\w:-])bg-white\/\d/],
  ["hex literal", /#[0-9a-fA-F]{3,8}\b(?![\w-])/],
  ["rgb literal", /rgba?\(/],
  ["prose-invert sem dark:", /(?<!dark:)prose-invert/],
];

describe("páginas e componentes compartilhados no modo claro", () => {
  for (const file of FILES) {
    it(`${file} não usa cores fixas de fundo escuro`, () => {
      const problems = readFileSync(resolve(ROOT, file), "utf8")
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => !line.trim().startsWith("//") && !ALLOWED.some((re) => re.test(line)))
        .flatMap(({ line, n }) =>
          FORBIDDEN.filter(([, re]) => re.test(line)).map(([what]) => `${file}:${n} ${what}`),
        );
      expect(problems).toEqual([]);
    });
  }

  it("texto sobre a cor de acento usa on-accent, e sobre a primária usa primary-foreground", () => {
    for (const file of FILES) {
      const src = readFileSync(resolve(ROOT, file), "utf8");
      for (const cls of src.match(/className="[^"]*"/g) ?? []) {
        if (/(?<![\w:/-])bg-neon-lime(?![\w/-])/.test(cls) && /(?<![\w:-])text-/.test(cls)) {
          expect(cls, `${file}: ${cls}`).toMatch(/text-on-accent/);
        }
        if (/(?<![\w:/-])bg-neon-purple(?![\w/-])/.test(cls) && /(?<![\w:-])text-(?!xs|sm|base|lg|\dxl|center|left|right)/.test(cls)) {
          expect(cls, `${file}: ${cls}`).toMatch(/text-primary-foreground/);
        }
      }
    }
  });
});
