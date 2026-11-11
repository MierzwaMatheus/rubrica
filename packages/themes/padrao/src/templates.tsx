/**
 * Página 404 como a da v1: tela de terminal com o rótulo "Erro do sistema", o código do erro,
 * o 404 enorme sobre uma grade, um fio em degradê e o botão para voltar ao início. Sem
 * JavaScript (o efeito de glitch da v1 ficou de fora). O h1 leva o 404 e, para leitor de
 * tela, o título "Página não encontrada".
 */
import type { NotFoundProps } from "@rubrica/core";
import { Icon } from "./icons";

export function PadraoNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="rb-notfound rb-404">
      <div className="rb-404__box">
        <p className="rb-404__label">
          <Icon name="terminal" size={14} />
          <span>{ctx.t("notFound.label")}</span>
          <span className="rb-404__code">{ctx.t("notFound.code")}</span>
        </p>
        <h1 className="rb-404__title">
          <span aria-hidden="true">404</span>
          <span className="rb-sr-only">{ctx.t("notFound.title")}</span>
        </h1>
        <p className="rb-404__body rb-sr-only">{ctx.t("notFound.body")}</p>
        <div className="rb-404__line" aria-hidden="true" />
        <a className="rb-404__home" href={ctx.href("/")}>
          <Icon name="home" size={14} />
          {ctx.t("notFound.home")}
        </a>
      </div>
    </section>
  );
}
