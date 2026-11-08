/**
 * Acesso ao backend pelo painel. As telas só usam os ganchos daqui (`useQuery`,
 * `useMutation`…), e quem os implementa é o provedor montado na raiz:
 * - `convex.tsx`: o Convex do projeto, com login pelo `@convex-dev/auth`;
 * - `demo.ts`: um backend em memória com os dados de exemplo (demo sem Convex,
 *   testes de ponta a ponta), carregado só quando o site usa fixtures.
 */
import { createContext, useContext } from "react";
import type { FunctionReference } from "convex/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Args = Record<string, any>;
export type QueryRef<A extends Args, R> = FunctionReference<"query", "public", A, R>;
export type MutationRef<A extends Args, R> = FunctionReference<"mutation", "public", A, R>;
export type ActionRef<A extends Args, R> = FunctionReference<"action", "public", A, R>;

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
}

export interface Backend {
  mode: "convex" | "demo";
  useQuery<A extends Args, R>(ref: QueryRef<A, R>, args: A | "skip"): R | undefined;
  useMutation<A extends Args, R>(ref: MutationRef<A, R>): (args: A) => Promise<R>;
  useAction<A extends Args, R>(ref: ActionRef<A, R>): (args: A) => Promise<R>;
  /** Função para ler uma query uma vez (validação antes de salvar). */
  useQueryOnce(): <A extends Args, R>(ref: QueryRef<A, R>, args: A) => Promise<R>;
  useAuth(): AuthState;
  /** Envia o arquivo para a URL de `media.generateUploadUrl` e devolve o `storageId`. */
  upload(uploadUrl: string, file: File): Promise<string>;
  /** Credenciais da demonstração (só no modo demo). */
  demoCredentials?: { email: string; password: string };
}

export const BackendContext = createContext<Backend | null>(null);

export function useBackend(): Backend {
  const backend = useContext(BackendContext);
  if (!backend) throw new Error("[rubrica] painel sem backend (BackendContext)");
  return backend;
}

export function useQuery<A extends Args, R>(ref: QueryRef<A, R>, args: A | "skip"): R | undefined {
  return useBackend().useQuery(ref, args);
}
export function useMutation<A extends Args, R>(ref: MutationRef<A, R>): (args: A) => Promise<R> {
  return useBackend().useMutation(ref);
}
export function useAction<A extends Args, R>(ref: ActionRef<A, R>): (args: A) => Promise<R> {
  return useBackend().useAction(ref);
}
export function useQueryOnce() {
  return useBackend().useQueryOnce();
}
export function useAuth(): AuthState {
  return useBackend().useAuth();
}
