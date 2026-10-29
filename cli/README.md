# create-rubrica

CLI para criar, configurar, publicar e atualizar projetos [Rubrica](https://github.com/MierzwaMatheus/rubrica), o template de portfólio profissional com React + Convex.

Precisa de Node 20+ e do `git` instalado.

```bash
npx create-rubrica@latest meu-portfolio
# ou
pnpm create rubrica meu-portfolio
```

Para chegar com a aparência já escolhida, monte o seu no [combinador do site](https://userubrica.vercel.app/#combinador) e copie o comando pronto (`--receita <código>`).

## Comandos

Tirando o `create`, rode dentro da pasta do projeto.

| Comando | Para quê |
|---|---|
| `npx create-rubrica@latest <pasta>` | Cria o projeto (aceita `--receita` do site e opções como `--layout` e `--esquema`) |
| `npx create-rubrica setup` | Conecta o Convex, cria o admin e os dados iniciais; liga as integrações |
| `npx create-rubrica config` | Troca identidade, aparência, layout ou plugins depois de criado |
| `npx create-rubrica publicar` | Põe o site no ar na Vercel, e publica de novo nas próximas vezes |
| `npx create-rubrica senha` | Troca a senha do painel e libera o login bloqueado |
| `npx create-rubrica@latest update` | Traz a versão nova do Rubrica sem desfazer as suas personalizações |
| `npx create-rubrica telemetria [ligar\|desligar]` | Mostra, liga ou desliga a telemetria anônima do projeto |

## Documentação

- [Começando](https://userubrica.vercel.app/docs/guia/comecando): do zero ao site rodando no computador.
- [Comandos do CLI](https://userubrica.vercel.app/docs/guia/cli): todas as perguntas, opções e arquivos gerados.
- [Publicar o site](https://userubrica.vercel.app/docs/guia/publicar): Vercel, o botão Publicar do painel e domínio próprio.
- [Atualizando o seu Rubrica](https://userubrica.vercel.app/docs/atualizacao).
- [Telemetria do CLI](https://userubrica.vercel.app/docs/guia/telemetria): o que o CLI manda, sem dados pessoais, e como desligar.

Também em inglês: [userubrica.vercel.app/en/docs](https://userubrica.vercel.app/en/docs).

## Manutenção

Layout, esquema de cores, fonte ou plugin novo no template precisa entrar também nas listas do CLI. O passo a passo está em [Manutenção do CLI](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/cli/manutencao.md).

## Licença

MIT
