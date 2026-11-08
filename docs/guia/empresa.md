# Site de empresa

O Rubrica tem duas linhas: **pessoal**, para o portfólio de uma pessoa, e **empresa**, para o site de um negócio. A linha de empresa foi pensada para **agências e freelancers** que criam e mantêm o site de um cliente: quem cria cuida da parte técnica, e o cliente usa só o painel.

O núcleo, os temas, o painel e a publicação são os mesmos nas duas. O que muda são as páginas que vêm prontas, alguns blocos e plugins e os dados de quem é dono do site.

## Criar um site de empresa

```bash
npx create-rubrica@latest meu-site --tipo empresa
```

Ou rode sem o `--tipo` e escolha **Empresa** quando o CLI perguntar o tipo de site. No [combinador do site](https://userubrica.vercel.app/#combinador) dá para ver qualquer tema com o conteúdo de exemplo de uma empresa.

Um site que já existe também pode trocar de tipo com `npx create-rubrica config --tipo empresa`. As páginas que você já tem continuam lá; os blocos que são só do tipo pessoal (como o currículo) deixam de aparecer.

## O que muda em relação ao pessoal

| | Pessoal | Empresa |
|---|---|---|
| Páginas que vêm prontas | Início, Sobre, Currículo, Portfólio, Blog, Depoimentos | Início, Quem somos, Serviços, Preços, Cases, Blog, Contato |
| Blocos só deste tipo | Currículo | Preços, Equipe, Localização, Logos de clientes |
| Plugins só deste tipo | Currículo, Dia a dia, Currículo por vaga com IA | Preços e planos, Equipe |
| Quem é o dono do site | Uma **pessoa** (nome, cargo, foto) | Uma **empresa** (razão social, CNPJ, endereço, horário) |
| Para o Google | Dados de pessoa (`Person`) | Dados de empresa (`Organization` ou `LocalBusiness`) |

Os dois tipos também têm a página de **Privacidade**, que o Rubrica gera a partir dos dados do site e dos plugins ligados. Todas as páginas são páginas comuns: dá para editar, reordenar os blocos, apagar ou criar outras no painel. Veja [Conteúdo e painel](./conteudo.md).

## As páginas prontas

As páginas vêm montadas com blocos e textos de exemplo, para você trocar pelos do cliente. A montagem exata depende do tema (um tema pode trazer a sua própria); no tema padrão, é assim:

| Página | Blocos |
|---|---|
| Início | Abertura, serviços, números, cases, depoimentos e uma chamada para o contato |
| Quem somos | A história da empresa, números, valores e a equipe |
| Serviços | Serviços, perguntas frequentes e uma chamada para pedir proposta |
| Preços | Planos e perguntas sobre os planos |
| Cases | Os projetos, cada um com a sua página de case |
| Blog | Os posts, com filtro por etiqueta |
| Contato | O assistente de contato e a localização (endereço, horário e mapa) |

## Blocos de empresa

| Bloco | Para quê |
|---|---|
| Preços (`precos`) | Os planos lado a lado, com destaque e o botão de cada um |
| Equipe (`equipe`) | As pessoas da empresa, com foto, cargo e redes |
| Localização (`localizacao`) | Endereço, horário e mapa, tirados dos dados da empresa |
| Logos de clientes (`logos-clientes`) | Uma faixa com os logos de clientes ou parceiros |

## Planos, equipe e dados da empresa

- **Planos** (tela **Planos**, plugin Preços e planos): nome, preço, período, itens incluídos, destaque e um botão. O botão pode levar ao checkout (com o plugin Pagamentos), ao assistente de contato ou a um link.
- **Equipe** (tela **Equipe**, plugin Equipe): nome, cargo, uma bio curta, foto e links.
- **Dados da empresa** (tela **Configurações**, parte **Empresa**): razão social, CNPJ, e-mail, telefone, WhatsApp, endereço, horário de funcionamento, link do mapa e o tipo de negócio. Esses dados aparecem no rodapé, no bloco de localização e na política de privacidade, e viram as informações que o Google lê sobre a empresa.

## Papéis: agência e cliente

O painel mostra a cada pessoa só o que o papel dela pode mexer. Num site de empresa, o jeito comum de usar é:

| Papel | Quem costuma ser | O que faz |
|---|---|---|
| `root` | A agência ou o freelancer | Tudo, inclusive usuários, registro de atividades e a configuração técnica (tipo do site, endereço, idiomas, tema) |
| `admin` | O dono da empresa | Todo o conteúdo, os contatos, as propostas e as configurações, sem mexer na parte da agência |
| `content-editor` e `blog-editor` | Quem cuida do site ou escreve | Páginas, coleções e mídia, ou só o blog |
| `comercial` | Atendimento e vendas | Propostas, contratos, checkouts, contatos e planos |
| `proposal-editor` | Quem só faz propostas | Somente propostas |

O primeiro usuário, criado no `setup`, é o `root`. Os outros você cria na tela **Usuários**. A lista completa está em [Conteúdo e painel](./conteudo.md#papéis).

## As contas do cliente

O site usa contas na **Vercel** (onde o site fica no ar) e no **Convex** (o banco), e às vezes em serviços como Asaas, OpenRouter ou Resend. O Rubrica não escolhe por você em nome de quem elas ficam. Os dois jeitos mais comuns:

- **Contas no nome do cliente**, com a agência convidada como membro. O cliente paga e é dono de tudo desde o começo; se a parceria acabar, basta tirar a agência das contas.
- **Contas da agência**, transferidas para o cliente se ele sair. Mais simples no começo, mas a saída dá mais trabalho.

Em qualquer um dos dois, combine com o cliente:

- **quem paga** a Vercel e o Convex (os planos gratuitos costumam bastar para começar);
- **quem é o `root`** do painel: se a agência sair, o cliente precisa de um `root` próprio;
- **que chaves trocar na saída**: a senha do `root` da agência, a chave de deploy do Convex usada pela Vercel e as chaves dos serviços ligados (Asaas, OpenRouter, Telegram, Resend). As variáveis estão em [Variáveis de ambiente](./variaveis.md).
