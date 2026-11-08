# Plugins

Cada parte opcional do site é um **plugin**: o blog, o currículo, as propostas, os pagamentos e assim por diante. Você liga só o que vai usar. Desligado, o plugin some do site (os blocos dele deixam de aparecer) e do menu do painel. **Desligar não apaga nada**: o que você cadastrou fica guardado e volta quando você liga de novo.

Cada tipo de site começa com uma seleção pronta, que dá para mudar a qualquer momento.

## Ligar e desligar

- **No painel:** tela **Plugins**. Quem tem o papel `root` ou `admin` liga e desliga com um clique. A tela mostra também quando um plugin precisa de outro.
- **No terminal:** `npx create-rubrica config --plugins +blog,-resume` liga o blog e desliga o currículo (sem sinal, liga). Isso muda o site do seu computador; para mudar também o site no ar, acrescente `--producao`. Veja [Comandos do CLI](./cli.md#config).
- **Na criação do site:** o `create` pergunta quais plugins você quer, ou recebe a lista pronta em `--plugins`. Veja [Começando](./comecando.md).

Lembre que o site no ar só muda no próximo build: depois de ligar ou desligar, clique em **Publicar** no painel.

## Os plugins

Na tabela, "ligado" e "desligado" dizem como o plugin começa em cada tipo de site. Um traço quer dizer que o plugin não existe naquele tipo. O nome entre crases é o que vai no `--plugins`.

| Plugin | O que faz | Pessoal | Empresa |
|---|---|---|---|
| Assistente de contato (`contact-wizard`) | Formulário de contato em etapas. Os pedidos chegam na tela **Contatos** e, se você quiser, também no Telegram, no e-mail ou num webhook | ligado | ligado |
| Propostas (`proposals`) | Propostas comerciais com versões, senha e aceite eletrônico. Cada proposta tem um endereço próprio para mandar ao cliente | ligado | ligado |
| Modelos de contrato (`contract-templates`) | Modelos de contrato usados nas propostas. Precisa de **Propostas** | ligado | ligado |
| Pagamentos (`payments`) | Checkout com PIX, boleto e cartão pelo Asaas. Precisa da chave do Asaas | ligado | ligado |
| Blog (`blog`) | Posts com SEO, tradução e feed RSS | ligado | ligado |
| Projetos e cases (`portfolio`) | Projetos, cada um com a sua página de case | ligado | ligado |
| Currículo (`resume`) | Experiência, formação e competências, com o PDF para baixar | ligado | — |
| Dia a dia (`about`) | Galeria de fotos do dia a dia na página Sobre | ligado | — |
| Depoimentos (`testimonials`) | Depoimentos no site, cadastrados no painel | ligado | ligado |
| Envio de depoimentos (`testimonials-intake`) | Quem visita o site pode mandar um depoimento. Ele entra como pendente e só aparece depois que você aprova. Precisa de **Depoimentos** | ligado | desligado |
| Preços e planos (`pricing`) | Planos com preço, itens incluídos e um botão (para o checkout, para o contato ou para um link) | — | ligado |
| Equipe (`team`) | As pessoas da empresa, com foto, cargo e redes | — | ligado |
| Currículo por vaga com IA (`ai-resumes`) | Gera um currículo ajustado a uma vaga. Precisa de **Currículo** e da chave do OpenRouter. Só o `root` vê esta tela | desligado | — |
| Tradução com IA (`translation`) | Botão "traduzir" nos campos que têm versão em outros idiomas. Precisa da chave do OpenRouter. Sem ele, você traduz à mão ou com um agente | desligado | desligado |
| Analytics (`analytics`) | Põe o script do Umami nas páginas, para contar visitas sem cookies | desligado | desligado |
| Registro de atividades (`audit-log`) | Histórico do que foi feito no painel, e por quem. Só o `root` vê | ligado | ligado |
| Biblioteca de mídia (`media-manager`) | Organiza as imagens em pastas, com as informações de cada uma | ligado | ligado |

Os plugins que dependem de um serviço de fora (Asaas, OpenRouter, Umami) só funcionam depois que a chave estiver configurada. Como fazer isso está em [Integrações](./integracoes.md).

## O que some quando um plugin é desligado

- **Páginas da listagem.** A página do blog (`/blog`), a dos projetos (`/portfolio` no site pessoal, `/cases` no de empresa, ou a base que você definiu em **Configurações**), a de preços (`/precos`) e a de currículo (`/curriculo`) não são geradas quando o plugin dono delas está desligado. Entram também no sitemap só quando existem. O feed RSS acompanha o blog.
- **Itens do menu.** O item de navegação que aponta para uma página que não existe mais some do menu, em todos os idiomas.
- **Blocos.** Um bloco de plugin desligado (Posts, Cases, Depoimentos, Preços, Equipe, Currículo) não aparece em nenhuma página. Se a página tem outros blocos, ela fica e só o bloco some. Uma página que só tinha blocos de plugins desligados também deixa de existir. A home nunca some.
- **Itens, não o conteúdo.** Os dados continuam no Convex: ligar o plugin de novo traz tudo de volta.

Blocos de coleção sem itens (por exemplo, Depoimentos sem nenhum aprovado) também não deixam um título solto: o bloco some da página, a não ser que a página ficasse vazia (a listagem de `/cases` sem projetos mostra o aviso padrão do tema). Cases e Depoimentos com "Mostrar os destaques" ligado exibem só os marcados como destaque; se nenhum estiver marcado, mostram os primeiros da lista.

## Pacotes prontos

Na criação de um site **pessoal**, dá para escolher um pacote em vez de marcar plugin por plugin (`--plugins <pacote>`):

| Pacote | O que liga |
|---|---|
| `recommended` | A seleção padrão do tipo de site (a coluna "ligado" da tabela acima) |
| `freelancer` | Para vender serviços: contato, propostas, projetos, dia a dia, depoimentos, envio de depoimentos, registro de atividades e biblioteca de mídia |
| `simple` | Só o portfólio: contato, projetos, currículo e dia a dia |

No site de **empresa**, o padrão é o `recommended`. Os pacotes são só um ponto de partida: depois, tudo se liga e desliga pelo painel.

## Criar um plugin

**Na 2.0 não existe API pública para plugin de terceiros.** Os plugins continuam no núcleo, com um contrato único, e plugins em pacote ficam para depois, sobre o mesmo contrato (decisão 19 do [RFC](../rfc/v2.md)). O `definePlugin` que aparece no código é o contrato **interno**: serve a quem contribui no monorepo, e o site e o painel de um projeto só leem os plugins do núcleo. O passo a passo para criar um plugin do núcleo está em [Contribuindo](../v2/contribuindo.md#adicionar-um-plugin-do-núcleo).

O que um projeto pode fazer hoje, do menor para o maior esforço:

- **Ligar e combinar os plugins que existem**, pelo painel ou pelo `config`.
- **Bloco próprio**, para uma seção nova no site, com campos no painel: [Criar um bloco](./criar-bloco.md). Um bloco próprio pode depender de um plugin do núcleo (`plugin: "blog"`) e listar uma coleção dele.
- **Componente ejetado**, para mudar a marcação de um bloco que já existe: [Ejetar um componente](./criar-tema.md#ejetar-um-componente).
- **Funções e tabelas próprias no Convex**, para guardar e ler dados que o Rubrica não modela (abaixo).

### Funções e tabelas próprias no Convex

O `convex/` do projeto mistura dois tipos de arquivo. Os que começam com `// Gerado pelo Rubrica` (o `convex/rubrica/*`, o `auth.ts`, o `http.ts` e o `crons.ts`) são do CLI: o `update` reescreve e apaga. O `schema.ts`, o `auth.config.ts` e o `rubrica.config.ts` o CLI cria uma vez e não mexe mais. **Qualquer outro arquivo em `convex/` é seu**, e o Convex publica as funções dele junto com as do núcleo.

Para uma tabela nova, acrescente-a no `convex/schema.ts`, depois das do núcleo:

<!-- exemplo: projeto/convex/schema.ts -->
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { rubricaTables } from "@rubrica/core/convex/schema";

// Tabelas do login, do núcleo do Rubrica e (depois delas) as do próprio projeto.
export default defineSchema({
  ...authTables,
  ...rubricaTables,
  inscricoes: defineTable({
    email: v.string(),
    origem: v.optional(v.string()),
    criadaEm: v.number(),
  }).index("by_email", ["email"]),
});
```

E as funções num arquivo seu, fora de `convex/rubrica/` (que é do CLI):

<!-- exemplo: projeto/convex/inscricoes.ts -->
```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { can } from "@rubrica/core/convex/roles";
import { internalMutation, query, type QueryCtx } from "./_generated/server";

/** Grava uma inscrição. Interna: roda por `npx convex run`, pelo painel do Convex ou por outra função. */
export const adicionar = internalMutation({
  args: { email: v.string(), origem: v.optional(v.string()) },
  handler: async (ctx, { email, origem }) => {
    const normalizado = email.trim().toLowerCase();
    const existe = await ctx.db
      .query("inscricoes")
      .withIndex("by_email", (q) => q.eq("email", normalizado))
      .unique();
    if (existe) return existe._id;
    return ctx.db.insert("inscricoes", { email: normalizado, origem, criadaEm: Date.now() });
  },
});

/** Exige login com um papel do painel que veja contatos (root, admin ou comercial). */
async function exigirPapel(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Faça login");
  const papel = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!papel || papel.suspendedAt || papel.mustChangePassword || !can(papel.role, "contacts")) {
    throw new Error("Sem permissão para esta ação");
  }
}

/** Lista as inscrições, para quem tem o papel certo. */
export const listar = query({
  args: {},
  handler: async (ctx) => {
    await exigirPapel(ctx);
    return ctx.db.query("inscricoes").order("desc").take(500);
  },
});
```

Publique no Convex do computador com `npx convex dev --once` (ou deixe o `pnpm dev:convex` rodando) e teste com `npx convex run inscricoes:adicionar '{"email":"ana@exemplo.com"}'`. A produção recebe as funções no próximo `publicar`.

Os limites, hoje:

- O painel e o MCP não mostram tabelas nem funções próprias: os dados ficam no painel do Convex e no que você construir.
- O `http.ts` e o `crons.ts` são gerados, então ainda não há lugar para rotas HTTP nem tarefas agendadas próprias.
- A exportação e a exclusão de dados pessoais da tela **Privacidade** só enxergam as tabelas do núcleo. Se a tabela guarda dado pessoal, a responsabilidade de exportar e apagar é sua.
- Funções públicas (`query`, `mutation`) ficam abertas para qualquer cliente do Convex: confira o login e o papel, como acima, ou use as internas.
