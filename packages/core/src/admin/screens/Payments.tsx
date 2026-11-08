/** Pagamentos: cobranças (links de checkout), o estado de cada uma e os links dos planos. */
import { useMemo, useState } from "react";
import { Copy, ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";
import { can } from "../../convex/lib/roles";
import { api, type BillingType, type CheckoutDoc, type CheckoutStatus } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { formatBRL, formatDate, formatDateTime, textIn } from "../lib/format";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Badge, Input, Label, NativeSelect, Spinner } from "../ui/form";

export const CHECKOUT_STATUS: Record<CheckoutStatus, { label: string; variant: "success" | "secondary" | "warning" | "destructive" }> = {
  pending: { label: "aguardando", variant: "secondary" },
  payment_selected: { label: "forma escolhida", variant: "secondary" },
  payment_confirmed: { label: "confirmando", variant: "warning" },
  paid: { label: "pago", variant: "success" },
  expired: { label: "vencido", variant: "warning" },
  failed: { label: "falhou", variant: "destructive" },
  refunded: { label: "estornado", variant: "destructive" },
};

const BILLING: Record<BillingType, string> = { PIX: "PIX", BOLETO: "Boleto", CREDIT_CARD: "Cartão" };

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado.");
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

function NewCheckout({ onClose }: { onClose: () => void }) {
  const create = useMutation(api.checkouts.create);
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerCpfCnpj: "", value: "", description: "", dueDate: new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10), billingType: "" });
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova cobrança</DialogTitle>
          <DialogDescription>Gera um link de checkout (PIX, boleto ou cartão) para mandar ao cliente.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const value = Number(form.value.replace(/\./g, "").replace(",", "."));
            const digits = form.customerCpfCnpj.replace(/\D/g, "");
            if (!form.customerName.trim()) return setError("Informe o nome do cliente.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.customerEmail.trim())) return setError("E-mail do cliente inválido.");
            if (digits.length !== 11 && digits.length !== 14) return setError("CPF (11 dígitos) ou CNPJ (14 dígitos) inválido.");
            if (!(value >= 5)) return setError("O valor mínimo é R$ 5,00.");
            setBusy(true);
            setError(undefined);
            try {
              await create({ customerName: form.customerName.trim(), customerEmail: form.customerEmail.trim(), customerCpfCnpj: digits, value, dueDate: form.dueDate, ...(form.description ? { description: form.description } : {}), ...(form.billingType ? { billingType: form.billingType } : {}) });
              toast.success("Cobrança criada.");
              onClose();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ck-name">Cliente</Label>
              <Input id="ck-name" value={form.customerName} onChange={(e) => set({ customerName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-email">E-mail</Label>
              <Input id="ck-email" type="email" value={form.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-doc">CPF ou CNPJ</Label>
              <Input id="ck-doc" inputMode="numeric" value={form.customerCpfCnpj} onChange={(e) => set({ customerCpfCnpj: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-value">Valor (R$)</Label>
              <Input id="ck-value" inputMode="decimal" placeholder="0,00" value={form.value} onChange={(e) => set({ value: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-due">Vencimento</Label>
              <Input id="ck-due" type="date" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ck-billing">Forma de pagamento</Label>
              <NativeSelect id="ck-billing" value={form.billingType} onChange={(e) => set({ billingType: e.target.value })}>
                <option value="">O cliente escolhe</option>
                {Object.entries(BILLING).map(([k, v]) => (
                  <option key={k} value={k}>
                    Só {v}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ck-desc">Descrição</Label>
            <Input id="ck-desc" value={form.description} placeholder="Ex.: Entrada do site" onChange={(e) => set({ description: e.target.value })} />
          </div>
          {error && <Alert variant="destructive">{error}</Alert>}
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : <Plus />} Criar cobrança
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Checkouts() {
  const panel = usePanel();
  const [status, setStatus] = useState<CheckoutStatus | "all" | "trash">("all");
  const checkouts = useQuery(api.checkouts.list, { includeDeleted: true });
  const remove = useMutation(api.checkouts.remove);
  const restore = useMutation(api.checkouts.restore);
  const [creating, setCreating] = useState(false);
  const canPurge = can(panel.me.role, "purge");
  const siteUrl = panel.settings?.url ?? "";
  const live = useMemo(() => (checkouts ?? []).filter((c) => c.deletedAt === undefined), [checkouts]);
  const shown = (checkouts ?? []).filter((c) => (status === "trash" ? c.deletedAt !== undefined : c.deletedAt === undefined && (status === "all" || c.status === status)));
  const total = (s: CheckoutStatus[]) => live.filter((c) => s.includes(c.status)).reduce((n, c) => n + (c.paidValue ?? c.value), 0);
  const run = (fn: () => Promise<unknown>, ok: string) => fn().then(() => toast.success(ok), (e) => toast.error(errorMessage(e)));
  return (
    <div className="space-y-4 p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Recebido", total(["paid"]), "text-success"],
          ["Aguardando pagamento", total(["pending", "payment_selected", "payment_confirmed"]), "text-foreground"],
          ["Vencido ou com falha", total(["expired", "failed"]), "text-warning"],
        ].map(([label, value, tone]) => (
          <div key={label as string} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label as string}</p>
            <p className={cn("text-xl font-semibold tabular-nums", tone as string)}>{formatBRL(value as number)}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NativeSelect aria-label="Filtrar cobranças" className="w-52" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">Todas</option>
          {Object.entries(CHECKOUT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label[0]!.toUpperCase() + v.label.slice(1)}
            </option>
          ))}
          <option value="trash">Lixeira</option>
        </NativeSelect>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus /> Nova cobrança
        </Button>
      </div>
      {checkouts === undefined ? (
        <Loading />
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma cobrança por aqui.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" aria-label="Cobranças">
          {shown.map((c: CheckoutDoc) => {
            const url = `${siteUrl}/checkout/${c.uniqueLink}`;
            const s = CHECKOUT_STATUS[c.status];
            return (
              <li key={c._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.customerName}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.description ?? c.customerEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    criada em {formatDate(c.createdAt)} · {c.status === "paid" ? `paga em ${formatDateTime(c.completedAt)}` : `vence em ${c.dueDate.split("-").reverse().join("/")}`}
                    {c.billingType ? ` · só ${BILLING[c.billingType]}` : c.paymentMethod ? ` · ${c.paymentMethod}` : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatBRL(c.paidValue ?? c.value)}</span>
                <Badge variant={s.variant}>{s.label}</Badge>
                <div className="flex gap-1">
                  {c.deletedAt !== undefined ? (
                    canPurge ? (
                      <Button size="sm" variant="outline" onClick={() => run(() => restore({ id: c._id }), "Restaurada.")}>
                        <RotateCcw /> Restaurar
                      </Button>
                    ) : null
                  ) : (
                    <>
                      <Button size="icon-sm" variant="ghost" aria-label={`Copiar o link de ${c.customerName}`} onClick={() => copy(url)}>
                        <Copy />
                      </Button>
                      <Button asChild size="icon-sm" variant="ghost" aria-label={`Abrir o checkout de ${c.customerName}`}>
                        <a href={url} target="_blank" rel="noreferrer">
                          <ExternalLink />
                        </a>
                      </Button>
                      {c.status !== "paid" && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Apagar a cobrança de ${c.customerName}`}
                          onClick={() => window.confirm(`Apagar a cobrança de ${c.customerName}? O link deixa de receber pagamentos.`) && run(() => remove({ id: c._id }), "Na lixeira.")}
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {creating && <NewCheckout onClose={() => setCreating(false)} />}
    </div>
  );
}

function PlanLinks() {
  const panel = usePanel();
  const links = useQuery(api.checkouts.listLinks, {});
  const plans = useQuery(api.collection("plans").list, panel.enabled.has("pricing") ? {} : "skip");
  if (links === undefined) return <Loading />;
  const siteUrl = panel.settings?.url ?? "";
  return (
    <div className="space-y-3 p-6">
      <p className="text-sm text-muted-foreground">Cada plano pode ter um link de pagamento. Ligue e desligue na tela de cada plano.</p>
      {links.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum plano com link de pagamento. {panel.enabled.has("pricing") ? <Link to="/admin/planos" className="underline">Abrir os planos</Link> : "O plugin de planos está desligado neste site."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" aria-label="Links de plano">
          {links.map((l) => {
            const plan = plans?.find((p) => p._id === l.planId);
            const name = plan ? textIn(plan.name as Record<string, string>, panel.locales.default) : "Plano apagado";
            return (
              <li key={l._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{name}</p>
                  <code className="text-xs text-muted-foreground">/checkout/{l.uniqueLink}</code>
                </div>
                <Badge variant={l.active ? "success" : "secondary"}>{l.active ? "ligado" : "desligado"}</Badge>
                {l.billingType && <Badge variant="outline">só {BILLING[l.billingType]}</Badge>}
                <Button size="icon-sm" variant="ghost" aria-label={`Copiar o link do plano ${name}`} onClick={() => copy(`${siteUrl}/checkout/${l.uniqueLink}`)}>
                  <Copy />
                </Button>
                {plan && (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/planos?id=${plan._id}`}>Abrir o plano</Link>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Payments() {
  const { search } = useRouter();
  const tab = search.get("aba") === "planos" ? "planos" : "cobrancas";
  const link = (key: string, label: string, to: string) => (
    <Link to={to} aria-current={tab === key ? "page" : undefined} className={cn("inline-flex h-9 items-center border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground", tab === key && "border-primary text-foreground")}>
      {label}
    </Link>
  );
  return (
    <>
      <PageHeader title="Pagamentos" description="Links de checkout (PIX, boleto e cartão pelo Asaas) e o estado de cada cobrança." />
      <nav aria-label="Seções de pagamentos" className="flex gap-1 border-b bg-card px-4">
        {link("cobrancas", "Cobranças", "/admin/pagamentos")}
        {link("planos", "Links de plano", "/admin/pagamentos?aba=planos")}
      </nav>
      {tab === "planos" ? <PlanLinks /> : <Checkouts />}
    </>
  );
}
