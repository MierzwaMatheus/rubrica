/**
 * Casca do Blueprint: cabeçalho fixo com o nome, a especialidade em mono e a navegação
 * como códigos de folha (A0 INÍCIO, A1 SOBRE…); rodapé "Fim do conjunto". As páginas de
 * leitura (post, case, 404) ficam numa folha simples como moldura, sobre o mesmo papel
 * quadriculado. Sem JavaScript: no celular o cabeçalho quebra em linhas, sem gaveta.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { drawnBy, ownerName, stampDate } from "./parts";

export function BlueprintShell({ ctx, pageType, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const year = new Date().getUTCFullYear();
  const role = site.person?.jobTitle ?? site.description;
  const shared = pageType !== "page";

  return (
    <div className="bp-app">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>

      <header className="bp-header">
        <div className="bp-header-id">
          <a href={ctx.href("/")} className="bp-header-name">
            {site.logo ? <Logo logo={site.logo} className="bp-logo" priority /> : site.name}
          </a>
          {role && <span className="bp-header-role">{role}</span>}
        </div>
        <nav className="bp-nav" aria-label={ctx.t("blueprint.nav")}>
          <ul>
            {site.navigation.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} aria-current={n.current ? "page" : undefined}>
                  <b aria-hidden="true">A{i}</b>
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="bp-tools">
          {localeSwitcher}
          {colorToggle}
        </div>
      </header>

      <main id="conteudo" className={shared ? "bp-shared" : "bp-page"}>
        {children}
      </main>

      <footer className="bp-footer">
        <span>
          {ctx.t("blueprint.end")} · {drawnBy(ownerName(ctx)) || "—"} · {stampDate()}
        </span>
        <span>
          © {year} {site.organization?.legalName ?? site.name}
          {" · "}
          <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
        </span>
        {site.social.length > 0 && (
          <ul className="bp-footer__social">
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
        <span>{ctx.t("blueprint.madeWith")}</span>
      </footer>
    </div>
  );
}
