import { useState, useEffect, useMemo } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Copy, Trash2, Users, FileText, Receipt, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useIsRoot } from "@/hooks/useIsRoot";
import { ConvexAsaasApi } from "@/services/asaas/ConvexAsaasApi";
import { CreateCustomerUseCase } from "@/usecases/asaas/CreateCustomerUseCase";
import { ListCustomersUseCase } from "@/usecases/asaas/ListCustomersUseCase";
import { CreateChargeUseCase } from "@/usecases/asaas/CreateChargeUseCase";
import { ListChargesUseCase } from "@/usecases/asaas/ListChargesUseCase";
import { Customer, CreateCustomerInput, Charge, CreateChargeInput, Invoice } from "@/types/asaas";
import { CreateCheckoutInput } from "@/types/checkout";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function PaymentLinks() {
  const listCustomersAction = useAction(api.asaas.listCustomers);
  const createCustomerAction = useAction(api.asaas.adminCreateCustomer);
  const deleteCustomerAction = useAction(api.asaas.adminDeleteCustomer);
  const listChargesAction = useAction(api.asaas.listCharges);
  const getChargeAction = useAction(api.asaas.getCharge);
  const createChargeAction = useAction(api.asaas.adminCreateCharge);
  const cancelChargeAction = useAction(api.asaas.cancelCharge);
  const listInvoicesAction = useAction(api.asaas.listInvoices);
  const asaasApi = useMemo(
    () =>
      new ConvexAsaasApi({
        listCustomers: listCustomersAction,
        createCustomer: createCustomerAction,
        deleteCustomer: deleteCustomerAction,
        listCharges: listChargesAction,
        getCharge: getChargeAction,
        createCharge: createChargeAction,
        cancelCharge: cancelChargeAction,
        listInvoices: listInvoicesAction,
      }),
    [listCustomersAction, createCustomerAction, deleteCustomerAction, listChargesAction, getChargeAction, createChargeAction, cancelChargeAction, listInvoicesAction],
  );
  const createCustomerUseCase = new CreateCustomerUseCase(asaasApi);
  const listCustomersUseCase = new ListCustomersUseCase(asaasApi);
  const createChargeUseCase = new CreateChargeUseCase(asaasApi);
  const listChargesUseCase = new ListChargesUseCase(asaasApi);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CreateCustomerInput>({
    name: "",
    cpfCnpj: "",
    mobilePhone: "",
    company: "",
    email: "",
    phone: "",
  });

  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState<CreateChargeInput>({
    customer: "",
    billingType: "UNDEFINED",
    value: 0,
    dueDate: "",
    description: "",
  });

  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState<{
    customer_id: string;
    value: number;
    due_date: string;
    description: string;
  }>({
    customer_id: "",
    value: 0,
    due_date: "",
    description: "",
  });
  const [checkoutLink, setCheckoutLink] = useState<string>("");

  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [deleteCheckoutTarget, setDeleteCheckoutTarget] = useState<{ id: Id<"checkouts">; name?: string } | null>(null);

  const checkoutsData = useQuery(api.checkouts.listAdmin, { limit: 100, includeDeleted: isRoot && includeDeleted });
  const checkouts = checkoutsData ?? [];
  const createCheckout = useMutation(api.checkouts.create);
  const removeCheckout = useMutation(api.checkouts.remove);
  const permanentDeleteCheckout = useMutation(api.checkouts.permanentDelete);
  const restoreCheckout = useMutation(api.checkouts.restore);

  useEffect(() => {
    fetchCustomers();
    fetchCharges();
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await asaasApi.listInvoices(100);
      setInvoices(response.data);
      setInvoicesError(null);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      setInvoicesError(error?.message || "Erro ao carregar notas fiscais");
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await listCustomersUseCase.execute(100);
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      await createCustomerUseCase.execute(customerForm);
      toast.success("Cliente criado com sucesso!");
      setIsCustomerDialogOpen(false);
      setCustomerForm({
        name: "",
        cpfCnpj: "",
        mobilePhone: "",
        company: "",
        email: "",
        phone: "",
      });
      await fetchCustomers();
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error.message || "Erro ao criar cliente");
    }
  };

  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<string | null>(null);

  const handleDeleteCustomer = (customerId: string) => {
    setDeleteCustomerTarget(customerId);
  };

  const doDeleteCustomer = async (customerId: string) => {
    try {
      await asaasApi.deleteCustomer(customerId);
      toast.success("Cliente excluído com sucesso!");
      await fetchCustomers();
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Erro ao excluir cliente");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const formatCpfCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const fetchCharges = async () => {
    try {
      setIsLoading(true);
      const response = await listChargesUseCase.execute(100);
      setCharges(response.data);
    } catch (error) {
      console.error("Error fetching charges:", error);
      toast.error("Erro ao carregar cobranças");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCharge = async () => {
    try {
      await createChargeUseCase.execute(chargeForm);
      toast.success("Cobrança criada com sucesso!");
      setIsChargeDialogOpen(false);
      setChargeForm({
        customer: "",
        billingType: "UNDEFINED",
        value: 0,
        dueDate: "",
        description: "",
      });
      await fetchCharges();
    } catch (error: any) {
      console.error("Error creating charge:", error);
      toast.error(error.message || "Erro ao criar cobrança");
    }
  };

  const [deleteChargeTarget, setDeleteChargeTarget] = useState<string | null>(null);

  const handleDeleteCharge = (chargeId: string) => {
    setDeleteChargeTarget(chargeId);
  };

  const doDeleteCharge = async (chargeId: string) => {
    try {
      await asaasApi.deleteCharge(chargeId);
      toast.success("Cobrança excluída com sucesso!");
      await fetchCharges();
    } catch (error: any) {
      console.error("Error deleting charge:", error);
      toast.error(error.message || "Erro ao excluir cobrança");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || customerId;
  };

  const getCheckoutStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      payment_selected: { label: 'Aguardando pagamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      payment_confirmed: { label: 'Pagamento Confirmado', color: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
      paid: { label: 'Pago', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      completed: { label: 'Concluído', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
      failed: { label: 'Falhou', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      refunded: { label: 'Estornado', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
      expired: { label: 'Expirado', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-500/20 text-foreground/65 border-foreground/21' },
    };
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-500/20 text-foreground/65 border-foreground/21' };
    return <Badge variant="outline" className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const handleDeleteCheckout = (id: Id<"checkouts">, name?: string) => {
    setDeleteCheckoutTarget({ id, name });
  };

  const handleRestoreCheckout = async (id: Id<"checkouts">) => {
    try { await restoreCheckout({ id }); toast.success('Checkout restaurado'); } catch (e: any) { toast.error(e?.message || 'Erro'); }
  };

  const handleCreateCheckout = async () => {
    try {
      const customer = customers.find(c => c.id === checkoutForm.customer_id);
      if (!customer) {
        toast.error("Selecione um cliente");
        return;
      }

      const uniqueLink = generateUniqueLink();

      await createCheckout({
        uniqueLink,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email ?? "",
        customerCpfCnpj: customer.cpfCnpj ?? "",
        customerMobilePhone: customer.mobilePhone || undefined,
        customerCompany: customer.company || undefined,
        customerPhone: (customer as any).phone || undefined,
        value: checkoutForm.value,
        description: checkoutForm.description || undefined,
        dueDate: checkoutForm.due_date,
        // Sem expiresAt: vale o padrão de 30 dias. Um prazo curto cancelaria boletos
        // pagos que ainda estão compensando.
      });

      const link = `${window.location.origin}/checkout/${uniqueLink}`;
      setCheckoutLink(link);
      toast.success("Checkout criado com sucesso!");
      setIsCheckoutDialogOpen(false);
      setCheckoutForm({
        customer_id: "",
        value: 0,
        due_date: "",
        description: "",
      });
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast.error(error.message || "Erro ao criar checkout");
    }
  };

  /** O link funciona como senha de acesso ao checkout: precisa ser imprevisível. */
  function generateUniqueLink(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    while (result.length < 20) {
      for (const b of crypto.getRandomValues(new Uint8Array(32))) {
        // 248 = maior múltiplo de 62 abaixo de 256: descarta o resto para não enviesar.
        if (b < 248 && result.length < 20) result += chars[b % chars.length];
      }
    }
    return result;
  }


  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground-strong">Pagamentos</h1>
            <p className="text-foreground/65 mt-2">Gerencie clientes, cobranças e notas fiscais via Asaas</p>
          </div>
        </header>

        <Tabs defaultValue="customers" className="w-full">
          <TabsList className="bg-foreground/5 border border-foreground/10">
            <TabsTrigger value="customers" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <Users className="w-4 h-4 mr-2" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="charges" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <FileText className="w-4 h-4 mr-2" />
              Cobranças
            </TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple">
              <Receipt className="w-4 h-4 mr-2" />
              Nota Fiscal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="mt-6">
            <Card className="bg-card border-foreground/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>Gerencie os clientes cadastrados no Asaas</CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsCustomerDialogOpen(true)}
                    className="bg-neon-purple hover:bg-neon-purple/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Cliente
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-foreground/65">Carregando...</div>
                ) : customers.length === 0 ? (
                  <div className="text-center py-8 text-foreground/65">
                    Nenhum cliente cadastrado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-4 bg-foreground/5 rounded-lg border border-foreground/10 hover:bg-foreground/10 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-foreground-strong">
                              {customer.name}
                            </span>
                            {customer.company && (
                              <Badge variant="outline" className="border-foreground/20">
                                {customer.company}
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-foreground/20">
                              {customer.personType === 'FISICA' ? 'PF' : 'PJ'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-foreground/65">
                            {customer.cpfCnpj && (
                              <span>CPF/CNPJ: {formatCpfCnpj(customer.cpfCnpj)}</span>
                            )}
                            {customer.mobilePhone && (
                              <span>Celular: {formatPhone(customer.mobilePhone)}</span>
                            )}
                            {customer.email && (
                              <span>Email: {customer.email}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(customer.id)}
                            title="Copiar ID"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            title="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charges" className="mt-6">
            <Card className="bg-card border-foreground/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Checkouts</CardTitle>
                    <CardDescription>Gerencie os checkouts personalizados</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Button
                      onClick={() => setIsCheckoutDialogOpen(true)}
                      className="bg-neon-purple hover:bg-neon-purple/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Checkout
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-foreground/65">Carregando...</div>
                ) : checkouts.length === 0 ? (
                  <div className="text-center py-8 text-foreground/65">
                    Nenhum checkout criado ainda
                  </div>
                ) : (
                  <div className="space-y-3">
                    {checkouts.map((checkout: any) => (
                      <div
                        key={checkout._id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          checkout.deletedAt
                            ? 'bg-red-500/5 border-red-500/30 opacity-60'
                            : 'bg-foreground/5 border-foreground/10 hover:bg-foreground/10'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-medium text-foreground-strong">
                              {checkout.customerName}
                            </span>
                            {checkout.deletedAt ? (
                              <span className="flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5">
                                <ShieldAlert className="w-3 h-3" />
                                Deletado
                              </span>
                            ) : (
                              <>
                                {getCheckoutStatusBadge(checkout.status)}
                                {checkout.paymentMethod && (
                                  <Badge variant="outline" className="border-foreground/20">
                                    {checkout.paymentMethod === 'pix' ? 'PIX' : checkout.paymentMethod === 'boleto' ? 'Boleto' : 'Cartão'}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="border-neon-purple/50 text-neon-purple bg-neon-purple/10">
                                  {formatCurrency(checkout.value)}
                                </Badge>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-foreground/65">
                            <span>CPF/CNPJ: {formatCpfCnpj(checkout.customerCpfCnpj)}</span>
                            <span>Vencimento: {formatDate(checkout.dueDate)}</span>
                            {!checkout.deletedAt && <span>Link: {checkout.uniqueLink.substring(0, 8)}...</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 shrink-0">
                          {checkout.deletedAt ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRestoreCheckout(checkout._id)}
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                              title="Restaurar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const link = `${window.location.origin}/checkout/${checkout.uniqueLink}`;
                                  navigator.clipboard.writeText(link);
                                  toast.success("Link copiado!");
                                }}
                                title="Copiar link"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => window.open(`${window.location.origin}/checkout/${checkout.uniqueLink}`, "_blank")}
                                title="Abrir checkout"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteCheckout(checkout._id, checkout.customerName)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                title="Excluir checkout"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            <Card className="bg-card border-foreground/10">
              <CardHeader>
                <CardTitle>Nota Fiscal</CardTitle>
                <CardDescription>Gerencie as notas fiscais emitidas no Asaas</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesError ? (
                  <div className="text-center py-12 text-foreground/65">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{invoicesError}</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-12 text-foreground/65">
                    <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma nota fiscal emitida. As notas são emitidas e configuradas no painel do Asaas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 rounded-lg bg-foreground/5 border border-foreground/10 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-foreground-strong font-medium">{invoice.customerName || getCustomerName(invoice.customer)}</p>
                          <p className="text-sm text-foreground/65">
                            {invoice.invoiceNumber ? `Nº ${invoice.invoiceNumber} · ` : ""}
                            {invoice.description}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground-strong font-medium">{formatCurrency(invoice.value)}</p>
                          <Badge variant="outline">{invoice.statusDescription || invoice.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
          <DialogContent className="bg-card border-foreground/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Checkout</DialogTitle>
              <DialogDescription>
                Crie um link de checkout personalizado para o cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="checkout-customer">Cliente *</Label>
                <Select
                  value={checkoutForm.customer_id}
                  onValueChange={(value) => setCheckoutForm({ ...checkoutForm, customer_id: value })}
                >
                  <SelectTrigger className="mt-1 bg-foreground/5 border-foreground/10">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkout-value">Valor *</Label>
                  <Input
                    id="checkout-value"
                    type="number"
                    step="0.01"
                    value={checkoutForm.value}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, value: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-due-date">Data de Vencimento *</Label>
                  <Input
                    id="checkout-due-date"
                    type="date"
                    value={checkoutForm.due_date}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, due_date: e.target.value })}
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="checkout-description">Descrição (máx. 500 caracteres)</Label>
                <Input
                  id="checkout-description"
                  value={checkoutForm.description}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, description: e.target.value })}
                  placeholder="Descrição do pagamento"
                  className="mt-1 bg-foreground/5 border-foreground/10"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-foreground/10">
                <Button
                  variant="outline"
                  onClick={() => setIsCheckoutDialogOpen(false)}
                  className="border-foreground/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCheckout}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Checkout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {checkoutLink && (
          <Dialog open={!!checkoutLink} onOpenChange={() => setCheckoutLink("")}>
            <DialogContent className="bg-card border-foreground/10 max-w-md">
              <DialogHeader>
                <DialogTitle>Link de Checkout Criado!</DialogTitle>
                <DialogDescription>
                  Compartilhe este link com o cliente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-foreground/5 rounded-lg p-4">
                  <p className="text-sm text-foreground/65 mb-2">Link do checkout:</p>
                  <div className="flex gap-2">
                    <Input
                      value={checkoutLink}
                      readOnly
                      className="bg-foreground/5 border-foreground/10"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(checkoutLink);
                        toast.success("Link copiado!");
                      }}
                      className="bg-neon-purple hover:bg-neon-purple/90"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => window.open(checkoutLink, "_blank")}
                  className="w-full bg-neon-purple hover:bg-neon-purple/90"
                >
                  Abrir Link
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isChargeDialogOpen} onOpenChange={setIsChargeDialogOpen}>
          <DialogContent className="bg-card border-foreground/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Cobrança</DialogTitle>
              <DialogDescription>
                Crie uma nova cobrança no Asaas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="charge-customer">Cliente *</Label>
                <Select
                  value={chargeForm.customer}
                  onValueChange={(value) => setChargeForm({ ...chargeForm, customer: value })}
                >
                  <SelectTrigger className="mt-1 bg-foreground/5 border-foreground/10">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="charge-value">Valor *</Label>
                  <Input
                    id="charge-value"
                    type="number"
                    step="0.01"
                    value={chargeForm.value}
                    onChange={(e) => setChargeForm({ ...chargeForm, value: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
                <div>
                  <Label htmlFor="charge-due-date">Data de Vencimento *</Label>
                  <Input
                    id="charge-due-date"
                    type="date"
                    value={chargeForm.dueDate}
                    onChange={(e) => setChargeForm({ ...chargeForm, dueDate: e.target.value })}
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="charge-billing-type">Tipo de Cobrança *</Label>
                <Select
                  value={chargeForm.billingType}
                  onValueChange={(value: any) => setChargeForm({ ...chargeForm, billingType: value })}
                >
                  <SelectTrigger className="mt-1 bg-foreground/5 border-foreground/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDEFINED">Não definido</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="charge-description">Descrição (máx. 500 caracteres)</Label>
                <Input
                  id="charge-description"
                  value={chargeForm.description}
                  onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                  placeholder="Descrição da cobrança"
                  className="mt-1 bg-foreground/5 border-foreground/10"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-foreground/10">
                <Button
                  variant="outline"
                  onClick={() => setIsChargeDialogOpen(false)}
                  className="border-foreground/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCharge}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Cobrança
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
          <DialogContent className="bg-card border-foreground/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Cliente</DialogTitle>
              <DialogDescription>
                Cadastre um novo cliente no Asaas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="customer-name">Nome Completo *</Label>
                <Input
                  id="customer-name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder="Ex: Seu nome"
                  className="mt-1 bg-foreground/5 border-foreground/10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-cpf-cnpj">CPF/CNPJ *</Label>
                  <Input
                    id="customer-cpf-cnpj"
                    value={customerForm.cpfCnpj}
                    onChange={(e) => setCustomerForm({ ...customerForm, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-mobile-phone">Celular *</Label>
                  <Input
                    id="customer-mobile-phone"
                    value={customerForm.mobilePhone}
                    onChange={(e) => setCustomerForm({ ...customerForm, mobilePhone: e.target.value })}
                    placeholder="(11) 98823-2537"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-company">Empresa</Label>
                  <Input
                    id="customer-company"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="mt-1 bg-foreground/5 border-foreground/10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customer-phone">Telefone Fixo</Label>
                <Input
                  id="customer-phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                  placeholder="(11) 3333-4444"
                  className="mt-1 bg-foreground/5 border-foreground/10"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-foreground/10">
                <Button
                  variant="outline"
                  onClick={() => setIsCustomerDialogOpen(false)}
                  className="border-foreground/10"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateCustomer}
                  className="bg-neon-purple hover:bg-neon-purple/90"
                >
                  Criar Cliente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <DeleteConfirmDialog
        open={deleteCheckoutTarget !== null}
        onClose={() => setDeleteCheckoutTarget(null)}
        itemName={deleteCheckoutTarget?.name}
        onConfirm={async () => {
          await removeCheckout({ id: deleteCheckoutTarget!.id });
          toast.success('Checkout excluído');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDeleteCheckout({ id: deleteCheckoutTarget!.id });
          toast.success('Checkout excluído permanentemente');
        } : undefined}
      />

      <DeleteConfirmDialog
        open={deleteCustomerTarget !== null}
        onClose={() => setDeleteCustomerTarget(null)}
        onConfirm={async () => {
          await doDeleteCustomer(deleteCustomerTarget!);
        }}
      />

      <DeleteConfirmDialog
        open={deleteChargeTarget !== null}
        onClose={() => setDeleteChargeTarget(null)}
        onConfirm={async () => {
          await doDeleteCharge(deleteChargeTarget!);
        }}
      />
      </div>
    </AdminLayout>
  );
}

