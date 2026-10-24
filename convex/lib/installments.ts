/**
 * Parcelamento no cartão. Usado pela página de checkout (para mostrar as opções) e
 * pelo servidor (para definir o valor cobrado): o valor final nunca vem do navegador.
 *
 * Até 3x sem juros. De 4x a 6x e de 7x a 12x, repassa ao cliente uma taxa
 * percentual + R$ 0,49, como as taxas de parcelamento do Asaas.
 */

export const MAX_INSTALLMENTS = 12;

/** O Asaas não aceita parcela abaixo de R$ 5. */
export const MIN_INSTALLMENT_VALUE = 5;

export interface InstallmentPlan {
  count: number;
  /** Valor de cada parcela, em reais. */
  value: number;
  /** Total cobrado, em reais. */
  totalValue: number;
  interestRate?: number;
  interestAmount?: number;
  isInterestFree: boolean;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function installmentPlan(value: number, count: number): InstallmentPlan {
  if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENTS) {
    throw new Error(`Número de parcelas inválido: use de 1 a ${MAX_INSTALLMENTS}.`);
  }
  if (count <= 3) {
    return { count, value: round2(value / count), totalValue: round2(value), isInterestFree: true };
  }
  const interestRate = count <= 6 ? 3.49 : 3.99;
  const interestAmount = round2(value * (interestRate / 100) + 0.49);
  const totalValue = round2(value + interestAmount);
  return {
    count,
    value: round2(totalValue / count),
    totalValue,
    interestRate,
    interestAmount,
    isInterestFree: false,
  };
}

/** Maior número de parcelas em que cada uma fica acima do mínimo do Asaas. */
export function maxInstallmentsFor(value: number): number {
  let max = 1;
  for (let n = 2; n <= MAX_INSTALLMENTS; n++) {
    if (installmentPlan(value, n).value >= MIN_INSTALLMENT_VALUE) max = n;
  }
  return max;
}

export function installmentOptions(value: number): InstallmentPlan[] {
  return Array.from({ length: maxInstallmentsFor(value) }, (_, i) => installmentPlan(value, i + 1));
}
