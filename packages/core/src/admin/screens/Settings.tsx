/**
 * Configurações do site: identidade, ícones e cor da barra do navegador, faixa de aviso e
 * WhatsApp (com prévia), blog (RSS e capa padrão), analytics, navegação, redes, pessoa ou
 * empresa e, só para a
 * agência (root), a parte técnica (tipo do site, URL, idiomas e principal, caminhos).
 * Os formulários saem do mesmo gerador de campos dos blocos. Salvar manda só as
 * chaves que mudaram (o backend recusa chave técnica vinda de quem não é root).
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Star, Trash2, Undo2 } from "lucide-react";
import { field, type FieldMap } from "../../blocks/fields";
import type { Announcement, Organization, PageRecord, SiteSettings, WhatsAppSettings } from "../../content/types";
import { defineLocales, localePrefix } from "../../i18n";
import { api } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { PreviewPane } from "../editor/PreviewPane";
import { announcementActive, announcementTime } from "../../render/sitewide";
import { EditorLocaleProvider, FieldsForm } from "../editor/fields";
import { errorMessage, missingTranslations, moveItem, prune, sameDraft, type Values } from "../editor/model";
import { defaultPathsFor } from "../../render/collections";
import { PageHeader } from "../Layout";
import { useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { localeName, usePanel } from "../panel";
import { Button } from "../ui/button";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, NativeSelect, Spinner } from "../ui/form";

const IDENTITY: FieldMap = {
  name: field.text({ label: "Nome do site", required: true, maxLength: 80 }),
  description: field.text({ label: "Descrição", multiline: true, maxLength: 200, help: "Aparece nos buscadores quando a página não tem descrição própria." }),
  ogImage: field.image({ label: "Imagem padrão de compartilhamento" }),
  twitterHandle: field.text({ label: "Usuário no X/Twitter", localized: false, maxLength: 40, help: "Sem o @." }),
};

const NAVIGATION: FieldMap = {
  navigation: field.list({
    label: "Menu",
    itemLabel: "Item",
    of: {
      label: field.text({ label: "Texto", required: true, maxLength: 40 }),
      href: field.text({ label: "Endereço", localized: false, required: true, help: "/sobre, #contato ou https://…" }),
    },
  }),
  social: field.list({
    label: "Redes",
    itemLabel: "Rede",
    of: {
      network: field.text({ label: "Rede", localized: false, required: true, help: "LinkedIn, GitHub, Instagram…" }),
      url: field.text({ label: "Endereço", localized: false, required: true }),
    },
  }),
};

const PERSON: FieldMap = {
  name: field.text({ label: "Nome", localized: false, required: true }),
  jobTitle: field.text({ label: "Cargo ou área" }),
  email: field.text({ label: "E-mail", localized: false }),
  photo: field.image({ label: "Foto" }),
};

const ORGANIZATION: FieldMap = {
  legalName: field.text({ label: "Razão social", localized: false }),
  taxId: field.text({ label: "CNPJ", localized: false }),
  email: field.text({ label: "E-mail", localized: false }),
  phone: field.text({ label: "Telefone", localized: false }),
  whatsapp: field.text({ label: "WhatsApp", localized: false, help: "Com DDI e DDD, só números." }),
  street: field.text({ label: "Endereço (rua e número)", localized: false }),
  locality: field.text({ label: "Cidade", localized: false }),
  region: field.text({ label: "Estado", localized: false }),
  postalCode: field.text({ label: "CEP", localized: false }),
  country: field.text({ label: "País", localized: false }),
  openingHours: field.list({
    label: "Horário",
    itemLabel: "Horário",
    of: {
      days: field.text({ label: "Dias", localized: false, required: true, help: "Formato schema.org: Mo-Fr, Sa" }),
      opens: field.text({ label: "Abre", localized: false, required: true, help: "09:00" }),
      closes: field.text({ label: "Fecha", localized: false, required: true, help: "18:00" }),
    },
  }),
  mapUrl: field.text({ label: "Link do mapa", localized: false }),
  schemaType: field.select({
    label: "Tipo (schema.org)",
    options: [
      { value: "Organization", label: "Organização" },
      { value: "LocalBusiness", label: "Negócio local" },
      { value: "ProfessionalService", label: "Serviço profissional" },
    ],
  }),
};

const ICONS: FieldMap = {
  svg: field.image({ label: "Favicon (SVG)", help: "Ícone da aba do navegador, em SVG (fica nítido em qualquer tamanho)." }),
  favicon: field.image({ label: "Favicon (PNG ou ICO)", help: "Para navegadores sem SVG: 32×32 ou 48×48." }),
  apple: field.image({ label: "Ícone da tela inicial (Apple)", help: "PNG 180×180, sem transparência." }),
  icon192: field.image({ label: "Ícone do app (192×192)", help: "PNG. Entra no manifest, para instalar o site no celular." }),
  icon512: field.image({ label: "Ícone do app (512×512)", help: "PNG. Entra no manifest." }),
  maskable: field.image({ label: "Ícone adaptável do Android (512×512)", help: "PNG com margem de segurança (o Android recorta em círculo ou quadrado)." }),
};

const THEME_COLOR: FieldMap = {
  light: field.text({ label: "Cor da barra do navegador (modo claro)", localized: false, maxLength: 9, help: "Hexadecimal, ex.: #ffffff. Vazio: o fundo do esquema de cor." }),
  dark: field.text({ label: "Cor da barra do navegador (modo escuro)", localized: false, maxLength: 9, help: "Hexadecimal, ex.: #0a0a0a. Vazio: o fundo do esquema de cor." }),
};

const BLOG: FieldMap = {
  rssTitle: field.text({ label: "Título do feed RSS", maxLength: 120, help: "Vazio: o nome do site." }),
  rssDescription: field.text({ label: "Descrição do feed RSS", multiline: true, maxLength: 300, help: "Vazio: a descrição do site." }),
  defaultPostCover: field.image({ label: "Capa padrão dos posts", help: "Usada nos posts sem capa, na lista e no compartilhamento (1200×630)." }),
};

const ANNOUNCEMENT: FieldMap = {
  enabled: field.boolean({ label: "Mostrar a faixa de aviso", default: false }),
  text: field.text({ label: "Texto do aviso", maxLength: 200, help: "Curto e direto. Sem texto num idioma, a faixa não aparece nele." }),
  link: field.link({ label: "Link (opcional)", help: "Aparece depois do texto. Aceita /pagina, https://… ou whatsapp:." }),
  tone: field.select({
    label: "Estilo",
    options: [
      { value: "info", label: "Discreto (cores de cartão)" },
      { value: "destaque", label: "Destaque (cor principal do tema)" },
    ],
    default: "info",
  }),
  startsAt: field.text({ label: "Começa em", localized: false, maxLength: 30, help: "Opcional. AAAA-MM-DD, ou com hora e fuso: 2026-12-01T09:00-03:00." }),
  endsAt: field.text({ label: "Termina em", localized: false, maxLength: 30, help: "Opcional. A data vale até o fim do dia (em UTC)." }),
};

const WHATSAPP: FieldMap = {
  number: field.text({ label: "Número do WhatsApp", localized: false, maxLength: 30, help: "Com DDI e DDD: +55 11 91234-5678. Fica salvo só com os dígitos." }),
  message: field.text({ label: "Mensagem inicial", multiline: true, maxLength: 500, help: "Já vem escrita na conversa. Sem tradução num idioma, a conversa abre em branco." }),
  floating: field.boolean({ label: "Botão flutuante em todas as páginas", default: false }),
  label: field.text({ label: "Texto do botão flutuante", maxLength: 40, help: "Opcional. Vazio: só o ícone (no celular, sempre só o ícone)." }),
};

/** Valores do formulário → `Announcement`, ou `undefined` quando está tudo vazio. */
function valuesToAnnouncement(values: Values): Announcement | undefined {
  const v = prune(values);
  const text = (v.text as Announcement["text"] | undefined) ?? {};
  const link = v.link as Announcement["link"] | undefined;
  const hasContent = Object.values(text).some((t) => t?.trim()) || !!link?.href || !!v.startsAt || !!v.endsAt || v.enabled === true;
  if (!hasContent) return undefined;
  const out: Announcement = { enabled: v.enabled === true, text };
  if (link?.href) out.link = link;
  if (v.tone === "destaque") out.tone = "destaque";
  if (typeof v.startsAt === "string" && v.startsAt.trim()) out.startsAt = v.startsAt.trim();
  if (typeof v.endsAt === "string" && v.endsAt.trim()) out.endsAt = v.endsAt.trim();
  return out;
}

