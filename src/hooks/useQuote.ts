import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type { Quote, QuoteRequest } from "../types";

/** Hash the request to use as a stable query key */
function hashQuoteRequest(req: QuoteRequest): string {
  return JSON.stringify(req);
}

export function useQuote(request: QuoteRequest | null) {
  const hash = request ? hashQuoteRequest(request) : "";
  return useQuery<Quote>({
    queryKey: qk.quote(hash),
    queryFn: async ({ signal }) => {
      const { data } = await api.post<Quote>("/quote", request, { signal });
      return data;
    },
    enabled: !!request && request.items.length > 0,
    staleTime: 1000 * 60 * 4, // quote valid 4 min (expires at 5)
    gcTime: 1000 * 60 * 5,
  });
}

export function useValidateQuote() {
  return useMutation({
    mutationFn: async (request: QuoteRequest) => {
      const { data } = await api.post<Quote>("/quote", request);
      return data;
    },
  });
}
