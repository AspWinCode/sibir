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

  return <div className="page-shell">
    <section className="hero-card">
      <div className="eyebrow">Лесовик · рабочее пространство</div>
      <h1>Добро пожаловать, {user?.name?.split(" ")[0] || "друг"}</h1>
      <p>{isProcurement ? "Принимайте дикоросы, управляйте планами закупа и закрывайте сделки." : "Собирайте осознанно, сдавайте прозрачно и контролируйте каждую сделку."}</p>
      <div className="hero-chips"><span className="hero-chip">● Онлайн</span><span className="hero-chip">{isProcurement ? "Кабинет заготовителя" : "Кабинет сборщика"}</span></div>
    </section>
    <div className="section-heading"><h2>Быстрый доступ</h2><span>Все разделы рядом</span></div>
    <div className="shortcut-grid">
      {links.map(([to, title, description], index) => <Link key={to} to={to} className="shortcut-card"><span className="shortcut-icon">{["⌂", "♧", "⌖", "▤", "≋"][index % 5]}</span><strong>{title}</strong><span>{description}</span></Link>)}
    </div>
  </div>;
}
