# create-rubrica

CLI para criar e configurar projetos [Rubrica](https://github.com/matheusmierzwa/rubrica) — sistema de portfólio profissional com React + Convex.

## Instalação

Não é necessário instalar globalmente. Use diretamente via `pnpm create` ou `npx`:

```bash
pnpm create rubrica meu-portfolio
# ou
npx create-rubrica meu-portfolio
```

## Comandos

### `pnpm create rubrica <nome-do-projeto>`

Cria um novo projeto Rubrica a partir do template mais recente. O assistente interativo coleta:

- **Identidade** — nome do site, URL, descrição, autor, email, Twitter/X handle, idioma
- **Visual** — layout (sidebar / topbar / centered), tema (cyberpunk / minimal / editorial / forest / personalizado), fonte principal, fonte mono, border radius
- **Funcionalidades** — plugins ativos (blog, portfólio, currículo, etc.)
- **Setup** — inicializar git, instalar dependências

Ao final, os arquivos gerados incluem:
- `rubrica.config.ts` — identidade e aparência em build-time
- `rubrica.json` — estado da CLI (versionado)
- `src/components/Layout.tsx` e arquivos de navegação do layout escolhido
- `src/index.css` — tema CSS aplicado
- `convex/pluginRegistry.ts` — plugins configurados

### `rubrica config`

Reconfigura um projeto Rubrica existente. Execute dentro do diretório do projeto:

```bash
rubrica config
```

Permite reconfigurar:
- **Identidade** — atualiza `rubrica.config.ts` com novos dados
- **Aparência** — altera tema, fontes e radius; atualiza CSS e `rubrica.json`
- **Layout** — troca o shell de navegação (⚠ sobrescreve customizações manuais)
- **Plugins** — ativa ou desativa plugins no `convex/pluginRegistry.ts`

### `rubrica update`

Atualiza um projeto Rubrica para a versão mais recente do template (Fase 3 — em desenvolvimento).

## Estrutura gerada

```
meu-portfolio/
├── rubrica.config.ts        ← identidade e aparência (editável)
├── rubrica.json             ← estado da CLI (versionado)
├── src/
│   ├── components/
│   │   ├── Layout.tsx       ← shell do layout escolhido
│   │   └── Sidebar.tsx      ← ou Navbar.tsx / Footer.tsx
│   └── index.css            ← tema CSS
├── convex/
│   └── pluginRegistry.ts    ← plugins configurados
└── index.html               ← meta tags preenchidas
```

## Pós-instalação

Após `pnpm create rubrica`:

```bash
cd meu-portfolio

# 1. Suba o backend Convex (deixe rodando)
npx convex dev

# 2. Em outro terminal, inicie o frontend
pnpm dev

# 3. Acesse http://localhost:3000 e crie seu usuário root em /login
#    (com BOOTSTRAP_ALLOWED=true no Convex Dashboard)
```

## Licença

MIT
