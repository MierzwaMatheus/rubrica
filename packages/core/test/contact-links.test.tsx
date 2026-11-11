import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { resolveLink, type ResolveOptions } from "../src/render/resolve";
import { LinkButton } from "../src/components";

const locales = { locales: ["pt-BR", "en"], default: "pt-BR" } as ResolveOptions["locales"];
const base: ResolveOptions = { locale: "en", locales };
const withDialog: ResolveOptions = { ...base, contactDialog: "janela" };

describe("links para o contato e a janela de contato", () => {
  it("#contato, /#contato e contato: abrem a janela quando ela existe", () => {
    for (const href of ["#contato", "/#contato", "contato:", " #contato "]) {
      expect(resolveLink({ label: { en: "Talk" }, href }, withDialog)?.dialog).toBe("janela");
    }
  });

  it("outros links e sites sem janela navegam normalmente", () => {
    expect(resolveLink({ label: { en: "Blog" }, href: "/blog" }, withDialog)).toEqual({ label: "Blog", href: "/en/blog", external: false });
    expect(resolveLink({ label: { en: "Talk" }, href: "#contato" }, base)?.dialog).toBeUndefined();
    // contato: sem janela leva ao bloco de contato da home, no idioma.
    expect(resolveLink({ label: { en: "Talk" }, href: "contato:" }, base)).toEqual({ label: "Talk", href: "/en#contato", external: false });
  });

  it("LinkButton vira botão que abre a janela", () => {
    const html = renderToStaticMarkup(<LinkButton link={{ label: "Fale comigo", href: "#contato", external: false, dialog: "janela" }} />);
    // Atributo de HTML não distingue maiúsculas: o React escreve `popoverTarget`.
    expect(html).toMatch(/^<button type="button" popovertarget="janela" class="rb-button rb-button--primary">Fale comigo<\/button>$/i);
    expect(renderToStaticMarkup(<LinkButton link={{ label: "Blog", href: "/blog", external: false }} />)).toContain("<a href=\"/blog\"");
  });
});
