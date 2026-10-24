# Marca Rubrica

Logo: um *r* caligráfico atravessado por um floreio em terracota. Vetorizado a partir do logo original.
Guia de uso completo: [`guia-de-marca.html`](./guia-de-marca.html). Apresentação com aplicações: [`apresentacao/apresentacao.html`](./apresentacao/apresentacao.html).

## Arquivos

```
logo/svg/   arquivos-mestre (vetor, sem texto digitável)
logo/png/   os mesmos em PNG transparente (600/1200/2400 px; ícones 512/1024 px)
logo/web/   favicon.ico, favicon.svg, apple-touch-icon, ícones 192/512, maskable, site.webmanifest, head-snippet.html
logo/fonte/ scripts e máscaras usados para gerar o kit (referência)
```

Nome dos arquivos: `rubrica-<versão>-<cor>.svg`

| Versão | Uso |
|---|---|
| `horizontal` | principal: cabeçalho, README, documentos |
| `vertical` | capas, avatares grandes, espaços quadrados |
| `simbolo` | só o desenho, a partir de 160 px de largura |
| `simbolo-reduzido` | fios engrossados, de 64 a 160 px |
| `monograma` | só o *r*, abaixo de 64 px |
| `nome` | só o texto "rubrica" |
| `icone-*` / `favicon-*` | blocos quadrados 1024 px para app, avatar e favicon |

| Cor | Onde |
|---|---|
| `positivo` | tinta + terracota em fundo claro (padrão) |
| `negativo` | papel + terracota em fundo escuro |
| `creme` | tudo em papel, sobre terracota |
| `preto` / `branco` | uma cor (impressão, fotos) |
| `terracota` | uma cor, sobre papel |

## Cores

| Nome | HEX | RGB | CMYK |
|---|---|---|---|
| Tinta | `#1A1A18` | 26 26 24 | 0 0 8 90 |
| Terracota | `#C4664A` | 196 102 74 | 0 48 62 23 |
| Papel | `#F5F2EA` | 245 242 234 | 0 1 4 4 |
| Sálvia (apoio, fora do logo) | `#4D7C5F` | 77 124 95 | — |

CMYK convertido de forma direta; para impressão profissional, confirme com a gráfica (sugestão de Pantone para a terracota: 7618 C).

## Tipografia

O nome usa **Cormorant Garamond Italic SemiBold**, licença SIL OFL ([`logo/OFL-CormorantGaramond.txt`](./logo/OFL-CormorantGaramond.txt)), convertido em contornos.

## Favicon no site

Copie o conteúdo de `logo/web/` para `public/` e cole `logo/web/head-snippet.html` no `<head>` do `index.html`.
