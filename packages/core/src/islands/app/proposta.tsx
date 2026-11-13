/**
 * `/proposta/<slug>` (plugin `proposals`; port de `Proposal.tsx` da v1): senha → conteúdo
 * (apresentação, objetivo, escopo com preços e brindes, cronograma, investimento, formas de
 * pagamento, condições, rescisão, contrato) → botão para o aceite. Sem formas de pagamento
 * ou rescisão na proposta, entram os padrões da v1 (`proposalTexts`). Com a proposta aceita, mostra o registro e baixa o
 * contrato em PDF. O conteúdo de proposta com senha só sai do servidor com a sessão.
 */
import { useEffect, useId, useState, type CSSProperties, type FormEvent } from "react";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { makeT } from "../kit";
import { FN, HTTP, useWatch, type AppApi } from "./client";
import { proposalTexts, type Acceptance, type OpenProposal, type PublicProposal } from "./contract";
import { dateText, money, pickText } from "./format";
import { markdownToHtml } from "./markdown";
import { ContractText, contractHtml, downloadContract, proposalArgs, useProposalToken } from "./proposal-shared";
import { Gate, baseState, hrefFor, useAppApi, useParams, type AppIslandProps, type T } from "./ui";

export default function Proposta(props: AppIslandProps) {
  const t = makeT(props.texts);
  const api = useAppApi(props);
  const params = useParams(props.pattern);
  const slug = params?.slug;
  const session = useProposalToken(slug);
  const watched = useWatch<PublicProposal | null>(api, FN.proposal, proposalArgs(slug, session));
  const [sessionExpired, setSessionExpired] = useState(false);

  const proposal = watched.state === "ready" ? watched.value : null;
  // Token guardado que não vale mais (venceu, senha trocada): descarta e pede a senha.
  const staleToken = !!proposal?.locked && !!session.token;
  useEffect(() => {
    if (!staleToken) return;
    setSessionExpired(true);
    session.setToken(null);
  }, [staleToken, session]);

  const base = baseState(props, params, watched);
  if (base) return <Gate props={props} t={t} state={base} />;
  if (!proposal || !slug) return <Gate props={props} t={t} state="notFound" />;
  if (proposal.locked) {
    return <PasswordForm t={t} api={api!} slug={slug} notice={sessionExpired ? t("proposal.sessionExpired") : undefined} onToken={(token) => session.setToken(token)} />;
  }
  return <ProposalView props={props} t={t} api={api!} proposal={proposal} slug={slug} token={session.token} />;
}

function PasswordForm({ t, api, slug, notice, onToken }: { t: T; api: AppApi; slug: string; notice?: string; onToken: (token: string) => void }) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password) return setError(t("form.required"));
    setBusy(true);
    setError(undefined);
    const res = await api.post(HTTP.session, { slug, password });
    setBusy(false);
    if (res.status === 200 && typeof res.body.token === "string") return onToken(res.body.token);
    setError(res.status === 401 ? t("proposal.wrongPassword") : res.status === 429 ? t("proposal.tooManyAttempts") : res.status === 404 ? t("app.notFound.body") : t("app.error"));
  }

  return (
    <div className="rb-flow__narrow">
      <form className="rb-form" onSubmit={submit} noValidate>
        <h1 className="rb-flow__title">{t("proposal.locked.title")}</h1>
        <p>{t("proposal.locked.body")}</p>
        {notice && <p className="rb-flow__hint" role="status">{notice}</p>}
        <div className="rb-field">
          <label htmlFor={`${id}-password`}>{t("proposal.password")}</label>
          <input
            id={`${id}-password`}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            required
          />
          {error && (
            <span className="rb-field__error" id={`${id}-error`} role="alert">
              {error}
            </span>
          )}
        </div>
        <button type="submit" className="rb-button rb-button--primary" disabled={busy}>
          {busy ? t("proposal.opening") : t("proposal.open")}
        </button>
      </form>
    </div>
  );
}

/** Ícones de traço (decorativos), na cor do texto. */
const ICONS = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  clock: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
  check: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  money: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  doc: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  layers: "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="rb-proposal__icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Ordem da entrada em cascata (CSS `--rb-i`). */
const rise = (i: number) => ({ "--rb-i": i }) as CSSProperties;

