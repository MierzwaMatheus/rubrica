import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SHOTS = process.env.SCREENSHOT_DIR;

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Olá/ })).toBeVisible();
}

const demoState = <T>(page: Page, fn: string) => page.evaluate(`(${fn})(window.__rubricaDemo.state)`) as Promise<T>;

async function shot(page: Page, name: string) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test("blog: criar um post, ver o SEO e publicar, com o botão Publicar site", async ({ page }) => {
  await login(page);
  await page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name: "Blog" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
  await shot(page, "blog-lista");

  await page.getByRole("link", { name: "Novo post" }).click();
  // Sem título e sem texto, salvar mostra o erro em cada campo.
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByText("O post tem campos a corrigir.")).toBeVisible();
  await expect(page.getByText("Título: obrigatório")).toBeVisible();
  await expect(page.getByText("Texto do post: obrigatório")).toBeVisible();

  await page.getByRole("textbox", { name: /^Título/ }).fill("Como escolho as ferramentas do meu dia a dia");
  await page.getByRole("textbox", { name: /^Resumo/ }).fill("Quatro critérios simples que me poupam de trocar de ferramenta a cada mês.");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("Ferramenta boa é a que some do caminho. Este é o texto do post.");
  await page.getByLabel("Etiquetas", { exact: true }).fill("produtividade");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("list", { name: "Etiquetas do item" })).toContainText("produtividade");
  await expect(page.getByText("Título: obrigatório")).toHaveCount(0);
  await shot(page, "blog-editor");

  // Endereço sugerido do título e prévia do Google com contador.
  await page.getByRole("tab", { name: "Endereço e SEO" }).click();
  await expect(page.locator("code", { hasText: "como-escolho-as-ferramentas-do-meu-dia-a-dia" })).toBeVisible();
  await page.getByRole("textbox", { name: "Título para buscadores" }).fill("Ferramentas do dia a dia: como escolho");
  await expect(page.getByText(/38\/60 · bom/)).toBeVisible();
  await expect(page.getByTestId("google-preview")).toContainText("Ferramentas do dia a dia: como escolho");
  await shot(page, "blog-seo");

  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page).toHaveURL(/\/admin\/blog\?id=/);
  await expect(page.getByRole("heading", { level: 1, name: "Como escolho as ferramentas do meu dia a dia" })).toBeVisible();
  await expect(page.getByText("rascunho", { exact: true })).toBeVisible();

  // O slug fica estável quando o título muda.
  await page.getByRole("textbox", { name: /^Título/ }).fill("Como escolho ferramentas");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Salvo.")).toBeVisible();

  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(page.getByText("publicado", { exact: true }).first()).toBeVisible();
  const post = await demoState<{ slug: string; published: boolean; publishedAt: number; tags: string[] }>(page, `(s) => s.collections.posts.find((p) => p.slug.startsWith("como-escolho"))`);
  expect(post).toMatchObject({ slug: "como-escolho-as-ferramentas-do-meu-dia-a-dia", published: true, tags: ["produtividade"] });
  expect(typeof post.publishedAt).toBe("number");

  // Publicar o site: mudanças pendentes -> publicando -> publicado.
  const bar = page.locator("[data-publish-status]:visible");
  await expect(bar).toHaveAttribute("data-publish-status", "pending");
  await page.getByRole("button", { name: "Publicar site" }).click();
  await expect(bar).toHaveAttribute("data-publish-status", "publishing");
  await expect(bar).toHaveAttribute("data-publish-status", "published", { timeout: 8_000 });
  await shot(page, "blog-publicado");
});

test("depoimentos enviados: aprovar um e recusar outro", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name: /^Contatos/ })).toContainText("2");
  await page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name: "Depoimentos" }).click();
  await page.getByRole("link", { name: /Enviados para aprovar/ }).click();
  await expect(page.getByRole("list", { name: "Depoimentos enviados" }).getByRole("listitem")).toHaveCount(2);
  await shot(page, "depoimentos-fila");

  const first = page.getByRole("listitem").filter({ hasText: "Rafael Souza" });
  await first.getByRole("button", { name: "Aprovar" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Cargo" }).fill("Diretor de produto");
  await dialog.getByRole("button", { name: "Aprovar" }).click();
  await expect(page.getByText(/Aprovado e publicado/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Depoimentos enviados" }).getByRole("listitem")).toHaveCount(1);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("listitem").filter({ hasText: "Ana Paula" }).getByRole("button", { name: "Recusar" }).click();
  await expect(page.getByText("Nenhum depoimento esperando aprovação.")).toBeVisible();

  const created = await demoState<{ author: string; published: boolean; quote: Record<string, string> }[]>(page, `(s) => s.collections.testimonials.filter((t) => t.author === "Rafael Souza")`);
  expect(created).toHaveLength(1);
  expect(created[0]).toMatchObject({ published: true });
  await page.getByRole("link", { name: "No site" }).click();
  await expect(page.getByRole("link", { name: "Rafael Souza" })).toBeVisible();
});

test("contatos: caixa de entrada, contador e tentar de novo uma falha", async ({ page }) => {
  await login(page);
  await page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name: /^Contatos/ }).click();
  await expect(page.getByRole("list", { name: "Contatos" }).getByRole("listitem")).toHaveCount(2);
  await shot(page, "contatos");
  await page.getByRole("link", { name: /Marina Alves/ }).click();
  await expect(page.getByRole("article", { name: "Contato de Marina Alves" })).toContainText("orçamento");
  // Abrir marca como lido: o contador do menu cai.
  await expect(page.getByRole("navigation", { name: "Menu do painel" }).getByRole("link", { name: /^Contatos/ })).toContainText("1");
  await page.getByRole("article").getByRole("button", { name: "Tentar de novo" }).click();
  await expect(page.getByText("Nova tentativa feita.")).toBeVisible();
  await page.getByRole("link", { name: /Falhas de entrega/ }).click();
  await expect(page.getByText("Nenhuma falha de entrega.")).toBeVisible();
});

