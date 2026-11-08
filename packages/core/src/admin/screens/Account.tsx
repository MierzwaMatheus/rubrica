/** Minha conta: dados de quem está logado e troca de senha. */
import { ROLE_LABELS } from "../../convex/lib/roles";
import { PageHeader } from "../Layout";
import { usePanel } from "../panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/form";
import { ChangePasswordForm } from "./auth";

export default function Account() {
  const { me } = usePanel();
  return (
    <>
      <PageHeader title="Minha conta" description={`${me.email ?? ""} · ${ROLE_LABELS[me.role]}`} />
      <div className="max-w-xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Trocar senha</CardTitle>
            <CardDescription>A senha nova vale no próximo login. As sessões abertas continuam.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
