/**
 * O CLI fala a língua do núcleo: as variáveis que o setup grava são as que o backend lê
 * (docs/v2/variaveis.md), a URL do webhook do Asaas é a rota de verdade e os temas que o
 * CLI oferece como portados existem como pacotes no workspace.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRubrica } from "@rubrica/core/convex";
import { ASAAS_WEBHOOK_PATH, BASE_ENV, COPIED_TO_PRODUCTION, INTEGRATIONS } from "../src/commands/setup";
import { repo } from "./helpers";

const documented = new Set([...readFileSync(repo("docs/v2/variaveis.md"), "utf-8").matchAll(/^\| `([A-Z][A-Z0-9_]+)` \|/gm)].map((m) => m[1]!));

describe("setup ↔ backend", () => {
  it("o webhook do Asaas aponta para uma rota POST do http do núcleo", () => {
    const http = createRubrica().http;
    expect(http.lookup(ASAAS_WEBHOOK_PATH, "POST")).not.toBeNull();
    expect(readFileSync(repo("docs/v2/variaveis.md"), "utf-8")).toContain(`<CONVEX_SITE_URL>${ASAAS_WEBHOOK_PATH}`);
  });

  it("toda variável que o setup e o publicar gravam está documentada em docs/v2/variaveis.md", () => {
    const written = [...INTEGRATIONS.flatMap((i) => i.vars.map((v) => v.key)), ...BASE_ENV, ...COPIED_TO_PRODUCTION];
    expect(documented.size).toBeGreaterThan(10);
    expect(written.filter((k) => !documented.has(k))).toEqual([]);
  });

  it("o núcleo lê cada variável que o setup grava", () => {
    const source = ["contacts.ts", "lib/destinations.ts", "lib/crypto.ts", "lib/openrouter.ts", "publish.ts", "httpRoutes.ts", "lib/intake.ts", "commerce/asaas.ts", "commerce/http.ts", "commerce/commerce.ts", "commerce/shared.ts", "commerce/aiResumes.ts"]
      .map((f) => {
        try {
          return readFileSync(repo("packages/core/src/convex", f), "utf-8");
        } catch {
          return "";
        }
      })
      .join("\n");
    const written = [...INTEGRATIONS.flatMap((i) => i.vars.map((v) => v.key)), ...BASE_ENV];
    expect(written.filter((k) => !source.includes(k))).toEqual([]);
  });
});
