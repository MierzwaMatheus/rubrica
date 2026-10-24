# Campos da apresentação no Rubrica

Conferidos em `convex/homeContent.ts`, `convex/siteConfig.ts`, `src/pages/Home.tsx` e `src/pages/About.tsx`. Os layouts podem usar textos diferentes: rode `$RB textos --pagina home` e `--pagina about` e use as chaves que existem no projeto.

| O que é | Onde fica | Passo no plano | Observação |
|---|---|---|---|
| Frase principal (h1 da home) | texto `home.hero.headline` | `textos` | não repete o nome. Diz o quê, para quem, com que resultado |
| Descrição abaixo do cargo | texto `home.hero.description` | `textos` | 1 ou 2 frases |
| Botões do topo | textos `home.hero.ctaCases`, `home.hero.ctaContact` | `textos` | curtos. Só mude se a pessoa quiser |
| Saudação antes do nome | texto `home.greeting` | `textos` | alguns layouts |
| Subtítulo da página Sobre | texto `about.subtitle` | `textos` | opcional |
| Cargo | perfil `role` + `roleTranslations {ptBR, enUS}` | `perfil` | aparece logo abaixo da frase principal |
| Nome, cidade, links | perfil `name`, `location`, `linkedinUrl`... | `perfil` | só se mudarem |
| Sobre | home `about_text` = `{ptBR, enUS}` | `home` | parágrafos separados por linha em branco. O 1º ganha destaque na home, e o texto todo abre a página Sobre (resumo profissional). Números são destacados sozinhos |
| Números de destaque | home `home_metrics` = `[{value, label, labelTranslations: {ptBR, enUS}}]` | `home` | até 4. Aparecem no topo da home e do currículo. A lista inteira é substituída |
| Princípios de trabalho | home `work_principles` = `[{title, description, titleTranslations, descriptionTranslations}]` | `home` | de 3 a 5. Abre a página Sobre. Lista vazia esconde a seção |
| Disponibilidade | home `availability_status` = `{available: bool, label: {ptBR, enUS}}` | `home` | ex.: "Agenda aberta para março" |
| SEO da home | config `seo_home_title`, `seo_home_description`; `site_description` | `config` | título com até ~60 caracteres, descrição com 150 a 160, com o cargo e o público |

As chaves `hero_title`, `hero_subtitle` e `about_short` existem no banco, mas a home padrão não as exibe. Não as use, a não ser que o layout do projeto mostre (procure em `src/`).

## Exemplo de passos
```json
[
  { "acao": "textos", "descricao": "Frase principal e descrição da home",
    "itens": [
      { "key": "home.hero.headline", "ptBR": "...", "enUS": "..." },
      { "key": "home.hero.description", "ptBR": "...", "enUS": "..." } ] },
  { "acao": "perfil", "descricao": "Cargo",
    "dados": { "role": "Designer de produto", "roleTranslations": { "ptBR": "Designer de produto", "enUS": "Product designer" } } },
  { "acao": "home", "descricao": "Texto Sobre", "chave": "about_text",
    "valor": { "ptBR": "1º parágrafo...\n\n2º parágrafo...", "enUS": "..." } },
  { "acao": "home", "descricao": "Números de destaque", "chave": "home_metrics",
    "valor": [ { "value": "−18%", "label": "faltas em 3 meses",
                 "labelTranslations": { "ptBR": "faltas em 3 meses", "enUS": "no-shows in 3 months" } } ] },
  { "acao": "config", "descricao": "SEO da home",
    "itens": { "seo_home_title": "...", "seo_home_description": "..." } }
]
```

A parte pessoal da página Sobre (texto "Fora do trabalho" em `about.aboutMe.text`, "Meu dia a dia" e "FAQ pessoal") é feita pela `rubrica-voz`, a partir da entrevista de voz.
