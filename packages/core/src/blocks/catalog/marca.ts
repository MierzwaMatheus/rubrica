/**
 * Blocos de marca e mídia (contrato 1.4): pensados para o corpo do case (identidade visual,
 * antes e depois, telas), mas valem também nas páginas. Os campos daqui são contrato.
 *
 * Classes CSS do componente padrão do núcleo (os temas estilizam por elas):
 * - antes-depois: `.rb-before-after`, `__pair`, `__figure`, `__figure--before|--after`, `__label`, `__caption`;
 *   o comparador (ilha) acrescenta `.rb-comparer`, `__stage`, `__before`, `__after`, `__label`, `__handle`, `__range`
 *   (não `.rb-compare`, que já é a tabela do comparativo de planos).
 * - paleta: `.rb-palette`, `__list`, `__swatch`, `__chip` (com `--swatch` no style), `__name`, `__hex`, `__role`, `__usage`, `__contrast`
 *   (cada item com `data-grade`: aaa, aa, large, fail).
 * - tipografia: `.rb-type`, `__list`, `__font`, `__family`, `__role`, `__weights`, `__sample`, `__specimen`.
 * - variacoes-marca: `.rb-brand-grid`, `__list` (com `data-columns`), `__item`, `__tile` (com `--tile-bg`), `__label`, `__note`.
 * - imagens: `.rb-images` (com `data-layout`), `__list`, `__item`, `__caption`; o carrossel (ilha) usa o `.rb-carousel`.
 * - video (capítulos, em `catalog/index.ts`): `.rb-video__layout`, `__chapters`, `__chapterList`, `__chapter`, `__chapterLink`, `__chapterTime`, `__chapterLabel`.
 */
import { defineBlock } from "../define";
import { field } from "../fields";


// ── Exemplos da vitrine (marca fictícia "Padaria Fermento Lento"; imagens em apps/demo/public/img/marca) ──

const M = "/img/marca";
const img = (file: string, width: number, height: number, alt: string) => ({ url: `${M}/${file}`, width, height, alt: { "*": alt } });
const L = (text: string) => ({ "*": text });
const LOGO_ITEMS = [
  { image: img("principal-crosta.svg", 480, 220, "Selo redondo da Padaria Fermento Lento, cor de crosta, com uma espiga de trigo e o nome ao lado"), label: L("Principal sobre farinha"), background: "#f7efe1", note: L("Uso preferencial: embalagem, papelaria e site.") },
  { image: img("principal-farinha.svg", 480, 220, "Selo da Padaria Fermento Lento em tons de farinha, para fundos escuros"), label: L("Principal sobre forno"), background: "#1f1712", note: L("Para fundos escuros e fotos noturnas.") },
  { image: img("reduzida.svg", 300, 200, "Versão reduzida: selo escuro com a espiga e a sigla PFL"), label: L("Reduzida"), background: "#e9a15a", note: L("Abaixo de 120 px de largura.") },
  { image: img("simbolo.svg", 220, 160, "Símbolo: o selo com a espiga de trigo"), label: L("Símbolo"), background: "#a4471a", note: L("Avatar, favicon e carimbo.") },
  { image: img("mono-preto.svg", 480, 220, "Selo e nome em preto"), label: L("Monocromática"), background: "#ffffff", note: L("Impressão a uma cor e carimbo.") },
  { image: img("mono-branco.svg", 480, 220, "Selo e nome em branco"), label: L("Monocromática negativa"), background: "#000000" },
];

const heading = field.text({ label: "Título", maxLength: 140 });
const intro = field.text({ label: "Texto de apoio", multiline: true, maxLength: 400 });
const anchor = field.text({
  label: "Âncora",
  localized: false,
  help: "Identificador para links na página (#marca). Opcional.",
  maxLength: 40,
});

