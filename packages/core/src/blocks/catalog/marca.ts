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


// ── Exemplos da vitrine (marca fictícia "Tornearia Faísca"; imagens em apps/demo/public/img/marca) ──

const M = "/img/marca";
const img = (file: string, width: number, height: number, alt: string) => ({ url: `${M}/${file}`, width, height, alt: { "*": alt } });
const L = (text: string) => ({ "*": text });
const LOGO_ITEMS = [
  { image: img("principal-bordo.svg", 480, 220, "Placa da Tornearia Faísca em bordô com friso de latão"), label: L("Principal sobre marfim"), background: "#f4ead5", note: L("Uso preferencial: fachada, papelaria e site.") },
  { image: img("principal-marfim.svg", 480, 220, "Placa da Tornearia Faísca em marfim com letras bordô"), label: L("Principal sobre grafite"), background: "#2a1a1c", note: L("Para fundos escuros e fotos noturnas.") },
  { image: img("reduzida.svg", 300, 200, "Versão reduzida da placa com a sigla TFA"), label: L("Reduzida"), background: "#b8893b", note: L("Abaixo de 120 px de largura.") },
  { image: img("simbolo.svg", 220, 160, "Símbolo: a letra F numa placa pequena"), label: L("Símbolo"), background: "#7a1f2b", note: L("Avatar, favicon e carimbo.") },
  { image: img("mono-preto.svg", 480, 220, "Placa em preto e branco"), label: L("Monocromática"), background: "#ffffff", note: L("Impressão a uma cor e gravação.") },
  { image: img("mono-branco.svg", 480, 220, "Placa em branco com letras pretas"), label: L("Monocromática negativa"), background: "#000000" },
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
    after: img("depois.svg", 800, 600, "Marca nova: a placa bordô da Tornearia Faísca sobre marfim"),
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
            { name: L("Bordô oficina"), hex: "#7a1f2b", role: L("Principal"), usage: L("Placa, títulos e chamadas. A cor que todo mundo lembra.") },
            { name: L("Marfim"), hex: "#f4ead5", role: L("Fundo"), usage: L("Fundo do site, papelaria e o texto sobre o bordô.") },
            { name: L("Latão"), hex: "#b8893b", role: L("Destaque"), usage: L("Frisos, ícones e detalhes. Nunca em texto pequeno.") },
            { name: L("Grafite"), hex: "#1f2328", role: L("Texto"), usage: L("Texto corrido e fundos escuros.") },
            { name: L("Verde garagem"), hex: "#2f6f5e", role: L("Apoio"), usage: L("Avisos de pronto para retirar.") },
          ]
        : [{ name: L("Bordô"), hex: "#7a1f2b" }],
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
            { family: "Bricolage Grotesque", role: L("Títulos e placa"), weights: "400, 800", sample: L("Peça sob medida desde 1987") },
            { family: "Space Grotesk", role: L("Texto corrido"), weights: "400, 500, 700", sample: L("O torno não tem pressa: cada peça sai medida, conferida e com garantia.") },
            { family: "JetBrains Mono", role: L("Códigos e etiquetas"), weights: "400, 700", sample: L("OS-1987 · Ø 42 mm · 0,01") },
            { family: "Faísca Serif", role: L("Apoio (fonte própria, em imagem)"), weights: "400", specimen: img("especime.svg", 800, 300, "Amostra da fonte Faísca Serif: Ag Faísca e o alfabeto") },
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
        label: field.text({ label: "Nome", maxLength: 60, help: "Ex.: principal sobre bordô." }),
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
      { image: img("placa-animada.gif", 480, 300, "Animação da placa: o friso de latão corre e os parafusos piscam"), caption: L("Animação de abertura (GIF)") },
      { image: img("mockup.svg", 800, 600, "Tela do site novo com o cabeçalho bordô"), caption: L("Site: página inicial") },
      { image: img("grafismo.svg", 800, 600, "Grafismo de círculos de latão sobre bordô"), caption: L("Grafismo: arruelas") },
      { image: img("depois.svg", 800, 600, "A placa aplicada sobre marfim com hachuras"), caption: L("Aplicação na fachada") },
      { image: img("antes.svg", 800, 600, "O logo antigo, para referência") },
    ];
    return { items: mode === "cheio" ? all : all.slice(0, 4).map(({ image }) => ({ image })) };
  },
});

export const MARCA_BLOCKS = [antesDepois, paleta, tipografia, variacoesMarca, imagens] as const;
