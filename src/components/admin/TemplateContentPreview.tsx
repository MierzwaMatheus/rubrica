import { formatClauseContent, parseTemplateContent } from "@/utils/contractPDF";

interface Props {
  content: string;
}

export function TemplateContentPreview({ content }: Props) {
  if (!content.trim()) return null;

  const { header, clauses } = parseTemplateContent(content);

  return (
    <div className="text-sm text-gray-200 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_strong]:text-white">
      {header.trim() && (
        <div
          dangerouslySetInnerHTML={{ __html: formatClauseContent(header) }}
        />
      )}
      {clauses.map((clause, i) => (
        <div
          key={i}
          dangerouslySetInnerHTML={{ __html: formatClauseContent(clause) }}
        />
      ))}
    </div>
  );
}
