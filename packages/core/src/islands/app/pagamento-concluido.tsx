/**
 * `/payment-success/<uniqueLink>` (port de `PaymentSuccess.tsx` da v1): para onde o Asaas
 * volta depois do cartão. A confirmação vem pelo webhook e pode levar alguns segundos; a
 * leitura é ao vivo, então a página muda sozinha quando chega.
 */
import { makeT } from "../kit";
import { FN, useWatch } from "./client";
import type { PublicCheckout, PublicPlanLink } from "./checkout";
import { money } from "./format";
import { Gate, Notice, baseState, hrefFor, useAppApi, useParams, type AppIslandProps } from "./ui";

const METHOD_KEY: Record<string, string> = { pix: "checkout.pix", boleto: "checkout.boleto", credit_card: "checkout.card" };

export default function PagamentoConcluido(props: AppIslandProps) {
  const t = makeT(props.texts);
  const api = useAppApi(props);
  const params = useParams(props.pattern);
  const link = params?.uniqueLink;
  const watched = useWatch<PublicCheckout | PublicPlanLink | null>(api, FN.checkout, link ? { uniqueLink: link } : null);

  const base = baseState(props, params, watched);
  if (base) return <Gate props={props} t={t} state={base} />;
  const c = watched.state === "ready" ? watched.value : null;
  if (!c || c.kind !== "checkout" || !link) return <Gate props={props} t={t} state="notFound" />;
  const fmt = (v: number) => money(v, props.locale);
  const home = <a className="rb-button rb-button--secondary" href={props.homeHref}>{t("app.home")}</a>;

  if (c.status === "expired" || c.status === "failed" || c.status === "refunded") {
    const body = c.status === "refunded" ? t("checkout.refundedBody") : c.status === "expired" ? t("payment.failedExpired") : t("payment.failedBody");
    return (
      <Notice title={t("payment.failedTitle")} tone="danger" action={home}>
        <p>{body}</p>
      </Notice>
    );
  }
  if (c.status !== "paid") {
    return (
      <Notice
        title={t("payment.confirmingTitle")}
        action={<a className="rb-button rb-button--secondary" href={hrefFor(props, "checkout", { uniqueLink: link })}>{t("payment.backToCheckout")}</a>}
      >
        <p>{t("payment.confirmingBody")}</p>
        <p className="rb-flow__waiting">{t("checkout.waiting")}</p>
      </Notice>
    );
  }
  const method = c.paymentMethod ? METHOD_KEY[c.paymentMethod] : undefined;
  return (
    <Notice title={t("payment.success")} tone="success" action={home}>
      <dl className="rb-flow__facts">
        {c.description && (
          <div className="rb-flow__facts-wide">
            <dt>{t("checkout.description")}</dt>
            <dd>{c.description}</dd>
          </div>
        )}
        <div>
          <dt>{t("payment.total")}</dt>
          <dd className="rb-flow__total">{fmt(c.totalValue ?? c.value)}</dd>
        </div>
        {method && (
          <div>
            <dt>{t("payment.method")}</dt>
            <dd>{t(method)}</dd>
          </div>
        )}
        {c.installmentCount && c.installmentCount > 1 && c.installmentValue ? (
          <div>
            <dt>{t("payment.installments")}</dt>
            <dd>{t("checkout.installment", { count: c.installmentCount, value: fmt(c.installmentValue) })}</dd>
          </div>
        ) : null}
      </dl>
    </Notice>
  );
}
