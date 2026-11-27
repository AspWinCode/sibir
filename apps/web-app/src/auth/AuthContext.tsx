import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { gql } from "../api/client";

export interface AppUser {
  id: string;
  name: string;
  phone: string;
  login?: string | null;
  role: "COLLECTOR" | "PROCUREMENT" | "ADMIN";
}

interface ProcurementRegistration {
  phone: string;
  name: string;
  orgName: string;
  inn: string;
  email: string;
  login: string;
  password: string;
}

interface AuthContextValue {
  user: AppUser | null;
  registerCollector: (input: { phone: string; name: string; login: string; password: string }) => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  registerProcurement: (input: ProcurementRegistration) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REGISTER_COLLECTOR = /* GraphQL */ `
  mutation RegisterCollector($input: RegisterCollectorInput!) {
    registerCollector(input: $input)
  }
`;

const REGISTER_PROCUREMENT = /* GraphQL */ `
  mutation RegisterProcurement($input: RegisterProcurementInput!) {
    registerProcurement(input: $input)
  }
`;

const LOGIN = /* GraphQL */ `
  mutation Login($login: String!, $password: String!) {
    login(login: $login, password: $password) {
      token
      user { id name phone login role }
    }
  }
`;

const ME = `query { me { id name phone login role } }`;

function loadStoredUser(): AppUser | null {
  const raw = localStorage.getItem("lesovik_user");
  return raw ? (JSON.parse(raw) as AppUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(loadStoredUser);

  useEffect(() => {
    if (!localStorage.getItem("lesovik_token")) return;
    gql<{ me: AppUser | null }>(ME).then(({ me }) => {
      if (me) setUser(me);
      else {
        localStorage.removeItem("lesovik_token");
        localStorage.removeItem("lesovik_user");
        setUser(null);
      }
    }).catch(() => {
      localStorage.removeItem("lesovik_token");
      localStorage.removeItem("lesovik_user");
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      registerCollector: async (input) => {
        await gql(REGISTER_COLLECTOR, { input });
      },
      login: async (login, password) => {
        const data = await gql<{ login: { token: string; user: AppUser } }>(LOGIN, { login, password });
        localStorage.setItem("lesovik_token", data.login.token);
        localStorage.setItem("lesovik_user", JSON.stringify(data.login.user));
        setUser(data.login.user);
      },
      registerProcurement: async (input) => {
        await gql(REGISTER_PROCUREMENT, { input });
      },
      logout: () => {
        localStorage.removeItem("lesovik_token");
        localStorage.removeItem("lesovik_user");
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
