# Plano de execução (`aplicar-plano`)

As skills `rubrica-apresentacao`, `rubrica-case`, `rubrica-curriculo` e `rubrica-blog` não gravam nada. Elas montam o conteúdo, passam pela `rubrica-pilar` e entregam um **plano**: um JSON com cada escrita exata, em pt-BR e en-US. A `rubrica` aplica esse plano do jeito que ele está.

## Onde fica

```
.rubrica/
├── perfil.md                              ← perfil editorial (ver perfil-editorial.md)
└── planos/
    └── 2026-10-24-case-app-agendamento/
        ├── plano.json
        ├── corpo.html, corpo-en.html      ← arquivos que o plano referencia
        ├── capa.png
        └── plano.json.resultado.json      ← criado pelo aplicar-plano (progresso)
```

Uma pasta por plano: `aaaa-mm-dd-<tipo>-<assunto>`. Os caminhos dentro do plano são relativos à pasta do `plano.json`.

## Formato

```json
{
  "rubricaPlano": 1,
  "origem": "rubrica-case",
  "resumo": "Case do app de agendamento + destaque na home",
  "convex": "https://<deployment>.convex.cloud",
  "passos": [
    { "id": "print1", "acao": "imagem", "descricao": "Tela principal do app",
      "arquivo": "tela.png", "alt": "Agenda semanal do app com horários livres em verde" },
    { "acao": "mutation", "descricao": "Case do projeto",
      "funcao": "projects:update",
      "ler": { "funcao": "projects:getById", "args": { "id": "<_id>" } },
      "args": { "id": "<_id>", "caseStudy": { "...": "objeto inteiro" } } }
  ]
}
```

- `convex`: o Convex em que o plano foi montado (o `status` mostra). Se o Convex na hora de aplicar for outro, nada é gravado. Assim um plano feito em dev não cai em produção sem ninguém perceber.
- `soPt: true`: só quando a pessoa pediu para gravar sem inglês.
- `id`: opcional. Dá nome ao resultado do passo para os passos seguintes usarem como `{{id.campo}}`.
- `descricao`: frase curta que aparece na prévia e nos erros.

## Ações

| `acao` | Campos | Grava com | Devolve |
|---|---|---|---|
| `textos` | `itens: [{key, ptBR, enUS}]` | `siteTexts:update` | — |
| `config` | `itens: {chave: valor}`, `aceitarContraste?` | `siteConfig:setBatch` (mesmas validações do `config-definir`) | — |
| `perfil` | `dados: {campo: valor}` (mudou `role`, mande `roleTranslations`) | `contactInfo:update` | — |
| `home` | `chave`, `valor` (mesmo formato do `home-definir`) | `homeContent:set` | — |
| `imagem` | `arquivo`, `alt` (obrigatório), `nome?`, `tags?`, `pasta?` | biblioteca de imagens | `id`, `storageId`, `url` |
| `post-criar` | `titulo`, `enTitulo`, `slug`, `arquivo`, `enArquivo`, `subtitulo?`, `enSubtitulo?`, `tags?` (lista, ou texto separado por vírgulas), `destaque?`, `imagemId?`, `leitura?` | `posts:create`, sempre rascunho | `id`, `slug` |
| `mutation` | `funcao`, `args`, `ler?: {funcao, args}` | qualquer mutation permitida | `resultado` (o que a mutation devolveu) |

`ler` é uma query que mostra o estado atual na prévia (ex.: `projects:getById` antes de um `projects:update`). Use sempre que a mutation alterar algo que já existe.

**Fora de plano:** `users:*`, `checkouts:*`, pagamentos, `plugins:*`, `proposals:resetPassword`, os tradutores pagos (`translateBatch`, `translateAllMissing`) e o que é irreversível. Isso se faz direto, com o pedido explícito da pessoa, ou pelo painel.

## Referências entre passos

`"imagemId": "{{capa.id}}"` usa o `id` devolvido pelo passo `capa`. Um valor que é só a referência mantém o tipo; dentro de um texto ela vira texto (`"<img src=\"{{print1.url}}\">"`). Nos arquivos HTML, só são trocadas as referências a passos que existem no plano. Assim, um `{{user.name}}` de um exemplo de código fica como está.

## Como aplicar

1. Da raiz do projeto, `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar` valida o plano (estrutura, arquivos, chaves de texto, slug repetido, contraste, `enUS` faltando, inclusive dentro dos campos `*Translations` das mutations, e funções que não existem ou são proibidas) e mostra o antes → depois de cada passo. Não grava nada. Os `args` de uma mutation só são conferidos pelo Convex na hora de gravar: confira-os contra `$RB funcoes --modulo <modulo>`.
2. Mostre a prévia à pessoa, resumida e legível (o que muda, onde, antes → depois), e espere o "ok".
3. `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json` grava na ordem e salva o progresso em `plano.json.resultado.json`.
4. Se um passo falhar, os anteriores já estão gravados. Corrija o plano e rode com `--retomar`, que pula o que já foi feito. Sem `--retomar`, um plano já aplicado é recusado, para não duplicar posts e projetos.

Depois: posts nascem rascunho (`post-publicar` só a pedido). Textos fixos e cores valem na hora. Perfil, blocos da home, SEO, projetos, currículo e posts entram no próximo `publicar-site`, que também só roda a pedido. Os passos `perfil` e `config` exigem papel admin ou root.
