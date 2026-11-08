/** Usuários (só root): listar, criar com senha temporária, trocar papel, remover. */
import { useState, type FormEvent } from "react";
import { Copy, Trash2, UserPlus } from "lucide-react";
import { ROLE_LABELS, ROLES, type Role } from "../../convex/lib/roles";
import { api } from "../data/api";
import { useAction, useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Input, Label, NativeSelect, Spinner } from "../ui/form";

const ROLE_HELP: Record<Role, string> = {
  root: "A agência: tudo, inclusive usuários, registros e configuração técnica.",
  admin: "Dono do site: todo o conteúdo e o comercial, sem gerenciar a agência.",
  "content-editor": "Páginas, coleções, textos e mídia.",
  "blog-editor": "Só o blog e a mídia.",
  "proposal-editor": "Só propostas.",
  comercial: "Propostas, contratos, pagamentos e contatos.",
};

function CreateUserDialog({ onClose }: { onClose: () => void }) {
  const create = useAction(api.users.create);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "root">>("content-editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<{ email: string; tempPassword: string }>();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const result = await create({ name, email, role });
      setCreated({ email, tempPassword: result.tempPassword });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{created ? "Usuário criado" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {created ? "Passe a senha temporária por um canal seguro. Ela aparece só agora; no primeiro acesso a pessoa cria a própria." : "A pessoa entra com uma senha temporária e troca no primeiro acesso."}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <div className="space-y-3">
            <p className="text-sm">{created.email}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm" data-testid="temp-password">
                {created.tempPassword}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copiar senha temporária"
                onClick={() => navigator.clipboard?.writeText(created.tempPassword).then(() => toast.success("Senha copiada."))}
              >
                <Copy />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={onClose}>Pronto</Button>
            </DialogFooter>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Nome</Label>
              <Input id="user-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">E-mail</Label>
              <Input id="user-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-role">Papel</Label>
              <NativeSelect id="user-role" value={role} onChange={(e) => setRole(e.target.value as Exclude<Role, "root">)}>
                {ROLES.filter((r) => r !== "root").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">{ROLE_HELP[role]} Root só sai do setup do CLI.</p>
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner /> : <UserPlus />} Criar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Users() {
  const panel = usePanel();
  const users = useQuery(api.users.list, {});
  const setRole = useMutation(api.users.setRole);
  const remove = useMutation(api.users.remove);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Quem entra no painel e o que cada um pode fazer."
        actions={
          <Button onClick={() => setCreating(true)}>
            <UserPlus /> Novo usuário
          </Button>
        }
      />
      {!users ? (
        <Loading />
      ) : (
        <ul className="m-6 max-w-4xl divide-y rounded-lg border bg-card">
          {users.map((u) => {
            const self = u.userId === panel.me.userId;
            return (
              <li key={u.userId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {u.name || u.email} {self && <span className="text-xs text-muted-foreground">(você)</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <NativeSelect
                  aria-label={`Papel de ${u.email}`}
                  className="w-auto"
                  value={u.role ?? ""}
                  disabled={self}
                  title={self ? "Ninguém muda o próprio papel" : ROLE_HELP[u.role ?? "content-editor"]}
                  onChange={async (e) => {
                    try {
                      await setRole({ userId: u.userId, role: e.target.value as Role });
                      toast.success("Papel trocado.");
                    } catch (err) {
                      toast.error(errorMessage(err));
                    }
                  }}
                >
                  {!u.role && <option value="">sem papel</option>}
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </NativeSelect>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover ${u.email}`}
                  disabled={self}
                  onClick={async () => {
                    if (!window.confirm(`Tirar o acesso de ${u.email}? As sessões abertas caem na hora.`)) return;
                    try {
                      await remove({ userId: u.userId });
                      toast.success("Acesso removido.");
                    } catch (err) {
                      toast.error(errorMessage(err));
                    }
                  }}
                >
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} />}
    </>
  );
}
