import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { gql } from "../api/client";

interface Deal {
  id: string;
  number: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
  amount: number;
  quantityKg: number;
  pricePerKg: number;
  qrToken: string;
  createdAt: string;
  rawMaterial: { name: string };
  procurementPoint: { name: string; address: string };
}

const TABS: { value: Deal["status"]; label: string }[] = [
  { value: "PENDING", label: "В процессе" },
  { value: "COMPLETED", label: "Завершённые" },
  { value: "REJECTED", label: "Отклонённые" },
];

const QUERY = /* GraphQL */ `
  query Deals($status: DealStatus) {
    myDealsAsCollector(status: $status) {
      id
      number
      status
      amount
      quantityKg
      pricePerKg
      qrToken
      createdAt
      rawMaterial {
        name
      }
      procurementPoint {
        name
        address
      }
    }
  }
`;

export function DealsPage() {
  const [tab, setTab] = useState<Deal["status"]>("PENDING");
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [qrByDeal, setQrByDeal] = useState<Record<string, string>>({});

  useEffect(() => {
    setDeals(null);
    gql<{ myDealsAsCollector: Deal[] }>(QUERY, { status: tab }).then((d) => setDeals(d.myDealsAsCollector));
  }, [tab]);

  const toggleExpand = async (deal: Deal) => {
    if (expanded === deal.id) {
      setExpanded(null);
      return;
    }
    setExpanded(deal.id);
    if (!qrByDeal[deal.id]) {
      const dataUrl = await QRCode.toDataURL(deal.qrToken, { width: 180, margin: 1 });
      setQrByDeal((prev) => ({ ...prev, [deal.id]: dataUrl }));
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Мои сделки</h1>

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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>#{d.number}</strong> {d.rawMaterial.name} · {d.quantityKg} кг
                <div style={{ fontSize: 12, color: "#888" }}>{d.procurementPoint.name}, {d.procurementPoint.address}</div>
              </div>
              <button onClick={() => toggleExpand(d)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18 }}>
                {expanded === d.id ? "▲" : "▼"}
              </button>
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Ориентировочное вознаграждение: <strong>{d.amount} ₽</strong>
            </div>
            {expanded === d.id && (
              <div style={{ marginTop: 10, textAlign: "center" }}>
                {qrByDeal[d.id] ? (
                  <img src={qrByDeal[d.id]} alt="QR-код сделки" style={{ width: 160, height: 160 }} />
                ) : (
                  <p>Генерация QR…</p>
                )}
                <p style={{ fontSize: 12, color: "#888" }}>Покажите этот код на пункте приёма</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
