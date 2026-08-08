import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  User,
  Home,
  Mail,
  LogOut,
  Menu,
  X,
  FileSignature,
  UserPlus,
  Image as ImageIcon,
  Briefcase,
  Plus,
  CreditCard,
  Sparkles,
  ScrollText,
  MessageSquare,
  Puzzle,
  Star,
  ShieldAlert,
  Settings2,
  ClipboardList,
  Type,
  ChevronDown,
} from "lucide-react";
import { usePlugins } from "@/contexts/PluginsContext";
import type { PluginId } from "../../../convex/pluginRegistry";
import { useState, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ProjectDialog } from "@/components/admin/ProjectDialog";
import { ProposalDialog } from "@/components/admin/ProposalDialog";
import { ResumeExperienceDialog } from "@/components/admin/ResumeExperienceDialog";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { PublishStatus } from "@/components/admin/PublishStatus";
import { CommandPalette } from "@/components/admin/CommandPalette";
import keyManifest from "@/i18n/key-manifest.json";

type NavItem = {
  icon: React.ElementType;
  label: string;
  description: string;
  path: string;
  roles: string[];
  pluginId?: PluginId;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Visão Geral",
    items: [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        description: "Métricas e atividade recente",
        path: "/admin/dashboard",
        roles: ["root", "admin"],
      },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      {
        icon: Home,
        label: "Home",
        description: "Hero, sobre, tags, disponibilidade e serviços",
        path: "/admin/home",
        roles: ["root", "admin"],
      },
      {
        icon: FolderKanban,
        label: "Projetos",
        description: "Portfólio — adicione, edite e ordene projetos",
        path: "/admin/projects",
        roles: ["root", "admin"],
        pluginId: "portfolio",
      },
      {
        icon: FileText,
        label: "Blog",
        description: "Posts, tags e busca",
        path: "/admin/blog",
        roles: ["root", "admin"],
        pluginId: "blog",
      },
      {
        icon: User,
        label: "Currículo",
        description: "Experiências, formação, skills e certificações",
        path: "/admin/resume",
        roles: ["root", "admin"],
        pluginId: "resume",
      },
      {
        icon: User,
        label: "Sobre Mim",
        description: "Rotina diária e FAQ",
        path: "/admin/about",
        roles: ["root", "admin"],
        pluginId: "about",
      },
      {
        icon: Type,
        label: "Textos",
        description: "Strings de interface em pt-BR e en-US",
        path: "/admin/textos",
        roles: ["root", "admin", "content-editor"],
      },
    ],
  },
  {
    label: "Perfil",
    items: [
      {
        icon: Mail,
        label: "Identidade",
        description: "Nome, avatar, email, telefone e redes sociais",
        path: "/admin/contact",
        roles: ["root", "admin"],
        pluginId: "contact-wizard",
      },
    ],
  },
  {
    label: "Interações",
    items: [
      {
        icon: MessageSquare,
        label: "Mensagens",
        description: "Contatos recebidos via wizard público",
        path: "/admin/contatos",
        roles: ["root", "admin"],
        pluginId: "contact-wizard",
      },
      {
        icon: Star,
        label: "Depoimentos",
        description: "Depoimentos curados ou recebidos do público",
        path: "/admin/depoimentos",
        roles: ["root", "admin"],
        pluginId: "testimonials",
      },
    ],
  },
  {
    label: "Comercial",
    items: [
      {
        icon: FileSignature,
        label: "Propostas",
        description: "Propostas com aceite eletrônico e assinatura",
        path: "/admin/proposals",
        roles: ["root", "admin", "proposal-editor"],
        pluginId: "proposals",
      },
      {
        icon: ClipboardList,
        label: "Contratos",
        description: "Templates de contrato reutilizáveis",
        path: "/admin/contracts",
        roles: ["root", "admin"],
        pluginId: "contract-templates" as PluginId,
      },
      {
        icon: CreditCard,
        label: "Pagamentos",
        description: "Cobranças via Stripe ou Asaas (PIX/boleto)",
        path: "/admin/payment-links",
        roles: ["root", "admin"],
        pluginId: "payments",
      },
    ],
  },
  {
    label: "Inteligência Artificial",
    items: [
      {
        icon: Sparkles,
        label: "CV com IA",
        description: "Gere versões do CV otimizadas para vagas",
        path: "/admin/ai-resumes",
        roles: ["root", "admin"],
        pluginId: "ai-resumes",
      },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        icon: Settings2,
        label: "Site & Aparência",
        description: "Tema, cores, fontes e configurações visuais",
        path: "/admin/site-config",
        roles: ["root", "admin"],
      },
      {
        icon: Puzzle,
        label: "Plugins",
        description: "Ative ou desative features do portfólio",
        path: "/admin/plugins",
        roles: ["root", "admin"],
      },
    ],
  },
  {
    label: "Administração",
    items: [
      {
        icon: UserPlus,
        label: "Criar Usuário",
        description: "Adicione colaboradores com papéis específicos",
        path: "/admin/users/new",
        roles: ["root"],
      },
      {
        icon: ScrollText,
        label: "Logs",
        description: "Histórico de ações no sistema",
        path: "/admin/logs",
        roles: ["root"],
        pluginId: "audit-log",
      },
      {
        icon: ShieldAlert,
        label: "LGPD",
        description: "Gerencie requisições de exclusão de dados",
        path: "/admin/lgpd",
        roles: ["root"],
      },
    ],
  },
];

