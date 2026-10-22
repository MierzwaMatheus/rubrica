interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Apenas passa children adiante. O <Layout> é responsabilidade do <App> root,
 * que já envolve todas as rotas. Aqui só precisamos do guard de autenticação
 * (redireciona para /login se o usuário não estiver autenticado E a rota exigir auth).
 */
export function PublicRoute({ children }: PublicRouteProps) {
  return <>{children}</>;
}