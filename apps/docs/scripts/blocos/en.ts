/**
 * Inglês das descrições e ajudas do catálogo de blocos (que no código estão em português).
 * A chave é o texto em português, exatamente como no código: se ele mudar, a versão em
 * inglês volta a mostrar o português até alguém traduzir aqui. Os rótulos do painel não
 * entram: o painel é em português e a documentação em inglês mostra os rótulos como são.
 */
export const EN: Record<string, string> = {
  // Descrições dos blocos
  "Primeira dobra: título principal, apoio, botões e imagem. Leva o h1 quando é o primeiro bloco da página.":
    "Opening section: main title, supporting text, buttons and image. Carries the h1 when it is the page's first block.",
  "Título e texto livre, com imagem opcional ao lado.": "Title and free text, with an optional image beside it.",
  "Números em destaque (anos de experiência, clientes, projetos).": "Highlighted numbers (years of experience, clients, projects).",
  "Itens com título e texto: princípios de trabalho, valores, diferenciais, etapas.":
    "Items with a title and text: working principles, values, differentiators, steps.",
  "Projetos ou cases da coleção, com link para a página de cada um. Mostra os destaques; sem nenhum, os primeiros da lista. Sem projetos, o bloco some.":
    "Projects or cases from the collection, linking to each one's page. Shows the featured ones; with none featured, the first in the list. With no projects, the block disappears.",
  "Serviços da coleção.": "Services from the collection.",
  "Depoimentos aprovados da coleção, com convite opcional para enviar um novo. Mostra os destaques; sem nenhum, os primeiros da lista. Sem depoimentos, o bloco some.":
    "Approved testimonials from the collection, with an optional invitation to send a new one. Shows the featured ones; with none featured, the first in the list. With no testimonials, the block disappears.",
  "Perguntas e respostas da coleção. Gera JSON-LD FAQPage.": "Questions and answers from the collection. Outputs FAQPage JSON-LD.",
  "Posts do blog. Com quantidade vazia, lista todos (página do blog).": "Blog posts. With an empty quantity, lists them all (the blog page).",
  'Fechamento com um ou dois caminhos (ex.: "tenho um projeto" e "tenho uma vaga").':
    'Closing call with one or two paths (e.g. "I have a project" and "I have a role").',
  "Formulário ou assistente de contato, com os canais (e-mail, WhatsApp, redes).":
    "Contact form or wizard, with the channels (e-mail, WhatsApp, social).",
  "Imagens com título e descrição: dia a dia, bastidores, espaço da empresa.":
    "Images with a title and description: day to day, behind the scenes, the company's space.",
  "Experiência, formação e competências da coleção, com download em PDF.": "Experience, education and skills from the collection, with a PDF download.",
  "Planos da coleção lado a lado, com destaque e botão de cada um.": "Plans from the collection side by side, each with its highlight and button.",
  "Pessoas da coleção, com foto, cargo e redes.": "People from the collection, with photo, role and social links.",
  "Endereço, horário e mapa a partir dos dados da empresa.": "Address, opening hours and map from the company details.",
  "Faixa de logos de clientes ou parceiros.": "A strip of client or partner logos.",

  // Ajudas dos campos
  "Identificador para links na página (#contato). Opcional.": "Identifier for links within the page (#contact). Optional.",
  "Ex.: 10+, 98%, R$ 2 mi": "E.g. 10+, 98%, $2M",
  "Nome de um ícone do Lucide (ex.: rocket).": "Name of a Lucide icon (e.g. rocket).",
  "Mostra o botão do assistente de depoimento (precisa do plugin testimonials-intake).":
    "Shows the testimonial wizard button (needs the testimonials-intake plugin).",
  'Ex.: "Ver todos os depoimentos", para a página de depoimentos. Opcional.': 'E.g. "See all testimonials", to the testimonials page. Optional.',
  "Ex.: valores sem impostos.": "E.g. prices before tax.",
  // Contato: janela e assuntos do assistente
  "Na janela, o bloco não ocupa espaço na página: abre por cima dela nos links para a âncora (#contato), inclusive os da sidebar. Os canais não aparecem.":
    "In a window, the block takes no space on the page: it opens over it from links to the anchor (#contato), the sidebar's included. The channels are not shown.",
  "Linha curta acima do título (ex.: portfolio / contato).": "A short line above the title (e.g. portfolio / contact).",
  "Opcional, para o formato assistente. Cada assunto tem as próprias etapas; a primeira tela mostra os assuntos e o resumo para revisar vem no fim. Sem assuntos, o assistente pergunta o assunto, a mensagem e os dados.":
    "Optional, for the wizard format. Each topic has its own steps; the first screen lists the topics and a summary to review comes at the end. With no topics, the wizard asks for the topic, the message and the details.",
  "Curto e sem espaços (ex.: projeto).": "Short and without spaces (e.g. project).",
  "Sem a etapa de dados de contato, ela entra no fim.": "Without a contact details step, one is added at the end.",
  "Nome da resposta no pedido (ex.: prazo). Em texto curto, várias chaves separadas por vírgula viram vários campos.":
    "Name of the answer in the request (e.g. timeline). In short text, several comma-separated keys become several inputs.",
  "Uma por linha (tipo escolha).": "One per line (choice type).",
  "Um por linha quando a etapa tem vários campos.": "One per line when the step has several inputs.",
  "Só na etapa de dados de contato.": "Only in the contact details step.",
  "Campo que filtra os posts pelo título, resumo e etiquetas (página do blog).":
    "A field that filters the posts by title, summary and tags (the blog page).",
  "Os posts marcados como destaque num carrossel acima da lista, nos temas que o desenham (página do blog).":
    "The posts marked as featured in a carousel above the list, in the themes that draw it (the blog page).",
  // Blocos da 1.1 do contrato (vídeo, incorporação, linha do tempo, comparativo de planos)
  "Vídeo do YouTube ou do Vimeo. Carrega leve: miniatura e botão de play, e o player só depois do clique.":
    "A YouTube or Vimeo video. Loads light: a thumbnail and a play button, and the player only after the click.",
  "Link do YouTube (youtube.com/watch?v=…, youtu.be/…, /shorts/…) ou do Vimeo (vimeo.com/123456789).":
    "A YouTube link (youtube.com/watch?v=…, youtu.be/…, /shorts/…) or a Vimeo link (vimeo.com/123456789).",
  "Aparece abaixo do vídeo e dá nome ao botão de play e ao player para leitores de tela. Sem ela, vale o título.":
    "Shown below the video and names the play button and the player for screen readers. Without it, the title is used.",
  "Opcional no YouTube (sem ela, usa a miniatura do vídeo). No Vimeo, sem imagem aparece só o botão de play.":
    "Optional on YouTube (without it, the video's thumbnail is used). On Vimeo, without an image only the play button shows.",
  "Agenda, formulário, mapa ou player de outro serviço, por endereço, só dos provedores permitidos (Calendly, Cal.com, Google Agenda, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma).":
    "A calendar, form, map or player from another service, by address, only from the allowed providers (Calendly, Cal.com, Google Calendar, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma).",
  "O link do \"incorporar\" (embed) do serviço: o endereço do src, não o código HTML. Provedores aceitos: Calendly, Cal.com, Google Agenda, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma.":
    "The service's embed link: the src address, not the HTML code. Accepted providers: Calendly, Cal.com, Google Calendar, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma.",
  "Descreve o conteúdo para leitores de tela (ex.: \"Agenda para marcar uma conversa\").":
    "Describes the content for screen readers (e.g. \"Calendar to book a call\").",
  "Opcional. Sem ela, vale a altura padrão do provedor.":
    "Optional. Without it, the provider's default height is used.",
  "Mostra, abaixo, um link para abrir o serviço fora do site.":
    "Shows a link below to open the service outside the site.",
  "Marcos em ordem: história da empresa, trajetória, etapas de um projeto.":
    "Milestones in order: the company's history, a career path, the stages of a project.",
  "Texto livre: 2019, mar. 2021, Hoje.":
    "Free text: 2019, Mar 2021, Today.",
  "Tabela que compara os planos da coleção item a item (linhas = recursos, colunas = planos), com o botão de cada plano.":
    "A table that compares the collection's plans item by item (rows = features, columns = plans), with each plan's button.",
  "Resumo da tabela para leitores de tela (e visível acima dela). Sem ela, vale o título, só para leitores de tela.":
    "A summary of the table for screen readers (and shown above it). Without it, the title is used, for screen readers only.",
  "Um valor por plano, na ordem das colunas (a mesma da lista de planos do bloco). Plano sem valor fica com um traço.":
    "One value per plan, in column order (the same as the block's plan list). A plan with no value shows a dash.",
  "Para o valor \"Texto\" (ex.: até 5, ilimitado).":
    "For the \"Text\" value (e.g. up to 5, unlimited).",
  // Orientação de uso dos blocos (guidance, contrato 1.2)
  "Abertura da página: o primeiro bloco, com a promessa principal (leva o h1), um apoio curto e um ou dois botões. Um por página.":
    "The page's opening: the first block, with the main promise (it carries the h1), short supporting text and one or two buttons. One per page.",
  "Fora do topo ou repetido na página. Para um chamado no meio ou no fim, use cta; para explicar com parágrafos, texto.":
    "Away from the top or repeated on the page. For a call to action in the middle or at the end, use cta; to explain in paragraphs, texto.",
  "Explicar com parágrafos: história, sobre, abordagem, uma política. Aceita uma imagem ao lado.":
    "Explaining in paragraphs: a story, an about section, an approach, a policy. Takes an image beside it.",
  "Para itens paralelos (valores, etapas, diferenciais), use lista-itens; para marcos com data, linha-do-tempo; para números, numeros. Nunca ponha h1 no corpo.":
    "For parallel items (values, steps, differentiators), use lista-itens; for dated milestones, linha-do-tempo; for numbers, numeros. Never put an h1 in the body.",
  "Três ou quatro números concretos que dão prova rápida (anos, clientes, projetos), logo depois do hero ou de um texto.":
    "Three or four concrete numbers that give quick proof (years, clients, projects), right after the hero or a text.",
  "Sem números reais que a pessoa confirmou (não invente). Muitos números diluem o destaque: até quatro é o ideal.":
    "Without real numbers the person has confirmed (don't make them up). Too many numbers dilute the highlight: up to four is ideal.",
  "Itens paralelos com título e texto curto: princípios, valores, diferenciais, etapas de um processo (numerados).":
    "Parallel items with a title and short text: principles, values, differentiators, the steps of a process (numbered).",
  "Para marcos com data, use linha-do-tempo; para serviços com página própria, servicos; para perguntas e respostas, faq.":
    "For dated milestones, use linha-do-tempo; for services with their own page, servicos; for questions and answers, faq.",
  "Mostrar trabalhos feitos (coleção de projetos): os destaques na home, a lista inteira na página de portfólio ou de cases.":
    "Showing work done (projects collection): the featured ones on the home page, the whole list on the portfolio or cases page.",
  "Sem projetos cadastrados o bloco some: crie os projetos antes. Para só mostrar marcas atendidas, logos-clientes.":
    "With no projects the block disappears: create the projects first. To only show brands served, logos-clientes.",
  "Listar o que é oferecido (coleção de serviços): um resumo na home, a lista completa na página de serviços.":
    "Listing what is offered (services collection): a summary on the home page, the full list on the services page.",
  "Para preços, use precos ou comparativo-planos; para o jeito de trabalhar em etapas, lista-itens ou linha-do-tempo.":
    "For prices, use precos or comparativo-planos; for a step-by-step way of working, lista-itens or linha-do-tempo.",
  "Prova social com os depoimentos aprovados da coleção, perto de uma decisão (antes do cta ou do contato).":
    "Social proof with the collection's approved testimonials, close to a decision (before the cta or the contact).",
  "Nunca escreva depoimentos: só os que a pessoa recebeu. Sem nenhum aprovado, o bloco some.":
    "Never write testimonials: only the ones the person received. With none approved, the block disappears.",
  "Responder dúvidas e objeções recorrentes (coleção de FAQ) em páginas de serviços, preços ou contato. Gera dados estruturados de FAQ.":
    "Answering recurring questions and objections (FAQ collection) on services, pricing or contact pages. Outputs FAQ structured data.",
  "Para conteúdo explicativo contínuo, use texto. Evite o mesmo FAQ inteiro em várias páginas.":
    "For continuous explanatory content, use texto. Avoid the same full FAQ on several pages.",
  "Posts do blog: alguns na home, todos (quantidade vazia) na página do blog.":
    "Blog posts: a few on the home page, all of them (empty quantity) on the blog page.",
  "Sem o plugin blog ou sem posts publicados, não aparece. Para um aviso fixo, use texto ou a faixa de aviso do site.":
    "Without the blog plugin or published posts, it does not show. For a fixed notice, use texto or the site's announcement bar.",
  "Fechar uma página ou seção com uma ação clara (um ou dois botões): conversar, pedir proposta, ver planos. Um link whatsapp: abre a conversa.":
    "Closing a page or section with a clear action (one or two buttons): talk, request a proposal, see plans. A whatsapp: link opens the chat.",
  "No topo (lá vai o hero) ou vários seguidos. Logo antes de um bloco contato, costuma sobrar.":
    "At the top (that's the hero's place) or several in a row. Right before a contato block, it is usually redundant.",
  "Receber pedidos de contato (formulário ou assistente) e mostrar os canais: no fim da home ou na página de contato.":
    "Receiving contact requests (form or wizard) and showing the channels: at the end of the home page or on the contact page.",
  "Mais de um por página. Para só um botão que leva ao contato, use cta.":
    "More than one per page. For just a button that leads to contact, use cta.",
  "Fotos com título e descrição (coleção de rotina): dia a dia, bastidores, o espaço da empresa.":
    "Photos with a title and description (routine collection): day to day, behind the scenes, the company's space.",
  "Para logos, use logos-clientes; para as pessoas da equipe, equipe; para uma imagem só, texto com imagem.":
    "For logos, use logos-clientes; for the team's people, equipe; for a single image, texto with an image.",
  "O currículo completo (experiência, formação, competências) com PDF, em sites pessoais; costuma ficar sozinho na página de currículo.":
    "The full résumé (experience, education, skills) with a PDF, on personal sites; it usually stands alone on the résumé page.",
  "Na home: lá, prefira texto e numeros com um botão para o currículo.":
    "On the home page: there, prefer texto and numeros with a button to the résumé.",
  "Planos lado a lado em cartões (coleção de planos), na página de preços.":
    "Plans side by side as cards (plans collection), on the pricing page.",
  "Para comparar recurso por recurso, use comparativo-planos (pode vir depois dos cartões). Não invente preços.":
    "To compare feature by feature, use comparativo-planos (it can follow the cards). Don't make up prices.",
  "Apresentar as pessoas da empresa (coleção de equipe), em geral na página Quem somos.":
    "Introducing the company's people (team collection), usually on the About us page.",
  "Para uma pessoa só, use texto com imagem; para clientes, logos-clientes ou depoimentos.":
    "For a single person, use texto with an image; for clients, logos-clientes or depoimentos.",
  "Endereço, horário e mapa da empresa (dos dados da empresa), na página de contato.":
    "The company's address, opening hours and map (from the company details), on the contact page.",
  "Sem endereço ou atendimento presencial. Para o mapa ou a agenda de outro serviço, use incorporacao.":
    "Without an address or in-person service. For another service's map or calendar, use incorporacao.",
  "Faixa de logos de clientes ou parceiros como prova social rápida, logo depois do hero ou perto dos cases.":
    "A strip of client or partner logos as quick social proof, right after the hero or near the cases.",
  "Sem autorização para usar as marcas. Para resultados contados, use cases ou depoimentos.":
    "Without permission to use the brands. For results told in full, use cases or depoimentos.",
  "Um vídeo do YouTube ou do Vimeo (apresentação, demonstração, palestra), que carrega leve: miniatura e player só no clique.":
    "A YouTube or Vimeo video (introduction, demo, talk) that loads light: a thumbnail, and the player only on click.",
  "Para agenda, mapa ou formulário de outro serviço, use incorporacao. A informação principal não deve estar só no vídeo: repita o essencial em texto.":
    "For another service's calendar, map or form, use incorporacao. The main information shouldn't live only in the video: repeat the essentials in text.",
  "Agenda, formulário, mapa ou player de um provedor permitido (ex.: Calendly, Google Maps), pelo endereço de incorporação.":
    "A calendar, form, map or player from an allowed provider (e.g. Calendly, Google Maps), by its embed address.",
  "Para vídeo do YouTube ou do Vimeo, use video (mais leve); para receber contatos no site, contato. Provedor fora da lista é recusado.":
    "For YouTube or Vimeo videos, use video (lighter); to receive contacts on the site, contato. Providers outside the list are refused.",
  "Marcos em ordem, com data: a história da empresa, uma trajetória, as etapas de um projeto ou de um processo com prazos.":
    "Milestones in order, with dates: the company's history, a career path, the stages of a project or of a process with deadlines.",
  "Para itens sem ordem nem data (valores, diferenciais), use lista-itens; para o currículo inteiro, curriculo.":
    "For items with no order or date (values, differentiators), use lista-itens; for the whole résumé, curriculo.",
  "Tabela que compara os planos recurso a recurso, na página de preços, quando a diferença entre eles está nos detalhes.":
    "A table that compares the plans feature by feature, on the pricing page, when the difference between them is in the details.",
  "Com um ou dois planos simples, precos basta. Não invente recursos nem valores.":
    "With one or two simple plans, precos is enough. Don't make up features or values.",
};
