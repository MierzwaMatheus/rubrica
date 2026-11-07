import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * "Agora" estável entre o build e o navegador. Numa página pré-renderizada, é o horário do
 * build (vai junto com os dados da página), para o HTML e a hidratação calcularem igual —
 * "post recente", por exemplo, passa a ser relativo à última publicação. Fora disso, a hora
 * em que a página abriu.
 */
export function useRenderNow(): number {
  const [opened] = useState(() => Date.now());
  const { data } = useQuery({
    queryKey: ["renderNow"],
    queryFn: async () => Date.now(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  return data ?? opened;
}
