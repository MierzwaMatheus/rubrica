import { useState, useEffect, useRef, useCallback } from "react";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, FileDown, Sparkles, ChevronDown, ChevronUp, Eye, EyeOff, Upload, FileText, X, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { usePlaygroundApiKey, usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Helmet } from "react-helmet-async";

type Locale = "pt-BR" | "en-US";
type Mode = "demo" | "production";

interface CvData {
  name?: string;
  title?: string;
  summary?: string;
  skills?: string[];
  experience?: Array<{ role: string; company: string; period: string; description: string }>;
  education?: Array<{ degree: string; institution: string; period: string }>;
  fitScore?: number;
  fitComment?: string;
  strengths?: string[];
  weaknesses?: string[];
}

interface StoredResume {
  id: string;
  title: string;
  locale: Locale;
  mode: Mode;
  jobDescription: string;
  cvData: CvData;
  fitScore: number;
  fitComment: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: number;
}

const STORAGE_KEY = "pg_ai_cv_result";
const PROGRESS_KEY = "pg_ai_cv_progress";

const CONVEX_SITE_URL = (import.meta.env.VITE_CONVEX_URL as string | undefined)
  ?.replace(".convex.cloud", ".convex.site")
  ?.replace(/\/$/, "");

// PDF generation adapted for playground (no real CV data, uses generated data)
function generatePlaygroundPDF(resume: StoredResume) {
  const cv = resume.cvData;
  const LABELS: Record<Locale, Record<string, string>> = {
    "pt-BR": { summary: "Resumo Profissional", skills: "Habilidades", experience: "Experiência", education: "Educação" },
    "en-US": { summary: "Professional Summary", skills: "Skills", experience: "Experience", education: "Education" },
  };
  const l = LABELS[resume.locale];

  // Build simple HTML and print
  const html = `
    <html><head><title>${resume.title}</title>
    <style>
      body { font-family: sans-serif; max-width: 800px; margin: 40px auto; color: #111; font-size: 13px; }
      h1 { font-size: 22px; margin: 0; } h2 { font-size: 15px; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 20px; }
      .sub { color: #555; margin: 2px 0 12px; } .skills { display: flex; flex-wrap: wrap; gap: 6px; }
      .skill { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
      .exp { margin-bottom: 10px; } .exp strong { display: block; } .exp span { color: #777; font-size: 12px; }
      .watermark { text-align: center; color: #ccc; font-size: 10px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
    </style></head><body>
    <h1>${cv.name ?? resume.title}</h1>
    ${cv.title ? `<p class="sub">${cv.title}</p>` : ""}
    ${cv.summary ? `<h2>${l.summary}</h2><p>${cv.summary}</p>` : ""}
    ${cv.skills?.length ? `<h2>${l.skills}</h2><div class="skills">${cv.skills.map(s => `<span class="skill">${s}</span>`).join("")}</div>` : ""}
    ${cv.experience?.length ? `<h2>${l.experience}</h2>${cv.experience.map(e => `<div class="exp"><strong>${e.role} — ${e.company}</strong><span>${e.period}</span><p>${e.description}</p></div>`).join("")}` : ""}
    ${cv.education?.length ? `<h2>${l.education}</h2>${cv.education.map(e => `<div class="exp"><strong>${e.degree}</strong><span>${e.institution} · ${e.period}</span></div>`).join("")}` : ""}
    <p class="watermark">Gerado via Playground — Demonstração · ${new Date().toLocaleDateString("pt-BR")}</p>
    </body></html>
  `;
  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); win.print(); }
}

