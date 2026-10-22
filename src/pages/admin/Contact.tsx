import { useState, useEffect } from "react";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Image as ImageIcon } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function AdminContact() {
  const data = useQuery(api.contactInfo.get, {});
  const updateContactInfo = useMutation(api.contactInfo.update);
  const loading = data === undefined;

  const [pickedAvatarId, setPickedAvatarId] = useState<string>("");
  const pickedAvatarQuery = useQuery(
    api.images.getById,
    pickedAvatarId ? { id: pickedAvatarId as Id<"imageMetadata"> } : "skip"
  );

  const [personalData, setPersonalData] = useState({
    name: "",
    role: "",
    email: "",
    showEmail: true,
    phone: "",
    showPhone: true,
    birthDate: "",
    showBirthDate: false,
    location: "",
    showLocation: false,
    avatarUrl: ""
  });

  const [socialMedia, setSocialMedia] = useState({
    linkedin: "",
    github: "",
    behance: ""
  });

  const [proposalData, setProposalData] = useState({
    proposalIntro: "",
    proposalAiContext: "",
  });

  useEffect(() => {
    if (data) {
      const rolePT = data.roleTranslations?.ptBR || data.role || "";
      setPersonalData({
        name: data.name || "",
        role: rolePT,
        email: data.email || "",
        showEmail: data.showEmail ?? true,
        phone: data.phone || "",
        showPhone: data.showPhone ?? true,
        birthDate: data.birthDate || "",
        showBirthDate: data.showBirthDate ?? false,
        location: data.location || "",
        showLocation: data.showLocation ?? false,
        avatarUrl: data.avatarUrl || ""
      });
      setSocialMedia({
        linkedin: data.linkedinUrl || "",
        github: data.githubUrl || "",
        behance: data.behanceUrl || ""
      });
      setProposalData({
        proposalIntro: (data as any).proposalIntro || "",
        proposalAiContext: (data as any).proposalAiContext || "",
      });
    }
  }, [data]);

  const handlePersonalChange = (field: string, value: any) => {
    setPersonalData(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialChange = (field: string, value: string) => {
    setSocialMedia(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      const rolePT = personalData.role || '';
      await updateContactInfo({
        name: personalData.name,
        role: rolePT,
        ...(rolePT
          ? { roleTranslations: { ptBR: rolePT, enUS: rolePT } }
          : {}),
        email: personalData.email,
        showEmail: personalData.showEmail,
        phone: personalData.phone,
        showPhone: personalData.showPhone,
        birthDate: personalData.birthDate || undefined,
        showBirthDate: personalData.showBirthDate,
        location: personalData.location,
        showLocation: personalData.showLocation,
        avatarUrl: pickedAvatarQuery?.url || personalData.avatarUrl,
        linkedinUrl: socialMedia.linkedin,
        githubUrl: socialMedia.github,
        behanceUrl: socialMedia.behance,
        proposalIntro: proposalData.proposalIntro || undefined,
        proposalAiContext: proposalData.proposalAiContext || undefined,
      });
      toast.success("Alterações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving contact info:", error);
      toast.error("Erro ao salvar alterações.");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-foreground-strong">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground-strong">Informações de Contato</h1>
        </div>

        <Card className="bg-card border-foreground/10">
          <CardHeader>
            <CardTitle className="text-foreground-strong">Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground-strong">Nome Completo*</Label>
                <Input
                  value={personalData.name}
                  onChange={(e) => handlePersonalChange("name", e.target.value)}
                  className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground-strong">Imagem de Perfil</Label>
                <div className="flex items-center gap-4">
                  {(pickedAvatarQuery?.url || personalData.avatarUrl) && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-foreground/10">
                      <img src={pickedAvatarQuery?.url || personalData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <ImagePicker
                      onSelect={(id) => setPickedAvatarId(Array.isArray(id) ? id[0] : id)}
                      trigger={
                        <Button type="button" variant="outline" className="border-foreground/10 hover:bg-foreground/5 text-foreground-strong">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {pickedAvatarQuery?.url || personalData.avatarUrl ? "Alterar Imagem" : "Selecionar Imagem"}
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground-strong">Título Profissional</Label>
              <Input
                value={personalData.role}
                onChange={(e) => handlePersonalChange("role", e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground-strong">Email</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.email}
                    onChange={(e) => handlePersonalChange("email", e.target.value)}
                    className="bg-foreground/5 border-foreground/10 text-foreground-strong flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showEmail}
                      onCheckedChange={(checked) => handlePersonalChange("showEmail", checked)}
                    />
                    <span className="text-sm text-foreground/65">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground-strong">WhatsApp</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.phone}
                    onChange={(e) => handlePersonalChange("phone", e.target.value)}
                    className="bg-foreground/5 border-foreground/10 text-foreground-strong flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showPhone}
                      onCheckedChange={(checked) => handlePersonalChange("showPhone", checked)}
                    />
                    <span className="text-sm text-foreground/65">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground-strong">Data de Nascimento</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="date"
                    value={personalData.birthDate}
                    onChange={(e) => handlePersonalChange("birthDate", e.target.value)}
                    className="bg-foreground/5 border-foreground/10 text-foreground-strong flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showBirthDate}
                      onCheckedChange={(checked) => handlePersonalChange("showBirthDate", checked)}
                    />
                    <span className="text-sm text-foreground/65">Mostrar</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground-strong">Localização</Label>
                <div className="flex items-center gap-4">
                  <Input
                    value={personalData.location}
                    onChange={(e) => handlePersonalChange("location", e.target.value)}
                    className="bg-foreground/5 border-foreground/10 text-foreground-strong flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={personalData.showLocation}
                      onCheckedChange={(checked) => handlePersonalChange("showLocation", checked)}
                    />
                    <span className="text-sm text-foreground/65">Mostrar</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-foreground/10">
          <CardHeader>
            <CardTitle className="text-foreground-strong">Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground-strong">LinkedIn</Label>
              <Input
                value={socialMedia.linkedin}
                onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground-strong">GitHub</Label>
              <Input
                value={socialMedia.github}
                onChange={(e) => handleSocialChange("github", e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground-strong">Behance</Label>
              <Input
                value={socialMedia.behance}
                onChange={(e) => handleSocialChange("behance", e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-foreground/10">
          <CardHeader>
            <CardTitle className="text-foreground-strong">Propostas Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground-strong">Texto de apresentação nas propostas</Label>
              <Textarea
                value={proposalData.proposalIntro}
                onChange={(e) => setProposalData(prev => ({ ...prev, proposalIntro: e.target.value }))}
                placeholder="Olá, tudo bem? Antes de tudo, agradeço o interesse! Sou [seu nome], [sua profissão]..."
                className="bg-foreground/5 border-foreground/10 text-foreground-strong min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground-strong">Perfil para geração de propostas por IA</Label>
              <p className="text-xs text-foreground/42">Descreva sua experiência, área de atuação e diferenciais. A IA usará este contexto para gerar propostas personalizadas.</p>
              <Textarea
                value={proposalData.proposalAiContext}
                onChange={(e) => setProposalData(prev => ({ ...prev, proposalAiContext: e.target.value }))}
                placeholder="Ex: Designer com 5 anos de experiência em branding e identidade visual para pequenas e médias empresas. Especialidade em logotipos, guias de marca e materiais impressos..."
                className="bg-foreground/5 border-foreground/10 text-foreground-strong min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-neon-purple hover:bg-neon-purple/90 text-white px-8">
            Salvar Alterações
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
