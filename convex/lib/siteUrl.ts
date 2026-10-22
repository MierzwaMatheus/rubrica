import { rubricalConfig } from "../../rubrica.config";

const DEV_ORIGINS = ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];

/** URL pública do site: env SITE_URL do deployment Convex, senão rubrica.config.ts. */
export function siteUrl(): string {
  return (process.env.SITE_URL || rubricalConfig.siteUrl).replace(/\/+$/, "");
}

/** Origens aceitas pelos endpoints HTTP: o site (com e sem www) e o dev server. */
export function allowedOrigins(): Set<string> {
  const origins = new Set(DEV_ORIGINS);
  try {
    const url = new URL(siteUrl());
    origins.add(url.origin);
    const host = url.hostname.startsWith("www.") ? url.hostname.slice(4) : `www.${url.hostname}`;
    origins.add(`${url.protocol}//${host}${url.port ? `:${url.port}` : ""}`);
  } catch {
    // siteUrl inválida: só as origens de desenvolvimento
  }
  return origins;
}
