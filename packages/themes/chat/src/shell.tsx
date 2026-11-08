/**
 * Casca do tema Conversa (layout `chat` da v1): o topo de um aplicativo de mensagens
 * (avatar ou logo, nome, cargo, navegação, idioma e modo de cor), a conversa no meio e,
 * presas embaixo, as respostas rápidas, que são a navegação de verdade.
 *
 * Tudo estático: o rodapé usa `position: sticky` (fica preso embaixo enquanto a página
 * rola e volta para o lugar dele no fim, sem cobrir a conversa); no celular os links do
 * topo somem e as respostas rápidas rolam de lado. O "digitando…" do fim da home é só CSS.
 */
import { splitLocale, type ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";
import { Avatar, kindText } from "./chat";


export function ChatShell({ ctx, pageType, children, colorToggle }: ShellProps) {
  const { site } = ctx;
  const person = site.person;
  const name = site.kind === "pessoal" ? (person?.name ?? site.name) : site.name;
  const status = site.kind === "pessoal" ? person?.jobTitle : site.description;
  const home = ctx.href("/");
  /** Caminho sem o prefixo do idioma ("/en/blog" → "/blog"). */
  const bare = (path: string) => {
    const p = splitLocale(path, ctx.locales).path;
    return p.length > 1 ? p.replace(/\/+$/, "") : "/";
  };
  const current = bare(ctx.path);
  const isHome = pageType === "page" && current === "/";
  const contactPath = site.kind === "empresa" ? "/contato" : "/";
  const talkHref = site.kind === "empresa" ? ctx.href("/contato") : `${home}#contato`;
  const showTalk = !(site.kind === "empresa" && current === contactPath);
  const links = site.navigation.filter((n) => bare(n.href) !== "/");
  const replies = site.navigation.filter((n) => !n.current);
  const otherLocales = ctx.alternates.filter((a) => !a.current);
  const year = new Date().getUTCFullYear();

  return (
    <div className="ct-root">
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>

      <header className="ct-h">
        <a className="ct-who" href={home}>
          <span className="rb-sr-only">{ctx.t("chat.home")}: </span>
          {site.logo ? <Logo logo={site.logo} className="ct-logo" priority /> : <Avatar name={name} photo={person?.photo} priority />}
          <span className="ct-id">
            {/* Com logo, o nome já está no `alt` dela. */}
            {site.logo ? <span className="rb-sr-only">{name}</span> : <b>{name}</b>}
            {status && <small>{status}</small>}
          </span>
        </a>

        {links.length > 0 && (
          <nav className="ct-nav" aria-label={ctx.t("nav.menu")}>
            <ul>
              {links.map((n) => (
                <li key={n.href}>
                  <a href={n.href} aria-current={n.current ? "page" : undefined}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {(otherLocales.length > 0 || colorToggle) && (
          <div className="ct-tools">
            {otherLocales.length > 0 && (
              <ul className="ct-langs" aria-label={ctx.t("nav.language")}>
                {otherLocales.map((a) => (
                  <li key={a.locale}>
                    <a className="ct-tool ct-lang" href={a.href} hrefLang={a.locale} lang={a.locale}>
                      <span aria-hidden="true">{a.locale.split("-")[0]!.toUpperCase()}</span>
                      <span className="rb-sr-only">{a.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {colorToggle && <div className="ct-toggle">{colorToggle}</div>}
          </div>
        )}
      </header>

      <main id="conteudo" className={pageType === "page" ? "ct-main" : "ct-main ct-shared"}>
        {pageType === "page" ? (
          <div className="ct-log">
            <span className="ct-day" aria-hidden="true">
              {ctx.t("chat.today")}
            </span>
            {children}
            {isHome && (
              <div className="ct-m in ct-typing" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>
        ) : (
          children
        )}
        <p className="ct-legal">
          © {year} {site.organization?.legalName ?? name}. {ctx.t("footer.rights")} · <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
        </p>
      </main>

      {(showTalk || replies.length > 0) && (
        <footer className="ct-f">
          <nav className="ct-f-in" aria-label={ctx.t("chat.quickReplies")}>
            <span className="ct-f-lb" aria-hidden="true">
              {ctx.t("chat.quickReplies")}
            </span>
            {/* "Fale comigo" primeiro: no celular a lista rola de lado e a ação principal fica sempre à vista. */}
            <ul className="ct-qr">
              {showTalk && (
                <li>
                  <a className="ct-pill pri" href={talkHref}>
                    {kindText(ctx, "talk")}
                  </a>
                </li>
              )}
              {replies.map((n) => (
                <li key={n.href}>
                  <a className="ct-pill" href={n.href}>
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </footer>
      )}
    </div>
  );
}
