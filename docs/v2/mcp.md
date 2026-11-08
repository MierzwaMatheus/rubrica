# MCP local do Rubrica

O Rubrica traz um servidor [MCP](https://modelcontextprotocol.io) **local** (RFC v2, decisão 10): o agente (Claude Code, Codex…) o inicia na sua máquina com `npx rubrica mcp`, ele fala com o Convex **daquele projeto** com o login de um usuário do painel e fecha junto com o agente. Não há servidor hospedado.

O código está em `packages/mcp` (`@rubrica/mcp`, binário `rubrica-mcp`; o CLI o expõe como `rubrica mcp`). Ele substitui o script Python da skill `rubrica` da v1. As skills de escrita (`rubrica-voz`, `rubrica-case`, `rubrica-blog`…) ficam só com o "como escrever" e gravam por aqui.

## Como funciona

```
agente (Claude Code, Codex)  ──stdio──▶  rubrica mcp  ──HTTPS──▶  Convex do projeto
                                          │                         (funções do @rubrica/core,
                                          └─ token em ~/.config/rubrica/   papel do usuário logado)
```

- As ferramentas saem dos mesmos schemas que valem no backend e no painel: os campos dos blocos (`CORE_BLOCKS`) e os validadores do Convex das coleções. O JSON Schema é gerado em código, com descrições em pt-BR, e já traz os idiomas do site.
- Valem as permissões do **papel** do usuário logado. O MCP só **mostra** o que o papel pode, e o backend recusa o resto de qualquer forma.
- Toda gravação começa em **prévia** (ver [Prévia antes de gravar](#prévia-antes-de-gravar)).

## Configurar

Na raiz do projeto Rubrica. O servidor acha o projeto subindo as pastas até um `rubrica.json` ou `rubrica.config.ts`, e a URL do Convex no `.env.local` (`CONVEX_URL` ou `VITE_CONVEX_URL`).

### Claude Code

`.mcp.json` na raiz do projeto (pode ir para o git: não tem segredo):

```json
{
  "mcpServers": {
    "rubrica": {
      "command": "npx",
      "args": ["rubrica", "mcp"]
    }
  }
}
```

Ou pela linha de comando: `claude mcp add rubrica -- npx rubrica mcp`.

Para o site publicado (Convex de produção, de `producao.convexUrl` no `rubrica.json`), acrescente `"--producao"` aos `args`. Deixe dev e produção como servidores separados, com nomes diferentes, se usar os dois:

```json
{
  "mcpServers": {
    "rubrica": { "command": "npx", "args": ["rubrica", "mcp"] },
    "rubrica-producao": { "command": "npx", "args": ["rubrica", "mcp", "--producao"] }
  }
}
```

### Codex

`~/.codex/config.toml` (ou `.codex/config.toml` do projeto):

```toml
[mcp_servers.rubrica]
command = "npx"
args = ["rubrica", "mcp"]
env = { RUBRICA_PROJECT = "/caminho/do/projeto" }
```

`RUBRICA_PROJECT` garante que o servidor ache o projeto mesmo se o agente iniciar em outra pasta.

### Sem o CLI `rubrica` instalado

Enquanto o subcomando `mcp` do CLI não chega ao seu projeto, o pacote tem o binário próprio: `npx -p @rubrica/mcp rubrica-mcp` (mesmos argumentos). No monorepo: `pnpm --filter @rubrica/mcp build` e `node packages/mcp/bin/rubrica-mcp.js`.

## Login

O login é da **pessoa**, no terminal dela. A senha é digitada lá, sem eco, e **nunca passa pelo agente**:

```bash
npx rubrica mcp login            # pergunta o e-mail e a senha
npx rubrica mcp login --email ana@exemplo.com
npx rubrica mcp login --producao # Convex do site publicado
npx rubrica mcp whoami           # projeto, Convex, conta e papel
npx rubrica mcp logout           # sai e apaga o token
```

No Claude Code a pessoa pode digitar `! npx rubrica mcp login` no próprio prompt. Para scripts: `--senha-stdin` lê a senha da entrada padrão.

- A conta é a de um usuário do painel (Convex Auth, e-mail e senha). O papel dela decide as ferramentas.
- O token de sessão fica em `~/.config/rubrica/<projeto>__<convex>.json` (pasta 700, arquivo 600; respeita `XDG_CONFIG_HOME` e `RUBRICA_CONFIG_DIR`). Há um arquivo por projeto **e por Convex**: dev e produção têm logins separados. Fica fora do repositório. A senha não é guardada.
- O MCP só lê o token e **renova** sozinho quando falta menos de um minuto para expirar. Se a sessão expirar de vez, as ferramentas pedem `npx rubrica mcp login` de novo. Vários agentes ao mesmo tempo dividem a sessão sem se atrapalhar.
- Tokens e senhas nunca saem em respostas das ferramentas, em recursos nem em mensagens de erro.
- A ferramenta `login` do MCP **não aceita senha** por padrão: ela confere a sessão e devolve a instrução do terminal. Só com `RUBRICA_MCP_ALLOW_PASSWORD=1` no ambiente do servidor ela passa a aceitar `password` (para automação; evite: a senha entra no contexto do agente).
- A conta de uma pessoa que ainda precisa trocar a senha (`mustChangePassword`) é avisada em `whoami`; troque no painel.

### Qual Convex?

Ordem: `RUBRICA_CONVEX_URL` → (com `--producao`) `producao.convexUrl` do `rubrica.json` → `.env.local` (`CONVEX_URL`, `VITE_CONVEX_URL`, `PUBLIC_CONVEX_URL`) → variáveis de ambiente → `convexUrl` do `rubrica.config.ts`. O tipo do deployment (`dev:`/`prod:`) vem do `CONVEX_DEPLOYMENT` do `.env.local`. O agente deve dizer à pessoa onde vai gravar (`whoami` mostra `environment`). **Em produção, o conteúdo muda na hora; o site estático só muda no próximo rebuild.**

## Prévia antes de gravar

Toda ferramenta que grava (`pages_create`, `block_update_fields`, `posts_update`, `texts_set`, `media_upload`, `site_update`…) tem o argumento `dryRun`, **padrão `true`**:

1. O agente chama a ferramenta. Nada é gravado; a resposta traz `applied: false`, um `summary`, a lista `changes` (cada item com `path`, `op`, `before`, `after` e, em texto traduzível, o `locale`) e `warnings`.
2. O agente mostra a prévia à pessoa.
3. Com o "ok", repete a **mesma chamada** com `dryRun: false`. A resposta traz `applied: true` (e o `result`, como o id criado).

```jsonc
// pages_update { "page": "/sobre", "title": { "en": "About" } }
{
  "applied": false, "dryRun": true,
  "summary": "Atualizar a página /sobre.",
  "changes": [{ "path": "title.en", "op": "add", "locale": "en", "after": "About" }],
  "next": "Nada foi gravado. Se a prévia estiver certa, repita a mesma chamada com dryRun: false."
}
```

Por que o padrão é prévia: é o que o RFC pede ("antes de gravar, o MCP mostra uma prévia"), um agente que esquece o argumento erra para o lado seguro, e o custo é uma chamada a mais. Para automação confiável, `RUBRICA_MCP_DRYRUN=0` no ambiente do servidor inverte o padrão (grava direto; `dryRun: true` continua dando a prévia). O padrão aparece na descrição do argumento no schema.

Detalhes da prévia:

- **Só o que muda.** Atualizações mostram apenas os campos alterados; textos longos (HTML de post) são cortados na prévia (o valor inteiro é gravado).
- **Textos por idioma são mesclados.** Mandar só `{"en": "..."}` mantém o `pt-BR` (`replaceLocales: true` troca o texto inteiro). Listas e imagens são trocadas inteiras.
- **Avisos** sobre o resultado: texto preenchido em alguns idiomas do site e vazio em outros (conteúdo sem tradução não aparece no idioma), `<h1>` no corpo (o h1 é do hero), slug ou caminho que muda (links quebram), mudança técnica de configuração.
- **Validação local antes do backend**, com erros por campo. Blocos passam por `validateBlock` e pelas regras de tipo do site e plugin; itens de coleção, configurações e argumentos passam por JSON Schema. A resposta de erro traz `problems: [{ blockId?, path, message }]`. O backend valida de novo (e sanitiza o HTML).

## Ferramentas

As colunas "papel" dizem quem enxerga a ferramenta (permissões de `PERMISSIONS` em `convex/lib/roles.ts`). O servidor só oferece o que o papel pode, o plugin está ligado e o backend tem; `tools/list_changed` avisa o agente quando isso muda (login, plugin ligado ou desligado).

**Conta e ambiente** (sempre)

| Ferramenta | O que faz |
|---|---|
| `whoami` | Projeto, Convex (dev/produção), conta, papel, site (tipo, idiomas, tema), plugins ligados e ferramentas disponíveis |
| `login` | Confere a sessão e devolve a instrução do login no terminal |
| `logout` | Encerra a sessão e apaga o token |
| `blocks_catalog` | Tipos de bloco do site (ou o JSON Schema de um tipo) |

**Site** — `panel`: todo papel; `settings`: root e admin

| Ferramenta | Papel | O que faz |
|---|---|---|
| `site_get` | todos | Configurações: nome, URL, tipo, idiomas, tema, aparência, navegação, redes, pessoa/empresa |
| `site_update` | root, admin | Muda parte das configurações (objetos e textos por idioma são mesclados). Idiomas, URL, tema e tipo do site só aparecem para root |
| `plugins_list` | todos | Plugins do tipo do site e se estão ligados |
| `plugin_set` | root, admin | Liga ou desliga um plugin |
| `site_publish` | root, admin | Dispara o deploy hook (rebuild). **Usa `rubrica/publish:trigger`** |

**Páginas e blocos** — `pages`: root, admin, content-editor

| Ferramenta | O que faz |
|---|---|
| `pages_list` / `pages_get` | Lista (caminho, idiomas, blocos) e lê uma página inteira |
| `pages_create` | Cria uma página (rascunho) com blocos tipados |
| `pages_update` | Título (mesclado por idioma), caminho e SEO |
| `pages_set_published` | Publica ou volta para rascunho |
| `pages_remove` | Manda para a lixeira (só root restaura; páginas do sistema não saem) |
| `block_add` | Acrescenta um bloco (tipado pelo catálogo) numa posição |
| `block_update_fields` | Muda só alguns campos de um bloco (`fields`, `unset`, `variant`, `source`) |
| `block_move` | Muda a posição de um bloco |
| `block_set_visible` | Oculta ou mostra um bloco sem apagar |
| `block_remove` | Apaga um bloco (sem lixeira: para só esconder, use `block_set_visible`) |

**Coleções** — para cada coleção ativa (plugin ligado no tipo do site), com a permissão dela: `posts` (`blog`: root, admin, content-editor, blog-editor), `projects`, `services`, `testimonials`, `faq`, `resume`, `routine`, `team` (`content`: root, admin, content-editor) e `plans` (`plans`: root, admin, content-editor, comercial)

| Ferramenta | O que faz |
|---|---|
| `<coleção>_list` | Itens (id, nome, publicado, idiomas e idiomas que faltam); filtros `search`, `published`, `includeDeleted` |
| `<coleção>_get` | Item inteiro, por `id` (ou `slug`, em posts e projetos) |
| `<coleção>_create` | Cria o item. **Sempre rascunho**, a menos que `published: true` (o backend publicaria serviços, FAQ… por padrão; o MCP não) |
| `<coleção>_update` | `patch` (mesclado por idioma), `unset` de opcionais |
| `<coleção>_publish` | Publica ou despublica (`published: false`) |
| `collection_remove` | Manda um item de qualquer coleção para a lixeira |
| `collection_reorder` | Ordem dos itens |

**Propostas** — `proposals`: root, admin, comercial, proposal-editor; só com o plugin `proposals` ligado

| Ferramenta | O que faz |
|---|---|
| `proposals_list` | Propostas (cliente, título, situação `pending`/`accepted`/`expired`/`trash`, valor, versão, link público, validade, `hasPassword`); filtros `filter` (`all`, `accepted`, `pending`), `search`, `includeDeleted` |
| `proposals_get` | Proposta inteira, por `id` ou `slug`. Sem a senha (só `hasPassword`), sem o aceite (dados pessoais do cliente) e sem o contrato congelado |
| `proposals_create` | Cria a proposta (versão 1). Campos do `proposalContentFields` do backend (cliente, título, objetivo, escopo, cronograma, valores em reais, desconto e brindes, pagamento, condições, rescisão). `slug` opcional (sem ele sai do cliente + sufixo aleatório), `expiresAt` (`AAAA-MM-DD`, padrão 10 dias) e `password` |
| `proposals_update` | Só proposta não aceita e fora da lixeira. `patch` (mesclado por idioma), `unset` (`scopePrices`, `originalValue`, `giftIndexes`, `templateId`), `expiresAt`, `password` (troca a senha e derruba as sessões) ou `removePassword`. Mudança de conteúdo ou de validade sobe a versão e guarda a anterior; trocar só a senha não versiona (como no painel) |

A **senha da proposta** é argumento de `proposals_create` e `proposals_update`: segue para o backend, que guarda só o hash (PBKDF2). Ela nunca volta em resposta, prévia, aviso ou erro (a prévia mostra `(definida; oculta)`), mas passa pela conversa com o agente; quem não quer isso cria sem senha e define no painel. Sem senha, qualquer pessoa com o link vê a proposta, e a prévia avisa. Apagar, restaurar, aceite e contratos continuam só no painel. O desconto, os brindes e o preço por item são conferidos localmente com as mesmas regras do backend (`validateDiscount`), que confere de novo.

**Textos de interface** — `panel` (ler), `texts`: root, admin, content-editor (gravar)

| Ferramenta | O que faz |
|---|---|
| `texts_list` | Texto padrão do núcleo + o personalizado + o efetivo, por idioma do site; filtros `prefix`, `search`, `customOnly`, `missingLocale` |
| `texts_set` / `texts_reset` | Personaliza (mescla por idioma) ou volta ao padrão |

Textos de **seção** (título de um bloco) não estão aqui: são campos do bloco.

**Mídia** — `media`: root, admin, content-editor, blog-editor

| Ferramenta | O que faz |
|---|---|
| `media_list` | Biblioteca, com o objeto `image` pronto para campos de imagem |
| `media_upload` | Sobe uma imagem de um caminho local. O tipo é conferido pelo **conteúdo** (PNG, JPG, WebP, AVIF, GIF, SVG, até 20 MB); lê as dimensões; devolve `image` (`url`, `storageId`, largura, altura, `alt`) |

**Contatos** — `contacts`: root, admin, comercial; só com o plugin `contact-wizard` e **se o backend tiver `rubrica/contacts`**

| Ferramenta | O que faz |
|---|---|
| `contacts_list` / `contacts_get` | Pedidos de contato |
| `contacts_set_status` | Status e nota interna |

Depoimentos entram como a coleção `testimonials` (o que ainda não foi publicado é o pendente de aprovação).

Quando um módulo do backend (contatos, publicação) ainda não existe, o MCP descobre sozinho: ele chama a função com um argumento inválido de propósito (o Convex recusa antes de executar, e a mensagem diz se a função existe) e só registra as ferramentas se ela existir.

## Recursos e prompts

- Recursos: `rubrica://guia/escrita` (regras de escrita), `rubrica://blocos/catalogo` (catálogo em texto, filtrado pelo site), `rubrica://blocos/<tipo>` (JSON Schema de um bloco), `rubrica://site/estado` (papel, idiomas, plugins, ferramentas).
- Prompts: `montar-pagina`, `traduzir-conteudo`, `revisar-antes-de-publicar`.
- As instruções do servidor repetem o essencial: ver o ambiente antes, prévia antes de gravar, um texto por idioma, h1 do hero, rascunho primeiro.

## Regras de escrita (resumo)

- Todo texto traduzível é um mapa por idioma. **Conteúdo sem tradução num idioma não aparece nesse idioma** (decisão 28); a prévia avisa.
- O **h1 é do hero** (o primeiro bloco). Nada de `<h1>` no corpo.
- Imagens: `media_upload`, usar o `image` devolvido, `alt` por idioma.
- Rascunho primeiro; publicar e fazer o rebuild só a pedido.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `RUBRICA_CONVEX_URL` | Endereço do Convex (vence o `.env.local`) |
| `RUBRICA_AMBIENTE=producao` | Igual a `--producao` |
| `RUBRICA_PROJECT` | Pasta do projeto |
| `RUBRICA_CONFIG_DIR` | Onde guardar a sessão (padrão `~/.config/rubrica`) |
| `RUBRICA_MCP_DRYRUN=0` | Grava direto, sem prévia (padrão: prévia) |
| `RUBRICA_MCP_ALLOW_PASSWORD=1` | A ferramenta `login` aceita `password` (evite) |

## Exemplos

**Trocar o texto do botão do hero, nos dois idiomas**

1. `pages_get { "page": "/" }` → acha o bloco `hero-ab12` e o `primaryCta` atual.
2. `block_update_fields { "page": "/", "blockId": "hero-ab12", "fields": { "primaryCta": { "label": { "pt-BR": "Fale comigo", "en": "Talk to me" }, "href": "/contato" } } }` → prévia com o antes/depois.
3. Com o "ok": a mesma chamada com `"dryRun": false`.

**Escrever um post (rascunho) com capa**

1. `media_upload { "path": "./capa.png", "folder": "/blog", "alt": { "pt-BR": "...", "en": "..." } }` → prévia; depois `dryRun: false` devolve `result.image`.
2. `posts_create { "title": {...}, "content": {...}, "cover": <image>, "tags": ["..."] }` → prévia; depois `dryRun: false`. Nasce como rascunho.
3. Só quando a pessoa pedir: `posts_publish { "id": "..." }` e, depois, `site_publish`.

**Completar a tradução para inglês**: prompt `traduzir-conteudo` com `idioma: en`.

## Segurança

- O servidor roda como processo da pessoa, com o login dela: tem o poder do papel dela. Prefira uma conta `content-editor` ou `blog-editor` para trabalho de conteúdo; `root` só quando preciso.
- Em produção, leia sempre a prévia: as gravações valem na hora no Convex.
- `media_upload` lê um arquivo local do caminho que o agente informar (só imagens, conferidas pelo conteúdo). Se isso for um problema, restrinja o acesso ao sistema de arquivos do agente.
- O MCP não usa `convex dev|deploy|run|import`: só as funções públicas do projeto, com o papel do usuário.

## Desenvolvimento

```bash
pnpm --filter @rubrica/mcp check
pnpm --filter @rubrica/mcp test    # inclui as ferramentas contra o backend real (convex-test) e a fumaça stdio
pnpm --filter @rubrica/mcp build   # dist/ para o binário
```

Os testes ligam as ferramentas ao backend do `apps/demo/convex` (convex-test) por um cliente falso (`test/backend.ts`), e a fumaça sobe o servidor stdio de verdade contra um Convex HTTP falso.

Para uma ferramenta nova de módulo opcional do backend: declare o módulo em `OPTIONAL_MODULES` (`src/state.ts`) com a função usada na checagem e ponha `access: { module: "<id>", permission, plugin }` na ferramenta.
