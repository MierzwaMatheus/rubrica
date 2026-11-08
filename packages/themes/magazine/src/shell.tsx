/**
 * Casca da revista: faixa de metadados (edição, subtítulo, data), título em letras
 * espaçadas (o masthead), navegação centralizada e rodapé de colofão. Sem JavaScript:
 * no celular o menu abre por uma caixa de seleção marcada pelo `<label>` do botão.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

export function MagazineShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const person = site.person;
  const name = person?.name ?? site.name;
  const year = new Date().getUTCFullYear();
  const issue = String(year % 100).padStart(2, "0");
  const dateline = ctx.formatDate(new Date().toISOString(), "month");
  const tagline = person?.jobTitle ?? ctx.t(site.kind === "empresa" ? "magazine.strip.company" : "magazine.strip.personal");
  // Cada palavra inteira (nowrap): no celular a quebra cai entre palavras, nunca no meio.
  const words = name.split(/\s+/).filter(Boolean);

  const nav = (
    <ul>
      {site.navigation.map((n) => (
        <li key={n.href}>
          <a href={n.href} aria-current={n.current ? "page" : undefined}>
            {n.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="rb-mag">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <input type="checkbox" id="rb-menu" className="rb-menu__input rb-sr-only" aria-label={ctx.t("nav.menu")} />

      <header className="rb-mast">
        <div className="rb-mast__strip">
          <span className="rb-mast__edition">{ctx.t("magazine.strip.edition", { issue })}</span>
          <span className="rb-mast__tagline">{tagline}</span>
          <span className="rb-mast__tools">
            {localeSwitcher}
            {colorToggle}
            <span className="rb-mast__date">{ctx.t("magazine.strip.dateline", { date: dateline })}</span>
          </span>
        </div>

        <div className="rb-mast__title">
          <a href={ctx.href("/")} className="rb-mast__brand">
            {site.logo ? (
              <Logo logo={site.logo} className="rb-mast__logo" priority />
            ) : (
              words.map((w, i) => (
                <span key={`${i}-${w}`} className="rb-mast__word">
                  {w}
                </span>
              ))
            )}
          </a>
        </div>

        <nav className="rb-mast__nav" aria-label={ctx.t("nav.menu")}>
          {nav}
        </nav>

        <div className="rb-mast__mobile">
          <label htmlFor="rb-menu" className="rb-mast__burger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            {ctx.t("nav.menu")}
          </label>
          <nav className="rb-mast__drawer" aria-label={ctx.t("nav.menu")}>
            {nav}
          </nav>
        </div>
      </header>

      <main id="conteudo" className="rb-main">
        <div className="rb-main__inner">{children}</div>
      </main>

      <footer className="rb-colophon">
        <div className="rb-colophon__inner">
          <p>
            © {year} {site.organization?.legalName ?? name}. {ctx.t("footer.rights")}
            {" · "}
            <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          </p>
          {site.social.length > 0 && (
            <ul className="rb-colophon__social">
              {site.social.map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="me noopener noreferrer" target="_blank">
                    {s.network}
                    <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </footer>
    </div>
  );
}
