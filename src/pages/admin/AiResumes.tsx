import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, FileDown, Sparkles, ChevronDown, ChevronUp, RotateCcw, ShieldAlert } from "lucide-react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useIsRoot } from "@/hooks/useIsRoot";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { generateCV } from "@/utils/cvPDF";
import type { SidebarContactInfo } from "@/repositories/interfaces/SidebarRepository";
import type { ResumeItem } from "@/repositories/interfaces/ResumeRepository";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

type Locale = "pt-BR" | "en-US";

interface CvData {
  summary?: string;
  resumeItems?: Array<ResumeItem & { translatedContent?: any }>;
  projects?: Project[];
  contactInfo?: SidebarContactInfo;
}

function FitScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 40
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${color}`}>
      {score}/100
    </span>
  );
}

function ResumeCard({
  resume,
  onDelete,
  onRestore,
}: {
  resume: any;
  onDelete: () => void;
  onRestore?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  function handleGeneratePdf() {
    const cvData: CvData = resume.cvData ?? {};
    const contactInfo = cvData.contactInfo ?? ({} as SidebarContactInfo);
    const resumeItems = cvData.resumeItems ?? [];
    const projects = cvData.projects ?? [];
    const summary = cvData.summary ?? "";

    try {
      generateCV(contactInfo, resumeItems, projects, resume.locale as Locale, summary);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar PDF");
    }
  }

  const isDeleted = !!(resume as any).deletedAt;

  return (
    <Card className={isDeleted ? 'opacity-60 border-red-500/30' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{resume.title}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {resume.locale}
              </Badge>
              {isDeleted ? (
                <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
                  <ShieldAlert className="w-3 h-3" />
                  Deletado
                </span>
              ) : (
                <FitScoreBadge score={resume.fitScore} />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(resume.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {isDeleted ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-green-600 hover:text-green-700"
                onClick={onRestore}
                title="Restaurar"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={handleGeneratePdf}>
                  <FileDown className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExpanded(v => !v)}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground">{resume.fitComment}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-green-700 mb-1">Pontos Fortes</p>
              <ul className="space-y-1">
                {resume.strengths?.map((s: string, i: number) => (
                  <li key={i} className="text-xs flex gap-1">
                    <span className="text-green-500 shrink-0">+</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-red-700 mb-1">Pontos Fracos</p>
              <ul className="space-y-1">
                {resume.weaknesses?.map((w: string, i: number) => (
                  <li key={i} className="text-xs flex gap-1">
                    <span className="text-red-400 shrink-0">-</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição da vaga</p>
            <p className="text-xs text-muted-foreground line-clamp-3">{resume.jobDescription}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function AiResumes() {
  const isRoot = useIsRoot();
  const [title, setTitle] = useState("");
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"aiGeneratedResumes">; name: string } | null>(null);

  const resumes = useQuery(api.aiResumes.list, { includeDeleted: isRoot && includeDeleted });
  const generate = useAction(api.aiResumesAction.generate);
  const remove = useMutation(api.aiResumes.remove);
  const permanentDelete = useMutation(api.aiResumes.permanentDelete);
  const restore = useMutation(api.aiResumes.restore);

  async function handleGenerate() {
    if (!title.trim()) {
      toast.error("Informe um título para o currículo");
      return;
    }
    if (!jobDescription.trim()) {
      toast.error("Cole a descrição da vaga");
      return;
    }

    setLoading(true);
    try {
      await generate({ title: title.trim(), locale, jobDescription: jobDescription.trim() });
      toast.success("CV gerado com sucesso!");
      setTitle("");
      setJobDescription("");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar CV");
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(id: Id<"aiGeneratedResumes">, name: string) {
    setDeleteTarget({ id, name });
  }

  async function handleRestore(id: Id<"aiGeneratedResumes">) {
    try { await restore({ id }); toast.success("CV restaurado"); } catch (e: any) { toast.error(e?.message || "Erro"); }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Gerador de CV com IA</h1>
          </div>
          {isRoot && (
            <button
              onClick={() => setIncludeDeleted(!includeDeleted)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                includeDeleted
                  ? 'border-red-500/50 bg-red-500/10 text-red-400'
                  : 'border-foreground/10 bg-foreground/5 text-foreground/65 hover:text-foreground-strong'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {includeDeleted ? 'Ocultar deletados' : 'Ver deletados'}
            </button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova otimização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="cv-title">Título</Label>
                <Input
                  id="cv-title"
                  placeholder="Ex: Vaga Senior Frontend - Nubank"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Idioma</Label>
                <div className="flex border rounded-md overflow-hidden h-10">
                  <button
                    type="button"
                    onClick={() => setLocale("pt-BR")}
                    disabled={loading}
                    className={`flex-1 text-sm font-medium transition-colors ${
                      locale === "pt-BR"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    PT-BR
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("en-US")}
                    disabled={loading}
                    className={`flex-1 text-sm font-medium transition-colors ${
                      locale === "en-US"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    EN-US
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="job-desc">Descrição da vaga</Label>
              <Textarea
                id="job-desc"
                placeholder="Cole aqui a descrição completa da vaga..."
                rows={10}
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                disabled={loading}
                className="resize-none"
              />
            </div>

            <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando... (pode levar 20-40s)
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar CV
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {resumes && resumes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Histórico ({resumes.length})
            </h2>
            {resumes.map(resume => (
              <ResumeCard
                key={resume._id}
                resume={resume}
                onDelete={() => handleDelete(resume._id, resume.title)}
                onRestore={() => handleRestore(resume._id)}
              />
            ))}
          </div>
        )}

        {resumes !== undefined && resumes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum CV gerado ainda. Preencha o formulário acima para começar.
          </p>
        )}
      </div>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          await remove({ id: deleteTarget!.id });
          toast.success('CV excluído');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDelete({ id: deleteTarget!.id });
          toast.success('CV excluído permanentemente');
        } : undefined}
      />
    </AdminLayout>
  );
}
