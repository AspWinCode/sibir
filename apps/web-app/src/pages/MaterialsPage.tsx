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
    <div className="page-shell">
      <div className="section-heading" style={{ marginTop: 0 }}><h1 style={{ fontSize: 22, margin: 0 }}>Витрина сырья</h1><span>{materials?.length || 0} вида</span></div>
      <p style={{ color: "#708076", fontSize: 13, marginTop: -4 }}>Выберите дикорос, чтобы посмотреть сезон, поляны и маршрут сбора.</p>
      {!materials && <p>Загрузка…</p>}
      <div className="showcase-grid">
        {materials?.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/materials/${m.id}`)}
            className="showcase-card"
          >
            <div className="showcase-image">{m.photoUrl ? <img src={m.photoUrl} alt="" /> : "🌿"}</div>
            <div className="showcase-body"><strong>{m.name}</strong>{m.seasonStart && <span>Сезон: {m.seasonStart} – {m.seasonEnd}</span>}<span>Открыть карточку →</span></div>
          </button>
        ))}
      </div>
    </div>
  );
}
