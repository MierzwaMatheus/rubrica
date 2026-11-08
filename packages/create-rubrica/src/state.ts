/**
 * Estado do projeto no `rubrica.json` (v2). O CLI mantém este arquivo: o `update`, o
 * `config`, o `ejetar` e o `publicar` dependem dele. A pessoa (e o agente) não edita à mão.
 *
 * O que vai para o Convex (`siteSettings`) sai daqui por `settingsFromState`: o setup
 * grava no banco do computador e o publicar, no de produção, para os dois começarem iguais.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { SiteKind, SiteSettings } from "@rubrica/core";
import type { ColorMode } from "./themes.js";

export interface Identity {
  /** Nome do site (ou da empresa). */
  nome: string;
  /** URL pública, com https e sem barra no final. */
  url: string;
  descricao: string;
  /** Dono do site (pessoal) ou contato principal (empresa). */
  autor?: string;
  email?: string;
  twitter?: string;
}

export interface EjectedComponent {
  /** Tipo do bloco ejetado. */
  tipo: string;
  /** Pasta da cópia, relativa ao projeto (`src/overrides/hero`). */
  pasta: string;
  /** Arquivo que a integração usa (`src/overrides/hero/index.tsx`). */
  arquivo: string;
  /** De onde veio: `@rubrica/core` ou o pacote do tema. */
  origem: string;
  /** Versão do pacote de origem na hora da cópia. */
  versao: string;
  /** Hash do componente original na hora da cópia (o `update` compara). */
  hash: string;
  /** Arquivo de origem dentro do pacote. */
  arquivoOrigem: string;
  /** Nome do componente exportado no arquivo de origem. */
  componente: string;
}

export interface RubricaState {
  /** Formato do arquivo. A v1 não tinha este campo. */
  rubrica: 2;
  /** Versão do `@rubrica/core` em uso. */
  version: string;
  tipo: SiteKind;
  /** Tema instalado (id sem o escopo). */
  tema: string;
  /** Tema escolhido que ainda não foi portado (o site usa `tema` enquanto isso). */
  temaDesejado?: string;
  identidade: Identity;
  idiomas: { lista: string[]; principal: string };
  aparencia: {
    esquema?: string;
    modo: ColorMode;
    alternancia: boolean;
    fonteSans?: string;
    fonteMono?: string;
  };
  plugins: Record<string, boolean>;
  ejetados?: Record<string, EjectedComponent>;
  producao?: { convexUrl?: string; siteUrl?: string };
  telemetria?: { projeto?: string; ativa?: boolean };
  /**
   * Analytics (plugin `analytics`, Umami): endereço do script e id do site. A origem do
   * script entra na CSP do `vercel.json` e do `public/_headers` (`config --analytics`).
   */
  analytics?: { script: string; id?: string };
  /** Projeto migrado da v1. */
  migracao?: { de: string; layoutV1: string; em: string };
  [key: string]: unknown;
}

export const STATE_FILE = "rubrica.json";

export class NotAProjectError extends Error {}

/** Sobe a partir de `start` até achar um `rubrica.json`; devolve a pasta do projeto. */
export function findProjectDir(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(join(dir, STATE_FILE))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new NotAProjectError("Rode este comando na pasta de um projeto Rubrica (não achei o rubrica.json).");
    dir = parent;
  }
}

export function readRawState(projectDir: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(projectDir, STATE_FILE), "utf-8")) as Record<string, unknown>;
}

/** É um projeto da v1 (sem `rubrica: 2`)? */
export function isV1State(raw: Record<string, unknown>): boolean {
  return raw.rubrica !== 2 && typeof raw.layout === "string";
}

export function readState(projectDir: string): RubricaState {
  const raw = readRawState(projectDir);
  if (isV1State(raw)) {
    throw new NotAProjectError(
      `Este projeto é da v1 do Rubrica (${String(raw.version ?? "?")}). Para levá-lo à v2, rode npx create-rubrica@latest migrar.`,
    );
  }
  if (raw.rubrica !== 2) throw new NotAProjectError("rubrica.json sem o campo \"rubrica\": 2. O arquivo é mantido pelo CLI; não edite à mão.");
  return raw as RubricaState;
}

export function writeState(projectDir: string, state: RubricaState): void {
  writeFileSync(join(projectDir, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
}

export function updateState(projectDir: string, patch: Partial<RubricaState>): RubricaState {
  const next = { ...readState(projectDir), ...patch } as RubricaState;
  writeState(projectDir, next);
  return next;
}

/** Texto no idioma principal e nos outros (os outros, só se a pessoa traduzir depois). */
const inMain = (state: Pick<RubricaState, "idiomas">, text: string) => (text ? { [state.idiomas.principal]: text } : {});

/**
 * Configurações do site para o Convex. O que o painel edita depois (menu, redes)
 * começa vazio: o seed monta o menu a partir das páginas da receita.
 */
export function settingsFromState(state: RubricaState): SiteSettings & { appearance: SiteSettings["appearance"] & { scheme?: string } } {
  const id = state.identidade;
  return {
    kind: state.tipo,
    name: inMain(state, id.nome),
    description: inMain(state, id.descricao),
    url: id.url,
    locales: { locales: state.idiomas.lista, default: state.idiomas.principal },
    theme: state.tema,
    appearance: {
      colorMode: state.aparencia.modo,
      colorToggle: state.aparencia.alternancia,
      ...(state.aparencia.esquema && { scheme: state.aparencia.esquema }),
      ...(state.aparencia.fonteSans && { fontSans: state.aparencia.fonteSans }),
      ...(state.aparencia.fonteMono && { fontMono: state.aparencia.fonteMono }),
    },
    navigation: [],
    social: [],
    ...(state.tipo === "pessoal" && id.autor && { person: { name: id.autor, ...(id.email && { email: id.email }) } }),
    ...(state.tipo === "empresa" && { organization: { ...(id.email && { email: id.email }) } }),
    plugins: state.plugins,
    ...(id.twitter && { twitterHandle: id.twitter }),
    ...(state.analytics && { analytics: { scriptUrl: state.analytics.script, ...(state.analytics.id && { websiteId: state.analytics.id }) } }),
  };
}

/** Origem do script de analytics do projeto (para a CSP), se houver. */
export function analyticsOrigin(state: Pick<RubricaState, "analytics">): string | undefined {
  try {
    return state.analytics?.script ? new URL(state.analytics.script).origin : undefined;
  } catch {
    return undefined;
  }
}
