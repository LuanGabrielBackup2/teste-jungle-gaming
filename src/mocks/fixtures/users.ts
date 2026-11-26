import type { User, Wallet } from "../../types";

export type MockUser = User & {
  passwordHash: string; // stored as plaintext label — never a real hash
};

/** Two test users available in all mock scenarios. */
export const userFixtures: MockUser[] = [
  {
    id: "user-001",
    name: "Alice Collector",
    email: "alice@kurio.dev",
    passwordHash: "alice123",
    avatar: "https://i.pravatar.cc/150?u=alice",
    bio: "Colecionadora apaixonada por arte digital generativa.",
    createdAt: "2024-01-15T10:00:00Z",
  },
  {
    id: "user-002",
    name: "Bob NFTer",
    email: "bob@kurio.dev",
    passwordHash: "bob123",
    avatar: "https://i.pravatar.cc/150?u=bob",
    bio: "Artista e colecionador. Especialista em NFTs de jogos.",
    createdAt: "2024-02-20T10:00:00Z",
  },
];

export const walletFixtures: Record<string, Wallet[]> = {
  "user-001": [
    {
      id: "wallet-001-1",
      label: "primary",
      address: "0xAlice1234567890abcdef1234567890abcdef12",
      network: "ethereum",
      name: "MetaMask Principal",
    },
    {
      id: "wallet-001-2",
      label: "secondary",
      address: "0xAlice9876543210fedcba9876543210fedcba98",
      network: "polygon",
      name: "Polygon Secundária",
    },
  ],
  "user-002": [
    {
      id: "wallet-002-1",
      label: "primary",
      address: "0xBob1234567890abcdef1234567890abcdef1234",
      network: "ethereum",
      name: "MetaMask Bob",
    },
  ],
};
