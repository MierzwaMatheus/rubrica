# Idiomas

O site pode ter **um idioma só** ou quantos você quiser. Cada idioma tem o seu endereço, e o conteúdo é traduzido campo a campo no painel.

## Como funciona

- Você declara a **lista de idiomas** (`pt-BR`, `en`, `es`, `fr`…) e escolhe qual é o **principal**.
- O idioma principal fica **sem prefixo** na URL; os outros ficam em `/<código>`: `/sobre` (principal), `/en/sobre`, `/es/sobre`. O código do prefixo é a primeira parte do idioma (`pt-PT` vira `/pt`). Dois idiomas com o mesmo prefixo, como `pt-BR` e `pt-PT` juntos, não são aceitos.
- Qualquer idioma pode ser o principal. Um site em inglês tem `/` em inglês e `/pt` em português.
- Com **um idioma só**, não há prefixo nem seletor de idioma.
- Cada página tem `hreflang` e canonical em todos os idiomas em que existe, o que o Google pede.

## Conteúdo sem tradução

O Rubrica **só gera o que está traduzido**:

- Um post ou uma página sem tradução num idioma **não existe** nesse idioma: não entra nas listas, no sitemap, no RSS nem no `hreflang`.
- O seletor de idioma, numa página que não existe no outro idioma, leva para a home daquele idioma.
- Os **textos de interface** (menu, botões, formulários, 404) sem tradução caem no idioma principal, para nada aparecer em branco.
- O painel mostra o que falta traduzir em cada item.

Assim, você pode lançar o site em português e ir traduzindo aos poucos, sem páginas vazias nem erros 404 dentro do próprio site.

## Escolher na criação

```bash
npx create-rubrica@latest meu-site --idiomas pt-BR,en --idioma-principal pt-BR
```

Sem `--idioma-principal`, vale o primeiro da lista. Sem `--idiomas`, o site nasce em `pt-BR`.

## Mudar depois

```bash
npx create-rubrica config --idiomas pt-BR,en,es
npx create-rubrica config --idioma-principal en
```

Antes de gravar, o comando avisa duas coisas:

- **Idioma novo:** o conteúdo só aparece nele depois de traduzido.
- **Idioma principal novo:** as URLs mudam (o principal fica sem prefixo), então considere redirecionamentos.

A lista de idiomas é configuração técnica: só o papel `root` mexe nela no painel.

## Traduzir

Cada campo de texto traduzível no painel tem uma aba por idioma. Dá para traduzir de três jeitos:

1. **À mão**, no painel.
2. **Com o agente**: o MCP tem o prompt `traduzir-conteudo`, que completa um idioma e mostra a prévia antes de gravar. Veja [Agentes](./agentes.md).
3. **Com IA no painel**: ligue o plugin **Tradução com IA** (usa o OpenRouter, com a chave `OPENROUTER_API_KEY`). Ele preenche o botão "traduzir" de cada campo. Veja [Integrações](./integracoes.md). É um plugin comum: dá para desligar ou trocar.

## Migrando da v1

O site da v1 tinha português e inglês. Na migração, o idioma principal é `pt-BR` e as URLs `/en` ficam exatamente iguais. Veja [Migrar da v1](./migrar.md).
