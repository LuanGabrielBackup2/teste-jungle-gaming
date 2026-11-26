import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { UpsertWalletPayload, UpdateProfilePayload } from "../../types";
import { nanoid } from "../../lib/nanoid";

function getAuthUserId(request: Request): string | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const session = db.findSession(token);
  return session?.user.id ?? null;
}

export const profileHandlers = [
  // GET /api/profile
  http.get("/api/profile", async ({ request }) => {
    await delay(200);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }
    const user = db.findUserById(userId);
    return HttpResponse.json(user);
  }),

  // PATCH /api/profile
  http.patch("/api/profile", async ({ request }) => {
    await delay(400);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpdateProfilePayload;
    db.updateUserProfile(userId, body);
    const user = db.findUserById(userId);
    return HttpResponse.json(user);
  }),

  // POST /api/profile/password
  http.post("/api/profile/password", async ({ request }) => {
    await delay(500);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };

    const user = db.users.find((u) => u.id === userId);
    if (!user || user.passwordHash !== body.currentPassword) {
      return HttpResponse.json(
        { code: "INVALID_PASSWORD", message: "Senha atual incorreta" },
        { status: 400 }
      );
    }

    db.updateUserPassword(userId, body.newPassword);
    return new HttpResponse(null, { status: 204 });
  }),

  // GET /api/wallets
  http.get("/api/wallets", async ({ request }) => {
    await delay(200);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }
    return HttpResponse.json(db.wallets(userId));
  }),

  // PUT /api/wallets
  http.put("/api/wallets", async ({ request }) => {
    await delay(400);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as UpsertWalletPayload;
    const existing = db.wallets(userId).find((w) => w.label === body.label);
    const wallet = {
      id: existing?.id ?? `wallet-${nanoid(6)}`,
      ...body,
    };

    db.upsertWallet(userId, wallet);
    return HttpResponse.json(wallet);
  }),
];
