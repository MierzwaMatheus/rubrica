/**
 * Ilha do bloco `contato`: assistente em etapas (`wizard`) ou formulário simples (`form`).
 *
 * - Sem assuntos configurados (`flows`), o assistente enxuto: o assunto (vai em
 *   `details.topic`), a mensagem e os dados.
 * - Com assuntos, o assistente da v1: escolher o assunto já avança, cada assunto tem as
 *   próprias etapas (escolhas, textos, dados de contato) e o resumo para revisar no fim.
 * - Com `presentation: "dialog"`, tudo isso fica numa janela (`<dialog>`) que abre nos
 *   links para a âncora do bloco (#contato), sem rolar a página.
 *
 * Consentimento LGPD obrigatório. Envia por `api.ts`.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { apiBase, submitJson, type ContatoRequest } from "./api";
import { buildContactPayload, readFlows, stepErrors, summaryRows, totalSteps, type ContactData, type Flow, type FlowStep } from "./contact-flows";
import { Consent, EMAIL_RE, Field, makeT, useFocusOnChange, type FormIslandProps, Honeypot, honeypotValue } from "./kit";

const TOPICS = ["project", "job", "talk", "other"] as const;
type Errors = Partial<Record<"topic" | "message" | "name" | "email" | "consent", string>>;
type Status = "idle" | "sending" | "done" | "rate_limited" | "failed";
type T = ReturnType<typeof makeT>;

interface WizardProps extends FormIslandProps {
  t: T;
  /** Na janela: fecha (o "Fechar" da primeira etapa e do fim). */
  onClose?: () => void;
  /** Avisa a janela que o pedido foi enviado (para recomeçar ao fechar). */
  onSent?: () => void;
  /** Na janela, o título da primeira etapa é o texto de apoio do bloco. */
  firstHeading?: string;
}

/** Envio comum aos dois assistentes. */
async function send(body: ContatoRequest): Promise<Status> {
  const result = await submitJson("/rubrica/contato", body);
  return result.ok ? "done" : result.error === "rate_limited" ? "rate_limited" : "failed";
}

