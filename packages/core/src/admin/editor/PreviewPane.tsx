/**
 * Prévia ao vivo no painel (decisão 17): iframe com `/admin/preview` (tema e CSS do
 * tema isolados), que recebe o rascunho por postMessage a cada mudança. Larguras de
 * celular, tablet e desktop (o desktop é reduzido para caber, sem rolar de lado).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import type { PageRecord, SiteSettings } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import type { Locale } from "../../i18n";
import { cn } from "../lib/utils";
import { localeName } from "../panel";
import { isPreviewMessage, PREVIEW_PATH, type FromPreview, type ToPreview } from "../preview/protocol";
import { Button } from "../ui/button";
import { NativeSelect, Spinner } from "../ui/form";

const DEVICES = [
  { id: "mobile", label: "Celular", width: 390, Icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 820, Icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, Icon: Monitor },
] as const;
type Device = (typeof DEVICES)[number]["id"];

export interface PreviewPaneProps {
  snapshot: SiteSnapshot | undefined;
  page: PageRecord;
  locale: Locale;
  locales: Locale[];
  onLocale(locale: Locale): void;
  selected?: string;
  onSelect?(blockId: string): void;
  settings?: SiteSettings;
  className?: string;
}

export function PreviewPane({ snapshot, page, locale, locales, onLocale, selected, onSelect, settings, className }: PreviewPaneProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<Device>(() => {
    try {
      return (localStorage.getItem("rubrica:preview-device") as Device) || "desktop";
    } catch {
      return "desktop";
    }
  });
  const [boxWidth, setBoxWidth] = useState(0);
  const [nonce, setNonce] = useState(0);
  const lastSelected = useRef<string | undefined>(undefined);

  const send = useCallback((message: ToPreview) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (!isPreviewMessage<FromPreview>(event.data, ["rubrica:preview:ready", "rubrica:preview:select"])) return;
      if (event.data.type === "rubrica:preview:ready") setReady(true);
      else onSelect?.(event.data.blockId);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelect]);

  // Base publicada: quando o iframe fica pronto e quando o backend muda.
  useEffect(() => {
    if (ready && snapshot) send({ type: "rubrica:preview:base", snapshot });
  }, [ready, snapshot, send]);

  // Rascunho: a cada mudança, no máximo um envio por quadro.
  useEffect(() => {
    if (!ready || !snapshot) return;
    const scrollToSelected = selected !== lastSelected.current;
    lastSelected.current = selected;
    const raf = requestAnimationFrame(() => send({ type: "rubrica:preview:draft", page, locale, settings, selected, scrollToSelected }));
    return () => cancelAnimationFrame(raf);
  }, [ready, snapshot, page, locale, settings, selected, send]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setBoxWidth(entry!.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = DEVICES.find((d) => d.id === device)!.width;
  const scale = boxWidth && width > boxWidth ? boxWidth / width : 1;

  return (
    <section aria-label="Prévia" className={cn("flex min-h-0 flex-col bg-muted/60", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b bg-card px-3 py-2">
        <div role="group" aria-label="Largura da prévia" className="flex rounded-md border p-0.5">
          {DEVICES.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              title={label}
              aria-pressed={device === id}
              className={cn(device === id && "bg-accent text-primary")}
              onClick={() => {
                setDevice(id);
                try {
                  localStorage.setItem("rubrica:preview-device", id);
                } catch {
                  /* sem armazenamento */
                }
              }}
            >
              <Icon />
            </Button>
          ))}
        </div>
        {locales.length > 1 && (
          <NativeSelect aria-label="Idioma da prévia" className="h-8 w-auto" value={locale} onChange={(e) => onLocale(e.target.value)}>
            {locales.map((l) => (
              <option key={l} value={l}>
                {localeName(l)}
              </option>
            ))}
          </NativeSelect>
        )}
        <span className="text-xs text-muted-foreground">
          {width}px{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          className="ml-auto"
          aria-label="Recarregar a prévia"
          onClick={() => {
            setReady(false);
            setNonce((n) => n + 1);
          }}
        >
          <RefreshCw />
        </Button>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden p-3">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            <Spinner />
          </div>
        )}
        <div
          className="mx-auto h-full origin-top-left overflow-hidden rounded-md border bg-white shadow-sm"
          style={{ width, height: scale < 1 ? `${100 / scale}%` : "100%", transform: scale < 1 ? `scale(${scale})` : undefined, marginLeft: scale < 1 ? 0 : undefined }}
        >
          <iframe key={nonce} ref={frame} src={PREVIEW_PATH} title="Prévia da página" className="block size-full border-0" onLoad={() => undefined} />
        </div>
      </div>
    </section>
  );
}
