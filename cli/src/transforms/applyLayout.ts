import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";

export interface LayoutFsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
  copyFile: (src: string, dest: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
}

type Layout = "cyberpunk" | "brutalist" | "swiss" | "bento" | "magazine";

const LAYOUT_FILES: Record<Layout, { copy: string[]; remove: string[]; pages?: string[] }> = {
  cyberpunk: {
    copy: ["Layout.tsx", "Sidebar.tsx"],
    remove: ["Navbar.tsx", "Footer.tsx"],
  },
  brutalist: {
    copy: ["Layout.tsx", "Navbar.tsx"],
    remove: ["Sidebar.tsx", "Footer.tsx"],
    pages: ["Home.tsx", "Resume.tsx", "Portfolio.tsx", "About.tsx", "Blog.tsx"],
  },
  swiss: {
    copy: ["Layout.tsx", "Sidebar.tsx"],
    remove: ["Navbar.tsx", "Footer.tsx"],
  },
  bento: {
    copy: ["Layout.tsx", "FloatingDock.tsx"],
    remove: [],
    pages: ["Home.tsx", "Resume.tsx", "Portfolio.tsx", "About.tsx", "Blog.tsx"],
  },
  magazine: {
    copy: ["Layout.tsx", "Masthead.tsx"],
    remove: ["Sidebar.tsx", "Footer.tsx"],
    pages: ["Home.tsx", "Resume.tsx", "Portfolio.tsx", "About.tsx", "Blog.tsx"],
  },
};

const defaultFs: LayoutFsModule = {
  ...(nodeFsPromises as unknown as LayoutFsModule),
  exists: async (p: string) => {
    try {
      await nodeFsPromises.access(p);
      return true;
    } catch {
      return false;
    }
  },
};

export async function applyLayout(
  layout: Layout,
  options: { projectDir: string; templatesDir: string },
  fsModule: LayoutFsModule = defaultFs
): Promise<void> {
  const spec = LAYOUT_FILES[layout];
  if (!spec) {
    throw new Error(`applyLayout: layout "${layout}" não reconhecido.`);
  }

  const { projectDir, templatesDir } = options;
  const srcDir = path.join(templatesDir, "layouts", layout);
  const destDir = path.join(projectDir, "src", "components");

  await fsModule.mkdir(destDir, { recursive: true });

  for (const file of spec.copy) {
    await fsModule.copyFile(path.join(srcDir, file), path.join(destDir, file));
  }

  for (const file of spec.remove) {
    const filePath = path.join(destDir, file);
    if (await fsModule.exists(filePath)) {
      await fsModule.unlink(filePath);
    }
  }

  if (spec.pages?.length) {
    const pagesDestDir = path.join(projectDir, "src", "pages");
    await fsModule.mkdir(pagesDestDir, { recursive: true });
    for (const file of spec.pages) {
      await fsModule.copyFile(
        path.join(srcDir, "pages", file),
        path.join(pagesDestDir, file)
      );
    }
  }
}
