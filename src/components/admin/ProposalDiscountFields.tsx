import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  validateDiscount,
  summarizeDiscount,
  removeScopeIndex,
  type GiftItem,
} from "../../../convex/lib/proposalDiscount";

/** Estado do formulário: os valores ficam como texto, do jeito que a pessoa digita. */
export interface DiscountDraft {
  originalValue: string;
  gifts: { scopeIndex: number; value: string }[];
}

export const emptyDiscountDraft: DiscountDraft = { originalValue: "", gifts: [] };

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
  proposal: { originalValue?: number; giftItems?: GiftItem[] } | null | undefined,
): DiscountDraft {
  if (!proposal) return emptyDiscountDraft;
  return {
    originalValue: proposal.originalValue !== undefined ? toText(proposal.originalValue) : "",
    gifts: (proposal.giftItems ?? []).map((g) => ({ scopeIndex: g.scopeIndex, value: toText(g.value) })),
  };
}

export function discountDraftToArgs(draft: DiscountDraft): {
  originalValue: number | undefined;
  giftItems: GiftItem[];
} {
  return {
    originalValue: parseMoney(draft.originalValue),
    giftItems: draft.gifts.map((g) => ({ scopeIndex: g.scopeIndex, value: parseMoney(g.value) ?? 0 })),
  };
}

export function removeScopeFromDraft(draft: DiscountDraft, removedIndex: number): DiscountDraft {
  return { ...draft, gifts: removeScopeIndex(draft.gifts, removedIndex) };
}

/** Mensagem de erro do desconto, ou null se está tudo certo. */
export function discountError(draft: DiscountDraft, investmentValue: string, scopeLength: number): string | null {
  try {
    validateDiscount({
      investmentValue: parseMoney(investmentValue) ?? 0,
      ...discountDraftToArgs(draft),
      scopeLength,
    });
    return null;
  } catch (error: any) {
    return error?.message ?? "Desconto inválido";
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
  const args = discountDraftToArgs(draft);
  const summary = summarizeDiscount({ investmentValue: finalValue, ...args });
  const error = discountError(draft, investmentValue, scopeItems.length);
  const giftTotal = args.giftItems.reduce((sum, g) => sum + g.value, 0);
  const suggestion = draft.originalValue.trim() === "" && giftTotal > 0 ? finalValue + giftTotal : null;

  const giftOf = (index: number) => draft.gifts.find((g) => g.scopeIndex === index);

  const toggleGift = (index: number, checked: boolean) => {
    const gifts = checked
      ? [...draft.gifts, { scopeIndex: index, value: "" }].sort((a, b) => a.scopeIndex - b.scopeIndex)
      : draft.gifts.filter((g) => g.scopeIndex !== index);
    onChange({ ...draft, gifts });
  };

  const setGiftValue = (index: number, value: string) =>
    onChange({ ...draft, gifts: draft.gifts.map((g) => (g.scopeIndex === index ? { ...g, value } : g)) });

  return (
    <div className="space-y-3 rounded-md border border-foreground/10 p-3">
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
            Usar {formatBRL(suggestion)} (valor do projeto + brindes)
          </Button>
        )}
      </div>

      {scopeItems.length > 0 && (
        <fieldset>
          <legend className="text-sm mb-1">Itens de brinde</legend>
          <p className="text-xs text-foreground/65 mb-2">
            Marque o que vai sem custo e informe quanto o item custaria. Na proposta, ele aparece com o badge
            “Brinde”, o preço original riscado e R$ 0,00.
          </p>
          <ul className="space-y-1">
            {scopeItems.map((item, index) => {
              const gift = giftOf(index);
              const checkboxId = `proposal-gift-${index}`;
              return (
                <li key={index} className="flex flex-wrap items-center gap-2 bg-foreground/5 p-2 rounded text-sm">
                  <input
                    id={checkboxId}
                    type="checkbox"
                    checked={!!gift}
                    onChange={(e) => toggleGift(index, e.target.checked)}
                    className="rounded border-foreground/80"
                  />
                  <label htmlFor={checkboxId} className="flex-1 min-w-0 wrap-break-word">
                    {item}
                  </label>
                  {gift && (
                    <div className="relative w-36">
                      <span className="absolute left-3 top-2.5 text-foreground/65 text-sm">R$</span>
                      <Input
                        aria-label={`Valor original de ${item}`}
                        className="bg-background border-input pl-8"
                        placeholder="0,00"
                        value={gift.value}
                        onChange={(e) => setGiftValue(index, e.target.value)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}

      {error ? (
        <p role="alert" className="text-red-500 text-xs">{error}</p>
      ) : (
        summary.hasDiscount && (
          <p className="text-xs text-foreground/65">
            Desconto de {formatBRL(summary.discountAmount)} ({summary.discountPercent}%): de{" "}
            {formatBRL(summary.originalValue)} por {formatBRL(summary.finalValue)}.
          </p>
        )
      )}
    </div>
  );
}
