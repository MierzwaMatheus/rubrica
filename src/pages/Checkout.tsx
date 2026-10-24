import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useAction } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../../convex/_generated/api";
import { installmentOptions, type InstallmentPlan } from "../../convex/lib/installments";
import { PaymentMethod } from "@/types/checkout";
import { Check, CreditCard, QrCode, FileText, AlertCircle, Loader2, Copy, ExternalLink } from "lucide-react";

type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";

const BILLING_TYPE: Record<PaymentMethod, BillingType> = {
  pix: "PIX",
  boleto: "BOLETO",
  credit_card: "CREDIT_CARD",
};

interface PixData {
  payload: string;
  image?: string;
  expiresAt?: number;
}

interface BoletoData {
  line?: string;
  url?: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

/** "AAAA-MM-DD" como data local (sem o deslocamento de fuso do `new Date(string)`). */
const formatDueDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d).toLocaleDateString("pt-BR") : date;
};

/** Mensagem do servidor (ConvexError com { code, message }) ou uma genérica. */
const paymentErrorMessage = (error: unknown): string => {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return "Não foi possível gerar o pagamento. Tente de novo em instantes.";
};

const copy = (text: string, message: string) => {
  navigator.clipboard.writeText(text);
  toast.success(message);
};

export default function CheckoutPage() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const [, navigate] = useLocation();

  const checkoutData = useQuery(
    api.checkouts.getByLink,
    uniqueLink ? { uniqueLink } : "skip",
  );
  const isLoading = checkoutData === undefined;
  const checkout = checkoutData ?? null;

  const initiatePayment = useAction(api.checkouts.initiatePayment);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<InstallmentPlan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [now, setNow] = useState(Date.now());

  // A confirmação chega pelo webhook do Asaas; a query é reativa e o status muda sozinho.
  useEffect(() => {
    if (checkout?.status === "paid") {
      navigate(`/payment-success/${uniqueLink}`);
    }
  }, [checkout?.status, uniqueLink, navigate]);

  // Relógio da página: vence o QR code do PIX e o próprio link sem precisar recarregar.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), pixData?.expiresAt ? 1000 : 30_000);
    return () => clearInterval(interval);
  }, [pixData?.expiresAt]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (method !== "credit_card") setSelectedInstallment(null);
  };

  const handleConfirmPayment = async (method: PaymentMethod | null = selectedPaymentMethod) => {
    if (!checkout || !method) return;
    if (method === "credit_card" && !selectedInstallment) {
      toast.error("Selecione o número de parcelas");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await initiatePayment({
        id: checkout._id,
        billingType: BILLING_TYPE[method],
        installmentCount: method === "credit_card" ? selectedInstallment?.count : undefined,
      });
      setShowConfirmDialog(false);

      if (result.billingType === "CREDIT_CARD") {
        if (!result.invoiceUrl) throw new Error("O Asaas não devolveu a página de pagamento.");
        // Os dados do cartão são digitados na página do Asaas, nunca neste site.
        window.location.assign(result.invoiceUrl);
        return;
      }
      if (result.billingType === "PIX") {
        setPixData({ payload: result.pixPayload ?? "", image: result.pixImage, expiresAt: result.pixExpiresAt });
      } else {
        setBoletoData({ line: result.bankSlipLine, url: result.bankSlipUrl });
      }
    } catch (error: unknown) {
      toast.error(paymentErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-neon-purple" />
          <p className="text-foreground/65">Carregando checkout...</p>
        </div>
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-foreground/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-foreground-strong mb-2">Checkout não encontrado</h2>
            <p className="text-foreground/65">O link de checkout é inválido ou expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkout.status === "paid" || checkout.status === "refunded") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-foreground/10">
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 mx-auto mb-4 text-green-700 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-foreground-strong mb-2">
              {checkout.status === "refunded" ? "Pagamento Estornado" : "Pagamento Realizado!"}
            </h2>
            <p className="text-foreground/65 mb-4">
              {checkout.status === "refunded" ? "Este pagamento foi estornado." : "Obrigado pelo pagamento."}
            </p>
            <div className="bg-foreground/5 rounded-lg p-4 mb-4">
              <p className="text-sm text-foreground/65">Valor pago</p>
              <p className="text-2xl font-bold text-neon-purple">{formatCurrency(checkout.totalValue ?? checkout.value)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkout.status === "expired" || checkout.expiresAt < now) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-foreground/10">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-foreground-strong mb-2">Checkout Expirado</h2>
            <p className="text-foreground/65">Este link de checkout expirou.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const options = installmentOptions(checkout.value);
  const allowed = (method: PaymentMethod) => !checkout.billingType || checkout.billingType === BILLING_TYPE[method];
  const pixSecondsLeft = pixData?.expiresAt ? Math.max(0, Math.floor((pixData.expiresAt - now) / 1000)) : null;

  const methodButton = (method: PaymentMethod, Icon: typeof QrCode, title: string, subtitle: string) => (
    <button
      onClick={() => handlePaymentMethodSelect(method)}
      className={`w-full p-4 rounded-lg border-2 transition-all ${
        selectedPaymentMethod === method
          ? "border-neon-purple bg-neon-purple/10"
          : "border-foreground/10 hover:border-foreground/20 bg-foreground/5"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${selectedPaymentMethod === method ? "text-neon-purple" : "text-foreground/65"}`} />
        <div className="text-left">
          <p className="text-foreground-strong font-medium">{title}</p>
          <p className="text-sm text-foreground/65">{subtitle}</p>
        </div>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground-strong mb-2">Checkout</h1>
            <p className="text-foreground/65">Confira os dados e escolha como pagar</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <Card className="bg-card border-foreground/10">
                <CardHeader>
                  <CardTitle className="text-foreground-strong flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-700 dark:text-green-400" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-foreground/65">Nome</p>
                    <p className="text-foreground-strong font-medium">{checkout.customerName}</p>
                  </div>
                  {checkout.customerEmail && (
                    <div>
                      <p className="text-sm text-foreground/65">E-mail</p>
                      <p className="text-foreground-strong font-medium">{checkout.customerEmail}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-foreground/10">
                <CardHeader>
                  <CardTitle className="text-foreground-strong">Detalhes do Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {checkout.description && (
                    <div>
                      <p className="text-sm text-foreground/65">Descrição</p>
                      <p className="text-foreground-strong font-medium">{checkout.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-foreground/65">Valor</p>
                    <p className="text-2xl font-bold text-neon-purple">{formatCurrency(checkout.value)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/65">Data de Vencimento</p>
                    <p className="text-foreground-strong font-medium">{formatDueDate(checkout.dueDate)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-card border-foreground/10">
                <CardHeader>
                  <CardTitle className="text-foreground-strong">Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allowed("pix") && methodButton("pix", QrCode, "PIX", "Pagamento instantâneo via QR Code")}
                  {allowed("boleto") && methodButton("boleto", FileText, "Boleto", "Compensação em até 3 dias úteis")}
                  {allowed("credit_card") &&
                    methodButton(
                      "credit_card",
                      CreditCard,
                      "Cartão de Crédito",
                      options.length > 1 ? `Parcele em até ${options.length}x, em ambiente seguro do Asaas` : "Em ambiente seguro do Asaas",
                    )}
                </CardContent>
              </Card>

              {selectedPaymentMethod === "credit_card" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="bg-card border-foreground/10">
                    <CardHeader>
                      <CardTitle className="text-foreground-strong">Parcelamento</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {options.map((option) => (
                          <button
                            key={option.count}
                            onClick={() => setSelectedInstallment(option)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              selectedInstallment?.count === option.count
                                ? "border-neon-purple bg-neon-purple/10"
                                : "border-foreground/10 hover:border-foreground/20 bg-foreground/5"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-foreground-strong font-medium">
                                  {option.count}x de {formatCurrency(option.value)}
                                </p>
                                {option.isInterestFree ? (
                                  <Badge variant="outline" className="border-green-500/50 text-green-700 dark:text-green-400 mt-1">
                                    Sem juros
                                  </Badge>
                                ) : (
                                  <p className="text-sm text-foreground/65 mt-1">
                                    Total: {formatCurrency(option.totalValue)}
                                    <span className="text-red-600 dark:text-red-400 ml-2">
                                      (+{option.interestRate}% + R$ 0,49)
                                    </span>
                                  </p>
                                )}
                              </div>
                              {selectedInstallment?.count === option.count && (
                                <Check className="w-5 h-5 text-neon-purple" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-foreground/65 mt-4">
                        Os dados do cartão são digitados na página de pagamento do Asaas, não neste site.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {selectedPaymentMethod && (
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={selectedPaymentMethod === "credit_card" && !selectedInstallment}
                  className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-medium py-6 text-lg"
                >
                  Continuar para Pagamento
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {pixData && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-foreground/10">
            <CardHeader>
              <CardTitle className="text-foreground-strong text-center">QR Code PIX</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pixData.image && (
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={`data:image/png;base64,${pixData.image}`}
                    alt="QR Code PIX"
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div>
                <p className="text-sm text-foreground/65 mb-2">Pix Copia e Cola:</p>
                <div className="bg-foreground/5 rounded-lg p-3">
                  <p className="text-xs text-foreground-strong break-all font-mono">{pixData.payload}</p>
                </div>
                <Button
                  onClick={() => copy(pixData.payload, "Código PIX copiado!")}
                  className="w-full mt-2 bg-neon-purple hover:bg-neon-purple/90"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código PIX
                </Button>
              </div>

              <div className="text-center space-y-1">
                {pixSecondsLeft !== null && (
                  <p className="text-sm text-foreground/65">
                    {pixSecondsLeft > 0
                      ? `Válido até ${new Date(pixData.expiresAt!).toLocaleString("pt-BR")}`
                      : "Este QR Code venceu."}
                  </p>
                )}
                {pixSecondsLeft === 0 && (
                  <Button
                    onClick={() => handleConfirmPayment("pix")}
                    disabled={isProcessing}
                    className="w-full bg-neon-purple hover:bg-neon-purple/90"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar novo QR Code"}
                  </Button>
                )}
                <p className="text-sm text-foreground/65 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando a confirmação do pagamento
                </p>
              </div>

              <Button onClick={() => setPixData(null)} variant="outline" className="w-full border-foreground/10">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {boletoData && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-foreground/10">
            <CardHeader>
              <CardTitle className="text-foreground-strong text-center">Boleto Bancário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {boletoData.line && (
                <div>
                  <p className="text-sm text-foreground/65 mb-2">Linha digitável:</p>
                  <div className="bg-foreground/5 rounded-lg p-3">
                    <p className="text-sm text-foreground-strong break-all font-mono">{boletoData.line}</p>
                  </div>
                  <Button
                    onClick={() => copy(boletoData.line!, "Linha digitável copiada!")}
                    className="w-full mt-2 bg-neon-purple hover:bg-neon-purple/90"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Linha Digitável
                  </Button>
                </div>
              )}

              {boletoData.url && (
                <Button asChild variant="outline" className="w-full border-foreground/10">
                  <a href={boletoData.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir boleto (PDF)
                  </a>
                </Button>
              )}

              <p className="text-xs text-foreground/65 text-center">
                A confirmação do boleto leva até 3 dias úteis. Esta página atualiza sozinha quando o pagamento for confirmado.
              </p>

              <Button onClick={() => setBoletoData(null)} variant="outline" className="w-full border-foreground/10">
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {showConfirmDialog && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md bg-card border-foreground/10">
            <CardHeader>
              <CardTitle className="text-foreground-strong">Confirmar Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-foreground/5 rounded-lg p-4">
                <p className="text-foreground/65 mb-2">Método selecionado:</p>
                {selectedPaymentMethod === "pix" && (
                  <>
                    <p className="text-foreground-strong font-medium flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-neon-purple" />
                      PIX
                    </p>
                    <p className="text-sm text-foreground/65 mt-2">O QR Code PIX será gerado após a confirmação.</p>
                  </>
                )}
                {selectedPaymentMethod === "boleto" && (
                  <>
                    <p className="text-foreground-strong font-medium flex items-center gap-2">
                      <FileText className="w-5 h-5 text-neon-purple" />
                      Boleto
                    </p>
                    <p className="text-sm text-foreground/65 mt-2">O boleto será gerado após a confirmação.</p>
                  </>
                )}
                {selectedPaymentMethod === "credit_card" && selectedInstallment && (
                  <>
                    <p className="text-foreground-strong font-medium flex items-center gap-2 mb-2">
                      <CreditCard className="w-5 h-5 text-neon-purple" />
                      Cartão de Crédito
                    </p>
                    <p className="text-neon-purple font-bold text-lg">
                      {selectedInstallment.count}x de {formatCurrency(selectedInstallment.value)}
                    </p>
                    <p className="text-sm text-foreground/65 mt-2">
                      Você vai para a página segura do Asaas para digitar os dados do cartão.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-foreground/5 rounded-lg p-4">
                <p className="text-foreground/65 mb-1">Valor a pagar:</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {formatCurrency(selectedInstallment?.totalValue ?? checkout.value)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isProcessing}
                  className="flex-1 border-foreground/10"
                >
                  Voltar
                </Button>
                <Button
                  onClick={() => handleConfirmPayment()}
                  disabled={isProcessing}
                  className="flex-1 bg-neon-purple hover:bg-neon-purple/90"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
