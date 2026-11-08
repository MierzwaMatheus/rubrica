/*
 * Ponte dos previews do site público. Vai como o primeiro <script> do <head> de cada
 * página do site de demonstração gerado para um tema (scripts/build-previews.ts).
 *
 * O site é o de verdade, com os dados de exemplo; a ponte só escolhe a aparência:
 * - na carga, lê da URL: mode (light|dark), scheme, sans, mono. Sem parâmetros (a visita
 *   seguiu um link dentro do preview), usa o que ficou guardado no sessionStorage;
 * - depois, recebe do site (postMessage, mesma origem) { type: "rubrica-preview", scheme,
 *   sans, mono } e aplica sem recarregar;
 * - avisa o site em qual página do preview a visita está.
 *
 * __SCHEMES__, __FONTS__ e __PREFIX__ são preenchidos no build (scripts/build-previews.ts)
 * com os esquemas do núcleo e as fontes do CLI.
 */
(function () {
  var SCHEMES = __SCHEMES__;
  var FONTS = __FONTS__;
  var PREFIX = "__PREFIX__";
  var KEY = "rubrica-preview";
  var d = document.documentElement;

  var params = new URLSearchParams(location.search);
  var saved = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch (e) {}
  var state = {
    mode: params.get("mode") || saved.mode,
    scheme: params.get("scheme") || saved.scheme,
    sans: params.get("sans") || saved.sans,
    mono: params.get("mono") || saved.mono,
  };
  function save() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  // Modo: o script do núcleo (/_rubrica/color-mode.js) lê o localStorage; o atributo vale já.
  if (state.mode === "light" || state.mode === "dark") {
    d.setAttribute("data-color-mode", state.mode);
    try {
      localStorage.setItem("rubrica:color-mode", state.mode);
    } catch (e) {}
  }

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

  // O escuro é o padrão do núcleo; o claro entra com data-color-mode="light". A
  // especificidade (html:root[data-scheme]) vence os tokens do tema.
  function applyScheme(id) {
    var s = SCHEMES[id];
    if (!s) return;
    state.scheme = id;
    d.setAttribute("data-scheme", id);
    styleTag("rb-preview-scheme").textContent =
      "html:root[data-scheme]{" + block(s.dark) + '}html:root[data-scheme][data-color-mode="light"]{' + block(s.light) + "}";
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

  function applyFonts(sans, mono) {
    if (sans) state.sans = sans;
    if (mono) state.mono = mono;
    if (!state.sans && !state.mono) return;
    var link = document.getElementById("rb-preview-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "rb-preview-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontHref([state.sans, state.mono]);
    styleTag("rb-preview-font-vars").textContent =
      "html:root[data-theme-id]{" +
      (state.sans ? '--rb-font-sans:"' + state.sans + '",sans-serif;--rb-font-display:"' + state.sans + '",sans-serif;' : "") +
      (state.mono ? '--rb-font-mono:"' + state.mono + '",monospace;' : "") +
      "}";
  }

  applyScheme(state.scheme);
  applyFonts(state.sans, state.mono);
  save();

  addEventListener("message", function (e) {
    if (e.origin !== location.origin) return;
    var m = e.data;
    if (!m || m.type !== "rubrica-preview") return;
    if (m.scheme) applyScheme(m.scheme);
    if (m.sans || m.mono) applyFonts(m.sans, m.mono);
    save();
  });

  // Avisa o site qual página do preview está aberta (ex.: /sobre), sem o prefixo do tema.
  addEventListener("DOMContentLoaded", function () {
    var page = location.pathname.indexOf(PREFIX) === 0 ? location.pathname.slice(PREFIX.length) : location.pathname;
    page = "/" + page.replace(/^\/+|\/+$/g, "");
    try {
      parent.postMessage({ type: "rubrica-preview-page", page: page }, location.origin);
    } catch (e) {}
  });
})();
