import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "../api/client";
import { haversineKm } from "../lib/geo";

interface Props {
  field: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    hasRoute: boolean;
    region: { id: string; name: string; district: string | null };
  };
  rawMaterialId: string;
  userPosition: { latitude: number; longitude: number } | null;
  onClose: () => void;
}

interface FieldDetail {
  routes: { distanceKm: number | null; durationMin: number | null }[];
  nearbyProcurementPointsCount: number;
}

interface Offer {
  purchasePlan: { pricePerKg: number };
}

const DETAIL_QUERY = /* GraphQL */ `
  query FieldDetail($id: ID!) {
    field(id: $id) {
      routes {
        distanceKm
        durationMin
      }
      nearbyProcurementPointsCount
    }
  }
`;

const OFFERS_QUERY = /* GraphQL */ `
  query Offers($rawMaterialId: ID!, $regionId: ID) {
    offersForMaterial(rawMaterialId: $rawMaterialId, regionId: $regionId) {
      purchasePlan {
        pricePerKg
      }
    }
  }
`;

export function FieldPanel({ field, rawMaterialId, userPosition, onClose }: Props) {
  const [detail, setDetail] = useState<FieldDetail | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    gql<{ field: FieldDetail }>(DETAIL_QUERY, { id: field.id }).then((d) => setDetail(d.field));
    gql<{ offersForMaterial: Offer[] }>(OFFERS_QUERY, { rawMaterialId, regionId: field.region.id }).then((d) =>
      setOffers(d.offersForMaterial),
    );
  }, [field.id, field.region.id, rawMaterialId]);

  const distanceKm = userPosition
    ? haversineKm(userPosition.latitude, userPosition.longitude, field.latitude, field.longitude)
    : null;

  const route = detail?.routes[0];
  const prices = offers?.map((o) => o.purchasePlan.pricePerKg) ?? [];
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong style={{ fontSize: 16 }}>{field.name}</strong>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer" }}>
            ✕
          </button>
        </div>
        <p style={{ margin: "4px 0", fontSize: 13, color: "#666" }}>
          {field.region.name}
          {field.region.district ? `, ${field.region.district}` : ""}
        </p>

        {distanceKm != null && (
          <p style={{ fontSize: 14 }}>Расстояние до начала маршрута: <strong>{distanceKm.toFixed(1)} км</strong></p>
        )}

        {field.hasRoute ? (
          route?.durationMin ? (
            <p style={{ fontSize: 14 }}>
              Маршрут: {route.distanceKm ? `${route.distanceKm} км, ` : ""}
              продолжительность ~{route.durationMin} мин
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#888" }}>Загрузка маршрута…</p>
          )
        ) : (
          <p style={{ fontSize: 14, color: "#888" }}>Трека маршрута нет, есть только координата поляны</p>
        )}

        <p style={{ fontSize: 14 }}>
          Пунктов приёма в районе: <strong>{detail ? detail.nearbyProcurementPointsCount : "…"}</strong>
          {minPrice != null && (
            <>
              {" "}· цена от <strong>{minPrice}</strong> до <strong>{maxPrice}</strong> ₽/кг
            </>
          )}
        </p>

        <button
          onClick={() => navigate(`/route?fieldId=${field.id}&materialId=${rawMaterialId}`)}
          style={{ width: "100%", background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", marginTop: 10, cursor: "pointer" }}
        >
          Начать сбор здесь
        </button>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "flex-end",
  zIndex: 20,
};

const sheetStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "16px 16px 0 0",
  padding: 18,
  width: "100%",
  maxHeight: "70vh",
  overflowY: "auto",
};
