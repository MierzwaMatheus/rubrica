type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

/** Evento customizado no Umami. Silencioso quando o script não carregou (dev, bloqueador). */
export function trackEvent(event: string, data?: EventData): void {
  try {
    window.umami?.track(event, data);
  } catch {
    // métrica nunca pode quebrar a página
  }
}
