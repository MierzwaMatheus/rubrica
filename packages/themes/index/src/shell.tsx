/**
 * Casca do Índice: cabeçalho fixo em colunas (nome | cargo e linha de catálogo |
 * navegação | controles), conteúdo numa coluna larga e rodapé de três campos. No celular o
 * nome e os controles ficam na primeira linha e a navegação abre num menu SEM JavaScript:
 * uma caixa de seleção (`checkbox`) marcada pelo `<label>` "Menu" mostra a lista por CSS.
 * Fechado, o menu fica `display: none`, então os links dele não recebem foco.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

export function IndexShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const person = site.person;
  const org = site.organization;
  const name = person?.name ?? site.name;
  const role = person?.jobTitle;
  const email = person?.email ?? org?.email;
  const year = new Date().getUTCFullYear();
  const archive = ctx.t(site.kind === "empresa" ? "index.catalog" : "index.archive");

  return (
    <div className="ix">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="ix-h">
        <div className="ix-wrap ix-h-in">
          <input type="checkbox" id="ix-menu" className="ix-h-check rb-sr-only" aria-label={ctx.t("nav.menu")} />
          <a href={ctx.href("/")} className="ix-h-name">
            {site.logo ? <Logo logo={site.logo} className="ix-h-logo" priority /> : name}
          </a>
          <p className="ix-h-role">
            {role}
            {role && <br />}
            <span>
              {archive}, {year}
            </span>
          </p>
          <nav className="ix-h-nav" aria-label={ctx.t("nav.menu")}>
            <ul>
              {site.navigation.map((n) => (
                <li key={n.href}>
                  <a href={n.href} aria-current={n.current ? "page" : undefined}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ix-h-tools">
            {localeSwitcher}
            {colorToggle}
            <label htmlFor="ix-menu" className="ix-h-menu" aria-hidden="true">
              {ctx.t("nav.menu")}
            </label>
          </div>
        </div>
      </header>
      <main id="conteudo" className="ix-wrap ix-main">
        {children}
      </main>
      <footer className="ix-wrap">
        <div className="ix-f">
          {email ? <a href={`mailto:${email}`}>{email}</a> : <span>{role ?? org?.legalName ?? ""}</span>}
          <span>
            {archive} · {name}
          </span>
          {site.social.length > 0 && (
            <ul className="ix-f-social">
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
          <span>
            © {year} · {org?.legalName ?? name}. {ctx.t("footer.rights")} <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
