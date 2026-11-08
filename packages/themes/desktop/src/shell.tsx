/**
 * Casca do tema desktop: o site é um sistema operacional de 1998.
 *
 * - Barra de menu fixa no topo: marca "◆ <nome> OS" (ou a logo), itens de navegação e,
 *   à direita, o seletor de idioma e a alternância de tema. No celular, os itens vão
 *   para um menu `<details>` (abre e fecha sem JavaScript).
 * - Área de trabalho: ícones à esquerda (pastas e documentos, atalhos de verdade para as
 *   páginas, mais o contato e a lixeira decorativa) e a coluna de janelas no meio. No
 *   celular os ícones viram uma fileira que rola na horizontal.
 *
 * O relógio da v1 saiu: a hora do build não bate com a do visitante, e sem JavaScript
 * não há como mostrar a hora certa. O lugar dele na barra ficou com o seletor de idioma.
 */
import type { ResolvedNavItem, ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { Glyph } from "./window";

/** Último trecho do caminho, sem o prefixo do idioma. */
function slug(href: string): string {
  const last = href.split(/[?#]/)[0]!.split("/").filter(Boolean).pop() ?? "";
  return /^[a-z]{2}(-[A-Za-z]{2})?$/.test(last) ? "" : last;
}

const isHome = (n: ResolvedNavItem) => slug(n.href) === "";
/** Páginas de texto corrido viram documento; o resto, pasta. */
const isDoc = (n: ResolvedNavItem) => /curr|resume|cv|sobre|about|quem|privac/i.test(slug(n.href));
const isContact = (n: ResolvedNavItem) => /contat|contact/i.test(slug(n.href));

function NavList({ ctx, className }: { ctx: ShellProps["ctx"]; className: string }) {
  return (
    <ul className={className}>
      {ctx.site.navigation.map((n) => (
        <li key={n.href}>
          <a href={n.href} aria-current={n.current ? "page" : undefined}>
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DesktopShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const brand = site.kind === "pessoal" && site.person?.name ? site.person.name.trim().split(/\s+/)[0]! : site.name;
  const icons = site.navigation.filter((n) => !isHome(n));
  const hasContactPage = icons.some(isContact);
  const year = new Date().getUTCFullYear();
  let folder = 0;

  return (
    <div className="dk">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>

      <header className="dk-bar">
        <a className="dk-brand" href={ctx.href("/")}>
          {site.logo ? (
            <Logo logo={site.logo} className="dk-brand__logo" priority />
          ) : (
            <span>
              <span aria-hidden="true">◆ </span>
              {brand}
              <span aria-hidden="true"> {ctx.t("desktop.os")}</span>
            </span>
          )}
        </a>

        <nav className="dk-menubar" aria-label={ctx.t("nav.menu")}>
          <NavList ctx={ctx} className="dk-nav" />
          <details className="dk-menu">
            <summary className="dk-menu__btn">
              <span className="dk-menu__icon" aria-hidden="true" />
              {ctx.t("nav.menu")}
            </summary>
            <div className="dk-menu__panel">
              <NavList ctx={ctx} className="dk-menu__list" />
              {localeSwitcher && <div className="dk-menu__locales">{localeSwitcher}</div>}
            </div>
          </details>
        </nav>

        <div className="dk-bar__end">
          {localeSwitcher && <div className="dk-bar__locales">{localeSwitcher}</div>}
          {colorToggle}
        </div>
      </header>

      <div className="dk-desk">
        <nav className="dk-icons" aria-label={ctx.t("desktop.desktop")}>
          <ul>
            {icons.map((n) => {
              const doc = isDoc(n);
              return (
                <li key={n.href}>
                  <a href={n.href} className="dk-ic" aria-current={n.current ? "page" : undefined}>
                    <Glyph kind={doc ? "doc" : "folder"} color={doc ? undefined : folder++} />
                    <span className="dk-ic__label">
                      {n.label}
                      {doc && <span aria-hidden="true">.txt</span>}
                    </span>
                  </a>
                </li>
              );
            })}
            {!hasContactPage && site.kind === "pessoal" && (
              <li>
                <a href={`${ctx.href("/")}#contato`} className="dk-ic">
                  <Glyph kind="mail" />
                  <span className="dk-ic__label">{ctx.t("sidebar.contact")}</span>
                </a>
              </li>
            )}
            <li aria-hidden="true" className="dk-icons__trash">
              <span className="dk-ic dk-ic--static">
                <Glyph kind="trash" />
                <span className="dk-ic__label">{ctx.t("desktop.trash")}</span>
              </span>
            </li>
          </ul>
        </nav>

        <main id="conteudo" className="dk-wins" tabIndex={-1}>
          {children}
        </main>
      </div>

      <footer className="dk-foot">
        <p>
          © {year} {site.organization?.legalName ?? site.person?.name ?? site.name}. {ctx.t("footer.rights")}
          {" · "}
          <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
        </p>
      </footer>
    </div>
  );
}
