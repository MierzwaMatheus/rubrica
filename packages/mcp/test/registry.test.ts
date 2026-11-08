import { CORE_PLUGINS } from "@rubrica/core/plugins";
import { describe, expect, it } from "vitest";
import { COLLECTION_SPECS } from "../src/schema/collections";
import { allTools } from "../src/tools";

describe("registro de plugins x ferramentas do servidor", () => {
  const tools = new Map(allTools().map((t) => [t.name, t]));
  const declared = CORE_PLUGINS.flatMap((p) => (p.mcpTools ?? []).map((name) => ({ plugin: p.id, name })));

  it("o registro declara ferramentas", () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  it.each(declared)("$plugin: $name existe no servidor", ({ name }) => {
    expect(tools.has(name), `${name} está no registro mas o servidor não a expõe`).toBe(true);
  });

  it.each(declared)("$plugin: $name só aparece com o plugin ligado", ({ plugin, name }) => {
    const access = tools.get(name)!.access;
    const owner = access.plugin ?? (access.collection ? COLLECTION_SPECS[access.collection].plugin : undefined);
    expect(owner, `${name} precisa depender do plugin ${plugin}`).toBe(plugin);
  });
});
