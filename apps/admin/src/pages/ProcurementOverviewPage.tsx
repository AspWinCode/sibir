import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface ProcurementPoint {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  type: string;
  owner: { name: string; orgName: string | null; inn: string | null };
  region: { name: string };
  purchasePlans: { rawMaterial: { name: string }; volumeKg: number; pricePerKg: number }[];
}

interface Deal {
  id: string;
  number: number;
  status: string;
  amount: number;
  createdAt: string;
  collector: { name: string; phone: string };
  rawMaterial: { name: string };
}

const QUERY = /* GraphQL */ `
  query {
    procurementPoints {
      id
      name
      address
      phone
      workingHours
      type
      owner {
        name
        orgName
        inn
      }
      region {
        name
      }
      purchasePlans {
        rawMaterial {
          name
        }
        volumeKg
        pricePerKg
      }
    }
  }
`;

export function ProcurementOverviewPage() {
  const [points, setPoints] = useState<ProcurementPoint[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    gql<{ procurementPoints: ProcurementPoint[] }>(QUERY).then((d) => setPoints(d.procurementPoints));
  }, []);

  if (!points) return <p>Загрузка…</p>;

  return (
    <div>
      <h2>Заготовители и пункты приёма</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {points.map((p) => (
          <div key={p.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 14 }}>
            <strong>{p.name}</strong> ({p.type === "STATIONARY" ? "стационарный" : "мобильный"})
            <div style={{ fontSize: 13, color: "#555" }}>
              Владелец: {p.owner.name} {p.owner.orgName ? `(${p.owner.orgName}, ИНН ${p.owner.inn})` : ""}
            </div>
            <div style={{ fontSize: 13, color: "#555" }}>
              Адрес: {p.address}, {p.region.name} · Тел: {p.phone} · Часы: {p.workingHours}
            </div>
            {p.purchasePlans.length > 0 && (
              <table style={{ marginTop: 8, fontSize: 13 }}>
                <tbody>
                  {p.purchasePlans.map((plan, i) => (
                    <tr key={i}>
                      <td style={{ paddingRight: 12 }}>{plan.rawMaterial.name}</td>
                      <td style={{ paddingRight: 12 }}>{plan.volumeKg} кг</td>
                      <td>{plan.pricePerKg} ₽/кг</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              onClick={() => setSelected(p.id)}
              style={{ marginTop: 8, background: "none", border: "none", color: "#3a5a3a", cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 13 }}
            >
              Сделки этого пункта →
            </button>
          </div>
        ))}
      </div>

      {selected && <PointDeals pointId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

const DEALS_QUERY = /* GraphQL */ `
  query Deals($procurementPointId: ID!) {
    deals(procurementPointId: $procurementPointId) {
      id
      number
      status
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

function PointDeals({ pointId, onClose }: { pointId: string; onClose: () => void }) {
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gql<{ deals: Deal[] }>(DEALS_QUERY, { procurementPointId: pointId })
      .then((d) => setDeals(d.deals))
      .catch((e) => setError(e.message));
  }, [pointId]);

  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Сделки</strong>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>
          ✕
        </button>
      </div>
      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
      {deals?.map((d) => (
        <div key={d.id} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #eee" }}>
          #{d.number} {d.rawMaterial.name} — {d.amount} ₽ — {d.status} — {d.collector.name}
        </div>
      ))}
      {deals?.length === 0 && !error && <p style={{ fontSize: 13, color: "#888" }}>Сделок пока нет</p>}
    </div>
  );
}
