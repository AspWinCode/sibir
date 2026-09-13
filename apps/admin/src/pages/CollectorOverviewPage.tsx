import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Collector {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface Deal {
  id: string;
  number: number;
  status: string;
  amount: number;
  quantityKg: number;
  rawMaterial: { name: string };
  procurementPoint: { name: string };
}

const USERS_QUERY = /* GraphQL */ `
  query {
    users(role: COLLECTOR) {
      id
      name
      phone
      createdAt
    }
  }
`;

const DEALS_QUERY = /* GraphQL */ `
  query Deals($collectorId: ID!) {
    deals(collectorId: $collectorId) {
      id
      number
      status
      amount
      quantityKg
      rawMaterial {
        name
      }
      procurementPoint {
        name
      }
    }
  }
`;

export function CollectorOverviewPage() {
  const [collectors, setCollectors] = useState<Collector[] | null>(null);
  const [selected, setSelected] = useState<Collector | null>(null);
  const [deals, setDeals] = useState<Deal[] | null>(null);

  useEffect(() => {
    gql<{ users: Collector[] }>(USERS_QUERY).then((d) => setCollectors(d.users));
  }, []);

  useEffect(() => {
    if (!selected) {
      setDeals(null);
      return;
    }
    gql<{ deals: Deal[] }>(DEALS_QUERY, { collectorId: selected.id }).then((d) => setDeals(d.deals));
  }, [selected]);

  if (!collectors) return <p>Загрузка…</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div>
        <h2>Сборщики</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr>
              <th style={thStyle}>Имя</th>
              <th style={thStyle}>Телефон</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {collectors.map((c) => (
              <tr key={c.id}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.phone}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => setSelected(c)}
                    style={{ background: "none", border: "none", color: "#3a5a3a", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Сделки
                  </button>
                </td>
              </tr>
            ))}
            {collectors.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "center" }}>
                  Нет зарегистрированных сборщиков
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div>
          <h2>Сделки: {selected.name}</h2>
          {deals?.map((d) => (
            <div key={d.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 10, marginBottom: 8, fontSize: 13 }}>
              #{d.number} {d.rawMaterial.name} · {d.quantityKg} кг · {d.amount} ₽ · {d.status} · пункт: {d.procurementPoint.name}
            </div>
          ))}
          {deals?.length === 0 && <p style={{ color: "#888", fontSize: 13 }}>Сделок пока нет</p>}
        </div>
      )}
    </div>
  );
}

const thStyle = {
  textAlign: "left" as const,
  borderBottom: "2px solid #ddd",
  padding: "8px 10px",
  fontSize: 13,
};

const tdStyle = {
  borderBottom: "1px solid #eee",
  padding: "8px 10px",
  fontSize: 13,
};
