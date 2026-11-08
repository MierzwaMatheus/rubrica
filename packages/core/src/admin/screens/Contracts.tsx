/** Modelos de contrato: lista, padrão e editor do texto com as variáveis que a proposta preenche. */
import { useRef, useState } from "react";
import { Plus, Save, Star, Trash2 } from "lucide-react";
import { api, type ContractTemplate } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { CONTRACT_VARIABLES, formatDate, templateVariables, unknownVariables } from "../lib/format";
import { toast } from "../lib/toast";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Badge, Input, Label, Spinner, Textarea } from "../ui/form";

function TemplateDialog({ template, onClose }: { template?: ContractTemplate; onClose: () => void }) {
  const create = useMutation(api.contractTemplates.create);
  const update = useMutation(api.contractTemplates.update);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const area = useRef<HTMLTextAreaElement>(null);
  const unknown = unknownVariables(content);

  const insert = (variable: string) => {
    const el = area.current;
    const text = `{{${variable}}}`;
    if (!el) return setContent(content + text);
    const { selectionStart: a, selectionEnd: b } = el;
    setContent(content.slice(0, a) + text + content.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + text.length, a + text.length);
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? `Editar “${template.name}”` : "Novo modelo de contrato"}</DialogTitle>
          <DialogDescription>
            Texto em Markdown. As variáveis entre chaves duplas são preenchidas com os dados da proposta quando o cliente aceita. Editar não muda contratos de propostas já aceitas.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return setError("Dê um nome ao modelo.");
            if (!content.trim()) return setError("Escreva o texto do contrato.");
            setBusy(true);
            setError(undefined);
            try {
              if (template) await update({ id: template._id, name, description, content });
              else await create({ name, ...(description ? { description } : {}), content });
              toast.success("Modelo salvo.");
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
              <Label htmlFor="tpl-name">Nome</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Descrição</Label>
              <Input id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-content">Texto do contrato</Label>
            <Textarea id="tpl-content" ref={area} rows={14} className="font-mono text-xs" value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Inserir variável</p>
            <div className="flex flex-wrap gap-1">
              {CONTRACT_VARIABLES.map((v) => (
                <Button key={v.name} type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" title={v.label} onClick={() => insert(v.name)}>
                  {v.name}
                </Button>
              ))}
            </div>
          </div>
          {unknown.length > 0 && (
            <Alert variant="warning">
              <p>Variáveis que o contrato não conhece (ficam sem preencher): {unknown.map((v) => `{{${v}}}`).join(", ")}.</p>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">{templateVariables(content).length} variáveis usadas.</p>
          {error && <Alert variant="destructive">{error}</Alert>}
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Spinner /> : <Save />} Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Contracts() {
  const templates = useQuery(api.contractTemplates.list, {});
  const setDefault = useMutation(api.contractTemplates.setDefault);
  const remove = useMutation(api.contractTemplates.remove);
  const [editing, setEditing] = useState<ContractTemplate | "new">();
  const run = (fn: () => Promise<unknown>, ok: string) => fn().then(() => toast.success(ok), (e) => toast.error(errorMessage(e)));
  return (
    <>
      <PageHeader
        title="Contratos"
        description="Modelos de contrato usados nas propostas. O padrão vale quando a proposta não escolhe um."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus /> Novo modelo
          </Button>
        }
      />
      <div className="p-6">
        {templates === undefined ? (
          <Loading />
        ) : templates.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum modelo ainda. Crie o primeiro: ele vira o padrão.</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card" aria-label="Modelos de contrato">
            {templates.map((t) => (
              <li key={t._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <button type="button" className="cursor-pointer font-medium hover:underline" onClick={() => setEditing(t)}>
                    {t.name}
                  </button>
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    {templateVariables(t.content).length} variáveis · editado em {formatDate(t.updatedAt)}
                  </p>
                </div>
                {t.isDefault ? (
                  <Badge variant="success">
                    <Star /> padrão
                  </Badge>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => run(() => setDefault({ id: t._id }), `“${t.name}” é o modelo padrão.`)}>
                    <Star /> Tornar padrão
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                  Editar
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Apagar ${t.name}`}
                  onClick={() => window.confirm(`Apagar o modelo “${t.name}”? As propostas abertas que o usavam passam a usar o padrão.`) && run(() => remove({ id: t._id }), "Modelo apagado.")}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <TemplateDialog template={editing === "new" ? undefined : editing} onClose={() => setEditing(undefined)} />}
    </>
  );
}
