import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { CartItem } from "../../types";

function getCartOwner(request: Request): string {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token) {
    const session = db.findSession(token);
    if (session) return session.user.id;
  }
  return "guest";
}

export const cartHandlers = [
  // GET /api/cart
  http.get("/api/cart", async ({ request }) => {
    await delay(200);
    const owner = getCartOwner(request);
    return HttpResponse.json(db.cart(owner));
  }),

  // POST /api/cart/items
  http.post("/api/cart/items", async ({ request }) => {
    await delay(300);
    const owner = getCartOwner(request);
    const body = (await request.json()) as {
      nftId: string;
      editionId: string;
      quantity: number;
    };

    const nft = db.nfts.find((n) => n.id === body.nftId);
    const edition = nft?.editions.find((e) => e.id === body.editionId);

    if (!nft || !edition) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "NFT ou edição não encontrada" },
        { status: 404 }
      );
    }

    if (body.quantity > edition.available) {
      return HttpResponse.json(
        { code: "INSUFFICIENT_AVAILABILITY", message: "Quantidade indisponível" },
        { status: 409 }
      );
    }

    const cart = db.cart(owner);
    const existing = cart.items.find(
      (i) => i.nftId === body.nftId && i.editionId === body.editionId
    );

    if (existing) {
      const newQty = Math.min(
        existing.quantity + body.quantity,
        edition.maxPerOrder,
        edition.available
      );
      existing.quantity = newQty;
    } else {
      const item: CartItem = {
        nftId: body.nftId,
        editionId: body.editionId,
        quantity: body.quantity,
        price: edition.price,
        name: nft.name,
        image: nft.image,
        editionLabel: edition.label,
        available: edition.available,
      };
      cart.items.push(item);
    }

    db.updateCart(owner, cart);
    return HttpResponse.json(cart);
  }),

  // PATCH /api/cart/items/:nftId/:editionId
  http.patch("/api/cart/items/:nftId/:editionId", async ({ request, params }) => {
    await delay(200);
    const owner = getCartOwner(request);
    const body = (await request.json()) as { quantity: number };
    const cart = db.cart(owner);

    const item = cart.items.find(
      (i) => i.nftId === params.nftId && i.editionId === params.editionId
    );

    if (!item) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Item não encontrado no carrinho" },
        { status: 404 }
      );
    }

    const edition = db.nfts
      .find((n) => n.id === params.nftId)
      ?.editions.find((e) => e.id === params.editionId);

    if (!edition) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Edição não encontrada" },
        { status: 404 }
      );
    }

    if (body.quantity > edition.available) {
      return HttpResponse.json(
        { code: "INSUFFICIENT_AVAILABILITY", message: "Quantidade indisponível" },
        { status: 409 }
      );
    }

    item.quantity = body.quantity;
    item.price = edition.price; // refresh price
    item.available = edition.available;
    db.updateCart(owner, cart);
    return HttpResponse.json(cart);
  }),

  // DELETE /api/cart/items/:nftId/:editionId
  http.delete("/api/cart/items/:nftId/:editionId", async ({ request, params }) => {
    await delay(200);
    const owner = getCartOwner(request);
    const cart = db.cart(owner);
    cart.items = cart.items.filter(
      (i) => !(i.nftId === params.nftId && i.editionId === params.editionId)
    );
    db.updateCart(owner, cart);
    return HttpResponse.json(cart);
  }),
];
