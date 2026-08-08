import { writeFile, mkdtemp, rm, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const GITHUB_REPO = "MierzwaMatheus/rubrica";

/**
 * Retorna a tag da versão mais recente da release do GitHub.
 * Lança erro amigável em caso de falha de rede ou release inexistente.
 */
export async function getLatestVersion(): Promise<string> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "create-rubrica-cli" },
    });
  } catch {
    throw new Error(
      "Erro de rede ao consultar o GitHub. Verifique sua conexão e tente novamente."
    );
  }
  if (!response.ok) {
    throw new Error(
      `Não foi possível obter a versão mais recente do Rubrica (HTTP ${response.status}). Verifique sua conexão.`
    );
  }
  const data = (await response.json()) as { tag_name?: string };
  if (!data.tag_name) {
    throw new Error(
      "Release sem tarball encontrada no GitHub. Tente novamente mais tarde."
    );
  }
  return data.tag_name;
}

/**
 * Baixa e extrai o tarball da release indicada no diretório alvo.
 * Usa tar do sistema operacional para extração.
 */
export async function downloadRelease(
  targetDir: string,
  version: string
): Promise<void> {
  const tarballUrl = `https://api.github.com/repos/${GITHUB_REPO}/tarball/${version}`;

  let response: Response;
  try {
    response = await fetch(tarballUrl, {
      headers: { "User-Agent": "create-rubrica-cli" },
      redirect: "follow",
    });
  } catch {
    throw new Error(
      "Erro de rede ao baixar o Rubrica. Verifique sua conexão e tente novamente."
    );
  }

  if (!response.ok) {
    throw new Error(
      `Não foi possível baixar o Rubrica (HTTP ${response.status}).`
    );
  }

  if (!response.body) {
    throw new Error("Release sem tarball encontrada. Tente novamente mais tarde.");
  }

  const tmpDir = await mkdtemp(join(tmpdir(), "rubrica-download-"));
  const tmpFile = join(tmpDir, "rubrica.tar.gz");

  try {
    const buffer = await response.arrayBuffer();
    await writeFile(tmpFile, Buffer.from(buffer));
    await mkdir(targetDir, { recursive: true });
    await execFileAsync("tar", ["-xzf", tmpFile, "--strip-components=1", "-C", targetDir]);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}
