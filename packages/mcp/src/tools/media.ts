import { readFile, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { RubricaError } from "../client";
import { diffValues } from "../diff";
import { ImageError, MAX_IMAGE_BYTES, inspectImage } from "../media-file";
import { localizedSchema } from "../schema/json-schema";
import { siteLocales } from "../state";
import { prop } from "./shared";
import { commit, ToolInputError, type ToolDef } from "./types";

interface MediaDoc {
  _id: string;
  storageId: string;
  name: string;
  folder: string;
  url: string | null;
  alt?: Record<string, string>;
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  createdAt: number;
}

const toImage = (m: { url: string | null; storageId: string; alt?: Record<string, string>; width?: number; height?: number }) => ({
  url: m.url ?? "",
  storageId: m.storageId,
  ...(m.alt && Object.keys(m.alt).length ? { alt: m.alt } : {}),
  ...(m.width ? { width: m.width } : {}),
  ...(m.height ? { height: m.height } : {}),
});

export const mediaTools: ToolDef[] = [
  {
    name: "media_list",
    title: "Listar imagens",
    description: 'Lista a biblioteca de imagens (mais novas primeiro). Cada item traz `image`: o objeto pronto para usar em campos de imagem (capa, hero, galeria).',
    access: { permission: "media" },
    input: () => ({
      type: "object",
      properties: {
        folder: prop.string('Pasta, ex.: "/blog". Padrão: todas.'),
        search: prop.string("Filtra pelo nome do arquivo."),
        limit: { type: "integer", minimum: 1, maximum: 200, description: "Padrão: 30." },
      },
      additionalProperties: false,
    }),
    async handler(args: { folder?: string; search?: string; limit?: number }, ctx) {
      const docs = await ctx.client.query<MediaDoc[]>("rubrica/media:list", args.folder ? { folder: args.folder } : {});
      const needle = args.search?.toLowerCase();
      const rows = docs.filter((d) => !needle || d.name.toLowerCase().includes(needle));
      return {
        total: rows.length,
        images: rows.slice(0, args.limit ?? 30).map((d) => ({ id: d._id, name: d.name, folder: d.folder, size: d.size, contentType: d.contentType, image: toImage(d) })),
      };
    },
  },
  {
    name: "media_upload",
    title: "Subir imagem",
    description:
      "Sobe uma imagem de um caminho local para a biblioteca (PNG, JPG, WebP, AVIF, GIF ou SVG, até 20 MB; o tipo é conferido pelo conteúdo). Devolve `image`, o objeto pronto para campos de imagem. Escreva sempre o `alt`, descrevendo a imagem, por idioma.",
    access: { permission: "media" },
    write: true,
    input: ({ state }) => ({
      type: "object",
      properties: {
        path: prop.string("Caminho do arquivo nesta máquina (absoluto ou relativo à pasta do agente)."),
        name: prop.string("Nome na biblioteca. Padrão: o nome do arquivo."),
        folder: prop.string('Pasta, ex.: "/blog" (letras, números, _ - e espaço; até 6 níveis). Padrão: "/".'),
        alt: localizedSchema({ locales: siteLocales(state) }, "Texto alternativo, descrevendo o que a imagem mostra (sem \"imagem de\")."),
      },
      required: ["path"],
      additionalProperties: false,
    }),
    async handler(args: { path: string; name?: string; folder?: string; alt?: Record<string, string> }, ctx) {
      const file = resolve(args.path);
      let bytes: Uint8Array;
      try {
        const info = await stat(file);
        if (!info.isFile()) throw new ToolInputError(`${file} não é um arquivo.`);
        if (info.size > MAX_IMAGE_BYTES) throw new ToolInputError(`Imagem acima de 20 MB (${(info.size / 1048576).toFixed(1)} MB).`);
        bytes = new Uint8Array(await readFile(file));
      } catch (e) {
        if (e instanceof ToolInputError) throw e;
        throw new ToolInputError(`Não consegui ler ${file}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
      }
      let meta;
      try {
        meta = inspectImage(file, bytes);
      } catch (e) {
        if (e instanceof ImageError) throw new ToolInputError(e.message);
        throw e;
      }
      const name = (args.name ?? basename(file)).trim() || "imagem";
      const warnings: string[] = [];
      if (!args.alt || Object.keys(args.alt).length === 0) warnings.push("Sem `alt`: descreva a imagem (acessibilidade e SEO). Dá para preencher depois no campo de imagem.");
      return commit(ctx, {
        summary: `Subir ${name} (${meta.contentType}, ${(bytes.length / 1024).toFixed(0)} KB${meta.width ? `, ${meta.width}x${meta.height}` : ""}) para ${args.folder ?? "/"}.`,
        changes: diffValues(undefined, { name, folder: args.folder ?? "/", ...(args.alt ? { alt: args.alt } : {}) }, siteLocales(ctx.state)),
        warnings,
        info: { file, contentType: meta.contentType, bytes: bytes.length, ...(meta.width ? { width: meta.width, height: meta.height } : {}) },
        apply: async () => {
          const uploadUrl = await ctx.client.mutation<string>("rubrica/media:generateUploadUrl", {});
          const { storageId } = await ctx.client.upload(uploadUrl, bytes, meta.contentType);
          const saved = await ctx.client
            .mutation<{ id: string; url: string | null }>("rubrica/media:save", {
              storageId,
              name,
              ...(args.folder ? { folder: args.folder } : {}),
              ...(args.alt ? { alt: args.alt } : {}),
              ...(meta.width ? { width: meta.width, height: meta.height } : {}),
            })
            .catch((e: unknown) => {
              if (e instanceof RubricaError) throw new RubricaError(`Subiu, mas o registro na biblioteca falhou: ${e.message}`, e.kind);
              throw e;
            });
          return { id: saved.id, image: toImage({ url: saved.url, storageId, alt: args.alt, width: meta.width, height: meta.height }) };
        },
      });
    },
  },
];
