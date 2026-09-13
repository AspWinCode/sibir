import type { User } from "@prisma/client";
import { prisma } from "./lib/prisma.js";
import { getTokenFromHeader, verifyAuthToken } from "./lib/auth.js";

export interface GraphQLContext {
  prisma: typeof prisma;
  user: User | null;
}

export async function createContext({ request }: { request: Request }): Promise<GraphQLContext> {
  const token = getTokenFromHeader(request.headers.get("authorization"));
  const payload = token ? verifyAuthToken(token) : null;
  const user = payload ? await prisma.user.findUnique({ where: { id: payload.userId } }) : null;
  return { prisma, user };
}

export class AuthError extends Error {
  constructor(message = "Требуется авторизация") {
    super(message);
    this.name = "AuthError";
  }
}

export function requireUser(ctx: GraphQLContext): User {
  if (!ctx.user) throw new AuthError();
  return ctx.user;
}

export function requireRole(ctx: GraphQLContext, ...roles: User["role"][]): User {
  const user = requireUser(ctx);
  if (!roles.includes(user.role)) {
    throw new AuthError("Недостаточно прав");
  }
  return user;
}
