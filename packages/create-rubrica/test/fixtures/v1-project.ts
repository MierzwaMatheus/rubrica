/** Um projeto v1 fictício (git, rubrica.json 1.13.1, personalizações) e a v1 de referência dele. */
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { snapshotZip } from "../../src/migrate/snapshot";
import { writeFiles } from "../../src/utils/fs";
import { run } from "../../src/utils/exec";
import { V1_RUBRICA_JSON, v1Export } from "./v1-export";
import { tmp } from "../helpers";

/** Arquivos de um "template v1" mínimo (o que o pristine montaria). */
export const TEMPLATE: Record<string, string> = {
  "package.json": JSON.stringify({ name: "site-da-bruna", version: "1.13.1", dependencies: { react: "^19" } }, null, 2),
  "index.html": "<html><head><title>x</title></head></html>",
  "vite.config.ts": "export default {};",
  "src/pages/Home.tsx": "export default function Home() { return null; }\n",
  "src/components/Sidebar.tsx": "export function Sidebar() { return null; }\n",
  "src/index.css": ":root { --bg: #000; }\n",
  "convex/posts.ts": "export const list = 1;\n",
  "convex/schema.ts": "export default {};\n",
  "public/favicon.svg": "<svg/>",
  "README.md": "# Rubrica\n",
  "tests/app.test.ts": "test",
};

export function v1Project(layout = "cyberpunk") {
  const dir = tmp("rubrica-v1-");
  writeFiles(dir, {
    ...TEMPLATE,
    "src/pages/Home.tsx": "export default function Home() { return <h1>Minha home</h1>; }\nexport const extra = 1;\n",
    "src/components/Terminal.tsx": "export function Terminal() { return null; }\n",
    "convex/newsletter.ts": "export const subscribe = 1;\n",
    "src/index.css": ":root { --bg: #111; }\n",
    "public/cv.pdf": "%PDF",
    "docs/notas.md": "# notas\n",
    "rubrica.json": JSON.stringify({ ...V1_RUBRICA_JSON, layout }, null, 2),
    ".gitignore": "node_modules\n.env.local\nmeus-rascunhos/\n",
  });
  rmSync(join(dir, "tests"), { recursive: true });
  writeFileSync(join(dir, ".env.local"), "CONVEX_DEPLOYMENT=dev:nao-mexer\n");
  run("git", ["init", "-q", "-b", "main"], { cwd: dir });
  run("git", ["add", "-A"], { cwd: dir });
  run("git", ["-c", "user.email=t@t", "-c", "user.name=t", "commit", "-qm", "v1"], { cwd: dir });
  const exportZip = join(tmp(), "export-v1.zip");
  writeFileSync(exportZip, snapshotZip(v1Export()));
  return { dir, exportZip };
}

export const pristine = async (dir: string) => writeFiles(dir, TEMPLATE);

