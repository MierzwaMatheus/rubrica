import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const SHOTS = process.env.SCREENSHOT_DIR;

async function login(page: Page, email?: string, password?: string) {
  await page.goto("/admin");
  if (email) await page.getByLabel("E-mail").fill(email);
  if (password) await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Olá/ })).toBeVisible();
}

/** Abre os grupos recolhidos do menu lateral (eles começam fechados, menos o da tela aberta). */
async function openMenuGroups(page: Page) {
  const closed = page.getByRole("navigation", { name: "Menu do painel" }).locator('button[aria-expanded="false"]');
  while ((await closed.count()) > 0) await closed.first().click();
}

const preview = (page: Page) => page.frameLocator('iframe[title="Prévia da página"]');
const demoState = <T>(page: Page, fn: string) => page.evaluate(`(${fn})(window.__rubricaDemo.state)`) as Promise<T>;

test("editor de páginas: editar, prévia ao vivo, validação, reordenar, ocultar e salvar", async ({ page }) => {
  await login(page);
  await openMenuGroups(page);
  await page.getByRole("link", { name: "Páginas", exact: true }).click();
  await page.locator("main").getByRole("link", { name: "Início", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/paginas\/editar\?id=home/);

  // Prévia com o tema e o conteúdo do rascunho.
  await expect(preview(page).locator("h1")).toContainText("Interfaces que as pessoas entendem");
  const title = page.getByRole("textbox", { name: /^Título/ }).first();
  await title.fill("Um título novo, ao vivo");
  await expect(preview(page).locator("h1")).toHaveText("Um título novo, ao vivo");
  await expect(page.getByText("mudanças não salvas")).toBeVisible();

  // Bloco novo do catálogo; salvar sem o obrigatório mostra o erro no campo.
  await page.getByRole("button", { name: "Adicionar bloco" }).click();
  await page.getByRole("button", { name: /^Chamada/ }).click();
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("A página tem campos a corrigir.")).toBeVisible();
  await expect(page.getByText("Título: obrigatório")).toBeVisible();
  await expect(page.getByText("Botão principal: obrigatório")).toBeVisible();

  const id = await page.locator("li[data-block-id]", { has: page.getByText("Título: obrigatório") }).getAttribute("data-block-id");
  const card = page.locator(`li[data-block-id="${id}"]`);
  await card.getByRole("textbox", { name: /^Título/ }).fill("Vamos conversar?");
  await card.getByLabel("Texto do botão").first().fill("Escrever");
  await card.getByLabel("Endereço").first().fill("/contato");
  await expect(preview(page).getByRole("heading", { name: "Vamos conversar?" })).toBeVisible();

  // Reordenar pelo teclado (Alt+↑) na alça do bloco.
  const order = () => page.locator("ol[aria-label='Blocos da página'] > li").evaluateAll((els) => els.map((e) => e.getAttribute("data-block-id")));
  const before = await order();
  await card.getByRole("button", { name: /^Mover Chamada/ }).focus();
  await page.keyboard.press("Alt+ArrowUp");
  const after = await order();
  expect(after.indexOf(id)).toBe(before.indexOf(id) - 1);

  // Ocultar tira o bloco da prévia (como do site).
  await card.getByRole("button", { name: "Ocultar Chamada" }).click();
  await expect(preview(page).getByRole("heading", { name: "Vamos conversar?" })).toHaveCount(0);
  await card.getByRole("button", { name: "Mostrar Chamada" }).click();

  // Prévia em inglês.
  await page.getByLabel("Idioma da prévia").selectOption("en");
  await expect(preview(page).locator("html")).toHaveAttribute("lang", "en");
  await page.getByLabel("Idioma da prévia").selectOption("pt-BR");

  // Corrigir o campo tira o erro do bloco.
  await expect(card.getByText("Título: obrigatório")).toHaveCount(0);

  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Página salva.")).toBeVisible();
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SHOTS}/editor-desktop.png` });
  }
  await expect(page.getByText("mudanças não salvas")).toHaveCount(0);
  const saved = await demoState<{ blocks: { type: string; fields: Record<string, unknown> }[] }>(page, `(s) => s.pages.find((p) => p._id === "home")`);
  expect(saved.blocks.find((b) => b.type === "hero")!.fields.title).toMatchObject({ "pt-BR": "Um título novo, ao vivo" });
  expect(saved.blocks.find((b) => b.type === "cta" && (b.fields.title as Record<string, string>)["pt-BR"] === "Vamos conversar?")).toBeTruthy();
});

test("criar página livre e abrir no editor", async ({ page }) => {
  await login(page);
  await page.goto("/admin/paginas");
  await page.getByRole("button", { name: "Nova página" }).click();
  await page.getByRole("textbox", { name: "Título" }).fill("Serviços de design");
  await expect(page.getByLabel("Caminho")).toHaveValue("/servicos-de-design");
  await page.getByRole("button", { name: "Criar página" }).click();
  await expect(page).toHaveURL(/\/admin\/paginas\/editar\?id=/);
  await expect(page.getByRole("heading", { level: 1, name: "Serviços de design" })).toBeVisible();
  await expect(page.getByText("rascunho", { exact: true })).toBeVisible();
  // Sem título em inglês, a página não existe em inglês.
  await page.getByLabel("Idioma da prévia").selectOption("en");
  await expect(preview(page).getByText(/não existe em en/)).toBeVisible();
});

test("menu e telas filtrados pelo papel", async ({ page }) => {
  await login(page, "editora@rubrica.dev", "Editora2026!x");
  await openMenuGroups(page);
  const menu = page.getByRole("navigation", { name: "Menu do painel" });
  await expect(menu.getByRole("link", { name: "Páginas" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Usuários" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Propostas" })).toHaveCount(0);
  await page.goto("/admin/usuarios");
  await expect(page.getByText(/não tem acesso a esta tela/)).toBeVisible();
});
