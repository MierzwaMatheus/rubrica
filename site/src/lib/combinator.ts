/**
 * Combinador: controla o iframe com o build real de cada layout (site/public/previews).
 * Layout, modo e botão de modo recarregam o iframe (a ponte lê da URL); esquema, fontes,
 * textura e página mudam ao vivo por postMessage (site/scripts/preview-bridge.js).
 */
interface Config {
  layouts: { id: string; label: string; recommended: { scheme: string; mode: Mode; texture: string }; fonts: { sans: string[]; mono: string } }[];
  schemes: { id: string; label: string }[];
  moods: { id: string; name: string; layout: string; scheme: string; mode: Mode; texture: string; sans: string; mono: string }[];
  pages: { path: string; label: string }[];
}
type Mode = "light" | "dark" | "system";

interface State {
  layout: string;
  scheme: string;
  mode: "light" | "dark";
  toggle: boolean;
  texture: string;
  sans: string;
  mono: string;
  page: string;
  device: "desktop" | "mobile";
}

const DESKTOP_W = 1280;
const MOBILE_W = 390;
const TEXTURE_LABEL: Record<string, string> = { none: "Nenhuma", grain: "Grão de filme", paper: "Papel", scanlines: "Scanlines" };

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
    layout: first.layout,
    scheme: first.scheme,
    mode: first.mode === "dark" ? "dark" : "light",
    toggle: true,
    texture: first.texture,
    sans: first.sans,
    mono: first.mono,
    page: "/",
    device: "desktop",
  };
  let loadedKey = "";

  const label = (list: { id: string; label: string }[], id: string) => list.find((x) => x.id === id)?.label ?? id;

  function src(): string {
    const q = new URLSearchParams({
      page: state.page,
      mode: state.mode,
      toggle: state.toggle ? "1" : "0",
      scheme: state.scheme,
      sans: state.sans,
      mono: state.mono,
      texture: state.texture,
    });
    return `/previews/${state.layout}/index.html?${q}`;
  }

  /** O que exige recarregar o app (o resto muda ao vivo). */
  const reloadKey = () => `${state.layout}|${state.mode}|${state.toggle}`;

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
    root.querySelectorAll<HTMLButtonElement>("[data-layout]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.layout === state.layout)));
    root.querySelectorAll<HTMLButtonElement>("[data-scheme]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scheme === state.scheme)));
    root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === state.mode)));
    root.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.toggle === "1") === state.toggle)));
    root.querySelectorAll<HTMLButtonElement>("[data-texture]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.texture === state.texture)));
    root.querySelectorAll<HTMLButtonElement>("[data-device]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.device === state.device)));
    root.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.page === state.page)));
    root.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((b) => {
      const m = cfg.moods.find((x) => x.id === b.dataset.mood)!;
      const on = m.layout === state.layout && m.scheme === state.scheme && m.mode === state.mode && m.texture === state.texture && m.sans === state.sans && m.mono === state.mono;
      b.setAttribute("aria-pressed", String(on));
    });
    sansSel.value = state.sans;
    monoSel.value = state.mono;
    stage!.dataset.device = state.device;
    openLink.href = src();

    const rows: [string, string][] = [
      ["Layout", label(cfg.layouts, state.layout)],
      ["Esquema", label(cfg.schemes, state.scheme)],
      ["Modo", state.mode === "dark" ? "Escuro" : "Claro"],
      ["Botão de modo", state.toggle ? "Sim" : "Não"],
      ["Textura", TEXTURE_LABEL[state.texture] ?? state.texture],
      ["Fonte principal", state.sans],
      ["Fonte mono", state.mono],
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
    if (state.texture !== before.texture) live.texture = state.texture;
    if (state.page !== before.page) live.page = state.page;
    if (Object.keys(live).length) send(live);
  }

  frame.addEventListener("load", () => loading.classList.remove("on"));

  // O app avisa quando a visita navega por um link dentro do preview.
  addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const m = e.data as { type?: string; page?: string };
    if (m?.type === "rubrica-preview-page" && typeof m.page === "string") {
      state = { ...state, page: m.page };
      renderControls();
    }
  });

  root.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.mood) {
      const m = cfg.moods.find((x) => x.id === d.mood)!;
      apply({ layout: m.layout, scheme: m.scheme, mode: m.mode === "dark" ? "dark" : "light", texture: m.texture, sans: m.sans, mono: m.mono });
    } else if (d.layout) apply({ layout: d.layout });
    else if (d.scheme) apply({ scheme: d.scheme });
    else if (d.mode) apply({ mode: d.mode as State["mode"] });
    else if (d.toggle) apply({ toggle: d.toggle === "1" });
    else if (d.texture) apply({ texture: d.texture });
    else if (d.page) apply({ page: d.page });
    else if (d.device) apply({ device: d.device as State["device"] });
  });
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
        texture: l.recommended.texture,
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
