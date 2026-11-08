/**
 * Casca do Jardim Digital: barra lateral fixa com o nome do jardim, o cargo, a navegação,
 * a legenda dos estágios e o mapa de notas; o conteúdo vai numa coluna de leitura. Abaixo
 * de 960px a barra vira um topo com o nome, a alternância de tema e um menu, e o mapa
 * desce para o fim da página.
 *
 * Tudo estático. A gaveta do celular usa uma caixa de seleção (`checkbox`) marcada pelo
 * `<label>` do botão de menu e o CSS mostra a gaveta; fechada, ela fica `visibility:
 * hidden`, então os links dela não recebem foco.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { barePath, GardenMap, StageLegend, StageDot } from "./garden";

export function GardenShell({ ctx, pageType, children, colorToggle }: ShellProps) {
  const { site } = ctx;
  const person = site.person;
  const company = site.kind === "empresa";
  const first = (person?.name ?? site.name).trim().split(/\s+/)[0] ?? "";
  // Pessoa: "Jardim de Ana" (primeiro nome). Empresa: o nome da marca por inteiro.
  const gardenName = ctx.t("garden.of", { name: company ? site.name : first });
  const role = company ? site.description : person?.jobTitle;
  const year = new Date().getUTCFullYear();
  const otherLocales = ctx.alternates;

  // "Ligada a": as próximas páginas da navegação depois da atual (ou do início), até 3.
  const nav = site.navigation;
  const at = Math.max(
    nav.findIndex((n) => n.current),
    0,
  );
  const here = barePath(ctx, ctx.path);
  const linked = [...nav.slice(at + 1), ...nav.slice(0, at)].filter((n) => !n.current && barePath(ctx, n.href) !== here).slice(0, 3);

  const Name = () => (
    <a className="gd-logo" href={ctx.href("/")}>
      {site.logo ? (
        <>
          <Logo logo={site.logo} priority />
          <span className="rb-sr-only">{gardenName}</span>
        </>
      ) : (
        <span>{gardenName}</span>
      )}
    </a>
  );

  const Nav = () => (
    <nav className="gd-nav" aria-label={ctx.t("garden.nav")}>
      {nav.map((n) => (
        <a key={n.href} href={n.href} aria-current={n.current ? "page" : undefined}>
          {n.label}
        </a>
      ))}
    </nav>
  );

  const Tools = () => (
    <div className="gd-tools">
      {otherLocales.length > 1 && (
        <ul className="gd-lang" aria-label={ctx.t("nav.language")}>
          {otherLocales.map((a) => (
            <li key={a.locale}>
              <a href={a.href} hrefLang={a.locale} lang={a.locale} aria-current={a.current ? "true" : undefined}>
                <span aria-hidden="true">{a.locale.split("-")[0]!.toUpperCase()}</span>
                <span className="rb-sr-only">{a.label}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {colorToggle && <div className="gd-mode">{colorToggle}</div>}
    </div>
  );

  return (
    <div className="gd-shell">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <input type="checkbox" id="gd-menu" className="gd-menu-input rb-sr-only" aria-label={ctx.t("nav.menu")} />

      <aside className="gd-side">
        <div>
          <Name />
          {role && <p className="gd-role">{role}</p>}
        </div>
        <Nav />
        <StageLegend ctx={ctx} />
        <GardenMap ctx={ctx} pageType={pageType} />
        <Tools />
      </aside>

      <header className="gd-top">
        <Name />
        <div className="gd-top-tools">
          {colorToggle && <div className="gd-mode">{colorToggle}</div>}
          <label htmlFor="gd-menu" className="gd-menu">
            <span className="gd-menu-icon" aria-hidden="true" />
            <span className="rb-sr-only">{ctx.t("nav.menu")}</span>
          </label>
        </div>
      </header>
      <label htmlFor="gd-menu" className="gd-scrim" aria-hidden="true" />

      <div className="gd-body">
        <main id="conteudo" className={pageType === "page" ? "gd-main" : "gd-main gd-shared"}>
          {children}
          {pageType === "page" && linked.length > 0 && (
            <div className="gd-back">
              <h2 className="gd-back-t">{ctx.t("garden.linkedTo")}</h2>
              <ul className="gd-bl">
                {linked.map((n) => (
                  <li key={n.href}>
                    <a href={n.href}>
                      <span className="gd-bl-t">{n.label}</span>
                      <small>{ctx.t("garden.page")}</small>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>
        <aside className="gd-mapfoot" aria-label={ctx.t("garden.map")}>
          <GardenMap ctx={ctx} pageType={pageType} />
          <StageLegend ctx={ctx} />
        </aside>
        <footer className="gd-foot">
          <p>
            <StageDot stage="tree" size={8} /> © {year} {site.organization?.legalName ?? site.name}. {ctx.t("footer.rights")} ·{" "}
            <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          </p>
          {site.social.length > 0 && (
            <ul className="gd-social">
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
        </footer>
      </div>
    </div>
  );
}
