/**
 * Renderização no build (pré-renderização). Usado só por scripts/prerender.ts:
 * gera o HTML de uma rota pública com os dados já carregados.
 */
import { PassThrough } from "node:stream";
import { prerenderToNodeStream } from "react-dom/static";
import { renderToString } from "react-dom/server";
import { dehydrate, type DehydratedState, type Query } from "@tanstack/react-query";
import type { HelmetServerState } from "react-helmet-async";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import App, { type AppProps } from "./App";
import { setHtmlSanitizer } from "./lib/sanitizeHtml";
import { createQueryClient } from "./providers/QueryProvider";

// DOMPurify com um DOM do jsdom: o conteúdo sai limpo no HTML do build, como no navegador.
setHtmlSanitizer(createDOMPurify(new JSDOM("").window as unknown as Window & typeof globalThis));

export interface RenderResult {
  html: string;
  helmet: HelmetServerState | undefined;
  state: DehydratedState;
}

/** Limite de rodadas: cada rodada descobre queries que só aparecem depois que outras resolvem. */
const MAX_PASSES = 6;

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  const pass = new PassThrough();
  stream.pipe(pass);
  for await (const chunk of pass) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}

function isWaitingForData(query: Query): boolean {
  const { enabled, queryFn } = query.options as { enabled?: unknown; queryFn?: unknown };
  const isEnabled = typeof enabled === "function" ? enabled(query) !== false : enabled !== false;
  return (
    isEnabled &&
    typeof queryFn === "function" &&
    query.state.data === undefined &&
    query.state.status === "pending"
  );
}

export async function render(url: string, appearance?: AppProps["appearance"]): Promise<RenderResult> {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: Infinity },
  });

  try {
    for (let pass = 0; pass < MAX_PASSES; pass++) {
      const helmetContext: { helmet?: HelmetServerState } = {};
      const errors: unknown[] = [];
      const { prelude } = await prerenderToNodeStream(
        <App ssrPath={url} queryClient={queryClient} helmetContext={helmetContext} appearance={appearance} />,
        { onError: (error) => void errors.push(error) },
      );
      // Esta rodada serve para descobrir as queries e carregar as páginas sob demanda;
      // o HTML publicado sai da rodada final, abaixo.
      await streamToString(prelude);
      // Erro em qualquer componente deixa um buraco no HTML: melhor não publicar a página
      // (ela cai na SPA) do que publicar sem conteúdo.
      if (errors.length > 0) throw errors[0];

      // Queries que a renderização pediu e que ainda não têm dados: busca e renderiza de novo.
      const waiting = queryClient.getQueryCache().getAll().filter(isWaitingForData);
      if (waiting.length === 0 || pass === MAX_PASSES - 1) {
        if (waiting.length > 0) {
          console.warn(`[prerender] ${url}: queries sem dados após ${MAX_PASSES} rodadas`, waiting.map((q) => q.queryHash));
        }
        // Rodada final síncrona: com dados e páginas sob demanda já carregados, nada suspende,
        // e o renderToString não gera <script> embutido (a CSP do site bloqueia esses scripts).
        const finalHelmet: { helmet?: HelmetServerState } = {};
        const finalHtml = renderToString(
          <App ssrPath={url} queryClient={queryClient} helmetContext={finalHelmet} appearance={appearance} />,
        );
        if (/<!--\$[!?]-->/.test(finalHtml)) {
          throw new Error("parte da página ficou para o navegador (Suspense não resolvido)");
        }
        return { html: finalHtml, helmet: finalHelmet.helmet, state: dehydrate(queryClient) };
      }
      await Promise.all(
        waiting.map((q) => queryClient.prefetchQuery({ ...q.options, queryKey: q.queryKey })),
      );
    }
    throw new Error("unreachable");
  } finally {
    queryClient.clear();
  }
}
