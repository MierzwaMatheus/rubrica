/**
 * Gera os dados de exemplo de public/data/*.json e as imagens de public/samples/.
 *
 * Esses arquivos são o conteúdo que o template mostra antes de existir um Convex
 * configurado (vite preview, screenshots da documentação, projetos recém-criados).
 * Em um build de produção, scripts/fetch-static-data.ts os substitui pelos dados reais.
 *
 * Uso: npx tsx scripts/generate-sample-data.ts
 */
import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "public", "data");
const SAMPLES_DIR = join(ROOT, "public", "samples");

const NOW = Date.UTC(2026, 0, 15);
let seq = 0;
const id = (prefix: string) => `${prefix}${(++seq).toString(36).padStart(30, "0")}`;
const meta = () => ({ _creationTime: NOW + seq, _id: id("sample"), createdAt: NOW + seq });
const tr = (ptBR: string, enUS: string) => ({ ptBR, enUS });

// ---- imagens -------------------------------------------------------------------

const PALETTES = [
  ["#1f2a44", "#3d5a80", "#98c1d9", "#e0fbfc"],
  ["#2b2d42", "#8d99ae", "#edf2f4", "#ef233c"],
  ["#264653", "#2a9d8f", "#e9c46a", "#f4a261"],
  ["#3c1642", "#086375", "#1dd3b0", "#affc41"],
  ["#22223b", "#4a4e69", "#9a8c98", "#f2e9e4"],
  ["#003049", "#d62828", "#f77f00", "#fcbf49"],
];

