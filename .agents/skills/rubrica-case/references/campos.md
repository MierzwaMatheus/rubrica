# Campos do projeto e do case no Rubrica v2

Conferidos em `packages/core/src/convex/validators.ts` (`projectFields`), `packages/core/src/blocks/catalog/` (blocos) e `packages/mcp/src/tools/` (ferramentas). Em caso de dúvida, rode `blocks_catalog` (com `context: "case"`) e `projects_get` no MCP. Todo texto traduzível é um mapa por idioma: `{"pt-BR": "...", "en": "..."}`. Conteúdo sem tradução num idioma **não aparece** nele.

## Projeto (`projects_create`, `projects_update`)
| Campo | O que é | Onde aparece |
|---|---|---|
| `title` | título do case (`tecnicas.md` §7) | cartão, página do case |
| `summary` | 1 ou 2 frases: para quem foi e o que mudou | cartão do portfólio e abertura do case |
| `slug` | kebab-case sem acento (sai do título se faltar). **Sem slug não há página de case** | URL `/portfolio/<slug>` (ou `/cases/<slug>` no site de empresa) |
| `category` | rótulo curto ("IA aplicada", "Identidade visual"). Reaproveite uma existente | filtro do portfólio |
| `tags` | tecnologias e temas. É aqui que entra o jargão técnico | cartão |
| `client`, `year` | cliente (texto, só com permissão) e ano | fatos no alto do case |
| `role` | meu papel | fatos no alto do case |
| `cover` | imagem de capa (objeto `image` do `media_upload`/`media_list`, com `alt` por idioma) | cartão e alto do case |
| `gallery` | lista de imagens | carrossel das telas, em temas que o usam |
| `links` | `[{label, href}]`: site no ar, repositório... só se a pessoa quiser | fim do case |
| `metrics` | números do case: `[{value, label, icon?}]`. `icon` é um nome do Lucide (`timer`, `trending-up`). O **primeiro** vira o número do cartão (se não houver `metric`) | faixa "Resultados em números" |
| `metric` | `{value, label}` só do cartão, se quiser outro número ali | cartão |
| `featured`, `order` | destaque e ordem. A home mostra os primeiros em destaque | home e portfólio |
| `blocks` | **o corpo do case**, em blocos (abaixo) | página do case |
| `brand` | a cara do cliente (abaixo) | só dentro do case |
| `seo` | título, descrição e imagem para buscadores, por idioma | `<head>` |

`projects_create` nasce **rascunho**. `projects_publish` só a pedido. `content` e `sections` são o formato antigo (obsoleto desde a 2.3.0): não grave neles, use `blocks`.

## O corpo do case: `blocks`
O corpo é a lista de blocos que a pessoa vê, na ordem. Monte com `block_add` (e `block_update_fields`, `block_move`, `block_set_visible`, `block_remove`) passando **`project`** (slug ou id) no lugar de `page`. Cada bloco: `{type, fields, variant?}`; o `id` sai sozinho.

- **Os blocos do case começam no `h2`.** O título do case é do template: não use `hero`, `contato` nem `cases` (o MCP recusa). Veja o que vale com `blocks_catalog` e `context: "case"`.
- Um bloco sem nenhum campo obrigatório preenchido no idioma some nesse idioma. Escreva pt-BR e en nos mesmos blocos.
- Imagens: suba com `media_upload` (ou ache em `media_list`) e use o objeto `image` devolvido, com `alt` por idioma. **GIF** serve para animação curta (a animação de um logo, uma transição de tela): suba como imagem e use num bloco `imagens`. Não há upload de vídeo.

