/**
 * `/checkout/<uniqueLink>` (plugin `payments`; port de `Checkout.tsx` da v1).
 *
 * - **Checkout** (criado no painel): dados do pagador e do pagamento → PIX, boleto ou
 *   cartão (parcelado) pelo Asaas. PIX mostra o QR Code e o copia e cola; boleto, a
 *   linha digitável e o PDF; cartão vai para a página segura do Asaas. A leitura é ao
 *   vivo: quando o webhook confirma, a página vai para "pagamento concluído".
 * - **Link de plano**: o visitante informa os dados, o servidor cria o checkout dele e a
 *   página segue para o endereço novo.
 */
import { useEffect, useId, useState, type FormEvent } from "react";
import { installmentOptions, type InstallmentPlan } from "../../convex/commerce/lib/installments";
import type { Localized } from "../../i18n";
import { EMAIL_RE, Field, makeT } from "../kit";
import { FN, HTTP, errorCode, useWatch, type AppApi } from "./client";
import { dateTimeText, dayText, isDocument, maskDocument, money, onlyDigits, pickText } from "./format";
import { Gate, Notice, baseState, copyText, hrefFor, useAppApi, useParams, type AppIslandProps, type T } from "./ui";

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

export interface PublicCheckout {
  kind: "checkout";
  _id: string;
  uniqueLink: string;
  customerName: string;
  customerEmail: string;
  value: number;
  description?: string;
  dueDate: string;
  billingType?: BillingType;
  status: "pending" | "payment_selected" | "payment_confirmed" | "paid" | "expired" | "failed" | "refunded";
  expiresAt: number;
  paymentMethod?: string;
  pixQrCode?: string;
  pixQrCodeImage?: string;
  pixExpirationDate?: number;
  bankSlipUrl?: string;
  bankSlipLine?: string;
  totalValue?: number;
  installmentCount?: number;
  installmentValue?: number;
}

export interface PublicPlanLink {
  kind: "plan";
  uniqueLink: string;
  value: number;
  billingType?: BillingType;
  plan: { name: Localized<string>; description?: Localized<string>; features: Localized<string>[]; priceLabel?: Localized<string>; period?: string };
}

interface Instructions {
  billingType: BillingType;
  pixPayload?: string;
  pixImage?: string;
  pixExpiresAt?: number;
  bankSlipUrl?: string;
  bankSlipLine?: string;
  invoiceUrl?: string;
}

/** Erros do backend que têm texto próprio; o resto vira a mensagem genérica. */
const KNOWN_ERRORS = new Set(["NOT_CONFIGURED", "BOLETO_ISSUED", "TOO_MANY_ATTEMPTS", "IN_PROGRESS", "SWITCH_FAILED", "INVALID_INPUT"]);
export const checkoutErrorText = (t: T, code: string) => t(KNOWN_ERRORS.has(code) ? `checkout.error.${code}` : "checkout.error.generic");

export default function Checkout(props: AppIslandProps) {
  const t = makeT(props.texts);
  const api = useAppApi(props);
  const params = useParams(props.pattern);
  const link = params?.uniqueLink;
  const watched = useWatch<PublicCheckout | PublicPlanLink | null>(api, FN.checkout, link ? { uniqueLink: link } : null);
  const data = watched.state === "ready" ? watched.value : null;
  const paid = data?.kind === "checkout" && data.status === "paid";

  // O webhook confirmou: vai para a página de pagamento concluído.
  useEffect(() => {
    if (paid && link) window.location.assign(hrefFor(props, "pagamento-concluido", { uniqueLink: link }));
  }, [paid, link, props]);

  const base = baseState(props, params, watched);
  if (base) return <Gate props={props} t={t} state={base} />;
  if (!data || !link) return <Gate props={props} t={t} state="notFound" />;
  if (data.kind === "plan") return <PlanForm props={props} t={t} api={api!} link={data} />;
  return <CheckoutView props={props} t={t} api={api!} checkout={data} />;
}

function Header({ t, title }: { t: T; title?: string }) {
  return (
    <header className="rb-app__header">
      <p className="rb-app__eyebrow">{t("checkout.title")}</p>
      <h1 className="rb-app__title">{title || t("checkout.title")}</h1>
      <p className="rb-app__lead">{t("checkout.subtitle")}</p>
    </header>
  );
}

