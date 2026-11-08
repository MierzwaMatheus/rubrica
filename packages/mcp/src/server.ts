import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  type CallToolResult,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { blockResource, catalogMarkdown, INSTRUCTIONS, PROMPTS, writingGuide } from "./guide";
import type { Runtime } from "./runtime";

import pkg from "../package.json" with { type: "json" };

export const SERVER_INFO = { name: "rubrica", title: "Rubrica", version: pkg.version };

export function createServer(runtime: Runtime): Server {
  const server = new Server(SERVER_INFO, {
    capabilities: { tools: { listChanged: true }, resources: {}, prompts: {} },
    instructions: INSTRUCTIONS,
  });

  runtime.onToolsChanged = () => {
    void server.sendToolListChanged().catch(() => {});
  };

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: await runtime.listTools() }));
  server.setRequestHandler(CallToolRequestSchema, async (req) => (await runtime.callTool(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>)) as CallToolResult);

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      { uri: "rubrica://guia/escrita", name: "Regras de escrita", description: "Idiomas, h1 do hero, imagens e como gravar com segurança.", mimeType: "text/markdown" },
      { uri: "rubrica://blocos/catalogo", name: "Catálogo de blocos", description: "Os tipos de bloco do site, com descrição e campos.", mimeType: "text/markdown" },
      { uri: "rubrica://site/estado", name: "Estado do site", description: "Papel, idiomas, tema, plugins e ferramentas disponíveis agora.", mimeType: "application/json" },
      ...CORE_BLOCKS.map((b) => ({ uri: `rubrica://blocos/${b.type}`, name: `Bloco ${b.type}`, description: b.description, mimeType: "application/json" })),
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (req) => {
    const uri = req.params.uri;
    const state = await runtime.ensureState();
    const reply = (mimeType: string, body: string) => ({ contents: [{ uri, mimeType, text: body }] });
    if (uri === "rubrica://guia/escrita") return reply("text/markdown", writingGuide());
    if (uri === "rubrica://blocos/catalogo") return reply("text/markdown", catalogMarkdown(state));
    if (uri === "rubrica://site/estado") {
      return reply(
        "application/json",
        JSON.stringify(
          {
            loggedIn: !!state.me,
            role: state.me?.role ?? null,
            convex: { host: new URL(runtime.project.convexUrl).hostname, environment: runtime.project.environment },
            site: state.settings && { kind: state.settings.kind, url: state.settings.url, locales: state.settings.locales, theme: state.settings.theme },
            plugins: state.plugins.map((p) => ({ id: p.id, enabled: p.enabled })),
            tools: runtime.toolNames(),
            ...(state.problem ? { problem: state.problem } : {}),
          },
          null,
          2,
        ),
      );
    }
    const block = /^rubrica:\/\/blocos\/([a-z0-9-]+)$/.exec(uri);
    const data = block ? blockResource(block[1]!, state) : null;
    if (data) return reply("application/json", JSON.stringify(data, null, 2));
    throw new Error(`Recurso desconhecido: ${uri}`);
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS.map(({ name, description, arguments: args }) => ({ name, description, arguments: args })),
  }));
  server.setRequestHandler(GetPromptRequestSchema, async (req) => {
    const prompt = PROMPTS.find((p) => p.name === req.params.name);
    if (!prompt) throw new Error(`Prompt desconhecido: ${req.params.name}`);
    return { description: prompt.description, messages: [{ role: "user" as const, content: { type: "text" as const, text: prompt.text((req.params.arguments ?? {}) as Record<string, string>) } }] };
  });

  return server;
}

export async function serveStdio(runtime: Runtime): Promise<void> {
  const server = createServer(runtime);
  await server.connect(new StdioServerTransport());
  // Aquece o estado sem travar o handshake (a lista de ferramentas espera por ele).
  void runtime.refresh().catch(() => {});
}
