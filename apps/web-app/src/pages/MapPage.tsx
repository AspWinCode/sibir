import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gql } from "../api/client";
import { useGeolocation } from "../hooks/useGeolocation";
import { haversineKm } from "../lib/geo";
import { loadGoogleMaps } from "../lib/googleMaps";
import { FieldPanel } from "../components/FieldPanel";

interface FieldItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hasRoute: boolean;
  region: { id: string; name: string; district: string | null };
  rawMaterial: { id: string; name: string };
}

interface Region {
  id: string;
  name: string;
  district: string | null;
}

const FIELDS_QUERY = /* GraphQL */ `
  query Fields($rawMaterialId: ID) {
    fields(rawMaterialId: $rawMaterialId) {
      id
      name
      latitude
      longitude
      hasRoute
      region {
        id
        name
        district
      }
      rawMaterial {
        id
        name
      }
    }
  }
`;

const REGIONS_QUERY = /* GraphQL */ `
  query {
    regions {
      id
      name
      district
    }
  }
`;

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export function MapPage() {
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get("materialId") ?? undefined;

  const [fields, setFields] = useState<FieldItem[] | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [query, setQuery] = useState("");
  const [selectedField, setSelectedField] = useState<FieldItem | null>(null);
  const { position } = useGeolocation();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    gql<{ fields: FieldItem[] }>(FIELDS_QUERY, { rawMaterialId: materialId }).then((d) =>
      setFields(d.fields),
    );
    gql<{ regions: Region[] }>(REGIONS_QUERY).then((d) => setRegions(d.regions));
  }, [materialId]);

  const filteredFields = useMemo(() => {
    if (!fields) return [];
    if (!query.trim()) return fields;
    const q = query.trim().toLowerCase();
    return fields.filter(
      (f) =>
        f.region.name.toLowerCase().includes(q) ||
        f.region.district?.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q),
    );
  }, [fields, query]);

  const fieldsWithDistance = useMemo(() => {
    return filteredFields
      .map((f) => ({
        ...f,
        distanceKm: position ? haversineKm(position.latitude, position.longitude, f.latitude, f.longitude) : null,
      }))
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  }, [filteredFields, position]);

  const [mapsReady, setMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState(false);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    loadGoogleMaps(GOOGLE_MAPS_API_KEY)
      .then(() => setMapsReady(true))
      .catch(() => setMapsError(true));
  }, []);

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: position ? { lat: position.latitude, lng: position.longitude } : { lat: 52.28, lng: 104.28 },
        zoom: 9,
      });
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = fieldsWithDistance.map((f) => {
      const marker = new google.maps.Marker({
        position: { lat: f.latitude, lng: f.longitude },
        map: mapInstance.current!,
        title: f.name,
      });
      marker.addListener("click", () => setSelectedField(f));
      return marker;
    });
  }, [mapsReady, fieldsWithDistance, position]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Карта полян</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по району или МО"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
        list="region-suggestions"
      />
      <datalist id="region-suggestions">
        {regions.map((r) => (
          <option key={r.id} value={r.name} />
        ))}
      </datalist>

      {GOOGLE_MAPS_API_KEY ? (
        mapsError ? (
          <p style={{ color: "crimson" }}>Не удалось загрузить карту</p>
        ) : (
          <div ref={mapRef} style={{ width: "100%", height: 320, borderRadius: 12, background: "#eee" }} />
        )
      ) : (
        <p style={{ fontSize: 12, color: "#888", background: "#fff8e1", padding: 8, borderRadius: 8 }}>
          Интерактивная карта отключена (не задан ключ Google Maps) — показан список полян
        </p>
      )}

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {fields === null && <p>Загрузка…</p>}
        {fieldsWithDistance.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedField(f)}
            style={{
              textAlign: "left",
              background: "#fff",
              border: "1px solid #e2e2e2",
              borderRadius: 10,
              padding: 12,
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 600 }}>{f.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>
              {f.region.name}
              {f.distanceKm != null ? ` · ${f.distanceKm.toFixed(1)} км` : ""}
              {f.hasRoute ? " · есть маршрут" : " · только координата"}
            </div>
          </button>
        ))}
        {fields && fieldsWithDistance.length === 0 && <p style={{ color: "#888" }}>Ничего не найдено</p>}
      </div>

      {selectedField && (
        <FieldPanel
          field={selectedField}
          rawMaterialId={materialId ?? selectedField.rawMaterial.id}
          userPosition={position}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  );
}