function abstractSvg(seed: number, w: number, h: number): string {
  const [a, b, c, d] = PALETTES[seed % PALETTES.length];
  const r = (n: number) => ((Math.sin(seed * 97.13 + n * 13.7) + 1) / 2);
  const circles = [0, 1, 2].map((i) =>
    `<circle cx="${(r(i) * w).toFixed(0)}" cy="${(r(i + 3) * h).toFixed(0)}" r="${(h * (0.18 + r(i + 6) * 0.3)).toFixed(0)}" fill="${[b, c, d][i]}" opacity="0.85"/>`
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>${circles}
<rect x="${(w * 0.08).toFixed(0)}" y="${(h * 0.72).toFixed(0)}" width="${(w * 0.4).toFixed(0)}" height="${(h * 0.06).toFixed(0)}" fill="${d}" opacity="0.9"/>
</svg>\n`;
}

function writeImage(name: string, seed: number, w: number, h: number): string {
  writeFileSync(join(SAMPLES_DIR, name), abstractSvg(seed, w, h));
  return `/samples/${name}`;
}

function storedImage(url: string, displayName: string) {
  const m = meta();
  return { ...m, displayName, fileSize: 2048, folderId: "samples", mimeType: "image/svg+xml", storageId: m._id, url };
}

// ---- conteúdo ------------------------------------------------------------------

function sidebar() {
  return {
    ...meta(),
    name: "Alex Rocha",
    role: "Product Designer & Front-end",
    roleTranslations: tr("Product Designer & Front-end", "Product Designer & Front-end"),
    email: "alex@exemplo.com",
    phone: "+55 11 90000-0000",
    githubUrl: "https://github.com/",
    linkedinUrl: "https://www.linkedin.com/",
    behanceUrl: "",
    showEmail: true,
    showPhone: true,
    showBirthDate: false,
    showLocation: false,
    updatedAt: NOW,
  };
}

function home() {
  return {
    about_text: tr(
      "Desenho e construo produtos digitais de ponta a ponta: da pesquisa com usuários ao código em produção.\n\nGosto de problemas difíceis, interfaces claras e times que conversam. Este é um perfil de exemplo do Rubrica — troque pelo seu no painel admin.",
      "I design and build digital products end to end: from user research to code in production.\n\nI like hard problems, clear interfaces and teams that talk. This is a sample Rubrica profile — replace it with yours in the admin panel."
    ),
    availability_status: { available: true, label: tr("disponível para novos projetos", "available for new projects") },
    contact_wizard_enabled: true,
  };
}

function about() {
  const services = [
    ["Design de Produto", "Product Design", "Pesquisa, fluxos e protótipos que viram decisões claras para o time.", "Research, flows and prototypes that turn into clear decisions for the team."],
    ["Interfaces Front-end", "Front-end Interfaces", "Componentes acessíveis e rápidos, prontos para crescer com o produto.", "Accessible, fast components ready to grow with the product."],
    ["Design Systems", "Design Systems", "Tokens, bibliotecas e documentação que mantêm tudo consistente.", "Tokens, libraries and docs that keep everything consistent."],
    ["Consultoria", "Consulting", "Diagnóstico de UX e roadmap técnico para produtos em evolução.", "UX audits and technical roadmaps for evolving products."],
  ].map(([pt, en, dpt, den], i) => ({
    ...meta(), title: pt, titleTranslations: tr(pt, en), description: dpt, descriptionTranslations: tr(dpt, den), orderIndex: i,
  }));

  const testimonials = [
    ["Bruna Costa", "Head de Produto, Lumen", "Trabalho cuidadoso do começo ao fim. O redesign reduziu pela metade as dúvidas no suporte.", "Careful work from start to finish. The redesign halved our support questions."],
    ["Diego Alves", "CTO, Norte Labs", "Entregou um design system que o time inteiro adotou sem atrito.", "Delivered a design system the whole team adopted without friction."],
    ["Carla Mendes", "Fundadora, Atelier 9", "Entendeu o negócio antes de desenhar a primeira tela. Fez toda a diferença.", "Understood the business before drawing the first screen. It made all the difference."],
    ["Rafael Lima", "PM, Orbe", "Comunicação clara e prazos cumpridos. Voltaríamos a trabalhar juntos.", "Clear communication and deadlines met. We would work together again."],
  ].map(([name, role, pt, en], i) => ({ ...meta(), name, role, text: pt, textTranslations: tr(pt, en), imageUrl: "", orderIndex: i }));

  const faq = [
    ["Como funciona um projeto com você?", "How does a project with you work?", "Começamos com uma conversa sobre o problema, seguimos para um diagnóstico curto e só então partimos para o design e o código.", "We start with a conversation about the problem, move to a short diagnosis and only then go into design and code."],
    ["Você trabalha com times internos?", "Do you work with in-house teams?", "Sim. Boa parte dos projetos é feita lado a lado com o time do cliente.", "Yes. Most projects are done side by side with the client's team."],
    ["Quais ferramentas você usa?", "What tools do you use?", "Figma para design, React e TypeScript para front-end, e o que o projeto pedir.", "Figma for design, React and TypeScript for front-end, and whatever the project needs."],
    ["Atende projetos pequenos?", "Do you take small projects?", "Sim, desde que exista um objetivo claro para medir o resultado.", "Yes, as long as there is a clear goal to measure the result."],
  ].map(([qpt, qen, apt, aen], i) => ({
    ...meta(), question: qpt, questionTranslations: tr(qpt, qen), answer: apt, answerTranslations: tr(apt, aen), displayOrder: i,
  }));

  const routine = [
    ["Manhã de pesquisa com usuários.", "Morning of user research.", "2x2"],
    ["Rascunhos antes de abrir o Figma.", "Sketches before opening Figma.", "1x1"],
    ["Revisão de código com o time.", "Code review with the team.", "1x1"],
    ["Café e leitura no fim da tarde.", "Coffee and reading in the late afternoon.", "2x1"],
    ["Workshop de design system.", "Design system workshop.", "1x1"],
    ["Fim de semana longe das telas.", "Weekend away from screens.", "1x1"],
  ].map(([pt, en, span], i) => {
    const image = storedImage(writeImage(`rotina-${i + 1}.svg`, i + 2, 800, 1000), `rotina-${i + 1}.svg`);
    return { ...meta(), description: pt, descriptionTranslations: tr(pt, en), displayOrder: i, image, imageId: image._id, spanSize: span };
  });

  return { services, testimonials, faq, dailyRoutine: routine };
}

function portfolio() {
  const projects = [
    ["Lumen Saúde", "Lumen Health", "Redesign do app de agendamento de uma rede de clínicas, com foco em acessibilidade.", "Redesign of a clinic network's scheduling app, focused on accessibility.", ["Product Design", "React", "Acessibilidade"]],
    ["Norte Design System", "Norte Design System", "Biblioteca de componentes e tokens usada por quatro produtos da empresa.", "Component and token library used by four of the company's products.", ["Design System", "TypeScript", "Storybook"]],
    ["Atelier 9", "Atelier 9", "Loja online para uma marca de cerâmica autoral, do branding ao checkout.", "Online store for an independent ceramics brand, from branding to checkout.", ["E-commerce", "Branding", "Next.js"]],
    ["Orbe Analytics", "Orbe Analytics", "Painel de métricas em tempo real para times de produto.", "Real-time metrics dashboard for product teams.", ["Dashboard", "React", "Dados"]],
    ["Rota Verde", "Green Route", "App de mobilidade urbana que sugere trajetos com menor emissão.", "Urban mobility app that suggests lower-emission routes.", ["Mobile", "Product Design", "Mapas"]],
    ["Caderno Aberto", "Open Notebook", "Plataforma de cursos com editor colaborativo de aulas.", "Course platform with a collaborative lesson editor.", ["Educação", "React", "Editor"]],
  ];
  return projects.map(([pt, en, dpt, den, tags], i) => {
    const image = storedImage(writeImage(`projeto-${i + 1}.svg`, i, 1200, 900), `projeto-${i + 1}.svg`);
    return {
      ...meta(), title: pt, titleTranslations: tr(pt as string, en as string),
      description: dpt, descriptionTranslations: tr(dpt as string, den as string),
      longDescription: dpt, longDescriptionTranslations: tr(dpt as string, den as string),
      tags, images: [image], imageIds: [image._id], demoLink: "", orderIndex: i, updatedAt: NOW,
    };
  });
}

function blog() {
  const posts = [
    ["Design system não é biblioteca de componentes", "O que muda quando o time passa a tratar tokens como produto", ["Design System", "Processo"], true],
    ["Pesquisa com usuários em uma semana", "Um roteiro enxuto para tirar dúvidas antes de desenhar", ["UX", "Pesquisa"], true],
    ["Acessibilidade começa no briefing", "Decisões baratas no início que evitam retrabalho depois", ["Acessibilidade", "Processo"], false],
    ["Animações que explicam, não enfeitam", "Quando o movimento ajuda a pessoa a entender a interface", ["Motion", "UI"], false],
    ["Como escrevo estudos de caso", "Estrutura, métricas e o que deixar de fora", ["Portfólio", "Carreira"], false],
    ["Do Figma ao código sem perder detalhes", "Handoff com tokens, specs e conversa", ["Front-end", "Design System"], false],
  ] as const;
  return posts.map(([title, subtitle, tags, featured], i) => {
    const imageUrl = writeImage(`blog-${i + 1}.svg`, i + 3, 1200, 800);
    // HTML, como o editor do admin grava (o título já aparece no topo da página).
    const body = `<p>${subtitle}.</p>\n<p>Este é um post de exemplo do Rubrica. Edite ou remova pelo painel admin.</p>`;
    return {
      ...meta(), title, titleTranslations: tr(title, title), subtitle, subtitleTranslations: tr(subtitle, subtitle),
      contentTranslations: tr(body, body), slug: title.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      tags, featured, status: "published", imageId: id("img"), imageUrl,
      publishedAt: NOW - i * 12 * 24 * 3600 * 1000, updatedAt: NOW,
    };
  });
}

function resume() {
  const items: Array<{ type: string; content: unknown; contentTranslations?: unknown }> = [];
  const html = (lines: string[]) => `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`;

  for (const [company, role, roleEn, period, lines] of [
    ["Norte Labs", "Product Designer Sênior", "Senior Product Designer", "2024 - atual", ["Lidera o design system usado por quatro produtos.", "Conduz pesquisa contínua com clientes."]],
    ["Lumen", "Designer de Produto", "Product Designer", "2021 - 2024", ["Redesenhou o fluxo de agendamento.", "Reduziu em 40% os chamados de suporte."]],
    ["Estúdio Orbe", "Desenvolvimento Front-end", "Front-end Development", "2019 - 2021", ["Construiu interfaces em React para clientes de varejo."]],
  ] as const) {
    items.push({
      type: "experience",
      content: { company, role, period, description: html([...lines]) },
      contentTranslations: { ptBR: { role, description: html([...lines]) }, enUS: { role: roleEn, description: html([...lines]) } },
    });
  }
  for (const [degree, degreeEn, institution, period] of [
    ["Bacharelado em Design", "Bachelor of Design", "Universidade Exemplo", "2015 - 2019"],
    ["Especialização em UX", "UX Specialization", "Escola Exemplo", "2020"],
  ]) {
    items.push({
      type: "education",
      content: { degree, institution, period, description: html(["Projeto final sobre interfaces acessíveis."]) },
      contentTranslations: { ptBR: { degree, description: html(["Projeto final sobre interfaces acessíveis."]) }, enUS: { degree: degreeEn, description: html(["Final project on accessible interfaces."]) } },
    });
  }
  for (const [name, level] of [["Figma", 95], ["Pesquisa com usuários", 90], ["Design Systems", 92], ["React", 85], ["TypeScript", 80], ["Prototipação", 88], ["Acessibilidade", 82], ["CSS", 86], ["Motion", 70], ["Testes de usabilidade", 84], ["Escrita de UX", 75], ["Next.js", 65]] as const) {
    items.push({ type: "skill", content: { name, level: String(level) } });
  }
  for (const [pt, en] of [["Comunicação", "Communication"], ["Facilitação", "Facilitation"], ["Pensamento sistêmico", "Systems thinking"], ["Empatia", "Empathy"], ["Organização", "Organization"], ["Curiosidade", "Curiosity"]]) {
    items.push({ type: "soft_skill", content: { text: pt }, contentTranslations: tr(pt, en) });
  }
  for (const [pt, en, level] of [["Português", "Portuguese", "Nativo"], ["Inglês", "English", "Avançado"]]) {
    items.push({ type: "language", content: { name: pt, level }, contentTranslations: tr(pt, en) });
  }
  for (const t of ["Design de Interação — Curso Exemplo", "Acessibilidade na Web — Curso Exemplo", "Facilitação de Workshops — Curso Exemplo", "Fundamentos de Dados — Curso Exemplo"]) {
    items.push({ type: "course", content: { text: t }, contentTranslations: tr(t, t) });
  }
  for (const [pt, en] of [["Mentoria voluntária para pessoas em transição de carreira", "Volunteer mentoring for people changing careers"], ["Oficinas de design em escolas públicas", "Design workshops in public schools"]]) {
    items.push({ type: "volunteer", content: { text: pt }, contentTranslations: tr(pt, en) });
  }
  return items.map((item, i) => ({ ...meta(), ...item, orderIndex: i }));
}

// ---- escrita -------------------------------------------------------------------

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(SAMPLES_DIR, { recursive: true });

const files: Record<string, unknown> = {
  "sidebar.json": sidebar(),
  "home.json": home(),
  "about.json": about(),
  "portfolio.json": portfolio(),
  "blog.json": blog(),
  "resume.json": resume(),
};
for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(DATA_DIR, name), JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`[sample-data] ${name}`);
}
