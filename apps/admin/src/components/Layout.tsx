import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/raw-materials", label: "Справочник сырья" },
  { to: "/regions", label: "Районы" },
  { to: "/fields", label: "Поляны" },
  { to: "/routes", label: "Маршруты" },
  { to: "/procurement", label: "Заготовители" },
  { to: "/collectors", label: "Сборщики" },
  { to: "/fire-safety", label: "Тест по пожарной безопасности" },
  { to: "/videos", label: "Видео-контент" },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <aside style={{ width: 240, background: "#1f2a1f", color: "#fff", padding: 16 }}>
        <h1 style={{ fontSize: 18, marginBottom: 24 }}>Сибирь · Админ</h1>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                color: "#fff",
                textDecoration: "none",
                padding: "8px 10px",
                borderRadius: 6,
                background: isActive ? "#3a5a3a" : "transparent",
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 32, fontSize: 13, opacity: 0.8 }}>
          <div>{user?.name}</div>
          <button
            onClick={logout}
            style={{
              marginTop: 8,
              background: "none",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              borderRadius: 4,
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Выйти
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24, background: "#f6f7f4" }}>
        <Outlet />
      </main>
    </div>
  );
}
