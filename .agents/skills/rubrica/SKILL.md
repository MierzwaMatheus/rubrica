---
name: rubrica
description: >-
  Lê e altera o conteúdo de um site feito com o Rubrica direto pelo terminal,
  falando com o Convex do projeto com o login de um usuário do admin: textos
  fixos do site (botões, títulos, rótulos, em pt-BR e en-US), identidade, SEO,
  cores e fontes, perfil e redes, blocos da home (números de destaque,
  princípios de trabalho), cases dos projetos, posts do blog (criar em
  rascunho, editar, publicar), imagens, projetos, currículo, serviços, FAQ,
  depoimentos, pedidos de contato, propostas, modelos de contrato, plugins e a
  publicação do site. Use quando a pessoa quiser personalizar ou mudar algo do
  site/portfólio, trocar um texto ou uma cor, escrever ou publicar um post,
  ver contatos ou depoimentos novos, ou publicar o site. Para mudar layout,
  componentes ou código, trabalhe no código do repositório em vez desta skill.
---

# Rubrica: conteúdo do site pela CLI

Tudo passa por um script Python (só biblioteca padrão) que devolve JSON. Rode a partir da pasta do projeto:

```bash
RB="python3 .agents/skills/rubrica/scripts/rubrica.py"
```

O script acha sozinho o projeto (sobe até o `rubrica.config.ts`), o Convex (`VITE_CONVEX_URL` do `.env.local`) e o endereço do site.

**Dev ou produção.** O `.env.local` aponta para o Convex de **desenvolvimento** (o site do computador), e o site no ar usa o de **produção**. Mexer no de dev não muda o site publicado. Quando a pessoa pedir algo no site, pergunte se é no site publicado ou no do computador, se não estiver claro.

- **Site publicado:** acrescente `--producao` a cada comando (`$RB status --producao`, `$RB textos --producao`...), ou `export RUBRICA_AMBIENTE=producao` uma vez. O endereço vem do `rubrica.json`, gravado pelo `npx create-rubrica publicar`. Se o `status` disser que o projeto não tem esse endereço, peça para a pessoa rodar o `publicar` de novo (ele recupera o endereço) ou use a URL do Convex de produção direto: `export RUBRICA_CONVEX_URL="https://<deployment-de-producao>.convex.cloud"`.
- **Site do computador:** sem nada a mais. O `status` mostra em `producao` o endereço do site publicado, quando existe.

Códigos de saída: `3` = projeto/Convex não encontrado, `4` = sem login, `5` = sem permissão (repasse à pessoa), `2` = bloqueado pela skill, `7` = rede. Os erros saem em português no stderr: mostre-os, não contorne.

## Quem escreve e quem grava
Esta skill **executa**: lê, grava e publica. Escrever conteúdo novo e longo é trabalho das skills estrategistas, e todas começam pela voz da pessoa (`rubrica-voz`). Elas entrevistam a pessoa, pesquisam, escrevem em pt-BR e en-US, passam o texto pela `rubrica-pilar` e entregam um plano que esta skill aplica.

| Pedido | Skill |
|---|---|
| Tom de voz: entrevista de voz, colar a "Entrevista de voz", fazer o site soar como a pessoa, parte pessoal do Sobre (fora do trabalho, dia a dia, FAQ pessoal) | `rubrica-voz` |
| Escrever ou reescrever a apresentação, o "sobre mim", a frase da home, o posicionamento ou os princípios | `rubrica-apresentacao` |
| Criar ou reescrever o case de um projeto, transformar resultado técnico em case | `rubrica-case` |
| Montar ou reescrever o currículo, importar LinkedIn ou CV | `rubrica-curriculo` |
| Escrever um post do blog do zero | `rubrica-blog` |
| Revisar qualquer texto antes de ir ao site (sinais de IA, fatos, tradução) | `rubrica-pilar` |

Mudança pontual (trocar um botão, corrigir uma frase, ajustar uma cor, publicar um post pronto) continua aqui, direto. Na dúvida, pergunte se a pessoa quer só trocar o texto ou reescrever com calma.

## Aplicar um plano
As estrategistas entregam `.rubrica/planos/<pasta>/plano.json`. Formato e regras em `references/plano.md`.
1. `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar` valida o plano (estrutura, arquivos, chaves de texto, slug repetido, contraste, inglês faltando, funções que não existem ou proibidas) e mostra o antes → depois, sem gravar. Os `args` de uma mutation só são conferidos pelo Convex na hora de gravar.
2. Mostre a prévia à pessoa, resumida, e espere o "ok".
3. `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json` grava na ordem. Se algo falhar no meio, corrija e rode com `--retomar`.