function storedInstructions(c: PublicCheckout): Instructions | null {
  if (c.paymentMethod === "pix" && c.pixQrCode) return { billingType: "PIX", pixPayload: c.pixQrCode, pixImage: c.pixQrCodeImage, pixExpiresAt: c.pixExpirationDate };
  if (c.paymentMethod === "boleto" && (c.bankSlipLine || c.bankSlipUrl)) return { billingType: "BOLETO", bankSlipLine: c.bankSlipLine, bankSlipUrl: c.bankSlipUrl };
  return null;
}

function CheckoutView({ props, t, api, checkout: c }: { props: AppIslandProps; t: T; api: AppApi; checkout: PublicCheckout }) {
  const { locale } = props;
  const fmt = (v: number) => money(v, locale);
  const [now, setNow] = useState(() => Date.now());
  const [method, setMethod] = useState<BillingType | null>(c.billingType ?? null);
  const [installment, setInstallment] = useState<InstallmentPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [instructions, setInstructions] = useState<Instructions | null>(() => storedInstructions(c));
  const uid = useId();

  // Relógio: vence o QR Code do PIX e o próprio link sem recarregar.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), instructions?.pixExpiresAt ? 1000 : 30_000);
    return () => clearInterval(timer);
  }, [instructions?.pixExpiresAt]);

  if (c.status === "paid") {
    return <Notice title={t("payment.success")} tone="success"><p>{fmt(c.totalValue ?? c.value)}</p></Notice>;
  }
  if (c.status === "refunded") return <Notice title={t("checkout.refundedTitle")}><p>{t("checkout.refundedBody")}</p></Notice>;
  if (c.status === "expired" || c.expiresAt < now) {
    return (
      <Notice title={t("checkout.expiredTitle")} tone="danger" action={<a className="rb-button rb-button--secondary" href={props.homeHref}>{t("app.home")}</a>}>
        <p>{t("checkout.expiredBody")}</p>
      </Notice>
    );
  }

  const options = installmentOptions(c.value);
  const allowed = (m: BillingType) => !c.billingType || c.billingType === m;
  const total = method === "CREDIT_CARD" ? (installment?.totalValue ?? c.value) : c.value;

  async function pay(billingType: BillingType | null = method) {
    if (!billingType) return;
    if (billingType === "CREDIT_CARD" && !installment) return setError(t("checkout.installments"));
    setBusy(true);
    setError(undefined);
    try {
      const result = (await api.action(FN.initiatePayment, {
        id: c._id,
        billingType,
        ...(billingType === "CREDIT_CARD" ? { installmentCount: installment!.count } : {}),
      })) as Instructions;
      if (result.billingType === "CREDIT_CARD") {
        // Os dados do cartão são digitados na página do Asaas, nunca neste site.
        if (result.invoiceUrl) window.location.assign(result.invoiceUrl);
        else setError(t("checkout.error.generic"));
        return;
      }
      setInstructions(result);
    } catch (err) {
      setError(checkoutErrorText(t, errorCode(err)));
    } finally {
      setBusy(false);
    }
  }

  const methodOption = (m: BillingType, title: string, hint: string) =>
    allowed(m) && (
      <label className={`rb-app__option${method === m ? " rb-app__option--selected" : ""}`}>
        <input
          type="radio"
          name={`${uid}-method`}
          value={m}
          checked={method === m}
          onChange={() => {
            setMethod(m);
            setInstructions(null);
            setError(undefined);
            if (m !== "CREDIT_CARD") setInstallment(null);
          }}
        />
        <span>
          <strong>{title}</strong>
          <span className="rb-app__hint">{hint}</span>
        </span>
      </label>
    );

  return (
    <article className="rb-app__doc">
      <Header t={t} title={c.description} />
      <div className="rb-app__columns">
        <section className="rb-app__section">
          <h2>{t("checkout.details")}</h2>
          <dl className="rb-app__facts">
            <div>
              <dt>{t("form.name")}</dt>
              <dd>{c.customerName}</dd>
            </div>
            {c.customerEmail && (
              <div>
                <dt>{t("form.email")}</dt>
                <dd>{c.customerEmail}</dd>
              </div>
            )}
            {c.description && (
              <div className="rb-app__facts-wide">
                <dt>{t("checkout.description")}</dt>
                <dd>{c.description}</dd>
              </div>
            )}
            <div>
              <dt>{t("checkout.value")}</dt>
              <dd className="rb-app__total">{fmt(c.value)}</dd>
            </div>
            <div>
              <dt>{t("checkout.dueDate")}</dt>
              <dd>{dayText(c.dueDate, locale)}</dd>
            </div>
          </dl>
        </section>

        <section className="rb-app__section">
          <fieldset className="rb-app__fieldset">
            <legend>
              <h2>{t("checkout.method")}</h2>
            </legend>
            {methodOption("PIX", t("checkout.pix"), t("checkout.pixHint"))}
            {methodOption("BOLETO", t("checkout.boleto"), t("checkout.boletoHint"))}
            {methodOption("CREDIT_CARD", t("checkout.card"), options.length > 1 ? t("checkout.cardHintInstallments", { count: options.length }) : t("checkout.cardHint"))}
          </fieldset>

          {method === "CREDIT_CARD" && (
            <fieldset className="rb-app__fieldset">
              <legend>
                <h3>{t("checkout.installments")}</h3>
              </legend>
              {options.map((o) => (
                <label key={o.count} className={`rb-app__option${installment?.count === o.count ? " rb-app__option--selected" : ""}`}>
                  <input type="radio" name={`${uid}-installments`} value={o.count} checked={installment?.count === o.count} onChange={() => setInstallment(o)} />
                  <span>
                    <strong>{t("checkout.installment", { count: o.count, value: fmt(o.value) })}</strong>
                    <span className="rb-app__hint">{o.isInterestFree ? t("checkout.interestFree") : t("checkout.withInterest", { total: fmt(o.totalValue) })}</span>
                  </span>
                </label>
              ))}
              <p className="rb-app__hint">{t("checkout.cardNotice")}</p>
            </fieldset>
          )}

          {method && !instructions && (
            <div className="rb-app__pay">
              <p>
                {t("checkout.total")}: <strong className="rb-app__total">{fmt(total)}</strong>
              </p>
              <button type="button" className="rb-button rb-button--primary" disabled={busy || (method === "CREDIT_CARD" && !installment)} onClick={() => pay()}>
                {busy ? t("checkout.generating") : t("checkout.generate")}
              </button>
            </div>
          )}
          {error && <p className="rb-form__error" role="alert">{error}</p>}

          {instructions?.billingType === "PIX" && <PixPanel t={t} locale={locale} now={now} busy={busy} pix={instructions} onRenew={() => pay("PIX")} />}
          {instructions?.billingType === "BOLETO" && <BoletoPanel t={t} boleto={instructions} />}
        </section>
      </div>
    </article>
  );
}

