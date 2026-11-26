import { authHandlers } from "./auth";
import { nftHandlers } from "./nfts";
import { favoritesHandlers } from "./favorites";
import { cartHandlers } from "./cart";
import { quoteHandlers } from "./quote";
import { ordersHandlers } from "./orders";
import { profileHandlers } from "./profile";

export const handlers = [
  ...authHandlers,
  ...nftHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...ordersHandlers,
  ...profileHandlers,
];
