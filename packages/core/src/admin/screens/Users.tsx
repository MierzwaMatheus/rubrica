/**
 * Usuários (só root): listar, criar com senha temporária, trocar papel, reiniciar a
 * senha (sem e-mail), suspender/reativar e excluir.
 */
import { useState, type FormEvent } from "react";
import { Copy, KeyRound, Trash2, UserCheck, UserPlus, UserX } from "lucide-react";
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
import { Alert, Badge, Input, Label, NativeSelect, Spinner } from "../ui/form";
import type { UserRow } from "../data/api";

const ROLE_HELP: Record<Role, string> = {
  root: "A agência: tudo, inclusive usuários, registros e configuração técnica.",
  admin: "Dono do site: todo o conteúdo e o comercial, sem gerenciar a agência.",
  "content-editor": "Páginas, coleções, textos e mídia.",
  "blog-editor": "Só o blog e a mídia.",
  "proposal-editor": "Só propostas.",
  comercial: "Propostas, contratos, pagamentos e contatos.",
};

/** Senha temporária, mostrada uma vez, com botão de copiar. */
function TempPassword({ email, password, onClose }: { email: string; password: string; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <p className="text-sm">{email}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm" data-testid="temp-password">
          {password}
        </code>
        <Button
          variant="outline"
          size="icon"
          aria-label="Copiar senha temporária"
          onClick={() => navigator.clipboard?.writeText(password).then(() => toast.success("Senha copiada."))}
        >
          <Copy />
        </Button>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Pronto</Button>
      </DialogFooter>
    </div>
  );
}

/** Reiniciar a senha de outra pessoa: confirma, gera a temporária e mostra uma vez. */
function ResetPasswordDialog({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const reset = useAction(api.users.resetPassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState<{ email: string; tempPassword: string }>();
  const label = user.email ?? user.name ?? "esta pessoa";

  async function confirm() {
    setBusy(true);
    setError(undefined);
    try {
      setDone(await reset({ userId: user.userId }));
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
          <DialogTitle>{done ? "Senha reiniciada" : "Reiniciar senha"}</DialogTitle>
          <DialogDescription>
            {done
              ? "Passe a senha temporária por um canal seguro. Ela aparece só agora; no próximo acesso a pessoa cria a própria."
              : `${label} recebe uma senha temporária, sai de todas as sessões abertas e cria uma senha nova no próximo acesso. Nenhum e-mail é enviado: você mesmo passa a senha.`}
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <TempPassword email={done.email} password={done.tempPassword} onClose={onClose} />
        ) : (
          <>
            {error && <Alert variant="destructive">{error}</Alert>}
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={confirm} disabled={busy}>
                {busy ? <Spinner /> : <KeyRound />} Reiniciar senha
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
          <TempPassword email={created.email} password={created.tempPassword} onClose={onClose} />
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
  const suspend = useMutation(api.users.suspend);
  const reactivate = useMutation(api.users.reactivate);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<UserRow>();

  async function run(task: () => Promise<unknown>, done: string) {
    try {
      await task();
      toast.success(done);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

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
            const who = u.email ?? u.name ?? "esta pessoa";
            return (
              <li key={u.userId} className={`flex flex-wrap items-center gap-3 px-4 py-3${u.suspended ? " opacity-70" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {u.name || u.email} {self && <span className="text-xs text-muted-foreground">(você)</span>}
                    {u.suspended && <Badge variant="destructive">suspenso</Badge>}
                    {!u.suspended && u.mustChangePassword && <Badge variant="secondary">senha temporária</Badge>}
                  </p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                </div>
                <NativeSelect
                  aria-label={`Papel de ${u.email}`}
                  className="w-auto"
                  value={u.role ?? ""}
                  disabled={self}
                  title={self ? "Ninguém muda o próprio papel" : ROLE_HELP[u.role ?? "content-editor"]}
                  onChange={(e) => run(() => setRole({ userId: u.userId, role: e.target.value as Role }), "Papel trocado.")}
                >
                  {!u.role && <option value="">sem papel</option>}
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </NativeSelect>
                <Button variant="ghost" size="icon-sm" aria-label={`Reiniciar a senha de ${who}`} title="Reiniciar senha" disabled={self} onClick={() => setResetting(u)}>
                  <KeyRound />
                </Button>
                {u.suspended ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Reativar ${who}`}
                    title="Reativar"
                    onClick={() => run(() => reactivate({ userId: u.userId }), "Acesso reativado.")}
                  >
                    <UserCheck />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Suspender ${who}`}
                    title="Suspender"
                    disabled={self || !u.role}
                    onClick={() => {
                      if (!window.confirm(`Suspender ${who}? A pessoa sai do painel na hora. O papel e o histórico ficam guardados e você pode reativar depois.`)) return;
                      void run(() => suspend({ userId: u.userId }), "Acesso suspenso.");
                    }}
                  >
                    <UserX />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir ${who}`}
                  title="Excluir"
                  disabled={self}
                  onClick={() => {
                    if (!window.confirm(`Excluir ${who} de vez? O login e o papel são apagados e as sessões caem na hora. Para só tirar o acesso, prefira suspender.`)) return;
                    void run(() => remove({ userId: u.userId }), "Usuário excluído.");
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
      {resetting && <ResetPasswordDialog user={resetting} onClose={() => setResetting(undefined)} />}
    </>
  );
}
