import { useAuth } from "../auth/AuthContext";

export function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Профиль</h1>
      <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 14, marginTop: 12 }}>
        <div style={{ fontWeight: 600 }}>{user?.name}</div>
        <div style={{ color: "#888", fontSize: 13 }}>{user?.phone}</div>
      </div>
      <button
        onClick={logout}
        style={{ marginTop: 16, width: "100%", background: "#eee", border: "none", borderRadius: 10, padding: "12px 0", cursor: "pointer" }}
      >
        Выйти
      </button>
    </div>
  );
}
