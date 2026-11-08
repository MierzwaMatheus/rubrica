/**
 * Casca da monografia: cabeçalho corrido (o alto da página de um livro) e rodapé com
 * fólio. À esquerda do cabeçalho, "Nome · Seção"; à direita, a navegação em versalete,
 * o idioma e o modo de cor. No celular a navegação vira um sumário que abre logo abaixo
 * do cabeçalho, SEM JavaScript (`<details>`).
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { toRoman } from "./util";

export function MonographShell({ ctx, pageType, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const name = site.person?.name ?? site.name;
  const owner = site.organization?.legalName ?? name;
  const section = site.navigation.find((n) => n.current)?.label;
  const year = new Date().getUTCFullYear();

  return (
    <div className="mn-root">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="mn-run">
        <div className="mn-run__in">
          <p className="mn-run__id">
            <a href={ctx.href("/")} className="mn-run__home">
              {site.logo ? <Logo logo={site.logo} className="mn-run__logo" priority /> : name}
            </a>
            {section && (
              <>
                <span aria-hidden="true">·</span>
                <span className="mn-run__sec">{section}</span>
              </>
            )}
          </p>
          <div className="mn-run__tools">
            <nav className="mn-run__nav" aria-label={ctx.t("nav.menu")}>
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
            {localeSwitcher && <div className="mn-run__locales">{localeSwitcher}</div>}
            {colorToggle && <div className="mn-run__mode">{colorToggle}</div>}
            <details className="mn-run__toc">
              <summary>
                <span aria-hidden="true" className="mn-run__book" />
                <span>{ctx.t("monograph.contents")}</span>
              </summary>
              <nav className="mn-toc" aria-label={ctx.t("monograph.contents")}>
                <ol>
                  {site.navigation.map((n, i) => (
                    <li key={n.href}>
                      <a href={n.href} aria-current={n.current ? "page" : undefined}>
                        <span className="mn-ld">
                          <span className="mn-ld__t">
                            <em>{toRoman(i + 1)}.</em>
                            {n.label}
                          </span>
                          <span className="mn-ld__dots" aria-hidden="true" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ol>
                {localeSwitcher && <div className="mn-toc__locales">{localeSwitcher}</div>}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className={pageType === "page" || pageType === "notFound" ? "mn-main" : "mn-main mn-shared"}>
        {children}
      </main>

      <footer className="mn-foot">
        <p className="mn-foot__end">{ctx.t("monograph.end")}</p>
        <p className="mn-foot__colophon">{ctx.t("monograph.colophon", { name: owner, year })}</p>
        <ul className="mn-foot__links">
          <li>
            <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          </li>
          {site.social.map((s) => (
            <li key={s.url}>
              <a href={s.url} rel="me noopener noreferrer" target="_blank">
                {s.network}
                <span className="rb-sr-only"> {ctx.t("common.external")}</span>
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
