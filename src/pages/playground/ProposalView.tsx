import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Calendar, DollarSign, AlertTriangle, FileCheck, FileText, ChevronDown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { DEFAULT_RESCISION_POLICY } from "@/constants/rescisionPolicy";
import ReactMarkdown from "react-markdown";
import { ContractModal } from "@/components/ContractModal";
import { generatePaymentMethods } from "@/utils/contractGenerator";
import { printContractPDF } from "@/utils/contractPDF";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import type { PlaygroundProposal } from "@/components/playground/PlaygroundProposalDialog";
import { Helmet } from "react-helmet-async";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

function toLegacyProposal(p: PlaygroundProposal) {
  return {
    id: p.id,
    slug: p.slug,
    version: 1,
    client_name: p.clientName,
    title: p.title,
    objective: p.objective,
    scope: p.scope,
    timeline: p.timeline,
    delivery_date: p.deliveryDate,
    investment_value: p.investmentValue,
    payment_methods: [],
    conditions: p.conditions,
    rescision_policy: p.rescissionPolicy,
    created_at: new Date(p.createdAt).toISOString(),
    is_accepted: p.isAccepted,
  };
}

export default function PlaygroundProposalView() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [proposals] = usePlaygroundStorage<PlaygroundProposal[]>("pg_proposals", []);
  const [isRescisionOpen, setIsRescisionOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { setIsVisible(true); }, []);

  const rawProposal = useMemo(() => proposals.find(p => p.slug === slug) ?? null, [proposals, slug]);
  const proposal = useMemo(() => rawProposal ? toLegacyProposal(rawProposal) : null, [rawProposal]);

  const contactInfo = useQuery(api.contactInfo.get);
  const isExpired = rawProposal ? Date.now() > rawProposal.expiresAt : false;

  const calculateValidUntil = (createdAt: number) => {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 10);
    return d.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleDownloadPDF = async () => {
    if (!proposal || !rawProposal?.acceptance) return;
    const a = rawProposal.acceptance;
    await printContractPDF(proposal, {
      client_name: a.clientName,
      client_document: a.clientDocument,
      client_email: a.clientEmail,
      client_role: a.clientRole,
      client_declaration: a.clientDeclaration,
      accepted_at: a.acceptedAt,
      ip_address: a.ipAddress ?? null,
      user_agent: a.userAgent ?? null,
      content_hash: a.contentHash,
      proposal_version: "1",
    }, a.signatureDataUrl, undefined);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 50 } },
  };

  if (!rawProposal) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p>Proposta não encontrada no playground.</p>
        <Button variant="outline" onClick={() => setLocation("/playground/proposal")}>Voltar</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{rawProposal.title || rawProposal.clientName} — Playground</title></Helmet>
      <div className="min-h-screen bg-background text-white font-sans selection:bg-neon-purple selection:text-white overflow-x-hidden">
        {/* Playground banner */}
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs text-center py-2 font-medium">
          Modo Demonstração — Esta é a visualização real da proposta, rodando com dados do playground
        </div>

        <div className="fixed inset-0 z-0 pointer-events-none no-print">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-neon-green/10 rounded-full blur-[120px]" />
          <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setLocation("/playground/proposal")}>
              <ArrowLeft className="w-4 h-4" />
              Voltar ao playground
            </Button>
          </div>

          {rawProposal.isAccepted && rawProposal.acceptance && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Esta proposta foi aceita eletronicamente</p>
                    <p className="text-sm text-green-300/80">
                      Aceita em {new Date(rawProposal.acceptance.acceptedAt).toLocaleString("pt-BR")} por {rawProposal.acceptance.clientName}
                    </p>
                  </div>
                </div>
                <Button onClick={handleDownloadPDF} className="bg-green-500 hover:bg-green-600 text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Baixar PDF do Contrato
                </Button>
              </div>
            </motion.div>
          )}

          {isExpired && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg mb-8 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <p className="font-medium">Atenção: Esta proposta expirou em {calculateValidUntil(rawProposal.createdAt)}.</p>
            </motion.div>
          )}

          <motion.div initial="hidden" animate={isVisible ? "visible" : "hidden"} variants={containerVariants} className="space-y-16">
            <motion.header variants={itemVariants} className="text-center space-y-6">
              <Badge variant="outline" className="border-neon-purple text-neon-purple px-4 py-1 text-sm uppercase tracking-widest">
                Proposta Comercial
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                {rawProposal.title || `Projeto para ${rawProposal.clientName}`}
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Preparado especialmente para <span className="text-white font-semibold">{rawProposal.clientName}</span>
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Calendar className="w-4 h-4 text-neon-purple" />
                  <span>Criado em: {new Date(rawProposal.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Clock className={`w-4 h-4 ${isExpired ? "text-red-500" : "text-neon-green"}`} />
                  <span className={isExpired ? "text-red-400" : ""}>Válido até: {calculateValidUntil(rawProposal.createdAt)}</span>
                </div>
              </div>
            </motion.header>

            <motion.section variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-8 md:p-10 space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-8 bg-neon-purple rounded-full" />
                    Apresentação
                  </h2>
                  <div className="text-lg text-gray-300 leading-relaxed space-y-4 whitespace-pre-line">
                    {contactInfo?.proposalIntro || (
                      <>
                        <p>Olá, tudo bem?</p>
                        <p>Antes de tudo, agradeço o interesse! Estamos aqui para transformar sua visão em uma solução elegante, escalável e inteligente.</p>
                        <p>Nossa expertise vai além de código — desenhamos arquiteturas escaláveis, definimos padrões de excelência e conduzimos decisões estratégicas que impactam produtos inteiros.</p>
                        <p>Vamos conversar sobre como isso pode funcionar no seu projeto?</p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardContent className="p-8 md:p-10 space-y-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <span className="w-1 h-8 bg-neon-purple rounded-full" />
                    Objetivo do Projeto
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">{rawProposal.objective}</p>
                </CardContent>
              </Card>
            </motion.section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.section variants={itemVariants}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-purple/30 transition-colors duration-300">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-neon-purple" />
                      Escopo dos Serviços
                    </h2>
                    <ul className="space-y-4">
                      {rawProposal.scope?.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-300 group/item">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon-purple group-hover/item:scale-150 transition-transform" />
                          <span className="group-hover/item:text-white transition-colors w-[95%]">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.section>

              <motion.section variants={itemVariants}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10 hover:border-neon-green/30 transition-colors duration-300">
                  <CardContent className="p-8 space-y-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Clock className="w-6 h-6 text-neon-lime" />
                      Cronograma Estimado
                    </h2>
                    <div className="relative pl-6">
                      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-neon-lime" />
                      <div className="space-y-8">
                        {rawProposal.timeline?.map((item, index) => (
                          <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={isVisible ? { opacity: 1, x: 0 } : {}} transition={{ delay: index * 0.1 }} className="group relative">
                            <div className="flex items-start gap-4">
                              <div className="relative shrink-0">
                                <div className="absolute left-[-18px] top-1.5 w-3 h-3 rounded-full bg-border border border-neon-green/40 group-hover:border-neon-green transition-all duration-300 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-neon-lime/50 group-hover:bg-neon-lime group-hover:scale-125 transition-all duration-300" />
                                </div>
                              </div>
                              <div className="flex-1 pt-0.5 space-y-1">
                                <h4 className="text-white font-semibold text-base group-hover:text-neon-green transition-colors duration-300">{item.step}</h4>
                                <p className="text-sm text-gray-400 font-light">{item.period}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    {rawProposal.deliveryDate && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400">Entrega prevista: <span className="text-white">{new Date(rawProposal.deliveryDate).toLocaleDateString("pt-BR")}</span></p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.section>
            </div>

            <motion.section variants={itemVariants}>
              <Card className="bg-gradient-to-br from-card to-black border-white/10 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neon-purple/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                      <h2 className="text-3xl font-bold text-white">Investimento Total</h2>
                      <p className="text-gray-400 max-w-md">Um investimento estratégico para elevar o nível do seu negócio e alcançar novos resultados.</p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter mb-2">
                        {formatCurrency(rawProposal.investmentValue)}
                      </div>
                      <Badge className="bg-neon-green/10 text-neon-green hover:bg-neon-green/20 border-neon-green/20">Pagamento Facilitado</Badge>
                    </div>
                  </div>
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/10 pt-8">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-neon-purple" />
                        Formas de Pagamento
                      </h3>
                      <ul className="space-y-2">
                        {generatePaymentMethods(rawProposal.investmentValue).map((method, idx) => (
                          <li key={idx} className="text-gray-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-500 rounded-full" />
                            {method}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-neon-purple" />
                        Condições Gerais
                      </h3>
                      <ul className="space-y-2">
                        {rawProposal.conditions?.map((c, idx) => (
                          <li key={idx} className="text-gray-400 flex items-center gap-2">
                            <div className="w-1 h-1 bg-gray-500 rounded-full" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            <motion.section variants={itemVariants}>
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <CardContent className="p-8 md:p-10 relative z-10">
                  <Collapsible open={isRescisionOpen} onOpenChange={setIsRescisionOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity cursor-pointer outline-none relative z-10">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="w-1 h-8 bg-neon-purple rounded-full" />
                        Política de Rescisão
                      </h2>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${isRescisionOpen ? "rotate-180" : ""}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="prose prose-invert prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300 prose-hr:border-white/10 max-w-none">
                        <ReactMarkdown>{rawProposal.rescissionPolicy || DEFAULT_RESCISION_POLICY}</ReactMarkdown>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </motion.section>

            {!rawProposal.isAccepted && (
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
                <Button
                  size="lg"
                  className="bg-neon-purple hover:bg-neon-purple/90 text-white h-14 px-8 w-full sm:w-auto"
                  onClick={() => setLocation(`/playground/proposal/${slug}/aceitar`)}
                >
                  <FileCheck className="mr-2 w-5 h-5" />
                  Aceitar Proposta Eletronicamente
                </Button>
              </motion.div>
            )}

            {rawProposal.isAccepted && rawProposal.acceptance && (
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-12">
                <Button size="lg" className="bg-neon-purple hover:bg-neon-purple/90 text-white h-14 px-8 w-full sm:w-auto" onClick={() => setShowContractModal(true)}>
                  <FileText className="mr-2 w-5 h-5" />
                  Ler Contrato
                </Button>
              </motion.div>
            )}

            <motion.footer variants={itemVariants} className="text-center border-t border-white/10 pt-8 pb-4">
              <p className="text-gray-500 text-sm">© {new Date().getFullYear()} {contactInfo?.name}. Todos os direitos reservados.</p>
              <p className="text-gray-600 text-xs mt-2">Esta proposta é confidencial e destinada apenas ao cliente especificado.</p>
            </motion.footer>
          </motion.div>
        </div>

        {rawProposal.isAccepted && rawProposal.acceptance && proposal && (
          <ContractModal
            open={showContractModal}
            onOpenChange={setShowContractModal}
            proposal={proposal}
            clientData={{
              client_name: rawProposal.acceptance.clientName,
              client_document: rawProposal.acceptance.clientDocument,
              client_email: rawProposal.acceptance.clientEmail,
              client_role: rawProposal.acceptance.clientRole ?? null,
              client_declaration: rawProposal.acceptance.clientDeclaration ?? null,
            }}
            sessionToken={null}
            onSign={async (sig) => {
              if (!proposal) return;
              const a = rawProposal.acceptance!;
              await printContractPDF(proposal, {
                client_name: a.clientName,
                client_document: a.clientDocument,
                client_email: a.clientEmail,
                client_role: a.clientRole,
                client_declaration: a.clientDeclaration,
                accepted_at: a.acceptedAt,
                ip_address: a.ipAddress ?? null,
                user_agent: a.userAgent ?? null,
                content_hash: a.contentHash,
                proposal_version: "1",
              }, sig, undefined);
              toast.success("PDF gerado!");
            }}
            isSigning={false}
          />
        )}
      </div>
    </>
  );
}
