import { ROLE_LABELS } from "@rubrica/core/convex/roles";
import { prop } from "./shared";
import type { ToolDef } from "./types";

const TERMINAL_LOGIN = (name: string) =>
  `Peça à pessoa para rodar, no terminal dela (no Claude Code ela pode digitar "! " antes do comando), na pasta do projeto:\n  npx rubrica mcp login\nA senha é digitada lá e nunca passa pela conversa. Depois chame whoami.`;

export const authTools: ToolDef[] = [
  {
    name: "whoami",
    title: "Quem sou eu / estado do login",
    description:
      "Mostra o projeto, qual Convex (dev ou produção), a conta logada, o papel, o site (tipo, idiomas, tema), os plugins ligados e as ferramentas disponíveis. Chame no começo: diga à pessoa em qual ambiente vai gravar.",
    access: { login: false },
    input: () => ({ type: "object", properties: {}, additionalProperties: false }),
    async handler(_args, ctx) {
      const { project, options } = ctx.runtime;
      const s = ctx.state;
      const notes: string[] = [];
      if (project.environment === "producao") notes.push("Este é o Convex de PRODUÇÃO: o que for gravado vale na hora para o conteúdo; o site estático só muda no próximo rebuild.");
      else if (project.environment === "desenvolvimento" || project.environment === "local") notes.push("Convex de desenvolvimento/local: o site no ar não muda.");
      if (!ctx.runtime.hasSession()) notes.push(`Sem login. ${TERMINAL_LOGIN(project.name)}`);
      if (s.problem) notes.push(s.problem);
      if (s.me?.mustChangePassword) notes.push("Esta conta precisa trocar a senha no painel antes de continuar.");
      if (options.defaultDryRun) notes.push("Gravações começam em prévia (dryRun: true); mande dryRun: false para gravar.");
      return {
        loggedIn: !!s.me,
        ...(s.me ? { user: { email: s.me.email, name: s.me.name, role: s.me.role, roleLabel: s.me.role ? ROLE_LABELS[s.me.role] : null } } : {}),
        project: { name: project.name, root: project.root },
        convex: { host: new URL(project.convexUrl).hostname, environment: project.environment, source: project.source },
        ...(s.settings
          ? {
              site: {
                kind: s.settings.kind,
                name: s.settings.name,
                url: s.settings.url,
                locales: s.settings.locales.locales,
                defaultLocale: s.settings.locales.default,
                theme: s.settings.theme,
              },
              enabledPlugins: s.plugins.filter((p) => p.enabled).map((p) => p.id),
            }
          : {}),
        tools: ctx.runtime.toolNames(),
        notes,
      };
    },
  },
  {
    name: "login",
    title: "Entrar no painel",
    description:
      "O login é feito pela pessoa no terminal, sem a senha passar pela conversa: `npx rubrica mcp login`. Esta ferramenta confere se já há sessão e devolve as instruções. Só aceita `password` se o servidor foi iniciado com RUBRICA_MCP_ALLOW_PASSWORD=1 (automação; evite).",
    access: { login: false },
    input: () => ({
      type: "object",
      properties: {
        email: prop.string("E-mail da conta do painel."),
        password: prop.string("Senha. Desativado por padrão: use o login no terminal."),
      },
      additionalProperties: false,
    }),
    async handler(args: { email?: string; password?: string }, ctx) {
      const { runtime, state } = ctx;
      if (runtime.hasSession() && state.me && (!args.email || args.email.toLowerCase() === state.me.email?.toLowerCase())) {
        return { loggedIn: true, user: { email: state.me.email, role: state.me.role }, message: "Já há uma sessão válida." };
      }
      if (!args.password) {
        return { loggedIn: false, message: TERMINAL_LOGIN(runtime.project.name), command: `npx rubrica mcp login${args.email ? ` --email ${args.email}` : ""}` };
      }
      if (!runtime.options.allowPasswordArg) {
        return {
          loggedIn: false,
          message: `Por segurança, este servidor não aceita senha pela conversa. ${TERMINAL_LOGIN(runtime.project.name)}\n(Para automação, inicie o servidor com RUBRICA_MCP_ALLOW_PASSWORD=1.)`,
        };
      }
      if (!args.email) return { loggedIn: false, message: "Informe o e-mail." };
      await runtime.signIn(args.email, args.password);
      const next = await runtime.refresh();
      return { loggedIn: !!next.me, user: next.me ? { email: next.me.email, role: next.me.role } : undefined, ...(next.problem ? { message: next.problem } : {}) };
    },
  },
  {
    name: "logout",
    title: "Sair",
    description: "Encerra a sessão e apaga o token guardado neste computador. Para entrar de novo, a pessoa roda `npx rubrica mcp login`.",
    access: { login: false },
    input: () => ({ type: "object", properties: {}, additionalProperties: false }),
    async handler(_args, ctx) {
      const removed = await ctx.runtime.signOut();
      await ctx.runtime.refresh();
      return { loggedOut: true, hadSession: removed };
    },
  },
];
