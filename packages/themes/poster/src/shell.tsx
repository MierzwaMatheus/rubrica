/**
 * Casca do Pôster: barra fixa com o nome em caixa alta à esquerda e a navegação à direita
 * (fio de 5px embaixo), conteúdo de largura total e rodapé com o fio grosso. No celular a
 * navegação vira uma gaveta de palavras gigantes aberta SEM JavaScript: um `checkbox`
 * marcado pelo `<label>` "Menu" a mostra por CSS. Fechada, fica `display: none`, então os
 * links dela não recebem foco.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

export function PosterShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const name = site.person?.name ?? site.name;
  const org = site.organization;
  const email = site.person?.email ?? org?.email;
  const year = new Date().getUTCFullYear();
  return (
    <div className="poster-root">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="poster-bar">
        <input type="checkbox" id="poster-menu" className="poster-bar-check rb-sr-only" aria-label={ctx.t("nav.menu")} />
        <div className="poster-wrap poster-bar-in">
          <a href={ctx.href("/")} className="poster-brand">
            {site.logo ? <Logo logo={site.logo} className="poster-logo" priority /> : name}
          </a>
          <div className="poster-bar-tools">
            <nav className="poster-links" aria-label={ctx.t("nav.menu")}>
              {site.navigation.map((n) => (
                <a key={n.href} href={n.href} className="poster-link" aria-current={n.current ? "page" : undefined}>
                  {n.label}
                </a>
              ))}
            </nav>
            {localeSwitcher}
            {colorToggle}
            <label htmlFor="poster-menu" className="poster-menu-btn" aria-hidden="true">
              <span className="poster-menu-ico" />
              {ctx.t("nav.menu")}
            </label>
          </div>
        </div>
        <nav className="poster-wrap poster-drawer" aria-label={ctx.t("nav.menu")}>
          {site.navigation.map((n) => (
            <a key={n.href} href={n.href} aria-current={n.current ? "page" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main id="conteudo" className="poster-main">
        {children}
      </main>
      <footer className="poster-foot">
        <div className="poster-wrap poster-foot-in">
          <span>
            © {year} {org?.legalName ?? name}
          </span>
          {email && <a href={`mailto:${email}`}>{email}</a>}
          {site.social.length > 0 && (
            <ul className="poster-foot-links">
              {site.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="me noopener noreferrer" target="_blank">
                    {s.network} <span aria-hidden="true">↗</span>
                    <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
        </div>
      </footer>
    </div>
  );
}
