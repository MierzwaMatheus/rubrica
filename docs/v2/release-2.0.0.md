# Rubrica 2.0.0

> Texto pronto para a release `v2.0.0` do GitHub. Copie a partir da próxima linha.

---

# Rubrica 2.0.0

O Rubrica deixa de ser um template copiado para o seu projeto e vira um **núcleo em pacote**, com **14 temas** e **duas linhas de site**: pessoal (portfólio) e empresa (para agências e freelancers que mantêm sites de clientes). O site sai em HTML estático (Astro), com painel em React e backend no Convex. **Atualizar passa a ser subir a versão de um pacote**, sem mesclar arquivos.

## Comece

```bash
npx create-rubrica@latest meu-site --tipo pessoal --tema padrao   # ou --tipo empresa
```

Monte a aparência e copie o comando pronto no [combinador](https://userubrica.vercel.app/#combinador). Guia: [Começando](https://userubrica.vercel.app/docs/guia/comecando).

## Já tem um site na v1?

Não é uma atualização, é uma migração, e o comando faz quase tudo:

```bash
npx create-rubrica@latest migrar --relatorio    # só mostra o que aconteceria
npx convex export --path .rubrica/migracao/export-v1.zip
npx create-rubrica@latest migrar --export .rubrica/migracao/export-v1.zip
```

Ele cria a branch `rubrica-v2`, troca o código, converte os dados num arquivo de import e lista o que você personalizou, com a sugestão de cada item (tokens, bloco próprio ou componente ejetado). **Não grava em nenhum banco**: o import vai para um Convex de desenvolvimento novo, e a produção só com o seu "ok". Passo a passo, o que converte e o que não converte: [Migrar da v1](https://userubrica.vercel.app/docs/guia/migrar).

A v1 (branch `v1`) recebe correções de bug e de segurança por **6 meses**.

## Segurança: três falhas da v1 corrigidas

- **Proposta com senha vazava o conteúdo pela API.** Quem chamava a consulta pública recebia o texto da proposta sem digitar a senha. Agora, sem sessão válida, a API devolve só o estado "bloqueada".
- **O limite de senha errada não bloqueava.** A tentativa errada lançava erro e desfazia a própria contagem. Agora é registrada, e passado o limite a proposta responde `TOO_MANY_ATTEMPTS`.
- **Havia dois modelos de contrato padrão** (um no código e um no banco), e a proposta podia usar um diferente do que o painel mostrava. Agora o padrão é um só, o do banco.

A v1 não recebe correção para essas falhas: quem tem propostas com senha na v1 deve migrar para a v2.

## O que há de novo

- **Núcleo e temas em pacotes** (`@rubrica/core`, `@rubrica/theme-*`). Correção de SEO ou acessibilidade é feita uma vez e vale para todos os temas.
- **Site estático em Astro:** HTML pronto, SEO completo (sitemap, RSS, `hreflang`, dados estruturados) e quase nenhum JavaScript.
- **Páginas com blocos**, com prévia ao vivo no painel. 21 blocos de catálogo, entre eles vídeo (o player só entra depois do clique), incorporação (só de provedores permitidos), linha do tempo e comparativo de planos; crie páginas novas sem código. O catálogo é gerado do código, e há guias para [criar um bloco](https://userubrica.vercel.app/docs/guia/criar-bloco) e [criar um tema](https://userubrica.vercel.app/docs/guia/criar-tema).
- **Linha de empresa:** quem somos, serviços, preços e planos, equipe, cases e contato; dados da empresa que geram o dado estruturado para o Google. É para quem vende serviço e recebe pedidos de orçamento; **não é uma loja**. Veja [Site de empresa](https://userubrica.vercel.app/docs/guia/empresa).
- **Propostas e pagamento:** páginas públicas de proposta (senha, contrato, aceite com assinatura opcional e PDF), aceite, checkout (PIX, boleto ou cartão, pelo Asaas) e pagamento concluído, com as reescritas para Vercel, Netlify e Cloudflare Pages.
- **WhatsApp e faixa de aviso** nas configurações do site: botão flutuante opcional, links `whatsapp:` em qualquer botão e faixa com datas. O `migrar` traz o número da v1.
- **14 temas e 15 esquemas de cor**, em claro e escuro, com textura opcional (grão, papel ou scanlines), todos aprovados na mesma bateria de testes (axe, `h1`, `<head>`, JavaScript por página, Lighthouse). Dá para ejetar um componente ou criar um tema.
- **Vários idiomas**, com o principal à escolha; conteúdo sem tradução simplesmente não existe naquele idioma.
- **Papéis de agência e cliente** (`root`, `admin`, editores e o novo `comercial`). O `root` reinicia a senha de alguém pelo painel, sem e-mail (senha temporária mostrada uma vez, troca obrigatória) e pode suspender e reativar usuários.
- **Contatos e LGPD:** painel, Telegram, e-mail e webhook assinado; consentimento registrado; política de privacidade gerada; exportação e exclusão de dados.
- **MCP local** para o Claude Code e o Codex, com login de usuário do painel e **prévia antes de gravar**. Traz ferramentas de propostas, o catálogo real do projeto (inclusive blocos próprios), as variações do tema instalado, receitas de páginas e a orientação de uso de cada bloco.
- **Desenvolvimento:** o `pnpm dev` reflete o que você salva no painel sem reiniciar, os formulários funcionam fora da Vercel e no computador, e a prévia ao vivo do painel funciona no site publicado.
- **Hospedagem neutra:** Vercel oficial, e `vercel.json`, `_redirects` e `_headers` gerados da mesma configuração para Netlify e Cloudflare Pages.
- **CLI:** `create`, `setup`, `config`, `publicar`, `senha`, `update`, `ejetar`, `verificar`, `testar-tema`, `mcp`, `migrar`, `telemetria`.

## Quebras em relação à v1

- O projeto não é mais uma cópia do template; o `update` não mescla arquivos nem gera `.rubrica-new`.
- Personalizações no código não migram sozinhas: o `migrar` as lista.
- O app deixa de ser uma SPA em Vite; o painel fica em `/admin`.
- O plugin `playground` saiu; o plugin `i18n` virou `translation`; o script Python da skill `rubrica` saiu (use o MCP).
- Textos de seção viraram campos dos blocos.
- Precisa de Node 22.23.4 ou mais novo.

Detalhes no [CHANGELOG](https://github.com/MierzwaMatheus/rubrica/blob/main/CHANGELOG.md).

## Pacotes publicados

`@rubrica/core`, `@rubrica/mcp`, `@rubrica/theme-tester`, `create-rubrica` e os 14 temas: `@rubrica/theme-padrao`, `-cyberpunk`, `-brutalist`, `-swiss`, `-bento`, `-magazine`, `-desktop`, `-index`, `-monograph`, `-zine`, `-blueprint`, `-garden`, `-chat` e `-poster`.

## Pendências conhecidas

No painel: imagens no corpo dos textos, prévia ao vivo de posts e cases, tradução de um item inteiro de uma vez e abrir o PDF do currículo com IA. Para a 2.0.x: o `update` ainda não regenera `vercel.json` e `public/_headers`, as reescritas não foram testadas em hospedagem real e não há aviso de cookies antes de uma incorporação. A lista viva está em [`docs/v2/pendencias.md`](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/v2/pendencias.md).

---

# Rubrica 2.0.0 (English)

Rubrica stops being a template copied into your project and becomes a **core in a package** with **14 themes** and **two site lines**: personal (portfolio) and company (for agencies and freelancers who maintain client sites). The site ships as static HTML (Astro), with a React panel and a Convex backend. **Updating is now bumping a package version**, with no file merging.

- **Start:** `npx create-rubrica@latest my-site --tipo pessoal --tema padrao` (or `--tipo empresa`).
- **Coming from v1:** it is a migration, not an update. `npx create-rubrica@latest migrar` creates a `rubrica-v2` branch, swaps the code, converts the data into an import file and lists your customizations. It writes to no database: you import into a new development Convex, and production only with your explicit "ok". v1 keeps getting bug and security fixes for 6 months.
- **Security:** three v1 flaws are fixed: a password-protected proposal leaked its content through the API; the wrong-password limit never blocked; and there were two default contract templates. v1 does not get a fix for them: migrate to v2.
- **New:** pages made of blocks with a live preview, a company line (pricing, team, company data), 21 blocks (including video, embed, timeline and plan comparison), 14 themes and 15 color schemes with optional texture passing one test battery, several languages, agency and client roles (with password reset and suspension by the `root`), public proposal, acceptance, checkout and payment pages, a site-wide WhatsApp button and announcement bar, contacts and privacy tooling, a local MCP server for agents (including proposal tools and the project's real block catalog), and host-neutral output (Vercel official; Netlify and Cloudflare Pages files generated). The company line is for selling services, not a store.
- **Breaking:** no more template copy in the project, no SPA, no `playground` plugin, no Python skill script, Node 22.23.4+.

Full details: [CHANGELOG.en.md](https://github.com/MierzwaMatheus/rubrica/blob/main/CHANGELOG.en.md).
