import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Home, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function PaymentSuccessPage() {
  const { uniqueLink } = useParams<{ uniqueLink: string }>();
  const [, navigate] = useLocation();

  const checkout = useQuery(
    api.checkouts.getByLink,
    uniqueLink ? { uniqueLink } : "skip" as any,
  );

  const isLoading = checkout === undefined;

  useEffect(() => {
    if (!isLoading && checkout === null) {
      navigate('/');
    }
  }, [isLoading, checkout, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground-strong text-xl">Carregando...</div>
      </div>
    );
  }

  if (!checkout) {
    return null;
  }

  // A confirmação vem do webhook do Asaas e pode levar alguns segundos depois do
  // redirecionamento; a query é reativa e esta tela muda sozinha quando chegar.
  if (checkout.status === 'expired' || checkout.status === 'failed' || checkout.status === 'refunded') {
    const text =
      checkout.status === 'refunded'
        ? 'Este pagamento foi estornado.'
        : checkout.status === 'expired'
          ? 'Este link de pagamento expirou sem confirmação de pagamento.'
          : 'O pagamento não foi concluído.';
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-foreground/10">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-xl font-bold text-foreground-strong">Pagamento não confirmado</h2>
            <p className="text-foreground/65">{text}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkout.status !== 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-foreground/10">
          <CardContent className="p-6 text-center space-y-3">
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-neon-purple" />
            <h2 className="text-xl font-bold text-foreground-strong">Confirmando o pagamento</h2>
            <p className="text-foreground/65">
              Assim que o Asaas confirmar, esta página atualiza sozinha. Pagamentos com cartão costumam levar poucos segundos; boleto, até 3 dias úteis.
            </p>
            <Button variant="outline" className="border-foreground/10" onClick={() => navigate(`/checkout/${uniqueLink}`)}>
              Voltar ao checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-card border-foreground/10">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check className="w-16 h-16 text-green-600 dark:text-green-500" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl text-foreground-strong">Pagamento Realizado com Sucesso!</CardTitle>
            <p className="text-foreground/65 mt-2">Obrigado pela sua compra</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-foreground/5 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground/65">Descrição:</span>
                <span className="text-foreground-strong font-medium">{checkout.description || 'Pagamento'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-foreground/65">Valor Total:</span>
                <span className="text-2xl font-bold text-neon-purple">
                  {formatCurrency(((checkout as any).totalValue as number | undefined) ?? checkout.value ?? 0)}
                </span>
              </div>

              {(checkout as any).paymentMethod && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/65">Método de Pagamento:</span>
                  <span className="text-foreground-strong font-medium capitalize">
                    {(checkout as any).paymentMethod === 'pix' ? 'PIX' :
                     (checkout as any).paymentMethod === 'boleto' ? 'Boleto' :
                     (checkout as any).paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                     (checkout as any).paymentMethod}
                  </span>
                </div>
              )}

              {(checkout as any).installmentCount && (checkout as any).installmentCount > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/65">Parcelamento:</span>
                  <span className="text-foreground-strong font-medium">
                    {(checkout as any).installmentCount}x de {formatCurrency((checkout as any).installmentValue || 0)}
                  </span>
                </div>
              )}

              {checkout.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-foreground/65">Data:</span>
                  <span className="text-foreground-strong font-medium">
                    {new Date(checkout.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>


            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => navigate('/')}
                className="flex-1 bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground font-medium py-6"
              >
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
