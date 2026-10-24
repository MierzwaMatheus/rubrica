import { useState } from "react";
import { PlaygroundLayout } from "@/components/PlaygroundLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Trash2, Users, FileText, QrCode } from "lucide-react";
import { toast } from "sonner";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Helmet } from "react-helmet-async";

interface Customer { id: string; name: string; email: string; cpfCnpj: string; mobilePhone: string; company: string; createdAt: number; }
interface Checkout { id: string; uniqueLink: string; customerName: string; customerEmail: string; value: number; description: string; dueDate: string; billingType: "PIX" | "BOLETO" | "CREDIT_CARD"; status: "pending" | "paid" | "expired"; createdAt: number; }

export default function PaymentLinkDemo() {
  const sessionId = usePlaygroundSession();
  const logEvent = useMutation(api.playground.logEvent);
  const [customers, setCustomers] = usePlaygroundStorage<Customer[]>("pg_customers", []);
  const [checkouts, setCheckouts] = usePlaygroundStorage<Checkout[]>("pg_checkouts", []);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [previewCheckout, setPreviewCheckout] = useState<Checkout | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", cpfCnpj: "", mobilePhone: "", company: "" });
  const [chargeForm, setChargeForm] = useState({ customerId: "", value: "", dueDate: "", description: "", billingType: "PIX" as "PIX" | "BOLETO" | "CREDIT_CARD" });

  const handleCreateCustomer = () => {
    if (!customerForm.name || !customerForm.cpfCnpj) return toast.error("Nome e CPF/CNPJ obrigatórios");
    const c: Customer = { id: crypto.randomUUID(), ...customerForm, createdAt: Date.now() };
    setCustomers(prev => [c, ...prev]);
    toast.success("Cliente criado!");
    setIsCustomerDialogOpen(false);
    setCustomerForm({ name: "", email: "", cpfCnpj: "", mobilePhone: "", company: "" });
  };

  const handleCreateCharge = async () => {
    if (!chargeForm.customerId || !chargeForm.value || !chargeForm.dueDate) return toast.error("Preencha os campos obrigatórios");
    const customer = customers.find(c => c.id === chargeForm.customerId);
    if (!customer) return toast.error("Cliente não encontrado");
    const link = crypto.randomUUID().slice(0, 10).toUpperCase();
    const checkout: Checkout = {
      id: crypto.randomUUID(),
      uniqueLink: link,
      customerName: customer.name,
      customerEmail: customer.email,
      value: Number(chargeForm.value),
      description: chargeForm.description,
      dueDate: chargeForm.dueDate,
      billingType: chargeForm.billingType,
      status: "pending",
      createdAt: Date.now(),
    };
    setCheckouts(prev => [checkout, ...prev]);
    toast.success("Cobrança criada!");
    setIsChargeDialogOpen(false);
    try { await logEvent({ sessionId, eventType: "playground.payment_link_created", metadata: { value: chargeForm.value, billingType: chargeForm.billingType }, userAgent: navigator.userAgent }); } catch { /* */ }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/checkout/${link}`);
    toast.success("Link copiado!");
  };

  const markPaid = (id: string) => {
    setCheckouts(prev => prev.map(c => c.id === id ? { ...c, status: "paid" } : c));
    toast.success("Marcado como pago!");
  };

  const statusBadge = (status: Checkout["status"]) => {
    const map = { pending: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", paid: "text-green-400 border-green-500/30 bg-green-500/10", expired: "text-red-400 border-red-500/30 bg-red-500/10" };
    const labels = { pending: "Pendente", paid: "Pago", expired: "Expirado" };
    return <Badge variant="outline" className={`text-xs ${map[status]}`}>{labels[status]}</Badge>;
  };

  return (
    <>
      <Helmet><title>Links de Pagamento — Playground</title></Helmet>
      <PlaygroundLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Links de Pagamento</h1>

          <Tabs defaultValue="customers">
            <TabsList>
              <TabsTrigger value="customers" className="gap-2"><Users className="h-4 w-4" />Clientes ({customers.length})</TabsTrigger>
              <TabsTrigger value="charges" className="gap-2"><FileText className="h-4 w-4" />Cobranças ({checkouts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="customers" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsCustomerDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Cliente</Button>
              </div>
              {customers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">Nenhum cliente cadastrado ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customers.map(c => (
                    <Card key={c.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{c.name}</CardTitle>
                        <CardDescription className="text-xs">{c.email}</CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground space-y-1">
                        <p>CPF/CNPJ: {c.cpfCnpj}</p>
                        {c.mobilePhone && <p>Tel: {c.mobilePhone}</p>}
                        {c.company && <p>Empresa: {c.company}</p>}
                        <div className="flex justify-end pt-2">
                          <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => setCustomers(prev => prev.filter(x => x.id !== c.id))}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="charges" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button onClick={() => setIsChargeDialogOpen(true)} disabled={customers.length === 0} className="gap-2">
                  <Plus className="h-4 w-4" />Nova Cobrança
                </Button>
              </div>
              {customers.length === 0 && <p className="text-xs text-muted-foreground text-center">Cadastre um cliente primeiro para criar cobranças.</p>}
              {checkouts.length === 0 && customers.length > 0 && <p className="text-sm text-muted-foreground text-center py-12">Nenhuma cobrança criada ainda.</p>}
              {checkouts.length > 0 && (
                <div className="space-y-3">
                  {checkouts.map(ch => (
                    <Card key={ch.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">R$ {ch.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                            <Badge variant="outline" className="text-xs">{ch.billingType}</Badge>
                            {statusBadge(ch.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.customerName} · {ch.description || "Sem descrição"}</p>
                          <p className="text-xs text-muted-foreground">Vence: {new Date(ch.dueDate).toLocaleDateString("pt-BR")} · Link: {ch.uniqueLink}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyLink(ch.uniqueLink)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setPreviewCheckout(ch)}><QrCode className="h-3.5 w-3.5" /></Button>
                          {ch.status === "pending" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => markPaid(ch.id)}>Marcar pago</Button>}
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setCheckouts(prev => prev.filter(x => x.id !== ch.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Customer dialog */}
        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle><DialogDescription>Dados para cadastro simulado</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Nome *</Label><Input value={customerForm.name} onChange={e => setCustomerForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>CPF/CNPJ *</Label><Input value={customerForm.cpfCnpj} onChange={e => setCustomerForm(p => ({ ...p, cpfCnpj: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>E-mail</Label><Input type="email" value={customerForm.email} onChange={e => setCustomerForm(p => ({ ...p, email: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Celular</Label><Input value={customerForm.mobilePhone} onChange={e => setCustomerForm(p => ({ ...p, mobilePhone: e.target.value }))} /></div>
                <div className="col-span-2 space-y-1.5"><Label>Empresa</Label><Input value={customerForm.company} onChange={e => setCustomerForm(p => ({ ...p, company: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCustomer}>Criar cliente</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Charge dialog */}
        <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Cobrança</DialogTitle><DialogDescription>Link de pagamento simulado</DialogDescription></DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <Select value={chargeForm.customerId} onValueChange={v => setChargeForm(p => ({ ...p, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Valor (R$) *</Label><Input type="number" value={chargeForm.value} onChange={e => setChargeForm(p => ({ ...p, value: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label>Vencimento *</Label><Input type="date" value={chargeForm.dueDate} onChange={e => setChargeForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              </div>
              <div className="space-y-1.5"><Label>Descrição</Label><Input value={chargeForm.description} onChange={e => setChargeForm(p => ({ ...p, description: e.target.value }))} /></div>
              <div className="space-y-1.5">
                <Label>Método *</Label>
                <Select value={chargeForm.billingType} onValueChange={v => setChargeForm(p => ({ ...p, billingType: v as "PIX" | "BOLETO" | "CREDIT_CARD" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsChargeDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreateCharge}>Criar cobrança</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkout preview */}
        <Dialog open={!!previewCheckout} onOpenChange={() => setPreviewCheckout(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Checkout Simulado</DialogTitle><DialogDescription>Como o cliente veria a página de pagamento</DialogDescription></DialogHeader>
            {previewCheckout && (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-foreground/10 bg-foreground/5 text-center">
                  <p className="text-2xl font-bold">R$ {previewCheckout.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-muted-foreground">{previewCheckout.description || "Pagamento"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Para: {previewCheckout.customerName}</p>
                </div>
                {previewCheckout.billingType === "PIX" && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-lg"><QrCode className="h-28 w-28 text-black" /></div>
                    <p className="text-xs text-muted-foreground">No sistema real, este seria um QR Code PIX gerado pelo Asaas</p>
                  </div>
                )}
                {previewCheckout.billingType === "BOLETO" && (
                  <div className="text-center">
                    <Button variant="outline" onClick={() => toast.info("No sistema real, o PDF do boleto seria baixado via Asaas")}>Baixar Boleto (simulado)</Button>
                  </div>
                )}
                {previewCheckout.billingType === "CREDIT_CARD" && (
                  <div className="text-center">
                    <Button onClick={() => toast.success("Pagamento simulado aprovado! No sistema real, o cartão seria digitado na página segura do Asaas.")}>Pagar com Cartão (simulado)</Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </PlaygroundLayout>
    </>
  );
}
