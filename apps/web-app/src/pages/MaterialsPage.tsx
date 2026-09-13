import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "../api/client";

interface RawMaterial {
  id: string;
  name: string;
  photoUrl: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
}

const LIST = /* GraphQL */ `
  query {
    rawMaterials {
      id
      name
      photoUrl
      seasonStart
      seasonEnd
    }
  }
`;

export function MaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    gql<{ rawMaterials: RawMaterial[] }>(LIST).then((d) => setMaterials(d.rawMaterials));
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Справочник сырья</h1>
      <p style={{ color: "#666", fontSize: 13, marginTop: -8 }}>Выберите сырьё, чтобы посмотреть поляны на карте</p>
      {!materials && <p>Загрузка…</p>}
      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {materials?.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/materials/${m.id}`)}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              textAlign: "left",
              background: "#fff",
              border: "1px solid #e2e2e2",
              borderRadius: 12,
              padding: 12,
              cursor: "pointer",
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 10, background: "#eef3ea", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              🍇
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              {m.seasonStart && (
                <div style={{ fontSize: 12, color: "#888" }}>
                  Сезон: {m.seasonStart} – {m.seasonEnd}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
