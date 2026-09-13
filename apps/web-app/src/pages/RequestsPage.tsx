import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Deal {
  id: string;
  number: number;
  quantityKg: number;
  pricePerKg: number;
  amount: number;
  createdAt: string;
  collector: { name: string; phone: string };
  rawMaterial: { name: string };
}

const QUERY = /* GraphQL */ `
  query {
    myDealsAsProcurement(status: PENDING) {
      id
      number
      quantityKg
      pricePerKg
      amount
      createdAt
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

const ACCEPT = /* GraphQL */ `
  mutation Accept($id: ID!) {
    acceptDeal(id: $id) {
      id
    }
  }
`;

const REJECT = /* GraphQL */ `
  mutation Reject($id: ID!) {
    rejectDeal(id: $id) {
      id
    }
  }
`;

export function RequestsPage() {
  const [deals, setDeals] = useState<Deal[] | null>(null);

  const refresh = () => {
    gql<{ myDealsAsProcurement: Deal[] }>(QUERY).then((d) => setDeals(d.myDealsAsProcurement));
  };

  useEffect(refresh, []);

  const accept = async (id: string) => {
    await gql(ACCEPT, { id });
    refresh();
  };

  const reject = async (id: string) => {
    await gql(REJECT, { id });
    refresh();
  };

  if (!deals) return <p style={{ padding: 16 }}>Загрузка…</p>;

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Новые заявки</h1>
      {deals.length === 0 && <p style={{ color: "#888" }}>Заявок пока нет</p>}
      <div style={{ display: "grid", gap: 10 }}>
        {deals.map((d) => (
          <div key={d.id} style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>
              {d.rawMaterial.name} · {d.quantityKg} кг
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>
              От {d.collector.name} ({d.collector.phone}) · {d.pricePerKg} ₽/кг · сумма {d.amount} ₽
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={() => accept(d.id)} style={{ flex: 1, background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer" }}>
                Принять
              </button>
              <button onClick={() => reject(d.id)} style={{ flex: 1, background: "#eee", border: "none", borderRadius: 8, padding: "8px 0", cursor: "pointer" }}>
                Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
