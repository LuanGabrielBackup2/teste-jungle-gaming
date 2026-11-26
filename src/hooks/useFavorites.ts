import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type { Favorite } from "../types";
import { useSession } from "./useSession";

export function useFavorites() {
  const { data: session } = useSession();
  return useQuery<Favorite[]>({
    queryKey: qk.favorites(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Favorite[]>("/favorites", { signal });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!session,
    placeholderData: [],
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftId,
      isFavorited,
    }: {
      nftId: string;
      isFavorited: boolean;
    }) => {
      if (isFavorited) {
        await api.delete(`/favorites/${nftId}`);
      } else {
        await api.post("/favorites", { nftId });
      }
    },
    // Optimistic update
    onMutate: async ({ nftId, isFavorited }) => {
      await qc.cancelQueries({ queryKey: qk.favorites() });
      const previous = qc.getQueryData<Favorite[]>(qk.favorites());

      qc.setQueryData<Favorite[]>(qk.favorites(), (old = []) => {
        if (isFavorited) {
          return old.filter((f) => f.nftId !== nftId);
        }
        return [...old, { nftId, addedAt: new Date().toISOString() }];
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.previous !== undefined) {
        qc.setQueryData(qk.favorites(), context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.favorites() });
    },
  });
}
