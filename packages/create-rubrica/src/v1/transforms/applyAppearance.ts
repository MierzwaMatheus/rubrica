import * as nodeFsPromises from "node:fs/promises";
import type { ColorMode, Texture } from "../layouts.js";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface Appearance {
  /** Modo de cor padrão do site. */
  colorMode: ColorMode;
  /** Se quem visita pode alternar entre claro e escuro. */
  colorModeToggle: boolean;
  /** Textura sobre a página inteira. */
  texture: Texture;
}

export const DEFAULT_APPEARANCE: Appearance = { colorMode: "dark", colorModeToggle: false, texture: "none" };

/** Troca (ou acrescenta) um atributo na tag de abertura do <html>. */
function setAttr(tag: string, name: string, value: string): string {
  const re = new RegExp(`\\s${name}="[^"]*"`);
  return re.test(tag) ? tag.replace(re, ` ${name}="${value}"`) : tag.replace(/>$/, ` ${name}="${value}">`);
}

/**
 * Grava a aparência como atributos do <html> no index.html. O script do próprio
 * index.html e o ThemeProvider leem esses atributos; o CSS usa `data-texture`.
 * A classe `dark` inicial segue o modo, para a página já abrir certa.
 */
export async function applyAppearance(
  appearance: Appearance,
  htmlPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const html = await fsModule.readFile(htmlPath, "utf-8");
  const updated = html.replace(/<html\b[^>]*>/, (tag) => {
    let t = setAttr(tag, "data-color-mode", appearance.colorMode);
    t = setAttr(t, "data-color-toggle", String(appearance.colorModeToggle));
    t = setAttr(t, "data-texture", appearance.texture);
    const darkClass = appearance.colorMode === "light" ? "" : "dark";
    if (/\sclass="[^"]*"/.test(t)) {
      t = t.replace(/\sclass="([^"]*)"/, (_m, cls: string) => {
        const rest = cls.split(/\s+/).filter((c) => c && c !== "dark");
        const all = darkClass ? [...rest, darkClass] : rest;
        return all.length ? ` class="${all.join(" ")}"` : "";
      });
    } else if (darkClass) {
      t = t.replace(/^<html/, `<html class="${darkClass}"`);
    }
    return t;
  });
  await fsModule.writeFile(htmlPath, updated);
}
