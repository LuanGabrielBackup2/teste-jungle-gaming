/**
 * Socket.IO client singleton.
 *
 * - Connects lazily on first call to getSocket().
 * - Disconnects and clears session subscriptions on logout.
 * - Deduplicates events by (id, version) so stale or duplicate
 *   server pushes never regress a more recent state.
 *
 * Transport in mocks: the MSW Socket.IO binding intercepts the
 * connection at the network level, so socket.io-client is exercised
 * end-to-end even in development. See src/mocks/socket.ts.
 */

import { io, Socket } from "socket.io-client";
import type { NftUpdatedEvent, OrderUpdatedEvent } from "../types";

type SocketEvents = {
  "nft.updated": (event: NftUpdatedEvent) => void;
  "order.updated": (event: OrderUpdatedEvent) => void;
};

// Tracks the highest version seen per resource to discard stale events
const versionCache = new Map<string, number>();
// Tracks event IDs seen this session to discard duplicates
const seenIds = new Set<string>();

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;

  _socket = io("/", {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  _socket.on("connect", () => {
    console.debug("[socket] connected:", _socket?.id);
  });

  _socket.on("disconnect", (reason) => {
    console.debug("[socket] disconnected:", reason);
  });

  return _socket;
}

/**
 * Returns false if the event is a duplicate or older than the cached version.
 * Records the event as seen if accepted.
 */
export function acceptEvent(event: { id: string; resourceId: string; version: number }): boolean {
  if (seenIds.has(event.id)) return false;

  const cached = versionCache.get(event.resourceId) ?? -1;
  if (event.version <= cached) return false;

  seenIds.add(event.id);
  versionCache.set(event.resourceId, event.version);
  return true;
}

export function onNftUpdated(handler: SocketEvents["nft.updated"]): () => void {
  const socket = getSocket();
  socket.on("nft.updated", handler);
  return () => socket.off("nft.updated", handler);
}

export function onOrderUpdated(handler: SocketEvents["order.updated"]): () => void {
  const socket = getSocket();
  socket.on("order.updated", handler);
  return () => socket.off("order.updated", handler);
}

/** Call on logout to clear session state without disconnecting permanently. */
export function clearSocketSession() {
  versionCache.clear();
  seenIds.clear();
  _socket?.removeAllListeners("nft.updated");
  _socket?.removeAllListeners("order.updated");
}

/** Disconnect entirely (e.g. on app unmount). */
export function disconnectSocket() {
  clearSocketSession();
  _socket?.disconnect();
  _socket = null;
}
