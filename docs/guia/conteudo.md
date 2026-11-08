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

O [catálogo de blocos](./blocos.md) lista todos os blocos, com para que serve cada um, os campos, as variações e o plugin de que dependem. Ele é gerado do código do núcleo, então está sempre em dia.

Cada bloco que lista itens aponta para uma coleção com filtro, ordem e quantidade, em vez de copiar os itens. Alguns blocos têm **variações** com nome (por exemplo, `cases` em grade ou em lista); o painel mostra só as variações do tema em uso.

Um bloco novo que o Rubrica lançar aparece em todos os temas com a versão padrão do núcleo, até o tema desenhar a dele. Precisa de um bloco que não existe? Veja [Criar um bloco](./criar-bloco.md).

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
- **Configurações:** identidade, endereço, navegação, redes sociais, SEO, ícones, [WhatsApp e faixa de aviso](#whatsapp-e-faixa-de-aviso).
- **Textos:** os textos de interface (menu, "ler mais", formulários, 404), por idioma. Os títulos e botões de cada seção não estão aqui: são campos do bloco.
- **Mídia:** biblioteca de imagens.
- **Contatos, Propostas, Contratos, Pagamentos:** o lado comercial, quando os plugins estão ligados.
- **Plugins:** liga e desliga recursos. Veja abaixo.
- **Privacidade (LGPD):** política de privacidade gerada a partir dos dados da empresa e dos plugins ligados, e a exportação ou exclusão dos dados de um titular.
- **Usuários e atividade:** só para o `root`.

## WhatsApp e faixa de aviso

Dois recursos valem para o **site inteiro**, nos dois tipos de site, e ficam em **Configurações** (com prévia da página inicial, antes de salvar). Os 14 temas mostram os dois sem nenhum ajuste.

### WhatsApp

- **Número:** em formato internacional, com DDI e DDD (`+55 11 91234-5678`). O painel aceita espaços, parênteses e traços e guarda só os dígitos.
- **Mensagem inicial** (por idioma): já vem escrita quando a conversa abre. Sem tradução num idioma, a conversa abre em branco nele.
- **Botão flutuante:** liga um botão no canto de baixo de todas as páginas (menos proposta e checkout), que abre a conversa em outra aba. Não usa JavaScript, respeita quem pede menos movimento e não cobre a troca de tema nem o menu do tema.
- **Texto do botão** (por idioma, opcional): aparece ao lado do ícone em telas largas. Vazio, fica só o ícone, com o nome acessível "Conversar comigo no WhatsApp" (ou "Fale conosco no WhatsApp" no site de empresa), que você muda em **Textos** (`whatsapp.float`).

**Em qualquer botão ou link**, use o endereço `whatsapp:` no lugar de uma URL: ele vira o link do WhatsApp do site com a mensagem inicial do idioma. Para uma mensagem própria, escreva depois dos dois-pontos: `whatsapp:Quero o plano Pro`. Vale nos botões dos blocos, nos planos, no menu e no link da faixa de aviso. Sem número configurado, o link `whatsapp:` não aparece (o botão some, em vez de levar a lugar nenhum). Se o WhatsApp não foi configurado aqui, o `whatsapp:` usa o WhatsApp dos dados da empresa.

No site de empresa, o número também entra nos dados estruturados da organização (`contactPoint`), para o Google.

### Faixa de aviso

Uma linha no topo de todas as páginas (menos proposta e checkout, que são o fluxo de uma pessoa só): agenda aberta, promoção, mudança de horário.

- **Texto** (por idioma, até 200 caracteres). Sem texto num idioma, a faixa **não aparece** nele: não cai no idioma principal.
- **Link** opcional, depois do texto (`/contato`, `https://…` ou `whatsapp:`). Sem rótulo num idioma, a faixa aparece sem o link.
- **Estilo:** discreto (cores de cartão) ou destaque (cor principal do tema). Os dois passam o contraste AA em todos os esquemas e nos dois modos.
- **Começa em / Termina em** (opcionais): `AAAA-MM-DD`, que vale o dia inteiro em UTC (21h do dia anterior em Brasília), ou data e hora com fuso, `2026-12-01T09:00-03:00`.

O período é avaliado **na publicação**, porque o site é estático: o aviso só entra ou sai do ar no primeiro build depois da data. Para um aviso que precisa sair na hora certa, publique o site nesse momento.

## Plugins

Cada recurso opcional é um plugin que o painel liga e desliga: assistente de contato, propostas, modelos de contrato, pagamentos, blog, projetos, currículo, dia a dia, depoimentos, envio de depoimentos, tradução com IA, currículo por vaga com IA, analytics (Umami), registro de atividades e biblioteca de mídia. No tipo empresa entram também **preços** e **equipe**. Desligado, o recurso some do site e do menu do painel. Os plugins que precisam de uma chave de serviço externo estão em [Integrações](./integracoes.md). O que cada um faz, em qual tipo de site e como começa está em [Plugins](./plugins.md).

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

Na tela **Usuários**, o `root` também:

- **Reinicia a senha** de alguém, sem e-mail. O painel gera uma senha temporária e mostra uma vez só, para você passar à pessoa. Ela sai de todas as sessões abertas e cria uma senha nova no próximo acesso. A sua própria senha você troca em **Minha conta**. Se ninguém consegue entrar, use `npx create-rubrica senha` no terminal.
- **Suspende** o acesso: a pessoa sai do painel na hora, e o papel e o histórico ficam guardados. **Reativar** devolve o mesmo papel.
- **Exclui** a conta de vez: apaga o login e o papel. Para só tirar o acesso, prefira suspender.

Quem está com senha temporária não consegue fazer nada antes de trocá-la, nem pelo painel nem pelo MCP.

## Publicar uma mudança

Salvar no painel grava no Convex na hora, e o site estático **só muda no próximo build**. O botão **Publicar** do painel dispara o build na hospedagem (o deploy hook). Veja [Publicar o site](./publicar.md).
