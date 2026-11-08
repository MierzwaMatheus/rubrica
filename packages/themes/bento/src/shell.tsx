/**
 * Casca do Bento: sem cabeçalho nem sidebar. A navegação vira uma dock flutuante no
 * rodapé da tela (cápsula translúcida com ícone e rótulo, e o botão de tema separado por
 * um filete). Estática: o item ativo vem de `aria-current`, sem estado. A `nav` leva
 * `aria-label` (correção da 1.13 na v1) e o rótulo de cada item fica no DOM mesmo quando
 * o CSS o esconde no celular.
 */
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { Icon, type IconName } from "./icons";

/** Ícone do item de menu pelo último trecho do caminho (sem prefixo de idioma). */
function navIcon(href: string): IconName {
  const last = href.split("/").filter(Boolean).pop() ?? "";
  if (!last || /^[a-z]{2}(-[A-Za-z]{2})?$/.test(last)) return "home";
  if (/curr|resume|cv/i.test(last)) return "briefcase";
  if (/portf|proje|cases|trabalh/i.test(last)) return "folder";
  if (/sobre|about|quem|equipe|team/i.test(last)) return /quem|equipe|team/i.test(last) ? "users" : "user";
  if (/serv/i.test(last)) return "layers";
  if (/prec|plan|price/i.test(last)) return "tag";
  if (/blog|post|novid/i.test(last)) return "pen";
  if (/contat|contact/i.test(last)) return "mail";
  if (/depoim|testim/i.test(last)) return "quote";
  return "file";
}

export function BentoShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  const year = new Date().getUTCFullYear();
  const org = site.organization;
  // O perfil já aparece no hero do site pessoal; a marca no topo é para logo e para empresa.
  const showBrand = Boolean(site.logo) || site.kind === "empresa";
  const many = site.navigation.length > 5;

  return (
    <div className="bento-app">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>

      {(showBrand || localeSwitcher) && (
        <header className="bento-top">
          {showBrand ? (
            <a className="bento-top__brand" href={ctx.href("/")}>
              {site.logo ? <Logo logo={site.logo} priority /> : <span>{site.name}</span>}
            </a>
          ) : (
            <span />
          )}
          {localeSwitcher && <div className="bento-top__locales">{localeSwitcher}</div>}
        </header>
      )}

      <main id="conteudo" className="bento-main">
        <div className="bento-main__inner">{children}</div>
        <footer className="bento-footer">
          <p>
            © {year} {org?.legalName ?? site.name}. {ctx.t("footer.rights")}
            {" · "}
            <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
          </p>
          {site.social.length > 0 && (
            <ul className="bento-footer__social">
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
      </main>

      <nav className="bento-dock" aria-label={ctx.t("bento.nav")} data-many={many ? "" : undefined}>
        <ul className="bento-dock__list">
          {site.navigation.map((n) => (
            <li key={n.href}>
              <a href={n.href} aria-current={n.current ? "page" : undefined}>
                <Icon name={navIcon(n.href)} size={18} />
                <span className="bento-dock__label">{n.label}</span>
              </a>
            </li>
          ))}
        </ul>
        {colorToggle && <div className="bento-dock__toggle">{colorToggle}</div>}
      </nav>
    </div>
  );
}
