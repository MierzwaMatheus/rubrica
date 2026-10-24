import { describe, it, expect, vi, afterEach } from "vitest";
import { trackEvent } from "@/lib/analytics";

afterEach(() => {
  delete (window as any).umami;
});

describe("trackEvent", () => {
  it("sends the event to Umami when the script is loaded", () => {
    const track = vi.fn();
    (window as any).umami = { track };
    trackEvent("contato-enviado", { flow: "job" });
    expect(track).toHaveBeenCalledWith("contato-enviado", { flow: "job" });
  });

  it("does nothing when Umami is not loaded (dev, ad blockers)", () => {
    expect(() => trackEvent("contato-enviado")).not.toThrow();
  });

  it("never breaks the page if Umami throws", () => {
    (window as any).umami = { track: () => { throw new Error("blocked"); } };
    expect(() => trackEvent("contato-enviado")).not.toThrow();
  });
});
