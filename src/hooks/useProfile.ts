import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type {
  User,
  Wallet,
  UpdateProfilePayload,
  ChangePasswordPayload,
  UpsertWalletPayload,
} from "../types";
import { useSession } from "./useSession";

export function useProfile() {
  const { data: session } = useSession();
  return useQuery<User>({
    queryKey: qk.profile(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<User>("/profile", { signal });
      return data;
    },
    enabled: !!session,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await api.patch<User>("/profile", payload);
      return data;
    },
    onSuccess: (user) => {
      qc.setQueryData(qk.profile(), user);
      // Reflect name/avatar in session cache
      qc.setQueryData(qk.session(), (old: { user: User } | null) =>
        old ? { ...old, user } : old
      );
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      await api.post("/profile/password", payload);
    },
  });
}

export function useWallets() {
  const { data: session } = useSession();
  return useQuery<Wallet[]>({
    queryKey: qk.wallets(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Wallet[]>("/wallets", { signal });
      return data;
    },
    enabled: !!session,
  });
}

export function useUpsertWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpsertWalletPayload) => {
      const { data } = await api.put<Wallet>("/wallets", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.wallets() });
    },
  });
}
