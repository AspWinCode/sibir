import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { gql } from "../api/client";

interface RawMaterial {
  id: string;
  name: string;
  photoUrl: string | null;
  composition: string | null;
  benefits: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  harvestGuide: string | null;
  gostReference: string | null;
}

const QUERY = /* GraphQL */ `
  query Material($id: ID!) {
    rawMaterial(id: $id) {
      id
      name
      photoUrl
      composition
      benefits
      seasonStart
      seasonEnd
      harvestGuide
      gostReference
    }
  }
`;

export function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [material, setMaterial] = useState<RawMaterial | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    gql<{ rawMaterial: RawMaterial }>(QUERY, { id }).then((d) => setMaterial(d.rawMaterial));
  }, [id]);

  if (!material) return <p style={{ padding: 16 }}>Загрузка…</p>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        ← Назад
      </button>
      <h1 style={{ fontSize: 22, color: "#2c3e2c", marginBottom: 4 }}>{material.name}</h1>
      {material.seasonStart && (
        <p style={{ color: "#888", fontSize: 13 }}>
          Сезон сбора: {material.seasonStart} – {material.seasonEnd}
        </p>
      )}

      {material.composition && (
        <Section title="Состав">{material.composition}</Section>
      )}
      {material.benefits && <Section title="Полезные свойства">{material.benefits}</Section>}
      {material.harvestGuide && <Section title="Как заготавливать">{material.harvestGuide}</Section>}
      {material.gostReference && <Section title="ГОСТ">{material.gostReference}</Section>}

      <button
        onClick={() => navigate(`/map?materialId=${material.id}`)}
        style={{ ...backButtonStyle, background: "#3a5a3a", color: "#fff", width: "100%", marginTop: 20, padding: "12px 0", border: "none", textAlign: "center" }}
      >
        Найти поляны на карте →
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 14, margin: "0 0 4px", color: "#3a5a3a" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "#333", lineHeight: 1.4 }}>{children}</p>
    </div>
  );
}

const backButtonStyle = {
  background: "none",
  border: "none",
  color: "#3a5a3a",
  cursor: "pointer",
  fontSize: 14,
  padding: 0,
  marginBottom: 8,
};