/** Valores do formulário → `WhatsAppSettings`, ou `undefined` sem número nem mais nada. */
function valuesToWhatsApp(values: Values): WhatsAppSettings | undefined {
  const v = prune(values);
  const number = typeof v.number === "string" ? v.number : "";
  const message = v.message as WhatsAppSettings["message"];
  const label = v.label as WhatsAppSettings["label"];
  const filled = (l?: Record<string, string | undefined>) => !!l && Object.values(l).some((t) => t?.trim());
  if (!number.trim() && !filled(message) && !filled(label) && v.floating !== true) return undefined;
  return { number, floating: v.floating === true, ...(filled(message) && { message }), ...(filled(label) && { label }) };
}

/** Situação do aviso agora (a do próximo build): no ar, agendado, encerrado ou desligado. */
function announcementStatus(a: Announcement | undefined): string {
  if (!a?.enabled) return "Desligado: o site não mostra a faixa.";
  const now = Date.now();
  if (announcementActive(a, now)) return a.endsAt ? `No ar até ${a.endsAt}, a partir da próxima publicação.` : "No ar a partir da próxima publicação.";
  const start = a.startsAt ? announcementTime(a.startsAt, "start") : undefined;
  if (start !== undefined && now < start) return `Agendado para ${a.startsAt}: só entra no ar na primeira publicação depois dessa data.`;
  return "Encerrado: sai do ar na próxima publicação.";
}

