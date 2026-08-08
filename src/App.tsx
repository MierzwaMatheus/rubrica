import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HelmetProvider } from "react-helmet-async";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import AdminProjects from "./pages/admin/Projects";
import AdminBlog from "./pages/admin/Blog";
import AdminResume from "./pages/admin/Resume";
import AdminHome from "./pages/admin/Home";
import AdminContact from "./pages/admin/Contact";
import AdminProposals from "./pages/admin/Proposals";
import AdminCreateUser from "./pages/admin/CreateUser";
import AdminPaymentLinks from "./pages/admin/PaymentLinks";
import AdminAbout from "./pages/admin/About";
import AdminAiResumes from "./pages/admin/AiResumes";
import AdminLogs from "./pages/admin/Logs";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeApplier } from "./components/ThemeApplier";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { I18nProvider } from "./i18n/context/I18nContext";
import Resume from "./pages/Resume";
import Portfolio from "./pages/Portfolio";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import ProjectCaseStudy from "./pages/ProjectCaseStudy";
import Proposal from "./pages/Proposal";
import ProposalAccept from "./pages/ProposalAccept";
import About from "./pages/About";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Layout } from "./components/Layout";
import { PublicRoute } from "./components/PublicRoute";
import { QueryProvider } from "./providers/QueryProvider";
import { ConvexClientProvider, convex } from "./providers/ConvexClientProvider";
import { ConvexTranslationService } from "./i18n/implementations/ConvexTranslationService";
import { Terminal } from "./components/Terminal";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { sidebarRepository } from "@/repositories/instances";
import { ContactWizardProvider } from "./contexts/ContactWizardContext";
import { ContactWizardModal } from "./components/ContactWizardModal";
import AdminContactRequests from "./pages/admin/ContactRequests";
import AdminPlugins from "./pages/admin/Plugins";
import AdminSiteConfig from "./pages/admin/SiteConfig";
import AdminTestimonials from "./pages/admin/Testimonials";
import AdminLgpdErasure from "./pages/admin/LgpdErasure";
import AdminContractTemplates from "./pages/admin/ContractTemplates";
import AdminTextos from "./pages/admin/Textos";
import TestimonialsPage from "./pages/Testimonials";
import { PluginsProvider } from "./contexts/PluginsContext";
import { PluginRoute } from "./components/PluginRoute";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import Playground from "./pages/Playground";
import ContactWizardDemo from "./pages/playground/ContactWizardDemo";
import ProposalDemo from "./pages/playground/ProposalDemo";
import PlaygroundProposalView from "./pages/playground/ProposalView";
import PlaygroundProposalAcceptView from "./pages/playground/ProposalAcceptView";
import BlogPostDemo from "./pages/playground/BlogPostDemo";
import BlogPreview from "./pages/playground/BlogPreview";
import BlogPostPreview from "./pages/playground/BlogPostPreview";
import PaymentLinkDemo from "./pages/playground/PaymentLinkDemo";
import AiCvDemo from "./pages/playground/AiCvDemo";

const translationService = new ConvexTranslationService(convex);

function Router() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/admin");
  const isPlaygroundRoute = location.startsWith("/playground");

  if (isPlaygroundRoute) {
    return (
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
    );
  }

  if (isAdminRoute) {
    return (
      <>
      <ChangePasswordModal />
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
      </>
    );
  }

  return (
    <Layout>
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
                <ThemeProvider defaultTheme="dark">
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
