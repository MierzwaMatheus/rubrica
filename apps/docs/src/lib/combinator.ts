/**
 * Combinador: controla o iframe com o build real de cada tema (public/previews/..., gerado
 * pelo site de demonstração para cada tipo de site). Tipo, tema, página e modo recarregam o
 * iframe; esquema e fontes mudam ao vivo por postMessage (scripts/preview-bridge.js, que
 * também guarda a escolha para as páginas seguintes do preview). O preview abre no idioma
 * da página (/en/... na página em inglês).
 */
import { onRequest, publishChoice } from "./combinatorStore";
import { previewBase, type SiteKind } from "./previews";

interface Config {
  /** Prefixo do idioma da página nas rotas do demo ("" ou "/en"). */
  localePrefix: string;
  kinds: { id: SiteKind; label: string }[];
  layouts: { id: string; label: string; recommended: { scheme: string; mode: Mode }; fonts: { sans: string[]; mono: string } }[];
  schemes: { id: string; label: string }[];
  moods: { id: string; layout: string; scheme: string; mode: Mode; sans: string; mono: string }[];
  pages: Record<SiteKind, { path: string; label: string }[]>;
  /** Textos montados aqui no navegador, no idioma da página. */
  i18n: {
    rows: Record<"kind" | "layout" | "scheme" | "mode" | "sans" | "mono", string>;
    light: string;
    dark: string;
  };
}
type Mode = "light" | "dark" | "system";

interface State {
  kind: SiteKind;
  layout: string;
  scheme: string;
  mode: "light" | "dark";
  sans: string;
  mono: string;
  page: string;
  device: "desktop" | "mobile";
}

const DESKTOP_W = 1280;
const MOBILE_W = 390;