const ANALYTICS: FieldMap = {
  scriptUrl: field.text({ label: "Endereço do script", localized: false, help: "https://cloud.umami.is/script.js, ou o do seu Umami." }),
  websiteId: field.text({ label: "Id do site no Umami", localized: false, maxLength: 64 }),
};

/** Objeto sem campos vazios, ou `undefined` (o campo some das configurações). */
function compactObject<T>(values: Values): T | undefined {
  const out = Object.fromEntries(Object.entries(prune(values)).filter(([, v]) => v !== undefined && v !== "" && !(typeof v === "object" && v && !Array.isArray(v) && !Object.keys(v).length)));
  return Object.keys(out).length ? (out as T) : undefined;
}

const ADDRESS_KEYS = ["street", "locality", "region", "postalCode", "country"] as const;

function orgToValues(org: Organization | undefined): Values {
  const { address, ...rest } = org ?? {};
  return { ...rest, ...(address ?? {}) };
}

function valuesToOrg(values: Values): Organization | undefined {
  const out: Values = {};
  const address: Values = {};
  for (const [k, v] of Object.entries(values)) {
    if ((ADDRESS_KEYS as readonly string[]).includes(k)) address[k] = v;
    else out[k] = v;
  }
  if (Object.keys(address).length) out.address = address;
  return Object.keys(out).length ? (out as Organization) : undefined;
}