export const antesDepois = defineBlock({
  type: "antes-depois",
  label: "Antes e depois",
  description: "Duas imagens comparadas: como era e como ficou. Lado a lado ou num comparador deslizante.",
  guidance: {
    use: "Mostrar a transformação de um trabalho: o logo antigo e a marca nova, a tela antiga e a nova, a fachada antes da reforma.",
    avoid: "Para várias imagens sem comparação, use imagens; para as versões de um logo, variacoes-marca.",
    pairsWith: ["texto", "variacoes-marca", "paleta"],
  },
  category: "comum",
  interactive: true,
  enhances: true,
  islandWhen: (f) => f.presentation === "comparador",
  fields: {
    anchor,
    title: heading,
    intro,
    before: field.image({ label: "Imagem de antes", required: true }),
    beforeLabel: field.text({ label: "Rótulo de antes", maxLength: 40, help: "Sem ele, \"Antes\"." }),
    after: field.image({ label: "Imagem de depois", required: true }),
    afterLabel: field.text({ label: "Rótulo de depois", maxLength: 40, help: "Sem ele, \"Depois\"." }),
    caption: field.text({ label: "Legenda", multiline: true, maxLength: 300 }),
    presentation: field.select({
      label: "Apresentação",
      options: [
        { value: "comparador", label: "Comparador deslizante (sem JavaScript, lado a lado)" },
        { value: "lado-a-lado", label: "Lado a lado" },
      ],
      default: "comparador",
      help: "O comparador sobrepõe as duas imagens; use imagens com a mesma proporção.",
    }),
  },
  // Cheio: o comparador com rótulos e legenda; curto: lado a lado, rótulos padrão.
  sample: (mode) => ({
    before: img("antes.svg", 800, 600, "Logo antigo: um círculo azul com um triângulo e o nome em letra comum"),
    after: img("depois.svg", 800, 600, "Marca nova: o selo cor de crosta da Padaria Fermento Lento sobre farinha"),
    beforeLabel: mode === "cheio" ? L("Logo de 2009") : undefined,
    afterLabel: mode === "cheio" ? L("Marca de 2026") : undefined,
  }),
});

export const paleta = defineBlock({
  type: "paleta",
  label: "Paleta de cores",
  description: "As cores de uma marca: nome, código, papel e o contraste de cada uma.",
  guidance: {
    use: "Apresentar as cores de uma identidade visual ou de um sistema de design, com o papel de cada cor.",
    avoid: "Para mudar as cores do próprio site ou do case, use a aparência ou as cores do cliente no projeto.",
    pairsWith: ["tipografia", "variacoes-marca", "antes-depois"],
  },
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    colors: field.list({
      label: "Cores",
      required: true,
      itemLabel: "Cor",
      min: 1,
      max: 12,
      of: {
        name: field.text({ label: "Nome", required: true, maxLength: 40 }),
        hex: field.color({ label: "Cor", required: true }),
        role: field.text({ label: "Papel", maxLength: 60, help: "Ex.: principal, apoio, fundo." }),
        usage: field.text({ label: "Uso", multiline: true, maxLength: 200 }),
      },
    }),
    showContrast: field.boolean({ label: "Mostrar o contraste com branco e preto", default: true }),
  },
  sample: (mode) => ({
    colors:
      mode === "cheio"
        ? [
            { name: L("Crosta"), hex: "#a4471a", role: L("Principal"), usage: L("Selo, títulos e chamadas. A cor que todo mundo lembra.") },
            { name: L("Farinha"), hex: "#f7efe1", role: L("Fundo"), usage: L("Fundo do site, embalagem e o texto sobre a crosta.") },
            { name: L("Mel"), hex: "#e9a15a", role: L("Destaque"), usage: L("Frisos, ícones e detalhes. Nunca em texto pequeno.") },
            { name: L("Café"), hex: "#2a1e16", role: L("Texto"), usage: L("Texto corrido e fundos escuros.") },
            { name: L("Massa"), hex: "#f5ead9", role: L("Apoio"), usage: L("Cartões, faixas e áreas de destaque suave.") },
          ]
        : [{ name: L("Crosta"), hex: "#a4471a" }],
  }),
});

export const tipografia = defineBlock({
  type: "tipografia",
  label: "Tipografia",
  description: "As fontes de uma marca, com papel, pesos e uma amostra escrita na própria fonte.",
  guidance: {
    use: "Apresentar as famílias tipográficas de uma identidade visual: a de títulos, a de texto, a de apoio.",
    avoid: "Para trocar a fonte do site, use a aparência. Fonte fora do Google Fonts: mande a amostra como imagem.",
    pairsWith: ["paleta", "variacoes-marca"],
  },
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    fonts: field.list({
      label: "Fontes",
      required: true,
      itemLabel: "Fonte",
      min: 1,
      max: 4,
      of: {
        family: field.text({
          label: "Família",
          localized: false,
          required: true,
          maxLength: 60,
          help: "Nome no Google Fonts (ex.: Oswald). O site baixa a fonte no build.",
        }),
        role: field.text({ label: "Papel", maxLength: 60, help: "Ex.: títulos, texto corrido." }),
        weights: field.text({ label: "Pesos", localized: false, maxLength: 40, help: "Ex.: 400, 700. Sem eles, 400 e 700." }),
        sample: field.text({ label: "Amostra", multiline: true, maxLength: 120, help: "Frase escrita na fonte. Sem ela, o alfabeto." }),
        specimen: field.image({ label: "Amostra em imagem", help: "Para fontes fora do Google Fonts, ou se a fonte não carregar." }),
      },
    }),
  },
  sample: (mode) => ({
    fonts:
      mode === "cheio"
        ? [
            { family: "Bricolage Grotesque", role: L("Títulos e selo"), weights: "400, 800", sample: L("Pão de fermentação lenta, desde 1987") },
            { family: "Space Grotesk", role: L("Texto corrido"), weights: "400, 500, 700", sample: L("A massa não tem pressa: cada fornada descansa a noite toda antes de ir ao forno.") },
            { family: "JetBrains Mono", role: L("Etiquetas e preços"), weights: "400, 700", sample: L("LOTE 1987 · R$ 18,00") },
            { family: "Fermento Serif", role: L("Apoio (fonte própria, em imagem)"), weights: "400", specimen: img("especime.svg", 800, 300, "Amostra da fonte Fermento Serif: Ag, o nome e o alfabeto") },
          ]
        : [{ family: "Fraunces" }],
  }),
});

