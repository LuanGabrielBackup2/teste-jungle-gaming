/**
 * In-memory mock database.
 * Persists to localStorage so state survives page refresh in dev/demo.
 * Call db.reset() to restore the initial scenario.
 */

import type {
  Cart,
  Favorite,
  NFT,
  Order,
  Session,
  User,
  Wallet,
} from "../types";
import { nftFixtures, userFixtures, walletFixtures } from "./fixtures";
import type { MockUser } from "./fixtures/users";

const STORAGE_KEY = "kurio_mock_db";

type DbState = {
  nfts: NFT[];
  users: MockUser[];
  sessions: Session[];
  carts: Record<string, Cart>; // userId → Cart (guests use "guest")
  favorites: Record<string, Favorite[]>; // userId → Favorite[]
  orders: Order[];
  wallets: Record<string, Wallet[]>; // userId → Wallet[]
};

function buildInitialState(): DbState {
  return {
    nfts: JSON.parse(JSON.stringify(nftFixtures)),
    users: JSON.parse(JSON.stringify(userFixtures)),
    sessions: [],
    carts: { guest: { items: [] } },
    favorites: {},
    orders: [],
    wallets: JSON.parse(JSON.stringify(walletFixtures)),
  };
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DbState;
  } catch {
    /* ignore */
  }
  return buildInitialState();
}

function save(state: DbState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore storage quota */
  }
}

let state: DbState = load();

export const db = {
  // ── State access ────────────────────────────────────────────────────────────

  get nfts() { return state.nfts; },
  get users() { return state.users; },
  get sessions() { return state.sessions; },
  get orders() { return state.orders; },

  cart(userId: string): Cart {
    if (!state.carts[userId]) state.carts[userId] = { items: [] };
    return state.carts[userId];
  },

  favorites(userId: string): Favorite[] {
    if (!state.favorites[userId]) state.favorites[userId] = [];
    return state.favorites[userId];
  },

  wallets(userId: string): Wallet[] {
    if (!state.wallets[userId]) state.wallets[userId] = [];
    return state.wallets[userId];
  },

  // ── Mutation helpers ────────────────────────────────────────────────────────

  findUser(email: string): MockUser | undefined {
    return state.users.find((u) => u.email === email);
  },

  findUserById(id: string): User | undefined {
    return state.users.find((u) => u.id === id);
  },

  findSession(token: string): Session | undefined {
    return state.sessions.find((s) => s.token === token);
  },

  addSession(session: Session) {
    state.sessions.push(session);
    save(state);
  },

  removeSession(token: string) {
    state.sessions = state.sessions.filter((s) => s.token !== token);
    save(state);
  },

  updateCart(userId: string, cart: Cart) {
    state.carts[userId] = cart;
    save(state);
  },

  mergeGuestCartToUser(userId: string) {
    const guest = state.carts["guest"] ?? { items: [] };
    const user = state.carts[userId] ?? { items: [] };

    for (const guestItem of guest.items) {
      const existing = user.items.find(
        (i) => i.nftId === guestItem.nftId && i.editionId === guestItem.editionId
      );
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + guestItem.quantity,
          existing.available
        );
      } else {
        user.items.push({ ...guestItem });
      }
    }

    state.carts[userId] = user;
    state.carts["guest"] = { items: [] };
    save(state);
  },

  updateFavorites(userId: string, favorites: Favorite[]) {
    state.favorites[userId] = favorites;
    save(state);
  },

  addOrder(order: Order) {
    state.orders.push(order);
    save(state);
  },

  updateOrderStatus(
    orderId: string,
    status: Order["status"],
    txHash?: string
  ) {
    const order = state.orders.find((o) => o.id === orderId);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      if (txHash) order.txHash = txHash;
      save(state);
    }
  },

  updateNftEditions(nftId: string, editions: NFT["editions"]) {
    const nft = state.nfts.find((n) => n.id === nftId);
    if (nft) {
      nft.editions = editions;
      save(state);
    }
  },

  updateUserProfile(userId: string, patch: Partial<User>) {
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, patch);
      // Reflect changes in active sessions
      state.sessions = state.sessions.map((s) =>
        s.user.id === userId ? { ...s, user: { ...s.user, ...patch } } : s
      );
      save(state);
    }
  },

  updateUserPassword(userId: string, newPassword: string) {
    const user = state.users.find((u) => u.id === userId);
    if (user) {
      user.passwordHash = newPassword;
      save(state);
    }
  },

  upsertWallet(userId: string, wallet: Wallet) {
    if (!state.wallets[userId]) state.wallets[userId] = [];
    const index = state.wallets[userId].findIndex(
      (w) => w.label === wallet.label
    );
    if (index >= 0) {
      state.wallets[userId][index] = wallet;
    } else {
      state.wallets[userId].push(wallet);
    }
    save(state);
  },

  // ── Reset ────────────────────────────────────────────────────────────────────

  reset() {
    state = buildInitialState();
    localStorage.removeItem(STORAGE_KEY);
  },
};
