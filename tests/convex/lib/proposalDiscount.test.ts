import { describe, it, expect } from "vitest";
import {
  validateDiscount,
  summarizeDiscount,
  removeScopeIndex,
} from "../../../convex/lib/proposalDiscount";

describe("convex/lib/proposalDiscount · validateDiscount", () => {
  it("accepts a proposal without prices or discount", () => {
    expect(() => validateDiscount({ investmentValue: 5000, scopeLength: 2 })).not.toThrow();
  });

  it("accepts an original value above the final value", () => {
    expect(() =>
      validateDiscount({ investmentValue: 4000, originalValue: 5000, scopeLength: 2 }),
    ).not.toThrow();
  });

  it("rejects an original value equal to or below the final value", () => {
    expect(() =>
      validateDiscount({ investmentValue: 5000, originalValue: 5000, scopeLength: 2 }),
    ).toThrow("Valor original");
    expect(() =>
      validateDiscount({ investmentValue: 5000, originalValue: 4000, scopeLength: 2 }),
    ).toThrow("Valor original");
  });

  it("accepts item prices, with null for items without price", () => {
    expect(() =>
      validateDiscount({ investmentValue: 5000, scopePrices: [3000, null], scopeLength: 2 }),
    ).not.toThrow();
  });

  it("rejects prices that do not line up with the scope", () => {
    expect(() =>
      validateDiscount({ investmentValue: 5000, scopePrices: [3000], scopeLength: 2 }),
    ).toThrow("escopo");
  });

  it("rejects prices that are zero or negative", () => {
    expect(() =>
      validateDiscount({ investmentValue: 5000, scopePrices: [0, null], scopeLength: 2 }),
    ).toThrow("maior que zero");
  });

  it("rejects gifts without an original value", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        scopePrices: [4000, 1000],
        giftIndexes: [1],
        scopeLength: 2,
      }),
    ).toThrow("valor original");
  });

  it("rejects gifts pointing outside the scope", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        scopePrices: [4000, 1000],
        giftIndexes: [2],
        scopeLength: 2,
      }),
    ).toThrow("escopo");
  });

  it("rejects the same item marked twice", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 3000,
        originalValue: 5000,
        scopePrices: [4000, 1000],
        giftIndexes: [1, 1],
        scopeLength: 2,
      }),
    ).toThrow("mais de uma vez");
  });

  it("rejects a gift item without a price", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        scopePrices: [4000, null],
        giftIndexes: [1],
        scopeLength: 2,
      }),
    ).toThrow("preço");
  });

  it("rejects gifts worth more than the total discount", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4500,
        originalValue: 5000,
        scopePrices: [4000, 1000],
        giftIndexes: [1],
        scopeLength: 2,
      }),
    ).toThrow("desconto");
  });

  it("accepts gifts that add up to exactly the discount", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        scopePrices: [4000, 1000],
        giftIndexes: [1],
        scopeLength: 2,
      }),
    ).not.toThrow();
  });
});

describe("convex/lib/proposalDiscount · summarizeDiscount", () => {
  it("reports no discount when there is no original value", () => {
    const s = summarizeDiscount({ investmentValue: 5000 });
    expect(s.hasDiscount).toBe(false);
    expect(s.finalValue).toBe(5000);
    expect(s.discountAmount).toBe(0);
    expect(s.priceOf(0)).toBeUndefined();
    expect(s.isGift(0)).toBe(false);
  });

  it("reports no discount when the original value is not above the final", () => {
    expect(summarizeDiscount({ investmentValue: 5000, originalValue: 5000 }).hasDiscount).toBe(false);
  });

  it("computes amount and rounded percent", () => {
    const s = summarizeDiscount({ investmentValue: 4000, originalValue: 6000 });
    expect(s.hasDiscount).toBe(true);
    expect(s.originalValue).toBe(6000);
    expect(s.discountAmount).toBe(2000);
    expect(s.discountPercent).toBe(33);
  });

  it("exposes item prices, their sum and the gifts", () => {
    const s = summarizeDiscount({
      investmentValue: 4000,
      originalValue: 5000,
      scopePrices: [4000, 1000, null],
      giftIndexes: [1],
    });
    expect(s.priceOf(0)).toBe(4000);
    expect(s.priceOf(2)).toBeUndefined();
    expect(s.pricesTotal).toBe(5000);
    expect(s.isGift(1)).toBe(true);
    expect(s.isGift(0)).toBe(false);
    expect(s.giftTotal).toBe(1000);
    expect(s.giftCount).toBe(1);
  });

  it("shows prices even without a discount, but no gifts", () => {
    const s = summarizeDiscount({
      investmentValue: 5000,
      scopePrices: [4000, 1000],
      giftIndexes: [1],
    });
    expect(s.priceOf(1)).toBe(1000);
    expect(s.isGift(1)).toBe(false);
  });
});

describe("convex/lib/proposalDiscount · removeScopeIndex", () => {
  it("drops the removed item and shifts the indexes after it", () => {
    expect(removeScopeIndex([0, 2, 3], 2)).toEqual([0, 2]);
    expect(removeScopeIndex([0, 2], 1)).toEqual([0, 1]);
    expect(removeScopeIndex([0, 2], 3)).toEqual([0, 2]);
  });
});
