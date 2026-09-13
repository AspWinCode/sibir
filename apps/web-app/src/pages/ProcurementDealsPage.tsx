import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Deal {
  id: string;
  number: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  amount: number;
  quantityKg: number;
  collector: { name: string; phone: string };
  rawMaterial: { name: string };
}

const TABS: { value: Deal["status"]; label: string }[] = [
  { value: "ACCEPTED", label: "В процессе" },
  { value: "COMPLETED", label: "Завершённые" },
  { value: "REJECTED", label: "Отклонённые" },
];

const QUERY = /* GraphQL */ `
  query Deals($status: DealStatus) {
    myDealsAsProcurement(status: $status) {
      id
      number
      status
      amount
      quantityKg
      collector {
        name
        phone
      }
      rawMaterial {
        name
      }
    }
  }
`;

export function ProcurementDealsPage() {
  const [tab, setTab] = useState<Deal["status"]>("ACCEPTED");
  const [deals, setDeals] = useState<Deal[] | null>(null);

  useEffect(() => {
    setDeals(null);
    gql<{ myDealsAsProcurement: Deal[] }>(QUERY, { status: tab }).then((d) => setDeals(d.myDealsAsProcurement));
  }, [tab]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Сделки</h1>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            style={{
              flex: 1,
              padding: "8px 0",
              fontSize: 12,
              borderRadius: 8,
              border: tab === t.value ? "1px solid #3a5a3a" : "1px solid #ccc",
              background: tab === t.value ? "#3a5a3a" : "#fff",
              color: tab === t.value ? "#fff" : "#333",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!deals && <p>Загрузка…</p>}
      {deals?.length === 0 && <p style={{ color: "#888" }}>Сделок нет</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {deals?.map((d) => (
          <div key={d.id} style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12 }}>
            <strong>#{d.number}</strong> {d.rawMaterial.name} · {d.quantityKg} кг · {d.amount} ₽
            <div style={{ fontSize: 12, color: "#888" }}>
              {d.collector.name} ({d.collector.phone})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
