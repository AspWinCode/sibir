import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const COLLECTOR_NAV = [
  { to: "/materials", label: "Сырьё", icon: "🏠" },
  { to: "/map", label: "Карта", icon: "📍" },
  { to: "/stocks", label: "Запасы", icon: "🌿" },
  { to: "/offers", label: "Пункты", icon: "🏬" },
  { to: "/deals", label: "Сделки", icon: "🧾" },
  { to: "/profile", label: "Профиль", icon: "👤" },
];

const PROCUREMENT_NAV = [
  { to: "/points", label: "Пункты", icon: "🏬" },
  { to: "/requests", label: "Заявки", icon: "🔔" },
  { to: "/accept", label: "Приёмка", icon: "📷" },
  { to: "/procurement-deals", label: "Сделки", icon: "🧾" },
  { to: "/profile", label: "Профиль", icon: "👤" },
];

export function Layout() {
  const { user } = useAuth();
  const navItems = user?.role === "PROCUREMENT" ? PROCUREMENT_NAV : COLLECTOR_NAV;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <main style={{ flex: 1, paddingBottom: 72 }}>
        <Outlet />
      </main>
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          background: "#fff",
          borderTop: "1px solid #ddd",
          padding: "6px 0",
        }}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              fontSize: 11,
              textDecoration: "none",
              color: isActive ? "#3a5a3a" : "#888",
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
