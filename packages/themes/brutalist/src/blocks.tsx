/**
 * Blocos do tema Terminal Brutalista. Substitui só os que, na v1, tinham outro desenho:
 * `hero` (nome em arte ASCII e o "cat /etc/motd"), `texto` (parágrafos numerados),
 * `cases` (grade com `[01]` e o modo "README"), `depoimentos` (e-mails de clientes), `faq`
 * (Q/A com o primeiro aberto e invertido), `galeria` (arquivos `img_001.jpg`) e `cta`
 * (caixa `./contato.sh`). Os outros herdam o núcleo e ganham o visual pelo CSS (títulos
 * como régua `─── [ TÍTULO ] ───`, bordas retas, contadores `[01]`).
 *
 * Os comandos do prompt (`cat /etc/motd`, `ls -la`) são enfeite de terminal, não texto de
 * interface: ficam fora do `ctx.t` e dentro de `aria-hidden`.
 */
import type { BlockProps, CollectionItems } from "@rubrica/core";
import { Heading, Html, Img, LinkButton, Section, SectionHeader } from "@rubrica/core/components";
import { banner } from "./art";
import { slug } from "./shell";

type Project = CollectionItems["projects"];
type Testimonial = CollectionItems["testimonials"];
type Faq = CollectionItems["faq"];
type Routine = CollectionItems["routine"];

interface Common {
  anchor?: string;
  title?: string;
  intro?: string;
}

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

/** Linha de prompt decorativa: `usuario@site:~$ comando`. */
function Prompt({ cmd, host }: { cmd: string; host: string }) {
  return (
    <p className="br-prompt" aria-hidden="true">
      <span className="br-prompt__host">user@{host}</span>
      <span className="br-prompt__sep">:~$ </span>
      <b>{cmd}</b>
    </p>
  );
}

/* ---------- hero ---------- */

interface HeroFields {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  image?: import("@rubrica/core").ResolvedImage;
  tags?: { label: string }[];
  primaryCta?: import("@rubrica/core").ResolvedLink;
  secondaryCta?: import("@rubrica/core").ResolvedLink;
  showAvailability?: boolean;
}

export function HeroBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<HeroFields>) {
  const { site } = ctx;
  const name = site.kind === "pessoal" ? (site.person?.name ?? site.name) : site.name;
  const art = banner(name);
  return (
    <Section id={id} type="hero" variant={variant}>
      <div className="br-hero">
        {/* Nome do site em arte ASCII (telas largas) ou texto grande (celular). O h1 é o título. */}
        <div className="br-banner" aria-hidden="true">
          {art && (
            <pre className="br-banner__art" style={{ ["--br-cols" as string]: art.cols }}>
              {art.art}
            </pre>
          )}
          <span className={art ? "br-banner__plain br-banner__plain--small" : "br-banner__plain"}>{name}</span>
        </div>
        {fields.eyebrow && <p className="br-comment">{`// ${fields.eyebrow}`}</p>}
        {fields.showAvailability && (
          <p className="br-avail">
            <span aria-hidden="true">[●] </span>
            {ctx.t("hero.available")}
          </p>
        )}
        <Prompt cmd="cat /etc/motd" host={slug(site.name)} />
        <div className="br-motd">
          {fields.title && (
            <Heading level={headingLevel} className="br-motd__title">
              {fields.title}
            </Heading>
          )}
          {fields.subtitle && <p className="br-motd__text">{fields.subtitle}</p>}
          {!!fields.tags?.length && (
            <ul className="br-taglist">
              {fields.tags.map((t, i) => (
                <li key={`${i}-${t.label}`}>{t.label}</li>
              ))}
            </ul>
          )}
        </div>
        {(fields.primaryCta || fields.secondaryCta) && (
          <div className="rb-actions">
            {fields.primaryCta && <LinkButton link={fields.primaryCta} />}
            {fields.secondaryCta && <LinkButton link={fields.secondaryCta} variant="secondary" />}
          </div>
        )}
        {fields.image && <Img image={fields.image} className="br-hero__image" priority sizes="(min-width: 960px) 40vw, 100vw" />}
      </div>
    </Section>
  );
}

/* ---------- texto ---------- */

