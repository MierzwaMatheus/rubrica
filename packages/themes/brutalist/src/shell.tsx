/**
 * Casca do tema Terminal Brutalista (layout `brutalist` da v1): uma janela de terminal.
 * A barra de título tem os três pontos, o caminho (ou a logo), o idioma e o modo de cor;
 * a navegação são abas `nome.sh` com a ativa invertida; o rodapé é a linha de status.
 * Tudo estático e sem transições.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

/** "Meu Estúdio" → "meu-estudio", para o prompt e o caminho. */
export function slug(text: string): string {
  const s = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "site";
}

export function BrutalistShell({ ctx, children, colorToggle }: ShellProps) {
  const { site } = ctx;
  const year = new Date().getUTCFullYear();
  const host = slug(site.name);
  const otherLocales = ctx.alternates.filter((a) => !a.current);
  return (
    <div className="br-root">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="br-top">
        <div className="br-bar">
          <span className="br-dots" aria-hidden="true" title={ctx.t("brutalist.window")}>
            [●][○][○]
          </span>
          <a className="br-brand" href={ctx.href("/")}>
            {site.logo ? <Logo logo={site.logo} className="br-logo" priority /> : <span>{host}:~/</span>}
          </a>
          <div className="br-tools">
            {otherLocales.length > 0 && (
              <ul className="br-langs" aria-label={ctx.t("nav.language")}>
                {otherLocales.map((a) => (
                  <li key={a.locale}>
                    <a href={a.href} hrefLang={a.locale} lang={a.locale}>
                      <span aria-hidden="true">{a.locale.split("-")[0]}</span>
                      <span className="rb-sr-only">{a.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {colorToggle}
          </div>
          <span className="br-tty" aria-hidden="true">
            tty1 · 80x40
          </span>
        </div>
        <nav className="br-tabs" aria-label={ctx.t("nav.menu")}>
          <ul>
            {site.navigation.map((n) => (
              <li key={n.href}>
                <a href={n.href} aria-current={n.current ? "page" : undefined}>
                  <span className="br-tabs__mark" aria-hidden="true">
                    {n.current ? "▶" : " "}
                  </span>
                  {n.label.toLowerCase()}.sh
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="conteudo" className="br-main">
        <div className="br-page">{children}</div>
      </main>
      <footer className="br-foot">
        <span className="br-foot__enc" aria-hidden="true">
          UTF-8 · LF · monospace
          <span className="br-foot__prompt">
            {" · "}user@{host}:~$ <i className="br-cursor" />
          </span>
        </span>
        <p>
          © {year} {site.organization?.legalName ?? site.name}. {ctx.t("footer.rights")} · <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
        </p>
        {site.social.length > 0 && (
          <ul className="br-foot__social">
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
  );
}
