// Preços e desconto de proposta.
// - scopePrices: preço opcional de cada item do escopo, na mesma ordem (null = sem preço).
// - giftIndexes: itens do escopo que vão de brinde (precisam ter preço).
// - originalValue: valor antes do desconto. `investmentValue` é sempre o valor final.
// Puro: usado pelo Convex (validação) e pelo front (exibição e contrato).

export interface DiscountInput {
  investmentValue: number;
  originalValue?: number | null;
  scopePrices?: (number | null)[] | null;
  giftIndexes?: number[] | null;
}

export function validateDiscount(input: DiscountInput & { scopeLength: number }): void {
  const { investmentValue, originalValue, scopeLength } = input;
  const prices = input.scopePrices ?? [];
  const gifts = input.giftIndexes ?? [];
  const hasOriginal = originalValue !== undefined && originalValue !== null;

  if (hasOriginal && originalValue <= investmentValue) {
    throw new Error('Valor original precisa ser maior que o valor do projeto');
  }

  if (input.scopePrices && prices.length !== scopeLength) {
    throw new Error('Os preços não batem com os itens do escopo');
  }
  for (const price of prices) {
    if (price !== null && !(price > 0)) {
      throw new Error('O preço de um item precisa ser maior que zero');
    }
  }

  if (gifts.length === 0) return;
  if (!hasOriginal) {
    throw new Error('Item de brinde precisa de um valor original (antes do desconto)');
  }

  const seen = new Set<number>();
  for (const index of gifts) {
    if (!Number.isInteger(index) || index < 0 || index >= scopeLength) {
      throw new Error('Item de brinde não existe no escopo');
    }
    if (seen.has(index)) {
      throw new Error('O mesmo item do escopo está marcado como brinde mais de uma vez');
    }
    seen.add(index);
    if (typeof prices[index] !== 'number') {
      throw new Error('Item de brinde precisa ter preço');
    }
  }

  const giftTotal = gifts.reduce((sum, i) => sum + (prices[i] as number), 0);
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
  /** Soma dos itens que têm preço. */
  pricesTotal: number;
  giftTotal: number;
  giftCount: number;
  priceOf: (scopeIndex: number) => number | undefined;
  isGift: (scopeIndex: number) => boolean;
}

export function summarizeDiscount(input: DiscountInput): DiscountSummary {
  const finalValue = input.investmentValue;
  const original = input.originalValue ?? undefined;
  const hasDiscount = original !== undefined && original > finalValue;
  const prices = input.scopePrices ?? [];
  const priceOf = (i: number) => (typeof prices[i] === 'number' ? (prices[i] as number) : undefined);
  // Sem desconto não há brinde: o item aparece só com o preço.
  const gifts = hasDiscount ? (input.giftIndexes ?? []).filter((i) => priceOf(i) !== undefined) : [];
  const originalValue = hasDiscount ? original : finalValue;
  const discountAmount = originalValue - finalValue;

  return {
    hasDiscount,
    originalValue,
    finalValue,
    discountAmount,
    discountPercent: hasDiscount ? Math.round((discountAmount / originalValue) * 100) : 0,
    pricesTotal: prices.reduce<number>((sum, p) => sum + (p ?? 0), 0),
    giftTotal: gifts.reduce((sum, i) => sum + (priceOf(i) ?? 0), 0),
    giftCount: gifts.length,
    priceOf,
    isGift: (i) => gifts.includes(i),
  };
}

/** Atualiza os índices de brinde quando um item do escopo é removido. */
export function removeScopeIndex(indexes: number[], removedIndex: number): number[] {
  return indexes.filter((i) => i !== removedIndex).map((i) => (i > removedIndex ? i - 1 : i));
}
