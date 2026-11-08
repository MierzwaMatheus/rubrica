/** Propostas: lista, editor com versões, senha, desconto e parcelas, link público e aceite. */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, Copy, ExternalLink, FileSignature, KeyRound, Lock, Plus, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { installmentOptions } from "../../convex/commerce/lib/installments";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { can } from "../../convex/lib/roles";
import { api, type ProposalDoc, type ProposalVersion } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { EditingLocaleBar, Section } from "../collections/parts";
import { EditorLocaleProvider, FieldsForm } from "../editor/fields";
import { errorMessage, missingLocales, missingTranslations, prune, sameDraft, type Values } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { planUpdate } from "../collections/model";
import { diffVersions, formatBRL, formatDate, formatDateTime, textIn } from "../lib/format";
import { Link, useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { CONTENT_KEYS, CONTENT_REQUIRED, dateToInput, formToProposal, inputToDate, PROPOSAL_FIELDS, proposalStatus, proposalToForm, proposalUrl, STATUS_LABELS, UNSETTABLE, validateProposalForm, type ProposalErrors } from "../proposals/model";
import { Button } from "../ui/button";
import { Alert, Badge, Input, Label, NativeSelect, Spinner } from "../ui/form";
import { matchesSearch } from "../collections/model";

const STATUS_BADGE = { accepted: "success", pending: "secondary", expired: "warning", trash: "destructive" } as const;

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copiado.");
  } catch {
    toast.error("Não foi possível copiar. Selecione o link e copie à mão.");
  }
}

// ── Lista ───────────────────────────────────────────────────────────────────

