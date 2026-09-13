import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface AuthTokenPayload {
  userId: string;
  role: User["role"];
}

export function signAuthToken(user: Pick<User, "id" | "role">): string {
  const payload: AuthTokenPayload = { userId: user.id, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getTokenFromHeader(authHeader?: string | null): string | null {
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}
