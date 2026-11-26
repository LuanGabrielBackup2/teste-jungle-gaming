import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type { Order, CreateOrderPayload } from "../types";

export function useOrder(id: string) {
  return useQuery<Order>({
    queryKey: qk.order(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Order>(`/orders/${id}`, { signal });
      return data;
    },
    enabled: !!id,
    // Poll while pending — stops once terminal state reached
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "confirmed" || status === "refused") return false;
      return 2000;
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOrderPayload) => {
      const { data } = await api.post<Order>("/orders", payload);
      return data;
    },
    onSuccess: (order) => {
      qc.setQueryData(qk.order(order.id), order);
      // Invalidate cart — items purchased should be cleared by server
      qc.invalidateQueries({ queryKey: qk.cart() });
    },
  });
}
