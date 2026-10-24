import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/i18n/hooks/useTranslation";

export default function Login() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading: isAuthLoading, roles } = useAuth();
  const { signIn } = useAuthActions();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect after login resolves authenticated state with role
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && roles.length > 0) {
      if (roles.includes("root") || roles.includes("admin") || roles.includes("content-editor")) {
        setLocation("/admin/dashboard");
      } else if (roles.includes("blog-editor")) {
        setLocation("/admin/blog");
      } else if (roles.includes("proposal-editor")) {
        setLocation("/admin/proposals");
      } else {
        setLocation("/admin/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, roles, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      // AuthContext + the useEffect above will handle redirect once role resolves
    } catch (err) {
      setError(t("auth.invalidCredentials"));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon-purple/20 via-black to-black z-0"></div>

      <Card className="w-full max-w-md z-10 border-foreground/10 bg-background/50 backdrop-blur-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-neon-purple/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-neon-purple" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-foreground-strong">{t("auth.adminArea")}</CardTitle>
          <CardDescription className="text-center text-foreground/65">
            {t("auth.enterCredentials")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong focus:border-neon-purple/50"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-foreground/5 border-foreground/10 text-foreground-strong focus:border-neon-purple/50"
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("auth.signingIn")}
                </>
              ) : (
                t("auth.signIn")
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
