# Changelog

O que mudou em cada versão do Rubrica (núcleo, temas e CLI `create-rubrica`). Detalhes de cada uma nas [notas da release](https://github.com/MierzwaMatheus/rubrica/releases). Para atualizar um projeto v2, veja [Atualizar o Rubrica](./docs/guia/atualizar.md); para sair da v1, [Migrar da v1](./docs/guia/migrar.md).

## 2.1.0 — 2026-11-11

Os temas **padrão** e **cyberpunk** ficam iguais ao layout da v1, página por página, e o conversor `migrar` leva o que faltava dos dados da v1. Tudo o que entrou é opcional: quem não usa os campos novos não vê diferença. Contrato de tema 1.3.

### Novidades
- **Contato:** o assistente aceita assuntos com etapas próprias (escolha, texto, dados de contato) e abre na janela de contato do tema, em qualquer página. O painel mostra as respostas de cada pedido com nome.
- **Blog:** carrossel dos posts em destaque, busca por título, resumo e etiquetas, botão do RSS e cartões como os da v1 (`showFeatured` e `showSearch` no bloco de posts).
- **Post:** voltar ao blog, etiquetas, subtítulo, cartão do autor e o case relacionado.
- **Portfólio e case:** filtro por categoria e cartões com etiquetas, número de destaque e botão; números do case com ícone (`metrics` nos projetos), telas num carrossel com imagem ampliada e o convite com o próximo case.
- **Sobre, depoimentos e 404:** texto pessoal, mosaico do dia a dia (`span` nas fotos), FAQ num cartão, depoimentos agrupados por categoria com link para a página deles, e a 404 de terminal.
- **Casca:** sidebar mais compacta no desktop e botão de fechar a gaveta no celular.

### Correções
- **Datas dos posts no fuso do site:** um post publicado à noite no Brasil não aparece mais com a data do dia seguinte. O tempo de leitura arredonda para cima, como na v1.
- **Projeto ligado por `link:`** (ex.: `create --local`): os ícones das páginas de case não quebram mais o React no servidor de desenvolvimento.

## 2.0.0 — 2026-11-08

A v2: o Rubrica deixa de ser um template copiado para o projeto e vira um **núcleo em pacote**, com **temas** e duas linhas de site (pessoal e empresa). Atualizar passa a ser subir a versão de um pacote.

**Vindo da 1.x:** não é uma atualização, é uma migração. Rode `npx create-rubrica@latest migrar` num projeto na 1.13.1, com o git limpo: ele cria a branch `rubrica-v2`, troca o código, converte os dados e lista o que você personalizou. **Nada é gravado no Convex**: o import vai para um banco de desenvolvimento novo, e a produção só com o seu "ok". Guia: [Migrar da v1](./docs/guia/migrar.md). A v1 recebe correções de bug e de segurança por 6 meses na [branch `v1`](https://github.com/MierzwaMatheus/rubrica/tree/v1), onde também fica a [documentação dela](https://github.com/MierzwaMatheus/rubrica/tree/v1/docs).

### Segurança
Três falhas da v1 estão corrigidas na v2. A v1 não recebe correção para elas: se você tem um site v1 com propostas, a solução é migrar para a v2.
- **Proposta com senha não vaza mais o conteúdo pela API.** Na v1, quem chamava a consulta pública da proposta recebia o conteúdo mesmo sem digitar a senha: só a página escondia. Agora, sem sessão válida, a API devolve só o estado ("bloqueada"), sem o conteúdo.
- **O limite de senha errada agora bloqueia de verdade.** A tentativa errada lançava erro, o que desfazia a contagem de tentativas, e o limite nunca era atingido. Agora a tentativa é registrada e, passado o limite, a proposta responde `TOO_MANY_ATTEMPTS`.
- **Um só modelo de contrato padrão.** A v1 tinha dois modelos padrão (um no código e um no banco), e a proposta podia usar um diferente do que o painel mostrava. Na v2 o padrão é um só, o do banco (marcado como padrão); o texto que vem no código serve apenas para criá-lo quando ainda não existe nenhum.

### O que mudou na arquitetura
- **Núcleo em pacote.** `@rubrica/core` traz o site (Astro), o painel (React), o backend (Convex) e o MCP. O seu projeto guarda só configuração, blocos próprios e componentes ejetados. O `convex/` do projeto vira arquivos de uma linha que reexportam o backend do núcleo.
- **Site estático em Astro.** Acabaram a pré-renderização improvisada e a SPA: as páginas saem em HTML, com quase nenhum JavaScript (só as partes interativas viram ilhas). Imagens e fontes passam pelo tratamento do próprio Astro, as fontes são servidas pelo próprio site, e as do texto e dos títulos são pré-carregadas.
- **Páginas com blocos.** Cada página é uma lista de blocos tipados, com prévia ao vivo no painel. São 21 blocos de catálogo (15 comuns, 1 de pessoal e 5 de empresa), com o catálogo gerado do código em [Blocos](./docs/guia/blocos.md). Entre eles, quatro novos: **vídeo** (YouTube ou Vimeo; a miniatura carrega leve e o player só entra depois do clique), **incorporação** (agenda, formulário, mapa ou player, só de provedores permitidos; a CSP gerada já inclui esses provedores), **linha do tempo** e **comparativo de planos**. Dá para criar páginas novas pelo painel. O contrato de blocos está na 1.2: a definição de um bloco pode trazer `validate` (regras entre campos), `sample` (exemplo para a vitrine), `enhances` (ilha que melhora o bloco) e `guidance` (orientação de uso).
- **Duas linhas de site.** `pessoal` (o portfólio de sempre) e `empresa` (quem somos, serviços, preços, equipe, cases, contato). Na empresa entram a coleção de planos, a equipe e os dados da empresa (que geram o dado estruturado `Organization`/`LocalBusiness`). O escopo é explícito: a linha empresa é para quem vende serviço e recebe pedidos de orçamento, e **não é uma loja** (sem catálogo de produtos, carrinho nem estoque). As receitas de páginas da empresa usam a linha do tempo e o comparativo de planos. Veja [Site de empresa](./docs/guia/empresa.md).
- **14 temas, 15 esquemas de cor.** Os 13 layouts da v1 viram temas (mesmos nomes), mais o `padrao`. Cada tema é um pacote `@rubrica/theme-<nome>`. Qualquer esquema funciona em qualquer tema, e cada tema ou site pode ter uma **textura** opcional por cima da página (grão, papel ou scanlines). Todos passam pela mesma bateria de testes (`testar-tema`: axe, `h1` único, `<head>` completo, limite de JavaScript, Lighthouse).
- **Vários idiomas.** A lista de idiomas é configurável e o principal é à sua escolha (sem prefixo na URL). Conteúdo sem tradução só não existe naquele idioma: nada de página vazia ou erro 404 interno.
- **Papéis de agência e cliente.** `root` é a agência, `admin` o dono do site, e há o novo papel `comercial` (propostas, contratos, checkouts, contatos e planos).
- **Usuários.** O `root` reinicia a senha de alguém pelo painel, sem e-mail: sai uma senha temporária, mostrada uma só vez, as sessões da pessoa caem e a troca é obrigatória no próximo acesso. Também dá para suspender e reativar (o papel fica guardado). O backend cobra a troca da senha temporária: enquanto ela não for trocada, nem o painel nem o MCP nem a API funcionam para aquela conta.
- **Propostas, aceite e pagamento.** Os plugins ligados geram páginas públicas: a **proposta** (com senha, contrato, aceite com assinatura opcional e PDF), o **aceite**, o **checkout** (PIX, boleto ou cartão, pelo Asaas) e o **pagamento concluído**. Cada rota vira uma página estática por idioma, e o projeto gera as reescritas para Vercel, Netlify e Cloudflare Pages.
- **WhatsApp e faixa de aviso.** Nas configurações do site, um botão flutuante de WhatsApp opcional e uma faixa de aviso com datas de início e fim (avaliadas no build). O endereço `whatsapp:` funciona em qualquer botão ou link, e o número entra como `contactPoint` no JSON-LD. O `migrar` traz o número que a v1 tinha. Veja [Conteúdo e painel](./docs/guia/conteudo.md).
- **Contatos e LGPD.** Os pedidos vão para o painel e, se você ligar, para o Telegram, o e-mail (Resend) e um webhook assinado (HMAC), com reenvio automático. Há consentimento registrado nos formulários, política de privacidade gerada e exportação ou exclusão dos dados de um titular.
- **Agentes.** O servidor MCP local (`rubrica mcp`) substitui o script Python da skill `rubrica`: o agente edita páginas, blocos e coleções com o login de um usuário do painel, com **prévia antes de gravar**. As skills de escrita (`rubrica-voz`, `rubrica-case`, `rubrica-blog`, `rubrica-curriculo`, `rubrica-apresentacao`, `rubrica-pilar`) usam o MCP para gravar. O MCP tem ferramentas de **propostas**, usa o **catálogo real do projeto** (inclusive os blocos próprios, lido pelo backend), valida as **variações do tema instalado**, entrega as **receitas** do tema (`page_recipes`) e a **orientação de uso** de cada bloco.
- **Desenvolvimento.** O `pnpm dev` reflete o que você salva no painel sem reiniciar. Os formulários funcionam fora da Vercel e no computador: o endereço da API sai do Convex (`PUBLIC_RUBRICA_API` é opcional). A prévia ao vivo do painel funciona no site publicado.
- **Documentação.** O catálogo de blocos é gerado do código, e há guias para [criar um bloco](./docs/guia/criar-bloco.md) e [criar um tema](./docs/guia/criar-tema.md), além de [plugins](./docs/guia/plugins.md) (na 2.0 não há API pública para plugin de terceiros), [variáveis de ambiente](./docs/guia/variaveis.md) e [site de empresa](./docs/guia/empresa.md).
- **Hospedagem neutra.** A Vercel continua a oficial (o `publicar` automatiza só ela), mas o projeto gera `vercel.json`, `public/_redirects` e `public/_headers` da mesma configuração, e o botão Publicar aceita o deploy hook de qualquer hospedagem.
- **CLI novo.** Comandos `create`, `setup`, `config`, `publicar`, `senha`, `update`, `ejetar`, `verificar`, `testar-tema`, `mcp`, `migrar` e `telemetria`. Veja [Comandos do CLI](./docs/guia/cli.md).

### Quebras em relação à v1
- **O projeto não é mais uma cópia do template.** Não há `src/` do app, `templates/`, `cli/` nem `scripts/` no projeto. O `update` deixa de mesclar arquivos (e de gerar `.rubrica-new`): sobe pacotes e regenera o `convex/`.
- **Personalizações no código não migram sozinhas.** O `migrar` as lista, e cada uma vira configuração (tokens do painel), bloco próprio (`src/blocks/`) ou componente ejetado (`ejetar`).
- **O app deixa de ser uma SPA em Vite.** Páginas e rotas são do Astro; o painel fica em `/admin` (antes, `/login` e `/admin/*` na SPA).
- **O plugin `playground` saiu.** O plugin `i18n` ("Tradução IA") virou `translation`: os idiomas são do núcleo, e o plugin só preenche as traduções.
- **Textos de seção viraram campos dos blocos** (títulos, chamadas e botões); só os textos de interface continuam em "Textos".
- **As traduções `ptBR`/`enUS` viram um mapa por idioma.** No `migrar`, o principal é `pt-BR` e as URLs `/en` continuam iguais.
- **Pré-requisitos:** Node 22.23.4 ou mais novo (antes, 20).
- **O script Python da skill `rubrica` saiu:** use o MCP.
- **Variáveis de ambiente.** Os nomes novos ficam em [`docs/v2/variaveis.md`](./docs/v2/variaveis.md); os da v1 (`TELEGRAM_ADMIN_CHAT_ID`, `VERCEL_DEPLOY_HOOK_URL`, `VITE_UMAMI_*`) continuam aceitos.

### Pendências conhecidas
Estão em [`docs/v2/pendencias.md`](./docs/v2/pendencias.md). As principais:
- **Painel:** imagens no corpo dos textos, prévia ao vivo de posts e cases, tradução de um item inteiro de uma vez e a abertura do PDF do currículo com IA.
- **Para a 2.0.x:** o `update` ainda não regenera `vercel.json` e `public/_headers` (correções de cabeçalho, de reescrita e os provedores de incorporação só chegam a projetos novos); as reescritas não foram testadas em hospedagem real; e não há aviso de cookies antes de carregar uma incorporação.

## 1.13.1 — 2026-11-07

A primeira visita aparece sem esperar as animações.

**Vindo da 1.13.0:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI nem de publicar nada no Convex.

### Velocidade
- **Conteúdo visível de imediato:** as animações de entrada deixavam o título e o conteúdo invisíveis até o JavaScript carregar. Agora a página pré-renderizada já chega no estado final, e as animações continuam ao navegar entre páginas. Num site real, a home foi de 86 para 100 no Lighthouse (celular), com o LCP caindo de 4,1 s para 1,2 s; um post foi de 84 para 95.

## 1.13.0 — 2026-11-07

Uma auditoria das páginas: SEO corrigido, a primeira visita mais rápida e acessibilidade nos 14 layouts.

**Vindo da 1.12:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI nem de publicar nada no Convex.
- Personalizou o `vercel.json`? Traga do `.rubrica-new` os `rewrites` novos (só as rotas do app vão para o `app.html`), o `trailingSlash: false` e o cache de `/fonts/`. Sem os rewrites novos, endereço que não existe continua respondendo 200.
- Personalizou a barra lateral? Compare com o `.rubrica-new`: o botão do menu mobile e a chave de idioma ganharam nome para leitores de tela, e alguns textos ganharam contraste.
- Personalizou o `index.html`? Tire o `maximum-scale=1` do `viewport`: ele bloqueava o zoom.

### SEO
- **Endereço que não existe responde 404.** Antes respondia 200 com uma página vazia, que o Google podia indexar.
- **`robots.txt`:** gerado no build, com o endereço do sitemap e o painel bloqueado. Antes, o endereço devolvia a página do site.
- **Sem endereços duplicados:** `/blog/` redireciona para `/blog`.
- **Título em todas as páginas:** os layouts brutalist, swiss, bento, magazine, zine, blueprint e chat saíam sem título, descrição e canonical nas próprias páginas. Agora toda página fixa tem um padrão, que a página pode sobrepor.

### Velocidade
- **A primeira visita aproveita o HTML do build.** O conteúdo da página (o post inteiro, com a capa) era descartado e redesenhado logo depois de carregar. Agora o código da página chega antes, e nada é refeito.
- **Imagens do tamanho da tela:** o celular baixa uma versão de 800px em vez da de 1600px; as imagens vêm com largura e altura, então a página não pula quando elas carregam, e a principal tem prioridade.
- **Fontes servidas pelo próprio site:** a página não espera mais o Google Fonts para aparecer.
- **JavaScript principal 19% menor:** as animações, os assistentes de contato e depoimento, o terminal e o gerador de CV carregam só quando são usados.
- **Textos do painel e das propostas** saem das páginas públicas.

### Acessibilidade
- **Zoom liberado no celular.**
- **Nomes para leitores de tela:** o botão do menu mobile, a chave de idioma e os links do GitHub e LinkedIn do layout bento.
- **Contraste:** textos mais legíveis na barra lateral e na home padrão, e nas tags dos posts.

### Correções
- O conteúdo de um post com `$&` ou `$'` (código, por exemplo) podia sair corrompido no build.
- Uma imagem cujo identificador terminava só com números podia ser trocada pela versão menor.

## 1.12.0 — 2026-11-07

A lista de projetos fica bem mais leve: as páginas que mostram projetos não carregam mais o texto inteiro de cada case.

**Vindo da 1.11:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI nem de publicar nada no Convex.
- Publique de novo (`npx create-rubrica publicar` ou o botão Publicar do painel) para o build gerar os arquivos novos dos projetos.

### Site
- **Lista de projetos enxuta:** a home, o portfólio, os cases e os posts levavam no HTML os textos completos de todos os cases, a descrição longa de cada projeto e os dados de cada imagem da biblioteca. Agora a lista leva só o que é mostrado nela (métricas do case e endereço das imagens), e cada projeto completo fica num arquivo próprio, lido pela página do case. Num site real, a lista caiu de 153 KB para 33 KB, a home de 241 KB para 138 KB, e a página de um case de 233 KB para 123 KB.
- **Modal do portfólio:** a descrição longa é buscada quando o modal abre. Até ela chegar, aparece a descrição curta.
- **Layout cyberpunk:** o botão "Baixar CV" da barra lateral também busca o currículo só no clique.

## 1.11.0 — 2026-11-07

As imagens do conteúdo saem do build otimizadas e em cache, e as páginas ficam bem mais leves.

**Vindo da 1.10:**
- Atualize com `npx create-rubrica@latest update` e rode `pnpm install` (ou `npm install`): o build usa o `sharp`, que é novo. Não precisa de versão nova do CLI nem de publicar nada no Convex.
- Personalizou o `vercel.json`? Traga do `.rubrica-new` o bloco `/media/(.*)`, que serve as imagens com cache de um ano.
- A primeira publicação depois de atualizar baixa e otimiza todas as imagens, então demora um pouco mais. As seguintes só baixam as imagens novas.

### Site
- **Imagens otimizadas no build:** capas, imagens dos cases e dos posts e avatares são baixados do Convex, reduzidos para até 1600px, convertidos para WebP e servidos pelo próprio site, com cache de um ano. Antes, cada visitante baixava o arquivo original do storage, sem cache de CDN. Num site real, as imagens caíram de 26 MB para 7,3 MB, e a capa de um post, de 841 KB para 116 KB.
- **Prévias de link com JPG:** o `og:image` usa uma versão JPG de 1200px, que toda rede aceita.
- **Builds mais rápidos:** as imagens ficam em cache entre as publicações, e só as novas são baixadas. Vídeos e PDFs continuam no storage.
- **Páginas mais leves:** a lista do blog não carrega mais o texto de todos os posts (num site real, `/blog` caiu de 1,3 MB para 233 KB), e o botão "Baixar CV" só busca o currículo no clique, em vez de carregá-lo em todas as páginas.

### Correções
- O PDF do currículo abre numa aba criada já no clique, então o navegador não o bloqueia como pop-up.

## 1.10.0 — 2026-11-07

As páginas públicas saem do build prontas, com versão em inglês em `/en`, e os posts do blog ganham campos de SEO.

**Vindo da 1.9:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI.
- O backend mudou (`convex/`): publique no Convex do computador com `npx convex dev --once` e, no site no ar, com `npx create-rubrica publicar`. Os campos novos dos posts são opcionais: os posts existentes continuam iguais.
- Personalizou o `vercel.json`? Traga do `.rubrica-new` a troca do rewrite de `/index.html` para `/app.html`. Sem ela, o painel e o login abrem com o HTML da home e dão erro.
- Personalizou o script `build` do `package.json`? Ele agora termina em `npm run build:site`, que gera as páginas.
- O idioma passa a vir do endereço: o inglês fica em `/en/...`. A escolha salva no navegador não troca mais o idioma sozinha; quem tem o navegador no outro idioma vê um aviso para trocar.
- As configurações de `/admin/site-config` (cores, título e descrição do site) passam a valer no site publicado. Antes, o site no ar usava as do `rubrica.config.ts`. Confira o painel antes de publicar.
- Textos editados em `/admin/textos` aparecem no site depois de publicar, como o resto do conteúdo.

### Site
- **Páginas prontas no build:** home, Sobre, Currículo, Portfólio, cada case, Blog, cada post e Depoimentos saem como HTML com o conteúdo e o título, a descrição e a imagem de cada página. É o que o Google e as prévias de link (WhatsApp, LinkedIn) leem. No navegador, o site continua navegando sem recarregar a página. Painel, login, propostas e checkout funcionam como antes.
- **Inglês em `/en`:** cada página existe nos dois idiomas, com canonical, `hreflang` e `<html lang>` certos, e o sitemap lista as duas versões.
- **SEO dos posts:** cada post tem título, descrição, imagem e dados estruturados (JSON-LD) próprios. Antes, todo post saía com o título do site.
- **Um `<h1>` por página:** o nome na sidebar (padrão e cyberpunk) deixou de ser o `<h1>` de todas as páginas; a home do brutalist, o Sobre e os Depoimentos ganharam o deles.

### Blog
- **SEO e compartilhamento no post:** título e descrição para o Google, imagem de compartilhamento e prévia do resultado na busca, em `/admin/blog`. Tudo opcional: em branco, o site usa título, subtítulo e capa. O inglês é traduzido ao salvar.
- **Slug estável:** o endereço do post é sugerido pelo título só na criação e depois só muda se você editar; mudar o de um post publicado mostra um aviso, porque quebra links.

### Skills
- `rubrica`: `post-criar`, `post-editar` e `aplicar-plano` aceitam os campos de SEO do post.
- `rubrica-blog`: a etapa de SEO escreve a descrição para o Google, e o plano já leva os campos ao post.

### Correções
- Editar o título de um post publicado mudava o endereço dele.
- Dois posts podiam ficar com o mesmo endereço ao editar o slug.
- O site publicado ignorava as cores e o SEO salvos em `/admin/site-config`.

## 1.9.0 — 2026-10-29

CLI 1.6.0: telemetria anônima dos comandos, para saber o que as pessoas mais usam.

**Vindo da 1.8:**
- Para ter o CLI novo, use `npx create-rubrica@latest`. Projetos existentes podem atualizar com `npx create-rubrica@latest update`: só documentação mudou no template, nada para publicar no Convex.
- Não quer mandar nada? `npx create-rubrica telemetria desligar` na pasta do projeto, ou `RUBRICA_TELEMETRIA=0`.

### CLI
- **Telemetria anônima:** quando `create`, `setup`, `publicar`, `update` e `config` terminam bem, o CLI manda as escolhas feitas (layout, esquema, modo de cor, textura, fontes, pacote de plugins, integrações ligadas, versões). Nada de nome, e-mail, endereço do site, conteúdo, chaves ou IP. O projeto ganha um id aleatório no `rubrica.json`, e o CLI avisa na primeira vez.
- **Comando `telemetria`:** `npx create-rubrica telemetria` mostra se está ligada; `ligar` e `desligar` gravam a escolha no projeto. `--sem-telemetria` desliga numa execução (no `create`, o projeto já nasce desligado). `DO_NOT_TRACK=1` também vale, e em CI o CLI nunca manda nada.
- O envio dura no máximo 2 segundos e nunca quebra o comando.

### Documentação
- Página nova [Telemetria do CLI](https://userubrica.vercel.app/docs/guia/telemetria): o que vai, o que não vai e como desligar.

## 1.8.1 — 2026-10-26

Correção: textos novos de uma atualização apareciam como chave crua no site.

**Vindo da 1.8:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI nem de publicar nada no Convex.

### Correções
- Depois de atualizar o Rubrica, textos que chegaram na versão nova (como o aviso de tradução do depoimento e o botão "Ver original", da 1.8.0) apareciam como `portfolio.showOriginal` no lugar do texto. Agora o site usa o texto padrão enquanto a chave não existe no banco. Os textos que você editou no admin continuam valendo.

## 1.8.0 — 2026-10-26

Os cards de métricas e o depoimento do case passam a ter versão em inglês.

**Vindo da 1.7:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI.
- O backend mudou (`convex/`): publique no Convex do computador com `npx convex dev --once` e, no site no ar, com `npx create-rubrica publicar`. Os campos novos são opcionais: os cases existentes continuam iguais.
- Os cases já salvos continuam em português em `/en/` até você abrir cada projeto em `/admin/projects` e salvar de novo. A tradução é feita nesse momento.

### Cases
- **Métricas em inglês:** ao salvar o projeto, o rótulo e o valor de cada card são traduzidos. Números ("365", "7 GB → 400 MB") ficam iguais; texto ("Entrada + saída") é traduzido. A métrica do cartão na home e no portfólio também aparece traduzida.
- **Depoimento com idioma original:** escolha em que língua a pessoa escreveu o depoimento (Português ou Inglês). Na outra língua, o site mostra a tradução com o aviso "Tradução automática do original" e um botão para ver o original.
- O prompt de importação de case por JSON pede as métricas e o depoimento traduzidos.

### Skills
- As skills `rubrica` e `rubrica-case` sabem traduzir as métricas e marcar o idioma original do depoimento.

## 1.7.0 — 2026-10-25

Propostas com preço por item, desconto e brinde. As skills passam a abrir issue quando o Rubrica não faz o que foi pedido, e os projetos ganham instruções para agentes de IA.

**Vindo da 1.6:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI.
- O backend mudou (`convex/`): publique no Convex do computador com `npx convex dev --once` e, no site no ar, com `npx create-rubrica publicar`. Os campos novos são opcionais: as propostas existentes continuam iguais.
- Para o desconto aparecer em contratos de modelos já salvos, acrescente `{{discount}}` ao modelo em `/admin/contracts`.

### Propostas
- **Preço por item:** cada item do escopo pode ter preço, mostrado ao lado dele na proposta e no contrato.
- **Desconto:** campo opcional de valor original (antes do desconto). A proposta mostra o original riscado, o desconto em R$ e % e o valor final. O admin sugere o valor original pela soma dos itens e avisa quando a soma não fecha.
- **Brinde:** marque um item com preço como brinde. Na proposta, ele aparece com o badge "Brinde", o preço riscado e R$ 0,00.
- O valor do projeto continua sendo o valor final, usado no contrato e nas formas de pagamento. O contrato cita o desconto e os brindes, e os modelos de contrato ganham as variáveis `{{original_value}}` e `{{discount}}`.

### Skills e agentes
- **Abrir issue:** quando a pessoa pede algo que o Rubrica não suporta, ou algo quebra, as skills decidem se é bug ou pedido, procuram uma issue parecida e, com o "ok" da pessoa, abrem no GitHub do Rubrica (pelo `gh` ou por um link preenchido), sem dados privados.
- A skill `rubrica` sabe mexer em preços, desconto e brinde das propostas.
- **`AGENTS.md` e `CLAUDE.md`** na raiz do projeto: ensinam agentes como Claude Code, Codex e Cursor a atualizar o Rubrica (incluindo os arquivos `.rubrica-new`), o que eles podem rodar no CLI e o que fica com você. Veja "Com um agente de IA" em [Comandos do CLI](./docs/guia/cli.md).

## 1.6.0 — 2026-10-25

O site do Rubrica ganha versão em inglês, a página de novidades e a documentação, com três guias novos: começar, comandos do CLI e publicar.

**Vindo da 1.5:**
- Atualize com `npx create-rubrica@latest update` para receber a skill `rubrica-voz` que entende a entrevista em inglês. Não precisa de versão nova do CLI nem de publicar nada no Convex.

### Site do Rubrica
- **Em inglês**, em [userubrica.vercel.app/en](https://userubrica.vercel.app/en/), com seletor de idioma no topo. Combinador, "Crie o seu", layouts e esquemas, tudo traduzido. A página avisa que o CLI e o painel são em português.
- **Novidades** em `/novidades` (e `/en/changelog`): este changelog no próprio site, com índice de versões.
- **Documentação** em `/docs` (e `/en/docs`): o guia dos templates, os 13 layouts, os esquemas de cores, criar um layout e atualizar viram páginas do site, com navegação e índice. Os links do site deixam de mandar para o GitHub.

### Guias novos
- [Começando](./docs/guia/comecando.md): do zero ao site rodando no computador, e o que preencher em cada tela do painel.
- [Comandos do CLI](./docs/guia/cli.md): todas as perguntas, opções e arquivos do `create`, e os outros comandos.
- [Publicar o site](./docs/guia/publicar.md): a primeira publicação, o botão Publicar do painel, outro computador, domínio próprio e problemas comuns.
- O README e o README do CLI ficaram mais curtos e apontam para esses guias.

### Entrevista de voz em inglês
- Em [/en/voice](https://userubrica.vercel.app/en/voice), com o ditado em inglês e as respostas salvas à parte das em português. A skill `rubrica-voz` reconhece a entrevista em inglês e observa a voz no idioma das respostas.

## 1.5.0 — 2026-10-25

O botão **Publicar** do painel passa a funcionar sem GitHub, o agente de IA entra no site publicado, e o `publicar` fica seguro em outro computador.

**Vindo da 1.4:**
- Atualize com `npx create-rubrica@latest update` e rode `npx create-rubrica@latest publicar`. Ele anota no `rubrica.json` o endereço do site publicado e oferece ligar o botão Publicar do painel (você cria um token na Vercel e cola no terminal, uma vez só).
- Versione o `rubrica.json` junto com o projeto: é por ele que o `setup` e o `publicar` reconhecem, num outro computador, que o site já está no ar.

### Botão Publicar do painel
- **Sem GitHub.** A Vercel só cria Deploy Hook em projeto ligado ao GitHub, e o `publicar` envia pelo terminal. Agora o painel usa um token da Vercel para refazer o último deploy de produção: o build roda de novo e busca o conteúdo atualizado. Quem tem Deploy Hook continua usando o hook.
- O `publicar` abre a página de tokens da Vercel, explica o que preencher, recebe o token sem mostrá-lo na tela, confere se ele acessa o projeto e grava no banco de produção.
- O painel mostra o motivo quando a publicação não sai (botão não configurado, token vencido). Antes dizia "Deploy iniciado com sucesso!" mesmo com erro.

### Agente de IA no site publicado
- A skill `rubrica` ganha `--producao` (ou `RUBRICA_AMBIENTE=producao`) para mexer no site no ar. O padrão continua sendo o site do computador.
- Num projeto já publicado, o login pergunta se você quer entrar no site publicado ou no do computador. O `status` mostra os dois endereços.

### `publicar` e `setup` em outro computador
- O `publicar` grava em `producao` no `rubrica.json` o endereço do banco e do site publicados (projetos da 1.4 ganham isso ao publicar de novo).
- Sem a pasta `.vercel` (clone novo, outro computador), o `publicar` percebe que o site já está publicado, liga a pasta ao mesmo projeto da Vercel e só publica. Antes ele refazia a primeira vez: gerava chaves de login novas (todo mundo saía do painel) e regravava os dados do painel.
- Se o computador estiver ligado a outro projeto do Convex, o `publicar` para antes de gravar qualquer coisa, para não trocar o banco do site no ar por um vazio. O `setup`, num clone de site publicado, liga a um projeto existente do Convex em vez de criar um novo.
- Publicando de novo, o Telegram e o OpenRouter ligados no computador depois da primeira vez vão para a produção (só os que faltam lá).

### `create`
- O git começa na branch `main`, com um primeiro commit do projeto montado. Antes, o nome da branch dependia do computador (em geral `master`) e ela só passava a existir no primeiro commit da pessoa.

## 1.4.1 — 2026-10-24

Layouts ajustados para telas largas (monitores de 1920px para cima). Nada muda em telas de até 1600px.

**Vindo da 1.4:**
- Atualize com `npx create-rubrica@latest update`. Não precisa de versão nova do CLI nem de publicar nada no Convex. Se o site já está publicado, publique de novo depois de atualizar.

### Telas largas
- **Jardim Digital:** o conteúdo ficava colado na barra lateral, com um espaço vazio enorme à direita. Agora a coluna fica centralizada.
- **Bento:** o grid parava só na borda da tela, e os cards ficavam enormes. Agora para em 1600px e fica centralizado.
- **Suíço:** menu e conteúdo param juntos em 1600px e, acima disso, ganham bordas laterais no traço do layout, como uma folha centralizada.

## 1.4.0 — 2026-10-24

`npx create-rubrica publicar` coloca o site no ar na Vercel sem copiar nada à mão, e o template passa a funcionar quando publicado a partir de um projeto do CLI.

**Vindo da 1.3:**
- Atualize com `npx create-rubrica@latest update`. Ele traz a pasta `domain/` (sem ela o `npm run build` falha), o `public/color-mode.js` e o `build:i18n` corrigido.

### Publicar
- `npx create-rubrica publicar`: entra na Vercel (login pelo navegador), cria o projeto, prepara o banco de produção do Convex (chave, backend, chaves de login, integrações do Telegram e do OpenRouter, profissão), cria o admin do site publicado e os dados iniciais, grava as variáveis na Vercel e publica. Rodar de novo só publica.
- O `setup` termina dizendo como colocar o site no ar.

### Correções para o site publicado
- Projetos criados pelo CLI falhavam no `npm run build`: a pasta `domain/`, usada pelo gerador de RSS, ficava fora do pacote da release.
- O build da Vercel apagava as traduções do site quando o plugin de tradução estava desligado (o menu aparecia como `navigation.home`). Agora os textos do banco são mesclados sobre as traduções do repositório.
- O script do modo claro/escuro era bloqueado pela política de segurança (CSP) do site publicado. Ele passou para `public/color-mode.js`.

## 1.3.0 — 2026-10-24

Skills para o agente de IA escrever o conteúdo do site com método e com a voz do dono, e a entrevista de voz no site. Nada muda no site nem no painel de quem está na 1.2.

**Vindo da 1.2:**
- Atualize com `npx create-rubrica@latest update`. Ele traz as pastas `.agents/skills/rubrica-*` (e os atalhos em `.claude/skills/`) e a linha `.rubrica/` no `.gitignore`. Nada precisa ser publicado no Convex.
- Na primeira vez que pedir ao agente um texto do site (apresentação, case, currículo, post), ele vai te mandar para a entrevista de voz em https://userubrica.vercel.app/voz. Leva uns 20 minutos.

### Skills de conteúdo
- **Seis skills novas** para o agente de IA escrever o conteúdo do site com método e com a voz do dono: `rubrica-voz`, `rubrica-apresentacao`, `rubrica-case`, `rubrica-curriculo`, `rubrica-blog` e `rubrica-pilar`. As técnicas de apresentação, case e currículo vêm de pesquisa com fontes (que acompanham cada skill em `references/pesquisa.md`).
- **A voz vem primeiro.** Sem perfil de voz, as skills mandam a pessoa para a entrevista de voz no site (`/voz`, fora dos buscadores): 21 perguntas, respondidas falando (ditado do navegador) ou digitando, com um botão que copia tudo em Markdown para o agente. A `rubrica-voz` mede o estilo com um script, monta o perfil com trechos literais, calibra às cegas com a pessoa e propõe o lado pessoal da página Sobre.
- As estrategistas não gravam nada: entregam um plano em `.rubrica/planos/`, revisado pela `rubrica-pilar`, que a skill `rubrica` aplica.
- Novo comando `aplicar-plano` no script da skill `rubrica`: valida o plano antes de gravar (estrutura, arquivos, chaves de texto, slug repetido, contraste, inglês faltando, funções que não existem), mostra o antes → depois (`--verificar`), recusa planos feitos para outro Convex e retoma de onde parou se algo falhar (`--retomar`).

## 1.2.0 — 2026-10-24

CLI pensado para quem não é da área técnica: menos perguntas, nada repetido, do site direto para o terminal e troca de senha do painel pelo terminal. Nada quebra em quem está na 1.1.

**Vindo da 1.1:**
- Atualize com `npx create-rubrica@latest update`. É o que traz a função usada pelo `npx create-rubrica senha`. Se o site já está publicado, publique de novo depois de atualizar.
- A senha do painel passa a seguir as mesmas regras em todo lugar: 12 ou mais caracteres, com maiúscula, minúscula e número. Senhas antigas continuam valendo; a regra vale para as próximas trocas.

### Do site direto para o terminal
- A seção **Crie o seu** do site, abaixo do combinador, monta um comando com `--receita`. Ele leva o visual escolhido, os plugins, a identidade, a profissão e as especialidades. Nada sai do navegador.
- Com a receita, o CLI mostra um resumo, confirma e só pergunta o que faltar. O projeto é criado no Convex sem as perguntas dele, e o terminal pede **só a senha do painel**. Telegram e Vercel ficam para um `setup` posterior.
- Opções legíveis para quem prefere: `--layout`, `--esquema`, `--modo`, `--textura`, `--fonte`, `--mono`, `--plugins`, `--alternancia`.

### Menos perguntas no `create`
- Começa perguntando **Rápido** ou **Personalizado**. No rápido, as cores, a textura e as fontes vêm do layout, e o idioma fica em português.
- Plugins em **pacotes prontos** (Completo, Para vender serviços, Só o portfólio), com a lista um por um como opção. Nomes e descrições em linguagem comum, também no `config`.
- Endereço do site **sem precisar digitar `https://`**: `meusite.com/` vira `https://meusite.com`. O `@` e o link do perfil do X também são aceitos. Quem não tem domínio pode deixar o `<projeto>.vercel.app` sugerido.
- Git e instalação das dependências **sem perguntas**: com pnpm se o create veio do `pnpm create`, com npm nos outros casos.
- Oferece configurar o painel na hora: conecta o Convex e roda o `setup` no mesmo fluxo, sem segundo terminal.

### `setup`, `config` e senha
- O `setup` conecta o Convex sozinho quando falta o `.env.local`, **não pergunta de novo** o endereço do site e já preenche o e-mail do admin. Telegram e Vercel ficam atrás de um sim/não, e as perguntas não mostram mais nomes de variável de ambiente.
- A profissão informada no `setup` passa a aparecer abaixo do nome no site. Antes ela era gravada por uma função que exigia login e falhava em silêncio.
- Rodar o `setup` de novo não pede mais a senha quando o painel já tem admin.
- **`npx create-rubrica senha`**: troca a senha do painel pelo terminal, no site publicado ou no do computador, e libera o login bloqueado por tentativas erradas.
- `config` → Identidade abre as perguntas com os valores salvos, em vez de pedir tudo de novo.
- Guia de [manutenção do CLI](https://github.com/MierzwaMatheus/rubrica/blob/v1/docs/cli/manutencao.md): o que mudar no CLI quando entra layout, esquema, fonte ou plugin novo, e as regras da receita.

## 1.1.0 — 2026-10-24

8 layouts novos, 15 esquemas de cores com modo claro e escuro, alternância de modo pela visita, texturas e cores do admin separadas por modo. Nada quebra em quem está na 1.0.

**Vindo da 1.0:**
- Atualize com `npx create-rubrica@latest update` e depois rode `npx create-rubrica@latest config` → **Aparência** para escolher o esquema, o modo, a alternância e a textura. Antes do `update`, o `config` avisa que os layouts novos e o modo claro/escuro ainda não existem no projeto.
- Cores trocadas antes pelo admin continuam valendo nos dois modos até a aparência ser salva de novo.

### 8 layouts novos
- **Desktop Retrô**, **Índice**, **Monografia**, **Zine**, **Blueprint**, **Jardim Digital**, **Conversa** e **Pôster Cinético**, cada um com as 5 páginas (Início, Currículo, Portfólio, Sobre, Blog), funcionando no celular e nos dois modos. Veja o [guia dos templates](https://github.com/MierzwaMatheus/rubrica/blob/v1/docs/templates/README.md).

### Esquemas de cores, modo claro/escuro e textura
- **15 esquemas de cores**, cada um com modo claro e escuro e 11 papéis de cor: os 4 presets originais (agora também no outro modo), o Neon (o visual original) e 10 novos (Riso, Cianotipia, Tropicália, Azulejo, Sumi, Fósforo, Crepúsculo, Concreto, Sorbet, Alto Contraste). Os 5 layouts originais seguem usando só as 4 cores de sempre; os novos usam o esquema completo.
- **Modo claro, escuro ou automático** (segue o sistema de quem visita), com opção de mostrar um botão para a visita alternar. Todos os 13 layouts têm o botão.
- **Texturas** opcionais: grão de filme, papel e scanlines.
- `create-rubrica` e `create-rubrica config` → Aparência perguntam esquema, modo, alternância e textura, com o recomendado de cada layout marcado.
- As páginas compartilhadas (post, estudo de caso, depoimentos, propostas, checkout, 404 e os formulários) passaram a funcionar no modo claro. O painel admin fica sempre escuro.
- **Cores do admin por modo:** em Site & Aparência, cada modo tem as suas 4 cores. Os campos começam com as cores do esquema, só o que você muda fica salvo, e "Usar as cores do esquema" desfaz a personalização. Antes, salvar a aparência (mesmo só trocando a fonte) fixava as 4 cores por cima do esquema.
- O link do Google Fonts passa a carregar também a fonte mono, que antes não era carregada.

## 1.0.0 — 2026-10-24

Primeira versão estável. A partir daqui, dentro da 1.x, atualizar não quebra o que você personalizou nem os seus dados: campos novos no banco são sempre opcionais, e mudanças que exijam migração só entram numa versão major nova, com guia.

**Vindo da 0.x:**
- Atualize com `npx create-rubrica@latest update`. Projetos criados com o CLI até a v0.3.18 informam a versão de origem com `--from` (veja [Atualizando o seu Rubrica](https://github.com/MierzwaMatheus/rubrica/blob/v1/docs/atualizacao.md)); projetos de fork usam `git merge v1.0.0`.
- Pagamentos agora são reais: configure `ASAAS_API_KEY` e cadastre o webhook do Asaas (README → "Configurando os pagamentos"). A integração com o Stripe foi removida.
- O script do Umami passa a usar `VITE_UMAMI_SCRIPT_URL` e `VITE_UMAMI_WEBSITE_ID` (as variáveis antigas continuam aceitas).

### Atualizar sem perder personalizações
- `create-rubrica update` foi reescrito. Antes, ele extraía a versão nova por cima do projeto (perdendo qualquer arquivo editado à mão) e zerava a identidade do `rubrica.config.ts`. Agora ele mescla, arquivo por arquivo, as mudanças do Rubrica com as suas; quando os dois mexeram no mesmo trecho, o seu arquivo fica intacto e a versão nova vai para `<arquivo>.rubrica-new`. Novas opções: `--dry-run`, `--from`, `--to`, `--yes`.
- O `create` passa a gravar no `rubrica.json` a versão realmente baixada (antes gravava sempre `0.1.0`). Projetos antigos informam a versão de origem com `--from` ou respondendo à pergunta do `update`.

### Pagamentos de verdade (Asaas)
- O checkout passa a criar cobranças reais no Asaas: **PIX** (QR code e copia-e-cola), **boleto** (linha digitável e PDF) e **cartão em até 12x**, pela página segura do Asaas. O site nunca recebe dados de cartão.
- **Correção grave:** o pagamento com cartão era marcado como confirmado sem nenhuma cobrança. Agora o checkout só vira pago quando o webhook do Asaas confirma.
- O valor com juros do parcelamento é calculado no servidor; antes vinha do navegador e podia ser alterado.
- Trocar de forma de pagamento cancela a cobrança anterior (antes ficavam duas cobranças abertas), inclusive todas as parcelas de um parcelamento. Links vencidos ou apagados cancelam a cobrança de PIX/cartão.
- Boleto já gerado não pode ser trocado por outra forma: ele pode ter sido pago e ainda estar compensando.
- Proteções contra pagamento em dobro e abuso: trava contra dois cliques simultâneos, limite de cobranças por link e QR code PIX vencido regenerável.
- Estornos e chargebacks do Asaas marcam o checkout como estornado e avisam no Telegram; pagamento de cobrança diferente da atual, em link apagado ou com valor menor também gera aviso.
- Mensagens de erro do pagamento chegam ao cliente em produção (antes viravam "Server Error").
- Checkout com valor mínimo de R$ 5, no máximo 2 casas decimais e vencimento válido; parcelas abaixo de R$ 5 não são oferecidas; a forma de pagamento restrita no checkout é respeitada.
- Admin de pagamentos funcionando: clientes, cobranças e notas fiscais do Asaas, com auditoria. Links de checkout gerados com aleatoriedade criptográfica.
- A página de checkout não quebra mais ao abrir (tentava formatar CPF e telefone que o servidor esconde de propósito). `/payment-success` mostra "confirmando" até o pagamento ser confirmado.
- Novas variáveis no Convex: `ASAAS_API_KEY` (sandbox ou produção, detectado pela chave) e, opcional, `ASAAS_ENV`. O `setup` pede a chave, gera o `ASAAS_WEBHOOK_TOKEN` e mostra como cadastrar o webhook.
- **Removido:** a integração com o Stripe, que nunca funcionou (eram stubs sem uso na interface), o webhook `/webhooks/stripe` e a variável `STRIPE_WEBHOOK_SECRET`.

### Layouts no celular
- Swiss, Magazine, Brutalist e Bento corrigidos em telas de celular: grids que não empilhavam (conteúdo vazando para fora da tela), títulos gigantes cortados, nome quebrado no meio no cabeçalho do Magazine, margens excessivas, depoimentos e mosaicos espremidos, tabela do blog do Brutalist. Verificado em 390, 768 e 1280px nos 5 layouts.
- Novo `src/components/MobileLayoutStyles.tsx`: no celular, grids montados com estilo inline viram uma coluna; exceções por atributo (`data-m-cols="2"`, `data-m-keep`, `data-m-hide`, `data-m-scroll`, `data-m-bleed`).
- Cyberpunk: o topo das páginas não fica mais escondido atrás do cabeçalho fixo do celular.
- Swiss e Bento: post, estudo de caso e depoimentos ganham margem lateral (antes encostavam na borda).
- Datas dos posts formatadas no Bento e no Brutalist (apareciam como `2026-01-15T00:00:00.000Z`).
- Posts de exemplo (seed e dados de demonstração) em HTML, como o editor grava; antes apareciam com `#` e `**` crus. Slug do case de exemplo corrigido para `lumen-saude`.

### Segurança e limpeza
- Login: limite explícito de 5 senhas erradas por conta por hora.
- Umami: o script só entra no site quando `VITE_UMAMI_SCRIPT_URL` e `VITE_UMAMI_WEBSITE_ID` estão definidas (antes carregava uma URL com o placeholder literal); Umami Cloud liberado no CSP. `VITE_ANALYTICS_ENDPOINT`/`VITE_ANALYTICS_WEBSITE_ID` continuam aceitas.
- `.env.example` reescrito com as variáveis que o código realmente lê.
- Removidos restos de um setup antigo: `vite-plugin-manus-runtime`, `ManusDialog`, `Map.tsx` (Google Maps sem uso), aliases `@shared`/`@assets` e caminhos de monorepo nos scripts.

### Correções
- `npx create-rubrica <nome>` e `pnpm create rubrica <nome>` voltam a criar o projeto (antes só mostravam a lista de comandos).
- `config`, identidade: não zera mais SEO, RSS e imagem de compartilhamento, atualiza as meta tags do `index.html` e salva a identidade no `rubrica.json`.
- `config`, aparência: trocar paleta ou fonte não apaga mais as meta tags do `index.html`.
- `config`, layout: funciona em projetos criados pelo CLI (baixa os layouts da versão do projeto) e inclui o layout Magazine.
- Build na Vercel: o script `build:i18n`, chamado pelo `vercel.json`, tinha sumido do `package.json`. Removido o cron diário para `/api/cron-deploy`, rota que não existe.
- A release volta a incluir `scripts/` e `vercel.json`: sem eles, `pnpm build` falhava em projetos criados pelo CLI.
- Atalhos "Nova proposta" e "Novo projeto" do dashboard voltam a abrir o formulário de criação.
- Textos das páginas de login, depoimentos, home, blog e sobre voltam a vir das traduções (i18n) em vez de fixos no código.

### Qualidade
- CI no GitHub Actions: tipos, testes e build do template e do CLI em toda PR.
- Testes e typecheck do template e do CLI passando (eram 21 + 8 testes falhando e 9 + 4 erros de tipo).

## 0.3.18 — 2026-10-24
- Estrutura de portfólio focada em conversão em todos os layouts: métricas, cases em destaque, princípios de trabalho, seções do case (papel, antes, decisões, aprendizados), filtros por categoria, depoimentos por categoria, skills agrupadas, download do CV no topo do currículo e eventos Umami nos CTAs. Todos os campos novos são opcionais.

## 0.3.17 — 2026-10-23
- **Segurança:** `siteConfig:setBatch` passa a exigir papel `root` ou `admin`.
- Seeds não apagam mais textos e home personalizados.
- Publicar depois de editar textos ou configuração volta a funcionar.
- O nome do site e o contato informados no CLI passam a ser gravados no Convex.
- Nova skill `rubrica` para agentes de IA (Claude Code, Codex, OpenCode).
- Sistema de 4 cores em todos os layouts, inclusive paletas claras; guias de templates e de cores.

## 0.3.16 — 2026-08-08
- Sidebar não cobre mais parte do conteúdo no desktop.

## 0.3.15 — 2026-08-08
- Instalações sem o plugin i18n não mostram mais chaves (`home.title`) no lugar dos textos.

## 0.3.14 — 2026-08-08
- Home não quebra mais quando a lista de tecnologias vem num formato inesperado.

## 0.3.13 — 2026-08-08
- Sidebar sem `<a>` aninhado (erro de hydration).

## 0.3.12 — 2026-08-08
- `setup` volta a aplicar os seeds (o comando falhava em silêncio e as tabelas ficavam vazias).

## 0.3.11 — 2026-08-08
- Layout Magazine não repete mais o Masthead três vezes.

## 0.3.10 — 2026-08-08
- Import quebrado na Navbar do Brutalist; páginas e componentes que faltavam no template.

## 0.3.9 — 2026-08-08
- Import do Masthead corrigido no layout Magazine.

## 0.3.8 — 2026-05-25
- Conflito de variáveis CSS de tema corrigido.

## 0.3.7 — 2026-05-25
- ASCII art do nome e aplicação das cores `--bg`/`--text` vindas do Convex.

## 0.3.6 — 2026-05-25
- `vite.config` gerado não referencia mais `isDev`.

## 0.3.5 — 2026-05-25
- Correções no Brutalist (cores, navegação, identidade no CLI, ASCII art) e console limpo.

## 0.3.4 — 2026-05-25
- Contrato CSS de 4 cores (`--bg`, `--text`, `--primary`, `--accent`) e 2 fontes em todos os templates.

## 0.3.0 — 2026-05-24
- Páginas completas (Home, Currículo, Portfólio, Sobre, Blog) para Brutalist, Swiss, Magazine e Bento.

## 0.2.0 – 0.2.4 — 2026-05-22 a 2026-05-23
- Comando `setup`: chaves JWT, `SITE_URL`, variáveis por plugin, usuário root e seeds. Correções na gravação da `JWT_PRIVATE_KEY`.

## 0.1.0 — 2026-05-22
- Primeira release.
