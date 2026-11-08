/**
 * Ilha do bloco `depoimentos` (com `allowSubmission`): botão que abre um formulário para o
 * visitante enviar um depoimento. Porta enxuta do TestimonialWizardDialog da v1: só texto
 * (o vídeo e o recorte de foto da v1 ficaram de fora), com consentimento LGPD obrigatório.
 * O depoimento chega como pendente e só aparece no site depois da aprovação no painel.
 */
import { useEffect, useId, useState, type FormEvent } from "react";
import { apiBase, submitJson, type DepoimentoRequest } from "./api";
import { Consent, EMAIL_RE, Field, makeT, useFocusOnChange, type FormIslandProps, Honeypot, honeypotValue } from "./kit";

type Errors = Partial<Record<"name" | "email" | "quote" | "consent", string>>;

export default function DepoimentoEnvio({ blockId, page, locale, texts, privacyHref }: FormIslandProps) {
  const t = makeT(texts);
  const uid = useId();
  // O HTML estático traz o formulário antes da hidratação: sem JS os botões ficam desligados.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const enabled = !!apiBase();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "rate_limited" | "failed">("idle");
  const title = useFocusOnChange(open);

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    const e: Errors = {};
    if (!name.trim()) e.name = t("form.required");
    if (!EMAIL_RE.test(email.trim())) e.email = t("form.invalidEmail");
    if (!quote.trim()) e.quote = t("form.required");
    if (!consent) e.consent = t("form.consentRequired");
    setErrors(e);
    if (Object.keys(e).length > 0 || !enabled) return;
    setStatus("sending");
    const body: DepoimentoRequest = {
      name: name.trim(),
      email: email.trim(),
      quote: quote.trim(),
      consent: true,
      ...(honeypotValue(ev.currentTarget as HTMLFormElement) ? { website: honeypotValue(ev.currentTarget as HTMLFormElement) } : {}),
      locale,
      blockId,
      page,
      ...(role.trim() ? { role: role.trim() } : {}),
      ...(company.trim() ? { company: company.trim() } : {}),
    };
    const result = await submitJson("/rubrica/depoimento", body);
    setStatus(result.ok ? "done" : result.error === "rate_limited" ? "rate_limited" : "failed");
  }

  if (status === "done") {
    return (
      <div className="rb-form" role="status">
        <p className="rb-form__success">{t("testimonialForm.success")}</p>
        <p>{t("testimonialForm.successBody")}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <button type="button" className="rb-button rb-button--secondary" aria-expanded="false" aria-controls={`${uid}-form`} onClick={() => setOpen(true)}>
        {t("testimonialForm.open")}
      </button>
    );
  }

  return (
    <form id={`${uid}-form`} className="rb-form" onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`}>
      <Honeypot />
      {!enabled && <p className="rb-form__notice">{t("form.disabled")}</p>}
      <fieldset>
        <legend id={`${uid}-title`} tabIndex={-1} ref={title}>
          {t("testimonialForm.title")}
        </legend>
        <Field id={`${uid}-quote`} label={t("testimonialForm.quote")} error={errors.quote} required>
          <textarea id={`${uid}-quote`} value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={2000} aria-invalid={!!errors.quote} aria-describedby={errors.quote ? `${uid}-quote-error` : undefined} />
        </Field>
        <Field id={`${uid}-name`} label={t("form.name")} error={errors.name} required>
          <input id={`${uid}-name`} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-error` : undefined} />
        </Field>
        <Field id={`${uid}-role`} label={t("testimonialForm.role")} hint={t("form.optional")}>
          <input id={`${uid}-role`} type="text" autoComplete="organization-title" value={role} onChange={(e) => setRole(e.target.value)} maxLength={120} />
        </Field>
        <Field id={`${uid}-company`} label={t("testimonialForm.company")} hint={t("form.optional")}>
          <input id={`${uid}-company`} type="text" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
        </Field>
        <Field id={`${uid}-email`} label={t("form.email")} hint={t("testimonialForm.emailHint")} error={errors.email} required>
          <input id={`${uid}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-error` : `${uid}-email-hint`} />
        </Field>
        <Consent id={`${uid}-consent`} checked={consent} onChange={setConsent} error={errors.consent} t={t} privacyHref={privacyHref} />
      </fieldset>
      <div aria-live="polite">
        {status === "rate_limited" && <p className="rb-form__error">{t("form.rateLimited")}</p>}
        {status === "failed" && <p className="rb-form__error">{t("form.error")}</p>}
      </div>
      <div className="rb-form__nav">
        <button type="button" className="rb-button rb-button--secondary" onClick={() => setOpen(false)}>
          {t("form.cancel")}
        </button>
        <button type="submit" className="rb-button rb-button--primary" disabled={!ready || !enabled || status === "sending"}>
          {status === "sending" ? t("form.sending") : t("form.send")}
        </button>
      </div>
    </form>
  );
}
