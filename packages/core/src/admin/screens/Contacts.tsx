/** Contatos: caixa de entrada, falhas de entrega e destinos dos avisos (Telegram, e-mail, webhook). */
import { useEffect, useMemo, useState } from "react";
import { Archive, ArchiveRestore, Mail, MailOpen, Phone, RefreshCw, Trash2 } from "lucide-react";
import { can } from "../../convex/lib/roles";
import { api, type ContactDoc, type ContactStatus, type DeliveryDoc, type DestinationId } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { formatDateTime, timeAgo } from "../lib/format";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { localeName, usePanel } from "../panel";
import { contactDetail } from "../lib/labels";
import { Button } from "../ui/button";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner, Textarea } from "../ui/form";
import { Switch } from "../ui/tabs";

const DESTINATION_LABELS: Record<DestinationId, string> = { telegram: "Telegram", email: "E-mail", webhook: "Webhook" };
const FILTERS: { key: ContactStatus | "all"; label: string }[] = [
  { key: "new", label: "Novos" },
  { key: "read", label: "Lidos" },
  { key: "archived", label: "Arquivados" },
  { key: "all", label: "Todos" },
];

function DeliveryBadge({ d }: { d: DeliveryDoc }) {
  const variant = d.status === "sent" ? "success" : d.status === "failed" ? "destructive" : "secondary";
  const text = d.status === "sent" ? "enviado" : d.status === "failed" ? "falhou" : "enviando";
  return (
    <Badge variant={variant} title={d.lastError}>
      {DESTINATION_LABELS[d.destination]}: {text}
    </Badge>
  );
}

