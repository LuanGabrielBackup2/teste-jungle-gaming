import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { Quote, QuoteItem, QuoteRequest } from "../../types";
import { addDecimals, multiplyDecimal } from "../../lib/decimal";

const VALID_COUPONS: Record<string, string> = {
  KURIO10: "0.10", // 10% discount
  GENESIS20: "0.20",
};

const NETWORK_FEES: Record<string, string> = {
  ethereum: "0.0085",
  polygon: "0.0012",
  solana: "0.0005",
};

export const quoteHandlers = [
  // POST /api/quote
  http.post("/api/quote", async ({ request }) => {
    await delay({ min: 300, max: 700 });

    const body = (await request.json()) as QuoteRequest;
    const quoteItems: QuoteItem[] = [];
    let subtotal = "0";
    let priceChanged = false;
    let availabilityChanged = false;

    for (const item of body.items) {
      const nft = db.nfts.find((n) => n.id === item.nftId);
      const edition = nft?.editions.find((e) => e.id === item.editionId);

      if (!nft || !edition) {
        return HttpResponse.json(
          {
            code: "NOT_FOUND",
            message: `NFT ou edição não encontrado: ${item.nftId}/${item.editionId}`,
          },
          { status: 404 }
        );
      }

      const cartItem = db
        .cart("guest") // fall back – actual check done in cart
        .items.find(
          (ci) => ci.nftId === item.nftId && ci.editionId === item.editionId
        );

      const itemPriceChanged =
        cartItem !== undefined && cartItem.price !== edition.price;
      const itemAvailabilityChanged = item.quantity > edition.available;

      if (itemPriceChanged) priceChanged = true;
      if (itemAvailabilityChanged) availabilityChanged = true;

      const itemSubtotal = multiplyDecimal(edition.price, item.quantity);
      subtotal = addDecimals(subtotal, itemSubtotal);

      quoteItems.push({
        nftId: item.nftId,
        editionId: item.editionId,
        quantity: item.quantity,
        unitPrice: edition.price,
        subtotal: itemSubtotal,
        available: edition.available,
        priceChanged: itemPriceChanged,
        availabilityChanged: itemAvailabilityChanged,
      });
    }

    // Coupon
    let discount = "0";
    let couponValid = false;
    let couponError: string | undefined;

    if (body.couponCode) {
      const rate = VALID_COUPONS[body.couponCode.toUpperCase()];
      if (rate) {
        discount = multiplyDecimal(subtotal, parseFloat(rate));
        couponValid = true;
      } else {
        couponError = "Cupom inválido ou expirado";
      }
    }

    const afterDiscount = addDecimals(subtotal, `-${discount}`);

    // Use first item's edition to determine network fee (simplification)
    const firstNft = db.nfts.find((n) => n.id === body.items[0]?.nftId);
    const networkKey = firstNft?.network ?? "ethereum";
    const networkFee = NETWORK_FEES[networkKey] ?? "0.0085";

    const total = addDecimals(afterDiscount, networkFee);

    const quote: Quote = {
      items: quoteItems,
      subtotal,
      discount,
      networkFee,
      total,
      couponValid,
      couponError,
      ethUsdRate: "3240.50",
      expiresAt: new Date(Date.now() + 1000 * 60 * 5).toISOString(), // 5 min
    };

    return HttpResponse.json(quote);
  }),
];
