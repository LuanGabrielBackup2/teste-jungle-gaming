import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type {
  Session,
  LoginPayload,
  RegisterPayload,
} from "../types";

export function useSession() {
  return useQuery<Session | null>({
    queryKey: qk.session(),
    queryFn: async ({ signal }) => {
      const token = localStorage.getItem("session_token");
      if (!token) return null;
      try {
        const { data } = await api.get<Session>("/auth/session", { signal });
        return data;
      } catch {
        localStorage.removeItem("session_token");
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data } = await api.post<Session>("/auth/login", payload);
      return data;
    },
    onSuccess: (session) => {
      localStorage.setItem("session_token", session.token);
      qc.setQueryData(qk.session(), session);
      // Invalidate private data so it's re-fetched under the new user
      qc.invalidateQueries({ queryKey: qk.cart() });
      qc.invalidateQueries({ queryKey: qk.favorites() });
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await api.post<Session>("/auth/register", payload);
      return data;
    },
    onSuccess: (session) => {
      localStorage.setItem("session_token", session.token);
      qc.setQueryData(qk.session(), session);
      qc.invalidateQueries({ queryKey: qk.cart() });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete("/auth/session");
    },
    onSettled: () => {
      localStorage.removeItem("session_token");
      // Clear all private cache keys
      qc.setQueryData(qk.session(), null);
      qc.removeQueries({ queryKey: qk.cart() });
      qc.removeQueries({ queryKey: qk.favorites() });
      qc.removeQueries({ queryKey: qk.orders() });
      qc.removeQueries({ queryKey: qk.profile() });
      qc.removeQueries({ queryKey: qk.wallets() });
    },
  });
}