function Detail({ contact }: { contact: ContactDoc }) {
  const { navigate } = useRouter();
  const markRead = useMutation(api.contacts.markRead);
  const markUnread = useMutation(api.contacts.markUnread);
  const archive = useMutation(api.contacts.archive);
  const unarchive = useMutation(api.contacts.unarchive);
  const remove = useMutation(api.contacts.remove);
  const retry = useMutation(api.contacts.retryDelivery);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) toast.success(ok);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  // Abrir um pedido novo o marca como lido.
  useEffect(() => {
    if (contact.status === "new") void markRead({ id: contact._id }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact._id]);

  const details = Object.entries(contact.details ?? {});
  const whatsapp = contact.phone?.replace(/\D/g, "");
  return (
    <article className="space-y-4" aria-label={`Contato de ${contact.name}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{contact.name}</h2>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(contact.createdAt)} · {timeAgo(contact.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {contact.status === "new" && <Badge variant="default">novo</Badge>}
          {contact.status === "archived" && <Badge variant="secondary">arquivado</Badge>}
          {contact.spam && <Badge variant="warning" title="Parece spam (muitos links): não disparou os avisos">possível spam</Badge>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href={`mailto:${contact.email}`}>
            <Mail /> {contact.email}
          </a>
        </Button>
        {contact.phone && (
          <Button asChild size="sm" variant="outline">
            <a href={whatsapp ? `https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}` : `tel:${contact.phone}`} target="_blank" rel="noreferrer">
              <Phone /> {contact.phone}
            </a>
          </Button>
        )}
      </div>
      <div className="rounded-lg border bg-card p-4 text-sm whitespace-pre-line">{contact.message}</div>
      {details.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border bg-card p-4 text-sm">
          {details.map(([k, v]) => {
            const field = contactDetail(k, v);
            return (
              <div key={k} className="contents">
                <dt className="text-muted-foreground">{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            );
          })}
        </dl>
      )}
      <p className="text-xs text-muted-foreground">
        Enviado de <code>{contact.page}</code> em {localeName(contact.locale)}.
      </p>
      <section aria-label="Avisos enviados" className="space-y-2">
        <h3 className="text-sm font-semibold">Avisos</h3>
        {contact.deliveries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum destino ligado quando o pedido chegou (ele fica só aqui no painel).</p>
        ) : (
          <ul className="space-y-1.5">
            {contact.deliveries.map((d) => (
              <li key={d._id} className="flex flex-wrap items-center gap-2 text-sm">
                <DeliveryBadge d={d} />
                {d.status === "failed" && (
                  <>
                    <span className="text-xs text-destructive">{d.lastError}</span>
                    <Button size="sm" variant="outline" onClick={() => run(() => retry({ id: d._id }), "Nova tentativa feita.")}>
                      <RefreshCw /> Tentar de novo
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex flex-wrap gap-2 border-t pt-4">
        {contact.status === "new" ? (
          <Button size="sm" variant="outline" onClick={() => run(() => markRead({ id: contact._id }))}>
            <MailOpen /> Marcar como lido
          </Button>
        ) : contact.status === "read" ? (
          <Button size="sm" variant="outline" onClick={() => run(() => markUnread({ id: contact._id }))}>
            <Mail /> Marcar como não lido
          </Button>
        ) : null}
        {contact.status === "archived" ? (
          <Button size="sm" variant="outline" onClick={() => run(() => unarchive({ id: contact._id }), "Tirado do arquivo.")}>
            <ArchiveRestore /> Desarquivar
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => run(() => archive({ id: contact._id }), "Arquivado.")}>
            <Archive /> Arquivar
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-destructive"
          onClick={() => {
            if (!window.confirm(`Apagar o contato de ${contact.name} de vez? São dados pessoais: não há lixeira e não dá para desfazer.`)) return;
            void run(async () => {
              await remove({ id: contact._id });
              navigate("/admin/contatos", { force: true });
            }, "Contato apagado.");
          }}
        >
          <Trash2 /> Apagar
        </Button>
      </div>
    </article>
  );
}

function Inbox() {
  const { search } = useRouter();
  const [filter, setFilter] = useState<ContactStatus | "all">("new");
  const all = useQuery(api.contacts.list, { limit: 500 });
  const selectedId = search.get("id");
  const shown = useMemo(() => (all ?? []).filter((c) => filter === "all" || c.status === filter), [all, filter]);
  const selected = all?.find((c) => c._id === selectedId);
  const counts = useMemo(() => ({ new: all?.filter((c) => c.status === "new").length ?? 0, read: all?.filter((c) => c.status === "read").length ?? 0, archived: all?.filter((c) => c.status === "archived").length ?? 0, all: all?.length ?? 0 }), [all]);
  if (all === undefined) return <Loading />;
  return (
    <div className="grid min-h-0 gap-6 p-6 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn("inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-sm hover:bg-accent", filter === f.key && "border-primary bg-primary/10 text-primary")}
            >
              {f.label} <span className="text-xs text-muted-foreground">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{filter === "new" ? "Nenhum contato novo." : "Nada por aqui."}</p>
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border bg-card" aria-label="Contatos">
            {shown.map((c) => {
              const failed = c.deliveries.some((d) => d.status === "failed");
              return (
                <li key={c._id}>
                  <Link to={`/admin/contatos?id=${c._id}`} aria-current={c._id === selectedId ? "true" : undefined} className={cn("block px-4 py-3 hover:bg-accent", c._id === selectedId && "bg-accent")}>
                    <span className="flex items-center gap-2">
                      {c.status === "new" && <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="não lido" />}
                      <span className={cn("truncate", c.status === "new" ? "font-semibold" : "font-medium")}>{c.name}</span>
                      {c.spam && <Badge variant="warning">spam</Badge>}
                      {failed && <Badge variant="destructive">falha no aviso</Badge>}
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{c.message}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="min-w-0">
        {selected ? <Detail key={selected._id} contact={selected} /> : <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Escolha um contato para ler.</p>}
      </div>
    </div>
  );
}

function Failures() {
  const failed = useQuery(api.contacts.failedDeliveries, {});
  const retry = useMutation(api.contacts.retryDelivery);
  if (failed === undefined) return <Loading />;
  return (
    <div className="space-y-3 p-6">
      {failed.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhuma falha de entrega. Os avisos estão chegando.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card" aria-label="Falhas de entrega">
          {failed.map((d) => (
            <li key={d._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium">
                  {DESTINATION_LABELS[d.destination]} <span className="font-normal text-muted-foreground">· {d.source === "testimonial" ? "depoimento enviado" : "pedido de contato"} · {d.attempts} tentativas</span>
                </p>
                <p className="text-xs text-destructive">{d.lastError ?? "Erro desconhecido"}</p>
                {d.lastAttemptAt && <p className="text-xs text-muted-foreground">Última tentativa {timeAgo(d.lastAttemptAt)}.</p>}
              </div>
              {d.source !== "testimonial" && d.sourceId && (
                <Button asChild size="sm" variant="ghost">
                  <Link to={`/admin/contatos?id=${d.sourceId}`}>Ver o contato</Link>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    await retry({ id: d._id });
                    toast.success("Nova tentativa feita.");
                  } catch (e) {
                    toast.error(errorMessage(e));
                  }
                }}
              >
                <RefreshCw /> Tentar de novo
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Destinations() {
  const panel = usePanel();
  const dest = useQuery(api.contacts.destinations, {});
  const save = useMutation(api.contacts.setDestinations);
  const editable = can(panel.me.role, "settings");
  const [form, setForm] = useState<{ telegram: boolean; emailOn: boolean; emailTo: string; webhookOn: boolean; webhookUrl: string }>();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (dest && !form) setForm({ telegram: dest.telegram, emailOn: dest.email.enabled, emailTo: dest.email.to.join("\n"), webhookOn: dest.webhook.enabled, webhookUrl: dest.webhook.url ?? "" });
  }, [dest, form]);
  if (!dest || !form) return <Loading />;
  const set = (patch: Partial<typeof form>) => setForm({ ...form, ...patch });
  const recipients = form.emailTo.split(/[\s,;]+/).filter(Boolean);
  const missing = (id: DestinationId) => dest.missing[id];
  const note = (id: DestinationId, on: boolean) =>
    on && missing(id).length > 0 ? (
      <Alert variant="warning">
        <p>
          Ligado, mas falta configurar no Convex: <code>{missing(id).join(", ")}</code>. Sem isso os avisos falham (veja “Falhas de entrega”).
        </p>
      </Alert>
    ) : null;
  return (
    <form
      className="max-w-2xl space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await save({ telegram: form.telegram, email: { enabled: form.emailOn, to: recipients }, webhook: { enabled: form.webhookOn, ...(form.webhookUrl.trim() ? { url: form.webhookUrl.trim() } : {}) } });
          toast.success("Destinos salvos.");
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">Todo contato fica aqui no painel. Cada destino ligado recebe também um aviso quando um contato ou depoimento chega.</p>
      {!editable && <Alert variant="warning">Só administradores mudam os destinos. Você pode ver como estão.</Alert>}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Telegram</CardTitle>
            <Switch aria-label="Avisar pelo Telegram" checked={form.telegram} disabled={!editable} onCheckedChange={(v) => set({ telegram: v })} />
          </div>
          <CardDescription>Mensagem no chat configurado no bot do site.</CardDescription>
        </CardHeader>
        <CardContent>{note("telegram", form.telegram)}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>E-mail</CardTitle>
            <Switch aria-label="Avisar por e-mail" checked={form.emailOn} disabled={!editable} onCheckedChange={(v) => set({ emailOn: v })} />
          </div>
          <CardDescription>Até 10 destinatários.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dest-emails">Destinatários (um por linha)</Label>
            <Textarea id="dest-emails" rows={3} value={form.emailTo} disabled={!editable} onChange={(e) => set({ emailTo: e.target.value })} aria-invalid={form.emailOn && recipients.length === 0 ? true : undefined} />
            {form.emailOn && recipients.length === 0 && <p className="text-xs text-destructive">Informe pelo menos um destinatário.</p>}
          </div>
          {note("email", form.emailOn)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Webhook</CardTitle>
            <Switch aria-label="Avisar por webhook" checked={form.webhookOn} disabled={!editable} onCheckedChange={(v) => set({ webhookOn: v })} />
          </div>
          <CardDescription>O site faz um POST com os dados do contato (JSON) neste endereço, para ligar com Zapier, n8n, Slack…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dest-webhook">Endereço (https)</Label>
            <Input id="dest-webhook" value={form.webhookUrl} disabled={!editable} placeholder="https://hooks.exemplo.com/…" onChange={(e) => set({ webhookUrl: e.target.value })} />
          </div>
          {note("webhook", form.webhookOn)}
        </CardContent>
      </Card>
      {editable && (
        <Button type="submit" disabled={busy}>
          {busy ? <Spinner /> : null} Salvar destinos
        </Button>
      )}
    </form>
  );
}

export default function Contacts() {
  const panel = usePanel();
  const { search } = useRouter();
  const failed = useQuery(api.contacts.failedDeliveries, {});
  const unread = useQuery(api.contacts.unreadCount, {});
  const tab = search.get("aba") === "falhas" ? "falhas" : search.get("aba") === "destinos" ? "destinos" : "entrada";
  const link = (key: string, label: string, to: string, count?: number, tone: "warning" | "destructive" = "warning") => (
    <Link
      to={to}
      aria-current={tab === key ? "page" : undefined}
      className={cn("inline-flex h-9 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground", tab === key && "border-primary text-foreground")}
    >
      {label}
      {count ? <Badge variant={tone}>{count}</Badge> : null}
    </Link>
  );
  return (
    <>
      <PageHeader title="Contatos" description="Pedidos enviados pelo formulário do site." />
      <nav aria-label="Seções de contatos" className="flex gap-1 border-b bg-card px-4">
        {link("entrada", "Caixa de entrada", "/admin/contatos", unread)}
        {link("falhas", "Falhas de entrega", "/admin/contatos?aba=falhas", failed?.length, "destructive")}
        {link("destinos", "Destinos dos avisos", "/admin/contatos?aba=destinos")}
      </nav>
      {tab === "entrada" ? <Inbox /> : tab === "falhas" ? <Failures /> : <Destinations />}
    </>
  );
}