function CopyButton({ t, text }: { t: T; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <button type="button" className="rb-button rb-button--secondary" onClick={async () => setCopied(await copyText(text))}>
        {t("app.copy")}
      </button>
      {copied && <span role="status">{t("app.copied")}</span>}
    </>
  );
}

function PixPanel({ t, locale, now, busy, pix, onRenew }: { t: T; locale: string; now: number; busy: boolean; pix: Instructions; onRenew: () => void }) {
  const expired = pix.pixExpiresAt !== undefined && pix.pixExpiresAt <= now;
  return (
    <section className="rb-app__panel" aria-live="polite">
      <h3>{t("checkout.pixTitle")}</h3>
      {pix.pixImage && !expired && <img className="rb-app__qr" src={`data:image/png;base64,${pix.pixImage}`} alt={t("checkout.pixQr")} width={240} height={240} />}
      {pix.pixPayload && !expired && (
        <div className="rb-field">
          <span className="rb-field__label">{t("checkout.pixCode")}</span>
          <p className="rb-app__code">{pix.pixPayload}</p>
          <div className="rb-actions">
            <CopyButton t={t} text={pix.pixPayload} />
          </div>
        </div>
      )}
      {pix.pixExpiresAt !== undefined && <p className="rb-app__hint">{expired ? t("checkout.pixExpired") : t("checkout.pixValidUntil", { date: dateTimeText(pix.pixExpiresAt, locale) })}</p>}
      {expired && (
        <button type="button" className="rb-button rb-button--primary" disabled={busy} onClick={onRenew}>
          {busy ? t("checkout.generating") : t("checkout.pixNew")}
        </button>
      )}
      {!expired && <p className="rb-app__waiting">{t("checkout.waiting")}</p>}
    </section>
  );
}

