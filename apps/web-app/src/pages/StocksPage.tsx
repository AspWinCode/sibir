import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "../api/client";

interface Stock {
  id: string;
  quantityKg: number;
  collectedAt: string;
  rawMaterial: { id: string; name: string };
}

const LIST = /* GraphQL */ `
  query {
    myStocks {
      id
      quantityKg
      collectedAt
      rawMaterial {
        id
        name
      }
    }
  }
`;

export function StocksPage() {
  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    gql<{ myStocks: Stock[] }>(LIST).then((d) => setStocks(d.myStocks));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Мои запасы</h1>
      {!stocks && <p>Загрузка…</p>}
      {stocks?.length === 0 && <p style={{ color: "#888" }}>Пока нет сохранённого сырья</p>}
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {stocks?.map((s) => (
          <div key={s.id} style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.rawMaterial.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{new Date(s.collectedAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <strong>{s.quantityKg} кг</strong>
              <button
                onClick={() => navigate(`/offers?materialId=${s.rawMaterial.id}`)}
                style={{ background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
              >
                Сдать
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
