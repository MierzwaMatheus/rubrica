import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Olá/ })).toBeVisible();
}

const demoSettings = (page: Page) => page.evaluate(`window.__rubricaDemo.state.settings`) as Promise<Record<string, any>>;

test("configurações: cor da barra do navegador, feed RSS e capa padrão", async ({ page }) => {
  await login(page);
  await page.goto("/admin/configuracoes");
  await expect(page.getByRole("heading", { name: "Ícones e barra do navegador" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  // Analytics desligado por padrão: o cartão não aparece.
  await expect(page.getByRole("heading", { name: "Analytics (Umami)" })).toHaveCount(0);

  await page.getByRole("textbox", { name: /modo escuro/ }).fill("#0a0a0a");
  await page.getByRole("textbox", { name: /^Título do feed RSS/ }).fill("Blog da Ana");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(/Configurações salvas/)).toBeVisible();
  const settings = await demoSettings(page);
  expect(settings.themeColor).toEqual({ dark: "#0a0a0a" });
  expect(settings.rss).toEqual({ title: { "pt-BR": "Blog da Ana" } });
});