// Admin Sidebar Component
function AdminSidebar() {
  const [location] = useLocation();
  const { logout, checkRole } = useAuth();
  const { isEnabled } = usePlugins();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const visibleGroups = navGroups
    .map(group => ({
      ...group,
      items: group.items.filter(
        item => checkRole(item.roles) && (!item.pluginId || isEnabled(item.pluginId))
      ),
    }))
    .filter(group => group.items.length > 0);

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !(prev[label] ?? true) }));
  };

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-white/10 transform transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto p-6">
          <div className="mb-8 flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-neon-purple flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <span className="text-xl font-bold text-white">Admin Panel</span>
          </div>

          <nav className="flex-1">
            {visibleGroups.map(group => {
              const isCollapsed = collapsedGroups[group.label] ?? true;
              return (
                <div key={group.label} className="mb-2">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 group-hover:text-gray-400 transition-colors">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-all duration-200",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-0.5">
                      {group.items.map(item => {
                        const isActive = location === item.path;
                        return (
                          <Tooltip key={item.path}>
                            <TooltipTrigger asChild>
                              <Link href={item.path}>
                                <a
                                  className={cn(
                                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                      ? "bg-neon-purple/10 text-neon-purple border border-neon-purple/20"
                                      : "text-gray-400 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  <item.icon className="w-4 h-4 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium leading-none">{item.label}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                                  </div>
                                </a>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-48 bg-zinc-900 border border-white/10 text-white">
                              <p className="font-medium text-white">{item.label}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              onClick={logout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}

// Admin Layout Wrapper
export function AdminLayout({ children, title = "Admin" }: { children: React.ReactNode; title?: string }) {
  const { checkRole } = useAuth();
  const { isEnabled } = usePlugins();
  const [, navigate] = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const paletteItems = navGroups
    .flatMap((g) => g.items)
    .filter((item) => checkRole(item.roles) && (!item.pluginId || isEnabled(item.pluginId)))
    .map(({ label, description, path }) => ({ label, description, path }));

  const siteTextsData = useQuery(api.siteTexts.getAll) as { key: string; ptBR: string; enUS?: string }[] | undefined;
  const contactInfoData = useQuery(api.contactInfo.get) as { proposalIntro?: string; proposalAiContext?: string } | undefined | null;
  const posts = useQuery(api.posts.listAdmin) as { _id: string; title: string }[] | undefined;
  const projects = useQuery(api.projects.list) as { _id: string; title: string }[] | undefined;
  const proposals = useQuery(api.proposals.listAdmin, { filter: "all" }) as { _id: string; title: string }[] | undefined;
  const services = useQuery(api.services.list) as { _id: string; title: string }[] | undefined;

  const createActions = [
    { label: "Nova Proposta", description: "Criar nova proposta comercial", path: "/admin/proposals?create=true" },
    { label: "Novo Projeto", description: "Adicionar projeto ao portfólio", path: "/admin/projects?create=true" },
    { label: "Novo Post", description: "Publicar post no blog", path: "/admin/blog?create=true" },
    { label: "Nova Experiência", description: "Adicionar experiência ao currículo", path: "/admin/resume?create=true&type=experience" },
    { label: "Nova Formação", description: "Adicionar formação ao currículo", path: "/admin/resume?create=true&type=education" },
    { label: "Nova Habilidade", description: "Adicionar habilidade ao currículo", path: "/admin/resume?create=true&type=skill" },
    { label: "Novo Idioma", description: "Adicionar idioma ao currículo", path: "/admin/resume?create=true&type=language" },
    { label: "Novo Depoimento", description: "Adicionar depoimento de cliente", path: "/admin/depoimentos?create=true" },
    { label: "Novo Contrato", description: "Criar modelo de contrato", path: "/admin/contracts?create=true" },
    { label: "Novo Link de Pagamento", description: "Criar link de checkout", path: "/admin/payment-links?create=true" },
    { label: "Novo Currículo com IA", description: "Gerar currículo personalizado", path: "/admin/ai-resumes?create=true" },
  ];

  const contentGroups = [
    ...(posts && posts.length > 0
      ? [{ heading: "Posts", items: posts.map((p) => ({ label: p.title, path: "/admin/blog" })) }]
      : []),
    ...(projects && projects.length > 0
      ? [{ heading: "Projetos", items: projects.map((p) => ({ label: p.title, path: "/admin/projects" })) }]
      : []),
    ...(proposals && proposals.length > 0
      ? [{ heading: "Propostas", items: proposals.map((p) => ({ label: p.title, path: "/admin/proposals" })) }]
      : []),
    ...(services && services.length > 0
      ? [{ heading: "Serviços", items: services.map((s) => ({ label: s.title, path: "/admin/home" })) }]
      : []),
    ...(contactInfoData && (contactInfoData.proposalIntro || contactInfoData.proposalAiContext)
      ? [{
          heading: "Textos de Proposta",
          items: [
            contactInfoData.proposalIntro
              ? { label: "Intro da Proposta", description: contactInfoData.proposalIntro.slice(0, 80), path: "/admin/contact" }
              : null,
            contactInfoData.proposalAiContext
              ? { label: "Contexto IA para Propostas", description: contactInfoData.proposalAiContext.slice(0, 80), path: "/admin/contact" }
              : null,
          ].filter((item): item is { label: string; description: string; path: string } => item !== null),
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      <Helmet><title>{title} — Admin</title></Helmet>
      <AdminSidebar />
      <main className="md:ml-64 p-8 pt-20 md:pt-8">{children}</main>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        items={paletteItems}
        createActions={createActions}
        contentGroups={contentGroups}
        siteTexts={siteTextsData}
        manifest={keyManifest as Record<string, { file: string; line: number }[]>}
        onNavigate={navigate}
      />
    </div>
  );
}

// Dashboard Page
export default function Dashboard() {
  const stats = useQuery(api.stats.getDashboard);
  const isLoading = stats === undefined;
  const projectsCount = stats?.projects.total ?? 0;
  const articlesCount =
    (stats?.posts.published ?? 0) + (stats?.posts.draft ?? 0);
  const proposalsCount = stats?.proposals.total ?? 0;

  const [isProjectOpen, setIsProjectOpen] = useState(false);
  const [isProposalOpen, setIsProposalOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Bem-vindo ao painel administrativo do seu portfólio.
            </p>
          </div>
          <PublishStatus />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Projetos",
              count: projectsCount,
              icon: FolderKanban,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
            },
            {
              title: "Artigos",
              count: articlesCount,
              icon: FileText,
              color: "text-green-400",
              bg: "bg-green-400/10",
            },
            {
              title: "Propostas",
              count: proposalsCount,
              icon: FileSignature,
              color: "text-purple-400",
              bg: "bg-purple-400/10",
            },
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-card border border-white/10 rounded-xl p-6 flex items-center space-x-4"
            >
              <div className={cn("p-4 rounded-lg", stat.bg)}>
                <stat.icon className={cn("w-8 h-8", stat.color)} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-white">
                  {isLoading ? "..." : stat.count}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Atalhos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsProjectOpen(true)}
            >
              <FolderKanban className="w-6 h-6 text-neon-purple" />
              Novo Projeto
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsProposalOpen(true)}
            >
              <FileSignature className="w-6 h-6 text-neon-purple" />
              Nova Proposta
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
              onClick={() => setIsExperienceOpen(true)}
            >
              <Briefcase className="w-6 h-6 text-neon-purple" />
              Nova Experiência
            </Button>

            <ImagePicker
              onSelect={() => {}}
              trigger={
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:border-neon-purple/50"
                >
                  <ImageIcon className="w-6 h-6 text-neon-purple" />
                  Galeria de Imagens
                </Button>
              }
            />
          </div>
        </div>

        <ProjectDialog
          open={isProjectOpen}
          onOpenChange={setIsProjectOpen}
          onSave={() => {}}
        />

        <ProposalDialog
          open={isProposalOpen}
          onOpenChange={setIsProposalOpen}
          onSave={() => {}}
        />

        <ResumeExperienceDialog
          open={isExperienceOpen}
          onOpenChange={setIsExperienceOpen}
          onSave={() => {}}
        />
      </div>
    </AdminLayout>
  );
}