test("propostas: editar cria a versão 3 e mostra o que mudou; aceita é só leitura", async ({ page }) => {
  await login(page);
  await page.goto("/admin/propostas");
  await shot(page, "propostas");
  await page.getByRole("link", { name: "Clínica Viva", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Clínica Viva" })).toBeVisible();
  await page.getByRole("spinbutton", { name: /^Valor final/ }).fill("8200");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Salvo como versão 3.")).toBeVisible();
  await page.getByText(/Versão 2 → 3/).click();
  await expect(page.getByText("R$ 8.200,00").last()).toBeVisible();
  await shot(page, "proposta-editor");
  // Desconto inválido: o valor original precisa ser maior que o final.
  await page.getByRole("spinbutton", { name: /^Valor original/ }).fill("8000");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Valor original precisa ser maior que o valor do projeto")).toBeVisible();
  await page.goto("/admin/propostas");
  await page.getByRole("link", { name: "Orbita Tecnologia", exact: true }).click();
  await expect(page.getByText(/foi aceita em/)).toBeVisible();
  await expect(page.getByText("Aceite eletrônico")).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar" })).toBeDisabled();
});

test("privacidade: exportar e excluir dados exige repetir o e-mail", async ({ page }) => {
  await login(page);
  await page.goto("/admin/privacidade");
  await page.getByLabel("E-mail da pessoa").fill("julia@agencia.co");
  await page.getByRole("button", { name: "Buscar dados" }).click();
  await expect(page.getByText(/Encontrado: 1 registro de julia@agencia.co/)).toBeVisible();
  const erase = page.getByRole("button", { name: "Excluir os dados" });
  await expect(erase).toBeDisabled();
  await page.getByLabel("Repita o e-mail").fill("julia@agencia.co");
  await shot(page, "privacidade");
  page.once("dialog", (d) => d.accept());
  await erase.click();
  await expect(page.getByText(/Dados excluídos \(1 registro\)/)).toBeVisible();
  const left = await demoState<number>(page, `(s) => s.business.contacts.filter((c) => c.email === "julia@agencia.co").length`);
  expect(left).toBe(0);
});

test("aparência: esquema de cor e fonte aparecem na prévia", async ({ page }) => {
  await login(page);
  await page.goto("/admin/aparencia");
  await page.getByRole("button", { name: /^Paper Noir/ }).click();
  await page.getByLabel("Texto", { exact: true }).fill("Manrope");
  const preview = page.frameLocator('iframe[title="Prévia da página"]');
  await expect(preview.locator("html")).toHaveAttribute("data-scheme", "paper-noir");
  await expect(preview.locator("#rb-preview-fonts")).toHaveAttribute("href", /family=Manrope/);
  await shot(page, "aparencia");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(/Aparência salva/)).toBeVisible();
  const saved = await demoState<{ appearance: { scheme: string; fontSans: string } }>(page, `(s) => s.settings`);
  expect(saved.appearance).toMatchObject({ scheme: "paper-noir", fontSans: "Manrope" });
});

test("menu por papel: editora vê conteúdo, não vê contatos nem privacidade nem o botão de publicar", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("E-mail").fill("editora@rubrica.dev");
  await page.getByLabel("Senha").fill("Editora2026!x");
  await page.getByRole("button", { name: "Entrar" }).click();
  const menu = page.getByRole("navigation", { name: "Menu do painel" });
  await expect(menu.getByRole("link", { name: "Blog" })).toBeVisible();
  await expect(menu.getByRole("link", { name: /Contatos/ })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: /Privacidade/ })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Atividades" })).toHaveCount(0);
  await expect(page.locator("[data-publish-status]:visible")).toBeVisible();
  await expect(page.getByRole("button", { name: "Publicar site" })).toHaveCount(0);
});
