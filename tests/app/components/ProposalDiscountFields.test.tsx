import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ProposalDiscountFields,
  parseMoney,
  discountDraftFromProposal,
  discountDraftToArgs,
  removeScopeFromDraft,
  emptyDiscountDraft,
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
      originalValue: 5000.5,
      giftItems: [{ scopeIndex: 1, value: 1000 }],
    });
    expect(draft).toEqual({ originalValue: "5000,5", gifts: [{ scopeIndex: 1, value: "1000" }] });
    expect(discountDraftToArgs(draft)).toEqual({
      originalValue: 5000.5,
      giftItems: [{ scopeIndex: 1, value: 1000 }],
    });
  });

  it("an empty draft means no discount", () => {
    expect(discountDraftFromProposal(null)).toEqual(emptyDiscountDraft);
    expect(discountDraftToArgs(emptyDiscountDraft)).toEqual({ originalValue: undefined, giftItems: [] });
  });

  it("removing a scope item shifts the gifts", () => {
    const draft = { originalValue: "5000", gifts: [{ scopeIndex: 0, value: "1" }, { scopeIndex: 2, value: "2" }] };
    expect(removeScopeFromDraft(draft, 0).gifts).toEqual([{ scopeIndex: 1, value: "2" }]);
  });
});

describe("ProposalDiscountFields · componente", () => {
  function setup(draft = emptyDiscountDraft, investmentValue = "4000") {
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

  it("marks a scope item as gift", () => {
    const onChange = setup();
    fireEvent.click(screen.getByRole("checkbox", { name: /Logo/ }));
    expect(onChange).toHaveBeenCalledWith({ originalValue: "", gifts: [{ scopeIndex: 1, value: "" }] });
  });

  it("suggests the original value from the gifts", () => {
    const onChange = setup({ originalValue: "", gifts: [{ scopeIndex: 1, value: "1000" }] });
    fireEvent.click(screen.getByRole("button", { name: /usar R\$\s5\.000,00/i }));
    expect(onChange).toHaveBeenCalledWith({ originalValue: "5000", gifts: [{ scopeIndex: 1, value: "1000" }] });
  });

  it("shows the discount summary", () => {
    setup({ originalValue: "5000", gifts: [] });
    expect(screen.getByText(/Desconto de R\$\s1\.000,00 \(20%\)/)).toBeInTheDocument();
  });

  it("shows the validation error", () => {
    setup({ originalValue: "3000", gifts: [] });
    expect(screen.getByRole("alert")).toHaveTextContent("Valor original");
  });
});
