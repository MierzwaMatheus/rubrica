/** Peças comuns das páginas do app: props, parâmetros da URL, backend e avisos. */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fillPath, matchPath } from "../../plugins/app-routes";
import { makeT } from "../kit";
import { convexAppApi, type AppApi, type AppBackend } from "./client";

/** Props que a página da rota (`astro/pages/app.astro`) entrega à ilha (serializáveis, menos `api`). */
export interface AppIslandProps {
  locale: string;
  defaultLocale: string;
  /** Caminho público desta página no idioma (`/en/proposta/:slug`). */
  pattern: string;
  /** Caminho público de cada página do app no idioma, por ilha (para os links entre elas). */
  routes: Record<string, string>;
  homeHref: string;
  texts: Record<string, string>;
  backend: AppBackend;
  /** Só nos testes: backend falso. */
  api?: AppApi;
}

export type T = ReturnType<typeof makeT>;

/**
 * Parâmetros da página, lidos do endereço (a hospedagem reescreveu para esta página
 * estática). `undefined` antes de montar; `null` se o endereço não casa (página aberta direto).
 */
export function useParams(pattern: string): Record<string, string> | null | undefined {
  const [params, setParams] = useState<Record<string, string> | null | undefined>(undefined);
  useEffect(() => setParams(matchPath(pattern, window.location.pathname)), [pattern]);
  return params;
}

export function useAppApi(props: AppIslandProps): AppApi | null {
  return useMemo(() => props.api ?? (props.backend.kind === "convex" ? convexAppApi(props.backend) : null), [props.api, props.backend]);
}

export function hrefFor(props: AppIslandProps, island: string, params: Record<string, string>): string {
  const pattern = props.routes[island];
  return pattern ? fillPath(pattern, params) : props.homeHref;
}

export function Notice({ title, children, tone = "info", headingLevel = 1, action }: { title: string; children?: ReactNode; tone?: "info" | "success" | "danger"; headingLevel?: 1 | 2; action?: ReactNode }) {
  const H = headingLevel === 1 ? "h1" : "h2";
  return (
    <div className={`rb-flow__notice rb-flow__notice--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <H className="rb-flow__notice-title">{title}</H>
      {children}
      {action && <div className="rb-actions">{action}</div>}
    </div>
  );
}

/** Estados que toda página do app tem antes do conteúdo: sem backend, carregando, não achou, erro. */
export function Gate({ props, t, state, children }: { props: AppIslandProps; t: T; state: "demo" | "missing" | "loading" | "notFound" | "error" | "ready"; children?: () => ReactNode }) {
  if (state === "demo") return <Notice title={t("app.notFound.title")}>{<p>{t("app.demo")}</p>}</Notice>;
  if (state === "missing") return <Notice title={t("app.notFound.title")}>{<p>{t("app.missing")}</p>}</Notice>;
  if (state === "loading")
    return (
      <p className="rb-flow__loading" role="status">
        {t("app.loading")}
      </p>
    );
  if (state === "error")
    return (
      <Notice title={t("app.error")} tone="danger" action={<button type="button" className="rb-button rb-button--secondary" onClick={() => window.location.reload()}>{t("app.retry")}</button>} />
    );
  if (state === "notFound")
    return (
      <Notice title={t("app.notFound.title")} action={<a className="rb-button rb-button--secondary" href={props.homeHref}>{t("app.home")}</a>}>
        <p>{t("app.notFound.body")}</p>
      </Notice>
    );
  return <>{children?.()}</>;
}

/** Estado inicial comum: backend ausente ou de demonstração vence o resto. */
export function baseState(props: AppIslandProps, params: Record<string, string> | null | undefined, watched: { state: string }): "demo" | "missing" | "loading" | "notFound" | "error" | null {
  if (!props.api && props.backend.kind !== "convex") return props.backend.kind;
  if (params === undefined) return "loading";
  if (params === null) return "notFound";
  if (watched.state === "loading") return "loading";
  if (watched.state === "error") return "error";
  return null;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
