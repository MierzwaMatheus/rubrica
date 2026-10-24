/** Capa padrão para posts sem imagem: gradiente nas cores do tema, a palavra-chave grande e a primeira tag. */
export function BlogCoverFallback({ tag, className = "" }: { tag?: string; className?: string }) {
  const word = (tag ?? "").trim();
  return (
    <div
      aria-hidden="true"
      className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-neon-purple/25 via-background to-background ${className}`}
    >
      <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(45deg,currentColor_0_1px,transparent_1px_14px)] text-foreground-strong" />
      {word && (
        <span className="absolute -right-2 -bottom-4 font-bold text-[5rem] leading-none text-neon-purple/15 whitespace-nowrap transition-transform duration-700 group-hover:scale-105">
          {word}
        </span>
      )}
      {word && (
        <span className="absolute left-6 top-6 font-mono text-xs text-neon-lime/80">
          <span className="text-foreground-strong/40">#</span> {word}
        </span>
      )}
    </div>
  );
}
