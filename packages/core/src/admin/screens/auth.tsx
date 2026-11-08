/** Login, primeiro acesso, troca de senha e conta sem papel. */
import { useState, type FormEvent } from "react";
import { KeyRound, LogIn } from "lucide-react";
import { api } from "../data/api";
import { useAction, useAuth, useBackend } from "../data/backend";
import { errorMessage } from "../editor/model";
import { toast } from "../lib/toast";
import { Button } from "../ui/button";
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Spinner } from "../ui/form";

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center bg-background p-4">{children}</main>;
}

/** Mensagem do login: o Convex Auth não diz se foi e-mail, senha ou bloqueio. */
function loginError(e: unknown): string {
  const msg = errorMessage(e);
  if (/TooManyFailedAttempts|rate/i.test(msg)) return "Muitas tentativas erradas. Aguarde alguns minutos ou peça para trocar a senha (npx create-rubrica senha).";
  return "E-mail ou senha incorretos.";
}

export function LoginScreen() {
  const auth = useAuth();
  const { demoCredentials } = useBackend();
  const [email, setEmail] = useState(demoCredentials?.email ?? "");
  const [password, setPassword] = useState(demoCredentials?.password ?? "");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await auth.signIn(email, password);
    } catch (err) {
      setError(loginError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle as="h1" className="text-xl">Entrar no painel</CardTitle>
          <CardDescription>Use o e-mail e a senha que a agência ou o root criou para você.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            {demoCredentials && (
              <Alert variant="warning">
                Demonstração: os dados ficam só neste navegador e voltam ao exemplo ao recarregar. Acesso já preenchido.
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input id="login-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <Alert variant="destructive">{error}</Alert>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Spinner /> : <LogIn />} Entrar
            </Button>
            <p className="text-xs text-muted-foreground">Esqueceu a senha? Quem tem acesso ao projeto troca com <code>npx create-rubrica senha</code>.</p>
          </form>
        </CardContent>
      </Card>
    </Centered>
  );
}

/** Ainda não há root: o primeiro usuário sai do `setup` do CLI (a senha não passa pelo site). */
export function FirstAccessScreen() {
  return (
    <Centered>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h1" className="text-xl">Primeiro acesso</CardTitle>
          <CardDescription>Este site ainda não tem um usuário administrador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>O primeiro usuário (o root, da agência) é criado pelo terminal, por quem tem acesso ao projeto. Na pasta do projeto, rode:</p>
          <pre className="rounded-md bg-muted p-3 font-mono text-sm">npx create-rubrica setup</pre>
          <p className="text-muted-foreground">
            Por segurança o painel não cria o root: se criasse, quem abrisse o site primeiro viraria administrador. Depois do setup, recarregue esta página e entre.
          </p>
        </CardContent>
      </Card>
    </Centered>
  );
}

export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 12, label: "12 caracteres ou mais" },
  { test: (p: string) => /[A-Z]/.test(p), label: "uma letra maiúscula" },
  { test: (p: string) => /[a-z]/.test(p), label: "uma letra minúscula" },
  { test: (p: string) => /[0-9]/.test(p), label: "um número" },
];

export function ChangePasswordForm({ onDone }: { onDone?: () => void }) {
  const change = useAction(api.users.changePassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const ok = PASSWORD_RULES.every((r) => r.test(password)) && password === confirm;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setBusy(true);
    setError(undefined);
    try {
      await change({ newPassword: password });
      toast.success("Senha trocada.");
      setPassword("");
      setConfirm("");
      onDone?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-rules" />
        <ul id="password-rules" className="space-y-0.5 text-xs">
          {PASSWORD_RULES.map((r) => (
            <li key={r.label} className={r.test(password) ? "text-success" : "text-muted-foreground"}>
              {r.test(password) ? "✓" : "•"} {r.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Repita a senha</Label>
        <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={confirm !== "" && confirm !== password} />
        {confirm !== "" && confirm !== password && <p className="text-xs text-destructive">As senhas não são iguais.</p>}
      </div>
      {error && <Alert variant="destructive">{error}</Alert>}
      <Button type="submit" disabled={!ok || busy}>
        {busy ? <Spinner /> : <KeyRound />} Trocar senha
      </Button>
    </form>
  );
}

export function ChangePasswordScreen({ forced }: { forced?: boolean }) {
  const auth = useAuth();
  return (
    <Centered>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle as="h1" className="text-xl">Crie a sua senha</CardTitle>
          <CardDescription>{forced ? "Você entrou com uma senha temporária. Troque-a para continuar." : "Troque a sua senha."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ChangePasswordForm />
          <Button variant="ghost" size="sm" onClick={() => auth.signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </Centered>
  );
}

export function NoRoleScreen() {
  const auth = useAuth();
  return (
    <Centered>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle as="h1" className="text-xl">Sem acesso</CardTitle>
          <CardDescription>Sua conta existe, mas não tem papel no painel. Peça ao root do site para dar um papel a você.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => auth.signOut()}>
            Sair
          </Button>
        </CardContent>
      </Card>
    </Centered>
  );
}
