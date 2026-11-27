import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Point { id: string; name: string; address: string; purchasePlans: { id: string; volumeKg: number; pricePerKg: number; rawMaterial: { name: string } }[] }
const QUERY = `query { myProcurementPoints { id name address purchasePlans { id volumeKg pricePerKg rawMaterial { name } } } }`;

export function PlansPage() {
  const [points, setPoints] = useState<Point[] | null>(null);
  useEffect(() => { gql<{ myProcurementPoints: Point[] }>(QUERY).then((x) => setPoints(x.myProcurementPoints)); }, []);
  if (!points) return <p style={{ padding: 16 }}>Загрузка…</p>;
  const plans = points.flatMap((point) => point.purchasePlans.map((plan) => ({ ...plan, point })));
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: "0 0 4px", color: "#2c3e2c", fontSize: 20 }}>Планы закупа</h1>
      <p style={{ color: "#666", fontSize: 13 }}>Активные объёмы и цены по вашим пунктам приёма.</p>
      <div style={{ display: "grid", gap: 10 }}>
        {plans.map((plan) => <article key={plan.id} style={cardStyle}><strong>{plan.rawMaterial.name}</strong><span>{plan.point.name} · {plan.point.address}</span><span>{plan.volumeKg} кг по {plan.pricePerKg} ₽/кг</span></article>)}
        {plans.length === 0 && <p style={{ color: "#888" }}>Планов пока нет. Добавьте план на странице «Пункты».</p>}
      </div>
    </div>
  );
}

const cardStyle = { display: "grid", gap: 4, padding: 12, background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, fontSize: 13 };
