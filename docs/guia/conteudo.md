# Conteúdo e painel

Tudo o que aparece no site é **conteúdo**, guardado no Convex e editado no painel (`/admin`). O código do projeto só muda quando você quer outro visual ou outro comportamento.

Duas ideias organizam o conteúdo: **páginas feitas de blocos** e **coleções** de itens que se repetem.

## Páginas e blocos

Uma página tem um endereço (`/`, `/sobre`, `/servicos`), um título, o SEO (título, descrição e imagem de compartilhamento, por idioma) e uma **lista ordenada de blocos**. Cada bloco é uma seção: abertura, texto, números, serviços, depoimentos, perguntas frequentes, chamada para ação, contato e assim por diante.

Em **Páginas**, no painel, você:

- cria uma página nova e escolhe os blocos;
- reordena os blocos, liga e desliga (o bloco oculto fica guardado, sem aparecer no site);
- edita os campos de cada bloco num formulário, com **prévia ao vivo** do tema ao lado, em largura de celular ou de desktop;
- salva como **rascunho** ou publica.

As páginas da home, do sobre e do contato não são especiais: vêm montadas pela receita do tema na criação do site e se editam como qualquer outra.

### Catálogo de blocos

| Bloco | Para quê |
|---|---|
| `hero` | Abertura da página: título, chamada, botões e foto. É o `h1` da página |
| `texto` | Título e texto livre |
| `numeros` | Números de destaque |
| `lista-itens` | Lista com título e descrição (princípios, valores, etapas) |
| `cases` | Projetos ou cases, vindos da coleção |
| `servicos` | Serviços, da coleção |
| `depoimentos` | Depoimentos aprovados, com o envio de novos |
| `faq` | Perguntas frequentes |
| `posts-recentes` | Últimos posts do blog |
| `cta` | Chamada para ação com dois botões |
| `contato` | Assistente de contato, canais e endereço |
| `galeria` | Galeria de imagens (o dia a dia) |
| `curriculo` | Currículo (só no tipo pessoal) |
| `precos` | Planos e preços (só no tipo empresa) |
| `equipe` | Pessoas da equipe (só no tipo empresa) |
| `localizacao` | Endereço e mapa (só no tipo empresa) |
| `logos-clientes` | Logos de clientes (só no tipo empresa) |

Cada bloco que lista itens aponta para uma coleção com filtro, ordem e quantidade, em vez de copiar os itens. Alguns blocos têm **variações** com nome (por exemplo, `cases` em grade ou em lista); o painel mostra só as variações do tema em uso.

Um bloco novo que o Rubrica lançar aparece em todos os temas com a versão padrão do núcleo, até o tema desenhar a dele. Precisa de um bloco que não existe? Veja [Blocos próprios e ejetados](./temas.md#blocos-próprios-e-componentes-ejetados).

## Coleções

Coleções são listas de itens com campos fixos, cada uma com a sua tela no painel:

| Coleção | Tipo de site | O que guarda |
|---|---|---|
| Posts | os dois | Artigos do blog, com capa, tags, SEO e tradução |
| Projetos e cases | os dois | Projetos, com a página de case |
| Serviços | os dois | O que você ou a empresa oferece |
| Depoimentos | os dois | Depoimentos, publicados ou pendentes de aprovação |
| FAQ | os dois | Perguntas e respostas |
| Currículo e dia a dia | pessoal | Experiência, formação, competências, rotina |
| Planos | empresa | Nome, preço, período, itens, destaque e botão |
| Equipe | empresa | Foto, nome, cargo, bio curta e redes |

Na linha de empresa também há os **dados da empresa** (razão social, CNPJ, endereço, horário, telefone, WhatsApp, mapa), um registro único que gera o rodapé e o dado estruturado `Organization`/`LocalBusiness` para o Google.

## Outras telas do painel

- **Aparência:** esquema de cores, modo, fontes e tokens do tema. Veja [Temas](./temas.md).
- **Configurações:** identidade, endereço, navegação, redes sociais, SEO, ícones.
- **Textos:** os textos de interface (menu, "ler mais", formulários, 404), por idioma. Os títulos e botões de cada seção não estão aqui: são campos do bloco.
- **Mídia:** biblioteca de imagens.
- **Contatos, Propostas, Contratos, Pagamentos:** o lado comercial, quando os plugins estão ligados.
- **Plugins:** liga e desliga recursos. Veja abaixo.
- **Privacidade (LGPD):** política de privacidade gerada a partir dos dados da empresa e dos plugins ligados, e a exportação ou exclusão dos dados de um titular.
- **Usuários e atividade:** só para o `root`.

## Plugins

Cada recurso opcional é um plugin que o painel liga e desliga: assistente de contato, propostas, modelos de contrato, pagamentos, blog, projetos, currículo, dia a dia, depoimentos, envio de depoimentos, tradução com IA, currículo por vaga com IA, analytics (Umami), registro de atividades e biblioteca de mídia. No tipo empresa entram também **preços** e **equipe**. Desligado, o recurso some do site e do menu do painel. Os plugins que precisam de uma chave de serviço externo estão em [Integrações](./integracoes.md).

## Papéis

Cada usuário do painel tem um papel, e o painel mostra só o que o papel pode mexer.

| Papel | Para quem | O que faz |
|---|---|---|
| `root` | A agência ou quem mantém o site | Tudo, inclusive usuários, registro de atividades, restaurar da lixeira e a configuração técnica (tipo do site, endereço, idiomas, tema) |
| `admin` | O dono da empresa ou do portfólio | Todo o conteúdo, os contatos, as propostas e as configurações, sem gerenciar a agência |
| `content-editor` | Quem cuida do site no dia a dia | Páginas, coleções, textos e mídia |
| `blog-editor` | Quem escreve | Posts do blog e mídia |
| `comercial` | Atendimento e vendas | Propostas, contratos, checkouts, contatos e planos |
| `proposal-editor` | Quem só faz propostas | Somente propostas |

O primeiro usuário, criado no `setup`, é o `root`. Crie os outros em **Usuários**. A regra vale no backend, não só na tela: quem não tem o papel não consegue a operação nem por outra via.

## Publicar uma mudança

Salvar no painel grava no Convex na hora, e o site estático **só muda no próximo build**. O botão **Publicar** do painel dispara o build na hospedagem (o deploy hook). Veja [Publicar o site](./publicar.md).
