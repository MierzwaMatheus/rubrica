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
};
