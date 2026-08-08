const SYNTAX_ITEMS = [
  { token: "**bold**", description: "negrito" },
  { token: "### Título", description: "título de cláusula" },
  { token: "- item", description: "lista com marcadores" },
  { token: "1. item", description: "lista numerada" },
  { token: "\\n\\n", description: "quebra de parágrafo" },
  { token: "{{variavel}}", description: "variável da proposta" },
];

export function TemplateSyntaxGuide() {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
      <p className="mb-1.5 font-medium text-gray-300">
        Sintaxe suportada{" "}
        <span className="font-normal text-gray-500">(não é Markdown padrão)</span>
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {SYNTAX_ITEMS.map(({ token, description }) => (
          <span key={token}>
            <code className="font-mono text-primary">{token}</code>
            {" "}— {description}
          </span>
        ))}
      </div>
    </div>
  );
}
