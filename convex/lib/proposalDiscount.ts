// Desconto de proposta: valor original (antes do desconto) e itens do escopo
// que vão de brinde. `investmentValue` é sempre o valor final.
// Puro: usado pelo Convex (validação) e pelo front (exibição e contrato).

export interface GiftItem {
  scopeIndex: number;
  value: number;
}

export interface DiscountInput {
  investmentValue: number;
  originalValue?: number | null;
  giftItems?: GiftItem[] | null;
}

export function validateDiscount(input: DiscountInput & { scopeLength: number }): void {
  const { investmentValue, originalValue, scopeLength } = input;
  const gifts = input.giftItems ?? [];
  const hasOriginal = originalValue !== undefined && originalValue !== null;

  if (hasOriginal && originalValue <= investmentValue) {
    throw new Error('Valor original precisa ser maior que o valor do projeto');
  }
  if (gifts.length === 0) return;
  if (!hasOriginal) {
    throw new Error('Item de brinde precisa de um valor original (antes do desconto)');
  }

  const seen = new Set<number>();
  for (const gift of gifts) {
    if (!Number.isInteger(gift.scopeIndex) || gift.scopeIndex < 0 || gift.scopeIndex >= scopeLength) {
      throw new Error('Item de brinde não existe no escopo');
    }
    if (seen.has(gift.scopeIndex)) {
      throw new Error('O mesmo item do escopo está marcado como brinde mais de uma vez');
    }
    seen.add(gift.scopeIndex);
    if (!(gift.value > 0)) {
      throw new Error('O valor do brinde precisa ser maior que zero');
    }
  }

  const giftTotal = gifts.reduce((sum, g) => sum + g.value, 0);
  // Tolerância de centavo para somas com ponto flutuante.
  if (giftTotal - (originalValue - investmentValue) > 0.005) {
    throw new Error('A soma dos brindes passa do desconto total');
  }
}

export interface DiscountSummary {
  hasDiscount: boolean;
  originalValue: number;
  finalValue: number;
  discountAmount: number;
  discountPercent: number;
  giftTotal: number;
  gifts: GiftItem[];
  giftFor: (scopeIndex: number) => GiftItem | undefined;
}

export function summarizeDiscount(input: DiscountInput): DiscountSummary {
  const finalValue = input.investmentValue;
  const original = input.originalValue ?? undefined;
  const hasDiscount = original !== undefined && original > finalValue;
  const gifts = hasDiscount ? [...(input.giftItems ?? [])] : [];
  const originalValue = hasDiscount ? original : finalValue;
  const discountAmount = originalValue - finalValue;

  return {
    hasDiscount,
    originalValue,
    finalValue,
    discountAmount,
    discountPercent: hasDiscount ? Math.round((discountAmount / originalValue) * 100) : 0,
    giftTotal: gifts.reduce((sum, g) => sum + g.value, 0),
    gifts,
    giftFor: (scopeIndex) => gifts.find((g) => g.scopeIndex === scopeIndex),
  };
}

/** Atualiza os brindes quando um item do escopo é removido (os índices andam). */
export function removeScopeIndex<T extends { scopeIndex: number }>(gifts: T[], removedIndex: number): T[] {
  return gifts
    .filter((g) => g.scopeIndex !== removedIndex)
    .map((g) => (g.scopeIndex > removedIndex ? { ...g, scopeIndex: g.scopeIndex - 1 } : g));
}
