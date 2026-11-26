import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type { Cart } from "../types";

export function useCart() {
  return useQuery<Cart>({
    queryKey: qk.cart(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Cart>("/cart", { signal });
      // Normalize: guarantee items is always an array regardless of API shape
      return { ...data, items: Array.isArray(data?.items) ? data.items : [] };
    },
    staleTime: 0,
    // Return a safe default while loading so consumers never get undefined
    placeholderData: { items: [] },
  });
}

export function useCartItemCount() {
  const { data: cart } = useCart();
  return (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      nftId: string;
      editionId: string;
      quantity: number;
    }) => {
      const { data } = await api.post<Cart>("/cart/items", payload);
      return data;
    },
    onSuccess: (cart) => {
      qc.setQueryData(qk.cart(), cart);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nftId,
      editionId,
      quantity,
    }: {
      nftId: string;
      editionId: string;
      quantity: number;
    }) => {
      const { data } = await api.patch<Cart>(
        `/cart/items/${nftId}/${editionId}`,
        { quantity }
      );
      return data;
    },
    onSuccess: (cart) => {
      qc.setQueryData(qk.cart(), cart);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      nftId,
      editionId,
    }: {
      nftId: string;
      editionId: string;
    }) => {
      const { data } = await api.delete<Cart>(
        `/cart/items/${nftId}/${editionId}`
      );
      return data;
    },
    onSuccess: (cart) => {
      qc.setQueryData(qk.cart(), cart);
    },
  });
}