interface TextoFields extends Common {
  body?: string;
  image?: import("@rubrica/core").ResolvedImage;
  imagePosition?: "start" | "end";
}

/** Variações: `simples` (faixa lateral) e `numerado` (parágrafos `01|`, como a bio da v1). */
export function TextoBlock({ id, variant, fields, headingLevel }: BlockProps<TextoFields>) {
  const image = fields.image && <Img image={fields.image} className="rb-texto__image" sizes="(min-width: 960px) 40vw, 100vw" />;
  return (
    <Section id={id} anchor={fields.anchor} type="texto" variant={variant} className={image ? "rb-texto--media" : undefined}>
      {fields.imagePosition === "start" && image}
      <div className="rb-texto__body">
        {fields.title && (
          <Heading level={headingLevel} className="rb-section__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <Html html={fields.body} className="rb-prose br-prose" />}
      </div>
      {fields.imagePosition !== "start" && image}
    </Section>
  );
}

/* ---------- cases ---------- */

interface CasesFields extends Common {
  cta?: import("@rubrica/core").ResolvedLink;
}

/** Nome de pasta do projeto, como na v1: minúsculo, com hífens. */
const folder = (title: string) => title.toLowerCase().replace(/\s+/g, "-");

/**
 * `grade`: colunas separadas por filete, `[01] título`, resumo e "ver".
 * `lista`: índice no estilo `ls -la` e, abaixo, um cartão "README" por projeto.
 */
export function CasesBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<CasesFields, Project>) {
  const list = variant === "lista";
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length === 0 ? (
        <p className="rb-empty">{ctx.t("common.empty")}</p>
      ) : list ? (
        <>
          <pre className="br-ls" aria-hidden="true">
            {ctx.t("brutalist.total", { count: items.length })}
            {"\n"}
            {items.map((p) => (
              <span key={p.id}>
                <span className="br-ls__perm">drwxr-xr-x {pad(p.tags.length)}k </span>
                <b>{`${folder(p.title)}/`.padEnd(28, " ")}</b>
                <span className="br-ls__tags">{p.tags.length ? `[${p.tags.slice(0, 3).join(", ")}]` : ""}</span>
                {"\n"}
              </span>
            ))}
          </pre>
          <ul className="br-readmes">
            {items.map((p, i) => (
              <li key={p.id} className="br-readme">
                <p className="br-readme__bar br-inv">
                  <span className="br-readme__n">[{pad(i + 1)}]</span> <b>{`./${folder(p.title)}/README.md`}</b>
                </p>
                <div className="br-readme__grid">
                  {p.cover && <Img image={p.cover} className="br-readme__image" sizes="(min-width: 960px) 280px, 100vw" />}
                  <div className="br-readme__body">
                    <Heading level={3} className="br-readme__title">
                      # {p.title}
                    </Heading>
                    {p.summary && <p className="br-readme__text">{p.summary}</p>}
                    {p.tags.length > 0 && (
                      <p className="br-code">
                        <span className="br-code__key">tags=</span>[
                        {p.tags.map((t, j) => (
                          <span key={t}>
                            <span className="br-code__val">&ldquo;{t}&rdquo;</span>
                            {j < p.tags.length - 1 && ", "}
                          </span>
                        ))}
                        ]
                      </p>
                    )}
                    <div className="rb-actions">
                      <a className="rb-button rb-button--primary" href={p.url}>
                        {ctx.t("case.view")}
                        <span className="rb-sr-only">: {p.title}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="br-cells br-cases">
          {items.map((p, i) => (
            <li key={p.id} className="br-cell br-case">
              <Heading level={3} className="br-case__title">
                <span className="br-n" aria-hidden="true">
                  [{pad(i + 1)}]{" "}
                </span>
                <a href={p.url} className="br-case__link">
                  {p.title}
                </a>
              </Heading>
              {p.summary && <p className="br-case__text">{p.summary}</p>}
              {p.tags.length > 0 && (
                <ul className="br-taglist">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              <span className="br-case__more" aria-hidden="true">
                {ctx.t("case.view")} →
              </span>
            </li>
          ))}
        </ul>
      )}
      {fields.cta && (
        <p className="br-seeall">
          <a href={fields.cta.href}>› {fields.cta.label}</a>
        </p>
      )}
    </Section>
  );
}

/* ---------- depoimentos ---------- */

interface DepoimentosFields extends Common {
  allowSubmission?: boolean;
}

export function DepoimentosBlock({ id, variant, fields, items, headingLevel, ctx, island }: BlockProps<DepoimentosFields, Testimonial>) {
  return (
    <Section id={id} anchor={fields.anchor} type="depoimentos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="br-mails">
          {items.map((t, i) => (
            <li key={t.id}>
              <figure className={`br-mail${i === 0 ? " br-inv" : ""}`}>
                <figcaption className="br-mail__from">
                  {t.avatar && <Img image={t.avatar} className="br-mail__avatar" sizes="32px" />}
                  <span>
                    {"> "}
                    {ctx.t("brutalist.from")}: <strong>{t.author}</strong>
                    {(t.role || t.company) && <> &lt;{[t.role, t.company].filter(Boolean).join(", ")}&gt;</>}
                  </span>
                </figcaption>
                <blockquote className="br-mail__text">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
              </figure>
            </li>
          ))}
        </ul>
      )}
      {fields.allowSubmission && island ? <div className="rb-island">{island}</div> : null}
    </Section>
  );
}

/* ---------- faq ---------- */

export function FaqBlock({ id, variant, fields, items, headingLevel, ctx }: BlockProps<Common, Faq>) {
  return (
    <Section id={id} anchor={fields.anchor} type="faq" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <div className="br-faq">
          {items.map((q, i) => (
            <details key={q.id} className={`br-faq__item${i === 0 ? " br-inv" : ""}`} open={i === 0}>
              <summary className="br-faq__q">
                <span className="br-faq__n">
                  {ctx.t("brutalist.question")}
                  {pad(i + 1)}.
                </span>
                <span className="br-faq__title">{q.question}</span>
                <span className="br-faq__sign" aria-hidden="true" />
              </summary>
              <div className="br-faq__a">
                <span className="br-faq__n">{ctx.t("brutalist.answer")}.</span>
                <Html html={q.answer} className="br-faq__text" />
              </div>
            </details>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---------- galeria ---------- */

export function GaleriaBlock({ id, variant, fields, items, headingLevel }: BlockProps<Common, Routine>) {
  return (
    <Section id={id} anchor={fields.anchor} type="galeria" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      {items.length > 0 && (
        <ul className="br-cells br-files">
          {items.map((item, i) => (
            <li key={item.id} className="br-cell br-file">
              {item.image && <Img image={item.image} className="br-file__image" sizes="(min-width: 960px) 30vw, 100vw" />}
              <div className="br-file__bar">
                <span className="br-file__name" aria-hidden="true">
                  › img_{pad(i + 1, 3)}.jpg
                </span>
                <Heading level={3} className="br-file__title">
                  {item.title}
                </Heading>
              </div>
              {item.description && <p className="br-file__text">{item.description}</p>}
              {item.tags.length > 0 && (
                <ul className="br-taglist">
                  {item.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/* ---------- cta ---------- */

interface CtaFields extends Common {
  body?: string;
  primary?: import("@rubrica/core").ResolvedLink;
  secondary?: import("@rubrica/core").ResolvedLink;
}

export function CtaBlock({ id, variant, fields, headingLevel, ctx }: BlockProps<CtaFields>) {
  return (
    <Section id={id} anchor={fields.anchor} type="cta" variant={variant}>
      <div className="br-cta">
        <Prompt cmd="./contato.sh" host={slug(ctx.site.name)} />
        {fields.title && (
          <Heading level={headingLevel} className="br-cta__title">
            {fields.title}
          </Heading>
        )}
        {fields.body && <p className="br-cta__text">{fields.body}</p>}
        <div className="rb-actions">
          {fields.primary && <LinkButton link={fields.primary} />}
          {fields.secondary && <LinkButton link={fields.secondary} variant="secondary" />}
        </div>
      </div>
    </Section>
  );
}

export const BRUTALIST_BLOCKS = {
  hero: HeroBlock,
  texto: TextoBlock,
  cases: CasesBlock,
  depoimentos: DepoimentosBlock,
  faq: FaqBlock,
  galeria: GaleriaBlock,
  cta: CtaBlock,
};
