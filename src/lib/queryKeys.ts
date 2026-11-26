import type { NFTListParams } from "../types";

/**
 * Centralized query key factory.
 * Using arrays ensures fine-grained cache invalidation.
 */
export const qk = {
  // Session
  session: () => ["session"] as const,

  // NFTs
  nfts: (params?: NFTListParams) =>
    params ? ["nfts", params] : ["nfts"],
  nft: (id: string) => ["nft", id] as const,

  // Favorites
  favorites: () => ["favorites"] as const,

  // Cart
  cart: () => ["cart"] as const,

  // Quote
  quote: (hash: string) => ["quote", hash] as const,

  // Orders
  orders: () => ["orders"] as const,
  order: (id: string) => ["order", id] as const,

  // Profile
  profile: () => ["profile"] as const,

  // Wallets
  wallets: () => ["wallets"] as const,
};
