import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { CreateOrderPayload, Order, OrderItem } from "../../types";
import { nanoid } from "../../lib/nanoid";

function getAuthUserId(request: Request): string | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const session = db.findSession(token);
  return session?.user.id ?? null;
}

export const ordersHandlers = [
  // POST /api/orders
  http.post("/api/orders", async ({ request }) => {
    await delay({ min: 600, max: 1200 });

    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as CreateOrderPayload;

    // Idempotency: return existing order if same key
    const existing = db.orders.find(
      (o) => o.idempotencyKey === body.idempotencyKey
    );
    if (existing) {
      // Conflict if key was used with different content (simplified check)
      return HttpResponse.json(existing, { status: 200 });
    }

    // Build order items from quote snapshot
    const items: OrderItem[] = body.items.map((item) => {
      const nft = db.nfts.find((n) => n.id === item.nftId)!;
      const edition = nft.editions.find((e) => e.id === item.editionId)!;
      const quoteItem = body.quoteSnapshot.items.find(
        (qi) => qi.nftId === item.nftId && qi.editionId === item.editionId
      );
      return {
        nftId: item.nftId,
        editionId: item.editionId,
        quantity: item.quantity,
        unitPrice: quoteItem?.unitPrice ?? edition.price,
        subtotal: quoteItem?.subtotal ?? "0",
        name: nft.name,
        image: nft.image,
        editionLabel: edition.label,
      };
    });

    const wallet = db
      .wallets(userId)
      .find((w) => w.id === body.walletId);

    const order: Order = {
      id: `order-${nanoid(8)}`,
      idempotencyKey: body.idempotencyKey,
      status: "pending",
      items,
      subtotal: body.quoteSnapshot.subtotal,
      discount: body.quoteSnapshot.discount,
      networkFee: body.quoteSnapshot.networkFee,
      total: body.quoteSnapshot.total,
      couponCode: body.couponCode,
      walletId: body.walletId,
      walletAddress: wallet?.address ?? "0x0000",
      network: body.network,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addOrder(order);

    // Simulate async confirmation via setTimeout (Socket.IO event will follow)
    setTimeout(() => {
      const confirmed = Math.random() > 0.15; // 85% success
      const txHash = `0x${nanoid(64)}`;
      db.updateOrderStatus(
        order.id,
        confirmed ? "confirmed" : "refused",
        confirmed ? txHash : undefined
      );
    }, 2500);

    return HttpResponse.json(order, { status: 201 });
  }),

  // GET /api/orders
  http.get("/api/orders", async ({ request }) => {
    await delay(300);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }
    // Return orders that contain the user's wallet
    const userWallets = db.wallets(userId).map((w) => w.id);
    const orders = db.orders.filter((o) => userWallets.includes(o.walletId));
    return HttpResponse.json(orders);
  }),

  // GET /api/orders/:id
  http.get("/api/orders/:id", async ({ request, params }) => {
    await delay(200);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const order = db.orders.find((o) => o.id === params.id);
    if (!order) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Pedido não encontrado" },
        { status: 404 }
      );
    }
    return HttpResponse.json(order);
  }),
];
