# Catálogo de blocos

<!-- Gerado por apps/docs/scripts/blocos.ts a partir de packages/core. Não edite à mão: rode pnpm docs:blocos. -->

Todos os blocos que o núcleo do Rubrica traz, com os campos de cada um. Um bloco é uma seção de página: você escolhe os blocos no editor de páginas do painel, e cada tema desenha o seu jeito de mostrar cada um.

Esta página é gerada do código do núcleo. Os nomes dos campos (como `title`) são os que o MCP e os arquivos de dados usam; o rótulo é o que aparece no painel. "Quando usar", "Quando não usar" e "Combina com" são a orientação de cada bloco, a mesma que o MCP entrega aos agentes.

**Variações** são desenhos com nome que um tema oferece para o bloco (por exemplo, `cases` em grade ou em lista). O painel mostra só as do tema em uso, e a primeira de cada lista é a padrão. Ao trocar de tema, uma variação que o tema novo não tem cai na padrão dele.

Precisa de uma seção que não está aqui? Veja [Criar um bloco](./criar-bloco.md).

## Os blocos

| Bloco | Nome no painel | Para que serve | Tipo de site | Plugin |
|---|---|---|---|---|
| [`hero`](#hero--hero) | Hero | Primeira dobra: título principal, apoio, botões e imagem. Leva o h1 quando é o primeiro bloco da página. | pessoal e empresa | — |
| [`texto`](#texto--texto) | Texto | Título e texto livre, com imagem opcional ao lado. | pessoal e empresa | — |
| [`numeros`](#numeros--números) | Números | Números em destaque (anos de experiência, clientes, projetos). | pessoal e empresa | — |
| [`lista-itens`](#lista-itens--lista-de-itens) | Lista de itens | Itens com título e texto: princípios de trabalho, valores, diferenciais, etapas. | pessoal e empresa | — |
| [`cases`](#cases--cases) | Cases | Projetos ou cases da coleção, com link para a página de cada um. Mostra os destaques; sem nenhum, os primeiros da lista. Sem projetos, o bloco some. | pessoal e empresa | `portfolio` |
| [`servicos`](#servicos--serviços) | Serviços | Serviços da coleção. | pessoal e empresa | — |
| [`depoimentos`](#depoimentos--depoimentos) | Depoimentos | Depoimentos aprovados da coleção, com convite opcional para enviar um novo. Mostra os destaques; sem nenhum, os primeiros da lista. Sem depoimentos, o bloco some. | pessoal e empresa | `testimonials` |
| [`faq`](#faq--perguntas-frequentes) | Perguntas frequentes | Perguntas e respostas da coleção. Gera JSON-LD FAQPage. | pessoal e empresa | — |
| [`posts-recentes`](#posts-recentes--posts) | Posts | Posts do blog. Com quantidade vazia, lista todos (página do blog). | pessoal e empresa | `blog` |
| [`cta`](#cta--chamada) | Chamada | Fechamento com um ou dois caminhos (ex.: "tenho um projeto" e "tenho uma vaga"). | pessoal e empresa | — |
| [`contato`](#contato--contato) | Contato | Formulário ou assistente de contato, com os canais (e-mail, WhatsApp, redes). | pessoal e empresa | — |
| [`galeria`](#galeria--galeria) | Galeria | Imagens com título e descrição: dia a dia, bastidores, espaço da empresa. | pessoal e empresa | `about` |
| [`curriculo`](#curriculo--currículo) | Currículo | Experiência, formação e competências da coleção, com download em PDF. | só pessoal | `resume` |
| [`precos`](#precos--preços) | Preços | Planos da coleção lado a lado, com destaque e botão de cada um. | só empresa | `pricing` |
| [`equipe`](#equipe--equipe) | Equipe | Pessoas da coleção, com foto, cargo e redes. | só empresa | `team` |
| [`localizacao`](#localizacao--localização) | Localização | Endereço, horário e mapa a partir dos dados da empresa. | só empresa | — |
| [`logos-clientes`](#logos-clientes--logos-de-clientes) | Logos de clientes | Faixa de logos de clientes ou parceiros. | só empresa | — |
| [`video`](#video--vídeo) | Vídeo | Vídeo do YouTube ou do Vimeo. Carrega leve: miniatura e botão de play, e o player só depois do clique. | pessoal e empresa | — |
| [`incorporacao`](#incorporacao--incorporação) | Incorporação | Agenda, formulário, mapa ou player de outro serviço, por endereço, só dos provedores permitidos (Calendly, Cal.com, Google Agenda, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma). | pessoal e empresa | — |
| [`linha-do-tempo`](#linha-do-tempo--linha-do-tempo) | Linha do tempo | Marcos em ordem: história da empresa, trajetória, etapas de um projeto. | pessoal e empresa | — |
| [`comparativo-planos`](#comparativo-planos--comparativo-de-planos) | Comparativo de planos | Tabela que compara os planos da coleção item a item (linhas = recursos, colunas = planos), com o botão de cada plano. | só empresa | `pricing` |

## `hero` — Hero

Primeira dobra: título principal, apoio, botões e imagem. Leva o h1 quando é o primeiro bloco da página.

- **Quando usar:** Abertura da página: o primeiro bloco, com a promessa principal (leva o h1), um apoio curto e um ou dois botões. Um por página.
- **Quando não usar:** Fora do topo ou repetido na página. Para um chamado no meio ou no fim, use cta; para explicar com parágrafos, texto.
- **Combina com:** [`numeros`](#numeros--números), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cases`](#cases--cases), [`servicos`](#servicos--serviços)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** temas: `blueprint` (`apresentacao`, `folha`); `cyberpunk` (`inicio`, `pagina`); `monograph` (`folha-de-rosto`, `capitulo`); `padrao` (`inicio`, `pagina`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `eyebrow` | Sobretítulo | texto | não | sim | até 80 caracteres |
| `title` | Título | texto | sim | sim | até 160 caracteres |
| `subtitle` | Subtítulo | texto longo | não | sim | até 400 caracteres |
| `primaryCta` | Botão principal | link | não | o rótulo | — |
| `secondaryCta` | Botão secundário | link | não | o rótulo | — |
| `image` | Imagem | imagem | não | o texto alternativo | — |
| `tags` | Etiquetas | lista | não | — | até 8 itens; cada item: "Etiqueta" |
| `tags[].label` | Texto | texto | sim | sim | até 40 caracteres |
| `showAvailability` | Mostrar disponibilidade | sim ou não | não | — | padrão: não |

## `texto` — Texto

Título e texto livre, com imagem opcional ao lado.

- **Quando usar:** Explicar com parágrafos: história, sobre, abordagem, uma política. Aceita uma imagem ao lado.
- **Quando não usar:** Para itens paralelos (valores, etapas, diferenciais), use lista-itens; para marcos com data, linha-do-tempo; para números, numeros. Nunca ponha h1 no corpo.
- **Combina com:** [`numeros`](#numeros--números), [`lista-itens`](#lista-itens--lista-de-itens), [`galeria`](#galeria--galeria), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** temas: `brutalist` (`simples`, `numerado`); `chat` (`mensagens`, `pergunta`); `cyberpunk` (`default`, `pessoal`); `magazine` (`coluna`, `ensaio`); `padrao` (`default`, `pessoal`); `poster` (`declaracao`, `corrido`); `zine` (`carta`, `postit`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `body` | Texto | texto formatado | sim | sim | — |
| `image` | Imagem | imagem | não | o texto alternativo | — |
| `imagePosition` | Posição da imagem | opção | não | — | opções: `start` (Antes do texto), `end` (Depois do texto); padrão: `end` |

## `numeros` — Números

Números em destaque (anos de experiência, clientes, projetos).

- **Quando usar:** Três ou quatro números concretos que dão prova rápida (anos, clientes, projetos), logo depois do hero ou de um texto.
- **Quando não usar:** Sem números reais que a pessoa confirmou (não invente). Muitos números diluem o destaque: até quatro é o ideal.
- **Combina com:** [`hero`](#hero--hero), [`texto`](#texto--texto), [`depoimentos`](#depoimentos--depoimentos)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `items` | Números | lista | sim | — | de 1 a 8 itens; cada item: "Número" |
| `items[].value` | Valor | texto | sim | não | Ex.: 10+, 98%, R$ 2 mi; até 16 caracteres |
| `items[].label` | Rótulo | texto | sim | sim | até 60 caracteres |
| `items[].description` | Detalhe | texto | não | sim | até 140 caracteres |

## `lista-itens` — Lista de itens

Itens com título e texto: princípios de trabalho, valores, diferenciais, etapas.

- **Quando usar:** Itens paralelos com título e texto curto: princípios, valores, diferenciais, etapas de um processo (numerados).
- **Quando não usar:** Para marcos com data, use linha-do-tempo; para serviços com página própria, servicos; para perguntas e respostas, faq.
- **Combina com:** [`texto`](#texto--texto), [`numeros`](#numeros--números), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `numbered` | Numerar itens | sim ou não | não | — | padrão: não |
| `items` | Itens | lista | sim | — | de 1 a 12 itens; cada item: "Item" |
| `items[].icon` | Ícone | texto | não | não | Nome de um ícone do Lucide (ex.: rocket); até 40 caracteres |
| `items[].title` | Título | texto | sim | sim | até 100 caracteres |
| `items[].body` | Texto | texto longo | não | sim | até 500 caracteres |

## `cases` — Cases

Projetos ou cases da coleção, com link para a página de cada um. Mostra os destaques; sem nenhum, os primeiros da lista. Sem projetos, o bloco some.

- **Quando usar:** Mostrar trabalhos feitos (coleção de projetos): os destaques na home, a lista inteira na página de portfólio ou de cases.
- **Quando não usar:** Sem projetos cadastrados o bloco some: crie os projetos antes. Para só mostrar marcas atendidas, logos-clientes.
- **Combina com:** [`depoimentos`](#depoimentos--depoimentos), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** `portfolio`: o bloco some com o plugin desligado
- **Lista itens de:** `projects` (padrão ao criar: só os destaques, 3 itens, na ordem do painel)
- **Variações:** componente padrão do núcleo: `grade`, `lista` · temas: `bento` (`grade`, `destaque`); `blueprint` (`grade`, `destaque`); `brutalist` (`grade`, `lista`); `chat` (`lista`, `destaque`); `cyberpunk` (`grade`, `lista`); `desktop` (`grade`, `lista`); `garden` (`grade`, `destaque`); `index` (`indice`, `destaque`, `grade`); `magazine` (`grade`, `lista`); `monograph` (`sumario`, `pranchas`); `padrao` (`grade`, `lista`); `poster` (`cartaz`, `catalogo`, `faixa`); `swiss` (`grade`, `lista`); `zine` (`grade`, `destaque`, `lista`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `cta` | Link para ver todos | link | não | o rótulo | — |

## `servicos` — Serviços

Serviços da coleção.

- **Quando usar:** Listar o que é oferecido (coleção de serviços): um resumo na home, a lista completa na página de serviços.
- **Quando não usar:** Para preços, use precos ou comparativo-planos; para o jeito de trabalhar em etapas, lista-itens ou linha-do-tempo.
- **Combina com:** [`faq`](#faq--perguntas-frequentes), [`depoimentos`](#depoimentos--depoimentos), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Lista itens de:** `services` (padrão ao criar: na ordem do painel)
- **Variações:** temas: `chat` (`lista`, `etiquetas`); `garden` (`canteiros`, `etiquetas`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `cta` | Botão | link | não | o rótulo | — |

## `depoimentos` — Depoimentos

Depoimentos aprovados da coleção, com convite opcional para enviar um novo. Mostra os destaques; sem nenhum, os primeiros da lista. Sem depoimentos, o bloco some.

- **Quando usar:** Prova social com os depoimentos aprovados da coleção, perto de uma decisão (antes do cta ou do contato).
- **Quando não usar:** Nunca escreva depoimentos: só os que a pessoa recebeu. Sem nenhum aprovado, o bloco some.
- **Combina com:** [`cases`](#cases--cases), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** `testimonials`: o bloco some com o plugin desligado
- **Lista itens de:** `testimonials` (padrão ao criar: só os destaques, 6 itens, na ordem do painel)
- **JavaScript:** pode montar uma ilha (a parte interativa, com JavaScript no navegador); o resto é HTML estático
- **Variações:** temas: `cyberpunk` (`default`, `categorias`); `padrao` (`default`, `categorias`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `allowSubmission` | Convidar a enviar depoimento | sim ou não | não | — | Mostra o botão do assistente de depoimento (precisa do plugin testimonials-intake); padrão: não |
| `cta` | Link para todos | link | não | o rótulo | Ex.: "Ver todos os depoimentos", para a página de depoimentos. Opcional |

## `faq` — Perguntas frequentes

Perguntas e respostas da coleção. Gera JSON-LD FAQPage.

- **Quando usar:** Responder dúvidas e objeções recorrentes (coleção de FAQ) em páginas de serviços, preços ou contato. Gera dados estruturados de FAQ.
- **Quando não usar:** Para conteúdo explicativo contínuo, use texto. Evite o mesmo FAQ inteiro em várias páginas.
- **Combina com:** [`servicos`](#servicos--serviços), [`precos`](#precos--preços), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Lista itens de:** `faq` (padrão ao criar: na ordem do painel)
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |

## `posts-recentes` — Posts

Posts do blog. Com quantidade vazia, lista todos (página do blog).

- **Quando usar:** Posts do blog: alguns na home, todos (quantidade vazia) na página do blog.
- **Quando não usar:** Sem o plugin blog ou sem posts publicados, não aparece. Para um aviso fixo, use texto ou a faixa de aviso do site.
- **Combina com:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** `blog`: o bloco some com o plugin desligado
- **Lista itens de:** `posts` (padrão ao criar: 3 itens, mais novos primeiro)
- **Variações:** temas: `chat` (`lista`, `destaque`); `garden` (`notas`, `lista`); `index` (`indice`, `destaque`); `magazine` (`sumario`, `colunas`); `zine` (`recortes`, `destaque`)

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `cta` | Link para o blog | link | não | o rótulo | — |
| `showTagFilter` | Filtro por etiqueta | sim ou não | não | — | padrão: não |

## `cta` — Chamada

Fechamento com um ou dois caminhos (ex.: "tenho um projeto" e "tenho uma vaga").

- **Quando usar:** Fechar uma página ou seção com uma ação clara (um ou dois botões): conversar, pedir proposta, ver planos. Um link whatsapp: abre a conversa.
- **Quando não usar:** No topo (lá vai o hero) ou vários seguidos. Logo antes de um bloco contato, costuma sobrar.
- **Combina com:** [`depoimentos`](#depoimentos--depoimentos), [`servicos`](#servicos--serviços), [`contato`](#contato--contato)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | sim | sim | até 140 caracteres |
| `body` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `primary` | Botão principal | link | sim | o rótulo | — |
| `secondary` | Botão secundário | link | não | o rótulo | — |

## `contato` — Contato

Formulário ou assistente de contato, com os canais (e-mail, WhatsApp, redes).

- **Quando usar:** Receber pedidos de contato (formulário ou assistente) e mostrar os canais: no fim da home ou na página de contato.
- **Quando não usar:** Mais de um por página. Para só um botão que leva ao contato, use cta.
- **Combina com:** [`localizacao`](#localizacao--localização), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **JavaScript:** pode montar uma ilha (a parte interativa, com JavaScript no navegador); o resto é HTML estático
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `mode` | Formato | opção | não | — | opções: `wizard` (Assistente em etapas), `form` (Formulário simples), `channels` (Só os canais, sem formulário); padrão: `wizard` |
| `showChannels` | Mostrar canais de contato | sim ou não | não | — | padrão: sim |
| `presentation` | Onde aparece | opção | não | — | Na janela, o bloco não ocupa espaço na página: abre por cima dela nos links para a âncora (#contato), inclusive os da sidebar. Os canais não aparecem; opções: `inline` (Na página), `dialog` (Numa janela, aberta pelos links para a âncora); padrão: `inline` |
| `eyebrow` | Sobretítulo | texto | não | sim | Linha curta acima do título (ex.: portfolio / contato); até 80 caracteres |
| `flows` | Assuntos do assistente | lista | não | — | Opcional, para o formato assistente. Cada assunto tem as próprias etapas; a primeira tela mostra os assuntos e o resumo para revisar vem no fim. Sem assuntos, o assistente pergunta o assunto, a mensagem e os dados; até 6 itens; cada item: "Assunto" |
| `flows[].id` | Identificador | texto | sim | não | Curto e sem espaços (ex.: projeto); até 40 caracteres |
| `flows[].emoji` | Emoji | texto | não | não | até 16 caracteres |
| `flows[].label` | Rótulo | texto | sim | sim | até 80 caracteres |
| `flows[].steps` | Etapas | lista | não | — | Sem a etapa de dados de contato, ela entra no fim; até 8 itens; cada item: "Etapa" |
| `flows[].steps[].kind` | Tipo | opção | não | — | opções: `choice` (Escolha entre opções), `text` (Texto curto), `textarea` (Texto longo (vai como mensagem)), `contact` (Dados de contato); padrão: `choice` |
| `flows[].steps[].key` | Chave da resposta | texto | não | não | Nome da resposta no pedido (ex.: prazo). Em texto curto, várias chaves separadas por vírgula viram vários campos; até 80 caracteres |
| `flows[].steps[].title` | Pergunta | texto | não | sim | até 160 caracteres |
| `flows[].steps[].options` | Opções | texto longo | não | sim | Uma por linha (tipo escolha); até 1500 caracteres |
| `flows[].steps[].placeholder` | Exemplo dentro do campo | texto longo | não | sim | Um por linha quando a etapa tem vários campos; até 400 caracteres |
| `flows[].steps[].optional` | Resposta opcional | sim ou não | não | — | padrão: não |
| `flows[].steps[].askPhone` | Pedir telefone | sim ou não | não | — | Só na etapa de dados de contato; padrão: não |
| `flows[].steps[].askLinkedin` | Pedir LinkedIn | sim ou não | não | — | Só na etapa de dados de contato; padrão: não |
| `flows[].steps[].askCompany` | Pedir empresa | sim ou não | não | — | Só na etapa de dados de contato; padrão: não |

## `galeria` — Galeria

Imagens com título e descrição: dia a dia, bastidores, espaço da empresa.

- **Quando usar:** Fotos com título e descrição (coleção de rotina): dia a dia, bastidores, o espaço da empresa.
- **Quando não usar:** Para logos, use logos-clientes; para as pessoas da equipe, equipe; para uma imagem só, texto com imagem.
- **Combina com:** [`texto`](#texto--texto), [`equipe`](#equipe--equipe)
- **Tipo de site:** pessoal e empresa
- **Plugin:** `about`, dono da coleção `routine`: o bloco some com o plugin desligado
- **Lista itens de:** `routine` (padrão ao criar: na ordem do painel)
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |

## `curriculo` — Currículo

Experiência, formação e competências da coleção, com download em PDF.

- **Quando usar:** O currículo completo (experiência, formação, competências) com PDF, em sites pessoais; costuma ficar sozinho na página de currículo.
- **Quando não usar:** Na home: lá, prefira texto e numeros com um botão para o currículo.
- **Combina com:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
- **Tipo de site:** só pessoal
- **Plugin:** `resume`: o bloco some com o plugin desligado
- **Lista itens de:** `resume` (padrão ao criar: na ordem do painel)
- **JavaScript:** pode montar uma ilha (a parte interativa, com JavaScript no navegador); o resto é HTML estático
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `showDownload` | Botão de baixar PDF | sim ou não | não | — | padrão: sim |

## `precos` — Preços

Planos da coleção lado a lado, com destaque e botão de cada um.

- **Quando usar:** Planos lado a lado em cartões (coleção de planos), na página de preços.
- **Quando não usar:** Para comparar recurso por recurso, use comparativo-planos (pode vir depois dos cartões). Não invente preços.
- **Combina com:** [`comparativo-planos`](#comparativo-planos--comparativo-de-planos), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
- **Tipo de site:** só empresa
- **Plugin:** `pricing`, dono da coleção `plans`: o bloco some com o plugin desligado
- **Lista itens de:** `plans` (padrão ao criar: na ordem do painel)
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `note` | Observação | texto longo | não | sim | Ex.: valores sem impostos; até 300 caracteres |

## `equipe` — Equipe

Pessoas da coleção, com foto, cargo e redes.

- **Quando usar:** Apresentar as pessoas da empresa (coleção de equipe), em geral na página Quem somos.
- **Quando não usar:** Para uma pessoa só, use texto com imagem; para clientes, logos-clientes ou depoimentos.
- **Combina com:** [`texto`](#texto--texto), [`linha-do-tempo`](#linha-do-tempo--linha-do-tempo), [`numeros`](#numeros--números)
- **Tipo de site:** só empresa
- **Plugin:** `team`, dono da coleção `team`: o bloco some com o plugin desligado
- **Lista itens de:** `team` (padrão ao criar: na ordem do painel)
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |

## `localizacao` — Localização

Endereço, horário e mapa a partir dos dados da empresa.

- **Quando usar:** Endereço, horário e mapa da empresa (dos dados da empresa), na página de contato.
- **Quando não usar:** Sem endereço ou atendimento presencial. Para o mapa ou a agenda de outro serviço, use incorporacao.
- **Combina com:** [`contato`](#contato--contato), [`faq`](#faq--perguntas-frequentes)
- **Tipo de site:** só empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `showMap` | Mostrar mapa | sim ou não | não | — | padrão: sim |
| `showHours` | Mostrar horário | sim ou não | não | — | padrão: sim |

## `logos-clientes` — Logos de clientes

Faixa de logos de clientes ou parceiros.

- **Quando usar:** Faixa de logos de clientes ou parceiros como prova social rápida, logo depois do hero ou perto dos cases.
- **Quando não usar:** Sem autorização para usar as marcas. Para resultados contados, use cases ou depoimentos.
- **Combina com:** [`hero`](#hero--hero), [`cases`](#cases--cases), [`depoimentos`](#depoimentos--depoimentos)
- **Tipo de site:** só empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `logos` | Logos | lista | sim | — | de 1 a 24 itens; cada item: "Logo" |
| `logos[].name` | Nome | texto | sim | não | até 80 caracteres |
| `logos[].image` | Logo | imagem | sim | o texto alternativo | — |
| `logos[].href` | Link | texto | não | não | até 300 caracteres |

## `video` — Vídeo

Vídeo do YouTube ou do Vimeo. Carrega leve: miniatura e botão de play, e o player só depois do clique.

- **Quando usar:** Um vídeo do YouTube ou do Vimeo (apresentação, demonstração, palestra), que carrega leve: miniatura e player só no clique.
- **Quando não usar:** Para agenda, mapa ou formulário de outro serviço, use incorporacao. A informação principal não deve estar só no vídeo: repita o essencial em texto.
- **Combina com:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **JavaScript:** pode montar uma ilha (a parte interativa, com JavaScript no navegador); o resto é HTML estático
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `url` | Endereço do vídeo | texto | sim | não | Link do YouTube (youtube.com/watch?v=…, youtu.be/…, /shorts/…) ou do Vimeo (vimeo.com/123456789); até 300 caracteres |
| `caption` | Legenda | texto | não | sim | Aparece abaixo do vídeo e dá nome ao botão de play e ao player para leitores de tela. Sem ela, vale o título; até 200 caracteres |
| `poster` | Miniatura própria | imagem | não | o texto alternativo | Opcional no YouTube (sem ela, usa a miniatura do vídeo). No Vimeo, sem imagem aparece só o botão de play |
| `aspect` | Proporção | opção | não | — | opções: `16:9` (16:9 (paisagem)), `4:3` (4:3), `1:1` (1:1 (quadrado)), `9:16` (9:16 (vertical, Shorts e Reels)); padrão: `16:9` |

## `incorporacao` — Incorporação

Agenda, formulário, mapa ou player de outro serviço, por endereço, só dos provedores permitidos (Calendly, Cal.com, Google Agenda, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma).

- **Quando usar:** Agenda, formulário, mapa ou player de um provedor permitido (ex.: Calendly, Google Maps), pelo endereço de incorporação.
- **Quando não usar:** Para vídeo do YouTube ou do Vimeo, use video (mais leve); para receber contatos no site, contato. Provedor fora da lista é recusado.
- **Combina com:** [`texto`](#texto--texto), [`contato`](#contato--contato), [`cta`](#cta--chamada)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `url` | Endereço da incorporação | texto | sim | não | O link do "incorporar" (embed) do serviço: o endereço do src, não o código HTML. Provedores aceitos: Calendly, Cal.com, Google Agenda, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma; até 2000 caracteres |
| `frameTitle` | Título acessível | texto | sim | sim | Descreve o conteúdo para leitores de tela (ex.: "Agenda para marcar uma conversa"); até 120 caracteres |
| `height` | Altura (px) | número | não | — | Opcional. Sem ela, vale a altura padrão do provedor; de 150 a 2000; inteiro |
| `showLink` | Link para abrir em nova aba | sim ou não | não | — | Mostra, abaixo, um link para abrir o serviço fora do site; padrão: sim |

## `linha-do-tempo` — Linha do tempo

Marcos em ordem: história da empresa, trajetória, etapas de um projeto.

- **Quando usar:** Marcos em ordem, com data: a história da empresa, uma trajetória, as etapas de um projeto ou de um processo com prazos.
- **Quando não usar:** Para itens sem ordem nem data (valores, diferenciais), use lista-itens; para o currículo inteiro, curriculo.
- **Combina com:** [`texto`](#texto--texto), [`equipe`](#equipe--equipe), [`numeros`](#numeros--números)
- **Tipo de site:** pessoal e empresa
- **Plugin:** nenhum: sempre disponível
- **Variações:** componente padrão do núcleo: `vertical`, `horizontal`

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `items` | Marcos | lista | sim | — | de 1 a 16 itens; cada item: "Marco" |
| `items[].date` | Data | texto | sim | sim | Texto livre: 2019, mar. 2021, Hoje; até 40 caracteres |
| `items[].title` | Título | texto | sim | sim | até 120 caracteres |
| `items[].body` | Texto | texto longo | não | sim | até 600 caracteres |
| `items[].image` | Imagem | imagem | não | o texto alternativo | — |

## `comparativo-planos` — Comparativo de planos

Tabela que compara os planos da coleção item a item (linhas = recursos, colunas = planos), com o botão de cada plano.

- **Quando usar:** Tabela que compara os planos recurso a recurso, na página de preços, quando a diferença entre eles está nos detalhes.
- **Quando não usar:** Com um ou dois planos simples, precos basta. Não invente recursos nem valores.
- **Combina com:** [`precos`](#precos--preços), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
- **Tipo de site:** só empresa
- **Plugin:** `pricing`: o bloco some com o plugin desligado
- **Lista itens de:** `plans` (padrão ao criar: na ordem do painel)
- **Variações:** nenhuma: um desenho só em cada tema

| Campo | Rótulo no painel | Tipo | Obrigatório | Traduzível | Ajuda e limites |
|---|---|---|---|---|---|
| `anchor` | Âncora | texto | não | não | Identificador para links na página (#contato). Opcional; até 40 caracteres |
| `title` | Título | texto | não | sim | até 140 caracteres |
| `intro` | Texto de apoio | texto longo | não | sim | até 400 caracteres |
| `caption` | Legenda da tabela | texto | não | sim | Resumo da tabela para leitores de tela (e visível acima dela). Sem ela, vale o título, só para leitores de tela; até 160 caracteres |
| `rows` | Recursos | lista | sim | — | de 1 a 40 itens; cada item: "Recurso" |
| `rows[].label` | Recurso | texto | sim | sim | até 120 caracteres |
| `rows[].detail` | Detalhe | texto | não | sim | até 200 caracteres |
| `rows[].cells` | Planos | lista | não | — | Um valor por plano, na ordem das colunas (a mesma da lista de planos do bloco). Plano sem valor fica com um traço; até 8 itens; cada item: "Plano" |
| `rows[].cells[].value` | Valor | opção | não | — | opções: `sim` (✓ Incluso), `nao` (✗ Não incluso), `texto` (Texto); padrão: `sim` |
| `rows[].cells[].text` | Texto | texto | não | sim | Para o valor "Texto" (ex.: até 5, ilimitado); até 60 caracteres |
| `note` | Observação | texto longo | não | sim | até 300 caracteres |
