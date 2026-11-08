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
  "Ex.: valores sem impostos.": "E.g. prices before tax.",
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
};
