/**
 * Subscribes to order.updated Socket.IO events and updates the order cache.
 * Used in the OrderConfirmationPage to get live status without relying
 * solely on polling.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { onOrderUpdated, acceptEvent } from "../lib/socket";
import { qk } from "../lib/queryKeys";
import type { Order, OrderUpdatedEvent } from "../types";

export function useRealtimeOrder(orderId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orderId) return;

    const unsubscribe = onOrderUpdated((event: OrderUpdatedEvent) => {
      if (event.resourceId !== orderId) return;
      if (!acceptEvent(event)) return;

      qc.setQueryData<Order>(qk.order(orderId), (old) => {
        if (!old) return old;
        return {
          ...old,
          status: event.data.status,
          txHash: event.data.txHash ?? old.txHash,
          updatedAt: new Date().toISOString(),
        };
      });
    });

    return unsubscribe;
  }, [orderId, qc]);
}
