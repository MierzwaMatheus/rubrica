// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { buildMenu } from "../../src/admin/routes";
import { RouterProvider, useRouter } from "../../src/admin/lib/router";
import { SIDEBAR_STORAGE_KEY } from "../../src/admin/lib/sidebar";
import { SidebarNav } from "../../src/admin/SidebarNav";
import { enabledPlugins } from "../../src/plugins/contract";
import { CORE_PLUGINS } from "../../src/plugins/registry";

const menu = buildMenu({ role: "root", kind: "pessoal", enabled: enabledPlugins(CORE_PLUGINS, "pessoal", {}), plugins: CORE_PLUGINS });

function Nav() {
  const { path } = useRouter();
  return <SidebarNav menu={menu} path={path} />;
}

const renderAt = (path: string) => {
  window.history.replaceState(null, "", path);
  return render(
    <RouterProvider>
      <Nav />
    </RouterProvider>,
  );
};

const header = (name: string) => screen.getByRole("button", { name });
const stored = () => JSON.parse(localStorage.getItem(SIDEBAR_STORAGE_KEY) ?? "{}");

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe("SidebarNav", () => {
  it("abre só o grupo da tela aberta; o Início fica fora dos grupos", () => {
    renderAt("/admin/blog");
    expect(header("Conteúdo").getAttribute("aria-expanded")).toBe("true");
    expect(header("Site").getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("link", { name: "Blog" }).getAttribute("aria-current")).toBe("page");
    expect(screen.queryByRole("link", { name: "Páginas" })).toBeNull();
    expect(screen.getByRole("link", { name: "Início" })).toBeTruthy();
    const list = document.getElementById(header("Conteúdo").getAttribute("aria-controls")!);
    expect(list?.hidden).toBe(false);
  });

  it("recolhe e expande pelo botão do grupo e guarda a escolha", () => {
    renderAt("/admin");
    const site = header("Site");
    expect(site.tagName).toBe("BUTTON");
    expect(site.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(site);
    expect(site.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Páginas" })).toBeTruthy();
    expect(stored()).toMatchObject({ Site: true });
    fireEvent.click(site);
    expect(site.getAttribute("aria-expanded")).toBe("false");
    expect(stored()).toMatchObject({ Site: false });
  });

  it("volta com os grupos como ficaram guardados", () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify({ Comercial: true, Administração: false }));
    renderAt("/admin");
    expect(header("Comercial").getAttribute("aria-expanded")).toBe("true");
    expect(header("Administração").getAttribute("aria-expanded")).toBe("false");
  });

  it("abre o grupo de destino ao navegar para uma tela dele", () => {
    renderAt("/admin");
    expect(header("Comercial").getAttribute("aria-expanded")).toBe("false");
    act(() => {
      window.history.pushState(null, "", "/admin/propostas");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(header("Comercial").getAttribute("aria-expanded")).toBe("true");
    expect(stored()).toMatchObject({ Comercial: true });
  });
});
