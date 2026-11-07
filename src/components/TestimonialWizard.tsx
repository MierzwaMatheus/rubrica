import { lazy, Suspense, useState } from "react";

/**
 * O assistente de depoimento (upload de vídeo, recorte de foto) é pesado e só abre num clique:
 * carrega na primeira abertura, em vez de ir no JavaScript de todas as páginas. Depois de
 * carregado, fica montado para a animação de fechar funcionar.
 */
const TestimonialWizardDialog = lazy(() =>
  import("./TestimonialWizardDialog").then((m) => ({ default: m.TestimonialWizardDialog })),
);

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TestimonialWizard({ open, onClose }: Props) {
  const [loaded, setLoaded] = useState(open);
  if (open && !loaded) setLoaded(true);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <TestimonialWizardDialog open={open} onClose={onClose} />
    </Suspense>
  );
}
