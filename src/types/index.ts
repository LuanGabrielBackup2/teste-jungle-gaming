// ─── NFT ─────────────────────────────────────────────────────────────────────

export type NFTEdition = {
  id: string;
  label: string;
  price: string; // decimal string, ETH
  available: number;
  maxPerOrder: number;
};

export type NFT = {
  id: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  collection: string;
  category: string;
  network: "ethereum" | "polygon" | "solana";
  tags: string[];
  editions: NFTEdition[];
  isFavorited?: boolean;
  createdAt: string;
};

export type NFTListParams = {
  q?: string;
  category?: string;
  network?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: "recent" | "price_asc" | "price_desc" | "popular";
  page?: number;
  limit?: number;
};

export type PaginatedNFTs = {
  data: NFT[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// ─── Auth / Session ───────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
};

export type Session = {
  user: User;
  token: string;
  expiresAt: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

// ─── Cart ─────────────────────────────────────────────────────────────────────

export type CartItem = {
  nftId: string;
  editionId: string;
  quantity: number;
  // snapshot at add time — updated via socket events
  price: string;
  name: string;
  image: string;
  editionLabel: string;
  available: number;
};

export type Cart = {
  items: CartItem[];
  couponCode?: string;
};

// ─── Quote ───────────────────────────────────────────────────────────────────

export type QuoteRequest = {
  items: { nftId: string; editionId: string; quantity: number }[];
  couponCode?: string;
};

export type QuoteItem = {
  nftId: string;
  editionId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  available: number;
  priceChanged: boolean;
  availabilityChanged: boolean;
};

export type Quote = {
  items: QuoteItem[];
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  couponValid: boolean;
  couponError?: string;
  ethUsdRate: string;
  expiresAt: string;
};

// ─── Wallet ───────────────────────────────────────────────────────────────────

export type WalletNetwork = "ethereum" | "polygon" | "solana";

export type Wallet = {
  id: string;
  label: "primary" | "secondary";
  address: string;
  network: WalletNetwork;
  name: string;
};

// ─── Order ───────────────────────────────────────────────────────────────────

export type OrderStatus = "pending" | "confirmed" | "refused";

export type OrderItem = {
  nftId: string;
  editionId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  name: string;
  image: string;
  editionLabel: string;
};

export type Order = {
  id: string;
  idempotencyKey: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  networkFee: string;
  total: string;
  couponCode?: string;
  walletId: string;
  walletAddress: string;
  network: WalletNetwork;
  txHash?: string;
  explorerUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderPayload = {
  idempotencyKey: string;
  items: { nftId: string; editionId: string; quantity: number }[];
  couponCode?: string;
  walletId: string;
  network: WalletNetwork;
  quoteSnapshot: Quote;
};

// ─── Favorites ───────────────────────────────────────────────────────────────

export type Favorite = {
  nftId: string;
  addedAt: string;
};

// ─── Socket.IO Events ────────────────────────────────────────────────────────

export type NftUpdatedEvent = {
  id: string;
  resourceId: string; // nftId
  version: number;
  data: {
    editions: NFTEdition[];
  };
};

export type OrderUpdatedEvent = {
  id: string;
  resourceId: string; // orderId
  version: number;
  data: {
    status: OrderStatus;
    txHash?: string;
  };
};

// ─── API Error ───────────────────────────────────────────────────────────────

export type ApiError = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  avatar?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type UpsertWalletPayload = {
  label: "primary" | "secondary";
  address: string;
  network: WalletNetwork;
  name: string;
};
