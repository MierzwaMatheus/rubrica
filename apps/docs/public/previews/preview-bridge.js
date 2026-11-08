/*
 * Ponte dos previews do site público. Vai como o primeiro <script> do <head> de cada
 * build de layout (site/scripts/build-previews.ts) e roda antes do app do Rubrica.
 *
 * O app é o de verdade, com os dados de exemplo; a ponte só escolhe a aparência:
 * - na carga, lê da URL: page, mode (light|dark), toggle (0|1), scheme, sans, mono, texture;
 * - depois, recebe do site (postMessage, mesma origem) { type: "rubrica-preview", scheme,
 *   sans, mono, texture, page } e aplica sem recarregar. Trocar o modo recarrega o iframe.
 *
 * __SCHEMES__ e __FONTS__ são preenchidos no build com cli/src/themes/{schemes,fonts}.ts.
 */
(function () {
  var SCHEMES = {"neon":{"light":{"--bg":"#F7F7F8","--surface":"#EFEFF2","--subtle":"#F1F1F4","--text":"#141414","--text-muted":"#55555C","--line":"#DCDCE2","--primary":"#7E22CE","--on-primary":"#F7F7F8","--accent":"#4D7C0F","--on-accent":"#F7F7F8","--accent-2":"#0891B2"},"dark":{"--bg":"#141414","--surface":"#0A0A0A","--subtle":"#171717","--text":"#E6E6E6","--text-muted":"#A2A2A2","--line":"#252525","--primary":"#A855F7","--on-primary":"#FFFFFF","--accent":"#BEF264","--on-accent":"#141414","--accent-2":"#22D3EE"}},"editorial-cream":{"light":{"--bg":"#FAF7F2","--surface":"#F3EEE5","--subtle":"#EFE9DE","--text":"#1A1614","--text-muted":"#5E554D","--line":"#E2D9CB","--primary":"#A855F7","--on-primary":"#1A1614","--accent":"#EF4444","--on-accent":"#1A1614","--accent-2":"#B7832A"},"dark":{"--bg":"#1A1614","--surface":"#231E1A","--subtle":"#2A241F","--text":"#F3EEE5","--text-muted":"#A89E93","--line":"#3A322B","--primary":"#C084FC","--on-primary":"#1A1614","--accent":"#F87171","--on-accent":"#1A1614","--accent-2":"#E0B25A"}},"paper-noir":{"light":{"--bg":"#F0EEE9","--surface":"#E8E5DE","--subtle":"#E4E1D9","--text":"#0A0A0A","--text-muted":"#55524C","--line":"#D3CFC6","--primary":"#EF4444","--on-primary":"#0A0A0A","--accent":"#3B82F6","--on-accent":"#0A0A0A","--accent-2":"#E8B500"},"dark":{"--bg":"#0D0D0D","--surface":"#161616","--subtle":"#1C1C1C","--text":"#F0EEE9","--text-muted":"#A3A09A","--line":"#2C2C2C","--primary":"#F05252","--on-primary":"#0D0D0D","--accent":"#60A5FA","--on-accent":"#0D0D0D","--accent-2":"#F2C94C"}},"midnight-blue":{"light":{"--bg":"#F3F6FB","--surface":"#E9EEF7","--subtle":"#E3E9F3","--text":"#0A1224","--text-muted":"#4B5670","--line":"#CBD5E6","--primary":"#0E7490","--on-primary":"#F3F6FB","--accent":"#CA8A04","--on-accent":"#0A1224","--accent-2":"#6D28D9"},"dark":{"--bg":"#0A1224","--surface":"#0F1A31","--subtle":"#13203B","--text":"#E8E6E0","--text-muted":"#9AA3B5","--line":"#22304D","--primary":"#06B6D4","--on-primary":"#0A1224","--accent":"#FACC15","--on-accent":"#0A1224","--accent-2":"#A78BFA"}},"solar-warm":{"light":{"--bg":"#FFF8EF","--surface":"#FBEFDF","--subtle":"#F7E9D6","--text":"#2A1A0E","--text-muted":"#6E5A47","--line":"#EAD7BE","--primary":"#C2410C","--on-primary":"#FFF8EF","--accent":"#CA8A04","--on-accent":"#2A1A0E","--accent-2":"#BE123C"},"dark":{"--bg":"#1A1410","--surface":"#231B15","--subtle":"#2A2019","--text":"#F2EDE4","--text-muted":"#ABA092","--line":"#3A2E24","--primary":"#F97316","--on-primary":"#1A1410","--accent":"#FACC15","--on-accent":"#1A1410","--accent-2":"#FB7185"}},"riso":{"light":{"--bg":"#F2EDE2","--surface":"#FAF6EE","--subtle":"#E5DDCC","--text":"#1D2B63","--text-muted":"#4E5884","--line":"#D4C9B2","--primary":"#E5258D","--on-primary":"#14183A","--accent":"#0078BF","--on-accent":"#F2EDE2","--accent-2":"#FFE800"},"dark":{"--bg":"#15172A","--surface":"#1E2138","--subtle":"#272A44","--text":"#F2EDE2","--text-muted":"#A9ACC8","--line":"#363A5C","--primary":"#FF5CBA","--on-primary":"#15172A","--accent":"#4AA8E8","--on-accent":"#15172A","--accent-2":"#FFE45C"}},"cianotipia":{"light":{"--bg":"#EDF1F6","--surface":"#F8FAFC","--subtle":"#DDE5EF","--text":"#0F2C57","--text-muted":"#4A6286","--line":"#C3D0E1","--primary":"#1D4E89","--on-primary":"#FFFFFF","--accent":"#6F9BCB","--on-accent":"#0F2C57","--accent-2":"#8FB3D9"},"dark":{"--bg":"#0E2A50","--surface":"#14345F","--subtle":"#1A3D6C","--text":"#E9EFF7","--text-muted":"#9DB4D3","--line":"#2D5285","--primary":"#F2F5FA","--on-primary":"#0E2A50","--accent":"#7FA9DA","--on-accent":"#0E2A50","--accent-2":"#BFD3EA"}},"tropicalia":{"light":{"--bg":"#FBF5E6","--surface":"#FFFBF1","--subtle":"#EFE6CD","--text":"#0D3326","--text-muted":"#4D6358","--line":"#DCCFAE","--primary":"#0B6E4F","--on-primary":"#FFFFFF","--accent":"#F2B705","--on-accent":"#0D3326","--accent-2":"#E2457A"},"dark":{"--bg":"#0A271D","--surface":"#0F3427","--subtle":"#143D2F","--text":"#F6EFDA","--text-muted":"#A7BFAF","--line":"#22513F","--primary":"#34C08A","--on-primary":"#062016","--accent":"#F7C531","--on-accent":"#0A271D","--accent-2":"#F26B9C"}},"azulejo":{"light":{"--bg":"#F6F6F2","--surface":"#FFFFFF","--subtle":"#E7EAF1","--text":"#14213D","--text-muted":"#4F5B78","--line":"#D2D7E3","--primary":"#1F4FB4","--on-primary":"#FFFFFF","--accent":"#C4673D","--on-accent":"#14213D","--accent-2":"#E9B949"},"dark":{"--bg":"#0D1630","--surface":"#141F3D","--subtle":"#1B2749","--text":"#ECEFF6","--text-muted":"#A1ACC8","--line":"#2A3762","--primary":"#7397F2","--on-primary":"#0D1630","--accent":"#E58C61","--on-accent":"#0D1630","--accent-2":"#F0C866"}},"sumi":{"light":{"--bg":"#EEEBE3","--surface":"#F7F5F0","--subtle":"#E1DDD2","--text":"#171614","--text-muted":"#5F5B53","--line":"#CEC8BA","--primary":"#C8102E","--on-primary":"#FFFFFF","--accent":"#8A8478","--on-accent":"#171614","--accent-2":"#171614"},"dark":{"--bg":"#121110","--surface":"#1B1A18","--subtle":"#24221F","--text":"#E9E5DC","--text-muted":"#A39E93","--line":"#34312C","--primary":"#E5414A","--on-primary":"#121110","--accent":"#7D776C","--on-accent":"#121110","--accent-2":"#E9E5DC"}},"fosforo":{"light":{"--bg":"#EEF3E8","--surface":"#F7FAF3","--subtle":"#DDE8D3","--text":"#1A3A20","--text-muted":"#4C6A50","--line":"#C3D4B6","--primary":"#1E7A33","--on-primary":"#FFFFFF","--accent":"#A86A00","--on-accent":"#EEF3E8","--accent-2":"#5E9E6A"},"dark":{"--bg":"#070C08","--surface":"#0C150E","--subtle":"#102014","--text":"#8CFF9E","--text-muted":"#4FBF63","--line":"#1C3A22","--primary":"#3DFF6E","--on-primary":"#04140A","--accent":"#FFB000","--on-accent":"#070C08","--accent-2":"#2E8B45"}},"crepusculo":{"light":{"--bg":"#FFF3ED","--surface":"#FFFAF7","--subtle":"#F6E2DD","--text":"#2A1540","--text-muted":"#6B5378","--line":"#EBCFCB","--primary":"#6B2FA3","--on-primary":"#FFFFFF","--accent":"#EF6C2A","--on-accent":"#2A1540","--accent-2":"#E3A73B"},"dark":{"--bg":"#190E29","--surface":"#231536","--subtle":"#2D1C44","--text":"#F7E9F0","--text-muted":"#BCA6C9","--line":"#3E2A5A","--primary":"#B788F2","--on-primary":"#190E29","--accent":"#FF8A4C","--on-accent":"#190E29","--accent-2":"#F4C15D"}},"concreto":{"light":{"--bg":"#E3E4E5","--surface":"#EEEFF0","--subtle":"#D3D5D7","--text":"#111214","--text-muted":"#55595F","--line":"#B9BCC0","--primary":"#1F2124","--on-primary":"#FFD400","--accent":"#A87F00","--on-accent":"#111214","--accent-2":"#FFD400"},"dark":{"--bg":"#18191B","--surface":"#212325","--subtle":"#2A2C2F","--text":"#E8E9EA","--text-muted":"#9A9EA4","--line":"#3A3D41","--primary":"#FFD400","--on-primary":"#111214","--accent":"#6E737A","--on-accent":"#E8E9EA","--accent-2":"#E8E9EA"}},"sorbet":{"light":{"--bg":"#FFF6FA","--surface":"#FFFFFF","--subtle":"#F3E8F6","--text":"#35295A","--text-muted":"#6F6390","--line":"#E6D6EE","--primary":"#7454D6","--on-primary":"#FFFFFF","--accent":"#6FD3B5","--on-accent":"#35295A","--accent-2":"#FFAE94"},"dark":{"--bg":"#211B33","--surface":"#2A2340","--subtle":"#332B4C","--text":"#F5EEFF","--text-muted":"#B9AED6","--line":"#433A60","--primary":"#B9A0FF","--on-primary":"#211B33","--accent":"#86E3C7","--on-accent":"#211B33","--accent-2":"#FFB8A1"}},"alto-contraste":{"light":{"--bg":"#FFFFFF","--surface":"#FFFFFF","--subtle":"#F0F0F0","--text":"#000000","--text-muted":"#2B2B2B","--line":"#000000","--primary":"#0030B8","--on-primary":"#FFFFFF","--accent":"#8A0000","--on-accent":"#FFFFFF","--accent-2":"#000000"},"dark":{"--bg":"#000000","--surface":"#0A0A0A","--subtle":"#1A1A1A","--text":"#FFFFFF","--text-muted":"#E0E0E0","--line":"#FFFFFF","--primary":"#FFE14D","--on-primary":"#000000","--accent":"#7FD8FF","--on-accent":"#000000","--accent-2":"#FFFFFF"}}};
  var FONTS = {"Inter":[300,400,500,600,700],"Chakra Petch":[300,400,500,600,700],"Playfair Display":[400,500,600,700,800],"Space Grotesk":[300,400,500,600,700],"DM Sans":[300,400,500,600,700],"Bodoni Moda":[400,500,600,700,800],"IBM Plex Serif":[300,400,500,600,700],"Manrope":[300,400,500,600,700,800],"Archivo":[300,400,500,600,700,800],"Instrument Sans":[400,500,600,700],"IBM Plex Sans":[300,400,500,600,700],"Fraunces":[300,400,500,600,700,800],"Source Serif 4":[300,400,600,700],"Bricolage Grotesque":[300,400,500,600,700,800],"JetBrains Mono":[300,400,500,600,700],"Fira Code":[300,400,500,600,700],"Space Mono":[400,700],"IBM Plex Mono":[300,400,500,600,700]};
  var d = document.documentElement;

  // Os previews não contam como visita: bloqueia os scripts de analytics da Vercel que o
  // app injeta (no site publicado eles registrariam cada iframe como uma página vista).
  var append = Node.prototype.appendChild;
  Node.prototype.appendChild = function (node) {
    if (node && node.tagName === "SCRIPT" && /\/_vercel\//.test(node.src || "")) return node;
    return append.call(this, node);
  };

  var params = new URLSearchParams(location.search);

  // Modo e alternância: o script do index.html e o ThemeProvider leem estes valores.
  var mode = params.get("mode");
  if (mode === "light" || mode === "dark") {
    d.setAttribute("data-color-mode", mode);
    try {
      localStorage.setItem("rubrica-color-mode", mode);
    } catch (e) {}
  }
  d.setAttribute("data-color-toggle", params.get("toggle") === "0" ? "false" : "true");

  // O build mora em /previews/<layout>/, mas o roteador do app espera as rotas na raiz.
  history.replaceState(null, "", params.get("page") || "/");

  function styleTag(id) {
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    return el;
  }

  function block(vars) {
    return Object.keys(vars)
      .map(function (k) {
        return k + ":" + vars[k] + ";";
      })
      .join("");
  }

  // html:root e html:root.dark vencem :root e .dark do index.css pela especificidade.
  function applyScheme(id) {
    var s = SCHEMES[id];
    if (!s) return;
    styleTag("rb-preview-scheme").textContent =
      "html:root{" + block(s.light) + "}html:root.dark{" + block(s.dark) + "}";
  }

  function fontHref(families) {
    var q = families
      .filter(Boolean)
      .map(function (f) {
        return "family=" + f.replace(/ /g, "+") + ":wght@" + (FONTS[f] || [400, 700]).join(";");
      })
      .join("&");
    return "https://fonts.googleapis.com/css2?" + q + "&display=swap";
  }

  var current = { sans: null, mono: null };
  function applyFonts(sans, mono) {
    if (sans) current.sans = sans;
    if (mono) current.mono = mono;
    if (!current.sans && !current.mono) return;
    var link = document.getElementById("rb-preview-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "rb-preview-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontHref([current.sans, current.mono]);
    styleTag("rb-preview-font-vars").textContent =
      "html:root{" +
      (current.sans ? '--font-sans:"' + current.sans + '",sans-serif;' : "") +
      (current.mono ? '--font-mono:"' + current.mono + '",monospace;' : "") +
      "}";
  }

  function applyTexture(t) {
    if (t === "none" || t === "grain" || t === "paper" || t === "scanlines") d.setAttribute("data-texture", t);
  }

  function goTo(page) {
    if (!page || page === location.pathname) return;
    history.pushState(null, "", page);
    dispatchEvent(new PopStateEvent("popstate"));
    scrollTo(0, 0);
  }

  applyScheme(params.get("scheme"));
  applyFonts(params.get("sans"), params.get("mono"));
  applyTexture(params.get("texture"));

  addEventListener("message", function (e) {
    if (e.origin !== location.origin) return;
    var m = e.data;
    if (!m || m.type !== "rubrica-preview") return;
    if (m.scheme) applyScheme(m.scheme);
    if (m.sans || m.mono) applyFonts(m.sans, m.mono);
    if (m.texture) applyTexture(m.texture);
    if (m.page) goTo(m.page);
  });

  // Avisa o site quando a página interna muda (links clicados dentro do preview).
  var push = history.pushState;
  history.pushState = function () {
    var r = push.apply(this, arguments);
    try {
      parent.postMessage({ type: "rubrica-preview-page", page: location.pathname }, location.origin);
    } catch (e) {}
    return r;
  };
})();
