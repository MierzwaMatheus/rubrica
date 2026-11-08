// Aplica o modo de cor antes da página aparecer (carregado no <head> do index.html).
(function () {
  var d = document.documentElement;
  var mode = d.getAttribute("data-color-mode") || "dark";
  if (d.getAttribute("data-color-toggle") === "true") {
    try {
      var saved = localStorage.getItem("rubrica-color-mode");
      if (saved === "light" || saved === "dark") mode = saved;
    } catch (e) {}
  }
  if (mode === "system") mode = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  if (location.pathname.indexOf("/admin") === 0) mode = "dark";
  d.classList.toggle("dark", mode === "dark");
})();
