import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { Favorite } from "../../types";
import { nanoid } from "../../lib/nanoid";

function getAuthUserId(request: Request): string | null {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const session = db.findSession(token);
  return session?.user.id ?? null;
}

export const favoritesHandlers = [
  // GET /api/favorites
  http.get("/api/favorites", async ({ request }) => {
    await delay(200);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }
    return HttpResponse.json(db.favorites(userId));
  }),

  // POST /api/favorites
  http.post("/api/favorites", async ({ request }) => {
    await delay(300);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { nftId: string };
    const favorites = db.favorites(userId);

    if (favorites.find((f) => f.nftId === body.nftId)) {
      return HttpResponse.json(
        { code: "CONFLICT", message: "NFT já está nos favoritos" },
        { status: 409 }
      );
    }

    const newFavorite: Favorite = {
      nftId: body.nftId,
      addedAt: new Date().toISOString(),
    };

    db.updateFavorites(userId, [...favorites, newFavorite]);
    return HttpResponse.json(newFavorite, { status: 201 });
  }),

  // DELETE /api/favorites/:nftId
  http.delete("/api/favorites/:nftId", async ({ request, params }) => {
    await delay(300);
    const userId = getAuthUserId(request);
    if (!userId) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const favorites = db.favorites(userId);
    const updated = favorites.filter((f) => f.nftId !== params.nftId);
    db.updateFavorites(userId, updated);
    return new HttpResponse(null, { status: 204 });
  }),
];

// Silence unused import warning
void nanoid;
