/**
 * Ponto único de hidratação: o Astro só hidrata componentes importados de forma
 * estática, então toda ilha passa por aqui e escolhe o componente pelo nome.
 * O registro (`virtual:rubrica/islands`) junta as ilhas do núcleo e as do projeto.
 */
// @ts-expect-error módulo virtual da integração
import { islands } from "virtual:rubrica/islands";
import type { ComponentType } from "react";

export interface IslandProps {
  name: string;
  props?: Record<string, unknown>;
}

export default function Island({ name, props = {} }: IslandProps) {
  const Component = (islands as Record<string, ComponentType<Record<string, unknown>>>)[name];
  if (!Component) return null;
  return <Component {...props} />;
}
