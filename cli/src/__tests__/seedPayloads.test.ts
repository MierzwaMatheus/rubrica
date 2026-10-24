import { describe, it, expect } from "vitest";
import { seedPayloads } from "../utils/seedPayloads.js";

const IDENTITY = {
  siteName: "Ana Souza",
  siteUrl: "https://ana.dev",
  siteDescription: "Designer",
  authorName: "Ana",
  authorEmail: "ana@ana.dev",
  twitterHandle: "ana",
  lang: "en-US",
};

describe("seedPayloads", () => {
  it("seedAll recebe só os plugins ligados", () => {
    expect(seedPayloads({}, { blog: true, about: false, resume: true }, "https://x").seedAll).toEqual({ enabledPlugins: ["blog", "resume"] });
  });

  it("identidade vira os itens do siteConfig, com o endereço passado (não o do rubrica.json)", () => {
    expect(seedPayloads(IDENTITY, {}, "https://ana.vercel.app").siteConfig).toEqual({
      items: [
        { key: "site_title", value: "Ana Souza" },
        { key: "site_name", value: "Ana Souza" },
        { key: "site_url", value: "https://ana.vercel.app" },
        { key: "site_description", value: "Designer" },
        { key: "author_name", value: "Ana" },
        { key: "author_email", value: "ana@ana.dev" },
        { key: "twitter_handle", value: "ana" },
        { key: "lang", value: "en-US" },
      ],
    });
  });

  it("campos ausentes viram vazio e o idioma cai em pt-BR", () => {
    const items = seedPayloads({ siteName: "S" }, {}, "https://x").siteConfig!.items;
    for (const key of ["site_description", "author_name", "author_email", "twitter_handle"]) {
      expect(items.find((i) => i.key === key)!.value).toBe("");
    }
    expect(items.find((i) => i.key === "lang")!.value).toBe("pt-BR");
  });

  it("sem nome do site, não há itens de siteConfig nem contato", () => {
    expect(seedPayloads({ authorName: "Ana" }, {}, "https://x")).toMatchObject({ siteConfig: null, contact: null });
  });

  it("contato com nome e e-mail, e-mail escondido do site", () => {
    expect(seedPayloads(IDENTITY, {}, "https://x").contact).toEqual({ name: "Ana", email: "ana@ana.dev", showEmail: false });
  });

  it("contato sem e-mail grava e-mail vazio", () => {
    expect(seedPayloads({ siteName: "S", authorName: "Ana" }, {}, "https://x").contact).toEqual({ name: "Ana", email: "", showEmail: false });
  });

  it("sem nome da pessoa, não grava contato", () => {
    expect(seedPayloads({ siteName: "S" }, {}, "https://x").contact).toBeNull();
  });
});
