/** Depoimentos: a lista da coleção e a fila dos enviados pelo site (aprovar ou recusar). */
import { useState } from "react";
import { Check, X } from "lucide-react";
import { api, type TestimonialSubmission } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { CollectionScreen } from "../collections/CollectionScreen";
import { errorMessage } from "../editor/model";
import { useRouter, Link } from "../lib/router";
import { timeAgo } from "../lib/format";
import { toast } from "../lib/toast";
import { localeName, usePanel } from "../panel";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge, Input, Label, NativeSelect, Spinner, Textarea } from "../ui/form";
import { cn } from "../lib/utils";

function ApproveDialog({ sub, onClose }: { sub: TestimonialSubmission; onClose: () => void }) {
  const panel = usePanel();
  const approve = useMutation(api.testimonialIntake.approve);
  const [quote, setQuote] = useState(sub.quote);
  const [role, setRole] = useState(sub.role ?? "");
  const [locale, setLocale] = useState(sub.locale);
  const [publish, setPublish] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aprovar o depoimento de {sub.name}</DialogTitle>
          <DialogDescription>Vira um depoimento da coleção. Você pode ajustar o texto antes (erros de digitação, por exemplo).</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await approve({ id: sub._id, quote, role: role || undefined, locale, published: publish });
              toast.success(publish ? "Aprovado e publicado: entra no site na próxima publicação." : "Aprovado como rascunho.");
              onClose();
            } catch (err) {
              toast.error(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="appr-quote">Depoimento</Label>
            <Textarea id="appr-quote" rows={5} value={quote} onChange={(e) => setQuote(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="appr-role">Cargo</Label>
              <Input id="appr-role" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appr-locale">Idioma do texto</Label>
              <NativeSelect id="appr-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
                {panel.locales.locales.map((l) => (
                  <option key={l} value={l}>
                    {localeName(l)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publicar agora (senão fica como rascunho)
          </label>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy || !quote.trim()}>
              {busy ? <Spinner /> : <Check />} Aprovar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Queue() {
  const pending = useQuery(api.testimonialIntake.list, { status: "pending" });
  const reject = useMutation(api.testimonialIntake.reject);
  const [approving, setApproving] = useState<TestimonialSubmission>();
  if (pending === undefined) return <Loading />;
  return (
    <div className="space-y-3 p-6">
      {pending.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum depoimento esperando aprovação.</p>
      ) : (
        <ul className="space-y-3" aria-label="Depoimentos enviados">
          {pending.map((sub) => (
            <li key={sub._id} className="space-y-3 rounded-lg border bg-card p-4" data-submission-id={sub._id}>
              <blockquote className="text-sm whitespace-pre-line">“{sub.quote}”</blockquote>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium">{sub.name}</span>
                {(sub.role || sub.company) && <span className="text-muted-foreground">{[sub.role, sub.company].filter(Boolean).join(" · ")}</span>}
                <Badge variant="outline">{localeName(sub.locale)}</Badge>
                <span className="text-xs text-muted-foreground">
                  {sub.email} · {timeAgo(sub.createdAt)}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" onClick={() => setApproving(sub)}>
                    <Check /> Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!window.confirm(`Recusar o depoimento de ${sub.name}? O envio é apagado.`)) return;
                      try {
                        await reject({ id: sub._id });
                        toast.success("Recusado.");
                      } catch (e) {
                        toast.error(errorMessage(e));
                      }
                    }}
                  >
                    <X /> Recusar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {approving && <ApproveDialog sub={approving} onClose={() => setApproving(undefined)} />}
    </div>
  );
}

export default function Testimonials() {
  const panel = usePanel();
  const { search } = useRouter();
  const intake = panel.enabled.has("testimonials-intake");
  const pending = useQuery(api.testimonialIntake.list, intake ? { status: "pending" } : "skip");
  const view = search.get("fila") ? "fila" : "lista";
  // O editor de um depoimento ocupa a tela toda.
  if (search.get("id") || search.get("novo") || !intake) return <CollectionScreen name="testimonials" />;
  const tab = (key: string, label: string, to: string, count?: number) => (
    <Link
      to={to}
      aria-current={view === key ? "page" : undefined}
      className={cn("inline-flex h-9 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground hover:text-foreground", view === key && "border-primary text-foreground")}
    >
      {label}
      {count ? <Badge variant="warning">{count}</Badge> : null}
    </Link>
  );
  return (
    <>
      {view === "fila" ? (
        <PageHeader title="Depoimentos" description="Os depoimentos enviados pelo site esperam a sua aprovação antes de aparecer." />
      ) : null}
      <nav aria-label="Depoimentos" className="flex gap-1 border-b bg-card px-4">
        {tab("lista", "No site", "/admin/depoimentos")}
        {tab("fila", "Enviados para aprovar", "/admin/depoimentos?fila=1", pending?.length)}
      </nav>
      {view === "fila" ? <Queue /> : <CollectionScreen name="testimonials" />}
    </>
  );
}