O plano é aplicado do jeito que está. Se a pessoa quiser mudar algum texto, volte à skill que fez o plano, ou edite o `plano.json` e rode `--verificar` de novo.

## Antes de tudo
1. `$RB status`: mostra o projeto, **qual Convex** (e de onde veio), o `ambiente` (produção, desenvolvimento ou local), o site, a conta e o papel. Antes da primeira escrita, diga à pessoa em qual Convex e em qual ambiente você vai mexer. Se o `status` trouxer `aviso`, repasse: em dev o site no ar não muda; em produção toda escrita vale na hora. Cada Convex tem seu próprio login.
2. Sem login (código 4): a senha **nunca** passa pela conversa. Peça para a pessoa rodar num terminal dela, na pasta do projeto:
   ```
   python3 .agents/skills/rubrica/scripts/rubrica.py login --email <email-do-admin>
   ```
   Se o projeto já foi publicado, o login pergunta se ela quer entrar no site publicado ou no do computador. Para ir direto ao publicado, acrescente `--producao`. (No Claude Code ela pode digitar `! ` antes do comando, no próprio prompt.) Depois confira com `$RB status` (com `--producao`, se ela entrou no publicado). A sessão renova sozinha e fica em `~/.config/rubrica-skill/`, uma por Convex; nunca mostre esse arquivo. `logout` apaga.

## Regras de escrita
- **Leia antes de mudar** e mostre um plano curto (o que muda, antes → depois). Espere o "ok" da pessoa antes de gravar. Toda escrita devolve `antes`/`depois`: confirme com ela.
- **Duas línguas.** O site tem `/` em pt-BR e `/en/` em inglês, e **você** traduz: todo texto visível vai em pt-BR **e** en-US na mesma escrita. Tradução idiomática e profissional, não literal, no mesmo tom do original. Em HTML, traduza só o texto visível, sem mexer em tags, atributos, links ou código. Slug, tags, nomes próprios e de tecnologias ficam como estão. Só grave sem inglês (`--so-pt`) se a pessoa pedir.
- Não use `translation:translateBatch` nem `siteTexts:translateAllMissing`: são o tradutor pago do admin (OpenRouter).
- Ids são do Convex (`_id`): pegue de `listar`/`ler`, nunca invente.

## Textos fixos do site
São os textos de interface: títulos de seção, botões, menus, rótulos do formulário de contato, mensagens de erro, rodapé… Cada um tem uma chave (`home.hero.cta`, `navigation.blog`…) e as duas línguas.
- `$RB textos --paginas`: páginas e quantos textos (e quantos sem inglês) cada uma tem. Comece por aqui.
- `$RB textos --pagina home` · `--chave home.hero` · `--texto "fale comigo"` · `--sem-ingles`.
- Um texto: `$RB texto-editar <chave> --pt "..." --en "..."`.
- Vários (ex.: personalizar uma página inteira): escreva um JSON `[{"key": "...", "ptBR": "...", "enUS": "..."}]` num arquivo temporário e rode `$RB textos-editar --arquivo textos.json`. Ele valida tudo antes e não grava nada se uma chave não existir ou faltar inglês.
- Mantenha o tamanho parecido com o original: botões e menus têm pouco espaço.
- O site lê esses textos ao vivo: a mudança aparece sem publicar.

## Identidade, SEO, cores e fontes
- `$RB config`: todas as chaves, as cores salvas de cada modo e o contraste texto/fundo de cada um.
- `$RB config-definir --item site_title="..." --item seo_home_description="..."` ou `--arquivo config.json` (`{chave: valor}`). Só aceita as chaves públicas do projeto (`PUBLIC_KEYS` em `convex/siteConfig.ts`).
- **Cores:** o site tem um esquema de cores (escolhido no CLI) com modo claro e escuro. Pelo admin dá para trocar as 4 cores principais de cada modo, em hex: `theme_background`, `theme_foreground` (texto), `theme_primary` e `theme_accent` são as do **modo claro**; `theme_dark_background`, `theme_dark_foreground`, `theme_dark_primary` e `theme_dark_accent` são as do **escuro**. Valor vazio (`""`) volta para a cor do esquema. Mexer numa cor do escuro liga `theme_colors_per_mode` sozinho; sem essa marca (projetos antigos), as 4 `theme_*` valem nos dois modos. Mude as 4 de um modo juntas pensando no conjunto; o script recusa texto/fundo com contraste abaixo de 4.5:1 (WCAG AA) em qualquer modo. Veja `docs/templates/cores.md` para os esquemas. As cores valem na hora.
- Fontes: `theme_font_sans` e `theme_font_mono` (nomes do Google Fonts).
- Imagem de compartilhamento (redes sociais): `$RB og-imagem arquivo.png --alt "..."` (ideal 1200×630).
- Título, descrição, SEO e RSS entram no HTML no próximo `publicar-site`.

