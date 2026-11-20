# Case em blocos, blocos de marca e case com a cara do cliente (2.3.0)

Especificação de trabalho da 2.3.0 (contrato de blocos 1.4). Vale para quem implementa: o que já está pronto no esqueleto, o que cada frente entrega e as regras comuns.

## Por quê
O case (`RawProject`) tinha formato fixo (`content`, `sections: {title, body, image}`, `cover`, `gallery`, `metrics`). Vídeo, incorporação e blocos ricos só existiam nas páginas, e um case de identidade visual (logo antigo → marca completa, paleta, tipografia, variações, animações, vídeo) virava só texto. Agora:
1. o corpo do case usa o **mesmo motor de blocos das páginas**;
2. há **blocos novos** de marca e mídia: `antes-depois`, `paleta`, `tipografia`, `variacoes-marca`, `imagens`, e capítulos no `video`;
3. o case pode ter **a cara do cliente**: cores (claro e escuro) e fonte de título do cliente só dentro do case;
4. vídeo só por YouTube/Vimeo (sem upload de vídeo); animação curta entra como GIF pela biblioteca de imagens.

## Já pronto no esqueleto (onda 0)
- `content/types.ts`: `RawProject.blocks?: BlockInstance[]`, `RawProject.brand?: CaseBrand` (`CaseBrandColors`), `sections` marcado `@deprecated`.
- `blocks/define.ts`: `BlockContext = "page" | "case"`, `BlockDefinition.contexts?` (padrão: os dois), `blockAllowedIn(def, ctx)`, `SerializedBlock.contexts`.
  - `hero`, `contato` e `cases` têm `contexts: ["page"]`.
- `blocks/fields.ts`: campo `color` completo (tipo, `field.color`, validação `#rrggbb`, `HEX_COLOR`, `normalizeHex`); `render/resolve.ts` resolve a cor em minúsculas; `data/showcase.ts` tem amostra; o MCP tem o JSON Schema (`mcp/src/schema/json-schema.ts`).
- `blocks/catalog/marca.ts`: definições (campos = contrato) dos 5 blocos novos, registradas em `CORE_BLOCKS`. O comentário do topo fixa as **classes CSS** de cada componente.
- `blocks/catalog/index.ts`: `video.chapters` (`[{start "m:ss", label}]`) e `chapterSeconds()` em `blocks/media.ts`.
- `content/legacy.ts`: `sectionsToBlocks(project)`, `sectionToBlock`, `needsSectionsMigration` (ids estáveis `conteudo`, `secao-N`).
- `theme/brand.ts`: `validateBrand` (fg/bg ≥ 4.5, accent/bg ≥ 3, nos dois modos), `resolveBrand`, `accentForeground`, `brandCss` (escopo `[data-rb-brand]`, por modo + `@media` do system, `--rb-font-display: var(--rbf-brand, …)`).
- `theme/contract.ts`: `CONTRACT_VERSION = "1.4.0"`; `CaseTemplateProps.blocks?: ReactNode` e `brand?: ResolvedBrand`.
- `render/collections.ts`: `ProjectItem.hasCase` (blocos visíveis, ou seções, ou texto longo). `sections` deprecated.
- `i18n/ui-texts.ts`: `video.chapters`, `video.chapterAt`, `beforeAfter.*`, `palette.*`, `type.*`.
- `convex/index.ts`: migração `projects-sections-to-blocks` (since `2.3.0`) → `rubrica/collections:migrateSectionsToBlocks` (a frente B implementa).
- Exports em `src/index.ts`.

Testes vermelhos esperados no esqueleto: os de `test/blocks.test.tsx` que exigem componente padrão para todo bloco (frente C) e os de fixtures que exigem todo bloco nas demos (frente I).

## Regras comuns
- Trabalhe só nos arquivos da sua frente (tabela abaixo). Precisa mudar arquivo de outra frente? Não mude: descreva no relatório final o que e por quê.
- Componentes React puros (só props). Nada de texto fixo: campo do bloco ou `ctx.t("chave")`. Links internos por `ctx.href`.
- Sem JavaScript, tudo funciona (a ilha só melhora). Acessível: axe limpo nos dois modos, foco visível, `prefers-reduced-motion` respeitado.
- No case o h1 é do template: blocos do case sempre com `headingLevel: 2`, sem `needsHiddenH1`.
- Commits pequenos em Conventional Commits, **em inglês**, escopo do pacote (`feat(core)`, `feat(mcp)`), sem linhas de atribuição. Não faça push nem merge.
- Antes de terminar: `pnpm -r check` e os testes do seu pacote passando (fora os vermelhos esperados acima).
- Fixtures e exemplos sempre fictícios.

## Frentes
| Frente | Arquivos |
|---|---|
| A · Motor do case | `render/site.ts`, `render/blocks.ts` (novo), `render/collections.ts`, `content/legacy.ts`, `theme/brand.ts`, `theme/fonts.ts`, `astro/integration.ts`, `astro/runtime.ts`, `astro/pages/*`, `components/shell.tsx`, `components/index.ts`, `styles/case.css` (novo, se precisar), testes de render |
| B · Backend Convex | `convex/validators.ts`, `convex/schema.ts`, `convex/collections.ts`, `convex/panel.ts`, `convex/lib/blocks.ts`, `convex/pages.ts` (só exportar o que precisar), `test/convex/*` |
| C · Blocos novos | `blocks/catalog/marca.ts`, `blocks/catalog/index.ts` (só o `video`), `blocks/media.ts`, `components/blocks/*`, `styles/blocks.css`, `islands/*`, `data/showcase.ts`, `i18n/ui-texts.ts`, testes de blocos/vitrine |
| D · Painel | `admin/**` |
| E · MCP | `packages/mcp/**` |
| G · CLI | `packages/create-rubrica/**` |
