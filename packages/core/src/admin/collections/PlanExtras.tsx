/** Preço e link de pagamento do plano (só no editor de planos). */
import { useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { can } from "../../convex/lib/roles";
import { api, type BillingType, type CollectionDoc } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage, type Values } from "../editor/model";
import { formatCents, planPayability, type PricePeriod } from "../lib/format";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { Alert, Badge, Label, NativeSelect, Spinner } from "../ui/form";
import { Switch } from "../ui/tabs";
import { PriceField, Section } from "./parts";

function CheckoutLink({ doc, form, dirty }: { doc: CollectionDoc; form: Values; dirty: boolean }) {
  const links = useQuery(api.checkouts.listLinks, {});
  const link = useMutation(api.checkouts.linkPlan);
  const unlink = useMutation(api.checkouts.unlinkPlan);
  const [billing, setBilling] = useState<BillingType | "">("");
  const [busy, setBusy] = useState(false);
  const active = links?.find((l) => l.planId === doc._id && l.active);
  const check = planPayability({ priceCents: form.priceCents as number | undefined, currency: form.currency as string | undefined, period: form.period as PricePeriod | undefined });
  const blocked = !check.ok ? check.reason : !doc.published ? "Publique o plano para ligar o link." : dirty ? "Salve as mudanças antes de ligar ou desligar o link." : undefined;

  async function toggle(on: boolean) {
    setBusy(true);
    try {
      if (on) {
        const res = await link({ planId: doc._id, ...(billing ? { billingType: billing } : {}) });
        toast.success(`Link de pagamento ligado: ${res.href}`);
      } else {
        await unlink({ planId: doc._id });
        toast.success("Link de pagamento desligado.");
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Link de pagamento" description="Liga o botão do plano a uma página de checkout (PIX, boleto ou cartão). O valor vem deste plano.">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="plan-link">
          <CreditCard className="size-4" /> Link de pagamento {active ? <Badge variant="success">ligado</Badge> : <Badge variant="secondary">desligado</Badge>}
        </Label>
        {busy ? <Spinner /> : <Switch id="plan-link" checked={!!active} disabled={!active && !!blocked} onCheckedChange={toggle} />}
      </div>
      {!active && (
        <div className="space-y-1.5">
          <Label htmlFor="plan-billing">Forma de pagamento aceita</Label>
          <NativeSelect id="plan-billing" value={billing} onChange={(e) => setBilling(e.target.value as BillingType | "")} className="max-w-60">
            <option value="">Todas (PIX, boleto e cartão)</option>
            <option value="PIX">Só PIX</option>
            <option value="BOLETO">Só boleto</option>
            <option value="CREDIT_CARD">Só cartão</option>
          </NativeSelect>
        </div>
      )}
      {blocked && !active && <p className="text-xs text-muted-foreground">{blocked}</p>}
      {active && (
        <Alert>
          <ExternalLink />
          <p>
            Cobra {formatCents((doc.priceCents as number) ?? 0)} em <code className="font-mono">/checkout/{active.uniqueLink}</code>. O botão do plano aponta para esse link
            {active.billingType ? ` (só ${active.billingType})` : ""}. Mudar o preço do plano vale para os próximos pagamentos.
          </p>
        </Alert>
      )}
    </Section>
  );
}

/** Preço em reais, antes do restante do plano. */
export function PlanPrice({ form, set }: { form: Values; set: (key: string, value: unknown) => void }) {
  return (
    <Section title="Preço" description="Valor em reais, com período de cobrança abaixo. Sem valor, vale o texto livre no lugar do preço.">
      <PriceField cents={form.priceCents as number | undefined} currency={form.currency as string | undefined} onChange={(cents) => set("priceCents", cents)} />
    </Section>
  );
}

/** Link de pagamento do plano (precisa de papel e do plugin de pagamentos). */
export function PlanCheckout({ doc, form, dirty }: { doc?: CollectionDoc; form: Values; dirty: boolean }) {
  const panel = usePanel();
  const canLink = can(panel.me.role, "checkouts") && panel.enabled.has("payments");
  if (!canLink) return null;
  if (!doc) return <p className="text-xs text-muted-foreground">Salve o plano para poder ligar o link de pagamento.</p>;
  return <CheckoutLink doc={doc} form={form} dirty={dirty} />;
}