## Perfil e home
- `$RB perfil` / `$RB perfil-editar --json '{"location": "Lisboa", "linkedinUrl": "..."}'`. Mudou `role` (cargo), mande `roleTranslations: {"ptBR", "enUS"}` junto. Campos `show*` (ex.: `showPhone`) escondem ou mostram o dado no site.
- `$RB listar home` mostra os blocos da home. Para mudar: `$RB home-definir <chave> --valor '<json>'` (texto vai entre aspas: `--valor '"Olá, sou Ana"'`). Blocos com tradução usam `{"ptBR": "...", "enUS": "..."}`, como `about_text`. Leia o valor atual (`$RB ler home <chave>`) e mantenha o mesmo formato.

## Home, cases e currículo: o que aparece onde
As páginas são montadas para converter visitante em contato. Estes campos decidem o que aparece (em todos os layouts):
- **Números do topo** (home e começo do currículo): bloco `home_metrics`, até 4 itens `[{ "value": "8+", "label": "anos de experiência", "labelTranslations": {"ptBR": "...", "enUS": "..."} }]`. Use `$RB home-definir home_metrics --valor '<json>'` (a lista inteira é substituída). Prefira resultados ("1.200 agendamentos/mês") a quantidades ("300 commits"). Lista vazia esconde a faixa.
- **Princípios de trabalho** (seção "Como eu trabalho", que abre a página Sobre): bloco `work_principles`, `[{ "title", "description", "titleTranslations": {ptBR, enUS}, "descriptionTranslations": {ptBR, enUS} }]`, com `home-definir`.
- **Cases em destaque na home:** os 3 primeiros projetos (menor `orderIndex`) que têm `slug` **e** `caseStudy`. Para mudar o destaque, mude o `orderIndex` (`projects:update` ou `projects:reorder`).
- **Métrica do cartão:** a **primeira** de `caseStudy.metrics` aparece no cartão da home e do portfólio. Ponha primeiro um resultado.
- **Categoria do projeto** (`category` + `categoryTranslations: {ptBR, enUS}`): vira o filtro do Portfólio. Texto curto. Sem categorias, o filtro some.
- **Seções extras do case**, todas opcionais e só exibidas quando preenchidas, em `caseStudy` e em `caseStudyTranslations.ptBR/enUS`: `role` ("Meu papel"), `context` ("Antes", o estado inicial medido), `decisions` ("Decisões e trade-offs"), `learnings` ("Aprendizados"). Não invente fatos: o que a pessoa não contou fica vazio.
- No `projects:update`, `caseStudy` é substituído **inteiro** (problem, solution, results e metrics são obrigatórios): leia o projeto e mande o objeto completo. O mesmo vale para `caseStudyTranslations`.
- **Grupo da habilidade** (`resumeItems`, tipo `skill`): `content.group` ("Design", "Front-end"…) agrupa a stack no currículo; sem grupo, vai para "Stack". O nível (`level`) não aparece mais nas páginas. Tradução: `contentTranslations: { ptBR: {name, level, group}, enUS: {...} }`.
- **Categoria do depoimento** (`category`): agrupa a página de depoimentos.

## Blog
O corpo do post é **HTML**. Use só `h2 h3 p ul ol li strong em a code pre blockquote img`, sem `<html>`/`<body>`/estilos inline.
1. `$RB listar posts --texto "<tema>"` para não duplicar.
2. Mostre o plano: título, slug (kebab-case), subtítulo, tags, destaque. Espere o "ok".
3. Escreva o HTML pt-BR e o en-US em arquivos temporários e rode:
   `$RB post-criar --titulo "..." --en-titulo "..." --slug ... --arquivo corpo.html --en-arquivo corpo-en.html [--subtitulo --en-subtitulo] [--tags "a,b"] [--destaque] [--capa capa.png --capa-alt "..." | --imagem-id <id>] [--leitura "5 min"]`. Sempre nasce **rascunho**.
4. Editar: `$RB post-editar <id> [--titulo --en-titulo] [--arquivo --en-arquivo] [--tags] [--capa | --imagem-id]` (`--tags` substitui todas).
5. `post-publicar <id>` / `post-despublicar <id>` só quando a pessoa pedir.

