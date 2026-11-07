import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode } from "react";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados "frescos"
        gcTime: 30 * 60 * 1000, // 30 minutos - tempo que dados ficam em cache após não serem usados
        refetchOnWindowFocus: false, // Não refaz requisição ao focar na janela
        retry: 1, // Tenta apenas 1 vez em caso de erro
      },
    },
  });
}

const defaultQueryClient = createQueryClient();

interface QueryProviderProps {
  children: ReactNode;
  /** Cliente próprio (pré-renderização e hidratação); sem ele, usa o padrão do app. */
  client?: QueryClient;
}

export function QueryProvider({ children, client }: QueryProviderProps) {
  return (
    <QueryClientProvider client={client ?? defaultQueryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

