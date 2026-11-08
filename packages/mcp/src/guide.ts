/** Regras de escrita e o catálogo, em texto: instruções do servidor, recurso e prompts. */
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { blockFieldsSchema } from "./schema/json-schema";
import { blocksFor } from "./tools/shared";
import type { SiteState } from "./state";

export const INSTRUCTIONS = `Servidor MCP do Rubrica: edita o conteúdo do site (páginas e blocos, coleções, textos de interface, imagens) pelo Convex do projeto, com o login de um usuário do painel.

Antes de mexer: chame whoami (mostra o ambiente: dev ou produção, o papel e os idiomas) e diga à pessoa onde vai gravar. Sem login, a pessoa roda "npx rubrica mcp login" no terminal; a senha nunca passa pela conversa.

Gravar: toda ferramenta que grava começa em PRÉVIA (dryRun: true) e devolve o antes/depois por campo e idioma. Mostre a prévia à pessoa e só repita a chamada com dryRun: false depois do "ok".

Regras de escrita:
- Texto traduzível é um mapa por idioma ({"pt-BR": "...", "en": "..."}). Escreva em todos os idiomas do site na mesma gravação; conteúdo sem tradução num idioma NÃO aparece nesse idioma.
- O h1 de cada página é do bloco hero (o primeiro). Corpo de texto usa h2 e h3.
- Imagens: suba com media_upload (ou ache em media_list) e use o objeto "image" devolvido. Sempre com alt por idioma, sem "imagem de".
- Posts e itens novos nascem como rascunho; publicar é uma ação à parte, só quando a pessoa pedir.
- Textos de seção (título de um bloco) são campos do bloco; textos de interface (menu, botões, formulários) ficam em texts_*.
- Não invente fatos, preços nem depoimentos: o que a pessoa não contou fica vazio.`;

export function writingGuide(): string {
  return `# Regras de escrita do Rubrica

## Idiomas
- O site declara uma lista de idiomas e um principal (sem prefixo na URL). Veja em whoami.
- Todo texto visível é um mapa idioma → texto. Escreva todos os idiomas do site na mesma gravação.
- **Conteúdo sem tradução não aparece no idioma**: um post ou página sem texto em "en" não existe em /en, não entra nas listas nem no sitemap. Campo vazio num bloco fica vazio no idioma.
- Textos de interface (menu, botões, formulários, 404) sem tradução caem no idioma principal.
- Tradução idiomática, no mesmo tom do original; em HTML, traduza só o texto visível. Slug, tags, nomes próprios e de tecnologias não se traduzem.

## Estrutura da página
- O **h1 é do hero**, o primeiro bloco. Se o primeiro bloco não é hero, o núcleo coloca um h1 oculto. Nunca escreva <h1> no corpo de texto.
- Corpo de texto rico aceita: h2, h3, p, ul, ol, li, strong, em, a, code, pre, blockquote, img. O backend sanitiza o resto.
- Título de bloco: até o limite do campo (veja blocks_catalog). Seja direto.

## Imagens
- Suba com media_upload e use o objeto \`image\` devolvido (url, storageId, largura, altura).
- \`alt\` por idioma, descrevendo o que a imagem mostra.

## Gravar com segurança
- Toda gravação começa em prévia (dryRun). Mostre o antes/depois e espere o "ok".
- Rascunho primeiro; publicar só a pedido. O site estático só muda no próximo rebuild (site_publish).
- Mudar slug ou caminho quebra links já compartilhados: só com pedido explícito.
- Respeite o papel: se uma ferramenta recusar por permissão, avise a pessoa em vez de tentar contornar.
`;
}

export function catalogMarkdown(state: SiteState): string {
  const defs = state.settings ? blocksFor(state) : [...CORE_BLOCKS];
  const lines = ["# Catálogo de blocos", "", state.settings ? `Site do tipo **${state.settings.kind}**, com os plugins ligados.` : "Catálogo completo do núcleo (faça login para filtrar pelo site).", ""];
  for (const d of defs) {
    lines.push(`## ${d.type} — ${d.label}`, d.description, "");
    if (d.plugin) lines.push(`Plugin: ${d.plugin}`);
    if (d.source) lines.push(`Lista itens de: ${d.source.collections.join(", ")} (campo \`source\`)`);
    for (const [k, f] of Object.entries(d.fields)) lines.push(`- \`${k}\` (${f.kind}${f.required ? ", obrigatório" : ""}): ${f.label}${f.help ? `. ${f.help}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function blockResource(type: string, state: SiteState) {
  const def = CORE_BLOCKS.find((b) => b.type === type);
  if (!def) return null;
  return { type: def.type, label: def.label, description: def.description, category: def.category, plugin: def.plugin ?? null, source: def.source ?? null, fields: blockFieldsSchema(def, { locales: state.settings?.locales.locales }) };
}

export const PROMPTS = [
  {
    name: "montar-pagina",
    description: "Monta uma página nova com blocos, passo a passo, com prévia antes de gravar.",
    arguments: [
      { name: "caminho", description: 'Caminho da página, ex.: "/servicos"', required: true },
      { name: "objetivo", description: "Para que serve a página e para quem", required: true },
    ],
    text: (a: Record<string, string>) =>
      `Monte a página ${a.caminho ?? "(caminho)"} do site. Objetivo: ${a.objetivo ?? "(objetivo)"}.\n\n1. Chame whoami e blocks_catalog para saber idiomas, tipo do site e blocos disponíveis.\n2. Proponha a lista de blocos (tipo e função de cada um) e espere o "ok".\n3. Escreva os textos em todos os idiomas do site, sem inventar fatos. O primeiro bloco é um hero (leva o h1).\n4. Use pages_create com a prévia (dryRun), mostre o antes/depois e só grave (dryRun: false) depois do "ok". A página nasce como rascunho.\n5. Releia com pages_get e avise que publicar é uma etapa à parte.`,
  },
  {
    name: "traduzir-conteudo",
    description: "Acha o que está sem tradução em um idioma e propõe as traduções.",
    arguments: [{ name: "idioma", description: 'Código do idioma, ex.: "en"', required: true }],
    text: (a: Record<string, string>) =>
      `Complete as traduções para "${a.idioma ?? "(idioma)"}".\n\n1. Chame whoami para conferir que o idioma está na lista do site.\n2. Procure o que falta: pages_list e as listas das coleções mostram missingLanguages; texts_list com missingLocale="${a.idioma ?? ""}" mostra os textos de interface.\n3. Leia cada item, traduza de forma idiomática (mesmo tom; em HTML só o texto visível; slug, tags e nomes próprios ficam) e use as ferramentas de update mandando só o idioma novo (os outros são mantidos).\n4. Mostre a prévia de cada gravação e espere o "ok" antes de dryRun: false.`,
  },
  {
    name: "revisar-antes-de-publicar",
    description: "Revisão de uma página, post ou item antes de publicar.",
    arguments: [{ name: "alvo", description: "Caminho da página, ou coleção e id do item", required: true }],
    text: (a: Record<string, string>) =>
      `Revise ${a.alvo ?? "(alvo)"} antes de publicar.\n\n1. Leia o conteúdo (pages_get ou <coleção>_get).\n2. Confira: todos os idiomas do site preenchidos; h1 só no hero; imagens com alt; títulos dentro dos limites; links internos sem prefixo de idioma; sem texto de preencher.\n3. Liste o que encontrou. Não corrija sem pedir; não publique sem o "ok" da pessoa.`,
  },
];
