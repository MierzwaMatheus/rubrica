import { describe, expect, it } from "vitest";
import { AUDIT_ACTIONS, AUDIT_TARGETS, auditTargetOptions, describeAudit } from "../../src/admin/lib/audit";

describe("atividades: frases", () => {
  it("ação de conteúdo mostra o alvo e o nome do documento", () => {
    expect(describeAudit({ eventType: "admin.update", targetType: "posts", metadata: { label: "Meu texto" } })).toBe("editou · post · Meu texto");
    expect(describeAudit({ eventType: "admin.publish", targetType: "page" })).toBe("publicou · página");
  });

  it("plugin ligado ou desligado diz qual é", () => {
    const on = { eventType: "plugin.enabled", targetType: "plugin", targetId: "blog", metadata: { label: "Blog" } };
    expect(describeAudit(on)).toBe("ligou o plugin · Blog");
    expect(describeAudit({ eventType: "plugin.disabled", targetType: "plugin", targetId: "blog" })).toBe("desligou o plugin · blog");
  });

  it("criação de usuário mostra e-mail e papel", () => {
    const entry = { eventType: "user.created", targetType: "user", metadata: { email: "ana@ex.com", role: "content-editor" } };
    expect(describeAudit(entry)).toBe("criou o usuário · ana@ex.com · papel: Editor de conteúdo");
  });

  it("troca de papel mostra de onde e para onde", () => {
    const entry = { eventType: "user.role_assigned", targetType: "user", metadata: { role: "admin", previous: "content-editor" } };
    expect(describeAudit(entry)).toBe("mudou o papel de um usuário · Editor de conteúdo → Administrador");
  });

  it("remoção de usuário mostra o e-mail", () => {
    expect(describeAudit({ eventType: "user.removed", targetType: "user", metadata: { email: "bia@ex.com" } })).toBe("removeu o usuário · bia@ex.com");
  });

  it("ação do Asaas e do link de pagamento usam o subtipo", () => {
    expect(describeAudit({ eventType: "admin.update", targetType: "plans", metadata: { action: "payment_link", label: "Consultoria" } })).toBe(
      "gerou o link de pagamento · plano · Consultoria",
    );
    expect(describeAudit({ eventType: "admin.update", targetType: "plans", metadata: { action: "payment_link_removed" } })).toBe(
      "removeu o link de pagamento · plano",
    );
  });

  it("contato: estado antes e depois, e destino do aviso", () => {
    expect(describeAudit({ eventType: "contact.status_changed", targetType: "contactRequest", metadata: { from: "new", to: "read" } })).toBe(
      "mudou o estado · contato · novo → lido",
    );
    expect(describeAudit({ eventType: "contact.delivery_retried", targetType: "contactDelivery", metadata: { destination: "telegram" } })).toBe(
      "tentou de novo o aviso · Telegram",
    );
    expect(describeAudit({ eventType: "contact.destinations_updated", targetType: "contactDestinations", metadata: { telegram: true, email: false, webhook: true } })).toBe(
      "mudou os destinos dos avisos · Telegram, webhook",
    );
  });

  it("evento de visitante, e falha com a mensagem", () => {
    expect(describeAudit({ eventType: "contact.submitted", targetType: "contactRequest", metadata: { page: "/contato" } })).toBe(
      "enviou um pedido de contato · pela página /contato",
    );
    expect(describeAudit({ eventType: "publish.failed", targetType: "site", success: false, metadata: { error: "timeout" } })).toBe(
      "tentou publicar o site · timeout (falhou)",
    );
  });

  it("evento sem regra aparece com o nome técnico, e falha fica marcada", () => {
    expect(describeAudit({ eventType: "outra.coisa", success: false })).toBe("outra.coisa (falhou)");
  });

  it("nenhum evento que o backend grava cai no nome técnico", () => {
    const gravados = [
      "admin.create", "admin.update", "admin.publish", "admin.unpublish", "admin.delete", "admin.restore", "admin.permanent_delete", "admin.reorder",
      "page.blocks_reordered", "page.block_added", "page.block_updated", "page.block_shown", "page.block_hidden", "page.block_removed",
      "media.uploaded", "media.updated", "media.replaced", "media.deleted",
      "testimonial.approved", "testimonial.rejected", "testimonial.submitted",
      "contact.submitted", "contact.status_changed", "contact.deleted", "contact.destinations_updated", "contact.delivery_retried", "contact.delivery_failed",
      "settings.updated", "texts.updated", "texts.reset", "plugin.enabled", "plugin.disabled",
      "user.created", "user.role_assigned", "user.removed", "user.root_created", "auth.password_changed", "auth.password_reset",
      "proposal.accepted", "proposal.password_failed", "publish.triggered", "publish.failed", "lgpd.erasure_executed", "webhook.unauthorized",
    ];
    for (const eventType of gravados) expect(AUDIT_ACTIONS[eventType], eventType).toBeDefined();
  });
});

describe("atividades: filtro de tipos", () => {
  const values = (kind: "pessoal" | "empresa") => auditTargetOptions(kind).map((o) => o.value);

  it("o site pessoal vê currículo, dia a dia e currículo com IA, sem planos nem equipe", () => {
    const pessoal = values("pessoal");
    expect(pessoal).toEqual(expect.arrayContaining(["resume", "routine", "ai_resume", "posts"]));
    expect(pessoal).not.toEqual(expect.arrayContaining(["plans", "team"]));
  });

  it("o site de empresa vê planos e equipe, sem os tipos pessoais", () => {
    const empresa = values("empresa");
    expect(empresa).toEqual(expect.arrayContaining(["plans", "team", "proposal"]));
    expect(empresa).not.toEqual(expect.arrayContaining(["resume", "routine", "ai_resume"]));
  });

  it("os nomes do filtro vêm em português e em ordem", () => {
    const labels = auditTargetOptions("pessoal").map((o) => o.label);
    expect(labels).toContain("item do currículo");
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, "pt-BR")));
    expect(Object.values(AUDIT_TARGETS).every((t) => /^[a-zà-ú ()\-]+$/i.test(t.label))).toBe(true);
  });
});