function useReady() {
  // O HTML estático traz o formulário antes da hidratação: sem JS os botões ficam desligados.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

function Success({ t, onClose }: { t: T; onClose?: () => void }) {
  return (
    <div className="rb-form rb-form--done" role="status">
      <p className="rb-form__success">{t("contactForm.success")}</p>
      <p>{t("contactForm.successBody")}</p>
      {onClose && (
        <div className="rb-form__nav rb-form__nav--center">
          <button type="button" className="rb-button rb-button--secondary" onClick={onClose}>
            {t("contactForm.close")}
          </button>
        </div>
      )}
    </div>
  );
}

function SendStatus({ status, t }: { status: Status; t: T }) {
  return (
    <div aria-live="polite">
      {status === "rate_limited" && <p className="rb-form__error">{t("form.rateLimited")}</p>}
      {status === "failed" && <p className="rb-form__error">{t("form.error")}</p>}
    </div>
  );
}

// ── Assistente enxuto (sem assuntos configurados) ───────────────────────────

function SimpleWizard({ blockId, page, locale, fields, privacyHref, t, onClose, onSent }: WizardProps) {
  const uid = useId();
  const ready = useReady();
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
  const [status, setStatus] = useState<Status>("idle");
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
    const trap = honeypotValue(ev.currentTarget as HTMLFormElement);
    const result = await send({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      consent: true,
      ...(trap ? { website: trap } : {}),
      locale,
      blockId,
      page,
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(topic ? { details: { topic } } : {}),
    });
    setStatus(result);
    if (result === "done") onSent?.();
  }

  if (status === "done") return <Success t={t} onClose={onClose} />;

  const showTopic = mode === "wizard" && step === 0;
  const showMessage = mode === "form" || step === 1;
  const showData = mode === "form" || step === 2;
  const heading = showTopic ? t("contactForm.topic") : mode === "wizard" && step === 1 ? t("contactForm.message") : t("contactForm.you");

  return (
    <form className="rb-form" onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`}>
      <Honeypot />
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
      <SendStatus status={status} t={t} />
      <div className="rb-form__nav">
        {mode === "wizard" && step > 0 ? (
          <button type="button" className="rb-button rb-button--secondary" onClick={() => setStep(step - 1)}>
            {t("form.back")}
          </button>
        ) : onClose ? (
          <button type="button" className="rb-button rb-button--secondary" onClick={onClose}>
            {t("contactForm.close")}
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

// ── Assistente por assuntos (campo `flows`) ─────────────────────────────────

const EMPTY_CONTACT: ContactData = { name: "", email: "", phone: "", linkedin: "", company: "" };

function errorText(reason: string | undefined, t: T): string | undefined {
  if (!reason) return undefined;
  return reason === "email" ? t("form.invalidEmail") : reason === "consent" ? t("form.consentRequired") : t("form.required");
}

function FlowWizard({ flows, blockId, page, locale, privacyHref, t, onClose, onSent, firstHeading }: WizardProps & { flows: Flow[] }) {
  const uid = useId();
  const ready = useReady();
  const enabled = !!apiBase();
  const [flowIndex, setFlowIndex] = useState(-1);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const legend = useFocusOnChange(`${flowIndex}-${step}`);

  const flow = flowIndex >= 0 ? flows[flowIndex] : undefined;
  const total = flow ? totalSteps(flow) : 1;
  const current: FlowStep | undefined = flow && step >= 1 && step <= flow.steps.length ? flow.steps[step - 1] : undefined;
  const isSummary = !!flow && step === total;

  function chooseFlow(i: number) {
    if (i !== flowIndex) {
      setAnswers({});
      setFlowIndex(i);
    }
    setErrors({});
    setStep(1);
  }

  function back() {
    setErrors({});
    setStep(Math.max(0, step - 1));
  }

  function next() {
    if (!flow) {
      setErrors({ flow: t("form.required") });
      return;
    }
    if (current) {
      const found = stepErrors(current, answers, contact, consent);
      const mapped = Object.fromEntries(Object.entries(found).map(([k, r]) => [k, errorText(r, t)!]));
      setErrors(mapped);
      if (Object.keys(mapped).length) return;
    }
    setStep(step + 1);
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!isSummary || !flow) return next();
    if (!enabled) return;
    setStatus("sending");
    const trap = honeypotValue(ev.currentTarget as HTMLFormElement);
    const { message, details, phone } = buildContactPayload(flow, answers, contact);
    const result = await send({
      name: contact.name.trim(),
      email: contact.email.trim(),
      message,
      details,
      consent: true,
      ...(trap ? { website: trap } : {}),
      locale,
      blockId,
      page,
      ...(phone ? { phone } : {}),
    });
    setStatus(result);
    if (result === "done") onSent?.();
  }

  if (status === "done") return <Success t={t} onClose={onClose} />;

  const setAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));
  const setField = (key: keyof ContactData, value: string) => setContact((c) => ({ ...c, [key]: value }));
  const heading = !flow || step === 0 ? firstHeading || t("contactForm.topic") : isSummary ? t("contactForm.summary") : current?.kind === "contact" ? current.title || t("contactForm.you") : current?.title || flow.label;
  const pct = flow ? Math.round((step / total) * 100) : 0;

  function renderStep(): ReactNode {
    if (step === 0 || !flow) {
      return (
        <div className="rb-options" role="group" aria-labelledby={`${uid}-title`} aria-describedby={errors.flow ? `${uid}-flow-error` : undefined}>
          {flows.map((f, i) => (
            <button key={`${f.id}-${i}`} type="button" className="rb-option" aria-pressed={i === flowIndex} onClick={() => chooseFlow(i)} disabled={!ready}>
              {f.emoji && (
                <span className="rb-option__emoji" aria-hidden="true">
                  {f.emoji}
                </span>
              )}
              <span>{f.label}</span>
            </button>
          ))}
          {errors.flow && (
            <span className="rb-field__error" id={`${uid}-flow-error`} role="alert">
              {errors.flow}
            </span>
          )}
        </div>
      );
    }
    if (isSummary) {
      return (
        <dl className="rb-summary">
          <div>
            <dt>{t("contactForm.summaryTopic")}</dt>
            <dd className="rb-summary__topic">{flow.label}</dd>
          </div>
          {summaryRows(flow, answers).map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
          <div className="rb-summary__contact">
            <dt>{t("contactForm.summaryContact")}</dt>
            {[contact.name, contact.email, contact.phone, contact.linkedin, contact.company]
              .map((v) => v.trim())
              .filter(Boolean)
              .map((v) => (
                <dd key={v}>{v}</dd>
              ))}
          </div>
        </dl>
      );
    }
    const s = current!;
    if (s.kind === "choice") {
      const key = s.keys[0] ?? "q";
      return (
        <div className="rb-options rb-options--chips" role="group" aria-labelledby={`${uid}-title`} aria-describedby={errors[key] ? `${uid}-${key}-error` : undefined}>
          {s.options.map((opt) => (
            <button key={opt} type="button" className="rb-option" aria-pressed={answers[key] === opt} onClick={() => setAnswer(key, opt)}>
              <span>{opt}</span>
            </button>
          ))}
          {errors[key] && (
            <span className="rb-field__error" id={`${uid}-${key}-error`} role="alert">
              {errors[key]}
            </span>
          )}
        </div>
      );
    }
    if (s.kind === "text" || s.kind === "textarea") {
      return s.keys.map((key, j) => {
        const id = `${uid}-${key}`;
        const placeholder = s.placeholders[j];
        const label = s.keys.length > 1 ? placeholder || key : s.title || placeholder || key;
        const common = {
          id,
          name: key,
          value: answers[key] ?? "",
          placeholder,
          "aria-invalid": !!errors[key],
          "aria-describedby": errors[key] ? `${id}-error` : undefined,
        };
        return (
          <div className="rb-field" key={key}>
            <label htmlFor={id} className="rb-sr-only">
              {label}
            </label>
            {s.kind === "textarea" ? (
              <textarea {...common} rows={5} maxLength={4000} onChange={(e) => setAnswer(key, e.target.value)} />
            ) : (
              <input {...common} type="text" maxLength={200} onChange={(e) => setAnswer(key, e.target.value)} />
            )}
            {errors[key] && (
              <span className="rb-field__error" id={`${id}-error`} role="alert">
                {errors[key]}
              </span>
            )}
          </div>
        );
      });
    }
    // Dados de contato.
    const input = (key: keyof ContactData, type: string, autoComplete: string, max: number, required: boolean) => (
      <input
        id={`${uid}-${key}`}
        type={type}
        name={key}
        autoComplete={autoComplete}
        value={contact[key]}
        onChange={(e) => setField(key, e.target.value)}
        maxLength={max}
        {...(required ? { "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${uid}-${key}-error` : undefined } : {})}
      />
    );
    return (
      <>
        <Field id={`${uid}-name`} label={t("form.name")} error={errors.name} required>
          {input("name", "text", "name", 120, true)}
        </Field>
        <Field id={`${uid}-email`} label={t("form.email")} error={errors.email} required>
          {input("email", "email", "email", 200, true)}
        </Field>
        {s.askPhone && (
          <Field id={`${uid}-phone`} label={t("form.phone")} hint={t("form.optional")}>
            {input("phone", "tel", "tel", 40, false)}
          </Field>
        )}
        {s.askLinkedin && (
          <Field id={`${uid}-linkedin`} label={t("contactForm.linkedin")} hint={t("form.optional")}>
            {input("linkedin", "url", "url", 200, false)}
          </Field>
        )}
        {s.askCompany && (
          <Field id={`${uid}-company`} label={t("contactForm.company")} hint={t("form.optional")}>
            {input("company", "text", "organization", 200, false)}
          </Field>
        )}
        <Consent id={`${uid}-consent`} checked={consent} onChange={setConsent} error={errors.consent} t={t} privacyHref={privacyHref} />
      </>
    );
  }

  return (
    <form className="rb-form rb-form--flows" onSubmit={onSubmit} noValidate aria-labelledby={`${uid}-title`}>
      <Honeypot />
      {!enabled && <p className="rb-form__notice">{t("form.disabled")}</p>}
      {flow && (
        <div className="rb-form__progress rb-progress" aria-live="polite">
          <p>
            <span>{t("form.step", { current: step, total })}</span>
            <span aria-hidden="true">{pct}%</span>
          </p>
          <span className="rb-progress__track" aria-hidden="true">
            <span className="rb-progress__bar" style={{ width: `${pct}%` }} />
          </span>
        </div>
      )}
      <fieldset>
        <legend id={`${uid}-title`} tabIndex={-1} ref={legend}>
          {heading}
        </legend>
        {renderStep()}
      </fieldset>
      <SendStatus status={status} t={t} />
      <div className="rb-form__nav">
        {step > 0 ? (
          <button type="button" className="rb-button rb-button--secondary" onClick={back}>
            {t("form.back")}
          </button>
        ) : onClose ? (
          <button type="button" className="rb-button rb-button--secondary" onClick={onClose}>
            {t("contactForm.close")}
          </button>
        ) : (
          <span />
        )}
        {isSummary ? (
          <button type="submit" className="rb-button rb-button--primary" disabled={!ready || !enabled || status === "sending"}>
            {status === "sending" ? t("form.sending") : t("form.send")}
          </button>
        ) : (
          <button type="submit" className="rb-button rb-button--primary" disabled={!ready}>
            {t("form.next")}
          </button>
        )}
      </div>
    </form>
  );
}

