/** Currículos com IA (só a agência): gerar um currículo ajustado a uma vaga e ver os já gerados. */
import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { api, type AiResume } from "../data/api";
import { useAction, useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { formatDateTime } from "../lib/format";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { localeName, usePanel } from "../panel";
import { Button } from "../ui/button";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, NativeSelect, Spinner, Textarea } from "../ui/form";

const MAX_JOB = 8000;

function Score({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-success" : value >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="flex items-center gap-2" aria-label={`Aderência à vaga: ${value} de 100`}>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function Item({ resume }: { resume: AiResume }) {
  const remove = useMutation(api.aiResumes.remove);
  return (
    <li className="space-y-3 rounded-lg border bg-card p-4" data-resume-id={resume._id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{resume.title}</h3>
          <p className="text-xs text-muted-foreground">
            {localeName(resume.locale)} · {formatDateTime(resume.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Score value={resume.fitScore} />
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Apagar ${resume.title}`}
            onClick={() => window.confirm(`Mandar “${resume.title}” para a lixeira?`) && remove({ id: resume._id }).then(() => toast.success("Na lixeira."), (e) => toast.error(errorMessage(e)))}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <p className="text-sm">{resume.fitComment}</p>
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="font-medium text-success">Pontos fortes</p>
          <ul className="list-disc pl-5 text-muted-foreground">{resume.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
        <div>
          <p className="font-medium text-warning">A melhorar</p>
          <ul className="list-disc pl-5 text-muted-foreground">{resume.weaknesses.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">Descrição da vaga</summary>
        <p className="mt-2 whitespace-pre-line">{resume.jobDescription}</p>
      </details>
    </li>
  );
}

export default function AiResumes() {
  const panel = usePanel();
  const resumes = useQuery(api.aiResumes.list, {});
  const generate = useAction(api.aiResumes.generate);
  const [title, setTitle] = useState("");
  const [locale, setLocale] = useState(panel.locales.default);
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const problem = !title.trim() ? "Dê um título (a vaga e a empresa)." : !job.trim() ? "Cole a descrição da vaga." : job.length > MAX_JOB ? `A descrição passa de ${MAX_JOB} caracteres.` : undefined;
  return (
    <>
      <PageHeader title="Currículos com IA" description="Gera um currículo ajustado a uma vaga a partir do currículo e dos projetos publicados no site." />
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerar para uma vaga</CardTitle>
            <CardDescription>Três chamadas à IA (análise da vaga, comparação e reescrita): leva alguns minutos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (problem) return setError(problem);
                setBusy(true);
                setError(undefined);
                try {
                  await generate({ title: title.trim(), locale, jobDescription: job.trim() });
                  toast.success("Currículo gerado.");
                  setTitle("");
                  setJob("");
                } catch (err) {
                  setError(errorMessage(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-title">Título</Label>
                  <Input id="ai-title" placeholder="Ex.: Product Designer — Empresa X" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ai-locale">Idioma do currículo</Label>
                  <NativeSelect id="ai-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
                    {panel.locales.locales.map((l) => (
                      <option key={l} value={l}>
                        {localeName(l)}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ai-job">Descrição da vaga</Label>
                <Textarea id="ai-job" rows={8} value={job} onChange={(e) => setJob(e.target.value)} aria-invalid={job.length > MAX_JOB || undefined} />
                <p className={cn("text-right text-xs", job.length > MAX_JOB ? "text-destructive" : "text-muted-foreground")}>
                  {job.length}/{MAX_JOB}
                </p>
              </div>
              {error && <Alert variant="destructive">{error}</Alert>}
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner /> : <Sparkles />} {busy ? "Gerando… pode levar alguns minutos" : "Gerar currículo"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <section aria-label="Currículos gerados" className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Gerados {resumes ? <Badge variant="secondary">{resumes.length}</Badge> : null}
          </h2>
          {resumes === undefined ? (
            <Loading />
          ) : resumes.length === 0 ? (
            <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum currículo gerado ainda.</p>
          ) : (
            <ul className="space-y-3">{resumes.map((r) => <Item key={r._id} resume={r} />)}</ul>
          )}
        </section>
      </div>
    </>
  );
}
