import { describe, it, expect } from "vitest";

function insertAtCursor(
  selectionStart: number,
  selectionEnd: number,
  variable: string,
  currentValue: string
): { newValue: string; newCursorPos: number } {
  const text = `{{${variable}}}`;
  const newValue = currentValue.slice(0, selectionStart) + text + currentValue.slice(selectionEnd);
  return { newValue, newCursorPos: selectionStart + text.length };
}

describe("insertAtCursor", () => {
  it("insere variável no início do texto vazio", () => {
    const { newValue, newCursorPos } = insertAtCursor(0, 0, "client_name", "");
    expect(newValue).toBe("{{client_name}}");
    expect(newCursorPos).toBe("{{client_name}}".length);
  });

  it("insere variável no meio do texto", () => {
    const text = "Olá , como vai?";
    const pos = 4;
    const { newValue } = insertAtCursor(pos, pos, "client_name", text);
    expect(newValue).toBe("Olá {{client_name}}, como vai?");
  });

  it("substitui seleção pela variável", () => {
    const text = "Olá NOME, como vai?";
    const { newValue } = insertAtCursor(4, 8, "client_name", text);
    expect(newValue).toBe("Olá {{client_name}}, como vai?");
  });

  it("insere variável no final do texto", () => {
    const text = "Assinado por: ";
    const { newValue, newCursorPos } = insertAtCursor(text.length, text.length, "client_name", text);
    expect(newValue).toBe("Assinado por: {{client_name}}");
    expect(newCursorPos).toBe(newValue.length);
  });

  it("cursor fica posicionado após a variável inserida", () => {
    const text = "A  B";
    const { newValue, newCursorPos } = insertAtCursor(2, 2, "scope", text);
    expect(newValue[newCursorPos - 1]).toBe("}");
    expect(newValue[newCursorPos]).toBe(" ");
  });

  it("diferentes variáveis geram chaves distintas", () => {
    const { newValue: v1 } = insertAtCursor(0, 0, "client_name", "");
    const { newValue: v2 } = insertAtCursor(0, 0, "objective", "");
    expect(v1).toBe("{{client_name}}");
    expect(v2).toBe("{{objective}}");
  });
});
