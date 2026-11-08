/**
 * Editor de uma página (decisões 5, 17, 23): blocos, título, caminho e SEO, com prévia
 * ao vivo. Salvar valida antes no backend (`panel.validatePage`) para apontar o campo
 * com erro; publicar/despublicar muda só o estado da página.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock, Save, Send, Undo2 } from "lucide-react";
import { field, type FieldError } from "../../blocks/fields";
import type { BlockInstance, PageRecord } from "../../content/types";
import { localizedPath, pick, type Locale } from "../../i18n";
import { api, type PageDoc } from "../data/api";
import { useMutation, useQuery, useQueryOnce } from "../data/backend";
import { Loading } from "../App";
import { PageHeader } from "../Layout";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Alert, Badge, Input, Label, Spinner } from "../ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BlockCatalog, BlockList } from "./BlockList";
import { EditorLocaleProvider, FieldsForm, LinkSuggestions } from "./fields";
import { duplicateBlock, errorMessage, missingTranslations, newBlock, parseBlockErrors, prune, sameDraft, type BlockError, type PageDraft } from "./model";
import { PreviewPane } from "./PreviewPane";

const TITLE_FIELDS = { title: field.text({ label: "Título da página", required: true, maxLength: 120, help: "A página só existe nos idiomas em que tem título." }) };
const SEO_FIELDS = {
  title: field.text({ label: "Título para buscadores", maxLength: 70, help: "Vazio usa o título da página." }),
  description: field.text({ label: "Descrição para buscadores", multiline: true, maxLength: 170 }),
  image: field.image({ label: "Imagem de compartilhamento", help: "Vazio usa a imagem padrão do site." }),
  noindex: field.boolean({ label: "Esconder dos buscadores (noindex)", default: false }),
};

function toDraft(page: PageDoc): PageDraft {
  const draft: PageDraft = { id: page._id, path: page.path, title: page.title, blocks: page.blocks, published: page.published, updatedAt: page.updatedAt };
  if (page.seo) draft.seo = page.seo;
  if (page.system) draft.system = true;
  return structuredClone(draft);
}

function toRecord(d: PageDraft): PageRecord {
  return { id: d.id, path: d.path, title: d.title, ...(d.seo ? { seo: d.seo } : {}), blocks: d.blocks, published: d.published, updatedAt: d.updatedAt, ...(d.system ? { system: true } : {}) };
}

interface Errors {
  blocks: BlockError[];
  path?: string;
  title?: string;
}

function Editor({ page }: { page: PageDoc }) {
  const panel = usePanel();
  const { block: blockNavigation } = useRouter();
  const snapshot = useQuery(api.site.snapshot, {});
  const pages = useQuery(api.pages.list, {});
  const update = useMutation(api.pages.update);
  const publish = useMutation(api.pages.publish);
  const unpublish = useMutation(api.pages.unpublish);
  const validate = useQueryOnce();

  const [base, setBase] = useState(() => toDraft(page));
  const [draft, setDraft] = useState(() => toDraft(page));
  const [selected, setSelected] = useState<string | undefined>(page.blocks[0]?.id);
  const [locale, setLocale] = useState<Locale>(panel.locales.default);
  const [errors, setErrors] = useState<Errors>({ blocks: [] });
  const [catalog, setCatalog] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [tab, setTab] = useState("blocks");

  const dirty = !sameDraft({ ...draft, published: base.published, updatedAt: 0 }, { ...base, updatedAt: 0 });
  const changedElsewhere = page.updatedAt !== base.updatedAt;

  // Atualização de fora (outra aba, outra pessoa): sem mudanças locais, acompanha.
  useEffect(() => {
    if (page.updatedAt === base.updatedAt && page.published === base.published) return;
    if (!dirty) {
      setBase(toDraft(page));
      setDraft(toDraft(page));
    } else {
      setBase((b) => ({ ...b, published: page.published }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => (dirty ? blockNavigation("Há mudanças não salvas nesta página. Sair mesmo assim?") : undefined), [dirty, blockNavigation]);

  const setBlocks = useCallback((blocks: BlockInstance[]) => {
    setDraft((d) => {
      // Erros do bloco que a pessoa mexeu saem: a próxima tentativa de salvar confere de novo.
      const changed = new Set(blocks.filter((b) => !d.blocks.includes(b)).map((b) => b.id));
      if (changed.size) setErrors((e) => (e.blocks.some((x) => x.blockId && changed.has(x.blockId)) ? { ...e, blocks: e.blocks.filter((x) => !x.blockId || !changed.has(x.blockId)) } : e));
      return { ...d, blocks };
    });
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    setBusy("save");
    try {
      const blocks = prune(draft.blocks);
      const check = await validate(api.panel.validatePage, { blocks, path: draft.path, title: draft.title, pageId: draft.id });
      if (check.blockErrors.length || check.pathError || check.titleError) {
        setErrors({ blocks: check.blockErrors, path: check.pathError, title: check.titleError });
        const first = check.blockErrors[0];
        if (first) {
          setTab("blocks");
          setSelected(first.blockId ?? draft.blocks[first.index]?.id);
        } else setTab("page");
        toast.error("A página tem campos a corrigir.");
        return false;
      }
      const seo = draft.seo && Object.keys(prune(draft.seo)).length ? prune(draft.seo) : undefined;
      await update({
        id: draft.id,
        title: draft.title,
        blocks,
        ...(draft.path !== base.path ? { path: draft.path } : {}),
        ...(seo ? { seo } : base.seo ? { clearSeo: true } : {}),
      });
      setErrors({ blocks: [] });
      setBase({ ...draft, blocks, seo, updatedAt: page.updatedAt });
      toast.success("Página salva.");
      return true;
    } catch (e) {
      const parsed = parseBlockErrors(e instanceof Error ? e.message : String(e));
      if (parsed.length) setErrors({ blocks: parsed });
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(null);
    }
  }, [draft, base, page.updatedAt, update, validate]);

  // Depois de salvar, a query devolve o updatedAt novo: guarda como base.
  useEffect(() => {
    if (!dirty && page.updatedAt !== base.updatedAt) setBase((b) => ({ ...b, updatedAt: page.updatedAt }));
  }, [dirty, page.updatedAt, base.updatedAt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !busy) void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, busy, save]);

  async function togglePublished() {
    if (dirty && !base.published && !(await save())) return;
    setBusy("publish");
    try {
      if (base.published) await unpublish({ id: draft.id });
      else await publish({ id: draft.id });
      setBase((b) => ({ ...b, published: !b.published }));
      setDraft((d) => ({ ...d, published: !base.published }));
      toast.success(base.published ? "Página despublicada: sai do site na próxima publicação." : "Página publicada: entra no site na próxima publicação.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const titleMissing = missingTranslations(TITLE_FIELDS, { title: draft.title }, panel.locales.locales);
  const pageErrors: FieldError[] = [...(errors.title ? [{ path: "title", message: errors.title }] : [])];
  const record = useMemo(() => toRecord(draft), [draft]);
  const name = pick(draft.title, locale) ?? pick(draft.title, panel.locales.default) ?? draft.path;
  const suggestions = useMemo(() => (pages ?? []).map((p) => p.path), [pages]);
  const existsIn = panel.locales.locales.filter((l) => pick(draft.title, l));

  const localeValue = useMemo(
    () => ({ locale, setLocale, locales: panel.locales.locales, defaultLocale: panel.locales.default, translation: panel.enabled.has("translation") }),
    [locale, panel.locales, panel.enabled],
  );

  return (
    <EditorLocaleProvider value={localeValue}>
      <LinkSuggestions.Provider value={suggestions}>
        <div className="flex h-full min-w-0 flex-col">
          <PageHeader
            title={name}
            description={
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-mono">{localizedPath(draft.path, locale, panel.locales)}</span>
                <Badge variant={base.published ? "success" : "secondary"}>{base.published ? "publicada" : "rascunho"}</Badge>
                {draft.system && (
                  <Badge variant="outline">
                    <Lock /> sistema
                  </Badge>
                )}
                {dirty && <Badge variant="warning">mudanças não salvas</Badge>}
              </span>
            }
            actions={
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin/paginas">
                    <ArrowLeft /> Páginas
                  </Link>
                </Button>
                {dirty && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Descartar as mudanças não salvas?")) {
                        setDraft(base);
                        setErrors({ blocks: [] });
                      }
                    }}
                  >
                    <Undo2 /> Descartar
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={togglePublished} disabled={!!busy}>
                  {busy === "publish" ? <Spinner /> : <Send />} {base.published ? "Despublicar" : "Publicar"}
                </Button>
                <Button size="sm" onClick={() => void save()} disabled={!dirty || !!busy} title="Ctrl+S">
                  {busy === "save" ? <Spinner /> : <Save />} Salvar
                </Button>
              </>
            }
          />
          {changedElsewhere && dirty && (
            <Alert variant="warning" className="m-3 mb-0">
              A página foi alterada em outro lugar depois que você começou. Salvar sobrescreve aquela versão.
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setBase(toDraft(page));
                  setDraft(toDraft(page));
                }}
              >
                Carregar a versão nova
              </Button>
            </Alert>
          )}
          <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(380px,460px)_minmax(0,1fr)]">
            <div className="min-h-0 overflow-y-auto border-r p-4">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="blocks">Blocos ({draft.blocks.length})</TabsTrigger>
                  <TabsTrigger value="page" className={cn((errors.path || errors.title) && "text-destructive")}>
                    Página e SEO
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="blocks">
                  <BlockList
                    blocks={draft.blocks}
                    onChange={setBlocks}
                    selected={selected}
                    onSelect={setSelected}
                    errors={errors.blocks}
                    onAdd={() => setCatalog(true)}
                    onDuplicate={(i) => {
                      const copy = duplicateBlock(draft.blocks[i]!, draft.blocks.map((b) => b.id));
                      const next = [...draft.blocks];
                      next.splice(i + 1, 0, copy);
                      setBlocks(next);
                      setSelected(copy.id);
                    }}
                  />
                </TabsContent>
                <TabsContent value="page" className="space-y-5">
                  <FieldsForm fields={TITLE_FIELDS} values={{ title: draft.title }} errors={pageErrors} missing={titleMissing} onChange={(v) => setDraft((d) => ({ ...d, title: (v.title as PageDraft["title"]) ?? {} }))} />
                  <p className="text-xs text-muted-foreground">
                    Existe em: {existsIn.length ? existsIn.join(", ") : "nenhum idioma"}
                    {existsIn.length < panel.locales.locales.length && ` · não existe em ${panel.locales.locales.filter((l) => !existsIn.includes(l)).join(", ")}`}
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="page-path">Caminho</Label>
                    <Input
                      id="page-path"
                      value={draft.path}
                      disabled={draft.system}
                      aria-invalid={!!errors.path || undefined}
                      onChange={(e) => setDraft((d) => ({ ...d, path: e.target.value }))}
                    />
                    {draft.system && <p className="text-xs text-muted-foreground">O caminho de uma página do sistema não muda.</p>}
                    {errors.path && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.path}
                      </p>
                    )}
                  </div>
                  <fieldset className="space-y-4 rounded-md border p-3">
                    <legend className="px-1 text-sm font-medium">SEO</legend>
                    <FieldsForm
                      fields={SEO_FIELDS}
                      values={(draft.seo ?? {}) as Record<string, unknown>}
                      missing={missingTranslations(SEO_FIELDS, draft.seo as Record<string, unknown>, panel.locales.locales)}
                      onChange={(seo) => setDraft((d) => ({ ...d, seo: Object.keys(seo).length ? (seo as PageDraft["seo"]) : undefined }))}
                    />
                  </fieldset>
                </TabsContent>
              </Tabs>
            </div>
            <PreviewPane
              className="hidden min-h-0 min-w-0 lg:flex"
              snapshot={snapshot}
              page={record}
              locale={locale}
              locales={panel.locales.locales}
              onLocale={setLocale}
              selected={selected}
              onSelect={(id) => {
                setTab("blocks");
                setSelected(id);
                requestAnimationFrame(() => document.querySelector(`[data-block-id="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
              }}
            />
          </div>
        </div>
        {catalog && (
          <BlockCatalog
            onClose={() => setCatalog(false)}
            onPick={(def) => {
              const block = newBlock(def, draft.blocks.map((b) => b.id));
              const at = selected ? draft.blocks.findIndex((b) => b.id === selected) + 1 : draft.blocks.length;
              const next = [...draft.blocks];
              next.splice(at || draft.blocks.length, 0, block);
              setBlocks(next);
              setSelected(block.id);
              setCatalog(false);
            }}
          />
        )}
      </LinkSuggestions.Provider>
    </EditorLocaleProvider>
  );
}

export default function PageEditor() {
  const { search } = useRouter();
  const id = search.get("id");
  const page = useQuery(api.pages.get, id ? { id } : "skip");
  if (!id) return <Alert className="m-6">Escolha uma página na lista de páginas.</Alert>;
  if (page === undefined) return <Loading />;
  if (page === null || page.deletedAt !== undefined) {
    return (
      <Alert variant="warning" className="m-6">
        Página não encontrada (pode ter ido para a lixeira).{" "}
        <Link to="/admin/paginas" className="underline">
          Ver as páginas
        </Link>
      </Alert>
    );
  }
  return <Editor key={page._id} page={page} />;
}
