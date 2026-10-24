# Referência técnica — Portfolio

> Este arquivo é a **referência técnica completa** do sistema: schema do banco, lista exaustiva de features, rotas, plugins, design system e integrações.
>
> Se você caiu aqui procurando como **publicar seu próprio portfólio**, volte para o [README.md](../README.md) na raiz do repositório — ele tem o passo-a-passo de deploy. Para trazer atualizações do template para um projeto existente, veja [atualizacao.md](./atualizacao.md).

Portfólio profissional open source desenvolvido com React, TypeScript e Convex. Uma plataforma completa para exibir projetos (com estudos de caso), blog, currículo, depoimentos e propostas comerciais, com painel administrativo integrado, geração de PDF, IA e tradução automática.

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Páginas e Rotas](#-páginas-e-rotas)
- [Sistema de Autenticação](#-sistema-de-autenticação)
- [Componentes Principais](#-componentes-principais)

## 🎯 Sobre o Projeto

Este é um portfólio profissional full-stack que combina uma interface pública com um painel administrativo. O projeto permite gerenciar projetos, posts de blog, currículo, depoimentos, propostas comerciais e o conteúdo e a aparência do site pelo admin, com IA para geração e reescrita de currículos e tradução automática de conteúdo. Projetos novos são criados e atualizados pela CLI `create-rubrica` (pasta `cli/`).

### Características Principais

- **5 layouts e 4 paletas**: `cyberpunk` (padrão), `brutalist`, `swiss`, `bento` e `magazine`, combináveis com qualquer paleta (claras ou escuras) — veja [templates](./templates/README.md) e [cores](./templates/cores.md)
- **Estrutura focada em conversão**: números de prova, cases em destaque, princípios de trabalho, seções de case study, categorias de projetos e depoimentos, grupos de habilidades
- **CMS Integrado**: gerenciamento completo de conteúdo, textos da interface e aparência
- **Multi-role**: autenticação com diferentes níveis de permissão
- **Sistema de plugins**: cada funcionalidade pode ser ligada ou desligada
- **SEO Friendly**: meta tags por página, RSS e sitemap
- **IA Integrada**: tradução automática, geração de currículo com ATS scoring e reescrita via OpenRouter
- **Auditoria Completa**: log de todas as mutações administrativas
- **Notificações Telegram**: alertas para o admin via bot Telegram
- **Testes automatizados**: suíte Vitest do template e da CLI, rodando no CI (GitHub Actions)

## 🛠 Tecnologias

### Frontend

- **React 19.2** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.6** - Superset do JavaScript com tipagem estática
- **Vite 7.1** - Build tool e dev server
- **Wouter 3.3** - Roteamento leve para React
- **Framer Motion 12.23** - Biblioteca de animações

### Estilização

- **Tailwind CSS 4.1** - Framework CSS utility-first
- **Radix UI / shadcn/ui** - Componentes acessíveis
- **Lucide React** - Ícones
- **Contrato de 4 cores** (`--bg`, `--text`, `--primary`, `--accent`) — veja [Design System](#-design-system)

### Backend e Banco de Dados

- **Convex** - Backend as a Service reativo
  - Convex Auth (email e senha)
  - Banco de dados de documentos em tempo real
  - Storage para imagens, vídeos e assinaturas
  - Actions, HTTP endpoints e cron jobs
  - Queries e mutations tipadas

### Inteligência Artificial

- **OpenRouter** - Gateway para múltiplos modelos de IA
  - **Tradução automática** de conteúdo administrativo (pt-BR → en-US)
  - **Geração de currículo (pipeline 3 etapas)**:
    - Gemini: análise da descrição da vaga
    - GPT-5.4: scoring de fit (ATS score) com forças e fraquezas
    - Claude Sonnet: reescrita do CV para compatibilidade ATS
  - **Proxy de IA do playground** (com rate limiting)

### Pagamentos

- **Asaas** (API v3) - PIX, boleto e cartão em até 12x (`convex/asaas.ts`, `convex/lib/asaasClient.ts`). O cartão é digitado na página segura do Asaas; o site nunca recebe os dados do cartão.

### Formulários e Validação

- **React Hook Form 7.64** - Gerenciamento de formulários
- **Zod 4.1** - Validação de schemas
- **@hookform/resolvers** - Resolvers para React Hook Form

### Editor de Texto Rico

- **TipTap 3.13** - Editor de texto rico extensível

### Utilitários

- **Recharts** - Gráficos e visualizações
- **Sonner** - Notificações toast
- **nanoid** - Geração de IDs únicos
- **@dnd-kit** - Drag and drop para ordenação de itens
- **jsPDF** - Geração de PDFs no cliente (CV ATS, contratos)
- **react-markdown** - Renderização de markdown
- **react-helmet-async** - Meta tags por página
- **signature_pad** - Captura de assinatura manuscrita via canvas
- **date-fns** - Manipulação de datas

### Analytics

- **Vercel Analytics** e **Vercel Speed Insights**
- **Umami** (opcional) - eventos customizados via `src/lib/analytics.ts` e atributos `data-umami-event`; o script só entra no build com `VITE_UMAMI_SCRIPT_URL` e `VITE_UMAMI_WEBSITE_ID` (Umami Cloud já liberado no CSP)

### Testes

- **Vitest** - Testes do template (`tests/app`, `tests/convex`) e da CLI (`cli/src/__tests__`)
- **Stryker** - Testes de mutação
- **GitHub Actions** - `.github/workflows/ci.yml` roda typecheck e testes do template e typecheck, testes e build da CLI

## ✨ Funcionalidades

### Área Pública

#### 🏠 Página Inicial (`/`)
- Hero (título, subtítulo e tags editáveis) com números de prova e chamadas para ação
- Cases em destaque
- Sobre mim com números em destaque
- Grid de serviços
- Depoimentos marcados para a home
- Fechamento com dois caminhos: "tenho um projeto" e "tenho uma vaga"

#### 👤 Sobre (`/sobre`)
- Resumo profissional (mesmo texto do "Sobre mim" da home)
- Princípios de trabalho
- Rotina diária em grid bento e FAQ

#### 💼 Portfólio (`/portfolio`)
- Grid de projetos com filtros por categoria
- Modal detalhado com carrossel de imagens e visualizador em tela cheia
- Links para demo e código-fonte
- **Estudo de caso** por projeto (`/portfolio/:slug`): meu papel, contexto, decisões, resultados, métricas, aprendizados, screenshots, depoimento, CTA e próximo case

#### 📄 Currículo (`/curriculo`)
- Exibição estruturada de:
  - Experiências profissionais
  - Formação acadêmica
  - Cursos e certificações
  - Habilidades técnicas (agrupadas por grupo)
  - Soft skills
  - Idiomas
  - Voluntariado
- Ordenação configurável via admin
- Download do CV em PDF otimizado para ATS

#### 📝 Blog (`/blog`)
- Lista de posts publicados
- Posts em destaque
- Busca e filtros por tags
- Visualização individual de posts (`/blog/:slug`)
- RSS e sitemap gerados no build

#### ⭐ Depoimentos (`/depoimentos`)
- Depoimentos agrupados por categoria
- Wizard público de envio (texto ou vídeo), quando o sub-plugin `testimonials-intake` está ativo

#### 💼 Propostas (`/proposta/:id`)
- Visualização de propostas comerciais
- Sistema de validação de expiração (10 dias)
- **Sistema de proteção por senha** (opcional)
- **Aceite eletrônico de propostas** (`/proposta/:slug/aceitar`)
- **Captura de assinatura manuscrita** via canvas (mouse ou touch)
- **Armazenamento de assinatura** no Convex Storage
- **Geração de PDF do contrato** a partir do modelo de contrato, com a assinatura
- Status visual (aprovada, pendente, expirada)
- **Banner de aceite** quando proposta foi aceita
- **Política de rescisão** expansível com renderização markdown
- **Sistema de sessões** para acesso seguro

#### 💳 Checkout (`/checkout/:uniqueLink`)
- **PIX**: QR code e copia-e-cola gerados pelo Asaas, com a validade informada por ele
- **Boleto**: linha digitável e PDF
- **Cartão**: escolha das parcelas (valor calculado no servidor) e redirecionamento para a página de pagamento do Asaas
- Trocar de forma de pagamento cancela a cobrança anterior (no cartão parcelado, todas as parcelas); escolher a mesma de novo reaproveita a existente. Boleto já gerado não pode ser trocado, porque pode estar compensando
- Proteções: trava contra dois cliques simultâneos, no máximo 8 cobranças por link, parcela mínima de R$ 5, QR code PIX vencido regenerável
- Erros chegam ao cliente com a mensagem certa (`ConvexError` com código)
- A página é reativa: vai sozinha para o sucesso quando o webhook confirma. `/payment-success/:uniqueLink` mostra "confirmando" até lá

#### 💻 Terminal
- Interface estilo terminal aberta com a tecla <code>`</code> (crase) nas páginas públicas
- Navegação pelo portfólio via comandos

### Área Administrativa

#### 🔐 Autenticação
- Login com email e senha (Convex Auth); cadastro público desabilitado
- Sistema de roles e permissões:
  - `root` - Acesso completo
  - `admin` - Acesso administrativo geral
  - `content-editor` - Conteúdo (projetos, blog, currículo, home, sobre, textos, depoimentos)
  - `blog-editor` - Apenas blog
  - `proposal-editor` - Apenas propostas
- Proteção de rotas baseada em roles

#### 📊 Dashboard (`/admin/dashboard`)
- Estatísticas (projetos, posts publicados/rascunhos, propostas totais/aceitas/pendentes, checkouts pagos/pendentes)
- Atalhos rápidos e paleta de comandos
- Status de publicação e botão "Publicar" (dispara o deploy na Vercel)

#### 📁 Gerenciamento de Projetos (`/admin/projects`)
- CRUD completo de projetos
- Imagens da biblioteca de mídia (referenciadas por ID no Convex Storage)
- Tags, categoria e slug
- Campos de estudo de caso e métricas
- Ordenação via drag and drop
- **Tradução automática** via OpenRouter (apenas campos alterados)

#### ✍️ Gerenciamento de Blog (`/admin/blog`)
- CRUD de posts com editor TipTap
- Tags, destaque, status (rascunho/publicado), slug automático, imagem de capa
- **Tradução automática** via OpenRouter

#### 👤 Gerenciamento de Currículo (`/admin/resume`)
- CRUD por tipo: experiência, educação, cursos, habilidades (com grupo), soft skills, idiomas, voluntariado
- Ordenação customizável
- **Tradução automática** via OpenRouter

#### 🏡 Home e Sobre (`/admin/home`, `/admin/about`)
- Hero, texto "Sobre mim", editor de números de prova, serviços
- Princípios de trabalho, rotina diária e FAQ
- **Tradução automática** via OpenRouter

#### ⭐ Depoimentos (`/admin/depoimentos`)
- CRUD, categorias e opção "mostrar na home"
- Fila de submissões enviadas pelo wizard (aprovar, rejeitar, publicar)

#### 📋 Gerenciamento de Propostas (`/admin/proposals`)
- CRUD de propostas comerciais
- **Sistema de abas**: Todas / Aceitas
- **Proteção de propostas aceitas**: não podem ser editadas ou excluídas
- **Download de contrato** para propostas aceitas (regenera PDF com assinatura)
- **Senha opcional** com geração aleatória (8 caracteres A-Z, a-z, 0-9) e botão de copiar
- **Política de rescisão** editável com valor padrão
- **Versionamento automático**: cria versão ao editar proposta não aceita

#### 📜 Modelos de Contrato (`/admin/contracts`)
- Modelos de contrato usados nas propostas, com um modelo padrão

#### 🤖 Currículos com IA (`/admin/ai-resumes`)
- **Pipeline de 3 modelos via OpenRouter**:
  1. Gemini analisa a descrição da vaga
  2. GPT-5.4 pontua o fit do CV (ATS score) com forças e fraquezas
  3. Claude Sonnet reescreve o CV para compatibilidade ATS
- Input de descrição de vaga e seleção de locale
- Exibição do ATS score e breakdown de forças e fraquezas
- Export do CV reescrito em PDF (via `cvPDF`)
- Regras rígidas: sem pronomes pessoais, sem travessões, sem jargões de IA

#### 📄 Gerador de CV PDF
- CV em PDF otimizado para ATS, com resumo profissional como primeira seção
- Cargo antes da empresa nas entradas de experiência/educação
- Tipografia ATS: margens 25mm, headings maiúsculos, texto 10.5pt

#### 📧 Contato (`/admin/contact`, `/admin/contatos`)
- Informações de contato, redes sociais e visibilidade de cada dado
- Solicitações recebidas pelo wizard de contato (status e notas internas)

#### 🎨 Site e Aparência (`/admin/site-config`) e Textos (`/admin/textos`)
- As 4 cores do tema e as fontes
- Textos da interface em pt-BR e en-US (tabela `siteTexts`)

#### 💳 Pagamentos (`/admin/payment-links`)
- Clientes do Asaas (listar, criar, excluir), cobranças (listar, criar, cancelar) e notas fiscais (só leitura; emitidas e configuradas no Asaas)
- Criação do link de checkout a partir de um cliente, com link aleatório criptograficamente seguro
- Exige o plugin `payments` e papel root/admin; as escritas vão para o log de auditoria

#### 🧩 Plugins (`/admin/plugins`)
- Liga e desliga funcionalidades (veja [Sistema de Plugins](#-sistema-de-plugins))

#### 👥 Usuários (`/admin/users/new`)
- Criação de novos usuários (apenas root)
- Atribuição de roles

#### 📝 Logs de Auditoria (`/admin/logs`)
- Log completo de todas as mutações administrativas
- Abas de sistema, playground e itens excluídos (com restauração)
- Rastreabilidade por usuário, data e operação

### Componentes Administrativos

- **ProjectDialog**: Modal para criar/editar projetos
- **ProposalDialog**: Modal para criar/editar propostas
- **ResumeExperienceDialog**: Modal para experiências do currículo
- **ImagePicker**: Seletor de imagens com pastas e upload para o Convex Storage (por ID)
- **RichTextEditor**: Editor de texto rico baseado em TipTap
- **ProjectTagsInput**: Input para gerenciamento de tags
- **HomeMetricsEditor** / **WorkPrinciplesEditor**: números de prova e princípios de trabalho
- **TemplateEditor**: editor de modelos de contrato
- **PublishStatus**: status de publicação e botão "Publicar"
- **CommandPalette**: paleta de comandos do admin

## 📁 Estrutura do Projeto

```
rubrica/
├── cli/                   # CLI create-rubrica (create, config, setup, update)
├── convex/
│   ├── schema.ts          # Schema do banco de dados Convex
│   ├── auth.ts            # Convex Auth + helpers de role
│   ├── http.ts            # Endpoints HTTP e webhooks
│   ├── crons.ts           # Tarefas agendadas
│   ├── pluginRegistry.ts  # Definição dos plugins
│   ├── lib/               # Validadores compartilhados (case study…)
│   └── ...                # Queries, mutations e actions por domínio
├── docs/                  # Documentação (templates, cores, atualização)
├── public/
│   ├── data/              # JSON estático (exemplo no repo, real no build)
│   └── samples/           # Imagens de exemplo
├── scripts/               # Build: i18n, dados estáticos, RSS, sitemap
├── src/
│   ├── components/        # Componentes (admin/, ui/, playground/, Layout, Sidebar…)
│   ├── constants/         # Política de rescisão padrão, prompts
│   ├── contexts/          # Auth, Theme, Plugins, wizards
│   ├── hooks/
│   ├── i18n/              # Provider, repositórios e traduções (pt-BR, en-US)
│   ├── lib/               # analytics, utils, contraste de cores
│   ├── pages/             # Páginas públicas, admin/ e playground/
│   ├── repositories/ services/ usecases/
│   ├── utils/             # contractPDF, cvPDF, conteúdo das páginas…
│   ├── App.tsx            # Componente raiz e rotas
│   └── index.css          # Tema (contrato de 4 cores)
├── templates/             # Layouts e temas que a CLI aplica
├── tests/                 # Testes Vitest (app e convex)
├── rubrica.config.ts      # Identidade, SEO, RSS e fontes
├── vercel.json            # Build, rewrites e headers de segurança
└── package.json
```

## 🚀 Instalação

O caminho recomendado é criar o projeto pela CLI (`npx create-rubrica <nome>`) e seguir o [README.md](../README.md). Para rodar o repositório diretamente:

### Pré-requisitos

- Node.js 20+ e npm/pnpm
- Conta no Convex
- Conta no OpenRouter (opcional, para IA)

### Passos

1. Clone o repositório e instale as dependências:
```bash
git clone <repository-url>
cd rubrica
pnpm install
```

2. Configure o `.env` (veja `.env.example`):
```env
VITE_CONVEX_URL=sua_url_do_convex
CONVEX_URL=sua_url_do_convex
CONVEX_DEPLOY_KEY=sua_deploy_key
SITE_URL=https://seusite.com
```

3. Configure as variáveis no Convex (`npx convex env set CHAVE valor`) — veja [Configuração](#️-configuração).

4. Rode o ambiente de desenvolvimento (Vite + Convex):
```bash
pnpm dev
```

## ⚙️ Configuração

### Convex

1. **Schema** (`convex/schema.ts`) com as collections:
   - `users` e tabelas do Convex Auth
   - `userRoles` - Roles dos usuários (root, admin, content-editor, blog-editor, proposal-editor) e flag de troca de senha
   - `projects` - Projetos do portfólio (com `caseStudy`, `category`, `slug`)
   - `posts` - Posts do blog
   - `resumeItems` - Itens do currículo (por tipo; habilidades com `group`)
   - `services` - Serviços da página inicial
   - `testimonials` - Depoimentos publicados (com `category` e `showOnHome`)
   - `testimonialSubmissions` - Depoimentos enviados via wizard (pendentes de aprovação)
   - `homeContent` - Conteúdo chave-valor (hero, sobre, `home_metrics`, `work_principles`, estado dos plugins)
   - `aboutDailyRoutine` - Itens da rotina diária (seção Sobre)
   - `aboutFaq` - FAQ da seção Sobre
   - `contactInfo` - Informações de contato e redes sociais
   - `contactRequests` - Solicitações de contato recebidas via wizard
   - `imageFolders` - Pastas da biblioteca de mídia
   - `imageMetadata` - Metadados das imagens do Convex Storage
   - `proposals` - Propostas comerciais
   - `proposalVersions` - Versões históricas das propostas
   - `proposalSessions` - Sessões temporárias de acesso via senha
   - `proposalAcceptances` - Registros de aceites eletrônicos (com `signatureStorageId`)
   - `contractTemplates` - Modelos de contrato
   - `checkouts` - Sessões de checkout (experimental)
   - `aiGeneratedResumes` - CVs gerados por IA
   - `siteConfig` - Cores do tema, fontes e demais configurações do site
   - `siteTexts` - Textos da interface em pt-BR e en-US
   - `deployStatus` - Alterações pendentes de publicação
   - `auditLog` - Log de auditoria administrativa
   - `playgroundAuditLog` - Eventos de uso do playground (expiram em 24h)
   - `rateLimitAttempts` - Controle de rate limiting

2. **Convex Storage** para imagens, vídeos de depoimentos e assinaturas

3. **Autenticação** via Convex Auth (provider Password). O primeiro usuário root é criado com `BOOTSTRAP_ALLOWED=true` no Convex — remova a variável depois. A CLI (`rubrica setup`) faz isso por você.

### Variáveis de ambiente do Convex

| Variável | Uso |
|---|---|
| `BOOTSTRAP_ALLOWED` | Libera a criação do primeiro root (só no setup inicial) |
| `SITE_URL` | URL pública do site |
| `OPENROUTER_API_KEY` | Tradução e currículos com IA |
| `PLAYGROUND_KEY_PEPPER` | Fingerprint de API keys no playground |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_ADMIN_CHAT_ID` | Notificações (opcional) |
| `VERCEL_DEPLOY_HOOK_URL` | Botão "Publicar" do admin |
| `VERCEL_WEBHOOK_SECRET` | Webhook `/webhooks/vercel-deploy` |
| `ASAAS_API_KEY` | Chave da API do Asaas (`$aact_hmlg_` sandbox, `$aact_prod_` produção) |
| `ASAAS_WEBHOOK_TOKEN` | Token do webhook `/webhooks/asaas` (o mesmo cadastrado no Asaas) |
| `ASAAS_ENV` | Opcional: força `production` ou `sandbox` |

### OpenRouter (IA)

1. Crie uma conta em [openrouter.ai](https://openrouter.ai) e gere a chave de API
2. Configure no Convex: `OPENROUTER_API_KEY=sua_chave`

#### Modelos utilizados

| Funcionalidade | Modelo |
|---|---|
| Tradução de conteúdo | Lista de modelos com fallback em `convex/translation.ts` |
| Análise de vaga (CV IA) | Gemini |
| ATS Scoring | GPT-5.4 |
| Reescrita ATS do CV | Claude Sonnet |

### Telegram (Notificações)

O sistema envia notificações automáticas via bot Telegram para o admin nos seguintes eventos:

| Evento | Gatilho |
|--------|---------|
| ✅ Proposta aceita | Cliente aceita eletronicamente uma proposta (`proposals`) |
| 💰 Pagamento confirmado | Webhook do Asaas (`PAYMENT_CONFIRMED` / `PAYMENT_RECEIVED`) → `checkouts:markPaidByLink` |
| 📨 Nova solicitação de contato | Envio do wizard de contato |
| ⭐ Novo depoimento | Envio do wizard de depoimentos |

Proposta aceita e pagamento confirmado usam a `internalAction` `convex/telegram.ts`, agendada via `ctx.scheduler.runAfter` (fire-and-forget); contato e depoimento chamam a API do Telegram nos próprios módulos. Uma falha na entrega não afeta o fluxo principal.

#### Configuração

1. **Criar o bot**: fale com [@BotFather](https://t.me/BotFather) e use `/newbot` para obter o `TELEGRAM_BOT_TOKEN`
2. **Obter o chat ID**: envie uma mensagem para o bot e acesse `https://api.telegram.org/bot<TOKEN>/getUpdates` — o campo `message.chat.id` é o `TELEGRAM_ADMIN_CHAT_ID`
3. **Ativar o bot**: envie `/start` para o bot antes do primeiro uso
4. **Configurar no Convex**: `TELEGRAM_BOT_TOKEN` e `TELEGRAM_ADMIN_CHAT_ID`

> As variáveis são opcionais: se não configuradas, as notificações são silenciosamente ignoradas.

### Pagamentos (Asaas)

1. **Chave**: no Asaas (comece pelo [sandbox](https://sandbox.asaas.com)), **Integrações → Chave de API**. Grave como `ASAAS_API_KEY`; o ambiente sai do prefixo da chave.
2. **Webhook**: em **Integrações → Webhooks**, URL `https://<deployment>.convex.site/webhooks/asaas`, eventos de cobrança ligados e um token, gravado como `ASAAS_WEBHOOK_TOKEN`. O `create-rubrica setup` gera o token e mostra a URL.
3. **Fluxo**: o checkout cria cliente e cobrança no Asaas; o status vira `payment_selected` (aguardando). Só o webhook marca como `paid`, e aí chega a notificação no Telegram (com aviso se a cobrança paga não for a atual, se o link estava apagado/vencido ou se o valor veio menor). Estorno e chargeback marcam como `refunded`.
4. **Vencimento do link**: checkouts vencidos expiram de hora em hora e a cobrança de PIX/cartão é cancelada no Asaas. A de boleto fica, porque pode ter sido paga e ainda estar compensando.

### Vercel (Deploy)

O `vercel.json` configura:
- Rewrites para SPA
- Headers de segurança e Content-Security-Policy
- Build command:

```json
"buildCommand": "npm run build:i18n && npm run build"
```

`build:i18n` regera as traduções da interface a partir do Convex; `build` roda `npx convex deploy`, busca os dados estáticos, gera RSS e sitemap e faz o `vite build`. O site público só muda com um novo deploy, disparado pelo botão "Publicar" do admin (deploy hook da Vercel) — não há rebuild agendado.

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev             # Vite (porta 3000) + Convex dev

# Build
pnpm build:i18n      # Regera src/i18n/translations a partir do Convex
pnpm build           # convex deploy + dados estáticos + RSS + sitemap + vite build

# Preview
pnpm preview         # Preview do build de produção

# Verificação
pnpm check           # Verifica tipos TypeScript
pnpm test            # Roda a suíte Vitest
pnpm mutation:diff   # Testes de mutação (Stryker)

# Formatação
pnpm format          # Formata código com Prettier
```

## 🗺 Páginas e Rotas

### Rotas Públicas

- `/` - Página inicial
- `/sobre` - Sobre
- `/portfolio` - Portfólio de projetos
- `/portfolio/:slug` - Estudo de caso
- `/curriculo` - Currículo
- `/blog` - Lista de posts
- `/blog/:slug` - Post individual
- `/depoimentos` - Depoimentos
- `/proposta/:id` - Visualização de proposta
- `/proposta/:slug/aceitar` - Aceite eletrônico da proposta
- `/checkout/:uniqueLink` e `/payment-success/:uniqueLink` - Checkout (experimental)
- `/playground` e sub-rotas - Área de demonstração
- `/login` - Página de login

### Rotas Administrativas

Todas as rotas administrativas são protegidas e requerem autenticação:

- `/admin` ou `/admin/dashboard` - Dashboard (root, admin, content-editor, blog-editor)
- `/admin/projects` - Projetos (root, admin, content-editor)
- `/admin/blog` - Blog (root, admin, content-editor, blog-editor)
- `/admin/resume` - Currículo (root, admin, content-editor)
- `/admin/home` - Home (root, admin, content-editor)
- `/admin/about` - Sobre (root, admin, content-editor)
- `/admin/textos` - Textos da interface (root, admin, content-editor)
- `/admin/depoimentos` - Depoimentos (root, admin, content-editor)
- `/admin/contact` - Informações de contato (root, admin)
- `/admin/contatos` - Solicitações de contato (root, admin)
- `/admin/proposals` - Propostas (root, admin, proposal-editor)
- `/admin/contracts` - Modelos de contrato (root, admin)
- `/admin/payment-links` - Pagamentos, experimental (root, admin)
- `/admin/ai-resumes` - Currículos com IA (root, admin)
- `/admin/plugins` - Plugins (root, admin)
- `/admin/site-config` - Site e aparência (root, admin)
- `/admin/logs` - Logs de auditoria (root)
- `/admin/lgpd` - Gestão de titulares LGPD — exportação e anonimização (root)
- `/admin/users/new` - Criar usuário (root)

## 🔒 Sistema de Autenticação

O sistema utiliza Convex Auth (provider Password, sem cadastro público) com um sistema customizado de roles.

### Roles Disponíveis

- **root**: acesso total ao sistema
- **admin**: acesso administrativo geral (exceto usuários, logs e LGPD)
- **content-editor**: conteúdo do site
- **blog-editor**: apenas blog
- **proposal-editor**: apenas propostas

### Permissões

As roles ficam na collection `userRoles`. No backend, cada função administrativa verifica a role (`requireRole`); no frontend, `ProtectedRoute` recebe `allowedRoles` e o `AuthContext` expõe o estado de autenticação.

## 🎨 Componentes Principais

### Layout Components

- **Layout**: layout principal das páginas públicas (substituído pelo layout escolhido na CLI)
- **AdminLayout**: layout com sidebar administrativa
- **Sidebar**: sidebar pública com navegação, contato, download do CV e seletor de idioma
- **PageSkeleton**: skeleton loader para estados de carregamento

### Feature Components

- **ProtectedRoute** / **PluginRoute**: rota protegida por role / por plugin
- **ErrorBoundary**: tratamento de erros React
- **ContactWizard** / **TestimonialWizard**: wizards públicos
- **ThemeApplier**: aplica as cores e fontes salvas no admin
- **Terminal**: interface estilo terminal
- **SEO**: meta tags por página

## 🎨 Design System

### Cores: contrato de 4 cores

Todo tema é definido por 4 variáveis em `src/index.css` (ou pelo admin em **Site e Aparência**):

- **`--bg`**: fundo
- **`--text`**: texto
- **`--primary`**: cor primária (identidade)
- **`--accent`**: cor de destaque

Superfícies, bordas e textos secundários são derivados dessas 4 cores, então paletas claras e escuras funcionam igualmente. A CLI oferece 4 paletas — Editorial Cream e Paper Noir (claras), Midnight Blue e Solar Warm (escuras); o padrão do repositório é o visual neon original (roxo e verde-limão). Detalhes em [cores.md](./templates/cores.md).

### Layouts

`cyberpunk` (padrão), `brutalist`, `swiss`, `bento` e `magazine`, em `templates/layouts/`, aplicados pela CLI (`rubrica create` / `rubrica config`). Veja o [guia dos templates](./templates/README.md).

### Tipografia

- Fontes sans e mono configuráveis (`rubrica.config.ts`, CLI ou admin); padrão Inter e JetBrains Mono

### Animações

- Transições com Framer Motion
- Hover effects nos elementos interativos

## 📝 Notas de Desenvolvimento

- TypeScript em modo strict
- Path alias `@/` para `src/`
- Imagens armazenadas por ID no Convex Storage (não por URL)
- Templates de layout só podem usar as 4 cores do contrato — verificado por `tests/app/colorContract.test.ts`

## 🧩 Sistema de Plugins

O projeto possui um sistema de plugins que permite ativar ou desativar funcionalidades independentemente, sem afetar o restante do sistema. Ideal para quem faz fork do projeto e não precisa de tudo.

### Como funciona

Cada plugin controla:
- **Backend**: funções Convex retornam vazio (queries) ou lançam erro (mutations) quando desativado — mesmo acesso direto via SDK é bloqueado
- **Frontend público**: links somem da sidebar automaticamente, rotas retornam 404
- **Frontend admin**: itens da sidebar admin desaparecem, rotas retornam 404

O estado dos plugins é armazenado na tabela `homeContent` com chaves `plugin:<id>:enabled`. Em produção, o estado é buscado uma única vez via `fetch('/data/plugins.json')` (gerado no build) e cacheado pelo browser — sem requests em tempo real ao Convex.

### Plugins disponíveis

| Plugin | Rotas admin | Rotas públicas | minRole | Sub-plugin de |
|--------|-------------|----------------|---------|---------------|
| `contact-wizard` | `/admin/contatos` | — | admin | — |
| `proposals` | `/admin/proposals` | `/proposta/:id`, `/proposta/:slug/aceitar` | admin | — |
| `contract-templates` | `/admin/contracts` | — | admin | — |
| `payments` (experimental) | `/admin/payment-links` | `/checkout/:link`, `/payment-success/:link` | admin | — |
| `blog` | `/admin/blog` | `/blog`, `/blog/:slug` | admin | — |
| `portfolio` | `/admin/projects` | `/portfolio`, `/portfolio/:slug` | admin | — |
| `resume` | `/admin/resume` | `/curriculo` | admin | — |
| `about` | `/admin/about` | `/sobre` | admin | — |
| `ai-resumes` | `/admin/ai-resumes` | — | root | — |
| `audit-log` | `/admin/logs` | — | root | — |
| `media-manager` | — | — | root | — |
| `i18n` | — | — | root | — |
| `playground` | — | `/playground` | root | — |
| `testimonials` | `/admin/depoimentos` | `/depoimentos` | admin | — |
| `testimonials-intake` | — | — | admin | `testimonials` |

### Sub-plugins

Alguns plugins têm funcionalidades opcionais que podem ser controladas de forma independente. Esses são chamados de **sub-plugins** — eles ficam aninhados abaixo do plugin pai na interface de gerenciamento e só fazem sentido quando o pai está ativo.

O sub-plugin `testimonials-intake` é o exemplo atual: controla exclusivamente o **formulário público de envio de depoimentos** (wizard de submissão, upload de vídeo, fila de moderação). Ele pode ser desativado enquanto o plugin `testimonials` permanece ativo, o que mantém a exibição pública de depoimentos mas remove o canal de envio por visitantes.

Para criar um sub-plugin, basta adicionar `parentId: 'id-do-pai'` na definição do plugin em `convex/pluginRegistry.ts`.

### Gerenciamento

Acesse `/admin/plugins` (ou `rubrica config` → Plugins) para ativar ou desativar plugins. A mudança só entra em vigor para visitantes públicos após um novo deploy (que regenera `plugins.json`). No admin, a mudança é imediata.

### Adicionando um novo plugin

1. Adicionar entrada em `convex/pluginRegistry.ts`
2. Adicionar `await requirePlugin(ctx, 'meu-plugin')` nas mutations e `if (!(await isPluginEnabled(ctx, 'meu-plugin'))) return []` nas queries públicas
3. Adicionar `pluginId: 'meu-plugin'` no navItem do `Dashboard.tsx`
4. Envolver a rota em `<PluginRoute pluginId="meu-plugin">` no `App.tsx`

---

## 🆕 Funcionalidades em Detalhe

### Portfólio focado em conversão (v0.3.18)

Campos opcionais e aditivos (projetos antigos continuam válidos):

- **Números de prova** (`homeContent` `home_metrics`): no topo da home e do currículo
- **Princípios de trabalho** (`homeContent` `work_principles`): página Sobre
- **Seções do case study** (`projects.caseStudy`): `role`, `context`, `decisions`, `learnings`, além de `problem`, `solution`, `results`, `metrics` e `testimonial`
- **Categorias** de projetos (filtros do portfólio) e de depoimentos (agrupamento em `/depoimentos`)
- **Grupos de habilidades** (`resumeItems` do tipo `skill`, campo `group`)

### Interface Terminal

- Aberta com a tecla <code>`</code> em qualquer página pública
- Navegação pelo portfólio via comandos de texto

### Logs de Auditoria

- Todas as mutações administrativas geram registros de auditoria
- Página `/admin/logs` para visualização e rastreabilidade
- Retenção de 2 anos com anonimização de IP após 90 dias

### Tradução Automática com IA

- Integrada nas páginas administrativas de conteúdo (projetos, blog, currículo, home, sobre)
- Envia **apenas os campos modificados** para tradução (otimização de tokens)
- Textos fixos da interface ficam em `siteTexts`, editáveis em `/admin/textos` e exportados para `src/i18n/translations` no build (`build:i18n`)

### Gerador de Currículo com IA (Pipeline 3 Etapas)

1. **Gemini** — analisa a descrição da vaga e extrai requisitos
2. **GPT-5.4** — pontua o fit do CV (0–100), identifica forças e fraquezas
3. **Claude Sonnet** — reescreve o CV completo para compatibilidade ATS

CVs gerados são armazenados na collection `aiGeneratedResumes` com score, análise e dados completos para regeneração de PDF.

### Aceite Eletrônico de Propostas

- **Captura de assinatura manuscrita** via canvas, armazenada como PNG no Convex Storage (`signatureStorageId`)
- **Evidências técnicas**: hash SHA-256, IP, User-Agent, versão da proposta
- **PDF do contrato** gerado a partir do modelo de contrato, com assinatura
- **Imutabilidade**: propostas aceitas são bloqueadas para edição/exclusão
- **Versionamento automático** ao editar propostas não aceitas

### Gerenciamento de Usuários

Na primeira vez que o projeto é acessado sem nenhum usuário root, o sistema exibe uma tela de setup inicial para criar a conta root — permitida apenas enquanto `BOOTSTRAP_ALLOWED=true` estiver definido no Convex (a CLI `rubrica setup` cria o root por linha de comando). A partir daí, apenas o root cria novos usuários (`/admin/users/new`), com email, senha e role. Todo usuário criado pelo admin recebe uma flag de **troca de senha obrigatória no primeiro login**.

---

### Wizard de Contato

Fluxo de contato em etapas acessível pela sidebar pública, com tipos de contato (projeto, vaga, networking, feedback). O envio tem **rate limiting por IP**. As solicitações aparecem em `/admin/contatos`, onde o admin atualiza o status e adiciona notas internas. Uma notificação Telegram é disparada a cada nova solicitação.

---

### Wizard de Depoimentos

Clientes podem enviar depoimentos via wizard público, sem login, em texto ou vídeo (upload para o Convex Storage, até 20 MB por vídeo e cota diária total de 100 MB). Cada envio vai para a fila de aprovação em `/admin/depoimentos`, onde o admin pode aprovar, rejeitar ou publicar. Uma notificação Telegram é disparada a cada nova submissão.

---

### Gerenciador de Mídia

As imagens ficam no Convex Storage, organizadas em **pastas com hierarquia** (`imageFolders`, `imageMetadata`). O `ImagePicker` permite fazer upload e reutilizar imagens em qualquer parte do sistema. As imagens são referenciadas por ID — nunca por URL direta.

---

### Área de Playground (`/playground`)

Área pública de demonstração (wizard de contato, proposta, blog, link de pagamento, CV com IA) com dados fictícios. O uso de IA é controlado por rate limiting. Os eventos de uso são registrados anonimamente e expiram em 24h.

---

### Soft Delete

As entidades gerenciáveis (projetos, posts, propostas, depoimentos, itens de currículo, serviços, checkouts, etc.) usam **soft delete**: ao excluir, o registro é marcado com `deletedAt` e some das listagens, mas permanece no banco. O admin vê os itens excluídos na aba "Excluídos" de `/admin/logs` e pode restaurá-los. A exclusão permanente é uma ação separada, com confirmação.

---

### Tarefas Automáticas de Manutenção

Cron jobs do Convex (`convex/crons.ts`):
- Sessões expiradas de propostas são removidas diariamente
- Entradas de rate limiting expiradas são limpas diariamente
- Logs de auditoria com mais de 2 anos são removidos semanalmente
- IPs nos logs de auditoria com mais de 90 dias são anonimizados diariamente (LGPD)
- Checkouts pendentes com prazo vencido (30 dias por padrão) são expirados a cada hora
- Logs de uso do playground são limpos diariamente
- `siteConfig` é populado com os valores de `rubrica.config.ts` (idempotente, diário)

---

### Gestão de Titulares LGPD (`/admin/lgpd`)

Painel exclusivo para `root` que centraliza o cumprimento dos direitos dos titulares previstos na Lei 13.709/18.

#### Busca
O titular é identificado por **e-mail** e/ou **CPF/CNPJ** — qualquer um dos dois é suficiente para localizar registros. A busca retorna um resumo de quantos registros com dados pessoais existem em cada tabela.

#### Exportação de dados (Art. 18, II — direito de acesso)
O botão **Exportar JSON** gera um arquivo com todos os dados do titular encontrados nas seguintes tabelas:

| Tabela | Dados exportados |
|--------|-----------------|
| `proposalAcceptances` | nome, CPF/CNPJ, e-mail, cargo, declaração, assinatura, hash SHA-256 |
| `contactRequests` | nome, e-mail, telefone, LinkedIn, empresa, respostas do wizard |
| `testimonialSubmissions` | nome, e-mail, empresa, texto do depoimento |
| `checkouts` | nome, e-mail, CPF/CNPJ, valor pago, status |

#### Anonimização (Art. 18, VI — direito de eliminação)
O botão **Anonimizar tudo** exibe um diálogo de confirmação e, após aprovação, substitui todos os dados pessoais do titular por `[ANONIMIZADO]` nas mesmas tabelas acima, além de anonimizar referências ao e-mail nos logs de auditoria. A operação:

- **Preserva a integridade contratual**: o `contentHash` SHA-256 original da proposta é mantido intacto como prova criptográfica de que o contrato existiu; apenas os campos de identificação dentro do `contentSnapshot` são substituídos
- **Abrange CPF/CNPJ**: o `clientDocument` e o CPF dentro do snapshot JSON do contrato são anonimizados
- **Marca o registro**: adiciona `anonymizedAt` (timestamp) e `_anonymizedAt` no snapshot para rastreabilidade
- **É irreversível**: registros em si são preservados para integridade, mas sem identificação pessoal
- **Gera auditoria**: toda execução é registrada no log com o identificador usado (e-mail ou CPF) e a contagem de registros afetados

---

### Setup Inicial com Seed

`rubrica setup` configura as variáveis do Convex, cria o usuário root (`seed:setupAdmin`) e popula o banco com conteúdo inicial (`seed:seedAll`: configurações do site, modelo de contrato padrão e textos da interface, conforme os plugins ativos).

---

## 🔄 Próximas Melhorias

- [x] Internacionalização (pt-BR e en-US)
- [x] Paletas claras (contrato de 4 cores)
- [ ] Modo alto contraste
- [x] Analytics (Vercel Analytics e Umami opcional) — falta um painel de analytics dentro do admin
- [ ] Otimizações de SEO adicionais (meta tags, RSS e sitemap já existem)
- [x] Testes automatizados (Vitest + CI no GitHub Actions)
- [ ] PWA (Progressive Web App)
- [ ] Notificações por e-mail ao aceitar proposta (Telegram já implementado)
- [ ] Dashboard de estatísticas de aceites (hoje o dashboard mostra só as contagens)
- [x] Pagamentos reais com Asaas (PIX, boleto e cartão)

## 📄 Licença

GNU General Public License v3.0

---

Desenvolvido com ❤️ por Matheus Mierzwa
