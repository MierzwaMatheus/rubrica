/** Backend real: o Convex do projeto, com login por senha do `@convex-dev/auth`. */
import { useMemo, type ReactNode } from "react";
import { ConvexReactClient, useAction, useConvex, useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexAuthProvider, useAuthActions } from "@convex-dev/auth/react";
import { BackendContext, type Backend } from "./backend";

const convexBackend: Backend = {
  mode: "convex",
  useQuery: (ref, args) => useQuery(ref, args as never),
  useMutation: (ref) => useMutation(ref) as never,
  useAction: (ref) => useAction(ref) as never,
  useQueryOnce() {
    const client = useConvex();
    return (ref, args) => client.query(ref, args as never);
  },
  useAuth() {
    const { isLoading, isAuthenticated } = useConvexAuth();
    const actions = useAuthActions();
    return {
      isLoading,
      isAuthenticated,
      async signIn(email, password) {
        await actions.signIn("password", { email, password, flow: "signIn" });
      },
      async signOut() {
        await actions.signOut();
      },
    };
  },
  async upload(uploadUrl, file) {
    const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
    if (!res.ok) throw new Error(`Falha no envio do arquivo (${res.status})`);
    const { storageId } = (await res.json()) as { storageId: string };
    return storageId;
  },
};

export function ConvexBackend({ url, children }: { url: string; children: ReactNode }) {
  const client = useMemo(() => new ConvexReactClient(url), [url]);
  return (
    <ConvexAuthProvider client={client}>
      <BackendContext.Provider value={convexBackend}>{children}</BackendContext.Provider>
    </ConvexAuthProvider>
  );
}
