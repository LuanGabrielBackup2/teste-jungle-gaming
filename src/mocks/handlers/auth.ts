import { http, HttpResponse, delay } from "msw";
import { db } from "../db";
import type { Session, User } from "../../types";
import { nanoid } from "../../lib/nanoid";

function makeToken() {
  return `mock_token_${nanoid()}`;
}

function sessionExpiresAt() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(); // 24h
}

export const authHandlers = [
  // POST /api/auth/register
  http.post("/api/auth/register", async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    if (!body.name || !body.email || !body.password) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    if (db.findUser(body.email)) {
      return HttpResponse.json(
        { code: "CONFLICT", message: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    const user: User = {
      id: `user-${nanoid(6)}`,
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString(),
    };

    // Cast to MockUser for internal storage
    (db.users as unknown as Array<typeof user & { passwordHash: string }>).push({
      ...user,
      passwordHash: body.password,
    });

    const token = makeToken();
    const session: Session = {
      user,
      token,
      expiresAt: sessionExpiresAt(),
    };
    db.addSession(session);
    // Merge any guest cart items
    db.mergeGuestCartToUser(user.id);

    return HttpResponse.json(session, { status: 201 });
  }),

  // POST /api/auth/login
  http.post("/api/auth/login", async ({ request }) => {
    await delay(500);
    const body = (await request.json()) as { email: string; password: string };

    const user = db.findUser(body.email);
    if (!user || user.passwordHash !== body.password) {
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "E-mail ou senha incorretos" },
        { status: 401 }
      );
    }

    const token = makeToken();
    const session: Session = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      token,
      expiresAt: sessionExpiresAt(),
    };
    db.addSession(session);
    db.mergeGuestCartToUser(user.id);

    return HttpResponse.json(session);
  }),

  // GET /api/auth/session
  http.get("/api/auth/session", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return HttpResponse.json(
        { code: "UNAUTHORIZED", message: "Não autenticado" },
        { status: 401 }
      );
    }
    const session = db.findSession(token);
    if (!session) {
      return HttpResponse.json(
        { code: "SESSION_EXPIRED", message: "Sessão expirada" },
        { status: 401 }
      );
    }
    return HttpResponse.json(session);
  }),

  // DELETE /api/auth/session (logout)
  http.delete("/api/auth/session", ({ request }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (token) db.removeSession(token);
    return new HttpResponse(null, { status: 204 });
  }),
];
