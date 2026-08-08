import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyLayout } from "../transforms/applyLayout.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
    copyFile: (src: string, dest: string) =>
      vol.promises.copyFile(src, dest).then(() => undefined),
    unlink: (path: string) =>
      vol.promises.unlink(path).then(() => undefined),
    exists: async (path: string) => {
      try {
        await vol.promises.access(path);
        return true;
      } catch {
        return false;
      }
    },
  };
}

const TEMPLATES_DIR = "/templates";
const PROJECT_DIR = "/project";

function makeTemplates(vol: InstanceType<typeof Volume>) {
  vol.mkdirSync("/templates/layouts/cyberpunk", { recursive: true });
  vol.writeFileSync("/templates/layouts/cyberpunk/Layout.tsx", "// cyberpunk Layout");
  vol.writeFileSync("/templates/layouts/cyberpunk/Sidebar.tsx", "// Sidebar");

  vol.mkdirSync("/project/src/components", { recursive: true });
}

describe("applyLayout", () => {
  it("layout cyberpunk copia Layout.tsx e Sidebar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(layout).toContain("cyberpunk Layout");
    expect(sidebar).toContain("Sidebar");
  });

  it("layout cyberpunk remove Navbar.tsx e Footer.tsx se existirem", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    vol.writeFileSync("/project/src/components/Navbar.tsx", "// old");
    vol.writeFileSync("/project/src/components/Footer.tsx", "// old");
    const fs = makeFsModule(vol);

    await applyLayout("cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Navbar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Footer.tsx")).toBe(false);
  });

  it("layout brutalist copia Layout.tsx e Navbar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/brutalist/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/brutalist/Layout.tsx", "// brutalist Layout");
    vol.writeFileSync("/templates/layouts/brutalist/Navbar.tsx", "// brutalist Navbar");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Home.tsx", "// brutalist Home");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Resume.tsx", "// brutalist Resume");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Portfolio.tsx", "// brutalist Portfolio");
    vol.writeFileSync("/templates/layouts/brutalist/pages/About.tsx", "// brutalist About");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Blog.tsx", "// brutalist Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("brutalist" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const navbar = vol.readFileSync("/project/src/components/Navbar.tsx", "utf-8") as string;
    expect(layout).toContain("brutalist Layout");
    expect(navbar).toContain("brutalist Navbar");
  });

  it("layout brutalist remove Sidebar.tsx e Footer.tsx se existirem", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/brutalist/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/brutalist/Layout.tsx", "// brutalist Layout");
    vol.writeFileSync("/templates/layouts/brutalist/Navbar.tsx", "// brutalist Navbar");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Home.tsx", "// brutalist Home");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Resume.tsx", "// brutalist Resume");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Portfolio.tsx", "// brutalist Portfolio");
    vol.writeFileSync("/templates/layouts/brutalist/pages/About.tsx", "// brutalist About");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Blog.tsx", "// brutalist Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    vol.writeFileSync("/project/src/components/Sidebar.tsx", "// old sidebar");
    vol.writeFileSync("/project/src/components/Footer.tsx", "// old footer");
    const fs = makeFsModule(vol);

    await applyLayout("brutalist" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Footer.tsx")).toBe(false);
  });

  it("layout swiss copia Layout.tsx e Sidebar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/swiss", { recursive: true });
    vol.writeFileSync("/templates/layouts/swiss/Layout.tsx", "// swiss Layout");
    vol.writeFileSync("/templates/layouts/swiss/Sidebar.tsx", "// swiss Sidebar");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("swiss" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(layout).toContain("swiss Layout");
    expect(sidebar).toContain("swiss Sidebar");
  });

  it("layout bento copia Layout.tsx e FloatingDock.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/bento/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/bento/Layout.tsx", "// bento Layout");
    vol.writeFileSync("/templates/layouts/bento/FloatingDock.tsx", "// bento FloatingDock");
    vol.writeFileSync("/templates/layouts/bento/pages/Home.tsx", "// bento Home");
    vol.writeFileSync("/templates/layouts/bento/pages/Resume.tsx", "// bento Resume");
    vol.writeFileSync("/templates/layouts/bento/pages/Portfolio.tsx", "// bento Portfolio");
    vol.writeFileSync("/templates/layouts/bento/pages/About.tsx", "// bento About");
    vol.writeFileSync("/templates/layouts/bento/pages/Blog.tsx", "// bento Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("bento" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const dock = vol.readFileSync("/project/src/components/FloatingDock.tsx", "utf-8") as string;
    expect(layout).toContain("bento Layout");
    expect(dock).toContain("bento FloatingDock");
  });

  it("layout bento não remove arquivos de outros layouts", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/bento/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/bento/Layout.tsx", "// bento Layout");
    vol.writeFileSync("/templates/layouts/bento/FloatingDock.tsx", "// bento FloatingDock");
    vol.writeFileSync("/templates/layouts/bento/pages/Home.tsx", "// bento Home");
    vol.writeFileSync("/templates/layouts/bento/pages/Resume.tsx", "// bento Resume");
    vol.writeFileSync("/templates/layouts/bento/pages/Portfolio.tsx", "// bento Portfolio");
    vol.writeFileSync("/templates/layouts/bento/pages/About.tsx", "// bento About");
    vol.writeFileSync("/templates/layouts/bento/pages/Blog.tsx", "// bento Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    vol.writeFileSync("/project/src/components/Sidebar.tsx", "// existing sidebar");
    const fs = makeFsModule(vol);

    await applyLayout("bento" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(true);
  });

  it("layout magazine copia Layout.tsx e Masthead.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/magazine/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/magazine/Layout.tsx", "// magazine Layout");
    vol.writeFileSync("/templates/layouts/magazine/Masthead.tsx", "// magazine Masthead");
    vol.writeFileSync("/templates/layouts/magazine/pages/Home.tsx", "// magazine Home");
    vol.writeFileSync("/templates/layouts/magazine/pages/About.tsx", "// magazine About");
    vol.writeFileSync("/templates/layouts/magazine/pages/Resume.tsx", "// magazine Resume");
    vol.writeFileSync("/templates/layouts/magazine/pages/Portfolio.tsx", "// magazine Portfolio");
    vol.writeFileSync("/templates/layouts/magazine/pages/Blog.tsx", "// magazine Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("magazine" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const masthead = vol.readFileSync("/project/src/components/Masthead.tsx", "utf-8") as string;
    expect(layout).toContain("magazine Layout");
    expect(masthead).toContain("magazine Masthead");
  });

  it("layout magazine remove Sidebar.tsx e Footer.tsx se existirem", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/magazine/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/magazine/Layout.tsx", "// magazine Layout");
    vol.writeFileSync("/templates/layouts/magazine/Masthead.tsx", "// magazine Masthead");
    vol.writeFileSync("/templates/layouts/magazine/pages/Home.tsx", "// magazine Home");
    vol.writeFileSync("/templates/layouts/magazine/pages/About.tsx", "// magazine About");
    vol.writeFileSync("/templates/layouts/magazine/pages/Resume.tsx", "// magazine Resume");
    vol.writeFileSync("/templates/layouts/magazine/pages/Portfolio.tsx", "// magazine Portfolio");
    vol.writeFileSync("/templates/layouts/magazine/pages/Blog.tsx", "// magazine Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    vol.writeFileSync("/project/src/components/Sidebar.tsx", "// old sidebar");
    vol.writeFileSync("/project/src/components/Footer.tsx", "// old footer");
    const fs = makeFsModule(vol);

    await applyLayout("magazine" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Footer.tsx")).toBe(false);
  });

  it("layout com pages[] copia arquivos de templates/layouts/<layout>/pages/ para src/pages/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/brutalist/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/brutalist/Layout.tsx", "// brutalist Layout");
    vol.writeFileSync("/templates/layouts/brutalist/Navbar.tsx", "// brutalist Navbar");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Home.tsx", "// brutalist Home");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Resume.tsx", "// brutalist Resume");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Portfolio.tsx", "// brutalist Portfolio");
    vol.writeFileSync("/templates/layouts/brutalist/pages/About.tsx", "// brutalist About");
    vol.writeFileSync("/templates/layouts/brutalist/pages/Blog.tsx", "// brutalist Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout(
      "brutalist" as Parameters<typeof applyLayout>[0],
      { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR },
      fs
    );

    const home = vol.readFileSync("/project/src/pages/Home.tsx", "utf-8") as string;
    const about = vol.readFileSync("/project/src/pages/About.tsx", "utf-8") as string;
    expect(home).toContain("brutalist Home");
    expect(about).toContain("brutalist About");
  });

  it("layout magazine copia as 5 páginas para src/pages/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/magazine/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/magazine/Layout.tsx", "// magazine Layout");
    vol.writeFileSync("/templates/layouts/magazine/Masthead.tsx", "// magazine Masthead");
    vol.writeFileSync("/templates/layouts/magazine/pages/Home.tsx", "// magazine Home");
    vol.writeFileSync("/templates/layouts/magazine/pages/About.tsx", "// magazine About");
    vol.writeFileSync("/templates/layouts/magazine/pages/Resume.tsx", "// magazine Resume");
    vol.writeFileSync("/templates/layouts/magazine/pages/Portfolio.tsx", "// magazine Portfolio");
    vol.writeFileSync("/templates/layouts/magazine/pages/Blog.tsx", "// magazine Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout(
      "magazine" as Parameters<typeof applyLayout>[0],
      { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR },
      fs
    );

    const home = vol.readFileSync("/project/src/pages/Home.tsx", "utf-8") as string;
    const resume = vol.readFileSync("/project/src/pages/Resume.tsx", "utf-8") as string;
    const portfolio = vol.readFileSync("/project/src/pages/Portfolio.tsx", "utf-8") as string;
    const about = vol.readFileSync("/project/src/pages/About.tsx", "utf-8") as string;
    const blog = vol.readFileSync("/project/src/pages/Blog.tsx", "utf-8") as string;
    expect(home).toContain("magazine Home");
    expect(resume).toContain("magazine Resume");
    expect(portfolio).toContain("magazine Portfolio");
    expect(about).toContain("magazine About");
    expect(blog).toContain("magazine Blog");
  });

  it("layout sem campo pages não copia nada para src/pages/", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/pages")).toBe(false);
  });

  it("layout bento copia as 5 páginas para src/pages/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/bento/pages", { recursive: true });
    vol.writeFileSync("/templates/layouts/bento/Layout.tsx", "// bento Layout");
    vol.writeFileSync("/templates/layouts/bento/FloatingDock.tsx", "// bento FloatingDock");
    vol.writeFileSync("/templates/layouts/bento/pages/Home.tsx", "// bento Home");
    vol.writeFileSync("/templates/layouts/bento/pages/Resume.tsx", "// bento Resume");
    vol.writeFileSync("/templates/layouts/bento/pages/Portfolio.tsx", "// bento Portfolio");
    vol.writeFileSync("/templates/layouts/bento/pages/About.tsx", "// bento About");
    vol.writeFileSync("/templates/layouts/bento/pages/Blog.tsx", "// bento Blog");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("bento" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const home = vol.readFileSync("/project/src/pages/Home.tsx", "utf-8") as string;
    const resume = vol.readFileSync("/project/src/pages/Resume.tsx", "utf-8") as string;
    const portfolio = vol.readFileSync("/project/src/pages/Portfolio.tsx", "utf-8") as string;
    const about = vol.readFileSync("/project/src/pages/About.tsx", "utf-8") as string;
    const blog = vol.readFileSync("/project/src/pages/Blog.tsx", "utf-8") as string;
    expect(home).toContain("bento Home");
    expect(resume).toContain("bento Resume");
    expect(portfolio).toContain("bento Portfolio");
    expect(about).toContain("bento About");
    expect(blog).toContain("bento Blog");
  });

  it("layout inexistente lança erro descritivo com o nome inválido", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await expect(
      applyLayout("naoexiste" as "cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs)
    ).rejects.toThrow(/naoexiste/);
  });
});
