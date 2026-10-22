# Templates e paletas

O Rubrica vem com **5 layouts** e **4 paletas de cores**, escolhidos ao criar o projeto com o CLI:

```bash
npx create-rubrica meu-portfolio
# Layout → Tema visual → Fontes → Plugins → identidade
```

Layout e paleta são independentes: qualquer layout funciona com qualquer paleta.

## Layouts

| | Layout | Em uma frase | Navegação |
|---|---|---|---|
| <img src="img/cyberpunk/home.jpg" width="220" /> | [**Cyberpunk**](./cyberpunk.md) | O visual original do Rubrica: terminal neon com sidebar e foto de perfil | Sidebar fixa à esquerda |
| <img src="img/brutalist/home.jpg" width="220" /> | [**Brutalism Terminal**](./brutalist.md) | O site inteiro como uma sessão de terminal Unix, em monospace e sem cantos arredondados | Abas `.sh` no topo |
| <img src="img/swiss/home.jpg" width="220" /> | [**Swiss Grid**](./swiss.md) | Cartaz suíço sobre grid de 12 colunas, tipografia pesada e blocos de cor sólida | Barra de 5 colunas no topo |
| <img src="img/bento/home.jpg" width="220" /> | [**Bento**](./bento.md) | Mosaico de cartões arredondados, orientado a produto | Dock flutuante no rodapé |
| <img src="img/magazine/home.jpg" width="220" /> | [**Magazine**](./magazine.md) | Revista impressa: masthead, seções numeradas e display serifado | Masthead centralizado |

## Paletas

Veja [**Esquemas de cores**](./cores.md): as 4 paletas, o contrato de 4 cores que todo layout segue e a Home de cada layout em cada paleta.

| Editorial Cream | Paper Noir | Midnight Blue | Solar Warm |
|---|---|---|---|
| <img src="img/cores/editorial-cream.svg" width="200" /> | <img src="img/cores/paper-noir.svg" width="200" /> | <img src="img/cores/midnight-blue.svg" width="200" /> | <img src="img/cores/solar-warm.svg" width="200" /> |

## Como o CLI aplica o layout

| O que o template traz | Para onde vai no projeto |
|---|---|
| `templates/layouts/<layout>/*.tsx` (Layout, navegação) | `src/components/` |
| `templates/layouts/<layout>/pages/*.tsx` | `src/pages/` (substitui Home, Currículo, Portfólio, Sobre e Blog) |

O **Cyberpunk** não tem `pages/`: ele usa as páginas do próprio app. Páginas que nenhum layout substitui (post do blog, estudo de caso, depoimentos, propostas, checkout, admin) são compartilhadas por todos e também seguem a paleta escolhida.

## Sobre as imagens

As capturas foram geradas rodando o CLI de verdade para cada layout e fazendo o build do projeto gerado, com os **dados de exemplo** de `public/data/` (perfil fictício "Alex Rocha"). Para regenerar esses dados: `npx tsx scripts/generate-sample-data.ts`.
