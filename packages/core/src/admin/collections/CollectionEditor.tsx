/**
 * Editor de um item de coleção (post, projeto, serviço…): formulário gerado do schema de
 * campos, textos por idioma com o que falta traduzir, validação por campo, rascunho e
 * publicado, endereço estável, SEO com prévia do Google e lixeira.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Save, Trash2, Undo2 } from "lucide-react";
import { validateFields, type FieldError } from "../../blocks/fields";
import type { SeoFields } from "../../content/types";
import { isValidSlug } from "../../convex/lib/slug";
import { localizedPath, type Localized } from "../../i18n";
import { api, type CollectionDoc } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { EditorLocaleProvider, FieldsForm } from "../editor/fields";
import { errorMessage, missingLocales, missingTranslations, prune, sameDraft, type Values } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { formatDate, textIn } from "../lib/format";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Alert, Badge, Spinner } from "../ui/form";
import { Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { itemImage, type CollectionConfig } from "./config";
import { allTags, planCreate, planUpdate, suggestSlug } from "./model";
import { EditingLocaleBar, Section, SeoPanel, SlugPanel, TagsInput } from "./parts";
import { PlanCheckout, PlanPrice } from "./PlanExtras";

const SHELL_KEYS = ["tags", "featured", "seo", "priceCents", "currency"];

/** Valores iniciais de um item novo (selects com padrão já escolhido). */
export function initialForm(config: CollectionConfig): Values {
  const out: Values = {};
  for (const [key, def] of Object.entries(config.fields)) if (def.kind === "select" && def.default) out[key] = def.default;
  if (config.name === "plans") out.currency = "BRL";
  return out;
}

export function docToForm(config: CollectionConfig, doc: CollectionDoc): Values {
  const base = (config.toForm ? config.toForm(doc) : { ...doc }) as Values;
  const keys = [...Object.keys(config.fields), ...SHELL_KEYS, ...config.docKeys, "slug"];
  const out: Values = {};
  for (const key of new Set(keys)) if (base[key] !== undefined) out[key] = base[key];
  // Campos do formulário que não são do documento (gallery já vira lista de { image }).
  return prune(structuredClone(out));
}

function fieldValues(config: CollectionConfig, form: Values): Values {
  const out: Values = {};
  for (const key of Object.keys(config.fields)) if (form[key] !== undefined) out[key] = form[key];
  return out;
}

/** Erros do formulário (campos do schema + endereço). */
export function formErrors(config: CollectionConfig, form: Values): { fields: FieldError[]; slug?: string } {
  const fields = validateFields(config.fields, fieldValues(config, form));
  const slug = typeof form.slug === "string" && form.slug && !isValidSlug(form.slug) ? "Endereço inválido: use letras minúsculas sem acento, números, hífen e sublinhado." : undefined;
  return { fields, slug };
}

