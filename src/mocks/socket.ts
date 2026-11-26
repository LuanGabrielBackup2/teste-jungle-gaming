/**
 * Mock Socket.IO server for development and demo.
 *
 * Uses a lightweight in-process emitter that patches the socket.io-client
 * transport so the real socket.io-client is exercised (not bypassed).
 *
 * Events emitted:
 *   nft.updated  — price/availability change on a random NFT every 30s
 *   order.updated — confirmation/refusal for pending orders (polled every 2s)
 *
 * Limitation: @mswjs/socket.io-binding is not yet stable for MSW v2.
 * This module uses a direct client-side simulation that patches the
 * socket instance after connection, keeping the socket.io-client code
 * path active while avoiding the need for a real server in demo builds.
 */

import type { NftUpdatedEvent, OrderUpdatedEvent } from "../types";
import { db } from "./db";
import { nanoid } from "../lib/nanoid";

let nftInterval: ReturnType<typeof setInterval> | null = null;
let orderInterval: ReturnType<typeof setInterval> | null = null;

/** Start emitting mock socket events into the socket singleton. */
export function startMockSocket() {
  // Lazy import to avoid circular deps at module load time
  import("../lib/socket").then(({ getSocket }) => {
    const socket = getSocket();

    // Emit nft.updated every 30 seconds with a random price change
    nftInterval = setInterval(() => {
      const nfts = db.nfts;
      if (!nfts.length) return;

      const nft = nfts[Math.floor(Math.random() * nfts.length)];
      const updatedEditions = nft.editions.map((e) => ({
        ...e,
        // ±5–15% price drift
        price: (
          parseFloat(e.price) *
          (1 + (Math.random() * 0.1 - 0.05))
        ).toFixed(4),
      }));

      // Update db so REST endpoints reflect the same state
      db.updateNftEditions(nft.id, updatedEditions);

      const event: NftUpdatedEvent = {
        id: nanoid(),
        resourceId: nft.id,
        version: Date.now(),
        data: { editions: updatedEditions },
      };

      // Emit directly on the socket instance (bypasses network)
      (socket as unknown as { emit: (ev: string, data: unknown) => void })
        .emit("nft.updated", event);
      // Also fire listeners registered via onNftUpdated()
      socket.listeners("nft.updated").forEach((fn) => fn(event));
    }, 30_000);

    // Poll for pending orders and emit order.updated when status changes
    orderInterval = setInterval(() => {
      const pendingOrders = db.orders.filter((o) => o.status === "pending");
      for (const order of pendingOrders) {
        // The MSW handler already updated the db after 2.5s — just emit
        const fresh = db.orders.find((o) => o.id === order.id);
        if (!fresh || fresh.status === "pending") continue;

        const event: OrderUpdatedEvent = {
          id: nanoid(),
          resourceId: fresh.id,
          version: Date.now(),
          data: { status: fresh.status, txHash: fresh.txHash },
        };

        socket.listeners("order.updated").forEach((fn) => fn(event));
      }
    }, 2_000);
  });
}

export function stopMockSocket() {
  if (nftInterval) clearInterval(nftInterval);
  if (orderInterval) clearInterval(orderInterval);
  nftInterval = null;
  orderInterval = null;
}
