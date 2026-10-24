import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeApplier } from "./components/ThemeApplier";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { I18nProvider } from "./i18n/context/I18nContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { PublicRoute } from "./components/PublicRoute";
import { QueryProvider } from "./providers/QueryProvider";
import { ConvexClientProvider, convex } from "./providers/ConvexClientProvider";
import { ConvexTranslationService } from "./i18n/implementations/ConvexTranslationService";
import { Terminal } from "./components/Terminal";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { sidebarRepository } from "@/repositories/instances";
import { PageSkeleton } from "./components/PageSkeleton";
import { ContactWizardProvider } from "./contexts/ContactWizardContext";
import { ContactWizardModal } from "./components/ContactWizardModal";
import { PluginsProvider } from "./contexts/PluginsContext";
import { PluginRoute } from "./components/PluginRoute";
import { ChangePasswordModal } from "./components/ChangePasswordModal";

// Páginas carregadas sob demanda: o visitante baixa só a página que abriu.
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProjects = lazy(() => import("./pages/admin/Projects"));
const AdminBlog = lazy(() => import("./pages/admin/Blog"));
const AdminResume = lazy(() => import("./pages/admin/Resume"));
const AdminHome = lazy(() => import("./pages/admin/Home"));
const AdminContact = lazy(() => import("./pages/admin/Contact"));
const AdminProposals = lazy(() => import("./pages/admin/Proposals"));
const AdminCreateUser = lazy(() => import("./pages/admin/CreateUser"));
const AdminPaymentLinks = lazy(() => import("./pages/admin/PaymentLinks"));
const AdminAbout = lazy(() => import("./pages/admin/About"));
const AdminAiResumes = lazy(() => import("./pages/admin/AiResumes"));
const AdminLogs = lazy(() => import("./pages/admin/Logs"));
const Resume = lazy(() => import("./pages/Resume"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ProjectCaseStudy = lazy(() => import("./pages/ProjectCaseStudy"));
const Proposal = lazy(() => import("./pages/Proposal"));
const ProposalAccept = lazy(() => import("./pages/ProposalAccept"));
const About = lazy(() => import("./pages/About"));
const Checkout = lazy(() => import("./pages/Checkout"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AdminContactRequests = lazy(() => import("./pages/admin/ContactRequests"));
const AdminPlugins = lazy(() => import("./pages/admin/Plugins"));
const AdminTestimonials = lazy(() => import("./pages/admin/Testimonials"));
const AdminLgpdErasure = lazy(() => import("./pages/admin/LgpdErasure"));
const TestimonialsPage = lazy(() => import("./pages/Testimonials"));
const AdminSiteConfig = lazy(() => import("./pages/admin/SiteConfig"));
const AdminContractTemplates = lazy(() => import("./pages/admin/ContractTemplates"));
const AdminTextos = lazy(() => import("./pages/admin/Textos"));
const Playground = lazy(() => import("./pages/Playground"));
const ContactWizardDemo = lazy(() => import("./pages/playground/ContactWizardDemo"));
const ProposalDemo = lazy(() => import("./pages/playground/ProposalDemo"));
const PlaygroundProposalView = lazy(() => import("./pages/playground/ProposalView"));
const PlaygroundProposalAcceptView = lazy(() => import("./pages/playground/ProposalAcceptView"));
const BlogPostDemo = lazy(() => import("./pages/playground/BlogPostDemo"));
const BlogPreview = lazy(() => import("./pages/playground/BlogPreview"));
const BlogPostPreview = lazy(() => import("./pages/playground/BlogPostPreview"));
const PaymentLinkDemo = lazy(() => import("./pages/playground/PaymentLinkDemo"));
const AiCvDemo = lazy(() => import("./pages/playground/AiCvDemo"));

const translationService = new ConvexTranslationService(convex);

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isPlaygroundRoute = location.startsWith("/playground");

  if (isPlaygroundRoute) {
    return (
      <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/playground">
          <PluginRoute pluginId="playground"><Playground /></PluginRoute>
        </Route>
        <Route path="/playground/contact">
          <PluginRoute pluginId="playground"><ContactWizardDemo /></PluginRoute>
        </Route>
        <Route path="/playground/proposal/:slug/aceitar">
          <PluginRoute pluginId="playground"><PlaygroundProposalAcceptView /></PluginRoute>
        </Route>
        <Route path="/playground/proposal/:slug">
          <PluginRoute pluginId="playground"><PlaygroundProposalView /></PluginRoute>
        </Route>
        <Route path="/playground/proposal">
          <PluginRoute pluginId="playground"><ProposalDemo /></PluginRoute>
        </Route>
        <Route path="/playground/blog/preview/:slug">
          <PluginRoute pluginId="playground"><BlogPostPreview /></PluginRoute>
        </Route>
        <Route path="/playground/blog/preview">
          <PluginRoute pluginId="playground"><BlogPreview /></PluginRoute>
        </Route>
        <Route path="/playground/blog">
          <PluginRoute pluginId="playground"><BlogPostDemo /></PluginRoute>
        </Route>
        <Route path="/playground/payment">
          <PluginRoute pluginId="playground"><PaymentLinkDemo /></PluginRoute>
        </Route>
        <Route path="/playground/ai-cv">
          <PluginRoute pluginId="playground"><AiCvDemo /></PluginRoute>
        </Route>
      </Switch>
      </Suspense>
    );
  }

  if (isAdminRoute) {
    return (
      <>
      <ChangePasswordModal />
      <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path="/admin/dashboard">
          <ProtectedRoute
            component={Dashboard}
            allowedRoles={["root", "admin", "content-editor", "blog-editor"]}
          />
        </Route>
        <Route path="/admin">
          <ProtectedRoute
            component={Dashboard}
            allowedRoles={["root", "admin", "content-editor", "blog-editor"]}
          />
        </Route>
        <Route path="/admin/projects">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="portfolio"><AdminProjects /></PluginRoute>}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/blog">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="blog"><AdminBlog /></PluginRoute>}
            allowedRoles={["root", "admin", "content-editor", "blog-editor"]}
          />
        </Route>
        <Route path="/admin/resume">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="resume"><AdminResume /></PluginRoute>}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/home">
          <ProtectedRoute
            component={AdminHome}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/about">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="about"><AdminAbout /></PluginRoute>}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/contact">
          <ProtectedRoute
            component={AdminContact}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/proposals">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="proposals"><AdminProposals /></PluginRoute>}
            allowedRoles={["root", "admin", "proposal-editor"]}
          />
        </Route>
        <Route path="/admin/payment-links">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="payments"><AdminPaymentLinks /></PluginRoute>}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/ai-resumes">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="ai-resumes"><AdminAiResumes /></PluginRoute>}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/users/new">
          <ProtectedRoute component={AdminCreateUser} allowedRoles={["root"]} />
        </Route>
        <Route path="/admin/logs">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="audit-log"><AdminLogs /></PluginRoute>}
            allowedRoles={["root"]}
          />
        </Route>
        <Route path="/admin/contatos">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="contact-wizard"><AdminContactRequests /></PluginRoute>}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/plugins">
          <ProtectedRoute
            component={AdminPlugins}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/textos">
          <ProtectedRoute
            component={AdminTextos}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/site-config">
          <ProtectedRoute
            component={AdminSiteConfig}
            allowedRoles={["root", "admin"]}
          />
        </Route>
        <Route path="/admin/depoimentos">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="testimonials"><AdminTestimonials /></PluginRoute>}
            allowedRoles={["root", "admin", "content-editor"]}
          />
        </Route>
        <Route path="/admin/lgpd">
          <ProtectedRoute component={AdminLgpdErasure} allowedRoles={["root"]} />
        </Route>
        <Route path="/admin/contracts">
          <ProtectedRoute
            component={() => <PluginRoute pluginId="contract-templates"><AdminContractTemplates /></PluginRoute>}
            allowedRoles={["root", "admin"]}
          />
        </Route>
      </Switch>
      </Suspense>
      </>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
      <Switch>
        <Route path={"/"}>
          <PublicRoute>
            <Home />
          </PublicRoute>
        </Route>
        <Route path={"/login"} component={Login} />
        <Route path="/sobre">
          <PublicRoute>
            <PluginRoute pluginId="about">
              <About />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/curriculo">
          <PublicRoute>
            <PluginRoute pluginId="resume">
              <Resume />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/portfolio">
          <PublicRoute>
            <PluginRoute pluginId="portfolio">
              <Portfolio />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/portfolio/:slug">
          <PublicRoute>
            <PluginRoute pluginId="portfolio">
              <ProjectCaseStudy />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/blog">
          <PublicRoute>
            <PluginRoute pluginId="blog">
              <Blog />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/blog/:slug">
          <PublicRoute>
            <PluginRoute pluginId="blog">
              <BlogPost />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/proposta/:id">
          <PublicRoute>
            <PluginRoute pluginId="proposals">
              <Proposal />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/proposta/:slug/aceitar">
          <PublicRoute>
            <PluginRoute pluginId="proposals">
              <ProposalAccept />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/checkout/:uniqueLink">
          <PublicRoute>
            <PluginRoute pluginId="payments">
              <Checkout />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/payment-success/:uniqueLink">
          <PublicRoute>
            <PluginRoute pluginId="payments">
              <PaymentSuccess />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/depoimentos">
          <PublicRoute>
            <PluginRoute pluginId="testimonials">
              <TestimonialsPage />
            </PluginRoute>
          </PublicRoute>
        </Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
      </Suspense>
    </Layout>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const [terminalOpen, setTerminalOpen] = useState(false);

  const { data: sidebarContact } = useQuery({
    queryKey: ["sidebar", "contact"],
    queryFn: () => sidebarRepository.getContactInfo(),
    staleTime: Infinity,
  });

  const ownerInfo = useMemo(() => {
    if (!sidebarContact) return undefined;
    const slug = (sidebarContact.name ?? "portfolio")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    return {
      name: sidebarContact.name ?? "",
      slug: slug || "portfolio",
      role: sidebarContact.role ?? "professional",
      email: sidebarContact.email,
      githubUrl: sidebarContact.github_url,
      linkedinUrl: sidebarContact.linkedin_url,
    };
  }, [sidebarContact]);

  // Troca de página sempre começa do topo (ex.: "próximo case").
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isAdminRoute) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "`" || e.key === "~" || e.code === "Backquote") {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isAdminRoute]);

  return (
    <>
      <Router />
      <AnimatePresence>
        {terminalOpen && !isAdminRoute && (
          <Terminal onClose={() => setTerminalOpen(false)} ownerInfo={ownerInfo} />
        )}
      </AnimatePresence>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ConvexClientProvider>
          <QueryProvider>
            <ThemeApplier />
            <AuthProvider>
              <I18nProvider translationService={translationService}>
                <ThemeProvider>
                  <TooltipProvider>
                    <Toaster />
                    <PluginsProvider>
                      <ContactWizardProvider>
                        <AppContent />
                        <ContactWizardModal />
                      </ContactWizardProvider>
                    </PluginsProvider>
                  </TooltipProvider>
                </ThemeProvider>
              </I18nProvider>
            </AuthProvider>
          </QueryProvider>
        </ConvexClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
