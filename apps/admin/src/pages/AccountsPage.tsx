import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface User { id: string; name: string; login: string | null; phone: string; role: string; orgName: string | null; createdAt: string }
const QUERY = `query { users { id name login phone role orgName createdAt } }`;

export function AccountsPage() {
  const [users, setUsers] = useState<User[] | null>(null);
  useEffect(() => { gql<{ users: User[] }>(QUERY).then((x) => setUsers(x.users)); }, []);
  if (!users) return <p>Загрузка…</p>;
  return <div><h2>Учётные записи</h2><p style={muted}>Пользователи и роли системы. Пароли не отображаются.</p><div style={{ display: "grid", gap: 8 }}>{users.map((user) => <article key={user.id} style={card}><strong>{user.name}</strong><span>{user.login || "без логина"} · {roleLabel[user.role] || user.role}</span><span>{user.orgName || user.phone}</span></article>)}</div></div>;
}

const roleLabel: Record<string, string> = { ADMIN: "Администратор", COLLECTOR: "Сборщик", PROCUREMENT: "Заготовитель" };
const card = { display: "grid", gap: 4, padding: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 };
const muted = { color: "#777", fontSize: 13 };
