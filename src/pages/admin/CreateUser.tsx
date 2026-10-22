import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { AdminLayout } from "./Dashboard";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Loader2, UserPlus, Users, Trash2, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const ROLES = [
    { value: "admin", label: "Admin", desc: "Painel completo, exceto gerenciamento de usuários e logs" },
    { value: "content-editor", label: "Editor de Conteúdo", desc: "Projetos, Blog, Currículo, Sobre, Home e Depoimentos" },
    { value: "blog-editor", label: "Editor de Blog", desc: "Acesso apenas ao Blog" },
    { value: "proposal-editor", label: "Editor de Propostas", desc: "Acesso apenas às Propostas" },
] as const;

const formSchema = z.object({
    email: z.string().email("Email inválido"),
    name: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
    role: z.enum(["admin", "content-editor", "blog-editor", "proposal-editor"]),
});

export default function CreateUser() {
    const [isLoading, setIsLoading] = useState(false);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ userId: string; email: string } | null>(null);

    const usersData = useQuery(api.users.list, {});
    const users = usersData ?? [];
    const isLoadingUsers = usersData === undefined;

    const adminCreateUser = useAction(api.users.adminCreateUser);
    const removeRole = useMutation(api.users.removeRole);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            name: "",
            role: "content-editor",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            const result = await adminCreateUser(values);
            setTempPassword(result.tempPassword);
            form.reset();
            toast.success("Usuário criado com sucesso");
        } catch (error: any) {
            toast.error(error?.message ?? "Erro ao criar usuário");
        } finally {
            setIsLoading(false);
        }
    }

    const handleDelete = (userId: string, userEmail: string) => {
        setDeleteTarget({ userId, email: userEmail });
    };

    const handleCopy = async () => {
        if (!tempPassword) return;
        await navigator.clipboard.writeText(tempPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AdminLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <header>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-lg bg-neon-purple/10 text-neon-purple">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground-strong">Gerenciar Usuários</h1>
                    </div>
                    <p className="text-foreground/65">
                        Adicione novos usuários ou gerencie o acesso de usuários existentes.
                    </p>
                </header>

                <div className="grid gap-8 md:grid-cols-2">
                    <div className="bg-card border border-foreground/10 rounded-xl p-6 h-fit">
                        <h2 className="text-xl font-semibold text-foreground-strong mb-6 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-neon-purple" />
                            Novo Usuário
                        </h2>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-strong">Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome do usuário" {...field} className="bg-background/50 border-foreground/10 text-foreground-strong" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-strong">Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="email@exemplo.com" {...field} className="bg-background/50 border-foreground/10 text-foreground-strong" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-foreground-strong">Função</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/50 border-foreground/10 text-foreground-strong">
                                                        <SelectValue placeholder="Selecione uma função" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {ROLES.map((r) => (
                                                        <SelectItem key={r.value} value={r.value}>
                                                            <span className="font-medium">{r.label}</span>
                                                            <span className="text-xs text-muted-foreground ml-2">— {r.desc}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <p className="text-xs text-foreground/42">
                                    Uma senha temporária será gerada automaticamente. Repasse-a ao novo usuário.
                                </p>

                                <Button type="submit" className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        "Criar Usuário"
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </div>

                    <div className="bg-card border border-foreground/10 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-foreground-strong mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-neon-purple" />
                            Usuários Ativos
                        </h2>

                        {isLoadingUsers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
                            </div>
                        ) : (
                            <div className="rounded-md border border-foreground/10">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-foreground/10 hover:bg-foreground/5">
                                            <TableHead className="text-foreground/65">Nome</TableHead>
                                            <TableHead className="text-foreground/65">Função</TableHead>
                                            <TableHead className="text-foreground/65">Data</TableHead>
                                            <TableHead className="text-foreground/65 w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center text-foreground/65 py-8">
                                                    Nenhum usuário encontrado
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            users.map((user: any) => (
                                                <TableRow key={user._id} className="border-foreground/10 hover:bg-foreground/5">
                                                    <TableCell className="font-medium text-foreground-strong">
                                                        <div>{user.name ?? user.email}</div>
                                                        <div className="text-xs text-foreground/65">{user.email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neon-purple/10 text-neon-purple border border-neon-purple/20">
                                                            {user.role ?? '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-foreground/65 text-sm">
                                                        {user._creationTime ? format(new Date(user._creationTime), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                            onClick={() => handleDelete(user._id, user.email)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={!!tempPassword} onOpenChange={(open) => { if (!open) setTempPassword(null); }}>
                <DialogContent className="bg-card border border-foreground/10 text-foreground-strong">
                    <DialogHeader>
                        <DialogTitle className="text-foreground-strong">Usuário criado com sucesso</DialogTitle>
                        <DialogDescription className="text-foreground/65">
                            Repasse a senha temporária abaixo ao novo usuário. Ela não será exibida novamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <code className="flex-1 bg-background/60 border border-foreground/10 rounded-md px-4 py-3 font-mono text-lg tracking-widest text-neon-purple">
                                {tempPassword}
                            </code>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-foreground/10 text-foreground-strong hover:bg-foreground/10 shrink-0"
                                onClick={handleCopy}
                            >
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                        <Button
                            className="w-full bg-neon-purple hover:bg-neon-purple/90 text-white"
                            onClick={() => setTempPassword(null)}
                        >
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                itemName={deleteTarget?.email}
                onConfirm={async () => {
                    await removeRole({ userId: deleteTarget!.userId as Id<"users"> });
                    toast.success("Acesso do usuário removido com sucesso");
                }}
            />
        </AdminLayout>
    );
}
