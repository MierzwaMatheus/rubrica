# Agentes de IA

O Rubrica foi feito para trabalhar com agentes como o Claude Code e o Codex. Eles não editam o banco "por fora": usam um servidor **MCP local**, que fala com o Convex do seu projeto **com o login de um usuário do painel** e mostra uma **prévia antes de gravar**.

## Como funciona

```
agente (Claude Code, Codex)  ──stdio──▶  rubrica mcp  ──HTTPS──▶  Convex do projeto
                                          └─ token em ~/.config/rubrica/    (papel do usuário logado)
```

- O servidor roda na **sua máquina**, inicia junto com o agente e fecha com ele. Não existe servidor hospedado.
- As ferramentas saem dos mesmos campos e regras que valem no painel e no backend.
- Valem as **permissões do papel** do usuário logado. Uma conta `blog-editor` só consegue mexer em posts e mídia, mesmo que o agente peça outra coisa.
- Toda ferramenta que grava começa em **prévia** (`dryRun` ligado por padrão): o agente mostra o antes e o depois, e só com o seu "ok" repete a chamada para gravar.

## Configurar

O projeto criado pelo `create-rubrica` já vem com o `.mcp.json` pronto (sem segredo, pode ir para o git):

```json
{
  "mcpServers": {
    "rubrica": { "command": "npx", "args": ["rubrica", "mcp"] }
  }
}
```

No Claude Code também dá para usar `claude mcp add rubrica -- npx rubrica mcp`. No Codex, no `~/.codex/config.toml`:

```toml
[mcp_servers.rubrica]
command = "npx"
args = ["rubrica", "mcp"]
env = { RUBRICA_PROJECT = "/caminho/do/projeto" }
```

Para falar com o site **publicado**, acrescente `"--producao"` aos `args`, num servidor separado (`rubrica-producao`), para nunca confundir os dois.

## Login

O login é **seu, no seu terminal**. A senha é digitada ali, sem eco, e nunca passa pelo agente:

```bash
npx rubrica mcp login               # pergunta o e-mail e a senha
npx rubrica mcp login --producao    # Convex do site publicado
npx rubrica mcp whoami              # projeto, banco, conta e papel
npx rubrica mcp logout
```

No Claude Code, você pode digitar `! npx rubrica mcp login` no próprio prompt. O token fica em `~/.config/rubrica/`, fora do repositório, um por projeto e por banco (desenvolvimento e produção têm logins separados), e renova sozinho.

**Dica:** para trabalho de conteúdo, entre com uma conta `content-editor` ou `blog-editor`. O `root` só quando for preciso.

## O que o agente consegue fazer

| Área | Exemplos |
|---|---|
| Conta e ambiente | Ver o projeto, o banco (desenvolvimento ou produção), o papel, os plugins e o catálogo de blocos |
| Site | Ler e mudar configurações (nome, aparência, navegação, redes), ligar e desligar plugins, **publicar** (dispara o build) |
| Páginas e blocos | Listar, criar (sempre rascunho), mudar título, caminho e SEO; adicionar, editar campos, mover, ocultar e remover blocos |
| Coleções | Listar, ler, criar (rascunho), editar, publicar e remover posts, projetos, serviços, depoimentos, FAQ, currículo, equipe e planos |
| Textos de interface | Ver e personalizar textos por idioma |
| Mídia | Listar a biblioteca e subir imagens de um caminho local |
| Contatos | Ver pedidos e mudar o status (com o plugin de contato ligado) |

Há também prompts prontos (`montar-pagina`, `traduzir-conteudo`, `revisar-antes-de-publicar`) e recursos de leitura, como o guia de escrita e o catálogo de blocos.

A referência completa de ferramentas, papéis e variáveis está em [`docs/v2/mcp.md`](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/v2/mcp.md).

## Exemplo: trocar o botão da abertura nos dois idiomas

1. O agente lê a página: `pages_get { "page": "/" }` e acha o bloco `hero`.
2. Chama `block_update_fields` com os textos em `pt-BR` e `en`. Volta uma **prévia** com o antes e o depois, e avisos (por exemplo, "texto preenchido em `pt-BR` e vazio em `en`").
3. Você aprova. O agente repete a chamada com `dryRun: false`.

Gravar não publica: o site estático só muda no próximo build. O agente só dispara a publicação (`site_publish`) quando você pedir.

## Segurança

- O servidor roda como processo seu, com o login e o papel do usuário. Em **produção**, leia sempre a prévia: o conteúdo muda na hora no banco.
- O MCP **não usa** `convex dev|deploy|run|import`: só as funções públicas do projeto, com o papel do usuário.
- Tokens e senhas nunca saem em respostas, em recursos nem em mensagens de erro.
- O envio de imagens lê um arquivo local (só imagens, conferidas pelo conteúdo). Restrinja o acesso ao sistema de arquivos do agente, se isso for um problema.

## Skills: o "como escrever"

As skills guardam o jeito certo de escrever cada coisa e gravam pelo MCP. Ficam em `.agents/skills/` (com atalhos em `.claude/skills/`):

| Pedido | Skill |
|---|---|
| Tom de voz, entrevista de voz, a parte pessoal do Sobre | `rubrica-voz` |
| Apresentação, "sobre mim", frase da home, princípios | `rubrica-apresentacao` |
| Case de um projeto | `rubrica-case` |
| Currículo | `rubrica-curriculo` |
| Post do blog do zero | `rubrica-blog` |
| Revisar um texto antes de ir ao site | `rubrica-pilar` |

## AGENTS.md

O projeto traz um `AGENTS.md` (e um `CLAUDE.md` que o importa) com as regras para qualquer agente: o que é conteúdo e o que é código, quais comandos o agente roda e quais são da pessoa (`setup`, `config`, `publicar`, `senha`), os dois bancos e o cuidado com tudo o que grava em produção. Depois de criado ele é seu: o `update` não o reescreve, então ajuste à vontade.
