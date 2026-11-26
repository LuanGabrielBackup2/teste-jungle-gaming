/**
 * Shared beforeLoad helper for protected routes.
 * Fetches the session using the same Axios instance used throughout the app,
 * so it always hits the MSW handler in dev/demo.
 */
import { redirect } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { api } from "./axios";
import { qk } from "./queryKeys";
import type { Session } from "../types";

export async function requireAuth(
  queryClient: QueryClient,
  redirectTo: string
) {
  const session = await queryClient.fetchQuery<Session | null>({
    queryKey: qk.session(),
    queryFn: async () => {
      const token = localStorage.getItem("session_token");
      if (!token) return null;
      try {
        const { data } = await api.get<Session>("/auth/session");
        return data;
      } catch {
        localStorage.removeItem("session_token");
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  if (!session) {
    throw redirect({ to: "/login", search: { redirect: redirectTo } });
  }

  return session;
}
