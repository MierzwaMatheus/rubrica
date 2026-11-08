/**
 * Ilha do bloco `contato`: assistente em etapas (`wizard`) ou formulário simples (`form`).
 * Porta enxuta do ContactWizard da v1: no lugar dos quatro fluxos fixos, uma pergunta
 * sobre o assunto (vai em `details.topic`), a mensagem e os dados, com consentimento LGPD
 * obrigatório. Envia por `api.ts`.
 */
import { useEffect, useId, useState, type FormEvent } from "react";
import { apiBase, submitJson, type ContatoRequest } from "./api";
import { Consent, EMAIL_RE, Field, makeT, useFocusOnChange, type FormIslandProps } from "./kit";

const TOPICS = ["project", "job", "talk", "other"] as const;
type Errors = Partial<Record<"topic" | "message" | "name" | "email" | "consent", string>>;

export default function Contato({ blockId, page, locale, fields, texts, privacyHref }: FormIslandProps) {
  const t = makeT(texts);
  const uid = useId();
  // O HTML estático traz o formulário antes da hidratação: sem JS os botões ficam desligados.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const mode = fields.mode === "form" ? "form" : "wizard";
  const enabled = !!apiBase();
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "rate_limited" | "failed">("idle");
  const legend = useFocusOnChange(step);

  const total = mode === "wizard" ? 3 : 1;
  const last = step === total - 1;

  function validate(which: "topic" | "message" | "data" | "all"): Errors {
    const e: Errors = {};
    if ((which === "topic" || which === "all") && mode === "wizard" && !topic) e.topic = t("form.required");
    if ((which === "message" || which === "all") && !message.trim()) e.message = t("form.required");
    if (which === "data" || which === "all") {
      if (!name.trim()) e.name = t("form.required");
      if (!EMAIL_RE.test(email.trim())) e.email = t("form.invalidEmail");
      if (!consent) e.consent = t("form.consentRequired");
    }
    return e;
  }

  function next() {
    const which = step === 0 ? "topic" : "message";
    const e = validate(which);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(step + 1);
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!last && mode === "wizard") return next();
    const e = validate(mode === "wizard" ? "data" : "all");
    setErrors(e);
    if (Object.keys(e).length > 0 || !enabled) return;
    setStatus("sending");
    const body: ContatoRequest = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      consent: true,
      locale,
      blockId,
      page,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(topic ? { details: { topic } } : {}),
    };
    const result = await submitJson("/rubrica/contato", body);
    setStatus(result.ok ? "done" : result.error === "rate_limited" ? "rate_limited" : "failed");
  }

  if (status === "done") {
    return (
      <div className="rb-form" role="status">
        <p className="rb-form__success">{t("contactForm.success")}</p>
        <p>{t("contactForm.successBody")}</p>
      </div>
    );
  }

  const showTopic = mode === "wizard" && step === 0;
  const showMessage = mode === "form" || step === 1;
  const showData = mode === "form" || step === 2;
  const heading = showTopic ? t("contactForm.topic") : mode === "wizard" && step === 1 ? t("contactForm.message") : t("contactForm.you");

  return (
    <form className="rb-form" onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`}>
      {!enabled && <p className="rb-form__notice">{t("form.disabled")}</p>}
      <fieldset>
        <legend id={`${uid}-title`} tabIndex={-1} ref={legend}>
          {mode === "wizard" ? heading : t("contactForm.title")}
        </legend>
        {mode === "wizard" && (
          <p className="rb-form__progress" aria-live="polite">
            {t("form.step", { current: step + 1, total })}
          </p>
        )}
        {showTopic && (
          <div role="radiogroup" aria-labelledby={`${uid}-title`} aria-describedby={errors.topic ? `${uid}-topic-error` : undefined} className="rb-field">
            {TOPICS.map((value) => (
              <label key={value} className="rb-choice">
                <input type="radio" name={`${uid}-topic`} value={value} checked={topic === value} onChange={() => setTopic(value)} />
                {t(`contactForm.topic.${value}`)}
              </label>
            ))}
            {errors.topic && (
              <span className="rb-field__error" id={`${uid}-topic-error`} role="alert">
                {errors.topic}
              </span>
            )}
          </div>
        )}
        {showMessage && (
          <Field id={`${uid}-message`} label={t("form.message")} error={errors.message} required>
            <textarea id={`${uid}-message`} name="message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={4000} aria-invalid={!!errors.message} aria-describedby={errors.message ? `${uid}-message-error` : undefined} />
          </Field>
        )}
        {showData && (
          <>
            <Field id={`${uid}-name`} label={t("form.name")} error={errors.name} required>
              <input id={`${uid}-name`} type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${uid}-name-error` : undefined} />
            </Field>
            <Field id={`${uid}-email`} label={t("form.email")} error={errors.email} required>
              <input id={`${uid}-email`} type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} aria-invalid={!!errors.email} aria-describedby={errors.email ? `${uid}-email-error` : undefined} />
            </Field>
            <Field id={`${uid}-phone`} label={t("form.phone")} hint={t("form.optional")}>
              <input id={`${uid}-phone`} type="tel" name="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
            </Field>
            <Consent id={`${uid}-consent`} checked={consent} onChange={setConsent} error={errors.consent} t={t} privacyHref={privacyHref} />
          </>
        )}
      </fieldset>
      <div aria-live="polite">
        {status === "rate_limited" && <p className="rb-form__error">{t("form.rateLimited")}</p>}
        {status === "failed" && <p className="rb-form__error">{t("form.error")}</p>}
      </div>
      <div className="rb-form__nav">
        {mode === "wizard" && step > 0 ? (
          <button type="button" className="rb-button rb-button--secondary" onClick={() => setStep(step - 1)}>
            {t("form.back")}
          </button>
        ) : (
          <span />
        )}
        {mode === "wizard" && !last ? (
          <button type="submit" className="rb-button rb-button--primary" disabled={!ready}>
            {t("form.next")}
          </button>
        ) : (
          <button type="submit" className="rb-button rb-button--primary" disabled={!ready || !enabled || status === "sending"}>
            {status === "sending" ? t("form.sending") : t("form.send")}
          </button>
        )}
      </div>
    </form>
  );
}