function BoletoPanel({ t, boleto }: { t: T; boleto: Instructions }) {
  return (
    <section className="rb-app__panel" aria-live="polite">
      <h3>{t("checkout.boletoTitle")}</h3>
      {boleto.bankSlipLine && (
        <div className="rb-field">
          <span className="rb-field__label">{t("checkout.boletoLine")}</span>
          <p className="rb-app__code">{boleto.bankSlipLine}</p>
          <div className="rb-actions">
            <CopyButton t={t} text={boleto.bankSlipLine} />
          </div>
        </div>
      )}
      {boleto.bankSlipUrl && /^https:/.test(boleto.bankSlipUrl) && (
        <div className="rb-actions">
          <a className="rb-button rb-button--secondary" href={boleto.bankSlipUrl} target="_blank" rel="noopener noreferrer">
            {t("checkout.boletoOpen")} <span className="rb-sr-only">{t("common.external")}</span>
          </a>
        </div>
      )}
      <p className="rb-app__hint">{t("checkout.boletoNotice")}</p>
    </section>
  );
}

type PlanErrors = Partial<Record<"name" | "email" | "document", string>>;

function PlanForm({ props, t, api, link }: { props: AppIslandProps; t: T; api: AppApi; link: PublicPlanLink }) {
  const { locale, defaultLocale: fallback } = props;
  const uid = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<PlanErrors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const planName = pickText(link.plan.name, locale, fallback);
  const description = pickText(link.plan.description, locale, fallback);
  const features = link.plan.features.map((f) => pickText(f, locale, fallback)).filter(Boolean);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e: PlanErrors = {};
    if (!name.trim()) e.name = t("form.required");
    if (!EMAIL_RE.test(email.trim())) e.email = t("form.invalidEmail");
    if (!isDocument(document)) e.document = t("accept.documentInvalid");
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setFailure(undefined);
    const res = await api.post(HTTP.checkoutStart, {
      uniqueLink: link.uniqueLink,
      customerName: name.trim(),
      customerEmail: email.trim(),
      customerCpfCnpj: onlyDigits(document),
      ...(phone.trim() ? { customerMobilePhone: phone.trim() } : {}),
      ...(company.trim() ? { customerCompany: company.trim() } : {}),
    });
    if (res.status === 200 && typeof res.body.uniqueLink === "string") {
      window.location.assign(hrefFor(props, "checkout", { uniqueLink: res.body.uniqueLink }));
      return;
    }
    setBusy(false);
    const code = typeof res.body.error === "string" ? res.body.error : "";
    setFailure(res.status === 429 ? t("checkout.error.TOO_MANY_ATTEMPTS") : checkoutErrorText(t, code));
  }

  const input = (id: string, error?: string) => ({ id: `${uid}-${id}`, "aria-invalid": !!error, "aria-describedby": error ? `${uid}-${id}-error` : undefined });

  return (
    <article className="rb-app__doc">
      <Header t={t} title={planName} />
      <div className="rb-app__columns">
        <section className="rb-app__section">
          <h2>{t("checkout.details")}</h2>
          {description && <p>{description}</p>}
          {features.length > 0 && (
            <ul className="rb-app__list">
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
          <p className="rb-app__total">{money(link.value, locale)}</p>
        </section>
        <form className="rb-form" onSubmit={submit} noValidate>
          <h2>{t("checkout.customer")}</h2>
          <p className="rb-app__hint">{t("checkout.planIntro")}</p>
          <Field id={`${uid}-name`} label={t("form.name")} error={errors.name} required>
            <input {...input("name", errors.name)} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field id={`${uid}-email`} label={t("form.email")} error={errors.email} required>
            <input {...input("email", errors.email)} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field id={`${uid}-document`} label={t("accept.document")} error={errors.document} required>
            <input {...input("document", errors.document)} type="text" inputMode="numeric" value={document} onChange={(e) => setDocument(maskDocument(e.target.value))} required />
          </Field>
          <Field id={`${uid}-phone`} label={`${t("form.phone")} (${t("form.optional").toLowerCase()})`}>
            <input id={`${uid}-phone`} type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <Field id={`${uid}-company`} label={`${t("checkout.company")} (${t("form.optional").toLowerCase()})`}>
            <input id={`${uid}-company`} type="text" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          {failure && <p className="rb-form__error" role="alert">{failure}</p>}
          <button type="submit" className="rb-button rb-button--primary" disabled={busy}>
            {busy ? t("checkout.generating") : t("checkout.continue")}
          </button>
        </form>
      </div>
    </article>
  );
}