function FitScoreBadge({ score }: { score: number }) {
  const color = score >= 70
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

function ResumeCard({ resume, onDelete }: { resume: StoredResume; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{resume.title}</CardTitle>
              <Badge variant="outline" className="text-xs">{resume.locale}</Badge>
              <Badge variant="outline" className="text-xs">{resume.mode === "production" ? "Pipeline completo" : "Demo"}</Badge>
              {resume.fitScore > 0 && <FitScoreBadge score={resume.fitScore} />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{new Date(resume.createdAt).toLocaleString("pt-BR")}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={() => generatePlaygroundPDF(resume)}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(v => !v)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          {resume.fitComment && <p className="text-sm text-muted-foreground">{resume.fitComment}</p>}
          {(resume.strengths?.length > 0 || resume.weaknesses?.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resume.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">Pontos Fortes</p>
                  <ul className="space-y-1">
                    {resume.strengths.map((s, i) => (
                      <li key={i} className="text-xs flex gap-1"><span className="text-green-500 shrink-0">+</span>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {resume.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-1">Pontos Fracos</p>
                  <ul className="space-y-1">
                    {resume.weaknesses.map((w, i) => (
                      <li key={i} className="text-xs flex gap-1"><span className="text-red-400 shrink-0">-</span>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Descrição da vaga</p>
            <p className="text-xs text-muted-foreground line-clamp-3">{resume.jobDescription}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function AiCvDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [apiKey, saveApiKey] = usePlaygroundApiKey();
  const [showKey, setShowKey] = useState(false);
  const [title, setTitle] = useState("");
  const [locale, setLocale] = useState<Locale>("pt-BR");
  const [mode, setMode] = useState<Mode>("demo");
  const [jobDescription, setJobDescription] = useState("");
  const [cvContent, setCvContent] = useState("");
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lostProgress, setLostProgress] = useState(false);
  const [resumes, setResumes, clearResumes] = usePlaygroundStorage<StoredResume[]>(STORAGE_KEY, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const prog = localStorage.getItem(PROGRESS_KEY);
      if (prog) {
        const { startedAt } = JSON.parse(prog) as { startedAt: number };
        if (Date.now() - startedAt < 10 * 60 * 1000) setLostProgress(true);
        localStorage.removeItem(PROGRESS_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!loading || mode !== "production") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Uma geração está em andamento. Sair agora consumirá créditos sem resultado.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading, mode]);

  const readFile = useCallback((file: File) => {
    if (!file.name.match(/\.(md|txt)$/i)) return toast.error("Apenas arquivos .md ou .txt são suportados");
    if (file.size > 100 * 1024) return toast.error("Arquivo muito grande (máximo 100KB)");
    const reader = new FileReader();
    reader.onload = (e) => { setCvContent(e.target?.result as string); setCvFileName(file.name); };
    reader.readAsText(file, "utf-8");
  }, []);

  async function handleGenerate() {
    if (!title.trim()) return toast.error("Informe um título para o currículo");
    if (!jobDescription.trim()) return toast.error("Cole a descrição da vaga");
    if (!apiKey.trim()) return toast.error("Insira sua chave OpenRouter");
    if (!CONVEX_SITE_URL) return toast.error("URL do servidor não configurada");

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    if (mode === "production") {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({ startedAt: Date.now() }));
    }

    try {
      const res = await fetch(`${CONVEX_SITE_URL}/playground/ai-proxy`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Session-Id": sessionId,
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          locale,
          mode,
          cvContent: cvContent.trim() || undefined,
        }),
      });

      const data = await res.json() as { cvData?: CvData; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? `Erro ${res.status}`);
        return;
      }

      const cv = data.cvData as CvData;
      const newResume: StoredResume = {
        id: crypto.randomUUID(),
        title: title.trim(),
        locale,
        mode,
        jobDescription: jobDescription.trim(),
        cvData: cv,
        fitScore: cv.fitScore ?? 0,
        fitComment: cv.fitComment ?? "",
        strengths: cv.strengths ?? [],
        weaknesses: cv.weaknesses ?? [],
        createdAt: Date.now(),
      };

      setResumes(prev => [newResume, ...prev]);
      toast.success("CV gerado com sucesso!");
      setTitle("");
      setJobDescription("");

      try {
        await logEvent({ sessionId, eventType: "playground.ai_cv_generated", metadata: { mode, locale }, userAgent: navigator.userAgent });
      } catch { /* non-fatal */ }
    } catch (err) {
      if ((err as Error).name !== "AbortError") toast.error((err as Error).message ?? "Erro ao gerar CV");
    } finally {
      setLoading(false);
      localStorage.removeItem(PROGRESS_KEY);
    }
  }

  return (
    <>
      <Helmet><title>CV com IA — Playground</title></Helmet>
      <PlaygroundLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Gerador de CV com IA</h1>
          </div>

          {/* Lost progress warning */}
          {lostProgress && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-300">Parece que você recarregou a página durante uma geração. Os créditos podem ter sido consumidos. Desculpe!</p>
              <button onClick={() => setLostProgress(false)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {/* API Key + transparency */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-400" />Sua chave OpenRouter (BYOAK)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={e => saveApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10 font-mono text-xs"
                />
                <button type="button" onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>Sua chave é transmitida via HTTPS, usada imediatamente e <strong className="text-foreground/80">nunca armazenada</strong>. Apenas um fingerprint SHA-256 de 8 caracteres é registrado no audit log. Chave salva em sessionStorage — apagada ao fechar a aba.</span>
              </div>
            </CardContent>
          </Card>

          {/* Generate form */}
          <Card>
            <CardHeader><CardTitle className="text-base">Nova otimização</CardTitle></CardHeader>
            <CardContent className="space-y-4">

              {/* Mode toggle */}
              <div className="space-y-1.5">
                <Label>Modo de geração</Label>
                <div className="flex border rounded-md overflow-hidden h-10">
                  <button type="button" onClick={() => setMode("demo")} disabled={loading}
                    className={`flex-1 text-sm font-medium transition-colors ${mode === "demo" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                    Demo (rápido, ~$0,001)
                  </button>
                  <button type="button" onClick={() => setMode("production")} disabled={loading}
                    className={`flex-1 text-sm font-medium transition-colors ${mode === "production" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
                    Pipeline completo (~$0,60 · ~5min)
                  </button>
                </div>
                {mode === "production" && (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Não feche nem recarregue a página durante a geração — os créditos são consumidos mesmo assim.
                  </p>
                )}
                {mode === "demo" && (
                  <p className="text-xs text-muted-foreground">Usa google/gemini-2.0-flash-001. Rápido e barato, ideal para testar.</p>
                )}
                {mode === "production" && (
                  <p className="text-xs text-muted-foreground">Pipeline: Gemini (análise da vaga) → GPT-4o mini (score ATS) → Claude Sonnet (reescrita). Mesmo pipeline usado no admin real.</p>
                )}
              </div>

              {/* Title + Locale */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="cv-title">Título</Label>
                  <Input id="cv-title" placeholder="Ex: Vaga Senior Frontend - Nubank" value={title} onChange={e => setTitle(e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <Label>Idioma do CV gerado</Label>
                  <div className="flex border rounded-md overflow-hidden h-10">
                    <button type="button" onClick={() => setLocale("pt-BR")} disabled={loading}
                      className={`flex-1 text-sm font-medium transition-colors ${locale === "pt-BR" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>PT-BR</button>
                    <button type="button" onClick={() => setLocale("en-US")} disabled={loading}
                      className={`flex-1 text-sm font-medium transition-colors ${locale === "en-US" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>EN-US</button>
                  </div>
                </div>
              </div>

              {/* CV upload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Seu currículo atual <span className="font-normal text-muted-foreground">(opcional · .md ou .txt)</span></Label>
                  {cvFileName && (
                    <button onClick={() => { setCvContent(""); setCvFileName(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" /> remover
                    </button>
                  )}
                </div>
                {cvFileName ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/5">
                    <FileText className="h-4 w-4 text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">{cvFileName}</p>
                      <p className="text-xs text-muted-foreground">{cvContent.length} caracteres</p>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex items-center justify-center gap-2 h-16 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${isDragging ? "border-neon-purple bg-neon-purple/10" : "border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5"}`}
                  >
                    <Upload className="h-4 w-4 text-muted-foreground/60" />
                    <span className="text-xs text-muted-foreground">Arraste ou <span className="text-neon-purple">clique para selecionar</span></span>
                    <input ref={fileInputRef} type="file" accept=".md,.txt" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ""; }} />
                  </div>
                )}
                <p className="text-xs text-muted-foreground/60">Sem CV: a IA gera um exemplo realista. Com CV: adapta seu currículo real para a vaga.</p>
              </div>

              {/* Job description */}
              <div className="space-y-1.5">
                <Label htmlFor="job-desc">Descrição da vaga</Label>
                <Textarea id="job-desc" placeholder="Cole aqui a descrição completa da vaga..." rows={10} value={jobDescription} onChange={e => setJobDescription(e.target.value)} disabled={loading} className="resize-none" />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleGenerate} disabled={loading || !apiKey} className="sm:w-auto">
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{mode === "production" ? "Gerando pipeline... (~5min)" : "Gerando..."}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />Gerar CV</>
                  )}
                </Button>
                {loading && mode === "production" && (
                  <Button variant="outline" onClick={() => abortRef.current?.abort()} className="text-red-400 border-red-400/30">Cancelar</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {resumes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Histórico ({resumes.length})</h2>
                <button onClick={clearResumes} className="text-xs text-muted-foreground hover:text-foreground">limpar tudo</button>
              </div>
              {resumes.map(r => (
                <ResumeCard key={r.id} resume={r} onDelete={() => setResumes(prev => prev.filter(x => x.id !== r.id))} />
              ))}
            </div>
          )}

          {resumes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum CV gerado ainda. Preencha o formulário acima para começar.</p>
          )}
        </div>
      </PlaygroundLayout>
    </>
  );
}
