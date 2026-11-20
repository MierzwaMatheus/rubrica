/**
 * Blocos de marca e mídia (contrato 1.4): pensados para o corpo do case (identidade visual,
 * antes e depois, telas), mas valem também nas páginas. Os campos daqui são contrato.
 *
 * Classes CSS do componente padrão do núcleo (os temas estilizam por elas):
 * - antes-depois: `.rb-before-after`, `__pair`, `__figure`, `__figure--before|--after`, `__label`, `__caption`;
 *   o comparador (ilha) acrescenta `.rb-compare`, `__stage`, `__after`, `__handle`, `__range`.
 * - paleta: `.rb-palette`, `__list`, `__swatch`, `__chip` (com `--swatch` no style), `__name`, `__hex`, `__role`, `__usage`, `__contrast`.
 * - tipografia: `.rb-type`, `__list`, `__font`, `__family`, `__role`, `__weights`, `__sample`, `__specimen`.
 * - variacoes-marca: `.rb-brand-grid`, `__list` (com `data-columns`), `__item`, `__tile` (com `--tile-bg`), `__label`, `__note`.
 * - imagens: `.rb-images` (com `data-layout`), `__list`, `__item`, `__caption`.
 */
import { defineBlock } from "../define";
import { field } from "../fields";

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
      itemLabel: "Fonte",
      min: 1,
      max: 4,
      of: {
        family: field.text({
          label: "Família",
          localized: false,
          required: true,
          maxLength: 60,
          help: "Nome no Google Fonts (ex.: Big Shoulders Display). O site baixa a fonte no build.",
        }),
        role: field.text({ label: "Papel", maxLength: 60, help: "Ex.: títulos, texto corrido." }),
        weights: field.text({ label: "Pesos", localized: false, maxLength: 40, help: "Ex.: 400, 700. Sem eles, 400 e 700." }),
        sample: field.text({ label: "Amostra", multiline: true, maxLength: 120, help: "Frase escrita na fonte. Sem ela, o alfabeto." }),
        specimen: field.image({ label: "Amostra em imagem", help: "Para fontes fora do Google Fonts, ou se a fonte não carregar." }),
      },
    }),
  },
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
});

export const MARCA_BLOCKS = [antesDepois, paleta, tipografia, variacoesMarca, imagens] as const;