function List() {
  const panel = usePanel();
  const proposals = useQuery(api.proposals.list, { includeDeleted: true });
  const remove = useMutation(api.proposals.remove);
  const restore = useMutation(api.proposals.restore);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "trash">("all");
  const [search, setSearch] = useState("");
  const canTrash = can(panel.me.role, "contracts");
  const canPurge = can(panel.me.role, "purge");
  const siteUrl = panel.settings?.url ?? "";
  const shown = useMemo(
    () =>
      (proposals ?? []).filter((p) => {
        const status = proposalStatus(p);
        if (filter === "trash" ? status !== "trash" : status === "trash") return false;
        if (filter === "pending" && p.isAccepted) return false;
        if (filter === "accepted" && !p.isAccepted) return false;
        return !search || matchesSearch(`${p.clientName} ${textIn(p.title, panel.locales.default)}`, search);
      }),
    [proposals, filter, search, panel.locales.default],
  );
  return (
    <>
      <PageHeader
        title="Propostas"
        description="Propostas comerciais com link próprio, senha opcional, versões e aceite eletrônico."
        actions={
          <Button asChild>
            <Link to="/admin/propostas?novo=1">
              <Plus /> Nova proposta
            </Link>
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Input aria-label="Buscar propostas" placeholder="Buscar por cliente ou título" className="max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
          <NativeSelect aria-label="Filtrar propostas" className="w-44" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}>
            <option value="all">Todas</option>
            <option value="pending">Não aceitas</option>
            <option value="accepted">Aceitas</option>
            <option value="trash">Lixeira</option>
          </NativeSelect>
        </div>
        {proposals === undefined ? (
          <Loading />
        ) : shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{search || filter !== "all" ? "Nada encontrado." : "Nenhuma proposta ainda."}</p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card" aria-label="Propostas">
            {shown.map((p) => {
              const status = proposalStatus(p);
              const url = proposalUrl(siteUrl, p.slug);
              return (
                <li key={p._id} className="flex flex-wrap items-center gap-3 px-4 py-3" data-proposal-id={p._id}>
                  <div className="min-w-0 flex-1">
                    {status === "trash" ? (
                      <p className="font-medium">{p.clientName}</p>
                    ) : (
                      <Link to={`/admin/propostas?id=${p._id}`} className="font-medium hover:underline">
                        {p.clientName}
                      </Link>
                    )}
                    <p className="truncate text-sm text-muted-foreground">{textIn(p.title, panel.locales.default)}</p>
                    <p className="text-xs text-muted-foreground">
                      versão {p.version} · {p.isAccepted ? `aceita em ${formatDate(p.acceptedAt)}` : `vale até ${formatDate(p.expiresAt)}`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{formatBRL(p.investmentValue)}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={STATUS_BADGE[status]}>{STATUS_LABELS[status]}</Badge>
                    {p.hasPassword && (
                      <Badge variant="outline" title="O link pede senha">
                        <Lock /> senha
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {status === "trash" ? (
                      canPurge ? (
                        <Button size="sm" variant="outline" onClick={() => restore({ id: p._id }).then(() => toast.success("Restaurada."), (e) => toast.error(errorMessage(e)))}>
                          <RotateCcw /> Restaurar
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Só a agência restaura.</span>
                      )
                    ) : (
                      <>
                        <Button size="icon-sm" variant="ghost" aria-label={`Copiar o link da proposta de ${p.clientName}`} title="Copiar o link" onClick={() => copy(url)}>
                          <Copy />
                        </Button>
                        <Button asChild size="icon-sm" variant="ghost" aria-label={`Abrir a proposta de ${p.clientName} no site`} title="Abrir no site">
                          <a href={url} target="_blank" rel="noreferrer">
                            <ExternalLink />
                          </a>
                        </Button>
                        {canTrash && !p.isAccepted && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Mandar a proposta de ${p.clientName} para a lixeira`}
                            onClick={() =>
                              window.confirm(`Mandar a proposta de ${p.clientName} para a lixeira? O link público deixa de abrir.`) &&
                              remove({ id: p._id }).then(() => toast.success("Na lixeira."), (e) => toast.error(errorMessage(e)))
                            }
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
      </div>
    </>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────

function Versions({ doc, locale }: { doc: ProposalDoc; locale: string }) {
  const versions = useQuery(api.proposals.versions, { id: doc._id });
  if (!versions) return null;
  // Cada versão guardada é como a proposta estava antes da edição seguinte.
  const chain: { version: number; at: number; before: Record<string, unknown>; after: Record<string, unknown> }[] = [];
  const asc = [...versions].sort((a, b) => a.version - b.version);
  asc.forEach((v: ProposalVersion, i) => {
    const next = asc[i + 1]?.content ?? (doc as unknown as Record<string, unknown>);
    chain.push({ version: v.version, at: v.createdAt, before: v.content as unknown as Record<string, unknown>, after: next as Record<string, unknown> });
  });
  return (
    <Section title={`Versões (atual: ${doc.version})`} description="Cada salvamento guarda a versão anterior. Veja o que mudou em cada uma.">
      {chain.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma edição depois da criação.</p>
      ) : (
        <ol className="space-y-2">
          {[...chain].reverse().map((c) => {
            const changes = diffVersions(c.before, c.after, locale);
            return (
              <li key={c.version}>
                <details className="rounded-md border px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    Versão {c.version} → {c.version + 1} <span className="font-normal text-muted-foreground">· {formatDateTime(c.at)} · {changes.length} {changes.length === 1 ? "mudança" : "mudanças"}</span>
                  </summary>
                  <ul className="mt-2 space-y-2 text-sm">
                    {changes.map((ch) => (
                      <li key={ch.field}>
                        <span className="font-medium">{ch.label}</span>
                        <p className="text-muted-foreground line-through">{ch.before}</p>
                        <p>{ch.after}</p>
                      </li>
                    ))}
                    {changes.length === 0 && <li className="text-muted-foreground">Sem diferença de conteúdo (só validade ou senha).</li>}
                  </ul>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}

function Password({ doc }: { doc: ProposalDoc }) {
  const reset = useMutation(api.proposals.resetPassword);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (newPassword: string | undefined, ok: string) => {
    setBusy(true);
    try {
      await reset({ id: doc._id, ...(newPassword ? { newPassword } : {}) });
      setValue("");
      toast.success(ok);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Label htmlFor="proposal-password">
        <KeyRound className="size-4" /> Senha do link {doc.hasPassword ? <Badge variant="success">definida</Badge> : <Badge variant="secondary">sem senha</Badge>}
      </Label>
      <div className="flex flex-wrap gap-2">
        <Input id="proposal-password" type="text" autoComplete="off" className="max-w-60" placeholder={doc.hasPassword ? "Nova senha" : "Definir senha"} value={value} onChange={(e) => setValue(e.target.value)} />
        <Button size="sm" variant="outline" disabled={busy || value.length < 6} onClick={() => run(value, "Senha definida: quem estava com o link aberto precisa entrar de novo.")}>
          {doc.hasPassword ? "Trocar senha" : "Definir senha"}
        </Button>
        {doc.hasPassword && (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => window.confirm("Tirar a senha? O link passa a abrir para qualquer pessoa que o tenha.") && run(undefined, "Senha removida.")}>
            Tirar senha
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres. A senha não é mostrada depois de salva: combine com o cliente por outro canal.</p>
    </div>
  );
}

function Acceptance({ id }: { id: string }) {
  const acceptance = useQuery(api.proposals.getAcceptance, { id });
  if (!acceptance) return null;
  return (
    <Section title="Aceite eletrônico" description="Registro de quem aceitou, quando e de onde. O conteúdo aceito fica congelado.">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        {[
          ["Nome", acceptance.clientName],
          ["Documento", acceptance.clientDocument],
          ["E-mail", acceptance.clientEmail],
          ["Cargo", acceptance.clientRole],
          ["Aceito em", formatDateTime(acceptance.acceptedAt)],
          ["Versão aceita", String(acceptance.proposalVersion)],
          ["IP", acceptance.ipAddress],
          ["Navegador", acceptance.userAgent],
          ["Hash do conteúdo", acceptance.contentHash],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-mono text-xs break-all sm:text-sm sm:font-sans">{v}</dd>
            </div>
          ))}
      </dl>
      {acceptance.clientDeclaration && <p className="rounded-md border bg-muted p-3 text-sm">“{acceptance.clientDeclaration}”</p>}
      {acceptance.signatureUrl && <img src={acceptance.signatureUrl} alt={`Assinatura de ${acceptance.clientName}`} className="max-h-32 rounded border bg-white p-2" />}
    </Section>
  );
}

function ValueSummary({ form }: { form: Values }) {
  const content = useMemo(() => formToProposal(form), [form]);
  const value = typeof content.investmentValue === "number" ? content.investmentValue : undefined;
  const [count, setCount] = useState(1);
  if (value === undefined) return null;
  const summary = summarizeDiscount({ investmentValue: value, originalValue: content.originalValue as number | undefined, scopePrices: content.scopePrices as (number | null)[] | undefined, giftIndexes: content.giftIndexes as number[] | undefined });
  const options = value >= 5 ? installmentOptions(value) : [];
  const chosen = options[Math.min(count, options.length) - 1];
  return (
    <Section title="Valor e parcelas" description="Como o cliente vê o investimento. As parcelas seguem as regras do cartão no checkout (até 3x sem juros).">
      <p className="text-lg font-semibold tabular-nums">
        {summary.hasDiscount && <span className="mr-2 text-sm font-normal text-muted-foreground line-through">{formatBRL(summary.originalValue)}</span>}
        {formatBRL(summary.finalValue)}
        {summary.hasDiscount && <Badge variant="success" className="ml-2 align-middle">{summary.discountPercent}% de desconto</Badge>}
      </p>
      {summary.giftCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {summary.giftCount} {summary.giftCount === 1 ? "item de cortesia" : "itens de cortesia"} somam {formatBRL(summary.giftTotal)} dentro do desconto.
        </p>
      )}
      {summary.pricesTotal > 0 && <p className="text-sm text-muted-foreground">Soma dos preços dos itens: {formatBRL(summary.pricesTotal)}.</p>}
      {options.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Label htmlFor="installments">Simular parcelamento</Label>
          <NativeSelect id="installments" className="w-24" value={Math.min(count, options.length)} onChange={(e) => setCount(Number(e.target.value))}>
            {options.map((o) => (
              <option key={o.count} value={o.count}>
                {o.count}x
              </option>
            ))}
          </NativeSelect>
          {chosen && (
            <span>
              {chosen.count}x de <strong>{formatBRL(chosen.value)}</strong> {chosen.isInterestFree ? "sem juros" : `(total ${formatBRL(chosen.totalValue)}, com juros do cartão)`}
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">O checkout só cobra a partir de R$ 5,00.</p>
      )}
    </Section>
  );
}

function Editor({ doc }: { doc?: ProposalDoc }) {
  const panel = usePanel();
  const { navigate, block } = useRouter();
  const create = useMutation(api.proposals.create);
  const update = useMutation(api.proposals.update);
  const remove = useMutation(api.proposals.remove);
  const templates = useQuery(api.contractTemplates.list, panel.enabled.has("contract-templates") ? {} : "skip");
  const start = useMemo(() => (doc ? proposalToForm(doc) : { scope: [{}], investmentValue: undefined }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [base, setBase] = useState<Values>(start);
  const [draft, setDraft] = useState<Values>(start);
  const [expires, setExpires] = useState(doc ? dateToInput(doc.expiresAt) : dateToInput(Date.now() + 10 * 86_400_000));
  const [baseExpires, setBaseExpires] = useState(expires);
  const [newPassword, setNewPassword] = useState("");
  const [slug, setSlug] = useState("");
  const [locale, setLocale] = useState(panel.locales.default);
  const [errors, setErrors] = useState<ProposalErrors>({ fields: [] });
  const [busy, setBusy] = useState(false);
  const isNew = !doc;
  const accepted = !!doc?.isAccepted;
  const dirty = !sameDraft(draft, base) || expires !== baseExpires;

  useEffect(() => {
    if (!doc || dirty) return;
    const fresh = proposalToForm(doc);
    if (!sameDraft(fresh, base)) {
      setBase(fresh);
      setDraft(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);
  useEffect(() => (dirty ? block("Há mudanças não salvas nesta proposta. Sair mesmo assim?") : undefined), [dirty, block]);

  const missing = useMemo(() => missingTranslations(PROPOSAL_FIELDS, draft, panel.locales.locales), [draft, panel.locales.locales]);
  const localeValue = useMemo(() => ({ locale, setLocale, locales: panel.locales.locales, defaultLocale: panel.locales.default, translation: panel.enabled.has("translation") }), [locale, panel.locales, panel.enabled]);

  const save = useCallback(async () => {
    const found = validateProposalForm(draft);
    if (found.fields.length || found.discount) {
      setErrors(found);
      toast.error("A proposta tem campos a corrigir.");
      requestAnimationFrame(() => document.querySelector("[role=alert]")?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setBusy(true);
    try {
      const next = formToProposal(draft);
      const expiresAt = inputToDate(expires);
      if (isNew) {
        if (newPassword && newPassword.length < 6) throw new Error("A senha da proposta precisa ter pelo menos 6 caracteres");
        const id = await create({ ...next, ...(slug.trim() ? { slug: slug.trim() } : {}), ...(newPassword ? { password: newPassword } : {}), ...(expiresAt ? { expiresAt } : {}) });
        setBase(draft);
        setBaseExpires(expires);
        toast.success("Proposta criada.");
        navigate(`/admin/propostas?id=${id}`, { replace: true, force: true });
        return;
      }
      const plan = planUpdate(formToProposal(base), next, CONTENT_KEYS, CONTENT_REQUIRED);
      const unset = plan.unset.filter((k) => (UNSETTABLE as readonly string[]).includes(k));
      const expiresChanged = expires !== baseExpires && expiresAt !== undefined;
      if (!Object.keys(plan.patch).length && !unset.length && !expiresChanged) return;
      await update({ id: doc!._id, patch: plan.patch, ...(unset.length ? { unset } : {}), ...(expiresChanged ? { expiresAt } : {}) });
      setErrors({ fields: [] });
      setBase(draft);
      setBaseExpires(expires);
      toast.success(`Salvo como versão ${doc!.version + 1}.`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [draft, base, expires, baseExpires, isNew, doc, create, update, navigate, newPassword, slug]);

  const siteUrl = panel.settings?.url ?? "";
  const url = doc ? proposalUrl(siteUrl, doc.slug) : undefined;
  const missingIn = missingLocales(missing);
  const discountAt = (path: string): ReactNode => (errors.discount?.path === path ? <p className="text-xs text-destructive" role="alert">{errors.discount.message}</p> : null);
  const status = doc ? proposalStatus(doc) : undefined;

  return (
    <EditorLocaleProvider value={localeValue}>
      <PageHeader
        title={isNew ? "Nova proposta" : doc.clientName}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {status && <Badge variant={STATUS_BADGE[status]}>{STATUS_LABELS[status]}</Badge>}
            {doc && <span>versão {doc.version}</span>}
            {doc?.hasPassword && (
              <Badge variant="outline">
                <Lock /> senha
              </Badge>
            )}
            {dirty && <Badge variant="warning">mudanças não salvas</Badge>}
            {missingIn.length > 0 && <Badge variant="warning">falta traduzir: {missingIn.join(", ")}</Badge>}
          </span>
        }
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/propostas">
                <ArrowLeft /> Propostas
              </Link>
            </Button>
            {dirty && !isNew && (
              <Button variant="ghost" size="sm" onClick={() => window.confirm("Descartar as mudanças não salvas?") && (setDraft(base), setExpires(baseExpires), setErrors({ fields: [] }))}>
                <Undo2 /> Descartar
              </Button>
            )}
            {doc && !accepted && can(panel.me.role, "contracts") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  window.confirm(`Mandar a proposta de ${doc.clientName} para a lixeira? O link público deixa de abrir.`) &&
                  remove({ id: doc._id }).then(() => (toast.success("Na lixeira."), navigate("/admin/propostas", { force: true })), (e) => toast.error(errorMessage(e)))
                }
              >
                <Trash2 /> Lixeira
              </Button>
            )}
            <Button size="sm" disabled={accepted || busy || (!dirty && !isNew)} onClick={() => void save()}>
              {busy ? <Spinner /> : <Save />} {isNew ? "Criar proposta" : "Salvar"}
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        {accepted && (
          <Alert variant="warning">
            <FileSignature />
            <p>Esta proposta foi aceita em {formatDateTime(doc!.acceptedAt)} e não pode mais ser alterada. Para mudar algo, crie uma nova proposta.</p>
          </Alert>
        )}
        {!isNew && !accepted && <p className="text-xs text-muted-foreground">Cada salvamento guarda a versão anterior e sobe o número da versão (agora: {doc.version}).</p>}
        <EditingLocaleBar missingIn={missingIn} />
        <fieldset disabled={accepted} className="space-y-4">
          <Section title="Proposta">
            <FieldsForm fields={PROPOSAL_FIELDS} values={draft} missing={missing} errors={errors.fields} onChange={(v) => setDraft(prune(v))} />
            {discountAt("scope")}
            {discountAt("originalValue")}
            {discountAt("investmentValue")}
          </Section>
          <ValueSummary form={draft} />
          {panel.enabled.has("contract-templates") && (
            <Section title="Contrato" description="O modelo escolhido vira o contrato da página de aceite. Ao aceitar, o texto fica congelado.">
              <div className="space-y-1.5">
                <Label htmlFor="proposal-template">Modelo de contrato</Label>
                <NativeSelect id="proposal-template" value={(draft.templateId as string | undefined) ?? ""} onChange={(e) => setDraft(prune({ ...draft, templateId: e.target.value || undefined }))}>
                  <option value="">Modelo padrão{templates?.find((t) => t.isDefault) ? ` (${templates.find((t) => t.isDefault)!.name})` : ""}</option>
                  {templates?.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </Section>
          )}
          <Section title="Acesso e validade">
            <div className="space-y-1.5">
              <Label htmlFor="proposal-expires">Vale até</Label>
              <Input id="proposal-expires" type="date" className="max-w-48" value={expires} onChange={(e) => setExpires(e.target.value)} />
              <p className="text-xs text-muted-foreground">Depois dessa data o link mostra que a proposta expirou. Salvar a data nova conta como uma versão.</p>
            </div>
            {doc ? (
              <Password doc={doc} />
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="new-proposal-password">Senha do link (opcional)</Label>
                  <Input id="new-proposal-password" autoComplete="off" className="max-w-60" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres. Vazio deixa o link aberto.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-proposal-slug">Final do link (opcional)</Label>
                  <Input id="new-proposal-slug" className="max-w-60 font-mono" placeholder="gerado a partir do cliente" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
            )}
          </Section>
        </fieldset>
        {doc && url && (
          <Section title="Link público" description="O que você manda para o cliente.">
            <div className="flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 rounded-md border bg-muted px-3 py-2 text-xs break-all">{url}</code>
              <Button size="sm" variant="outline" onClick={() => copy(url)}>
                <Copy /> Copiar
              </Button>
              <Button asChild size="sm" variant="outline">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink /> Abrir
                </a>
              </Button>
            </div>
          </Section>
        )}
        {doc && <Versions doc={doc} locale={locale} />}
        {doc?.isAccepted && <Acceptance id={doc._id} />}
      </div>
    </EditorLocaleProvider>
  );
}

function EditorScreen() {
  const { search } = useRouter();
  const id = search.get("id");
  const doc = useQuery(api.proposals.get, id ? { id } : "skip");
  if (!id) return <Editor key="novo" />;
  if (doc === undefined) return <Loading />;
  if (doc === null || doc.deletedAt !== undefined) {
    return (
      <Alert variant="warning" className="m-6">
        Proposta não encontrada (pode estar na lixeira).{" "}
        <Link to="/admin/propostas" className="underline">
          Ver as propostas
        </Link>
      </Alert>
    );
  }
  return <Editor key={doc._id} doc={doc} />;
}

export default function Proposals() {
  const { search } = useRouter();
  return search.get("id") || search.get("novo") ? <EditorScreen /> : <List />;
}

