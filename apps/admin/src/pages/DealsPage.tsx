import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Deal { id: string; number: number; status: string; amount: number; quantityKg: number; createdAt: string; collector: { name: string }; procurementPoint: { name: string }; rawMaterial: { name: string } }
const QUERY = `query { deals { id number status amount quantityKg createdAt collector { name } procurementPoint { name } rawMaterial { name } } }`;

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { gql<{ deals: Deal[] }>(QUERY).then((x) => setDeals(x.deals)).catch((e) => setError(e.message)); }, []);
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!deals) return <p>Загрузка…</p>;
  return <div><h2>Сделки</h2><p style={muted}>Все заявки и завершённые закупки в системе.</p><div style={{ display: "grid", gap: 8 }}>{deals.map((deal) => <article key={deal.id} style={card}><strong>№{deal.number} · {deal.rawMaterial.name}</strong><span>{deal.collector.name} → {deal.procurementPoint.name}</span><span>{deal.quantityKg} кг · {deal.amount} ₽ · {deal.status}</span></article>)}{deals.length === 0 && <p style={muted}>Сделок пока нет.</p>}</div></div>;
}

const card = { display: "grid", gap: 4, padding: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 8, fontSize: 13 };
const muted = { color: "#777", fontSize: 13 };
