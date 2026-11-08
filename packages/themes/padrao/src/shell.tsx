/**
 * Casca com sidebar fixa (layout padrão da v1): perfil, navegação com ícones, contato,
 * redes, alternância de tema, idiomas e atalhos. No celular vira uma barra no topo e a
 * sidebar abre como gaveta, SEM JavaScript: uma caixa de seleção (`checkbox`) marcada pelo
 * `<label>` do botão de menu mostra a gaveta por CSS. Fechada, a gaveta fica
 * `visibility: hidden`, então os links dela não recebem foco.
 */
import type { ShellProps } from "@rubrica/core";
import { Img, Logo } from "@rubrica/core/components";
import { Icon, type IconName } from "./icons";

export interface SidebarOptions {
  /** Avatar do perfil: `md` (5rem, padrão) ou `lg` (7rem, como no cyberpunk). */
  avatar?: "md" | "lg";
}

/** Ícone do item de menu pelo último trecho do caminho (sem prefixo de idioma). */
function navIcon(href: string): IconName {
  const last = href.split("/").filter(Boolean).pop() ?? "";
  if (!last || /^[a-z]{2}(-[A-Za-z]{2})?$/.test(last)) return "home";
  if (/curr|resume|cv/i.test(last)) return "briefcase";
  if (/portf|proje|cases|trabalh/i.test(last)) return "folder";
  if (/sobre|about|quem/i.test(last)) return "user";
  if (/blog|post/i.test(last)) return "pen";
  if (/contat|contact/i.test(last)) return "mail";
  return "folder";
}

const SOCIAL_ICONS: Record<string, IconName> = { github: "github", linkedin: "linkedin" };

export function createSidebarShell({ avatar = "md" }: SidebarOptions = {}) {
  return function SidebarShell({ ctx, children, colorToggle, localeSwitcher }: ShellProps) {
    const { site } = ctx;
    const person = site.person;
    const name = person?.name ?? site.name;
    const role = person?.jobTitle;
    const org = site.organization;
    const email = person?.email ?? org?.email;
    const phone = person?.whatsapp ?? person?.phone ?? org?.whatsapp ?? org?.phone;
    const whatsapp = person?.whatsapp ?? org?.whatsapp;
    const hasResume = site.navigation.some((n) => /curr|resume/i.test(n.href));
    const talkHref = site.kind === "empresa" ? ctx.href("/contato") : `${ctx.href("/")}#contato`;
    const year = new Date().getUTCFullYear();
    const initial = name.trim().charAt(0).toUpperCase();

    const Avatar = ({ className }: { className: string }) => (
      <span className={className}>
        {person?.photo ? <Img image={{ ...person.photo, alt: "" }} className="rb-avatar__img" priority sizes="112px" /> : <span className="rb-avatar__initial" aria-hidden="true">{initial}</span>}
      </span>
    );

    return (
      <div className="rb-app" data-avatar={avatar}>
        <a className="rb-skip" href="#conteudo">
          {ctx.t("nav.skip")}
        </a>
        <input type="checkbox" id="rb-menu" className="rb-menu__input rb-sr-only" aria-label={ctx.t("nav.menu")} />

        <header className="rb-bar">
          <a className="rb-bar__brand" href={ctx.href("/")}>
            {site.logo ? (
              <Logo logo={site.logo} className="rb-bar__logo" priority />
            ) : (
              <>
                <Avatar className="rb-avatar rb-avatar--sm" />
                <span className="rb-bar__name">{name}</span>
              </>
            )}
          </a>
          <label htmlFor="rb-menu" className="rb-bar__menu" aria-hidden="true">
            <Icon name="menu" size={20} />
          </label>
        </header>
        <label htmlFor="rb-menu" className="rb-scrim" aria-hidden="true" />

        <aside className="rb-side">
          {site.logo && (
            <a href={ctx.href("/")} className="rb-side__logo">
              <Logo logo={site.logo} />
            </a>
          )}
          <div className="rb-profile">
            <a href={ctx.href("/")} className="rb-profile__link" tabIndex={-1} aria-hidden="true">
              <Avatar className="rb-avatar rb-avatar--lg" />
            </a>
            {/* Nome em <p>: a sidebar aparece em todas as páginas; o h1 é do conteúdo. */}
            <p className="rb-profile__name">{name}</p>
            {role && (
              <p className="rb-profile__role">
                <span className="rb-profile__tag" aria-hidden="true">&lt;code&gt;</span>
                <span>{role}</span>
                <span className="rb-profile__tag" aria-hidden="true">&lt;/code&gt;</span>
              </p>
            )}
          </div>

          <nav className="rb-sidenav" aria-label={ctx.t("nav.menu")}>
            <ul>
              {site.navigation.map((n) => (
                <li key={n.href}>
                  <a href={n.href} aria-current={n.current ? "page" : undefined}>
                    <Icon name={navIcon(n.href)} />
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="rb-side__foot">
            {(email || phone) && (
              <div className="rb-side__contact">
                <p className="rb-side__label">{ctx.t("sidebar.contact")}</p>
                {email && (
                  <a href={`mailto:${email}`}>
                    <Icon name="mail" size={14} />
                    <span>{email}</span>
                  </a>
                )}
                {phone && (
                  <a href={whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : `tel:${phone.replace(/[^\d+]/g, "")}`} {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    <Icon name="phone" size={14} />
                    <span>{phone}</span>
                  </a>
                )}
              </div>
            )}

            {site.social.length > 0 && (
              <ul className="rb-side__social">
                {site.social.map((s) => {
                  const icon = SOCIAL_ICONS[s.network.toLowerCase()];
                  return (
                    <li key={s.url}>
                      <a href={s.url} rel="me noopener noreferrer" target="_blank" aria-label={s.network}>
                        {icon ? <Icon name={icon} /> : <span aria-hidden="true" className="rb-side__social-text">{s.network.slice(0, 2)}</span>}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}

            {colorToggle && <div className="rb-side__toggle">{colorToggle}</div>}
            {localeSwitcher && <div className="rb-side__locales">{localeSwitcher}</div>}

            <div className="rb-side__actions">
              <a className="rb-side__talk" href={talkHref}>
                <Icon name="message" size={14} />
                {ctx.t("sidebar.talk")}
              </a>
              {hasResume && (
                <a className="rb-side__cv" href={ctx.href("/curriculo")}>
                  <Icon name="file" size={14} />
                  {ctx.t("resume.download")}
                </a>
              )}
            </div>
          </div>
        </aside>

        <main id="conteudo" className="rb-main">
          <div className="rb-main__inner">{children}</div>
          <footer className="rb-footer">
            <p>
              © {year} {org?.legalName ?? name}. {ctx.t("footer.rights")}
              {" · "}
              <a href={ctx.href("/privacidade")}>{ctx.t("footer.privacy")}</a>
            </p>
          </footer>
        </main>
      </div>
    );
  };
}
