/** Início: atalhos e o estado das páginas. */
import { FilePen, Files, Palette } from "lucide-react";
import { can } from "../../convex/lib/roles";
import { pick } from "../../i18n";
import { api } from "../data/api";
import { useQuery } from "../data/backend";
import { PageHeader } from "../Layout";
import { Link } from "../lib/router";
import { localeName, usePanel } from "../panel";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/form";
import { Button } from "../ui/button";

function PagesSummary() {
  const panel = usePanel();
  const pages = useQuery(api.pages.list, {});
  if (!pages) return null;
  const drafts = pages.filter((p) => !p.published);
  const untranslated = panel.locales.locales.filter((l) => pages.some((p) => p.published && !pick(p.title, l)));
  const home = pages.find((p) => p.path === "/");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Páginas</CardTitle>
        <CardDescription>
          {pages.length} páginas, {drafts.length} em rascunho.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {untranslated.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Há páginas sem título em: {untranslated.map(localeName).join(", ")}. Elas não existem nesses idiomas até ganharem título.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {home && (
            <Button asChild size="sm">
              <Link to={`/admin/paginas/editar?id=${home._id}`}>
                <FilePen /> Editar a página inicial
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/paginas">
              <Files /> Todas as páginas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const panel = usePanel();
  const first = (panel.me.name || panel.me.email || "").split(/[\s@]/)[0];
  return (
    <>
      <PageHeader title={`Olá${first ? `, ${first}` : ""}`} description="O que você quer fazer no site hoje?" />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        {!panel.settings && (
          <Alert variant="warning" className="md:col-span-2">
            O site ainda não foi configurado. Quem tem acesso ao projeto roda <code>npx create-rubrica setup</code>.
          </Alert>
        )}
        {can(panel.me.role, "pages") && <PagesSummary />}
        {can(panel.me.role, "settings") && (
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Tema <Badge variant="secondary">{panel.theme.label}</Badge> · idiomas: {panel.locales.locales.map(localeName).join(", ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="outline">
                <Link to="/admin/aparencia">
                  <Palette /> Cores e modo de cor
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Publicação</CardTitle>
            <CardDescription>
              O que você salva aqui fica no banco na hora. O site no ar é gerado de novo a cada publicação (rebuild): use o botão “Publicar site” no topo do painel, que mostra quando há mudanças pendentes.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}
