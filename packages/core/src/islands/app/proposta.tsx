/**
 * `/proposta/<slug>` (plugin `proposals`; port de `Proposal.tsx` da v1): senha → conteúdo
 * (objetivo, escopo com preços e brindes, cronograma, investimento, condições, rescisão,
 * contrato) → botão para o aceite. Com a proposta aceita, mostra o registro e baixa o
 * contrato em PDF. O conteúdo de proposta com senha só sai do servidor com a sessão.
 */
import { useEffect, useId, useState, type FormEvent } from "react";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { makeT } from "../kit";
import { FN, HTTP, useWatch, type AppApi } from "./client";
import { proposalTexts, type Acceptance, type OpenProposal, type PublicProposal } from "./contract";
import { dateText, money } from "./format";
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
    <div className="rb-app__narrow">
      <form className="rb-form" onSubmit={submit} noValidate>
        <h1 className="rb-app__title">{t("proposal.locked.title")}</h1>
        <p>{t("proposal.locked.body")}</p>
        {notice && <p className="rb-app__hint" role="status">{notice}</p>}
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

function ProposalView({ props, t, api, proposal: p, slug, token }: { props: AppIslandProps; t: T; api: AppApi; proposal: OpenProposal; slug: string; token?: string }) {
  const { locale, defaultLocale: fallback } = props;
  const texts = proposalTexts(p, locale, fallback);
  const discount = summarizeDiscount(p);
  const fmt = (v: number) => money(v, locale);
  const acceptance = useWatch<Acceptance | null>(api, FN.acceptance, p.isAccepted && token ? { slug, token } : null);
  const accepted = acceptance.state === "ready" ? acceptance.value : null;
  const [popupBlocked, setPopupBlocked] = useState(false);
  const contract = contractHtml(p, accepted, locale, fallback);
  const title = texts.title || t("proposal.preparedFor", { client: p.clientName });

  return (
    <article className="rb-app__doc">
      {p.isAccepted && (
        <div className="rb-app__notice rb-app__notice--success" role="status">
          <p className="rb-app__notice-title">{t("proposal.accepted")}</p>
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
        <div className="rb-app__notice rb-app__notice--danger" role="alert">
          <p className="rb-app__notice-title">{t("proposal.expired", { date: dateText(p.expiresAt, locale) })}</p>
          <p>{t("proposal.expiredHint")}</p>
        </div>
      )}

      <header className="rb-app__header">
        <p className="rb-app__eyebrow">{t("proposal.badge")}</p>
        <h1 className="rb-app__title">{title}</h1>
        <p className="rb-app__lead">{t("proposal.preparedFor", { client: p.clientName })}</p>
        <ul className="rb-app__meta">
          <li>{t("proposal.createdAt", { date: dateText(p.createdAt, locale) })}</li>
          <li>{t("proposal.validUntil", { date: dateText(p.expiresAt, locale) })}</li>
          <li>{t("proposal.version", { version: p.version })}</li>
        </ul>
      </header>

      {texts.objective && (
        <section className="rb-app__section">
          <h2>{t("proposal.objective")}</h2>
          <p className="rb-app__pre">{texts.objective}</p>
        </section>
      )}

      {texts.scope.length > 0 && (
        <section className="rb-app__section">
          <h2>{t("proposal.scope")}</h2>
          <ul className="rb-app__list">
            {texts.scope.map((item, i) => {
              const price = discount.priceOf(i);
              return (
                <li key={i}>
                  <span>{item}</span>
                  {price !== undefined &&
                    (discount.isGift(i) ? (
                      <span className="rb-app__price">
                        <span className="rb-app__badge">{t("proposal.gift")}</span>
                        <span className="rb-sr-only">{t("proposal.originalPrice")}: </span>
                        <s>{fmt(price)}</s> <span className="rb-sr-only">{t("proposal.finalPrice")}: </span>
                        {fmt(0)}
                      </span>
                    ) : (
                      <span className="rb-app__price">{fmt(price)}</span>
                    ))}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {(texts.timeline.length > 0 || p.deliveryDate.trim()) && (
        <section className="rb-app__section">
          <h2>{t("proposal.timeline")}</h2>
          {texts.timeline.length > 0 && (
            <ol className="rb-app__timeline">
              {texts.timeline.map((step, i) => (
                <li key={i}>
                  <strong>{step.step}</strong>
                  {step.period && <span>{step.period}</span>}
                </li>
              ))}
            </ol>
          )}
          {p.deliveryDate.trim() && <p>{t("proposal.delivery", { date: p.deliveryDate.trim() })}</p>}
        </section>
      )}

      <section className="rb-app__section rb-app__investment">
        <h2>{t("proposal.investment")}</h2>
        {discount.hasDiscount && (
          <p className="rb-app__original">
            <span className="rb-sr-only">{t("proposal.originalPrice")}: </span>
            <s>{fmt(discount.originalValue)}</s> <span className="rb-app__badge">−{discount.discountPercent}%</span>
          </p>
        )}
        <p className="rb-app__total">
          {discount.hasDiscount && <span className="rb-sr-only">{t("proposal.finalPrice")}: </span>}
          {fmt(p.investmentValue)}
        </p>
        {discount.hasDiscount && (
          <p className="rb-app__hint">
            {t("proposal.discount", { amount: fmt(discount.discountAmount), percent: discount.discountPercent })}
            {discount.giftCount > 0 && ` · ${discount.giftCount === 1 ? t("proposal.giftsOne") : t("proposal.giftsMany", { count: discount.giftCount })}`}
          </p>
        )}
        <div className="rb-app__columns">
          {texts.paymentMethods.length > 0 && (
            <div>
              <h3>{t("proposal.paymentMethods")}</h3>
              <ul>
                {texts.paymentMethods.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {texts.conditions.length > 0 && (
            <div>
              <h3>{t("proposal.conditions")}</h3>
              <ul>
                {texts.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {texts.rescissionPolicy && (
        <details className="rb-app__details">
          <summary>
            <h2>{t("proposal.rescission")}</h2>
          </summary>
          <ContractText html={markdownToHtml(texts.rescissionPolicy, 3)} />
        </details>
      )}

      {contract && (
        <details className="rb-app__details">
          <summary>
            <h2>{t("proposal.readContract")}</h2>
          </summary>
          <ContractText html={contract} />
        </details>
      )}

      {!p.isAccepted && !p.isExpired && (
        <div className="rb-actions rb-app__cta">
          <a className="rb-button rb-button--primary" href={hrefFor(props, "proposta-aceite", { slug })}>
            {t("proposal.accept")}
          </a>
        </div>
      )}

      <p className="rb-app__fineprint">{t("proposal.confidential")}</p>
    </article>
  );
}

