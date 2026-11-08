import { describe, expect, it, vi } from "vitest";
import { main } from "../src/cli.ts";

describe("CLI", () => {
  it("--help sai com 0", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    expect(await main(["--help"])).toBe(0);
    expect(log.mock.calls[0]?.[0]).toMatch(/rubrica-testar-tema/);
    log.mockRestore();
  });

  it("sem tema ou com opção inválida sai com 2", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await main([])).toBe(2);
    expect(await main(["padrao", "--nao-existe"])).toBe(2);
    expect(await main(["padrao", "--sem-lighthouse", "--so-lighthouse"])).toBe(2);
    err.mockRestore();
  });
});
