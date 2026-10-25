import { describe, it, expect } from "vitest";
import {
  validateDiscount,
  summarizeDiscount,
  removeScopeIndex,
} from "../../../convex/lib/proposalDiscount";

describe("convex/lib/proposalDiscount · validateDiscount", () => {
  it("accepts a proposal without discount", () => {
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

  it("rejects gift items without an original value", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        giftItems: [{ scopeIndex: 0, value: 1000 }],
        scopeLength: 2,
      }),
    ).toThrow("brinde");
  });

  it("rejects gift items pointing outside the scope", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        giftItems: [{ scopeIndex: 2, value: 1000 }],
        scopeLength: 2,
      }),
    ).toThrow("escopo");
  });

  it("rejects the same scope item marked twice", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 3000,
        originalValue: 5000,
        giftItems: [
          { scopeIndex: 0, value: 1000 },
          { scopeIndex: 0, value: 1000 },
        ],
        scopeLength: 2,
      }),
    ).toThrow("mais de uma vez");
  });

  it("rejects gift values that are zero or negative", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        giftItems: [{ scopeIndex: 0, value: 0 }],
        scopeLength: 2,
      }),
    ).toThrow("maior que zero");
  });

  it("rejects gifts worth more than the total discount", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4500,
        originalValue: 5000,
        giftItems: [{ scopeIndex: 0, value: 1000 }],
        scopeLength: 2,
      }),
    ).toThrow("desconto");
  });

  it("accepts gifts that add up to exactly the discount", () => {
    expect(() =>
      validateDiscount({
        investmentValue: 4000,
        originalValue: 5000,
        giftItems: [{ scopeIndex: 1, value: 1000 }],
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
    expect(s.giftFor(0)).toBeUndefined();
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

  it("finds the gift for a scope item", () => {
    const s = summarizeDiscount({
      investmentValue: 4000,
      originalValue: 5000,
      giftItems: [{ scopeIndex: 1, value: 1000 }],
    });
    expect(s.giftFor(1)).toEqual({ scopeIndex: 1, value: 1000 });
    expect(s.giftFor(0)).toBeUndefined();
    expect(s.giftTotal).toBe(1000);
  });

  it("ignores gifts when there is no valid discount", () => {
    const s = summarizeDiscount({
      investmentValue: 4000,
      giftItems: [{ scopeIndex: 0, value: 1000 }],
    });
    expect(s.giftFor(0)).toBeUndefined();
  });
});

describe("convex/lib/proposalDiscount · removeScopeIndex", () => {
  const gifts = [
    { scopeIndex: 0, value: 100 },
    { scopeIndex: 2, value: 200 },
  ];

  it("drops the gift of the removed item", () => {
    expect(removeScopeIndex(gifts, 0)).toEqual([{ scopeIndex: 1, value: 200 }]);
  });

  it("shifts gifts after the removed item", () => {
    expect(removeScopeIndex(gifts, 1)).toEqual([
      { scopeIndex: 0, value: 100 },
      { scopeIndex: 1, value: 200 },
    ]);
  });

  it("keeps gifts before the removed item", () => {
    expect(removeScopeIndex(gifts, 3)).toEqual(gifts);
  });
});
