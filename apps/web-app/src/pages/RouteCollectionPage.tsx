import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { gql } from "../api/client";
import { useGeolocation } from "../hooks/useGeolocation";

const ADD_STOCK = /* GraphQL */ `
  mutation AddStock($input: StockInput!) {
    addStock(input: $input) {
      id
    }
  }
`;

export function RouteCollectionPage() {
  const [searchParams] = useSearchParams();
  const materialId = searchParams.get("materialId");
  const navigate = useNavigate();
  const { position } = useGeolocation();

  const [started, setStarted] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleStart = () => {
    setStarted(true);
    setStartedAt(new Date());
  };

  const handleFinish = async (e: FormEvent) => {
    e.preventDefault();
    if (!materialId) return;
    setError(null);
    setSaving(true);
    try {
      await gql(ADD_STOCK, {
        input: {
          rawMaterialId: materialId,
          quantityKg: Number(quantity),
          fieldLatitude: position?.latitude,
          fieldLongitude: position?.longitude,
        },
      });
      navigate(`/offers?materialId=${materialId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  if (!materialId) {
    return <p style={{ padding: 16 }}>Сначала выберите сырьё в справочнике.</p>;
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Сбор</h1>

      {!started ? (
        <>
          <p style={{ color: "#666", fontSize: 14 }}>
            Нажмите «Начать», когда отправитесь на сбор. По завершении сохраните собранный объём в «Мои запасы».
          </p>
          <button onClick={handleStart} style={primaryButtonStyle}>
            Начать сбор
          </button>
        </>
      ) : (
        <form onSubmit={handleFinish} style={{ display: "grid", gap: 12 }}>
          <p style={{ color: "#666", fontSize: 14 }}>
            В пути с {startedAt?.toLocaleTimeString()}. Когда закончите — укажите собранный объём.
          </p>
          <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
            Собрано, кг
            <input
              type="number"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </label>
          {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}
          <button type="submit" disabled={saving} style={primaryButtonStyle}>
            Завершить сбор и сохранить
          </button>
        </form>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 0",
  fontSize: 16,
  cursor: "pointer",
};
