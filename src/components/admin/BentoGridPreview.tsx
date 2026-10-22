import { cn } from "@/lib/utils";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";

interface DailyRoutineItem {
  id: string;
  span_size: '1x1' | '1x2' | '2x1' | '2x2';
  display_order: number;
}

interface BentoGridPreviewProps {
  items: DailyRoutineItem[];
}

function SortablePreviewCard({ item, index }: { item: DailyRoutineItem; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getSpanClasses = (spanSize: string) => {
    switch (spanSize) {
      case '1x2':
        return 'row-span-2';
      case '2x1':
        return 'col-span-2';
      case '2x2':
        return 'col-span-2 row-span-2';
      default:
        return '';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative rounded-xl border-2 border-dashed border-neon-purple/50",
        "bg-gradient-to-br from-neon-purple/10 to-neon-lime/10",
        "flex items-center justify-center group",
        "text-neon-purple font-bold text-2xl",
        "transition-all duration-200 hover:border-neon-purple hover:bg-neon-purple/20",
        "cursor-grab active:cursor-grabbing",
        isDragging && "z-50 shadow-lg",
        getSpanClasses(item.span_size || '1x1')
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-neon-purple" />
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold mb-1">{index + 1}</div>
        <div className="text-xs font-normal text-foreground/65">
          {item.span_size || '1x1'}
        </div>
      </div>
    </div>
  );
}

export function BentoGridPreview({ items }: BentoGridPreviewProps) {
  // Ordenar itens por display_order
  const sortedItems = [...items].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4">
      <div className="text-sm text-foreground/65 mb-2">
        Preview do Layout do Bento Grid (arraste para reordenar)
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px] p-4 bg-foreground/5 border border-foreground/10 rounded-xl">
        {sortedItems.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-32 text-foreground/42 text-sm">
            Nenhum item adicionado ainda
          </div>
        ) : (
          sortedItems.map((item, index) => (
            <SortablePreviewCard key={item.id} item={item} index={index} />
          ))
        )}
      </div>
      <div className="text-xs text-foreground/42 space-y-1">
        <p>• Os números indicam a ordem de exibição</p>
        <p>• Os tamanhos (1x1, 1x2, 2x1, 2x2) mostram quantas células cada card ocupa</p>
        <p>• O grid tem 2 colunas no mobile e 3 colunas no desktop</p>
        <p>• Arraste os cards para reordená-los</p>
      </div>
    </div>
  );
}