export function initCombinator(): void {
  const cfgEl = document.getElementById("cb-config");
  const frame = document.getElementById("cb-frame") as HTMLIFrameElement | null;
  const stage = document.getElementById("cb-stage");
  if (!cfgEl || !frame || !stage) return;
  const cfg = JSON.parse(cfgEl.textContent || "{}") as Config;
  const root = document.getElementById("combinador")!;
  const loading = document.getElementById("cb-loading")!;
  const openLink = document.getElementById("cb-open") as HTMLAnchorElement;
  const sansSel = document.getElementById("cb-sans") as HTMLSelectElement;
  const monoSel = document.getElementById("cb-mono") as HTMLSelectElement;
  const answers = document.getElementById("cb-answers")!;

  const first = cfg.moods[0];
  let state: State = {
    kind: "pessoal",
    layout: first.layout,
    scheme: first.scheme,
    mode: first.mode === "dark" ? "dark" : "light",
    sans: first.sans,
    mono: first.mono,
    page: "/",
    device: "desktop",
  };
  let loadedKey = "";

  const label = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

  function src(): string {
    const q = new URLSearchParams({
      mode: state.mode,
      scheme: state.scheme,
      sans: state.sans,
      mono: state.mono,
    });
    const path = state.page === "/" ? "/" : `${state.page}/`;
    return `${previewBase(state.kind, state.layout)}${cfg.localePrefix}${path}?${q}`;
  }

  /** O que exige recarregar o app (esquema e fontes mudam ao vivo). */
  const reloadKey = () => `${state.kind}|${state.layout}|${state.mode}|${state.page}`;
  const pagesOf = (kind: SiteKind) => cfg.pages[kind];

  function send(msg: Record<string, unknown>) {
    frame!.contentWindow?.postMessage({ type: "rubrica-preview", ...msg }, location.origin);
  }

  function fit() {
    const w = stage!.clientWidth;
    const h = stage!.clientHeight;
    const target = state.device === "mobile" ? MOBILE_W : Math.max(DESKTOP_W, w);
    const scale = Math.min(1, w / target);
    frame!.style.width = `${target}px`;
    frame!.style.height = `${h / scale}px`;
    frame!.style.transform =
      state.device === "mobile" ? `translateX(-50%) scale(${scale})` : `scale(${scale})`;
    frame!.style.transformOrigin = state.device === "mobile" ? "50% 0" : "0 0";
  }

  function renderControls() {
    root.querySelectorAll<HTMLButtonElement>("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === state.kind)));
    root.querySelectorAll<HTMLButtonElement>("[data-layout]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layout === state.layout)));
    root.querySelectorAll<HTMLButtonElement>("[data-scheme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scheme === state.scheme)));
    root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
    root.querySelectorAll<HTMLButtonElement>("[data-device]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === state.device)));
    root.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((b) => {
      b.hidden = b.dataset.pageKind !== state.kind;
      b.setAttribute("aria-selected", String(!b.hidden && b.dataset.page === state.page));
    });
    root.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((b) => {
      const m = cfg.moods.find((x) => x.id === b.dataset.mood)!;
      const on = m.layout === state.layout && m.scheme === state.scheme && m.mode === state.mode && m.sans === state.sans && m.mono === state.mono;
      b.setAttribute("aria-pressed", String(on));
    });
    // A seção "Crie o seu" monta o comando a partir destas escolhas.
    const { kind, layout, scheme, mode, sans, mono } = state;
    publishChoice({ kind, layout, scheme, mode, sans, mono });
    sansSel.value = state.sans;
    monoSel.value = state.mono;
    stage!.dataset.device = state.device;
    openLink.href = src();

    const tx = cfg.i18n;
    const rows: [string, string][] = [
      [tx.rows.kind, label(cfg.kinds, state.kind)],
      [tx.rows.layout, label(cfg.layouts, state.layout)],
      [tx.rows.scheme, label(cfg.schemes, state.scheme)],
      [tx.rows.mode, state.mode === "dark" ? tx.dark : tx.light],
      [tx.rows.sans, state.sans],
      [tx.rows.mono, state.mono],
    ];
    answers.replaceChildren(
      ...rows.map(([dt, dd]) => {
        const div = document.createElement("div");
        const t = document.createElement("dt");
        const d = document.createElement("dd");
        t.textContent = `${dt}:`;
        d.textContent = dd;
        div.append(t, d);
        return div;
      })
    );
  }

  function apply(patch: Partial<State>) {
    const before = state;
    state = { ...state, ...patch };
    // Página que o outro tipo de site não tem: volta para o início.
    if (!pagesOf(state.kind).some((p) => p.path === state.page)) state.page = "/";
    renderControls();
    fit();
    if (reloadKey() !== loadedKey) {
      loadedKey = reloadKey();
      loading.classList.add("on");
      frame!.src = src();
      return;
    }
    const live: Record<string, unknown> = {};
    if (state.scheme !== before.scheme) live.scheme = state.scheme;
    if (state.sans !== before.sans) live.sans = state.sans;
    if (state.mono !== before.mono) live.mono = state.mono;
    if (Object.keys(live).length) send(live);
  }

  frame.addEventListener("load", () => loading.classList.remove("on"));

  // O app avisa quando a visita navega por um link dentro do preview.
  addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const m = e.data as { type?: string; page?: string };
    if (m?.type !== "rubrica-preview-page" || typeof m.page !== "string") return;
    // A ponte manda o caminho com o idioma (/en/sobre); as abas usam o caminho sem ele.
    const page = m.page.replace(/^\/(?:en|es)(?=\/|$)/, "") || "/";
    if (pagesOf(state.kind).some((x) => x.path === page)) {
      state = { ...state, page };
      loadedKey = reloadKey();
      renderControls();
    }
  });

  root.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.kind) apply({ kind: d.kind as SiteKind });
    else if (d.mood) {
      const m = cfg.moods.find((x) => x.id === d.mood)!;
      apply({ layout: m.layout, scheme: m.scheme, mode: m.mode === "dark" ? "dark" : "light", sans: m.sans, mono: m.mono });
    } else if (d.layout) apply({ layout: d.layout });
    else if (d.scheme) apply({ scheme: d.scheme });
    else if (d.mode) apply({ mode: d.mode as State["mode"] });
    else if (d.page) apply({ page: d.page });
    else if (d.device) apply({ device: d.device as State["device"] });
  });
  // "Crie o seu" também troca o tipo de site.
  onRequest((patch) => apply(patch));

  sansSel.addEventListener("change", () => apply({ sans: sansSel.value }));
  monoSel.addEventListener("change", () => apply({ mono: monoSel.value }));

  // Galerias de layouts e esquemas mais abaixo na página levam a escolha para cá.
  document.addEventListener("click", (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-cb-layout],[data-cb-scheme]");
    if (!el) return;
    e.preventDefault();
    const layoutId = el.dataset.cbLayout;
    const schemeId = el.dataset.cbScheme;
    if (layoutId) {
      const l = cfg.layouts.find((x) => x.id === layoutId)!;
      apply({
        layout: l.id,
        scheme: l.recommended.scheme,
        mode: l.recommended.mode === "dark" ? "dark" : "light",
        sans: l.fonts.sans[0],
        mono: l.fonts.mono || state.mono,
        page: "/",
      });
    } else if (schemeId) apply({ scheme: schemeId });
    root.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  // Em tela estreita o preview já começa no tamanho de celular.
  if (stage.clientWidth < 700) state.device = "mobile";
  new ResizeObserver(fit).observe(stage);
  apply({});
}