function Editor({ config, doc }: { config: CollectionConfig; doc?: CollectionDoc }) {
  const panel = usePanel();
  const { navigate, block } = useRouter();
  const col = api.collection(config.name);
  const create = useMutation(col.create);
  const update = useMutation(col.update);
  const publish = useMutation(col.publish);
  const unpublish = useMutation(col.unpublish);
  const remove = useMutation(col.remove);
  const siblings = useQuery(col.list, {});

  const start = useMemo(() => (doc ? docToForm(config, doc) : initialForm(config)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [base, setBase] = useState<Values>(start);
  const [draft, setDraft] = useState<Values>(start);
  const [locale, setLocale] = useState(panel.locales.default);
  const [errors, setErrors] = useState<{ fields: FieldError[]; slug?: string }>({ fields: [] });
  const [busy, setBusy] = useState<"save" | "publish" | "trash" | null>(null);
  const [tab, setTab] = useState("content");

  const isNew = !doc;
  const published = doc?.published ?? false;
  const dirty = !sameDraft(draft, base);
  const set = useCallback((key: string, value: unknown) => setDraft((d) => (value === undefined || value === "" ? (({ [key]: _, ...rest }) => (void _, rest))(d) : { ...d, [key]: value })), []);

  // Mudança vinda de fora (outra aba, outra pessoa, o link de pagamento): sem edição local, acompanha.
  useEffect(() => {
    if (!doc || dirty) return;
    const fresh = docToForm(config, doc);
    if (!sameDraft(fresh, base)) {
      setBase(fresh);
      setDraft(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  useEffect(() => (dirty ? block(`Há mudanças não salvas neste ${config.singular}. Sair mesmo assim?`) : undefined), [dirty, block, config.singular]);

  const fieldVals = useMemo(() => fieldValues(config, draft), [config, draft]);
  const missing = useMemo(() => missingTranslations(config.fields, fieldVals, panel.locales.locales), [config, fieldVals, panel.locales.locales]);
  const missingIn = missingLocales(missing);
  const label = config.label(docToDoc(config, draft), locale, panel.locales.default);
  const tagSuggestions = useMemo(() => allTags((siblings ?? []) as never), [siblings]);

  const save = useCallback(async (): Promise<boolean> => {
    const found = formErrors(config, draft);
    if (found.fields.length || found.slug) {
      setErrors(found);
      setTab("content");
      toast.error(`O ${config.singular} tem campos a corrigir.`);
      requestAnimationFrame(() => document.querySelector("[role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return false;
    }
    setBusy("save");
    try {
      const next = prune(config.fromForm ? config.fromForm(draft) : draft);
      const slug = typeof draft.slug === "string" && draft.slug ? draft.slug : undefined;
      if (isNew) {
        const id = await create({ ...planCreate(next, config.docKeys), ...(slug ? { slug } : {}), published: config.defaultPublished });
        setErrors({ fields: [] });
        setBase(draft);
        toast.success(`${cap(config.singular)} criad${config.feminine ? "a" : "o"}.`);
        navigate(`${config.base}?id=${id}`, { replace: true, force: true });
        return true;
      }
      const before = prune(config.fromForm ? config.fromForm(base) : base);
      const plan = planUpdate(before, next, config.docKeys, config.required);
      if (slug && slug !== doc!.slug) plan.patch.slug = slug;
      if (!Object.keys(plan.patch).length && !plan.unset.length) {
        setBase(draft);
        return true;
      }
      await update({ id: doc!._id, patch: plan.patch, ...(plan.unset.length ? { unset: plan.unset } : {}) });
      setErrors({ fields: [] });
      setBase(draft);
      toast.success("Salvo.");
      return true;
    } catch (e) {
      const message = errorMessage(e);
      if (/slug|endereço/i.test(message)) {
        setErrors({ fields: [], slug: message });
        setTab("seo");
      }
      toast.error(message);
      return false;
    } finally {
      setBusy(null);
    }
  }, [config, draft, base, doc, isNew, create, update, navigate]);

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
    if (!doc) return;
    if (dirty && !published && !(await save())) return;
    setBusy("publish");
    try {
      if (published) await unpublish({ id: doc._id });
      else await publish({ id: doc._id });
      toast.success(published ? "Despublicado: sai do site na próxima publicação." : "Publicado: entra no site na próxima publicação.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function trash() {
    if (!doc || !window.confirm(`Mandar “${label}” para a lixeira? ${config.trashNote}`)) return;
    setBusy("trash");
    try {
      await remove({ id: doc._id });
      toast.success("Na lixeira.");
      navigate(config.base, { force: true });
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(null);
    }
  }

  const localeValue = useMemo(
    () => ({ locale, setLocale, locales: panel.locales.locales, defaultLocale: panel.locales.default, translation: panel.enabled.has("translation") }),
    [locale, panel.locales, panel.enabled],
  );

  const detailBase = config.name === "posts" ? (panel.settings?.paths?.posts ?? "/blog") : (panel.settings?.paths?.projects ?? "/portfolio");
  const siteUrl = panel.settings?.url ?? "";
  const siteName = panel.settings ? textIn(panel.settings.name, panel.locales.default, panel.locales.default) : "";
  const slugValue = typeof draft.slug === "string" ? draft.slug : "";
  const seo = draft.seo as SeoFields | undefined;
  const hasSeoTab = !!(config.slug || config.seo);
  const fieldErrors = errors.fields;

  return (
    <EditorLocaleProvider value={localeValue}>
      <div className="flex h-full min-w-0 flex-col">
        <PageHeader
          title={isNew ? `${config.feminine ? "Nova" : "Novo"} ${config.singular}` : label}
          description={
            <span className="flex flex-wrap items-center gap-2">
              {!isNew && <Badge variant={published ? "success" : "secondary"}>{published ? "publicado" : "rascunho"}</Badge>}
              {isNew && <Badge variant="secondary">ainda não salvo</Badge>}
              {config.name === "posts" && typeof doc?.publishedAt === "number" && <span>primeira publicação em {formatDate(doc.publishedAt)}</span>}
              {dirty && <Badge variant="warning">mudanças não salvas</Badge>}
              {missingIn.length > 0 && <Badge variant="warning">falta traduzir: {missingIn.join(", ")}</Badge>}
            </span>
          }
          actions={
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to={config.base}>
                  <ArrowLeft /> {config.title}
                </Link>
              </Button>
              {dirty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm("Descartar as mudanças não salvas?")) {
                      setDraft(base);
                      setErrors({ fields: [] });
                    }
                  }}
                >
                  <Undo2 /> Descartar
                </Button>
              )}
              {!isNew && (
                <>
                  <Button variant="ghost" size="sm" onClick={trash} disabled={!!busy}>
                    <Trash2 /> Lixeira
                  </Button>
                  <Button variant="outline" size="sm" onClick={togglePublished} disabled={!!busy}>
                    {busy === "publish" ? <Spinner /> : published ? <EyeOff /> : <Eye />} {published ? "Despublicar" : "Publicar"}
                  </Button>
                </>
              )}
              <Button size="sm" onClick={() => void save()} disabled={(!dirty && !isNew) || !!busy} title="Ctrl+S">
                {busy === "save" ? <Spinner /> : <Save />} {isNew ? "Criar" : "Salvar"}
              </Button>
            </>
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            <EditingLocaleBar missingIn={missingIn} />
            <Tabs value={tab} onValueChange={setTab}>
              {hasSeoTab && (
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="content" className={cn(fieldErrors.length > 0 && "text-destructive")}>
                    Conteúdo
                  </TabsTrigger>
                  <TabsTrigger value="seo" className={cn(errors.slug && "text-destructive")}>
                    Endereço e SEO
                  </TabsTrigger>
                </TabsList>
              )}
              <TabsContent value="content" className="space-y-4">
                {config.name === "plans" && <PlanPrice form={draft} set={set} />}
                <Section title="Conteúdo">
                  <FieldsForm fields={config.fields} values={fieldVals} errors={fieldErrors} missing={missing} onChange={(values) => {
                      // O erro de um campo some quando a pessoa mexe nele; a próxima tentativa de salvar confere de novo.
                      const touched = Object.keys(config.fields).filter((k) => !sameDraft(fieldVals[k], values[k]));
                      if (touched.length) setErrors((e) => ({ ...e, fields: e.fields.filter((err) => !touched.some((k) => err.path === k || err.path.startsWith(`${k}.`))) }));
                      setDraft((d) => ({ ...omit(d, Object.keys(config.fields)), ...values }));
                    }} />
                </Section>
                {config.name === "plans" && <PlanCheckout doc={doc} form={draft} dirty={dirty} />}
                {(config.tags || config.featured) && (
                  <Section title="Organização">
                    {config.tags && <TagsInput value={(draft.tags as string[] | undefined) ?? []} onChange={(tags) => set("tags", tags.length ? tags : undefined)} suggestions={tagSuggestions} />}
                    {config.featured && (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <label htmlFor="featured" className="text-sm font-medium">
                            Em destaque
                          </label>
                          <p className="text-xs text-muted-foreground">Blocos que mostram só os destaques escolhem estes {config.plural}.</p>
                        </div>
                        <Switch id="featured" checked={draft.featured === true} onCheckedChange={(v) => set("featured", v || undefined)} />
                      </div>
                    )}
                  </Section>
                )}
              </TabsContent>
              {hasSeoTab && (
                <TabsContent value="seo" className="space-y-4">
                  {config.slug && (
                    <Section title="Endereço" description="O link deste item no site. Fica igual mesmo que você mude o título.">
                      <SlugPanel
                        prefix={`${detailBase}/`}
                        value={slugValue}
                        saved={doc?.slug as string | undefined}
                        suggested={suggestSlug(draft.title as Localized<string> | undefined, panel.locales.default)}
                        published={published}
                        error={errors.slug}
                        onChange={(slug) => {
                          set("slug", slug || undefined);
                          if (errors.slug) setErrors((e) => ({ ...e, slug: undefined }));
                        }}
                      />
                    </Section>
                  )}
                  {config.seo && (
                    <Section title="SEO" description="Como o item aparece no Google e ao ser compartilhado.">
                      <SeoPanel
                        seo={seo}
                        onChange={(value) => set("seo", value)}
                        fallbackTitle={(draft.title as Localized<string>) ?? undefined}
                        fallbackDescription={(draft.excerpt ?? draft.summary) as Localized<string> | undefined}
                        fallbackImage={itemImage(config, draft)}
                        siteName={siteName}
                        url={(l) => `${siteUrl}${localizedPath(`${detailBase}/${slugValue || (doc?.slug as string | undefined) || suggestSlug(draft.title as Localized<string>, panel.locales.default) || "…"}`, l, panel.locales)}`}
                      />
                    </Section>
                  )}
                </TabsContent>
              )}
            </Tabs>
            {isNew && config.defaultPublished === false && (
              <Alert>
                <p>O {config.singular} nasce como rascunho: só entra no site depois de você publicar e de o site ser publicado.</p>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </EditorLocaleProvider>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const omit = (values: Values, keys: string[]): Values => {
  const out = { ...values };
  for (const k of keys) delete out[k];
  return out;
};
function docToDoc(config: CollectionConfig, form: Values): Record<string, unknown> {
  return config.fromForm ? config.fromForm(form) : form;
}

export function CollectionEditor({ config }: { config: CollectionConfig }) {
  const { search } = useRouter();
  const id = search.get("id");
  const doc = useQuery(api.collection(config.name).get, id ? { id } : "skip");
  if (!id) return <Editor key="novo" config={config} />;
  if (doc === undefined) return <Loading />;
  if (doc === null) {
    return (
      <Alert variant="warning" className="m-6">
        Não encontrado.{" "}
        <Link to={config.base} className="underline">
          Voltar para {config.title.toLowerCase()}
        </Link>
      </Alert>
    );
  }
  if (doc.deletedAt !== undefined) {
    return (
      <Alert variant="warning" className="m-6">
        Este {config.singular} está na lixeira.{" "}
        <Link to={config.base} className="underline">
          Voltar para {config.title.toLowerCase()}
        </Link>
      </Alert>
    );
  }
  return <Editor key={doc._id} config={config} doc={doc} />;
}
