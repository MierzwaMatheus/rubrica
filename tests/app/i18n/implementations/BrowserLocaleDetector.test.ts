import { describe, it, expect } from "vitest";
import { BrowserLocaleDetector } from "@/i18n/implementations/BrowserLocaleDetector";

describe("BrowserLocaleDetector · detect (async)", () => {
  it("delegates to detectSync — returns pt-BR for pt navigator language", async () => {
    Object.defineProperty(navigator, "language", { value: "pt-BR", configurable: true });
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("pt-BR");
  });

  it("delegates to detectSync — returns en-US for non-pt navigator language", async () => {
    Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("en-US");
  });
});

describe("BrowserLocaleDetector · detectSync", () => {
  it("returns pt-BR for any pt-* navigator language", () => {
    Object.defineProperty(navigator, "language", { value: "pt-PT", configurable: true });
    expect(new BrowserLocaleDetector().detectSync()).toBe("pt-BR");
  });

  it("returns en-US otherwise", () => {
    Object.defineProperty(navigator, "language", { value: "fr-FR", configurable: true });
    expect(new BrowserLocaleDetector().detectSync()).toBe("en-US");
  });
});
