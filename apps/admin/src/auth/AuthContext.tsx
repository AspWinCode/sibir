import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { gql } from "../api/client";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  login?: string | null;
  role: "COLLECTOR" | "PROCUREMENT" | "ADMIN";
}

interface AuthContextValue {
  user: AdminUser | null;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN = /* GraphQL */ `
  mutation Login($login: String!, $password: String!) {
    login(login: $login, password: $password) {
      token
      user {
        id
        name
        phone
        login
        role
      }
    }
  }
`;

function loadStoredUser(): AdminUser | null {
  const raw = localStorage.getItem("lesovik_admin_user");
  return raw ? (JSON.parse(raw) as AdminUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(loadStoredUser);

  useEffect(() => {
    if (!localStorage.getItem("lesovik_admin_token")) return;
    gql<{ me: AdminUser | null }>("query { me { id name phone login role } }").then(({ me }) => {
      if (me?.role === "ADMIN") setUser(me);
      else {
        localStorage.removeItem("lesovik_admin_token");
        localStorage.removeItem("lesovik_admin_user");
        setUser(null);
      }
    }).catch(() => {
      localStorage.removeItem("lesovik_admin_token");
      localStorage.removeItem("lesovik_admin_user");
      setUser(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (login, password) => {
        const data = await gql<{ login: { token: string; user: AdminUser } }>(LOGIN, { login, password });
        if (data.login.user.role !== "ADMIN") {
          throw new Error("Доступ только для администратора");
        }
        localStorage.setItem("lesovik_admin_token", data.login.token);
        localStorage.setItem("lesovik_admin_user", JSON.stringify(data.login.user));
        setUser(data.login.user);
      },
      logout: () => {
        localStorage.removeItem("lesovik_admin_token");
        localStorage.removeItem("lesovik_admin_user");
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
