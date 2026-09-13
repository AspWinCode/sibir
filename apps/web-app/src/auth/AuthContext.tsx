import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { gql } from "../api/client";

interface CollectorUser {
  id: string;
  name: string;
  phone: string;
  role: "COLLECTOR" | "PROCUREMENT" | "ADMIN";
}

interface AuthContextValue {
  user: CollectorUser | null;
  register: (phone: string, name: string) => Promise<void>;
  requestCode: (phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REGISTER = /* GraphQL */ `
  mutation Register($input: RegisterCollectorInput!) {
    registerCollector(input: $input)
  }
`;

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

function loadStoredUser(): CollectorUser | null {
  const raw = localStorage.getItem("sibir_user");
  return raw ? (JSON.parse(raw) as CollectorUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CollectorUser | null>(loadStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      register: async (phone, name) => {
        await gql(REGISTER, { input: { phone, name } });
      },
      requestCode: async (phone) => {
        await gql(REQUEST_CODE, { phone });
      },
      verifyCode: async (phone, code) => {
        const data = await gql<{ verifySmsCode: { token: string; user: CollectorUser } }>(
          VERIFY_CODE,
          { phone, code },
        );
        localStorage.setItem("sibir_token", data.verifySmsCode.token);
        localStorage.setItem("sibir_user", JSON.stringify(data.verifySmsCode.user));
        setUser(data.verifySmsCode.user);
      },
      logout: () => {
        localStorage.removeItem("sibir_token");
        localStorage.removeItem("sibir_user");
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