Blocos mais úteis num case (campos completos no `blocks_catalog`):
| Bloco | Quando | Campos principais |
|---|---|---|
| `texto` | contexto, problema, solução, decisões, aprendizados | `title`, `body` (HTML: `p`, `ul`, `strong`, `a`...), `image`, `imagePosition` |
| `numeros` | resultados, se não usar `metrics` | `items [{value, label}]` |
| `antes-depois` | logo antigo e novo, tela antiga e nova | `before`, `after` (imagens, mesma proporção), `beforeLabel`, `afterLabel`, `caption`, `presentation` (`comparador` ou `lado-a-lado`) |
| `paleta` | as cores de uma marca | `colors [{name, hex, role, usage}]` (`hex` é `#rrggbb`), `showContrast` |
| `tipografia` | as fontes de uma marca | `fonts [{family, role, weights, sample, specimen}]` (`family` é do Google Fonts; `specimen` é a amostra em imagem, para fonte de fora) |
| `variacoes-marca` | versões do logo: principal, horizontal, símbolo, sobre fundo escuro | `items [{image, label, background, note}]` (`background` é `#rrggbb`), `columns` (`"2"` a `"4"`) |
| `imagens` | telas, mockups e aplicações em imagens | `items [{image, caption}]`, `layout` (`grade`, `mosaico`, `carrossel`) |
| `video` | demonstração ou animação da marca | `url` (**só YouTube ou Vimeo**), `chapters [{start "m:ss", label}]`, `caption`, `poster` |
| `lista-itens`, `galeria`, `depoimentos`, `cta` | etapas, galeria, fala do cliente (com permissão), convite para o próximo passo | veja o catálogo |

- **Capítulos do vídeo:** `start` em `m:ss` ou `h:mm:ss` (`1:05`, `1:02:30`), `label` curto. Cada capítulo abre o vídeo no ponto. Só os que a pessoa confirmou: não invente tempo.
- **Depoimento:** o v2 não tem depoimento dentro do case. Com permissão e nome e cargo, use o bloco `depoimentos` (veja `blocks_catalog`) ou uma frase no `texto`, nas duas línguas. Não reescreva a fala da pessoa: traduza fiel.

## A cara do cliente: `brand`
Cores e fonte de título do cliente **só dentro do case** (cabeçalho e rodapé do site seguem o tema):
```json
"brand": {
  "enabled": true,
  "light": { "background": "#f7f1e8", "foreground": "#2a1a1a", "accent": "#7a1f2b" },
  "dark":  { "background": "#1c1214", "foreground": "#f3e9e4", "accent": "#e07a8a" },
  "fontDisplay": "Fraunces"
}
```
- `light` é obrigatório; `dark` é opcional (sem ele, o escuro usa o claro). Cores em `#rrggbb`.
- **Contraste conferido ao gravar**, nos dois modos: texto sobre fundo **≥ 4,5:1** e destaque sobre fundo **≥ 3:1**. O MCP devolve o problema com o caminho (`brand.light.accent`): ajuste a cor, não force. Com `enabled: false`, as cores ficam guardadas sem aplicar (só o formato é conferido).
- `fontDisplay` é o nome da família no Google Fonts (letras, números e espaços). Baixada no build.
- Use as cores **do cliente**, as da paleta aprovada. Não invente uma cor: se a pessoa não tem os códigos, pergunte (ou deixe sem `brand`).
- **Atualizar:** `projects_update` com `patch: {brand: {...}}`. Listas e imagens são trocadas inteiras. Para tirar, `unset: ["brand"]`.

## Atualização
`projects_update` mescla textos por idioma; `blocks` você não troca pelo `patch`: use as ferramentas `block_*`. Não troque o `slug` de um projeto publicado sem a pessoa pedir: a URL antiga quebra. Leia antes (`projects_get`) e mostre a prévia (todo gravar começa em `dryRun`).

## Case antigo (formato da v1 ou `sections`)
Um case com `content`/`sections` continua aparecendo (convertido em blocos `texto` na hora). Para reescrevê-lo, monte `blocks` com as ferramentas `block_*`; a migração do `update` (`rubrica/collections:migrateSectionsToBlocks`) faz a conversão automática dos que sobraram.
