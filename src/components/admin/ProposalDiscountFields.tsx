import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateDiscount, summarizeDiscount, removeScopeIndex } from "../../../convex/lib/proposalDiscount";

/** Estado do formulário: os valores ficam como texto, do jeito que a pessoa digita. */
export interface DiscountDraft {
  originalValue: string;
  /** Preço de cada item do escopo, na mesma ordem ("" = sem preço). */
  prices: string[];
  /** Índices dos itens que vão de brinde. */
  gifts: number[];
}

export const emptyDiscountDraft: DiscountDraft = { originalValue: "", prices: [], gifts: [] };

/** Lê "1.234,56", "1234,5" ou "1234.5". Vazio ou inválido vira undefined. */
export function parseMoney(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

const toText = (value: number) => value.toString().replace(".", ",");

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function discountDraftFromProposal(
  proposal: { scopePrices?: (number | null)[]; originalValue?: number; giftIndexes?: number[] } | null | undefined,
): DiscountDraft {
  if (!proposal) return emptyDiscountDraft;
  return {
    prices: (proposal.scopePrices ?? []).map((p) => (p === null ? "" : toText(p))),
    originalValue: proposal.originalValue !== undefined ? toText(proposal.originalValue) : "",
    gifts: proposal.giftIndexes ?? [],
  };
}

/** Converte para os campos da mutation. Os preços saem alinhados com o escopo. */
export function discountDraftToArgs(draft: DiscountDraft, scopeLength: number) {
  return {
    scopePrices: Array.from({ length: scopeLength }, (_, i) => parseMoney(draft.prices[i] ?? "") ?? null),
    originalValue: parseMoney(draft.originalValue),
    giftIndexes: draft.gifts,
  };
}

export function removeScopeFromDraft(draft: DiscountDraft, removedIndex: number): DiscountDraft {
  return {
    ...draft,
    prices: draft.prices.filter((_, i) => i !== removedIndex),
    gifts: removeScopeIndex(draft.gifts, removedIndex),
  };
}

/** Mensagem de erro dos preços e do desconto, ou null se está tudo certo. */
export function discountError(draft: DiscountDraft, investmentValue: string, scopeLength: number): string | null {
  try {
    validateDiscount({
      investmentValue: parseMoney(investmentValue) ?? 0,
      ...discountDraftToArgs(draft, scopeLength),
      scopeLength,
    });
    return null;
  } catch (error: any) {
    return error?.message ?? "Preços ou desconto inválidos";
  }
}

interface Props {
  scopeItems: string[];
  investmentValue: string;
  draft: DiscountDraft;
  onChange: (draft: DiscountDraft) => void;
}

export function ProposalDiscountFields({ scopeItems, investmentValue, draft, onChange }: Props) {
  const finalValue = parseMoney(investmentValue) ?? 0;
  const args = discountDraftToArgs(draft, scopeItems.length);
  const summary = summarizeDiscount({ investmentValue: finalValue, ...args });
  const error = discountError(draft, investmentValue, scopeItems.length);
  const allPriced = scopeItems.length > 0 && args.scopePrices.every((p) => p !== null);
  const expectedTotal = summary.hasDiscount ? summary.originalValue : finalValue;

  const suggestion =
    draft.originalValue.trim() === "" && summary.pricesTotal > finalValue ? summary.pricesTotal : null;
  // Aviso leve: com todos os itens com preço, a soma deveria fechar com o valor original (ou o final).
  const totalMismatch =
    allPriced && suggestion === null && Math.abs(summary.pricesTotal - expectedTotal) > 0.005;

  const setPrice = (index: number, value: string) => {
    const prices = Array.from({ length: scopeItems.length }, (_, i) => draft.prices[i] ?? "");
    prices[index] = value;
    const stillPriced = parseMoney(value) !== undefined;
    onChange({ ...draft, prices, gifts: stillPriced ? draft.gifts : draft.gifts.filter((g) => g !== index) });
  };

  const toggleGift = (index: number, checked: boolean) => {
    const gifts = checked
      ? [...draft.gifts, index].sort((a, b) => a - b)
      : draft.gifts.filter((g) => g !== index);
    onChange({ ...draft, gifts });
  };

  return (
    <div className="space-y-3 rounded-md border border-foreground/10 p-3">
      {scopeItems.length > 0 && (
        <fieldset>
          <legend className="text-sm mb-1">Preço dos itens (opcional)</legend>
          <p className="text-xs text-foreground/65 mb-2">
            O preço aparece ao lado de cada item na proposta. Marque “Brinde” no que vai sem custo: ele aparece com o
            badge, o preço riscado e R$ 0,00.
          </p>
          <ul className="space-y-1">
            {scopeItems.map((item, index) => {
              const price = draft.prices[index] ?? "";
              const hasPrice = parseMoney(price) !== undefined;
              const giftId = `proposal-gift-${index}`;
              return (
                <li key={index} className="flex flex-wrap items-center gap-2 bg-foreground/5 p-2 rounded text-sm">
                  <span className="flex-1 min-w-0 wrap-break-word">{item}</span>
                  <div className="relative w-36">
                    <span className="absolute left-3 top-2.5 text-foreground/65 text-sm">R$</span>
                    <Input
                      aria-label={`Preço de ${item}`}
                      className="bg-background border-input pl-8"
                      placeholder="0,00"
                      value={price}
                      onChange={(e) => setPrice(index, e.target.value)}
                    />
                  </div>
                  <span className="flex items-center gap-1">
                    <input
                      id={giftId}
                      type="checkbox"
                      checked={draft.gifts.includes(index)}
                      disabled={!hasPrice}
                      onChange={(e) => toggleGift(index, e.target.checked)}
                      className="rounded border-foreground/80"
                      aria-label={`Brinde: ${item}`}
                    />
                    <label htmlFor={giftId} className="text-xs" aria-hidden="true">
                      Brinde
                    </label>
                  </span>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      <div>
        <Label htmlFor="proposal-original-value" className="block text-sm mb-1">
          Valor original (antes do desconto, opcional)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-foreground/65 text-sm">R$</span>
          <Input
            id="proposal-original-value"
            className="bg-background border-input pl-8"
            placeholder="Sem desconto"
            value={draft.originalValue}
            onChange={(e) => onChange({ ...draft, originalValue: e.target.value })}
          />
        </div>
        {suggestion !== null && (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-xs"
            onClick={() => onChange({ ...draft, originalValue: toText(suggestion) })}
          >
            Usar {formatBRL(suggestion)} (soma dos itens)
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-red-500 text-xs">{error}</p>
      ) : (
        <>
          {summary.hasDiscount && (
            <p className="text-xs text-foreground/65">
              Desconto de {formatBRL(summary.discountAmount)} ({summary.discountPercent}%): de{" "}
              {formatBRL(summary.originalValue)} por {formatBRL(summary.finalValue)}.
            </p>
          )}
          {totalMismatch && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              A soma dos itens ({formatBRL(summary.pricesTotal)}) é diferente do{" "}
              {summary.hasDiscount ? "valor original" : "valor do projeto"} ({formatBRL(expectedTotal)}).
            </p>
          )}
        </>
      )}
    </div>
  );
}
