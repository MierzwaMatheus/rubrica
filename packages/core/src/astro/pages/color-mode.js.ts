import type { APIRoute } from "astro";

/**
 * Aplica a escolha guardada antes da pintura e liga os botões [data-rb-color-toggle].
 * Arquivo externo (sem script inline): funciona com CSP restrita.
 */
const SCRIPT = `(function(){var K="rubrica:color-mode",d=document.documentElement;try{var m=localStorage.getItem(K);if(m==="light"||m==="dark")d.dataset.colorMode=m}catch(e){}
function cur(){var a=d.dataset.colorMode;if(a==="light"||a==="dark")return a;return matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}
function sync(){var b=document.querySelectorAll("[data-rb-color-toggle]");for(var i=0;i<b.length;i++)b[i].setAttribute("aria-pressed",String(cur()==="light"))}
document.addEventListener("click",function(e){var t=e.target&&e.target.closest&&e.target.closest("[data-rb-color-toggle]");if(!t)return;var n=cur()==="dark"?"light":"dark";d.dataset.colorMode=n;try{localStorage.setItem(K,n)}catch(e){}sync()});
document.addEventListener("DOMContentLoaded",sync)})();`;

export const GET: APIRoute = () => new Response(SCRIPT, { headers: { "content-type": "text/javascript; charset=utf-8" } });
