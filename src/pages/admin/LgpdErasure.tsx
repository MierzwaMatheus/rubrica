import { useState } from "react";
import { AdminLayout } from "./Dashboard";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert, Search, Trash2, FileDown, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ExportResult = {
  proposals: unknown[];
  contacts: unknown[];
  testimonials: unknown[];
  checkouts: unknown[];
} | null;

export default function AdminLgpdErasure() {
  const [searchEmail, setSearchEmail] = useState("");
  const [searchDoc, setSearchDoc] = useState("");
  const [activeEmail, setActiveEmail] = useState<string | undefined>();
  const [activeDoc, setActiveDoc] = useState<string | undefined>();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isErasing, setIsErasing] = useState(false);

  const requestErasure = useMutation(api.proposals.requestErasure);

  const exportData = useQuery(
    api.proposals.exportTitularData,
    activeEmail || activeDoc
      ? { email: activeEmail, clientDocument: activeDoc }
      : "skip",
  ) as ExportResult;

  const hasSearch = !!activeEmail || !!activeDoc;
  const hasData = exportData && (
    exportData.proposals.length > 0 ||
    exportData.contacts.length > 0 ||
    exportData.testimonials.length > 0 ||
    exportData.checkouts.length > 0
  );

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const email = searchEmail.trim().toLowerCase() || undefined;
    const doc = searchDoc.replace(/\D/g, "") || undefined;
    if (!email && !doc) {
      toast.error("Informe e-mail ou CPF/CNPJ para buscar.");
      return;
    }
    setActiveEmail(email);
    setActiveDoc(doc);
  }

  async function handleErasure() {
    setIsErasing(true);
    try {
      const result = await requestErasure({ email: activeEmail, clientDocument: activeDoc });
      toast.success(`Dados anonimizados com sucesso. ${result.anonymized} registros afetados.`);
      setActiveEmail(undefined);
      setActiveDoc(undefined);
      setSearchEmail("");
      setSearchDoc("");
    } catch (err: unknown) {
      toast.error((err as Error)?.message ?? "Erro ao anonimizar dados.");
    } finally {
      setIsErasing(false);
      setConfirmOpen(false);
    }
  }

  function handleExportJson() {
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lgpd-export-${activeEmail ?? activeDoc ?? "titular"}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-neon-purple" />
          <div>
            <h1 className="text-2xl font-bold text-foreground-strong">LGPD — Gestão de Titulares</h1>
            <p className="text-sm text-foreground/65 mt-0.5">
              Busca, exportação e exclusão de dados pessoais por titular. Somente root.
            </p>
          </div>
        </div>

        {/* Busca */}
        <Card className="bg-card border-foreground/10">
          <CardHeader>
            <CardTitle className="text-foreground-strong text-base">Identificar titular</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="email" className="text-foreground/65 text-xs">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="titular@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="bg-background border-foreground/10 text-foreground-strong"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="doc" className="text-foreground/65 text-xs">CPF / CNPJ (só números)</Label>
                <Input
                  id="doc"
                  placeholder="000.000.000-00"
                  value={searchDoc}
                  onChange={(e) => setSearchDoc(e.target.value)}
                  className="bg-background border-foreground/10 text-foreground-strong"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" variant="outline" className="border-foreground/20 text-foreground-strong gap-2">
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        {hasSearch && (
          <Card className="bg-card border-foreground/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground-strong text-base">
                Dados encontrados
                {exportData === undefined && (
                  <span className="ml-2 text-foreground/65 text-xs font-normal">carregando…</span>
                )}
              </CardTitle>
              {hasData && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-foreground/20 text-foreground-strong gap-2"
                    onClick={handleExportJson}
                  >
                    <FileDown className="w-4 h-4" />
                    Exportar JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Anonimizar tudo
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {exportData !== undefined && !hasData && (
                <p className="text-foreground/65 text-sm">Nenhum dado pessoal encontrado para esse titular.</p>
              )}
              {exportData && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SummaryCard label="Propostas assinadas" count={exportData.proposals.length} />
                  <SummaryCard label="Contatos" count={exportData.contacts.length} />
                  <SummaryCard label="Depoimentos" count={exportData.testimonials.length} />
                  <SummaryCard label="Checkouts" count={exportData.checkouts.length} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Confirmação de erasure */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent className="bg-card border-foreground/10">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground-strong flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Confirmar anonimização
              </AlertDialogTitle>
              <AlertDialogDescription className="text-foreground/65 space-y-2">
                <span className="block">
                  Esta operação irá substituir todos os dados pessoais deste titular por
                  <strong className="text-foreground-strong"> [ANONIMIZADO]</strong> em todas as tabelas.
                </span>
                <span className="block">
                  A operação é <strong className="text-red-400">irreversível</strong>. Os registros em si
                  (propostas, contatos, etc.) são mantidos para fins de integridade, mas sem identificação pessoal.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-foreground/20 text-foreground-strong bg-transparent">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleErasure}
                disabled={isErasing}
              >
                {isErasing ? "Anonimizando…" : "Confirmar anonimização"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-lg border border-foreground/10 bg-background p-3 space-y-1">
      <p className="text-xs text-foreground/65">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold text-foreground-strong">{count}</span>
        {count > 0 && <Badge variant="destructive" className="text-xs">PII</Badge>}
      </div>
    </div>
  );
}
