# Mudanças de backend: portfólio focado em conversão (Rubrica)

Branch `feat/home-conversao`. Todas as mudanças são **aditivas**: campos novos e opcionais, nenhum campo removido nem tornado obrigatório. Documentos que já existem continuam válidos, então não há migração de dados.

Para levar ao Rubrica, aplique os itens na mesma ordem. Os testes estão em `tests/convex/conversionFields.test.ts`.

## 1. Validador compartilhado do case study (novo arquivo)

`convex/lib/caseStudy.ts`

- `caseStudyValidator`: `problem`, `solution`, `results` e `metrics` como antes, mais quatro campos opcionais:

  | Campo | O que guarda | Seção no site |
  |---|---|---|
  | `role` | cargo, tamanho do time, escopo | "Meu papel" |
  | `context` | o estado inicial, medido | "Antes" |
  | `decisions` | decisões, trade-offs, caminhos descartados | "Decisões e trade-offs" |
  | `learnings` | o que aprendi | "Aprendizados" |

- `caseStudyTranslationsValidator`: os mesmos quatro campos opcionais em `ptBR` e `enUS`.
- `categoryTranslationsValidator`: `{ ptBR, enUS? }`.

Antes, o objeto do case era escrito à mão três vezes: no `schema.ts`, no `projects.create` e no `projects.update`. Agora os três importam este arquivo.

## 2. `projects`: categoria

- Arquivos:
  - `convex/schema.ts`: tabela `projects`.
  - `convex/projects.ts`: `create` e `update`.
- Campos novos:
  - `category: v.optional(v.string())`: texto livre, por exemplo "IA aplicada" ou "Marca e design".
  - `categoryTranslations: { ptBR, enUS? }`, opcional.
- Uso: os filtros da página Portfólio passam a ser por categoria, no lugar das tags de tecnologia. Projeto sem categoria continua aparecendo em "Todos".

## 3. `projects.caseStudy`: seções novas

- Arquivos: os mesmos do item 2, via `caseStudyValidator`.
- Uso: as seções "Meu papel", "Antes", "Decisões e trade-offs" e "Aprendizados" na página do case. Cada seção só aparece se o campo estiver preenchido.

## 4. `resumeItems` (skill): grupo

- Arquivo: `convex/schema.ts`, variante `skill` de `resumeItemVariants`.
- Campos novos:
  - `content.group: v.optional(v.string())`
  - `contentTranslations.group: v.optional(v.string())`
- Os validadores de `resumeItems.create` e `update` já aceitam `content: v.any()`, então não mudaram.
- **Correção de um bug que já existia:**
  - O problema: o admin grava `contentTranslations` da skill como `{ ptBR: {...}, enUS: {...} }`, mas o schema esperava um objeto plano (`{ name, level }`). Como o Convex valida o schema ao gravar, salvar uma skill pelo admin falhava. Nenhuma das 32 skills em produção tem tradução, o que confirma o problema.
  - A correção: o schema passa a usar `{ ptBR?: { name?, level?, group? }, enUS?: { ... } }`, o mesmo formato das outras variantes.
  - Por que é seguro: nenhum documento atual usa esse campo.
- Uso: o currículo mostra a stack agrupada ("IA", "Front-end", "Infra") sem as barras de porcentagem. Skill sem grupo vai para "Stack". O campo `level` continua existindo, mas o site deixou de exibi-lo.

## 5. `testimonials`: categoria

- Arquivos:
  - `convex/schema.ts`: tabela `testimonials`.
  - `convex/testimonials.ts`: `create`, `update` e `createWithAvatar`. O formulário de criação do admin usa este último, que grava a categoria sem espaços nas pontas.
- Campo novo: `category: v.optional(v.string())`, por exemplo "Tecnologia" ou "Marca e design".
- Uso: a página de depoimentos agrupa por categoria. A home continua usando o `showOnHome` que já existia.

## 6. `homeContent`: chave pública `work_principles`

- Arquivo: `convex/homeContent.ts`, `work_principles` entra em `PUBLIC_HOME_KEYS`.
- Sem mudança de schema: `homeContent.value` já é `v.any()`.
- Formato do valor:

  ```ts
  Array<{
    title: string;
    description: string;
    titleTranslations?: { ptBR: string; enUS?: string };
    descriptionTranslations?: { ptBR: string; enUS?: string };
  }>
  ```

- Uso: a seção "Como eu trabalho" da página Sobre, editada no admin da Home.
- O `scripts/fetch-static-data.ts` já copia todas as chaves públicas para `public/data/home.json`, então não precisou mudar.

## 7. `homeContent`: chave pública `home_metrics` (só no Rubrica)

- Arquivo: `convex/homeContent.ts`, `home_metrics` entra em `PUBLIC_HOME_KEYS`.
- Sem mudança de schema.
- Formato do valor (até 4 itens):

  ```ts
  Array<{
    value: string;
    label: string;
    labelTranslations?: { ptBR?: string; enUS?: string };
  }>
  ```

- Uso: a faixa de números no topo da home e no começo do currículo. Lista vazia esconde a faixa.
- Por que só no Rubrica: no portfólio do Matheus, esses números estão fixos nas traduções. No Rubrica eles precisam ser editáveis, então ganharam o editor `src/components/admin/HomeMetricsEditor.tsx`, na aba "Números" do admin da Home.

## 8. Seeds de demonstração (persona Ana Souza)

Os campos novos também vêm com dados de exemplo, para o template sair de fábrica mostrando as seções novas:

| Seed | O que entrou |
|---|---|
| `homeContent` | `home_metrics` e `work_principles` |
| `projects` | `category` e as 4 seções novas do case nos 2 projetos |
| `resumeItems` | `group` nas skills |
| `testimonials` | `category` |

## O que NÃO mudou no backend

- **Medição de conversão:** é só front. Atributos `data-umami-event` nos botões e `trackEvent("contato-enviado")` no envio do formulário, em `src/lib/analytics.ts`.
- **Case relacionado no blog:** calculado no front, pelas tags em comum entre o post e o projeto.
- **Carregamento por página:** feito com `React.lazy` no `App.tsx`.

## Como publicar (quando aprovado)

1. Leia o `CONVEX_DEPLOYMENT` do `.env.local` e confirme em qual deployment vai rodar.
2. Em dev, rode `npx convex dev --once`.
3. Em produção, o `npm run build` já roda `npx convex deploy`. Rode só com ok explícito.

O schema novo aceita todos os documentos atuais, então o deploy não falha por validação.
