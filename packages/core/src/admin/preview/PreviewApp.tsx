/**
 * Dentro do iframe da prévia: recebe o rascunho do painel e renderiza a casca e os
 * blocos do tema em uso, com os mesmos componentes do site. Ilhas não rodam aqui (não
 * se envia formulário pela prévia): no lugar delas vai um aviso.
 */
import { Component, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { theme, projectComponents, projectBlocks } from "virtual:rubrica/client";
import { CORE_BLOCKS } from "../../blocks/catalog";
import { blockComponent, ColorToggleButton, LocaleLinks, templates } from "../../components";
import { CORE_PLUGINS } from "../../plugins/registry";
import { appearanceHead } from "../../theme/appearance";
import type { BlockComponent } from "../../theme/contract";
import { planFonts } from "../../theme/fonts";
import type { SiteSnapshot } from "../../data/source";
import { isPreviewMessage, type FromPreview, type ToPreview } from "./protocol";
import { resolvePreview } from "./resolve";

const blocks = [...CORE_BLOCKS, ...(projectBlocks ?? []).filter((b) => !CORE_BLOCKS.some((c) => c.type === b.type))];

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

function post(message: FromPreview) {
  window.parent?.postMessage(message, window.location.origin);
}

/** Elemento raiz do bloco no documento (o `Section` do núcleo usa a âncora ou `b-<id>`). */
function blockElement(id: string, anchor: unknown): HTMLElement | null {
  return document.getElementById(typeof anchor === "string" && anchor ? anchor : `b-${id}`);
}

export default function PreviewApp() {
  const [base, setBase] = useState<SiteSnapshot>();
  const [draft, setDraft] = useState<Extract<ToPreview, { type: "rubrica:preview:draft" }>>();

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!isPreviewMessage<ToPreview>(event.data, ["rubrica:preview:base", "rubrica:preview:draft"])) return;
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

  const result = base && draft ? resolvePreview({ snapshot: base, page: draft.page, locale: draft.locale, settings: draft.settings, theme, blocks, plugins: CORE_PLUGINS }) : undefined;
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
    for (const b of result.page.blocks) {
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
    const b = result.page.blocks.find((x) => x.id === draft.selected);
    if (b) blockElement(b.id, b.fields.anchor)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    // Só quando a seleção muda, não a cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.selected, draft?.scrollToSelected]);

  if (!result) return <div style={notice}>Carregando a prévia…</div>;
  if (!result.ok) return <div style={notice}>{result.message}</div>;

  const { ctx, page, collections } = result;
  const { Shell } = templates(theme);
  return (
    <Shell
      ctx={ctx}
      pageType="page"
      collections={collections}
      localeSwitcher={<LocaleLinks ctx={ctx} />}
      colorToggle={ctx.site.colorToggle ? <ColorToggleButton label={ctx.t("theme.toggle")} /> : undefined}
    >
      {page.needsHiddenH1 && <h1 className="rb-sr-only">{page.title}</h1>}
      {page.blocks.length === 0 && <div style={notice}>Página sem blocos visíveis.</div>}
      {page.blocks.map((b) => {
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
              island={b.interactive ? <div style={notice}>Parte interativa (formulário, envio): funciona no site publicado.</div> : undefined}
            />
          </BlockBoundary>
        );
      })}
    </Shell>
  );
}
