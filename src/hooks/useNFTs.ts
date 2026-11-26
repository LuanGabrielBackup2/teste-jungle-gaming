import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/axios";
import { qk } from "../lib/queryKeys";
import type { NFTListParams, PaginatedNFTs, NFT } from "../types";

export function useNFTs(params: NFTListParams) {
  return useQuery<PaginatedNFTs>({
    queryKey: qk.nfts(params),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<PaginatedNFTs>("/nfts", {
        params,
        signal,
      });
      // Normalize: guarantee data array is always present
      return {
        ...data,
        data: Array.isArray(data?.data) ? data.data : [],
        total: data?.total ?? 0,
        page: data?.page ?? 1,
        limit: data?.limit ?? 12,
        totalPages: data?.totalPages ?? 1,
      };
    },
    placeholderData: { data: [], total: 0, page: 1, limit: 12, totalPages: 1 },
  });
}

export function useNFT(id: string) {
  return useQuery<NFT>({
    queryKey: qk.nft(id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<NFT>(`/nfts/${id}`, { signal });
      return data;
    },
    enabled: !!id,
  });
}
