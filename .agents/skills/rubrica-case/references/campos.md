# Campos do projeto e do case no Rubrica

Conferidos em `convex/schema.ts`, `convex/lib/caseStudy.ts` e `convex/projects.ts`. Em caso de dúvida, rode `$RB funcoes --modulo projects`.

## Projeto
| Campo | O que é | Onde aparece |
|---|---|---|
| `title` + `titleTranslations {ptBR, enUS}` | título do case (`tecnicas.md` §7) | cartão, página do case |
| `description` + `descriptionTranslations` | 1 ou 2 frases: para quem foi e o que mudou | cartão do portfólio |
| `longDescription` + traduções | opcional, texto livre sobre o projeto | página do projeto |
| `slug` | kebab-case sem acento. **Sem slug não há página de case** | URL `/portfolio/<slug>` |
| `category` + `categoryTranslations` | rótulo curto ("IA aplicada", "Sistemas internos"). Reaproveite uma categoria existente | filtro do portfólio |
| `tags` | tecnologias e temas. É aqui que entra o jargão técnico | cartão |
| `imageIds` | ids da biblioteca (passos `imagem` do plano) | galeria |
| `demoLink`, `githubLink` | links públicos, só se a pessoa quiser | página do case |
| `orderIndex` | ordem. Os 3 menores com `slug` e `caseStudy` são os destaques da home | home e portfólio |

`projects:create` exige `title`, `description`, `tags`, `imageIds` (pode ser `[]`) e `orderIndex`.

## `caseStudy` (texto puro: quebras de linha viram parágrafos; sem HTML nem markdown)
| Campo | Seção no site | Obrigatório |
|---|---|---|
| `problem` | Problema: a dor real, não o pedido | sim |
| `solution` | Solução: o que foi feito, na língua do leitor | sim |
| `results` | Resultados: a cadeia com os elos que têm evidência | sim |
| `metrics: [{label, value, icon?}]` | faixa de números. A **primeira** vai para o cartão da home e do portfólio | sim (pode ser `[]`) |
| `role` | Meu papel | não |
| `context` | Antes: o estado inicial medido | não |
| `decisions` | Decisões e trade-offs: um item por parágrafo | não |
| `learnings` | Aprendizados | não |
| `testimonial: {text, author, role?, lang?}` | depoimento, só com permissão e com nome e cargo. `lang` é a língua em que a pessoa escreveu (`"pt-BR"` ou `"en-US"`; sem valor, `pt-BR`) | não |

- `metrics[].value` é o número ("4 min → 40 s", "−40%", "9/10"). `label` é o rótulo curto. `icon` é opcional, um nome de ícone Lucide em kebab-case ("timer", "trending-up").
- **Métricas traduzidas:** em `caseStudyTranslations.ptBR.metrics` e `.enUS.metrics`, mande `[{label, value}]` na **mesma ordem e quantidade** de `caseStudy.metrics` (o `icon` fica só no `caseStudy`). Traduza o `label` e o `value` que tiver palavras ("Entrada + saída" → "Check-in + check-out"); número puro repete igual. Card sem tradução aparece na língua original.
- **Depoimento:** o texto fica no `caseStudy.testimonial` na língua em que a pessoa escreveu, com `lang`. A tradução vai só na **outra** língua, em `caseStudyTranslations.<outra>.testimonial: {text, role?}` (o autor não se traduz). Na outra língua, o site mostra a tradução com um aviso de tradução automática e um botão para ver o original. Não reescreva nem "melhore" a fala da pessoa: traduza fiel.
- Seções opcionais vazias não aparecem. Não preencha campo sem material.

## `caseStudyTranslations`
`{ ptBR: {problem, solution, results, role?, context?, decisions?, learnings?, metrics?, testimonial?}, enUS: {...} }`. Mande sempre os dois, com os mesmos campos preenchidos que o `caseStudy`. `metrics` vai nas duas línguas; `testimonial` só na língua que não é a original do depoimento.

## Atualização
`projects:update` substitui o `caseStudy`, o `caseStudyTranslations` e o `imageIds` **inteiros** (no `imageIds`, mande as imagens atuais mais as novas). Não troque o `slug` de um projeto publicado sem a pessoa pedir: a URL antiga quebra. Leia o projeto (`ler projetos <id>`), monte o objeto completo (o que muda e o que fica) e use `ler: {funcao: "projects:getById", args: {id}}` no passo do plano para a prévia mostrar o antes.

## Exemplo de passo no plano
```json
{ "acao": "mutation", "descricao": "Case do build",
  "funcao": "projects:update",
  "ler": { "funcao": "projects:getById", "args": { "id": "<_id>" } },
  "args": {
    "id": "<_id>",
    "title": "Build de 4 min para 40 s num e-commerce de moda",
    "titleTranslations": { "ptBR": "...", "enUS": "Build time from 4 min to 40 s at a fashion e-commerce" },
    "category": "Engenharia", "categoryTranslations": { "ptBR": "Engenharia", "enUS": "Engineering" },
    "imageIds": ["<id-de-imagem-que-já-estava>", "{{print1.id}}"],
    "caseStudy": { "problem": "...", "solution": "...", "results": "...", "role": "...", "context": "...",
                   "decisions": "...", "learnings": "...",
                   "metrics": [{ "value": "4 min → 40 s", "label": "tempo de build", "icon": "timer" }],
                   "testimonial": { "text": "Deploy deixou de ser evento.", "author": "Ana Lima", "role": "CTO", "lang": "pt-BR" } },
    "caseStudyTranslations": {
      "ptBR": { "...": "mesmos campos", "metrics": [{ "value": "4 min → 40 s", "label": "tempo de build" }] },
      "enUS": { "...": "mesmos campos", "metrics": [{ "value": "4 min → 40 s", "label": "build time" }],
                "testimonial": { "text": "Deploying stopped being an event.", "role": "CTO" } }
    }
  } }
```
