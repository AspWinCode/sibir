import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const collectorLinks = [
  ["/materials", "Сырьё", "Выберите вид дикоросов и посмотрите сезон."],
  ["/map", "Карта", "Найдите поляны и сохранённые маршруты."],
  ["/stocks", "Запасы", "Проверьте собранные партии перед сдачей."],
  ["/offers", "Пункты приёма", "Сравните предложения заготовителей."],
  ["/deals", "Сделки", "Следите за заявками, приёмкой и актами."],
];

const procurementLinks = [
  ["/points", "Пункты приёма", "Создайте пункт и добавьте план закупа."],
  ["/plans", "Планы закупа", "Управляйте сырьём, объёмом и ценой."],
  ["/requests", "Заявки", "Проверяйте входящие заявки сборщиков."],
  ["/accept", "Приёмка", "Завершайте сделку по QR-коду или вручную."],
  ["/procurement-deals", "Сделки", "Скачивайте закупочные акты."],
];

export function OverviewPage() {
  const { user } = useAuth();
  const isProcurement = user?.role === "PROCUREMENT";
  const links = isProcurement ? procurementLinks : collectorLinks;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: "0 0 4px", color: "#2c3e2c", fontSize: 22 }}>Обзор</h1>
      <p style={{ margin: "0 0 18px", color: "#666", fontSize: 14 }}>
        {user?.name}, рабочее пространство Лесовика
      </p>
      <div style={{ display: "grid", gap: 12 }}>
        {links.map(([to, title, description]) => (
          <Link key={to} to={to} style={cardStyle}>
            <strong>{title}</strong>
            <span>{description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

const cardStyle = {
  display: "grid",
  gap: 5,
  padding: 14,
  border: "1px solid #e2e2e2",
  borderRadius: 12,
  background: "#fff",
  color: "#263526",
  textDecoration: "none",
};