function LocalesEditor({ value, onChange }: { value: SiteSettings["locales"]; onChange: (v: SiteSettings["locales"]) => void }) {
  const [code, setCode] = useState("");
  let error: string | undefined;
  try {
    defineLocales(value);
  } catch (e) {
    error = (e as Error).message.replace("[rubrica] ", "");
  }
  return (
    <div className="space-y-2">
      <Label>Idiomas do site</Label>
      <ul className="space-y-1">
        {value.locales.map((l, i) => (
          <li key={l} className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm">
            <span className="flex-1">
              {localeName(l)} <span className="font-mono text-xs text-muted-foreground">{l}</span>{" "}
              <span className="font-mono text-xs text-muted-foreground">{l === value.default ? "(sem prefixo)" : `/${localePrefix(l, value)}`}</span>
            </span>
            {l === value.default ? (
              <Badge>principal</Badge>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => onChange({ ...value, default: l })}>
                <Star /> Tornar principal
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" aria-label={`Subir ${l}`} disabled={i === 0} onClick={() => onChange({ ...value, locales: moveItem(value.locales, i, i - 1) })}>
              <ArrowUp />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Descer ${l}`} disabled={i === value.locales.length - 1} onClick={() => onChange({ ...value, locales: moveItem(value.locales, i, i + 1) })}>
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Remover ${l}`} disabled={l === value.default} onClick={() => onChange({ ...value, locales: value.locales.filter((x) => x !== l) })}>
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const c = code.trim();
          if (/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(c) && !value.locales.includes(c)) {
            onChange({ ...value, locales: [...value.locales, c] });
            setCode("");
          }
        }}
      >
        <Input aria-label="Código do idioma" placeholder="es, en-US, fr…" value={code} onChange={(e) => setCode(e.target.value)} className="max-w-40" />
        <Button type="submit" variant="outline" size="sm">
          <Plus /> Acrescentar
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">
        Conteúdo sem tradução num idioma não existe nesse idioma (decisão 28). Trocar o principal muda as URLs: o principal fica sem prefixo.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function Settings() {
  const panel = usePanel();
  const { block } = useRouter();
  const update = useMutation(api.settings.update);
  const snapshot = useQuery(api.site.snapshot, {});
  const isRoot = panel.me.role === "root";
  const [draft, setDraft] = useState<SiteSettings | null>(() => (panel.settings ? structuredClone(panel.settings) : null));
  const [locale, setLocale] = useState(panel.locales.default);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const changedKeys = useMemo(() => {
    if (!draft || !panel.settings) return [];
    return (Object.keys({ ...draft, ...panel.settings }) as (keyof SiteSettings)[]).filter((k) => !sameDraft(draft[k], panel.settings![k]));
  }, [draft, panel.settings]);
  const dirty = changedKeys.length > 0;

  useEffect(() => (dirty ? block("Há configurações não salvas. Sair mesmo assim?") : undefined), [dirty, block]);
  useEffect(() => {
    if (!dirty && panel.settings) setDraft(structuredClone(panel.settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel.settings]);

  if (!draft) {
    return (
      <>
        <PageHeader title="Configurações" />
        <Alert variant="warning" className="m-6">
          O site ainda não foi configurado. Rode <code>npx create-rubrica setup</code> no projeto.
        </Alert>
      </>
    );
  }

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K] | undefined) =>
    setDraft((d) => {
      const next = { ...d! } as unknown as Values;
      if (value === undefined) delete next[key];
      else next[key] = value;
      return next as unknown as SiteSettings;
    });

  async function save() {
    if (!draft) return;
    setBusy(true);
    setError(undefined);
    try {
      // Campo que saiu do rascunho (ex.: o WhatsApp apagado) vai em `unset`: `undefined` não viaja.
      const unset = changedKeys.filter((k) => draft[k] === undefined);
      const patch = Object.fromEntries(changedKeys.filter((k) => draft[k] !== undefined).map((k) => [k, prune(draft[k])])) as Partial<SiteSettings>;
      await update(unset.length ? { patch, unset } : { patch });
      toast.success("Configurações salvas. O site no ar muda na próxima publicação.");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const locales = draft.locales.locales;
  const editorLocale = { locale: locales.includes(locale) ? locale : draft.locales.default, setLocale, locales, defaultLocale: draft.locales.default, translation: panel.enabled.has("translation") };
  const identity = { name: draft.name, description: draft.description, ogImage: draft.ogImage, twitterHandle: draft.twitterHandle } as Values;
  const announcement = (draft.announcement ?? {}) as unknown as Values;
  const whatsapp = (draft.whatsapp ?? {}) as unknown as Values;
  const home: PageRecord | undefined = snapshot?.pages.find((p) => p.path === "/") ?? snapshot?.pages[0];

  return (
    <EditorLocaleProvider value={editorLocale}>
      <PageHeader
        title="Configurações"
        description="Dados do site que valem em todas as páginas."
        actions={
          <>
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(structuredClone(panel.settings!))}>
                <Undo2 /> Descartar
              </Button>
            )}
            <Button onClick={save} disabled={!dirty || busy}>
              {busy ? <Spinner /> : <Save />} Salvar
            </Button>
          </>
        }
      />
      <div className="grid max-w-5xl gap-4 p-6">
        {error && <Alert variant="destructive">{error}</Alert>}
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldsForm
              fields={IDENTITY}
              values={identity}
              missing={missingTranslations(IDENTITY, identity, locales)}
              onChange={(v) => setDraft((d) => ({ ...d!, name: (v.name as SiteSettings["name"]) ?? {}, description: (v.description as SiteSettings["description"]) ?? {}, ogImage: v.ogImage as SiteSettings["ogImage"], twitterHandle: v.twitterHandle as string | undefined }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ícones e barra do navegador</CardTitle>
            <CardDescription>Favicon, ícone da tela inicial e o manifest para instalar o site no celular. Tudo opcional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldsForm fields={ICONS} values={(draft.icons ?? {}) as Values} onChange={(v) => set("icons", compactObject<NonNullable<SiteSettings["icons"]>>(v))} />
            <FieldsForm fields={THEME_COLOR} values={(draft.themeColor ?? {}) as Values} onChange={(v) => set("themeColor", compactObject<NonNullable<SiteSettings["themeColor"]>>(v))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faixa de aviso</CardTitle>
            <CardDescription>
              Uma linha no topo de todas as páginas do site (menos proposta e checkout): agenda aberta, promoção, mudança de horário. O período vale na hora de publicar: o aviso entra ou
              sai do ar na primeira publicação depois da data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldsForm
              fields={ANNOUNCEMENT}
              values={announcement}
              missing={draft.announcement?.enabled ? missingTranslations({ text: ANNOUNCEMENT.text! }, { text: draft.announcement.text } as Values, locales) : []}
              onChange={(v) => set("announcement", valuesToAnnouncement(v))}
            />
            <p className="text-sm text-muted-foreground" role="status">
              {announcementStatus(draft.announcement)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>
              Um número para o site inteiro. Liga o botão flutuante (no canto de baixo, em todas as páginas) e vale em qualquer botão ou link: use o endereço <code>whatsapp:</code> para abrir
              a conversa com a mensagem inicial, ou <code>whatsapp:Quero o plano Pro</code> para uma mensagem própria.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldsForm fields={WHATSAPP} values={whatsapp} onChange={(v) => set("whatsapp", valuesToWhatsApp(v))} />
          </CardContent>
        </Card>

        {(draft.announcement || draft.whatsapp?.floating) && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Prévia</CardTitle>
              <CardDescription>A página inicial com a faixa de aviso e o botão do WhatsApp como estão acima, antes de salvar.</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0">
              {home ? (
                <PreviewPane className="h-[560px] min-w-0 overflow-hidden rounded-md border" snapshot={snapshot} page={home} locale={editorLocale.locale} locales={locales} onLocale={setLocale} settings={draft} />
              ) : (
                <p className="text-sm text-muted-foreground">Publique a página inicial para ver a prévia aqui.</p>
              )}
            </CardContent>
          </Card>
        )}

        {panel.enabled.has("blog") && (
          <Card>
            <CardHeader>
              <CardTitle>Blog</CardTitle>
              <CardDescription>O feed RSS (/rss.xml, e um por idioma com post traduzido) e a capa dos posts que não têm uma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldsForm
                fields={BLOG}
                values={{ rssTitle: draft.rss?.title, rssDescription: draft.rss?.description, defaultPostCover: draft.defaultPostCover } as Values}
                missing={missingTranslations(BLOG, { rssTitle: draft.rss?.title, rssDescription: draft.rss?.description } as Values, locales)}
                onChange={(v) => {
                  set("rss", compactObject<NonNullable<SiteSettings["rss"]>>({ title: v.rssTitle, description: v.rssDescription }));
                  set("defaultPostCover", v.defaultPostCover as SiteSettings["defaultPostCover"]);
                }}
              />
            </CardContent>
          </Card>
        )}

        {panel.enabled.has("analytics") && (
          <Card>
            <CardHeader>
              <CardTitle>Analytics (Umami)</CardTitle>
              <CardDescription>
                O script entra em todas as páginas, sem cookies. Vazio: valem as variáveis PUBLIC_UMAMI_SCRIPT_URL e PUBLIC_UMAMI_WEBSITE_ID do build. A origem do script precisa
                estar liberada na CSP do site: quem cuida do código roda <code>npx create-rubrica config --analytics &lt;endereço&gt;</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldsForm fields={ANALYTICS} values={(draft.analytics ?? {}) as Values} onChange={(v) => set("analytics", compactObject<NonNullable<SiteSettings["analytics"]>>(v))} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Navegação e redes</CardTitle>
            <CardDescription>O menu do cabeçalho e os links do rodapé. Item sem texto num idioma não aparece nele.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldsForm
              fields={NAVIGATION}
              values={{ navigation: draft.navigation, social: draft.social }}
              missing={missingTranslations(NAVIGATION, { navigation: draft.navigation }, locales)}
              onChange={(v) => setDraft((d) => ({ ...d!, navigation: (v.navigation as SiteSettings["navigation"]) ?? [], social: (v.social as SiteSettings["social"]) ?? [] }))}
            />
          </CardContent>
        </Card>

        {draft.kind === "pessoal" ? (
          <Card>
            <CardHeader>
              <CardTitle>Pessoa</CardTitle>
              <CardDescription>Dono do site: autor dos posts e dados estruturados (JSON-LD Person).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldsForm fields={PERSON} values={(draft.person ?? {}) as Values} onChange={(v) => set("person", Object.keys(v).length ? (v as unknown as SiteSettings["person"]) : undefined)} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Empresa</CardTitle>
              <CardDescription>Rodapé, contato, localização e dados estruturados (JSON-LD Organization).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FieldsForm fields={ORGANIZATION} values={orgToValues(draft.organization)} onChange={(v) => set("organization", valuesToOrg(v))} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configuração técnica</CardTitle>
            <CardDescription>{isRoot ? "Só a agência (root) muda esta parte." : "Só a agência (root) muda esta parte. Fale com quem cuida do site."}</CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset disabled={!isRoot} className="space-y-4 disabled:opacity-70">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cfg-url">Endereço do site</Label>
                  <Input id="cfg-url" value={draft.url} onChange={(e) => set("url", e.target.value)} placeholder="https://exemplo.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cfg-kind">Tipo do site</Label>
                  <NativeSelect id="cfg-kind" value={draft.kind} onChange={(e) => set("kind", e.target.value as SiteSettings["kind"])}>
                    <option value="pessoal">Pessoal</option>
                    <option value="empresa">Empresa</option>
                  </NativeSelect>
                  {draft.kind !== panel.settings?.kind && <p className="text-xs text-warning">Trocar o tipo muda os blocos e plugins disponíveis; blocos do outro tipo param de aparecer.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cfg-theme">Tema</Label>
                  <Input id="cfg-theme" value={draft.theme} disabled />
                  <p className="text-xs text-muted-foreground">O tema é um pacote do projeto: troca-se no código (npx create-rubrica config).</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cfg-posts">Base dos posts e dos projetos</Label>
                  <div className="flex gap-2">
                    <Input id="cfg-posts" aria-label="Base dos posts" value={draft.paths?.posts ?? ""} placeholder={defaultPathsFor(draft.kind).posts} onChange={(e) => set("paths", { ...draft.paths, posts: e.target.value || undefined })} />
                    <Input aria-label="Base dos projetos" value={draft.paths?.projects ?? ""} placeholder={defaultPathsFor(draft.kind).projects} onChange={(e) => set("paths", { ...draft.paths, projects: e.target.value || undefined })} />
                  </div>
                </div>
              </div>
              <LocalesEditor value={draft.locales} onChange={(v) => set("locales", v)} />
            </fieldset>
          </CardContent>
        </Card>
      </div>
    </EditorLocaleProvider>
  );
}
