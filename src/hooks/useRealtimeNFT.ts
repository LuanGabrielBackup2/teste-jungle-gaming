/**
 * Subscribes to nft.updated Socket.IO events and keeps the TanStack Query
 * cache in sync without a full re-fetch.
 *
 * Call this hook once in a component that needs live price/availability:
 *   - NFT detail page  (single NFT)
 *   - Cart page        (any NFT in the cart)
 *   - Home page        (catalog)
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onNftUpdated, acceptEvent } from "../lib/socket";
import { qk } from "../lib/queryKeys";
import type { NFT, NftUpdatedEvent } from "../types";

export function useRealtimeNFT() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsubscribe = onNftUpdated((event: NftUpdatedEvent) => {
      if (!acceptEvent(event)) return;

      const { resourceId, data } = event;

      // Patch single-NFT cache entry
      qc.setQueryData<NFT>(qk.nft(resourceId), (old) => {
        if (!old) return old;
        return { ...old, editions: data.editions };
      });

      // Patch all paginated NFT list entries that contain this NFT
      qc.setQueriesData<{ data: NFT[]; total: number; page: number; limit: number; totalPages: number }>(
        { queryKey: qk.nfts() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === resourceId ? { ...n, editions: data.editions } : n
            ),
          };
        }
      );

      // Patch cart items price/availability
      qc.setQueryData<{ items: { nftId: string; editionId: string; price: string; available: number }[] }>(
        qk.cart(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => {
              if (item.nftId !== resourceId) return item;
              const updatedEdition = data.editions.find(
                (e) => e.id === item.editionId
              );
              if (!updatedEdition) return item;
              return {
                ...item,
                price: updatedEdition.price,
                available: updatedEdition.available,
              };
            }),
          };
        }
      );
    });

    return unsubscribe;
  }, [qc]);
}
