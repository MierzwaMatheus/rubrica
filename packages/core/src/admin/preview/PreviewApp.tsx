/**
 * Dentro do iframe da prévia: recebe o rascunho do painel e renderiza a casca e os
 * blocos do tema em uso, com os mesmos componentes do site. Ilhas não rodam aqui (não
 * se envia formulário pela prévia): no lugar delas vai um aviso.
 */
import { Component, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { theme, projectComponents, projectBlocks } from "virtual:rubrica/client";
import { CORE_BLOCKS } from "../../blocks/catalog";
import { blockComponent, ColorToggleButton, LocaleLinks, SiteAnnouncement, siteWideAttributes, templates, WhatsAppFloat } from "../../components";
import { CORE_PLUGINS } from "../../plugins/registry";
import { appearanceHead } from "../../theme/appearance";
import type { BlockComponent } from "../../theme/contract";
import { planFonts } from "../../theme/fonts";
import type { SiteSnapshot } from "../../data/source";
import { isPreviewMessage, type FromPreview, type ToPreview } from "./protocol";
import { resolveCasePreview, resolvePreview } from "./resolve";
import type { ResolvedBlock } from "../../render/site";
import type { RenderContext } from "../../theme/contract";
import { brandCss, type ResolvedBrand } from "../../theme/brand";

const blocks = [...CORE_BLOCKS, ...(projectBlocks ?? []).filter((b) => !CORE_BLOCKS.some((c) => c.type === b.type))];

/** Blocos cuja ilha só melhora o HTML estático: a prévia mostra a versão estática. */
const enhancedOnly = new Set(blocks.filter((b) => b.enhances).map((b) => b.type));

function componentFor(type: string): BlockComponent {
  return (projectComponents as Record<string, BlockComponent>)[type] ?? blockComponent(theme, type);
}

class BlockBoundary extends Component<{ type: string; children: ReactNode }, { error?: string }> {
  state: { error?: string } = {};
  static getDerivedStateFromError(e: Error) {
    return { error: e.message };
  }
  componentDidUpdate(prev: { children: ReactNode }) {
    if (prev.children !== this.props.children && this.state.error) this.setState({ error: undefined });
  }
  render() {
    if (this.state.error) return <div style={notice}>O bloco “{this.props.type}” não pôde ser mostrado: {this.state.error}</div>;
    return this.props.children;
  }
}

const notice = {
  margin: "1rem auto",
  maxWidth: "48rem",
  padding: "1rem 1.25rem",
  border: "1px dashed currentColor",
  borderRadius: "0.5rem",
  opacity: 0.8,
  fontFamily: "system-ui, sans-serif",
  fontSize: "0.95rem",
} as const;

type DraftMessage = Extract<ToPreview, { type: "rubrica:preview:draft" | "rubrica:preview:case" }>;

/** Os blocos desenhados com os componentes do tema (página ou corpo do case). */
function BlockViews({ blocks: list, ctx }: { blocks: ResolvedBlock[]; ctx: RenderContext }) {
  return (
    <>
      {list.map((b) => {
        const Block = componentFor(b.type);
        return (
          <BlockBoundary key={b.id} type={b.type}>
            <Block
              id={b.id}
              variant={b.variant}
              fields={b.fields}
              items={b.items}
              headingLevel={b.headingLevel}
              index={b.index}
              total={b.total}
              ctx={ctx}
              island={b.interactive && !enhancedOnly.has(b.type) ? <div style={notice}>Parte interativa (formulário, envio): funciona no site publicado.</div> : undefined}
            />
          </BlockBoundary>
        );
      })}
    </>
  );
}

function fontHref(family: string): string {
  return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;600;700&display=swap`;
}

/**
 * A rota de case: o template do tema com o corpo em blocos e a marca do cliente. O núcleo
 * (frente A) envolve o template em `<div data-rb-brand>` e passa `blocks` e `brand`; enquanto
 * o template do tema não desenha o slot `blocks`, os blocos entram logo abaixo dele.
 * TODO(frente A): com o slot nos templates, o desvio (`slotUsed`) e o estilo do wrapper saem.
 */
function CaseView({ result }: { result: Extract<ReturnType<typeof resolveCasePreview>, { ok: true }> }) {
  const { Case } = templates(theme);
  const { ctx, brand } = result;
  const [slotUsed, setSlotUsed] = useState(true);
  useLayoutEffect(() => {
    setSlotUsed(!!document.querySelector("[data-rb-case-blocks]"));
  });
  const empty = result.blocks.length === 0;
  const body = (marker: boolean) => (
    <div {...(marker ? { "data-rb-case-blocks": "" } : { "data-rb-case-fallback": "" })}>
      {empty ? <div style={notice}>O case ainda não tem blocos visíveis.</div> : <BlockViews blocks={result.blocks} ctx={ctx} />}
    </div>
  );
  const content = (
    <>
      <Case project={result.project} related={result.related} next={result.next} blocks={body(true)} brand={brand} ctx={ctx} />
      {!slotUsed && body(false)}
    </>
  );
  if (!brand) return content;
  return <BrandWrapper brand={brand}>{content}</BrandWrapper>;
}

function BrandWrapper({ brand, children }: { brand: ResolvedBrand; children: ReactNode }) {
  const font = brand.fontDisplay;
  return (
    <div data-rb-brand="" style={{ background: "var(--rb-bg)", color: "var(--rb-fg)" }}>
      <style>{[brandCss(brand), font ? `[data-rb-brand]{--rbf-brand:"${font}",system-ui,sans-serif}` : ""].filter(Boolean).join("\n")}</style>
      {font && <link rel="stylesheet" href={fontHref(font)} />}
      {children}
    </div>
  );
}

function post(message: FromPreview) {
  window.parent?.postMessage(message, window.location.origin);
}

/** Elemento raiz do bloco no documento (o `Section` do núcleo usa a âncora ou `b-<id>`). */
function blockElement(id: string, anchor: unknown): HTMLElement | null {
  return document.getElementById(typeof anchor === "string" && anchor ? anchor : `b-${id}`);
}

export default function PreviewApp() {
  const [base, setBase] = useState<SiteSnapshot>();
  const [draft, setDraft] = useState<DraftMessage>();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!isPreviewMessage<ToPreview>(event.data, ["rubrica:preview:base", "rubrica:preview:draft", "rubrica:preview:case"])) return;
      if (event.data.type === "rubrica:preview:base") setBase(event.data.snapshot);
      else setDraft(event.data);
    };
    window.addEventListener("message", onMessage);
    // Links e formulários não navegam na prévia; clicar num bloco o seleciona no editor.
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("a, button, summary, form")) event.preventDefault();
      const section = target.closest<HTMLElement>("[data-block]");
      const id = section?.dataset.rbPreviewId;
      if (id) post({ type: "rubrica:preview:select", blockId: id });
    };
    const onSubmit = (event: Event) => event.preventDefault();
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    post({ type: "rubrica:preview:ready" });
    return () => {
      window.removeEventListener("message", onMessage);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  const result =
    base && draft
      ? draft.type === "rubrica:preview:case"
        ? resolveCasePreview({ snapshot: base, project: draft.project, locale: draft.locale, settings: draft.settings, theme, blocks, plugins: CORE_PLUGINS })
        : resolvePreview({ snapshot: base, page: draft.page, locale: draft.locale, settings: draft.settings, theme, blocks, plugins: CORE_PLUGINS })
      : undefined;
  /** Blocos que a prévia mostra (os da página ou o corpo do case). */
  const shown: ResolvedBlock[] = result?.ok ? ("blocks" in result ? result.blocks : result.page.blocks) : [];
  const settings = draft?.settings ?? base?.site;

  // Documento como o Document.astro do site: idioma, modo de cor e tokens do painel.
  useLayoutEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.lang = result?.ok ? result.ctx.locale : settings.locales.default;
    root.dataset.colorMode = settings.appearance.colorMode;
    root.dataset.themeId = settings.theme;
    let style = document.getElementById("rb-preview-tokens");
    if (!style) {
      style = document.createElement("style");
      style.id = "rb-preview-tokens";
      document.head.appendChild(style);
    }
    // Igual ao Document.astro: esquema de cor e tokens do painel. As fontes do site vêm
    // do build (Fonts API do Astro); na prévia, as famílias escolhidas entram pelo Google Fonts.
    const { appearance } = settings;
    const head = appearanceHead({ appearance: { ...appearance, fontSans: undefined, fontMono: undefined } }, { scheme: theme.scheme });
    if (head.scheme) root.dataset.scheme = head.scheme;
    else delete root.dataset.scheme;
    if (head.texture) root.dataset.texture = head.texture;
    else delete root.dataset.texture;
    // Como o Document.astro: avisa a casca da faixa de aviso e do botão do WhatsApp.
    const attrs = result?.ok ? siteWideAttributes(result.ctx) : {};
    for (const name of ["data-announcement", "data-whatsapp-float"]) {
      const value = attrs[name];
      if (value === undefined) root.removeAttribute(name);
      else root.setAttribute(name, value);
    }
    const plan = planFonts(appearance, theme.fonts);
    const nameOf = (variable: string) => plan.fonts.find((f) => f.cssVariable === variable)?.name;
    const fontCss = Object.entries(plan.assign)
      .flatMap(([token, variable]) => {
        const name = variable ? nameOf(variable) : undefined;
        const fallback = token.includes("mono") ? "ui-monospace,monospace" : "system-ui,sans-serif";
        return name ? [`${token}:"${name}",${fallback}`] : [];
      })
      .join(";");
    style.textContent = [head.css, fontCss ? `:root[data-theme-id][data-color-mode][lang]{${fontCss}}` : ""].filter(Boolean).join("\n");
    let link = document.getElementById("rb-preview-fonts") as HTMLLinkElement | null;
    const families = plan.fonts.filter((f) => f.name && (f.name === appearance.fontSans || f.name === appearance.fontMono));
    const href = families.length
      ? `https://fonts.googleapis.com/css2?${families.map((f) => `family=${encodeURIComponent(f.name).replace(/%20/g, "+")}:${f.styles?.includes("italic") ? `ital,wght@${[0, 1].flatMap((i) => f.weights.map((w) => `${i},${w}`)).join(";")}` : `wght@${f.weights.join(";")}`}`).join("&")}&display=swap`
      : "";
    if (href && (!link || link.href !== href)) {
      link?.remove();
      link = document.createElement("link");
      link.id = "rb-preview-fonts";
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    } else if (!href) link?.remove();
  });

  // Marca cada bloco e destaca o selecionado.
  useLayoutEffect(() => {
    if (!result?.ok) return;
    for (const b of shown) {
      const el = blockElement(b.id, b.fields.anchor);
      if (!el) continue;
      el.dataset.rbPreviewId = b.id;
      el.style.outline = b.id === draft?.selected ? "2px dashed #a78bfa" : "";
      el.style.outlineOffset = b.id === draft?.selected ? "-2px" : "";
      el.style.cursor = "pointer";
    }
  });

  useEffect(() => {
    if (!draft?.scrollToSelected || !draft.selected || !result?.ok) return;
    const b = shown.find((x) => x.id === draft.selected);
    if (b) blockElement(b.id, b.fields.anchor)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // Só quando a seleção muda, não a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.selected, draft?.scrollToSelected]);

  if (!result) return <div style={notice}>Carregando a prévia…</div>;
  if (!result.ok) return <div style={notice}>{result.message}</div>;

  const { ctx, collections } = result;
  const { Shell } = templates(theme);
  const isCase = "blocks" in result;
  return (
    <>
      <SiteAnnouncement ctx={ctx} />
      <Shell
        ctx={ctx}
        pageType={isCase ? "case" : "page"}
        collections={collections}
        localeSwitcher={<LocaleLinks ctx={ctx} />}
        colorToggle={ctx.site.colorToggle ? <ColorToggleButton label={ctx.t("theme.toggle")} /> : undefined}
      >
        {"blocks" in result ? (
          <CaseView result={result} />
        ) : (
          <>
            {result.page.needsHiddenH1 && <h1 className="rb-sr-only">{result.page.title}</h1>}
            {result.page.blocks.length === 0 && <div style={notice}>Página sem blocos visíveis.</div>}
            <BlockViews blocks={result.page.blocks} ctx={ctx} />
          </>
        )}
      </Shell>
      <WhatsAppFloat ctx={ctx} />
    </>
  );
}