## Imagens
- `$RB imagem-subir a.png [b.webp ...] [--nome] [--alt] [--tags] [--pasta <id>]` sobe para a biblioteca do admin e devolve `id`, `url` e um `<img>` pronto. Formatos png, jpg, webp, gif, svg, avif; até 10 MB.
- Capa de post: `--capa arquivo` ou `--imagem-id <id>`. Imagem no corpo: suba antes e use a `url` no HTML pt-BR e no en-US (alt traduzido).
- Sempre escreva o `alt`, descritivo e sem "imagem de".

## Propostas
- `$RB listar propostas [--status all|accepted|pending]` / `$RB ler propostas <slug-ou-id>`. Alterar: `proposals:create` e `proposals:update` (`$RB funcoes --modulo proposals` mostra os `args`).
- **Proposta aceita não muda** (o servidor recusa): para outra condição, crie uma proposta nova. Cada edição de uma pendente gera uma versão nova.
- Valores em reais, como número (`4000`, `1250.5`). **`investmentValue` é sempre o valor final**: é o que vai para o contrato e para as formas de pagamento.
- **Preço de cada item** (opcional): `scopePrices`, uma lista na mesma ordem e com o mesmo tamanho de `scope`, com `null` no item sem preço (`"scope": ["Site", "Logo"], "scopePrices": [4000, 1000]`). Mudou o `scope` (item novo, removido ou fora de ordem)? Mande o `scopePrices` realinhado na mesma chamada: o servidor recusa preços desalinhados. `[]` tira os preços.
- **Desconto** (opcional): `originalValue`, o valor antes do desconto, maior que `investmentValue`. Na proposta aparece o original riscado, o desconto em R$ e % e o valor final. Para tirar, mande `originalValue: null` (com `giftIndexes: []`, se houver brinde).
- **Brinde**: `giftIndexes`, as posições (a partir de 0) dos itens do `scope` que saem sem custo. Cada brinde precisa ter preço em `scopePrices` e de um `originalValue`, e a soma dos brindes não pode passar do desconto (`originalValue − investmentValue`). Na proposta, o item aparece com o badge "Brinde", o preço riscado e R$ 0,00.
- Não invente preço nem desconto: valores vêm da pessoa. Ao propor um desconto, mostre a conta (original, desconto, final) e espere o "ok".
- `proposals:resetPassword` fica fora (ver Limites).

## Contatos e o resto
- `$RB painel`: números, contatos novos e depoimentos pendentes. Bom ponto de partida para "o que tem de novo".
- `$RB listar <tipo>` / `$RB ler <tipo> <ref>`. Tipos: `posts projetos propostas contatos depoimentos envios curriculo servicos faq rotina checkouts imagens pastas home ia-resumos contratos usuarios`.
- Contato: `$RB contato <id> --status contacted|in_progress|closed|archived|read|new` e/ou `--nota "..."`. A nota **substitui** a anterior: leia antes e junte.
- Qualquer outra operação (projetos, currículo, serviços, FAQ, depoimentos, modelos de contrato…):
  1. `$RB funcoes` lista as funções do Convex com os papéis exigidos; `$RB funcoes --modulo <modulo>` mostra os `args`. Para regra de negócio, leia `convex/<modulo>.ts`.
  2. Leia o item atual, mostre o plano e espere o "ok".
  3. `$RB chamar mutation <modulo:funcao> --args '{...}'` (JSON grande: `--args-arquivo`).

## Plugins
`$RB plugins` mostra o que está ligado (blog, propostas, i18n, depoimentos…). `$RB plugin <id> ligar|desligar` só com pedido explícito: desligar esconde páginas e telas do admin.

## Publicar o site
O site é gerado no build da Vercel. Depois de mudanças de conteúdo:
1. `$RB publicar-site --verificar` mostra se há mudanças pendentes.
2. Só com pedido explícito: `$RB publicar-site` (dispara o deploy hook; no máximo uma vez por minuto). Avise que o site atualiza em alguns minutos. Precisa do `VERCEL_DEPLOY_HOOK_URL` configurado no Convex.

## Limites
- **Bloqueado** (código 2): `permanentDelete`, `requestErasure` (LGPD) e `bootstrapRootUser`. Use o painel admin.
- `remove` é exclusão reversível (vai para a lixeira; `--lixeira` mostra). `restore` exige papel root.
- Não mexa em usuários e papéis (`users:*`), checkouts, pagamentos (Asaas) nem `proposals:resetPassword` sem pedido explícito e confirmação: mexem com acesso e dinheiro.
- Esta skill é para **conteúdo**. Layout, componentes e estilos são código do repositório.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