// ── Janela ──────────────────────────────────────────────────────────────────

const trimSlash = (p: string) => p.replace(/\/+$/, "") || "/";

/**
 * Janela do contato: abre nos cliques em links para `#<âncora>` desta página (sem rolar
 * nem criar entrada no histórico), no `hashchange` e quando a página já abre com a âncora
 * (o "Fale comigo" de outras páginas leva para `/#contato`). Esc, o X, o "Fechar" e o
 * clique fora fecham; ao fechar, a âncora sai do endereço.
 */
function ContactDialog({ anchor, eyebrow, title, t, children }: { anchor: string; eyebrow?: string; title?: string; t: T; children: (close: () => void, onSent: () => void) => ReactNode }) {
  const uid = useId();
  const ref = useRef<HTMLDialogElement | null>(null);
  const sent = useRef(false);
  const [session, setSession] = useState(0);

  const close = () => ref.current?.close();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const hash = `#${anchor}`;
    const open = () => {
      if (dialog.open) return;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    };
    const isOwnLink = (a: HTMLAnchorElement) => {
      const url = new URL(a.getAttribute("href") ?? "", location.href);
      return url.hash === hash && url.origin === location.origin && trimSlash(url.pathname) === trimSlash(location.pathname);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (a instanceof HTMLAnchorElement && isOwnLink(a)) {
        e.preventDefault();
        open();
      }
    };
    const onHash = () => {
      if (location.hash === hash) open();
    };
    const onClose = () => {
      if (location.hash === hash) history.replaceState(history.state, "", location.pathname + location.search);
      if (sent.current) {
        sent.current = false;
        setSession((n) => n + 1);
      }
    };
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    dialog.addEventListener("close", onClose);
    if (location.hash === hash) open();
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      dialog.removeEventListener("close", onClose);
    };
  }, [anchor]);

  const parts = eyebrow ? eyebrow.split("/").map((p) => p.trim()).filter(Boolean) : [];
  return (
    <dialog
      ref={ref}
      className="rb-dialog rb-contato__dialog"
      aria-labelledby={title ? `${uid}-title` : undefined}
      aria-label={title ? undefined : t("contactForm.title")}
      onClick={(e) => {
        // Clique no fundo (fora da caixa) fecha.
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="rb-dialog__box">
        <button type="button" className="rb-dialog__close" aria-label={t("contactForm.close")} onClick={close}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {(parts.length > 0 || title) && (
          <header className="rb-dialog__header">
            {parts.length > 0 && (
              <p className="rb-dialog__eyebrow">
                {parts.map((p, i) => (
                  <span key={`${p}-${i}`}>
                    {i > 0 && (
                      <span className="rb-dialog__sep" aria-hidden="true">
                        {" / "}
                      </span>
                    )}
                    <span className="rb-dialog__crumb">{p}</span>
                  </span>
                ))}
              </p>
            )}
            {title && (
              <h2 className="rb-dialog__title" id={`${uid}-title`}>
                {title}
              </h2>
            )}
          </header>
        )}
        <div key={session}>{children(close, () => (sent.current = true))}</div>
      </div>
    </dialog>
  );
}

export default function Contato(props: FormIslandProps) {
  const t = makeT(props.texts);
  const { fields } = props;
  const flows = fields.mode === "form" ? [] : readFlows(fields.flows);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const wizard = (onClose?: () => void, onSent?: () => void, firstHeading?: string) =>
    flows.length > 0 ? <FlowWizard {...props} t={t} flows={flows} onClose={onClose} onSent={onSent} firstHeading={firstHeading} /> : <SimpleWizard {...props} t={t} onClose={onClose} onSent={onSent} />;

  if (fields.presentation !== "dialog") return wizard();
  return (
    <ContactDialog anchor={str(fields.anchor) ?? `b-${props.blockId}`} eyebrow={str(fields.eyebrow)} title={str(fields.title)} t={t}>
      {(close, onSent) => wizard(close, onSent, str(fields.intro))}
    </ContactDialog>
  );
}
