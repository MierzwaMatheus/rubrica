/**
 * `/proposta/<slug>/aceitar` (port de `ProposalAccept.tsx` + `ContractModal.tsx` da v1):
 * dados de quem aceita → contrato preenchido com eles (aberto, com o aviso e as confirmações
 * da v1) → assinatura desenhada (obrigatória, como na v1) → aceite. O servidor registra IP, navegador, o conteúdo aceito e o hash dele; a página
 * mostra o código e baixa o contrato em PDF.
 */
import { useEffect, useId, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { EMAIL_RE, Field, makeT } from "../kit";
import { FN, HTTP, useWatch, type AppApi } from "./client";
import { proposalTexts, type Acceptance, type OpenProposal, type PublicProposal } from "./contract";
import { dateText, isDocument, maskDocument, money, onlyDigits } from "./format";
import { markdownToHtml } from "./markdown";
import { ContractText, contractHtml, downloadContract, proposalArgs, useProposalToken } from "./proposal-shared";
import { Gate, Notice, baseState, hrefFor, useAppApi, useParams, type AppIslandProps, type T } from "./ui";

type Errors = Partial<Record<"name" | "document" | "email" | "consent" | "signature", string>>;

export default function PropostaAceite(props: AppIslandProps) {
  const t = makeT(props.texts);
  const api = useAppApi(props);
  const params = useParams(props.pattern);
  const slug = params?.slug;
  const session = useProposalToken(slug);
  const watched = useWatch<PublicProposal | null>(api, FN.proposal, proposalArgs(slug, session));
  // Depois do aceite a proposta muda para "aceita" (a leitura é ao vivo): a tela de sucesso fica.
  const [done, setDone] = useState<{ acceptance: Acceptance; proposal: OpenProposal; signature?: string } | null>(null);

  const base = baseState(props, params, watched);
  if (done) return <Done props={props} t={t} slug={slug!} {...done} />;
  if (base) return <Gate props={props} t={t} state={base} />;
  const proposal = watched.state === "ready" ? watched.value : null;
  if (!proposal || !slug) return <Gate props={props} t={t} state="notFound" />;
  const back = <a className="rb-button rb-button--secondary" href={hrefFor(props, "proposta", { slug })}>{t("accept.back")}</a>;
  if (proposal.locked) return <Notice title={t("accept.title")} action={back}><p>{t("accept.locked")}</p></Notice>;
  if (proposal.isAccepted) return <Notice title={t("accept.alreadyAccepted")} tone="success" action={back} />;
  if (proposal.isExpired) {
    return (
      <Notice title={t("proposal.expired", { date: dateText(proposal.expiresAt, props.locale) })} tone="danger" action={back}>
        <p>{t("proposal.expiredHint")}</p>
      </Notice>
    );
  }
  return <AcceptForm props={props} t={t} api={api!} proposal={proposal} slug={slug} token={session.token} onDone={setDone} onSessionLost={() => session.setToken(null)} />;
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function AcceptForm({ props, t, api, proposal: p, slug, token, onDone, onSessionLost }: {
  props: AppIslandProps;
  t: T;
  api: AppApi;
  proposal: OpenProposal;
  slug: string;
  token?: string;
  onDone: (d: { acceptance: Acceptance; proposal: OpenProposal; signature?: string }) => void;
  onSessionLost: () => void;
}) {
  const { locale, defaultLocale: fallback } = props;
  const uid = useId();
  const texts = proposalTexts(p, locale, fallback, t);
  const discount = summarizeDiscount(p);
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [declaration, setDeclaration] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string>();
  const signature = useRef<HTMLCanvasElement | null>(null);
  const [signed, setSigned] = useState(false);

  const client = { clientName: name.trim(), clientDocument: document, clientEmail: email.trim(), clientRole: role.trim() || undefined, clientDeclaration: declaration.trim() || undefined };
  const contract = contractHtml(t, p, client.clientName ? client : null, locale, fallback);

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = t("form.required");
    if (!isDocument(document)) e.document = t("accept.documentInvalid");
    if (!EMAIL_RE.test(email.trim())) e.email = t("form.invalidEmail");
    if (!signed || !signature.current) e.signature = t("accept.signatureRequired");
    if (!consent) e.consent = t("accept.consentRequired");
    return e;
  }

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setFailure(undefined);
    // A assinatura é obrigatória (como na v1): sem o envio dela, o aceite não segue.
    let signatureStorageId: string | undefined;
    let signatureData: string | undefined;
    const canvas = signature.current!;
    try {
      const blob = await canvasBlob(canvas);
      if (!blob) throw new Error("sem imagem");
      const uploadUrl = (await api.mutation(FN.signatureUploadUrl, token ? { slug, token } : { slug })) as string;
      signatureStorageId = await api.upload(uploadUrl, blob);
      signatureData = canvas.toDataURL("image/png");
    } catch {
      setBusy(false);
      setFailure(t("accept.signatureError"));
      return;
    }
    const res = await api.post(HTTP.accept, {
      slug,
      ...(token ? { token } : {}),
      clientName: client.clientName,
      clientDocument: onlyDigits(document),
      clientEmail: client.clientEmail,
      ...(client.clientRole ? { clientRole: client.clientRole } : {}),
      ...(client.clientDeclaration ? { clientDeclaration: client.clientDeclaration } : {}),
      locale,
      ...(signatureStorageId ? { signatureStorageId } : {}),
    });
    setBusy(false);
    if (res.status === 200 && typeof res.body.contentHash === "string") {
      return onDone({
        proposal: p,
        signature: signatureData,
        acceptance: {
          ...client,
          clientDocument: onlyDigits(document),
          acceptedAt: Date.now(),
          proposalVersion: p.version,
          contentHash: res.body.contentHash,
          ipAddress: typeof res.body.ipAddress === "string" ? res.body.ipAddress : undefined,
          userAgent: typeof res.body.userAgent === "string" ? res.body.userAgent : navigator.userAgent,
        },
      });
    }
    const code = typeof res.body.error === "string" ? res.body.error : "";
    if (code === "SESSION_REQUIRED") {
      onSessionLost();
      return;
    }
    setFailure(
      res.status === 429 || code === "TOO_MANY_ATTEMPTS"
        ? t("proposal.tooManyAttempts")
        : code === "ALREADY_ACCEPTED"
          ? t("accept.alreadyAccepted")
          : code === "EXPIRED"
            ? t("proposal.expired", { date: dateText(p.expiresAt, locale) })
            : code === "INVALID_INPUT"
              ? t("accept.invalid")
              : t("accept.error"),
    );
  }

  const input = (id: string, error?: string) => ({ id: `${uid}-${id}`, "aria-invalid": !!error, "aria-describedby": error ? `${uid}-${id}-error` : undefined });

  return (
    <article className="rb-flow__doc rb-proposal">
      <header className="rb-flow__header">
        <p className="rb-flow__eyebrow">{texts.title || p.clientName}</p>
        <h1 className="rb-flow__title">{t("accept.title")}</h1>
        <p className="rb-flow__lead">{t("accept.intro")}</p>
      </header>

      <section className="rb-flow__section">
        <h2>{t("accept.summary")}</h2>
        <dl className="rb-flow__facts">
          <div>
            <dt>{t("accept.client")}</dt>
            <dd>{p.clientName}</dd>
          </div>
          <div>
            <dt>{t("accept.total")}</dt>
            <dd>
              {discount.hasDiscount && (
                <>
                  <span className="rb-sr-only">{t("proposal.originalPrice")}: </span>
                  <s>{money(discount.originalValue, locale)}</s>{" "}
                  <span className="rb-sr-only">{t("proposal.finalPrice")}: </span>
                </>
              )}
              <strong>{money(p.investmentValue, locale)}</strong>
            </dd>
          </div>
          {texts.objective && (
            <div className="rb-flow__facts-wide">
              <dt>{t("proposal.objective")}</dt>
              <dd className="rb-flow__pre">{texts.objective}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rb-proposal__card rb-proposal__clause">
        <h2 className="rb-proposal__heading">{t("accept.clauseTitle")}</h2>
        <p>{t("accept.clause")}</p>
      </section>

      <form className="rb-form rb-flow__form" onSubmit={submit} noValidate>
        <h2>{t("accept.data")}</h2>
        <div className="rb-flow__grid">
          <Field id={`${uid}-name`} label={t("accept.name")} error={errors.name} required>
            <input {...input("name", errors.name)} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field id={`${uid}-document`} label={t("accept.document")} error={errors.document} required>
            <input {...input("document", errors.document)} type="text" inputMode="numeric" autoComplete="off" value={document} onChange={(e) => setDocument(maskDocument(e.target.value))} required />
          </Field>
          <Field id={`${uid}-email`} label={t("form.email")} error={errors.email} required>
            <input {...input("email", errors.email)} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field id={`${uid}-role`} label={`${t("accept.role")} (${t("form.optional").toLowerCase()})`} hint={t("accept.roleHint")}>
            <input id={`${uid}-role`} type="text" autoComplete="organization-title" value={role} onChange={(e) => setRole(e.target.value)} aria-describedby={`${uid}-role-hint`} />
          </Field>
        </div>
        <Field id={`${uid}-declaration`} label={`${t("accept.declaration")} (${t("form.optional").toLowerCase()})`} hint={t("accept.declarationHint")}>
          <textarea id={`${uid}-declaration`} rows={3} value={declaration} onChange={(e) => setDeclaration(e.target.value)} aria-describedby={`${uid}-declaration-hint`} />
        </Field>

        <details className="rb-flow__details">
          <summary>
            <h3>{t("proposal.rescission")}</h3>
          </summary>
          <ContractText html={markdownToHtml(texts.rescissionPolicy, 4)} />
        </details>
        {contract && (
          <section className="rb-proposal__contract" aria-labelledby={`${uid}-contract`}>
            <h3 id={`${uid}-contract`}>{t("contract.title")}</h3>
            <p className="rb-proposal__warning" role="note">{t("accept.readWarning")}</p>
            <div className="rb-proposal__contract-scroll" tabIndex={0} aria-labelledby={`${uid}-contract`}>
              <ContractText html={contract} />
            </div>
          </section>
        )}

        <div className="rb-proposal__confirm">
          <p>{t("accept.confirmTitle")}</p>
          <ul>
            <li>{t("accept.confirmRead")}</li>
            <li>{t("accept.confirmAgree")}</li>
            <li>{t("accept.confirmAuthority")}</li>
            <li>{t("accept.confirmValidity")}</li>
          </ul>
        </div>

        <SignaturePad
          t={t}
          typedName={name.trim()}
          error={errors.signature}
          onChange={(c) => {
            signature.current = c;
            setSigned(!!c);
            if (c) setErrors((e) => ({ ...e, signature: undefined }));
          }}
        />

        <div className="rb-field">
          <div className="rb-consent">
            <input id={`${uid}-consent`} type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required {...{ "aria-invalid": !!errors.consent, "aria-describedby": errors.consent ? `${uid}-consent-error` : undefined }} />
            <label htmlFor={`${uid}-consent`}>
              {t("accept.consent")}
              <span aria-hidden="true"> *</span>
            </label>
          </div>
          {errors.consent && (
            <span className="rb-field__error" id={`${uid}-consent-error`} role="alert">
              {errors.consent}
            </span>
          )}
        </div>

        {failure && <p className="rb-form__error" role="alert">{failure}</p>}
        <div className="rb-form__nav">
          <a className="rb-button rb-button--secondary" href={hrefFor(props, "proposta", { slug })}>
            {t("accept.back")}
          </a>
          <button type="submit" className="rb-button rb-button--primary" disabled={busy}>
            {busy ? t("accept.submitting") : t("accept.submit")}
          </button>
        </div>
      </form>
    </article>
  );
}

/**
 * Assinatura desenhada com o mouse, a caneta ou o dedo, ou o nome digitado (para quem não
 * consegue desenhar: alternativa pelo teclado). Avisa o canvas quando há assinatura (ou
 * `null` ao limpar).
 */
function SignaturePad({ t, typedName, error, onChange }: { t: T; typedName: string; error?: string; onChange: (canvas: HTMLCanvasElement | null) => void }) {
  const id = useId();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    el.width = el.offsetWidth * ratio;
    el.height = el.offsetHeight * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // O fundo da área é sempre branco (vira papel no PDF): traço escuro fixo.
    ctx.strokeStyle = "#111111";
  }, []);

  const point = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const ctx = e.currentTarget.getContext?.("2d");
    if (!ctx) return;
    const { x, y } = point(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };
  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext("2d");
    const { x, y } = point(e);
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setEmpty(false);
    onChange(canvas.current);
  };
  const clear = () => {
    const el = canvas.current;
    el?.getContext?.("2d")?.clearRect(0, 0, el.width, el.height);
    setEmpty(true);
    onChange(null);
  };
  const useTyped = () => {
    const el = canvas.current;
    if (!el || !typedName) return;
    const ctx = el.getContext?.("2d");
    if (ctx) {
      ctx.clearRect(0, 0, el.width, el.height);
      const w = el.offsetWidth || 320;
      const h = el.offsetHeight || 144;
      let size = Math.min(48, h * 0.4);
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const font = (px: number) => `italic ${px}px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive`;
      ctx.font = font(size);
      while (size > 14 && ctx.measureText(typedName).width > w * 0.9) ctx.font = font((size -= 2));
      ctx.fillText(typedName, w / 2, h / 2);
    }
    setEmpty(false);
    onChange(el);
  };

  return (
    <div className="rb-field rb-flow__signature">
      <span className="rb-field__label" id={`${id}-label`}>
        {t("accept.signature")}
        <span aria-hidden="true"> *</span>
      </span>
      <span className="rb-field__hint" id={`${id}-hint`}>
        {t("accept.signatureHint")}
      </span>
      <div className="rb-proposal__pad">
        <canvas
          ref={canvas}
          className="rb-flow__signature-pad"
          role="img"
          aria-label={t("accept.signatureArea")}
          aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
          aria-invalid={!!error}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
        {empty && (
          <span className="rb-proposal__pad-placeholder" aria-hidden="true">
            {t("accept.signHere")}
          </span>
        )}
      </div>
      {error && (
        <span className="rb-field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
      <div className="rb-actions">
        <button type="button" className="rb-button rb-button--ghost" onClick={useTyped} disabled={!typedName}>
          {t("accept.signatureTyped")}
        </button>
        <button type="button" className="rb-button rb-button--ghost" onClick={clear} disabled={empty}>
          {t("accept.signatureClear")}
        </button>
      </div>
    </div>
  );
}

function Done({ props, t, slug, acceptance, proposal, signature }: { props: AppIslandProps; t: T; slug: string; acceptance: Acceptance; proposal: OpenProposal; signature?: string }) {
  const [popupBlocked, setPopupBlocked] = useState(false);
  return (
    <Notice
      title={t("accept.done")}
      tone="success"
      action={
        <>
          <button type="button" className="rb-button rb-button--primary" onClick={() => setPopupBlocked(!downloadContract(t, proposal, acceptance, props.locale, props.defaultLocale, signature))}>
            {t("proposal.downloadContract")}
          </button>
          <a className="rb-button rb-button--secondary" href={hrefFor(props, "proposta", { slug })}>
            {t("accept.back")}
          </a>
        </>
      }
    >
      <p>{t("accept.doneBody")}</p>
      <dl className="rb-flow__facts">
        <div className="rb-flow__facts-wide">
          <dt>{t("contract.hash")}</dt>
          <dd className="rb-flow__code">{acceptance.contentHash}</dd>
        </div>
      </dl>
      {popupBlocked && <p className="rb-field__error" role="alert">{t("contract.popup")}</p>}
    </Notice>
  );
}
