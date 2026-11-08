/**
 * Casca do Swiss: a "folha" suíça. Faixa de masthead (marca, folha N/total, idioma e tema),
 * navegação numerada em colunas iguais, masthead grande com o nome e o cargo nas páginas
 * comuns e rodapé em quatro campos. No celular a navegação abre num menu SEM JavaScript:
 * uma caixa de seleção marcada pelo `<label>` "Menu" mostra a lista por CSS (fechada fica
 * `display: none`, então os links não recebem foco).
 */
import type { CSSProperties } from "react";
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { splitName, two } from "./util";

export function SwissShell({ ctx, pageType, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const person = site.person;
  const org = site.organization;
  const name = person?.name ?? site.name;
  const email = person?.email ?? org?.email;
  const phone = person?.phone ?? org?.phone;
  const year = new Date().getUTCFullYear();
  const nav = site.navigation;
  const currentIndex = nav.findIndex((n) => n.current);
  const current = nav[currentIndex];
  const { initial, rest, single } = splitName(name);
  const role = person?.jobTitle;
  const company = site.kind === "empresa";
  const style = { "--sw-chapter": JSON.stringify(ctx.t("swiss.chapter")) } as CSSProperties;

  return (
    <div className="sw" style={style}>
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="sw-h">
        <input type="checkbox" id="sw-menu" className="sw-h-check rb-sr-only" aria-label={ctx.t("nav.menu")} />
        <div className="sw-mast">
          <a href={ctx.href("/")} className="sw-brand">
            {site.logo ? (
              <Logo logo={site.logo} className="sw-logo" priority />
            ) : (
              <>
                <span className="sw-r" aria-hidden="true">
                  {name.trim()[0]}
                </span>
                {name}
              </>
            )}
          </a>
          <div className="sw-tools">
            {current && <span className="sw-sheet">{ctx.t("swiss.sheet", { n: two(currentIndex + 1), total: two(nav.length) })}</span>}
            <span className="sw-year">{year}</span>
            {localeSwitcher}
            {colorToggle}
          </div>
        </div>
        <div className="sw-bar">
          <span className="sw-bar-now">{current?.label ?? name}</span>
          <label htmlFor="sw-menu" className="sw-bar-menu" aria-hidden="true">
            {ctx.t("nav.menu")}
          </label>
        </div>
        <nav className="sw-nav" aria-label={ctx.t("nav.menu")}>
          <ul style={{ "--sw-cols": nav.length } as CSSProperties}>
            {nav.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} aria-current={n.current ? "page" : undefined}>
                  <span className="sw-nav-n" aria-hidden="true">
                    .{two(i + 1)}
                  </span>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="conteudo" className="sw-main">
        {pageType === "page" && (
          <div className="sw-masthead">
            <div className="sw-masthead-name">
              <p className="sw-label">{ctx.t(company ? "swiss.indexCompany" : "swiss.indexPersonal")}</p>
              <p className="sw-name" aria-hidden="true">
                {single ? <span className="sw-name-box">{initial}</span> : (
                  <>
                    <span className="sw-name-box">{initial}</span>
                    {rest}
                  </>
                )}
              </p>
            </div>
            {(role || (company && site.description)) && (
              <div className="sw-masthead-role">
                <p className="sw-label">{ctx.t(company ? "swiss.aboutCompany" : "swiss.currentRole")}</p>
                <p className="sw-role">{role ?? site.description}</p>
              </div>
            )}
          </div>
        )}
        {children}
      </main>
      <footer className="sw-f">
        <span>{email ? <a href={`mailto:${email}`}>{email}</a> : null}</span>
        <span>{phone ?? null}</span>
        {site.social.length > 0 ? (
          <ul className="sw-f-social">
            {site.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="me noopener noreferrer" target="_blank">
                  {s.network}
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        <span className="sw-f-end">
          © {year} {org?.legalName ?? name}. {ctx.t("footer.rights")} <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          <br />
          <span className="sw-f-note">{ctx.t("swiss.gridNote")}</span>
        </span>
      </footer>
    </div>
  );
}
