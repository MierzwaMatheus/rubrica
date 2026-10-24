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
  var SCHEMES = __SCHEMES__;
  var FONTS = __FONTS__;
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
