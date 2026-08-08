import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireRole } from "./auth";
import { isPluginEnabled, requirePlugin } from "./plugins";
import type { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const enabled = await isPluginEnabled(ctx, "contract-templates");
    if (!enabled) return [];
    return ctx.db.query("contractTemplates").collect();
  },
});

export const getDefault = query({
  args: {},
  handler: async (ctx) => {
    await requirePlugin(ctx, "contract-templates");
    return ctx.db
      .query("contractTemplates")
      .withIndex("by_is_default", (q) => q.eq("isDefault", true))
      .unique();
  },
});

export const get = query({
  args: { id: v.id("contractTemplates") },
  handler: async (ctx, { id }) => {
    await requirePlugin(ctx, "contract-templates");
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    content: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, { name, description, content, isDefault }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    const now = Date.now();
    return ctx.db.insert("contractTemplates", {
      name,
      description,
      content,
      isDefault,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contractTemplates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, description, content }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (content !== undefined) patch.content = content;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("contractTemplates") },
  handler: async (ctx, { id }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    await ctx.db.delete(id);
  },
});

const DEFAULT_TEMPLATE_CONTENT = `**CONTRATADA:** {{contractor_name}}, inscrito no {{contractor_document_type}} sob nº {{contractor_document}}, com sede em {{contractor_address}}.

**CONTRATANTE:** {{client_name}}{{client_document_line}}{{client_email_line}}.

---

### CLÁUSULA 1 – DO OBJETIVO DO PROJETO

{{objective}}

### CLÁUSULA 2 – DO ESCOPO DOS SERVIÇOS

{{scope}}

### CLÁUSULA 3 – DO CRONOGRAMA

{{timeline}}{{delivery_date_line}}

### CLÁUSULA 4 – DO INVESTIMENTO E FORMAS DE PAGAMENTO

O investimento total para a execução deste projeto é de **{{investment_value}}**.

**Formas de Pagamento:**

{{payment_methods}}

### CLÁUSULA 5 – DAS CONDIÇÕES GERAIS

{{conditions}}

### CLÁUSULA 6 – DA PROPRIEDADE INTELECTUAL E DIREITOS DE IMAGEM

1. **Transferência de Titularidade:** Após a quitação integral do valor total previsto neste contrato, a CONTRATADA transfere ao CONTRATANTE a propriedade total sobre o código-fonte desenvolvido e a titularidade das contas de infraestrutura criadas especificamente para este projeto.

2. **Direitos de Portfólio:** A CONTRATADA reserva para si o direito de imagem da aplicação para fins de divulgação de seu trabalho e portfólio profissional. Isso inclui a exibição de capturas de tela, vídeos de funcionamento e o compartilhamento de trechos de código não críticos (que não exponham vulnerabilidades ou segredos de negócio do cliente) para fins de demonstração técnica.

### CLÁUSULA 7 – DA ENTREGA, TESTES E ACEITE

1. **Aceite Tácito:** Após a entrega da solução, o CONTRATANTE terá um prazo de **5 (cinco) dias corridos** para manifestar sua intenção de iniciar o período de homologação. Caso não haja manifestação neste prazo, a entrega será considerada finalizada e aceita para todos os fins de direito.

2. **Período de Homologação:** Caso o CONTRATANTE se manifeste dentro dos 5 dias iniciais, terá um prazo adicional de **30 (trinta) dias corridos** para realizar testes e solicitar ajustes.

3. **Limitação de Correções:** Neste período de 30 dias, o CONTRATANTE terá direito a submeter até **2 (duas) listas consolidadas de correções de bugs**. Falhas decorrentes de correções anteriores não serão contabilizadas nesta limitação.

4. **Manutenção Posterior:** Findo o prazo de 30 dias ou exauridas as listas de correção, qualquer nova alteração, funcionalidade ou suporte será objeto de novo orçamento a parte.

### CLÁUSULA 8 – DA INFRAESTRUTURA E RESPONSABILIDADE TÉCNICA

1. **Serviços de Terceiros:** A CONTRATADA não se responsabiliza por instabilidades, interrupções de serviço, perda de dados ou alterações de preços praticadas pelos provedores de infraestrutura (servidores, bancos de dados, APIs).

2. **Garantia de Não-Bloqueio (Lock-in):** A CONTRATADA garante que a arquitetura do sistema não utilizará tecnologias que impeçam a migração futura para outros provedores, assegurando a portabilidade do sistema.

3. **Mudança de Stack:** Caso o CONTRATANTE deseje alterar a infraestrutura ou tecnologias escolhidas após o início do projeto, um novo orçamento será apresentado considerando o progresso já realizado e a complexidade da migração.

### CLÁUSULA 9 – PROTEÇÃO DE DADOS (LGPD)

1. **Controlador de Dados:** O CONTRATANTE figura como único Controlador dos dados (nos termos da Lei 13.709/18 - LGPD), sendo o responsável exclusivo por coletar autorizações, garantir a integridade, privacidade e atender às solicitações de exclusão ou acesso de seus próprios clientes.

2. **Uso da Ferramenta:** Por ser o proprietário final da aplicação, cabe ao CONTRATANTE garantir que o uso do software esteja em conformidade com as normas legais vigentes, isentando a CONTRATADA de qualquer mau uso ou vazamento decorrente da gestão das contas e acessos.

### CLÁUSULA 10 – DA POLÍTICA DE RESCISÃO

{{rescission_policy}}

### CLÁUSULA 11 – DO ACEITE ELETRÔNICO

Esta proposta, quando aceita eletronicamente, constitui contrato válido entre as partes, nos termos do Código Civil Brasileiro.

**Aceite registrado em:** {{accepted_at}}

**Aceite realizado por:** {{client_name}}{{client_document_line}}

### CLÁUSULA 12 – DO FORO

Fica eleito o foro da comarca de {{jurisdiction}} para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
`;

export const seedDefaultTemplate = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("contractTemplates").first();
    if (existing) return;
    const now = Date.now();
    await ctx.db.insert("contractTemplates", {
      name: "Contrato Padrão",
      description: "Template padrão de contrato de prestação de serviços",
      content: DEFAULT_TEMPLATE_CONTENT,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setDefault = mutation({
  args: { id: v.id("contractTemplates") },
  handler: async (ctx, { id }) => {
    await requirePlugin(ctx, "contract-templates");
    await requireRole(ctx, ["root", "admin"]);
    const current = await ctx.db
      .query("contractTemplates")
      .withIndex("by_is_default", (q) => q.eq("isDefault", true))
      .collect();
    for (const doc of current) {
      await ctx.db.patch(doc._id, { isDefault: false, updatedAt: Date.now() });
    }
    await ctx.db.patch(id, { isDefault: true, updatedAt: Date.now() });
  },
});
