/**
 * Casca do Zine: uma tira de fita adesiva com os links em letra à mão (e o botão de modo
 * de cor e o idioma presos nela), o nome do site em mono ao lado e, no rodapé, a assinatura
 * "feito à mão por" com os contatos. Sem JavaScript: a tira quebra de linha no celular.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { tilt } from "./parts";

export function ZineShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const name = site.person?.name ?? site.name;
  const email = site.person?.email ?? site.organization?.email;
  const year = new Date().getUTCFullYear();
  return (
    <div className="zn">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="zn-header">
        <div className="zn-wrap zn-header-in">
          <nav aria-label={ctx.t("nav.menu")} className="zn-strip-nav zn-tilt" style={tilt(-1)}>
            <ul>
              {site.navigation.map((n) => (
                <li key={n.href}>
                  <a href={n.href} aria-current={n.current ? "page" : undefined}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            {localeSwitcher}
            {colorToggle}
          </nav>
          <a href={ctx.href("/")} className="zn-brand">
            {site.logo ? <Logo logo={site.logo} className="zn-brand-logo" priority /> : name}
          </a>
        </div>
      </header>
      <main id="conteudo" className="zn-main" tabIndex={-1}>
        {children}
      </main>
      <footer className="zn-footer">
        <div className="zn-wrap zn-footer-in">
          <p>
            {ctx.t("zine.byHand", { name })} · {year}
          </p>
          <ul>
            {email && (
              <li>
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {site.social.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="me noopener noreferrer" target="_blank">
                  {s.network}
                  <span className="rb-sr-only"> {ctx.t("common.external")}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
