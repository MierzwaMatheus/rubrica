import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Github,
  Linkedin,
  Mail,
  FileText,
  Home,
  Briefcase,
  FolderOpen,
  PenTool,
  Menu,
  User,
} from "lucide-react";
import { SiBehance } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugins } from "@/contexts/PluginsContext";
import { useHome } from "@/hooks/useHome";
import { MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSidebar } from "@/hooks/useSidebar";
import { useResume } from "@/hooks/useResume";
import { usePortfolio } from "@/hooks/usePortfolio";
import { sidebarRepository, resumeRepository, portfolioRepository, homeRepository } from "@/repositories/instances";
import type { SidebarContactInfo } from "@/repositories/interfaces/SidebarRepository";
import { generateCV } from "@/utils/cvPDF";

import type { PluginId } from "../../convex/pluginRegistry";

const NAV_ITEMS_KEYS: Array<{ key: string; href: string; icon: React.ElementType; pluginId?: PluginId }> = [
  { key: "home", href: "/", icon: Home },
  { key: "resume", href: "/curriculo", icon: Briefcase, pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", icon: FolderOpen, pluginId: "portfolio" },
  { key: "about", href: "/sobre", icon: User, pluginId: "about" },
  { key: "blog", href: "/blog", icon: PenTool, pluginId: "blog" },
];

const SOCIAL_CONFIG = [
  {
    key: "github",
    label: "GitHub",
    icon: Github,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    key: "behance",
    label: "Behance",
    icon: SiBehance,
  },
];

export function Sidebar() {
  const { t } = useTranslation();
  const { locale, setLocale } = useI18n();
  const { openWizard } = useContactWizard();
  const { isEnabled } = usePlugins();
  const wizardEnabled = isEnabled('contact-wizard');
  const [location] = useLocation();
  const { contactInfo, isLoading } = useSidebar(sidebarRepository);
  const { items: resumeItems } = useResume(resumeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { data: aboutData } = useQuery({
    queryKey: ["home", "about"],
    queryFn: () => homeRepository.getAboutData(),
    staleTime: Infinity,
  });

const NAV_ITEMS = NAV_ITEMS_KEYS
    .filter(item => !item.pluginId || isEnabled(item.pluginId))
    .map(item => ({
      ...item,
      label: t(`navigation.${item.key}`)
    }));

  const handleLanguageChange = (checked: boolean) => {
    setLocale(checked ? 'en-US' : 'pt-BR');
  };

  const handleDownloadCV = () => {
    if (!contactInfo) return;
    const cvLocale = locale === "en-US" ? "en-US" : "pt-BR";
    const summary = aboutData?.value?.[cvLocale] ?? aboutData?.value?.["pt-BR"] ?? "";
    generateCV(contactInfo, resumeItems, projects, cvLocale, summary);
  };

  const SidebarContent = () => {
    return (
      <div className="flex flex-col h-full bg-[var(--bg)] border-r border-[var(--text)]/10 w-full overflow-y-auto">
        {/* Profile Section */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          {isLoading ? (
            <Skeleton className="h-28 w-28 rounded-full mb-4" />
          ) : (
            <div className="relative h-28 w-28 rounded-full mb-4 overflow-hidden border-2 border-[var(--primary)] group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
              {contactInfo?.avatar_url ? (
                <img
                  src={contactInfo.avatar_url}
                  alt={contactInfo.name || ""}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-[var(--primary)]/20 text-[var(--text)] text-3xl font-bold select-none">
                  {contactInfo?.name?.[0]?.toUpperCase() || <User className="h-10 w-10 opacity-50" />}
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-6 w-40 mb-3" />
          ) : (
            <h1 className="font-bold text-xl text-[var(--text)] mb-3 text-center">
              {contactInfo?.name || ""}
            </h1>
          )}

          <div className="w-full rounded-lg bg-[var(--text)]/5 border border-[var(--text)]/5 flex items-center justify-center px-4 py-3 backdrop-blur-sm">
            <div className="text-xs text-center text-[var(--text)]/40 w-full">
              <div className="font-[family-name:var(--font-mono)] text-[var(--accent)]/70 mb-1">
                &lt;code&gt;
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center gap-1 my-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2 w-20" />
                </div>
              ) : (
                <>
                  <div className="text-[var(--text)]/90 font-medium">
                    {contactInfo?.role || ""}
                  </div>
                </>
              )}
              <div className="font-[family-name:var(--font-mono)] text-[var(--accent)]/70 mt-1">
                &lt;/code&gt;
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 py-2">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--text)]/10 to-transparent"></div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 flex-1">
          <ul className="space-y-1">
            {NAV_ITEMS.map(item => {
              const isActive = location === item.href;
              return (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                        isActive
                          ? "text-[var(--text)] bg-[var(--text)]/5 border border-[var(--text)]/5"
                          : "text-[var(--text)]/40 hover:text-[var(--text)] hover:bg-[var(--text)]/5"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_50%,transparent)]"></div>
                      )}
                      <item.icon
                        className={cn(
                          "mr-3 h-4 w-4 transition-colors",
                          isActive
                            ? "text-[var(--primary)]"
                            : "text-[var(--text)]/50 group-hover:text-[var(--primary)]"
                        )}
                      />
                      {item.label}
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Info */}
        <div className="mt-auto px-6 py-6 border-t border-[var(--text)]/10 bg-[var(--bg)]/50">
          <div className="mb-6 space-y-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text)]/60 font-bold mb-2">
              {t("sidebar.contact")}
            </p>

            {isLoading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </>
            ) : (
              <>
                {contactInfo?.show_email && (
                  <a
                    href={`mailto:${contactInfo.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-[var(--text)]/40 hover:text-[var(--accent)] transition-colors group"
                  >
                    <Mail className="mr-2 h-3 w-3 text-[var(--text)]/60 group-hover:text-[var(--accent)] transition-colors" />
                    <span className="truncate">{contactInfo.email}</span>
                  </a>
                )}

                {contactInfo?.show_phone && (
                  <a
                    href={`https://wa.me/${contactInfo.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-[var(--text)]/40 hover:text-[var(--accent)] transition-colors group"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mr-2 h-3 w-3 text-[var(--text)]/60 group-hover:text-[var(--accent)] transition-colors"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>{contactInfo.phone}</span>
                  </a>
                )}
              </>
            )}
          </div>

          <div className="flex justify-center space-x-3 mb-6">
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </>
            ) : (
              SOCIAL_CONFIG.map(social => {
                const url = contactInfo?.[
                  `${social.key}_url` as keyof SidebarContactInfo
                ] as string;
                if (!url) return null;

                return (
                  <a
                    key={social.key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-[var(--text)]/5 hover:bg-[var(--primary)]/20 hover:text-[var(--primary)] text-[var(--text)]/40 transition-all duration-300 border border-[var(--text)]/5 hover:border-[var(--primary)]/30"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                );
              })
            )}
          </div>

          {/* Language Selector */}
          <div className="mb-4">
            <div className="flex items-center justify-between px-1">
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  locale === "pt-BR" ? "text-[var(--accent)]" : "text-[var(--text)]/40"
                )}
              >
                PT
              </span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={locale === "en-US"}
                  onCheckedChange={handleLanguageChange}
                  className="data-[state=checked]:bg-[var(--primary)]"
                />
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  locale === "en-US" ? "text-[var(--accent)]" : "text-[var(--text)]/40"
                )}
              >
                EN
              </span>
            </div>
          </div>

          {wizardEnabled && (
            <Button
              onClick={() => openWizard({ sourceContext: "sidebar" })}
              className="w-full bg-[var(--primary)]/20 hover:bg-[var(--primary)]/30 border border-[var(--primary)]/50 text-[var(--primary)] h-9 text-xs font-[family-name:var(--font-mono)] uppercase tracking-wider mb-2"
            >
              <MessageSquare className="mr-2 h-3 w-3" />
              {t("contactWizard.trigger")}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleDownloadCV}
            disabled={!contactInfo}
            className="w-full border-[var(--accent)]/50 text-[var(--accent)] hover:bg-[var(--accent)]/10 hover:text-[var(--accent)] h-9 text-xs uppercase tracking-wider"
          >
            <FileText className="mr-2 h-3 w-3" />
            {t("sidebar.downloadCV")}
          </Button>

          <p className="text-center text-[10px] text-[var(--text)]/20 font-[family-name:var(--font-mono)] mt-1">
            Press <kbd className="px-1 py-0.5 rounded bg-[var(--text)]/10 text-[var(--text)]/40">~</kbd> for terminal
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--text)]/10 z-50 flex items-center justify-between px-4 lg:hidden">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full overflow-hidden border border-[var(--primary)] mr-3">
            {contactInfo?.avatar_url ? (
              <img
                src={contactInfo.avatar_url}
                alt={contactInfo.name || ""}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-[var(--primary)]/20 text-[var(--text)] text-sm font-bold select-none">
                {contactInfo?.name?.[0]?.toUpperCase() || <User className="h-4 w-4 opacity-50" />}
              </div>
            )}
          </div>
          <span className="font-bold text-[var(--text)] text-sm">
            {contactInfo?.name || ""}
          </span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-[var(--text)] hover:bg-[var(--text)]/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-72 border-r border-[var(--text)]/10 bg-[var(--bg)]"
          >
            <VisuallyHidden>
              <SheetTitle>{t("sidebar.menu")}</SheetTitle>
            </VisuallyHidden>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 hidden lg:block z-50 bg-[var(--bg)] border-r border-[var(--text)]/10">
        <SidebarContent />
      </aside>
    </>
  );
}
