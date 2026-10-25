import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ProposalDiscountFields,
  parseMoney,
  discountDraftFromProposal,
  discountDraftToArgs,
  removeScopeFromDraft,
  emptyDiscountDraft,
  type DiscountDraft,
} from "@/components/admin/ProposalDiscountFields";

describe("ProposalDiscountFields · helpers", () => {
  it("parseMoney reads pt-BR and plain numbers", () => {
    expect(parseMoney("1.234,56")).toBe(1234.56);
    expect(parseMoney("1234,5")).toBe(1234.5);
    expect(parseMoney("1234.5")).toBe(1234.5);
    expect(parseMoney("")).toBeUndefined();
    expect(parseMoney("abc")).toBeUndefined();
  });

  it("round-trips a stored proposal", () => {
    const draft = discountDraftFromProposal({
      scopePrices: [4000.5, null],
      originalValue: 5000.5,
      giftIndexes: [0],
    });
    expect(draft).toEqual({ prices: ["4000,5", ""], originalValue: "5000,5", gifts: [0] });
    expect(discountDraftToArgs(draft, 2)).toEqual({
      scopePrices: [4000.5, null],
      originalValue: 5000.5,
      giftIndexes: [0],
    });
  });

  it("aligns prices with the scope length", () => {
    expect(discountDraftToArgs({ ...emptyDiscountDraft, prices: ["10"] }, 3).scopePrices).toEqual([10, null, null]);
  });

  it("an empty draft means no prices and no discount", () => {
    expect(discountDraftFromProposal(null)).toEqual(emptyDiscountDraft);
    expect(discountDraftToArgs(emptyDiscountDraft, 2)).toEqual({
      scopePrices: [null, null],
      originalValue: undefined,
      giftIndexes: [],
    });
  });

  it("removing a scope item drops its price and shifts the gifts", () => {
    const draft = { originalValue: "5000", prices: ["1", "2", "3"], gifts: [0, 2] };
    expect(removeScopeFromDraft(draft, 0)).toEqual({ originalValue: "5000", prices: ["2", "3"], gifts: [1] });
  });
});

describe("ProposalDiscountFields · componente", () => {
  function setup(draft: DiscountDraft = emptyDiscountDraft, investmentValue = "4000") {
    const onChange = vi.fn();
    render(
      <ProposalDiscountFields
        scopeItems={["Site", "Logo"]}
        investmentValue={investmentValue}
        draft={draft}
        onChange={onChange}
      />,
    );
    return onChange;
  }

  it("edits the price of an item", () => {
    const onChange = setup();
    fireEvent.change(screen.getByLabelText("Preço de Logo"), { target: { value: "1000" } });
    expect(onChange).toHaveBeenCalledWith({ originalValue: "", prices: ["", "1000"], gifts: [] });
  });

  it("marks a priced item as gift", () => {
    const onChange = setup({ originalValue: "", prices: ["4000", "1000"], gifts: [] });
    fireEvent.click(screen.getByRole("checkbox", { name: /Brinde: Logo/ }));
    expect(onChange).toHaveBeenCalledWith({ originalValue: "", prices: ["4000", "1000"], gifts: [1] });
  });

  it("does not allow a gift on an item without price", () => {
    setup();
    expect(screen.getByRole("checkbox", { name: /Brinde: Logo/ })).toBeDisabled();
  });

  it("suggests the original value from the item prices", () => {
    const onChange = setup({ originalValue: "", prices: ["4000", "1000"], gifts: [1] });
    fireEvent.click(screen.getByRole("button", { name: /usar R\$\s5\.000,00/i }));
    expect(onChange).toHaveBeenCalledWith({ originalValue: "5000", prices: ["4000", "1000"], gifts: [1] });
  });

  it("shows the discount summary", () => {
    setup({ originalValue: "5000", prices: [], gifts: [] });
    expect(screen.getByText(/Desconto de R\$\s1\.000,00 \(20%\)/)).toBeInTheDocument();
  });

  it("warns when the items add up to a different total", () => {
    setup({ originalValue: "", prices: ["3000", "500"], gifts: [] });
    expect(screen.getByText(/soma dos itens/i)).toBeInTheDocument();
  });

  it("shows the validation error", () => {
    setup({ originalValue: "3000", prices: [], gifts: [] });
    expect(screen.getByRole("alert")).toHaveTextContent("Valor original");
  });
});
