import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "@/contexts/AuthContext";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordModal() {
    const { mustChangePassword } = useAuth();
    const changePassword = useAction(api.users.changePassword);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    if (!mustChangePassword) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("A senha deve ter no mínimo 8 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }

        setIsLoading(true);
        try {
            await changePassword({ newPassword });
            toast.success("Senha alterada com sucesso!");
        } catch (err: any) {
            setError(err?.message ?? "Erro ao alterar senha. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent
                className="bg-card border border-foreground/10 text-foreground-strong [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 rounded-full bg-neon-purple/10 flex items-center justify-center">
                            <KeyRound className="h-6 w-6 text-neon-purple" />
                        </div>
                    </div>
                    <DialogTitle className="text-foreground-strong text-center">Redefina sua senha</DialogTitle>
                    <DialogDescription className="text-foreground/65 text-center">
                        Por segurança, você precisa criar uma nova senha antes de continuar.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-foreground-strong">Nova senha</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="bg-background/50 border-foreground/10 text-foreground-strong pr-10"
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/65 hover:text-foreground-strong"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-foreground-strong">Confirmar nova senha</Label>
                        <Input
                            id="confirm-password"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="bg-background/50 border-foreground/10 text-foreground-strong"
                            disabled={isLoading}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            "Salvar nova senha"
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
