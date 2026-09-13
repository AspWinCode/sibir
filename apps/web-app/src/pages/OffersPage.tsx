import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gql } from "../api/client";
import { useGeolocation } from "../hooks/useGeolocation";
import { haversineKm } from "../lib/geo";

interface RawMaterial {
  id: string;
  name: string;
}

interface Offer {
  purchasePlan: { id: string; pricePerKg: number; volumeKg: number };
  procurementPoint: {
    id: string;
    name: string;
    address: string;
    workingHours: string;
    latitude: number | null;
    longitude: number | null;
    region: { id: string; name: string };
  };
}

const MATERIALS_QUERY = /* GraphQL */ `
  query {
    rawMaterials {
      id
      name
    }
  }
`;

const OFFERS_QUERY = /* GraphQL */ `
  query Offers($rawMaterialId: ID!) {
    offersForMaterial(rawMaterialId: $rawMaterialId) {
      purchasePlan {
        id
        pricePerKg
        volumeKg
      }
      procurementPoint {
        id
        name
        address
        workingHours
        latitude
        longitude
        region {
          id
          name
        }
      }
    }
  }
`;

const CREATE_DEAL = /* GraphQL */ `
  mutation CreateDeal($input: CreateDealInput!) {
    createDeal(input: $input) {
      id
      qrToken
    }
  }
`;

export function OffersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const materialId = searchParams.get("materialId") ?? "";
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [sortBy, setSortBy] = useState<"distance" | "price">("distance");
  const [dealTarget, setDealTarget] = useState<Offer | null>(null);
  const { position } = useGeolocation();

  useEffect(() => {
    gql<{ rawMaterials: RawMaterial[] }>(MATERIALS_QUERY).then((d) => setMaterials(d.rawMaterials));
  }, []);

  useEffect(() => {
    if (!materialId) {
      setOffers(null);
      return;
    }
    gql<{ offersForMaterial: Offer[] }>(OFFERS_QUERY, { rawMaterialId: materialId }).then((d) =>
      setOffers(d.offersForMaterial),
    );
  }, [materialId]);

  const sortedOffers = useMemo(() => {
    if (!offers) return [];
    const withDistance = offers.map((o) => ({
      ...o,
      distanceKm:
        position && o.procurementPoint.latitude != null && o.procurementPoint.longitude != null
          ? haversineKm(position.latitude, position.longitude, o.procurementPoint.latitude, o.procurementPoint.longitude)
          : null,
    }));
    return withDistance.sort((a, b) =>
      sortBy === "price"
        ? b.purchasePlan.pricePerKg - a.purchasePlan.pricePerKg
        : (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
    );
  }, [offers, sortBy, position]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Пункты приёма</h1>

      <select
        value={materialId}
        onChange={(e) => setSearchParams({ materialId: e.target.value })}
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", marginBottom: 10 }}
      >
        <option value="">Выберите сырьё</option>
        {materials.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      {materialId && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setSortBy("distance")} style={sortButtonStyle(sortBy === "distance")}>
            По расстоянию
          </button>
          <button onClick={() => setSortBy("price")} style={sortButtonStyle(sortBy === "price")}>
            По цене
          </button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {sortedOffers.map((o) => (
          <div key={o.purchasePlan.id} style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{o.procurementPoint.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {o.procurementPoint.address} · {o.procurementPoint.region.name}
              {o.distanceKm != null ? ` · ${o.distanceKm.toFixed(1)} км` : ""}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Часы работы: {o.procurementPoint.workingHours}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <strong>{o.purchasePlan.pricePerKg} ₽/кг</strong>
              <button onClick={() => setDealTarget(o)} style={{ background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer" }}>
                Сдать сюда
              </button>
            </div>
          </div>
        ))}
        {materialId && offers && sortedOffers.length === 0 && <p style={{ color: "#888" }}>Предложений пока нет</p>}
      </div>

      {dealTarget && (
        <CreateDealModal
          offer={dealTarget}
          rawMaterialId={materialId}
          onClose={() => setDealTarget(null)}
        />
      )}
    </div>
  );
}

function sortButtonStyle(active: boolean) {
  return {
    flex: 1,
    padding: "8px 0",
    borderRadius: 8,
    border: active ? "1px solid #3a5a3a" : "1px solid #ccc",
    background: active ? "#3a5a3a" : "#fff",
    color: active ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: 13,
  } as const;
}

function CreateDealModal({
  offer,
  rawMaterialId,
  onClose,
}: {
  offer: Offer;
  rawMaterialId: string;
  onClose: () => void;
}) {
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError(null);
    try {
      await gql(CREATE_DEAL, {
        input: {
          procurementPointId: offer.procurementPoint.id,
          rawMaterialId,
          quantityKg: Number(quantity),
          pricePerKg: offer.purchasePlan.pricePerKg,
        },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: 18, width: "100%", maxWidth: 340 }}>
        {done ? (
          <>
            <p>Заявка отправлена пункту приёма «{offer.procurementPoint.name}». Ожидайте подтверждения.</p>
            <button onClick={onClose} style={{ width: "100%", background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", cursor: "pointer" }}>
              Ок
            </button>
          </>
        ) : (
          <>
            <h3 style={{ marginTop: 0 }}>Сдать в «{offer.procurementPoint.name}»</h3>
            <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
              Объём, кг
              <input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
            </label>
            {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={submit} style={{ flex: 1, background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", cursor: "pointer" }}>
                Отправить заявку
              </button>
              <button onClick={onClose} style={{ flex: 1, background: "#eee", border: "none", borderRadius: 8, padding: "10px 0", cursor: "pointer" }}>
                Отмена
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
