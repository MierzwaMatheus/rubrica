// @vitest-environment edge-runtime
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, hitRateLimit, RATE_LIMITS } from "../../src/convex/audit";
import type { MutationCtx } from "../../src/convex/server";
import { internal, setup } from "./_setup";

afterEach(() => {
  vi.useRealTimers();
});

describe("limite de tentativas", () => {
  it("bloqueia ao estourar e libera depois do bloqueio", async () => {
    vi.useFakeTimers();
    const t = setup();
    const { perKey, blockMs } = RATE_LIMITS.password_change;
    const hit = () => t.run((ctx) => hitRateLimit(ctx as unknown as MutationCtx, "password_change", "u1"));
    for (let i = 0; i < perKey; i++) await hit();
    await expect(hit()).rejects.toThrow(/Muitas tentativas. Tente de novo em 60 min/);
    // Outro identificador não é afetado.
    await t.run((ctx) => hitRateLimit(ctx as unknown as MutationCtx, "password_change", "u2"));
    vi.advanceTimersByTime(blockMs + 1);
    await hit();
    expect(await t.run((ctx) => checkRateLimit(ctx as unknown as MutationCtx, "password_change", "u1"))).toEqual({ allowed: true });
  });

  it("limite de 1 bloqueia já na primeira tentativa registrada", async () => {
    const t = setup();
    await t.run((ctx) => hitRateLimit(ctx as unknown as MutationCtx, "testimonial_submit", "ip"));
    await expect(t.run((ctx) => hitRateLimit(ctx as unknown as MutationCtx, "testimonial_submit", "ip"))).rejects.toThrow(/Muitas tentativas/);
  });
});

describe("limpeza", () => {
  it("apaga registros vencidos e anonimiza IPs antigos", async () => {
    const t = setup();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    await t.run(async (ctx) => {
      await ctx.db.insert("auditLog", { eventType: "velho", actorType: "system", success: true, createdAt: now - 800 * day, expiresAt: now - day });
      await ctx.db.insert("auditLog", { eventType: "ip", actorType: "external", success: true, ipAddress: "1.2.3.4", userAgent: "x", createdAt: now - 100 * day, expiresAt: now + day });
      await ctx.db.insert("rateLimits", { key: "a:b", type: "a", identifier: "b", attemptCount: 1, firstAttemptAt: 0, lastAttemptAt: 0, expiresAt: now - 1 });
    });
    const result = await t.mutation(internal.rubrica.audit.cleanup, {});
    expect(result).toEqual({ auditDeleted: 1, anonymized: 1, rateLimitsDeleted: 1 });
    const logs = await t.run((ctx) => ctx.db.query("auditLog").collect());
    expect(logs.map((l) => [l.eventType, l.ipAddress, l.userAgent])).toEqual([["ip", "0.0.0.0", undefined]]);
  });
});
