/** Peças comuns dos formulários das ilhas: textos, campos e consentimento. Sem bibliotecas. */
import { useEffect, useRef, type ReactNode } from "react";

/** Props que o núcleo entrega a toda ilha de formulário (serializáveis). */
export interface FormIslandProps {
  blockId: string;
  /** Caminho da página atual. */
  page: string;
  locale: string;
  fields: Record<string, unknown>;
  /** Textos de interface já no idioma, só as chaves que a ilha declara em `ISLAND_META`. */
  texts: Record<string, string>;
  /** Política de privacidade no idioma (`/privacidade`). */
  privacyHref: string;
}

export function makeT(texts: Record<string, string>) {
  return (key: string, vars?: Record<string, string | number>): string => {
    const text = texts[key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
  };
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Field({ id, label, error, hint, required, children }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="rb-field">
      <label htmlFor={id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {hint && !error && (
        <span className="rb-field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="rb-field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Consent({ id, checked, onChange, error, t, privacyHref }: { id: string; checked: boolean; onChange: (v: boolean) => void; error?: string; t: ReturnType<typeof makeT>; privacyHref: string }) {
  return (
    <div className="rb-field">
      <div className="rb-consent">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
        <label htmlFor={id}>
          {t("form.consent")}{" "}
          <a href={privacyHref} target="_blank" rel="noopener noreferrer">
            {t("form.consentLink")}
          </a>
          <span aria-hidden="true"> *</span>
        </label>
      </div>
      {error && (
        <span className="rb-field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

/** Leva o foco ao título da etapa quando ela muda (leitores de tela anunciam a mudança). */
export function useFocusOnChange(dep: unknown, skipFirst = true) {
  const ref = useRef<HTMLLegendElement | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current && skipFirst) {
      first.current = false;
      return;
    }
    ref.current?.focus();
  }, [dep, skipFirst]);
  return ref;
}