function ProposalView({ props, t, api, proposal: p, slug, token }: { props: AppIslandProps; t: T; api: AppApi; proposal: OpenProposal; slug: string; token?: string }) {
  const { locale, defaultLocale: fallback } = props;
  const texts = proposalTexts(p, locale, fallback, t);
  const discount = summarizeDiscount(p);
  const fmt = (v: number) => money(v, locale);
  const acceptance = useWatch<Acceptance | null>(api, FN.acceptance, p.isAccepted && token ? { slug, token } : null);
  const accepted = acceptance.state === "ready" ? acceptance.value : null;
  const [popupBlocked, setPopupBlocked] = useState(false);
  const contract = contractHtml(t, p, accepted, locale, fallback);
  const title = texts.title || t("proposal.preparedFor", { client: p.clientName });
  const siteName = pickText(p.contractor.name, locale, fallback);
  const author = p.contractor.person?.name || siteName || p.contractor.organization?.legalName || "";
  const owner = siteName || p.contractor.organization?.legalName || p.contractor.person?.name || "";
  let i = 0;

  return (
    <article className="rb-flow__doc rb-proposal">
      {p.isAccepted && (
        <div className="rb-flow__notice rb-flow__notice--success" role="status">
          <p className="rb-flow__notice-title">{t("proposal.accepted")}</p>
          {accepted ? (
            <p>{t("proposal.acceptedBy", { date: dateText(accepted.acceptedAt, locale), name: accepted.clientName })}</p>
          ) : (
            p.acceptedAt && <p>{t("proposal.acceptedAt", { date: dateText(p.acceptedAt, locale) })}</p>
          )}
          {accepted && (
            <div className="rb-actions">
              <button type="button" className="rb-button rb-button--primary" onClick={() => setPopupBlocked(!downloadContract(t, p, accepted, locale, fallback))}>
                {t("proposal.downloadContract")}
              </button>
            </div>
          )}
          {popupBlocked && <p className="rb-field__error" role="alert">{t("contract.popup")}</p>}
        </div>
      )}
      {p.isExpired && !p.isAccepted && (
        <div className="rb-flow__notice rb-flow__notice--danger" role="alert">
          <p className="rb-flow__notice-title">{t("proposal.expired", { date: dateText(p.expiresAt, locale) })}</p>
          <p>{t("proposal.expiredHint")}</p>
        </div>
      )}

      <header className="rb-proposal__hero rb-proposal__rise" style={rise(i++)}>
        <p className="rb-proposal__badge">{t("proposal.badge")}</p>
        <h1 className="rb-proposal__title">{title}</h1>
        <p className="rb-proposal__lead">{t("proposal.preparedFor", { client: p.clientName })}</p>
        <ul className="rb-proposal__meta">
          <li>
            <Icon name="calendar" />
            {t("proposal.createdAt", { date: dateText(p.createdAt, locale) })}
          </li>
          <li className={p.isExpired ? "rb-proposal__meta--danger" : undefined}>
            <Icon name="clock" />
            {t("proposal.validUntil", { date: dateText(p.expiresAt, locale) })}
          </li>
          <li>
            <Icon name="layers" />
            {t("proposal.version", { version: p.version })}
          </li>
        </ul>
      </header>

      <section className="rb-proposal__card rb-proposal__rise" style={rise(i++)}>
        <h2 className="rb-proposal__heading">{t("proposal.introTitle")}</h2>
        <p className="rb-flow__pre rb-proposal__body">{t("proposal.intro", { name: author })}</p>
      </section>

      {texts.objective && (
        <section className="rb-proposal__card rb-proposal__rise" style={rise(i++)}>
          <h2 className="rb-proposal__heading">{t("proposal.objective")}</h2>
          <p className="rb-flow__pre rb-proposal__body">{texts.objective}</p>
        </section>
      )}

      {(texts.scope.length > 0 || texts.timeline.length > 0 || p.deliveryDate.trim()) && (
        <div className="rb-proposal__pair">
          {texts.scope.length > 0 && (
            <section className="rb-proposal__card rb-proposal__rise" style={rise(i++)}>
              <h2 className="rb-proposal__heading rb-proposal__heading--icon">
                <Icon name="check" />
                {t("proposal.scope")}
              </h2>
              <ul className="rb-proposal__scope">
                {texts.scope.map((item, n) => {
                  const price = discount.priceOf(n);
                  return (
                    <li key={n}>
                      <span>{item}</span>
                      {price !== undefined &&
                        (discount.isGift(n) ? (
                          <span className="rb-flow__price">
                            <span className="rb-proposal__chip rb-proposal__chip--gift">{t("proposal.gift")}</span>
                            <span className="rb-sr-only">{t("proposal.originalPrice")}: </span>
                            <s>{fmt(price)}</s> <span className="rb-sr-only">{t("proposal.finalPrice")}: </span>
                            <strong>{fmt(0)}</strong>
                          </span>
                        ) : (
                          <span className="rb-flow__price">{fmt(price)}</span>
                        ))}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(texts.timeline.length > 0 || p.deliveryDate.trim()) && (
            <section className="rb-proposal__card rb-proposal__rise" style={rise(i++)}>
              <h2 className="rb-proposal__heading rb-proposal__heading--icon">
                <Icon name="clock" />
                {t("proposal.timeline")}
              </h2>
              {texts.timeline.length > 0 && (
                <ol className="rb-proposal__timeline">
                  {texts.timeline.map((step, n) => (
                    <li key={n}>
                      <strong>{step.step}</strong>
                      {step.period && <span>{step.period}</span>}
                    </li>
                  ))}
                </ol>
              )}
              {p.deliveryDate.trim() && <p className="rb-proposal__delivery">{t("proposal.delivery", { date: p.deliveryDate.trim() })}</p>}
            </section>
          )}
        </div>
      )}

      <section className="rb-proposal__card rb-proposal__investment rb-proposal__rise" style={rise(i++)}>
        <div className="rb-proposal__investment-top">
          <div>
            <h2 className="rb-proposal__investment-title">{t("proposal.investmentTotal")}</h2>
            <p className="rb-proposal__investment-lead">{t("proposal.investmentLead")}</p>
          </div>
          <div className="rb-proposal__price">
            {discount.hasDiscount && (
              <p className="rb-flow__original">
                <span className="rb-sr-only">{t("proposal.originalPrice")}: </span>
                <s>{fmt(discount.originalValue)}</s> <span className="rb-proposal__chip">−{discount.discountPercent}%</span>
              </p>
            )}
            <p className="rb-proposal__total">
              {discount.hasDiscount && <span className="rb-sr-only">{t("proposal.finalPrice")}: </span>}
              {fmt(p.investmentValue)}
            </p>
            {discount.hasDiscount && (
              <p className="rb-flow__hint">
                {t("proposal.discount", { amount: fmt(discount.discountAmount), percent: discount.discountPercent })}
                {discount.giftCount > 0 && ` · ${discount.giftCount === 1 ? t("proposal.giftsOne") : t("proposal.giftsMany", { count: discount.giftCount })}`}
              </p>
            )}
            {texts.paymentMethods.length > 1 && <span className="rb-proposal__chip rb-proposal__chip--accent">{t("proposal.easyPayment")}</span>}
          </div>
        </div>
        {(texts.paymentMethods.length > 0 || texts.conditions.length > 0) && (
          <div className="rb-proposal__terms">
            {texts.paymentMethods.length > 0 && (
              <div>
                <h3 className="rb-proposal__heading--icon">
                  <Icon name="money" />
                  {t("proposal.paymentMethods")}
                </h3>
                <ul>
                  {texts.paymentMethods.map((m, n) => (
                    <li key={n}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {texts.conditions.length > 0 && (
              <div>
                <h3 className="rb-proposal__heading--icon">
                  <Icon name="check" />
                  {t("proposal.conditions")}
                </h3>
                <ul>
                  {texts.conditions.map((c, n) => (
                    <li key={n}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      <details className="rb-proposal__card rb-proposal__details rb-proposal__rise" style={rise(i++)}>
        <summary>
          <h2 className="rb-proposal__heading rb-proposal__heading--icon">
            <Icon name="shield" />
            {t("proposal.rescission")}
          </h2>
        </summary>
        <ContractText html={markdownToHtml(texts.rescissionPolicy, 3)} />
      </details>

      {contract && (
        <details className="rb-proposal__card rb-proposal__details rb-proposal__rise" style={rise(i++)}>
          <summary>
            <h2 className="rb-proposal__heading rb-proposal__heading--icon">
              <Icon name="doc" />
              {t("proposal.readContract")}
            </h2>
          </summary>
          <ContractText html={contract} />
        </details>
      )}

      {!p.isAccepted && !p.isExpired && (
        <div className="rb-proposal__cta rb-proposal__rise" style={rise(i++)}>
          <p>{t("proposal.goToAccept")}</p>
          <a className="rb-button rb-button--primary rb-proposal__cta-button" href={hrefFor(props, "proposta-aceite", { slug })}>
            {t("proposal.accept")}
          </a>
        </div>
      )}

      <footer className="rb-proposal__footer">
        {owner && <p>{t("proposal.copyright", { year: new Date().getFullYear(), name: owner })}</p>}
        <p className="rb-flow__fineprint">{t("proposal.confidential")}</p>
      </footer>
    </article>
  );
}
