/** Peças da página de case que os templates compartilham: os números do case e o ícone pelo nome. */
import * as lucide from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { CaseMetricItem } from "../render/collections";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string }>;

/** `shield-check`, `shield_check` ou `ShieldCheck` → `ShieldCheck`. */
function pascal(name: string): string {
  return name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join("");
}

/** Componente do Lucide pelo nome (PascalCase ou kebab-case), incluindo os nomes antigos (`Building2`). */
export function lucideIcon(name: string | undefined): IconComponent | undefined {
  if (!name?.trim()) return undefined;
  const all = lucide as unknown as Record<string, IconComponent | undefined> & { icons: Record<string, IconComponent | undefined> };
  for (const key of [name.trim(), pascal(name)]) {
    const hit = all.icons[key] ?? (/^[A-Z]/.test(key) && key !== "Icon" ? all[key] : undefined);
    if (hit && (typeof hit === "function" || typeof hit === "object")) return hit;
  }
  return undefined;
}

/**
 * Ícone do Lucide pelo nome que o conteúdo deu, como SVG estático (sem JavaScript no site).
 * Nome desconhecido não desenha nada. Decorativo: `aria-hidden`.
 */
export function LucideIcon({ name, size = 20, className }: { name?: string; size?: number; className?: string }) {
  const Icon = lucideIcon(name);
  return Icon ? <Icon size={size} className={className} aria-hidden="true" focusable="false" /> : null;
}

/**
 * "Resultados em números" do case: título próprio (h2) e uma grade com cada número, o que ele
 * mede e o ícone, quando o conteúdo deu um. Sem números, não desenha nada.
 */
export function CaseMetrics({ metrics, title, className }: { metrics: CaseMetricItem[]; title: string; className?: string }) {
  if (metrics.length === 0) return null;
  return (
    <section className={`rb-case__metrics${className ? ` ${className}` : ""}`}>
      <h2 className="rb-case__metricsTitle">{title}</h2>
      <ul className="rb-case__metricList">
        {metrics.map((m, i) => (
          <li key={`${i}-${m.value}`} className="rb-case__metric">
            {m.icon && <LucideIcon name={m.icon} className="rb-case__metricIcon" />}
            <strong className="rb-case__metricValue">{m.value}</strong>
            <span className="rb-case__metricLabel">{m.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
