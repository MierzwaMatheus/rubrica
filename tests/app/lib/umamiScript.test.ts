import { describe, it, expect } from "vitest";
import { umamiScriptTag } from "@/lib/umamiScript";

describe("umamiScriptTag", () => {
  it("não injeta nada sem as variáveis", () => {
    expect(umamiScriptTag({})).toBeNull();
    expect(umamiScriptTag({ VITE_UMAMI_SCRIPT_URL: "https://cloud.umami.is/script.js" })).toBeNull();
    expect(umamiScriptTag({ VITE_UMAMI_WEBSITE_ID: "abc" })).toBeNull();
  });

  it("gera a tag com a URL e o ID do site", () => {
    expect(
      umamiScriptTag({ VITE_UMAMI_SCRIPT_URL: "https://cloud.umami.is/script.js", VITE_UMAMI_WEBSITE_ID: "abc-123" }),
    ).toBe('<script defer src="https://cloud.umami.is/script.js" data-website-id="abc-123"></script>');
  });

  it("aceita as variáveis antigas (endpoint + /umami)", () => {
    expect(
      umamiScriptTag({ VITE_ANALYTICS_ENDPOINT: "https://stats.ana.dev/", VITE_ANALYTICS_WEBSITE_ID: "abc" }),
    ).toContain('src="https://stats.ana.dev/umami"');
  });

  it("recusa URL inválida ou sem https", () => {
    expect(umamiScriptTag({ VITE_UMAMI_SCRIPT_URL: "nada", VITE_UMAMI_WEBSITE_ID: "abc" })).toBeNull();
    expect(umamiScriptTag({ VITE_UMAMI_SCRIPT_URL: "http://x.dev/s.js", VITE_UMAMI_WEBSITE_ID: "abc" })).toBeNull();
  });

  it("escapa aspas no ID", () => {
    expect(umamiScriptTag({ VITE_UMAMI_SCRIPT_URL: "https://x.dev/s.js", VITE_UMAMI_WEBSITE_ID: 'a"><script>' })).not.toContain('"><script>');
  });
});
