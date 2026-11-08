/** Regras de escrita, o catálogo e as receitas, em texto: instruções do servidor, recursos e prompts. */
import type { RecipeBlock, RecipePage, SiteKind } from "@rubrica/core";
import { guidanceText, type CatalogBlock } from "./catalog";
import { blockFieldsSchema } from "./schema/json-schema";
import { blocksFor, findBlock, variantList, variantsOf } from "./tools/shared";
import { siteLocales, type SiteState } from "./state";
import { themeRecipe } from "./theme";

export const INSTRUCTIONS = `Servidor MCP do Rubrica: edita o conteúdo do site (páginas e blocos, coleções, textos de interface, imagens) pelo Convex do projeto, com o login de um usuário do painel.

Antes de mexer: chame whoami (mostra o ambiente: dev ou produção, o papel, os idiomas e o tema) e diga à pessoa onde vai gravar. Sem login, a pessoa roda "npx rubrica mcp login" no terminal; a senha nunca passa pela conversa.

Gravar: toda ferramenta que grava começa em PRÉVIA (dryRun: true) e devolve o antes/depois por campo e idioma. Mostre a prévia à pessoa e só repita a chamada com dryRun: false depois do "ok".

Montar páginas:
- blocks_catalog traz os blocos que ESTE site aceita (os do núcleo e os próprios do projeto), com "quando usar", "quando não usar", "combina com" e as variações do tema instalado. Escolha os blocos por essa orientação, não só pelo nome.
- page_recipes traz a receita do tema para o tipo do site: a lista de blocos de cada página padrão (Início, Sobre/Quem somos, Serviços, Contato...). Para uma página desse tipo, proponha a partir da receita e ajuste ao objetivo; para outra, combine blocos pelo "combina com".
- variant só aceita as variações que o tema declara para o bloco (blocks_catalog lista; a primeira é a padrão). Sem variant, vale a padrão.

Regras de escrita:
- Texto traduzível é um mapa por idioma ({"pt-BR": "...", "en": "..."}). Escreva em todos os idiomas do site na mesma gravação; conteúdo sem tradução num idioma NÃO aparece nesse idioma.
- O h1 de cada página é do bloco hero (o primeiro). Corpo de texto usa h2 e h3.
- Imagens: suba com media_upload (ou ache em media_list) e use o objeto "image" devolvido. Sempre com alt por idioma, sem "imagem de".
- Posts e itens novos nascem como rascunho; publicar é uma ação à parte, só quando a pessoa pedir.
- Textos de seção (título de um bloco) são campos do bloco; textos de interface (menu, botões, formulários) ficam em texts_*.
- WhatsApp e faixa de aviso valem para o site inteiro (site_update: whatsapp, announcement). Num botão ou link de bloco, href "whatsapp:" abre a conversa com a mensagem padrão; "whatsapp:<texto>", com a mensagem própria.
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
- Escolha os blocos pela orientação do catálogo (blocks_catalog: quando usar, quando não usar, combina com) e parta da receita do tema para as páginas padrão (page_recipes).
- Variações (\`variant\`) são as do tema instalado, por bloco; a primeira é a padrão. Uma variação que o tema não tem é recusada.
- Corpo de texto rico aceita: h2, h3, p, ul, ol, li, strong, em, a, code, pre, blockquote, img. O backend sanitiza o resto.
- Título de bloco: até o limite do campo (veja blocks_catalog). Seja direto.

## Links
- Interno: o caminho sem idioma ("/contato", "/servicos#planos"); o site põe o prefixo do idioma. Âncora da mesma página: "#contato" (o campo \`anchor\` do bloco).
- Externo: a URL completa (https://...), "mailto:" ou "tel:".
- **WhatsApp**: "whatsapp:" abre a conversa com o número e a mensagem padrão do site; "whatsapp:Quero um orçamento" abre com essa mensagem. O número vem de site_update → whatsapp (ou do WhatsApp da pessoa/empresa). Sem número configurado, o botão some: configure antes.

## Recursos do site inteiro (site_update)
- **whatsapp**: número (formato internacional), mensagem padrão por idioma, botão flutuante (\`floating\`) e o texto dele. Use isto em vez de repetir o número em cada bloco.
- **announcement** (faixa de aviso no topo): \`enabled\`, \`text\` por idioma (até 200 caracteres; sem texto num idioma, não aparece nele), \`link\` opcional, \`tone\` (info ou destaque) e o período \`startsAt\`/\`endsAt\`. O período vale **no build**: o aviso entra e sai do ar na publicação seguinte. Para um aviso temporário (férias, promoção), prefira a faixa a um bloco na página.

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

// ── Catálogo ────────────────────────────────────────────────────────────────

/** Blocos que o agente deve ver: os do site (com login) ou o catálogo inteiro. */
export function catalogBlocks(state: SiteState): CatalogBlock[] {
  return state.settings ? blocksFor(state) : state.catalog.blocks;
}

export function themeSummary(state: SiteState) {
  const t = state.theme;
  return { id: t.id, ...(t.label ? { label: t.label } : {}), package: t.package, source: t.source, ...(t.problem ? { problem: t.problem } : {}) };
}

/** Resumo de um bloco para a lista do catálogo. */
export function blockSummary(def: CatalogBlock, state: SiteState) {
  const variants = variantsOf(state, def.type);
  return {
    type: def.type,
    label: def.label,
    origin: def.origin,
    description: def.description,
    ...(def.guidance ? { guidance: def.guidance } : {}),
    category: def.category,
    ...(def.plugin ? { plugin: def.plugin } : {}),
    ...(def.source ? { source: def.source.collections } : {}),
    ...(variants.length ? { variants: variants.map((v, i) => ({ value: v.value, label: v.label, ...(i === 0 ? { default: true } : {}) })) } : {}),
    fields: Object.entries(def.fields).map(([k, f]) => `${k} (${f.kind}${f.required ? ", obrigatório" : ""}): ${f.label}`),
  };
}

/** Um bloco por inteiro: orientação, variações e o JSON Schema dos campos. */
export function blockDetail(def: CatalogBlock, state: SiteState) {
  const variants = variantsOf(state, def.type);
  return {
    type: def.type,
    label: def.label,
    origin: def.origin,
    description: def.description,
    guidance: def.guidance ?? null,
    category: def.category,
    plugin: def.plugin ?? null,
    source: def.source ?? null,
    variants: variants.map((v, i) => ({ value: v.value, label: v.label, ...(i === 0 ? { default: true } : {}) })),
    ...(def.backendRules ? { note: "O projeto tem regras próprias para este bloco: a prévia pergunta ao backend." } : {}),
    fields: blockFieldsSchema(def, { locales: state.settings?.locales.locales }),
  };
}

export function catalogMarkdown(state: SiteState): string {
  const defs = catalogBlocks(state);
  const lines = [
    "# Catálogo de blocos",
    "",
    state.settings ? `Site do tipo **${state.settings.kind}**, com os plugins ligados.` : "Catálogo completo (faça login para filtrar pelo site).",
    state.catalog.source === "backend" ? "Blocos do backend do projeto (núcleo e próprios)." : "Blocos do núcleo (o backend não informou o catálogo: blocos próprios do projeto não aparecem aqui).",
    `Tema: ${state.theme.label ?? state.theme.id}${state.theme.source === "nucleo" ? " (não lido; variações do núcleo)" : ""}.`,
    "",
  ];
  for (const d of defs) {
    lines.push(`## ${d.type} — ${d.label}${d.origin === "projeto" ? " (bloco do projeto)" : ""}`, d.description, "");
    for (const g of guidanceText(d.guidance)) lines.push(`- ${g}`);
    if (d.plugin) lines.push(`- Plugin: ${d.plugin}`);
    if (d.source) lines.push(`- Lista itens de: ${d.source.collections.join(", ")} (campo \`source\`)`);
    const variants = variantsOf(state, d.type);
    if (variants.length) lines.push(`- Variações: ${variantList(variants)}`);
    lines.push("", "Campos:");
    for (const [k, f] of Object.entries(d.fields)) lines.push(`- \`${k}\` (${f.kind}${f.required ? ", obrigatório" : ""}): ${f.label}${f.help ? `. ${f.help}` : ""}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function blockResource(type: string, state: SiteState) {
  const def = findBlock(state, type);
  return def ? blockDetail(def, state) : null;
}

// ── Receitas ────────────────────────────────────────────────────────────────

const RECIPE_LOCALES = new Set(["pt-BR", "en", "es"]);

/** Textos de exemplo da receita só nos idiomas do site (as receitas vêm em pt-BR, en e es). */
function onlyLocales(value: unknown, locales: readonly string[]): unknown {
  if (Array.isArray(value)) return value.map((v) => onlyLocales(v, locales));
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value as Record<string, unknown>);
  if (locales.length && entries.length && entries.every(([k, v]) => RECIPE_LOCALES.has(k) && typeof v === "string")) {
    const kept = entries.filter(([k]) => locales.includes(k));
    return Object.fromEntries(kept.length ? kept : entries);
  }
  return Object.fromEntries(entries.map(([k, v]) => [k, onlyLocales(v, locales)]));
}

function recipeBlock(b: RecipeBlock, state: SiteState, withFields: boolean) {
  const def = findBlock(state, b.type);
  const available = !!def && (!state.settings || blocksFor(state).some((d) => d.type === b.type));
  return {
    type: b.type,
    ...(def ? { label: def.label } : {}),
    ...(b.variant ? { variant: b.variant } : {}),
    ...(b.source ? { source: b.source } : {}),
    available,
    ...(available ? {} : { note: def?.plugin ? `precisa do plugin "${def.plugin}" ligado` : "não está no catálogo deste site" }),
    ...(withFields && b.fields ? { exampleFields: onlyLocales(b.fields, siteLocales(state)) } : {}),
  };
}

const matches = (page: RecipePage, ref: string) => {
  const r = ref.trim().toLowerCase();
  return page.path === ref || Object.values(page.title).some((t) => t.toLowerCase() === r);
};

/** Receita do tema para o tipo do site. Com `page` (caminho ou título), só ela, com os campos de exemplo. */
export function recipesFor(state: SiteState, kind: SiteKind, page?: string) {
  const recipe = themeRecipe(state.theme, kind);
  const pages = page ? recipe.filter((p) => matches(p, page)) : recipe;
  return {
    kind,
    theme: themeSummary(state),
    from: state.theme.recipes[kind] ? "tema" : "nucleo",
    pages: pages.map((p) => ({
      path: p.path,
      title: onlyLocales(p.title, siteLocales(state)),
      blocks: p.blocks.map((b) => recipeBlock(b, state, !!page)),
    })),
    ...(page && pages.length === 0 ? { problem: `A receita não tem a página "${page}". Páginas: ${recipe.map((p) => p.path).join(", ")}.` } : {}),
    note: page
      ? "exampleFields são textos de exemplo da receita, para mostrar a forma: troque pelo conteúdo real da pessoa (nada de fato inventado)."
      : "Ordem de blocos de cada página padrão. Passe page (caminho ou título) para ver os campos de exemplo de uma página.",
  };
}

export function recipesMarkdown(state: SiteState): string {
  const kinds: SiteKind[] = state.settings ? [state.settings.kind] : ["pessoal", "empresa"];
  const lines = ["# Receitas de página", "", `Tema: ${state.theme.label ?? state.theme.id}. A receita é a lista de blocos de cada página padrão; proponha a página a partir dela.`, ""];
  for (const kind of kinds) {
    const r = recipesFor(state, kind);
    lines.push(`## Site ${kind} (receita do ${r.from === "tema" ? "tema" : "núcleo"})`, "");
    for (const p of r.pages) {
      const title = Object.values(p.title as Record<string, string>)[0] ?? p.path;
      lines.push(`- **${title}** (\`${p.path}\`): ${p.blocks.map((b) => `${b.type}${b.variant ? `/${b.variant}` : ""}${b.available ? "" : " (indisponível)"}`).join(" → ")}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export const PROMPTS = [
  {
    name: "montar-pagina",
    description: "Monta uma página nova com blocos, a partir da receita do tema e da orientação de cada bloco, com prévia antes de gravar.",
    arguments: [
      { name: "caminho", description: 'Caminho da página, ex.: "/servicos"', required: true },
      { name: "objetivo", description: "Para que serve a página e para quem", required: true },
    ],
    text: (a: Record<string, string>) =>
      `Monte a página ${a.caminho ?? "(caminho)"} do site. Objetivo: ${a.objetivo ?? "(objetivo)"}.

1. Chame whoami (idiomas, tipo do site, tema) e pages_list (a página já existe? então edite com block_*, não crie outra).
2. Chame page_recipes. Se o caminho ou o tipo da página está na receita (ex.: Sobre, Quem somos, Serviços, Contato), parta da lista de blocos dela (page_recipes com page: "${a.caminho ?? ""}" mostra os campos de exemplo). Senão, monte a partir do objetivo.
3. Chame blocks_catalog e escolha cada bloco pela orientação (quando usar, quando não usar, combina com), entre os que o site aceita — inclusive os blocos próprios do projeto. Use as variações do tema só quando servirem ao conteúdo (a primeira é a padrão).
4. Proponha a lista de blocos (tipo, variação se houver e a função de cada um na página, em uma linha) e espere o "ok". Diga o que falta saber da pessoa (números, nomes, preços, depoimentos): não invente.
5. Escreva os textos em todos os idiomas do site. O primeiro bloco costuma ser um hero (leva o h1); sem hero, o núcleo põe um h1 oculto. Links para o WhatsApp do site usam href "whatsapp:" (ou "whatsapp:<mensagem>").
6. Use pages_create com a prévia (dryRun), mostre o antes/depois e só grave (dryRun: false) depois do "ok". A página nasce como rascunho.
7. Releia com pages_get e avise que publicar é uma etapa à parte (pages_set_published e, depois, site_publish), só a pedido.`,
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
      `Revise ${a.alvo ?? "(alvo)"} antes de publicar.\n\n1. Leia o conteúdo (pages_get ou <coleção>_get).\n2. Confira: todos os idiomas do site preenchidos; h1 só no hero; imagens com alt; títulos dentro dos limites; links internos sem prefixo de idioma; links whatsapp: só com o WhatsApp do site configurado; cada bloco no papel que a orientação do catálogo descreve; sem texto de preencher.\n3. Liste o que encontrou. Não corrija sem pedir; não publique sem o "ok" da pessoa.`,
  },
];
