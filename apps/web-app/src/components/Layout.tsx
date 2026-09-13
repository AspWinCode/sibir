import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/materials", label: "Сырьё", icon: "🏠" },
  { to: "/map", label: "Карта", icon: "📍" },
  { to: "/stocks", label: "Запасы", icon: "🌿" },
  { to: "/offers", label: "Пункты", icon: "🏬" },
  { to: "/deals", label: "Сделки", icon: "🧾" },
  { to: "/profile", label: "Профиль", icon: "👤" },
];

export function Layout() {
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
        {NAV_ITEMS.map((item) => (
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
