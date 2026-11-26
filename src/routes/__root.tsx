import {
  createRootRouteWithContext,
  Outlet,
  ErrorComponent,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { useRealtimeNFT } from "../hooks/useRealtimeNFT";

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RootError,
  notFoundComponent: NotFound,
});

function RootLayout() {
  // Active globally — keeps catalog, detail and cart in sync with socket events
  useRealtimeNFT();

  return (
    <div className="site">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RootError({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : "Erro desconhecido.";
  return (
    <div className="site">
      <div className="section flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-5xl" aria-hidden>⚠</span>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Algo deu errado
        </h1>
        <p className="text-sm text-gray-500 max-w-md">{message}</p>
        <p className="text-xs text-gray-400">
          Verifique se o servidor de desenvolvimento está rodando com{" "}
          <code className="bg-gray-100 px-1">npm run dev</code> e recarregue a
          página.
        </p>
        <button
          className="button button-light"
          onClick={() => window.location.reload()}
        >
          RECARREGAR PÁGINA
        </button>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="site">
      <div className="section flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-5xl" aria-hidden>404</span>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Página não encontrada
        </h1>
        <a href="/" className="button button-light">
          VOLTAR AO INÍCIO ↗
        </a>
      </div>
    </div>
  );
}

// Silence unused import — TanStack Router types use ErrorComponent internally
void ErrorComponent;
