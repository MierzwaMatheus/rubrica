/** Páginas: as do sistema (ponto de partida) e as livres, com criação de página nova. */
import { useState, type FormEvent } from "react";
import { FilePen, Lock, Plus, Trash2 } from "lucide-react";
import { localePrefix, pick } from "../../i18n";
import { api, type PageDoc } from "../data/api";
import { useMutation, useQuery, useQueryOnce } from "../data/backend";
import { errorMessage } from "../editor/model";
import { EditorLocaleProvider, LocaleTabs, LocalizedTextInput } from "../editor/fields";
import { PageHeader } from "../Layout";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { localeName, usePanel } from "../panel";
import { Loading } from "../App";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Badge, Input, Label, Spinner } from "../ui/form";
import type { Localized } from "../../i18n";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function NewPageDialog({ onClose }: { onClose: () => void }) {
  const panel = usePanel();
  const { navigate } = useRouter();
  const create = useMutation(api.pages.create);
  const validate = useQueryOnce();
  const [locale, setLocale] = useState(panel.locales.default);
  const [title, setTitle] = useState<Localized<string> | undefined>();
  const [path, setPath] = useState("");
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<{ path?: string; title?: string; other?: string }>({});
  const [busy, setBusy] = useState(false);

  const suggested = `/${slugify(title?.[panel.locales.default] ?? Object.values(title ?? {})[0] ?? "")}`;
  const finalPath = touched ? path : suggested === "/" ? "" : suggested;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const check = await validate(api.panel.validatePage, { blocks: [], path: finalPath, title: title ?? {} });
      if (check.pathError || check.titleError || !title) {
        setErrors({ path: check.pathError, title: check.titleError ?? (!title ? "Preencha o título em pelo menos um idioma" : undefined) });
        return;
      }
      const id = await create({ path: finalPath, title });
      toast.success("Página criada como rascunho.");
      navigate(`/admin/paginas/editar?id=${id}`);
    } catch (err) {
      setErrors({ other: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova página</DialogTitle>
          <DialogDescription>A página nasce como rascunho e sem blocos. Ela existe em cada idioma em que tiver título.</DialogDescription>
        </DialogHeader>
        <EditorLocaleProvider value={{ locale, setLocale, locales: panel.locales.locales, defaultLocale: panel.locales.default, translation: false }}>
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="new-page-title">Título</Label>
                <LocaleTabs value={title} label="título" />
              </div>
              <LocalizedTextInput id="new-page-title" value={title} onChange={setTitle} invalid={!!errors.title} />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-page-path">Caminho</Label>
              <Input
                id="new-page-path"
                value={finalPath}
                placeholder="/servicos"
                aria-invalid={!!errors.path || undefined}
                onChange={(e) => {
                  setTouched(true);
                  setPath(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Sem o idioma: a mesma página fica em {panel.locales.locales.filter((l) => l !== panel.locales.default).map((l) => `/${localePrefix(l, panel.locales)}${finalPath || "/…"}`).join(", ") || "um endereço só"}.
              </p>
              {errors.path && <p className="text-xs text-destructive">{errors.path}</p>}
            </div>
            {errors.other && <Alert variant="destructive">{errors.other}</Alert>}
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner /> : <Plus />} Criar página
              </Button>
            </DialogFooter>
          </form>
        </EditorLocaleProvider>
      </DialogContent>
    </Dialog>
  );
}

function PageRow({ page }: { page: PageDoc }) {
  const panel = usePanel();
  const remove = useMutation(api.pages.remove);
  const title = pick(page.title, panel.locales.default) ?? Object.values(page.title)[0] ?? page.path;
  const missing = panel.locales.locales.filter((l) => !pick(page.title, l));
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link to={`/admin/paginas/editar?id=${page._id}`} className="font-medium hover:underline">
          {title}
        </Link>
        <p className="font-mono text-xs text-muted-foreground">{page.path}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {page.system && (
          <Badge variant="outline" title="Página do ponto de partida: pode ser editada, não apagada">
            <Lock /> sistema
          </Badge>
        )}
        <Badge variant={page.published ? "success" : "secondary"}>{page.published ? "publicada" : "rascunho"}</Badge>
        {missing.length > 0 && missing.length < panel.locales.locales.length && (
          <Badge variant="warning" title={`Sem título em: ${missing.map(localeName).join(", ")}`}>
            sem {missing.join(", ")}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">{page.blocks.length} {page.blocks.length === 1 ? "bloco" : "blocos"}</span>
      </div>
      <div className="flex gap-1">
        <Button asChild size="sm" variant="outline">
          <Link to={`/admin/paginas/editar?id=${page._id}`}>
            <FilePen /> Editar
          </Link>
        </Button>
        {!page.system && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Apagar ${title}`}
            onClick={async () => {
              if (!window.confirm(`Mandar “${title}” para a lixeira? O site deixa de mostrar a página na próxima publicação.`)) return;
              try {
                await remove({ id: page._id });
                toast.success("Página na lixeira.");
              } catch (e) {
                toast.error(errorMessage(e));
              }
            }}
          >
            <Trash2 />
          </Button>
        )}
      </div>
    </li>
  );
}

export default function Pages() {
  const pages = useQuery(api.pages.list, {});
  const [creating, setCreating] = useState(false);
  const system = pages?.filter((p) => p.system) ?? [];
  const free = pages?.filter((p) => !p.system) ?? [];
  return (
    <>
      <PageHeader
        title="Páginas"
        description="Cada página é uma lista de blocos. As do sistema vêm do ponto de partida do site; as livres você cria."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Nova página
          </Button>
        }
      />
      {pages === undefined ? (
        <Loading />
      ) : (
        <div className="space-y-6 p-6">
          {[
            { label: "Páginas do sistema", list: system },
            { label: "Páginas livres", list: free },
          ].map((section) => (
            <section key={section.label} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">{section.label}</h2>
              {section.list.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma ainda.</p>
              ) : (
                <ul className="divide-y rounded-lg border bg-card">
                  {section.list.map((p) => (
                    <PageRow key={p._id} page={p} />
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {creating && <NewPageDialog onClose={() => setCreating(false)} />}
    </>
  );
}