export const variacoesMarca = defineBlock({
  type: "variacoes-marca",
  label: "Variações de marca",
  description: "As versões de um logo, cada uma sobre a sua cor de fundo: principal, reduzida, ícone, positivo e negativo.",
  guidance: {
    use: "Mostrar o sistema de um logo: versões (principal, reduzida, símbolo) e as cores em que cada uma pode aparecer.",
    avoid: "Para logos de clientes atendidos, use logos-clientes; para fotos e telas, imagens.",
    pairsWith: ["paleta", "antes-depois", "tipografia"],
  },
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    items: field.list({
      label: "Variações",
      required: true,
      itemLabel: "Variação",
      min: 1,
      max: 24,
      of: {
        image: field.image({ label: "Imagem (SVG ou PNG transparente)", required: true }),
        label: field.text({ label: "Nome", maxLength: 60, help: "Ex.: principal sobre farinha." }),
        background: field.color({ label: "Cor de fundo", help: "Sem ela, o fundo do site." }),
        note: field.text({ label: "Observação", multiline: true, maxLength: 160 }),
      },
    }),
    columns: field.select({
      label: "Colunas",
      options: [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
      ],
      default: "3",
    }),
  },
  // Instâncias: 2 colunas (4 itens), curta (1 item sem fundo nem rótulo) e 4 colunas (6 itens).
  sample: (mode, i) => ({
    items: mode === "curto" ? [{ image: LOGO_ITEMS[0]!.image }] : i === 0 ? LOGO_ITEMS.slice(0, 4) : LOGO_ITEMS,
  }),
});

export const imagens = defineBlock({
  type: "imagens",
  label: "Imagens",
  description: "Um conjunto de imagens com legenda: telas, mockups, grafismos, animações em GIF.",
  guidance: {
    use: "Mostrar várias imagens de um trabalho dentro da narrativa: telas, mockups, aplicações da marca, animações curtas (GIF).",
    avoid: "Para fotos do dia a dia da empresa (coleção de rotina), use galeria; para comparar duas imagens, antes-depois; para vídeo, video.",
    pairsWith: ["texto", "antes-depois", "video"],
  },
  category: "comum",
  interactive: true,
  enhances: true,
  islandWhen: (f) => f.layout === "carrossel",
  fields: {
    anchor,
    title: heading,
    intro,
    items: field.list({
      label: "Imagens",
      required: true,
      itemLabel: "Imagem",
      min: 1,
      max: 30,
      of: {
        image: field.image({ label: "Imagem", required: true }),
        caption: field.text({ label: "Legenda", maxLength: 200 }),
      },
    }),
    layout: field.select({
      label: "Disposição",
      options: [
        { value: "grade", label: "Grade" },
        { value: "mosaico", label: "Mosaico (a primeira maior)" },
        { value: "carrossel", label: "Carrossel (sem JavaScript, faixa com rolagem)" },
      ],
      default: "grade",
    }),
  },
  // Inclui um GIF animado: a imagem vai como está, sem conversão.
  sample: (mode) => {
    const all = [
      { image: img("selo-animado.gif", 480, 300, "Animação do selo: os pontos de mel giram em volta e a espiga de trigo cresce"), caption: L("Animação de abertura (GIF)") },
      { image: img("mockup.svg", 800, 600, "Tela do site novo com o cabeçalho cor de crosta"), caption: L("Site: página inicial") },
      { image: img("grafismo.svg", 800, 600, "Grafismo de espigas de trigo cor de mel e farinha sobre crosta"), caption: L("Grafismo: espigas") },
      { image: img("depois.svg", 800, 600, "O selo aplicado sobre farinha, com o nome embaixo"), caption: L("Aplicação na embalagem") },
      { image: img("antes.svg", 800, 600, "O logo antigo, para referência") },
    ];
    return { items: mode === "cheio" ? all : all.slice(0, 4).map(({ image }) => ({ image })) };
  },
});

export const MARCA_BLOCKS = [antesDepois, paleta, tipografia, variacoesMarca, imagens] as const;
