import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { gql } from "../api/client";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  role: "COLLECTOR" | "PROCUREMENT" | "ADMIN";
}

interface AuthContextValue {
  user: AdminUser | null;
  requestCode: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REQUEST_CODE = /* GraphQL */ `
  mutation RequestCode($phone: String!) {
    requestSmsCode(input: { phone: $phone })
  }
`;

const VERIFY_CODE = /* GraphQL */ `
  mutation VerifyCode($phone: String!, $code: String!) {
    verifySmsCode(input: { phone: $phone, code: $code }) {
      token
      user {
        id
        name
        phone
        role
      }
    }
  }
`;

function loadStoredUser(): AdminUser | null {
  const raw = localStorage.getItem("sibir_admin_user");
  return raw ? (JSON.parse(raw) as AdminUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      requestCode: async (phone) => {
        await gql(REQUEST_CODE, { phone });
      },
      verifyCode: async (phone, code) => {
        const data = await gql<{
          verifySmsCode: { token: string; user: AdminUser };
        }>(VERIFY_CODE, { phone, code });
        if (data.verifySmsCode.user.role !== "ADMIN") {
          throw new Error("Доступ только для администратора");
        }
        localStorage.setItem("sibir_admin_token", data.verifySmsCode.token);
        localStorage.setItem("sibir_admin_user", JSON.stringify(data.verifySmsCode.user));
        setUser(data.verifySmsCode.user);
      },
      logout: () => {
        localStorage.removeItem("sibir_admin_token");
        localStorage.removeItem("sibir_admin_user");
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
