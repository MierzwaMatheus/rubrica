/** Privacidade (LGPD): política de privacidade gerada e dados de um titular (exportar e excluir). */
import { useState } from "react";
import { Download, FileText, Search, ShieldCheck, Trash2 } from "lucide-react";
import { api, type PrivacyExport } from "../data/api";
import { useMutation, useQuery, useQueryOnce } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { formatDateTime, plainText, textIn } from "../lib/format";
import { Link } from "../lib/router";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner } from "../ui/form";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Policy() {
  const panel = usePanel();
  const status = useQuery(api.privacy.policyStatus, {});
  const draft = useQuery(api.privacy.policyDraft, {});
  const generate = useMutation(api.privacy.generatePolicy);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!status) return <Loading />;

  async function run(overwrite: boolean) {
    setBusy(true);
    try {
      const res = await generate({ overwrite, publish: true });
      toast.success(`Política gerada (versão ${res.version}). Ela vira a página ${status!.path} na próxima publicação.`);
      setConfirming(false);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Política de privacidade</CardTitle>
        <CardDescription>
          Um texto-base, montado com os dados do site, os plugins ligados e os destinos dos avisos. Ele vira a página <code>{status.path}</code>, que você pode editar. Confira se descreve o que o site faz de verdade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {status.exists ? (
            <>
              <Badge variant={status.published ? "success" : "secondary"}>{status.published ? "publicada" : "rascunho"}</Badge>
              <span>versão {status.version}</span>
              {status.updatedAt && <span className="text-muted-foreground">· atualizada em {formatDateTime(status.updatedAt)}</span>}
            </>
          ) : (
            <Badge variant="warning">ainda não existe</Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => (status.exists ? setConfirming(true) : void run(false))} disabled={busy}>
            {busy ? <Spinner /> : <ShieldCheck />} {status.exists ? "Gerar de novo" : "Gerar política"}
          </Button>
          {status.pageId && (
            <Button asChild variant="outline">
              <Link to={`/admin/paginas/editar?id=${status.pageId}`}>
                <FileText /> Editar a página
              </Link>
            </Button>
          )}
        </div>
        {draft && (
          <details className="rounded-md border p-3 text-sm">
            <summary className="cursor-pointer font-medium">Ver o texto padrão</summary>
            <div className="mt-3 space-y-3">
              {draft.blocks.map((b) => (
                <div key={b.id}>
                  <p className="font-medium">{textIn(b.fields.title as Record<string, string>, panel.locales.default)}</p>
                  <p className="text-muted-foreground">{plainText(textIn(b.fields.body as Record<string, string>, panel.locales.default))}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
      {confirming && (
        <Dialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Trocar pelo texto padrão?</DialogTitle>
              <DialogDescription>A página {status.path} já existe. Gerar de novo apaga as edições que você fez nela e sobe a versão da política.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={busy} onClick={() => run(true)}>
                {busy ? <Spinner /> : null} Trocar pelo texto padrão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

function download(data: PrivacyExport) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dados-${data.email.replace(/[^a-z0-9]+/gi, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function Titular() {
  const read = useQueryOnce();
  const erase = useMutation(api.privacy.erase);
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<PrivacyExport>();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"find" | "erase" | null>(null);
  const [error, setError] = useState<string>();
  const valid = EMAIL.test(email.trim());
  const matches = !!result && confirm.trim().toLowerCase() === result.email;

  async function find() {
    setBusy("find");
    setError(undefined);
    setResult(undefined);
    setConfirm("");
    try {
      setResult(await read(api.privacy.exportData, { email: email.trim() }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function wipe() {
    if (!result) return;
    if (!window.confirm(`Excluir de vez os dados de ${result.email}? Não dá para desfazer.`)) return;
    setBusy("erase");
    try {
      const res = await erase({ email: result.email, confirm });
      toast.success(`Dados excluídos (${res.total} registro${res.total === 1 ? "" : "s"}).`);
      setResult(undefined);
      setEmail("");
      setConfirm("");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de um titular</CardTitle>
        <CardDescription>
          Quando alguém pede os dados que o site guarda sobre ela (ou a exclusão), busque pelo e-mail. A exportação entrega tudo; a exclusão apaga ou anonimiza. O registro de atividades não guarda o e-mail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) void find();
          }}
        >
          <div className="min-w-60 flex-1 space-y-1.5">
            <Label htmlFor="titular-email">E-mail da pessoa</Label>
            <Input id="titular-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.com" />
          </div>
          <Button type="submit" disabled={!valid || busy !== null}>
            {busy === "find" ? <Spinner /> : <Search />} Buscar dados
          </Button>
        </form>
        {error && <Alert variant="destructive">{error}</Alert>}
        {result && (
          <div className="space-y-4" aria-live="polite">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {result.total === 0 ? "O site não guarda dados desta pessoa." : `Encontrado: ${result.total} registro${result.total === 1 ? "" : "s"} de ${result.email}.`}
              </p>
              <ul className="space-y-1 text-sm">
                {result.sources.map((s) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <Badge variant={s.records.length ? "default" : "secondary"}>{s.records.length}</Badge> {s.label}
                  </li>
                ))}
              </ul>
              {result.total > 0 && (
                <Button variant="outline" size="sm" onClick={() => download(result)}>
                  <Download /> Baixar os dados (JSON)
                </Button>
              )}
            </div>
            {result.total > 0 && (
              <div className="space-y-2 rounded-md border border-destructive/40 p-4">
                <p className="text-sm font-semibold text-destructive">Excluir os dados desta pessoa</p>
                <p className="text-sm text-muted-foreground">Apaga contatos e depoimentos enviados, e anonimiza aceites e pagamentos (que a lei manda guardar). Não dá para desfazer. Repita o e-mail para confirmar.</p>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-60 flex-1 space-y-1.5">
                    <Label htmlFor="titular-confirm">Repita o e-mail</Label>
                    <Input id="titular-confirm" value={confirm} autoComplete="off" onChange={(e) => setConfirm(e.target.value)} placeholder={result.email} aria-invalid={confirm !== "" && !matches ? true : undefined} />
                  </div>
                  <Button variant="destructive" disabled={!matches || busy !== null} onClick={wipe}>
                    {busy === "erase" ? <Spinner /> : <Trash2 />} Excluir os dados
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Privacy() {
  return (
    <>
      <PageHeader title="Privacidade (LGPD)" description="A política de privacidade do site e os pedidos de titulares: exportar e excluir dados." />
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Policy />
        <Titular />
      </div>
    </>
  );
}
