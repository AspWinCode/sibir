import { useEffect, useState, type FormEvent } from "react";
import { gql } from "../api/client";

interface PurchasePlan {
  id: string;
  volumeKg: number;
  pricePerKg: number;
  rawMaterial: { id: string; name: string };
}

interface Point {
  id: string;
  name: string;
  address: string;
  phone: string;
  workingHours: string;
  type: "STATIONARY" | "MOBILE";
  region: { id: string; name: string };
  purchasePlans: PurchasePlan[];
}

interface Region {
  id: string;
  name: string;
}

interface RawMaterial {
  id: string;
  name: string;
}

const POINTS_QUERY = /* GraphQL */ `
  query {
    myProcurementPoints {
      id
      name
      address
      phone
      workingHours
      type
      region {
        id
        name
      }
      purchasePlans {
        id
        volumeKg
        pricePerKg
        rawMaterial {
          id
          name
        }
      }
    }
  }
`;

const OPTIONS_QUERY = /* GraphQL */ `
  query {
    regions {
      id
      name
    }
    rawMaterials {
      id
      name
    }
  }
`;

const CREATE_POINT = /* GraphQL */ `
  mutation Create($input: ProcurementPointInput!) {
    createProcurementPoint(input: $input) {
      id
    }
  }
`;

const CREATE_PLAN = /* GraphQL */ `
  mutation Create($input: PurchasePlanInput!) {
    createPurchasePlan(input: $input) {
      id
    }
  }
`;

const DELETE_PLAN = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deletePurchasePlan(id: $id)
  }
`;

export function PointsPage() {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    gql<{ myProcurementPoints: Point[] }>(POINTS_QUERY).then((d) => setPoints(d.myProcurementPoints));
  };

  useEffect(() => {
    refresh();
    gql<{ regions: Region[]; rawMaterials: RawMaterial[] }>(OPTIONS_QUERY).then((d) => {
      setRegions(d.regions);
      setMaterials(d.rawMaterials);
    });
  }, []);

  const handleCreatePoint = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      await gql(CREATE_POINT, {
        input: {
          name: form.get("name"),
          address: form.get("address"),
          phone: form.get("phone"),
          workingHours: form.get("workingHours"),
          type: form.get("type"),
          regionId: form.get("regionId"),
        },
      });
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  if (!points) return <p style={{ padding: 16 }}>Загрузка…</p>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20, color: "#2c3e2c", margin: 0 }}>Мои пункты приёма</h1>
        <button onClick={() => setShowForm((v) => !v)} style={smallButtonStyle}>
          {showForm ? "Отмена" : "+ Пункт"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreatePoint} style={{ display: "grid", gap: 8, background: "#fff", borderRadius: 10, padding: 12, marginTop: 10, border: "1px solid #e2e2e2" }}>
          <input name="name" placeholder="Название" required />
          <input name="address" placeholder="Адрес" required />
          <input name="phone" placeholder="Телефон" required />
          <input name="workingHours" placeholder="Часы работы" required />
          <select name="type" required>
            <option value="STATIONARY">Стационарный</option>
            <option value="MOBILE">Мобильный</option>
          </select>
          <select name="regionId" required>
            <option value="">Район</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {error && <p style={{ color: "crimson", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" style={primaryButtonStyle}>
            Создать пункт
          </button>
        </form>
      )}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {points.map((p) => (
          <PointCard key={p.id} point={p} materials={materials} onChanged={refresh} />
        ))}
        {points.length === 0 && <p style={{ color: "#888" }}>У вас пока нет пунктов приёма</p>}
      </div>
    </div>
  );
}

function PointCard({
  point,
  materials,
  onChanged,
}: {
  point: Point;
  materials: RawMaterial[];
  onChanged: () => void;
}) {
  const [showPlanForm, setShowPlanForm] = useState(false);

  const handleAddPlan = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await gql(CREATE_PLAN, {
      input: {
        procurementPointId: point.id,
        rawMaterialId: form.get("rawMaterialId"),
        volumeKg: Number(form.get("volumeKg")),
        pricePerKg: Number(form.get("pricePerKg")),
      },
    });
    setShowPlanForm(false);
    onChanged();
  };

  const handleDeletePlan = async (id: string) => {
    await gql(DELETE_PLAN, { id });
    onChanged();
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12 }}>
      <strong>{point.name}</strong> ({point.type === "STATIONARY" ? "стационарный" : "мобильный"})
      <div style={{ fontSize: 12, color: "#888" }}>
        {point.address}, {point.region.name} · {point.phone} · {point.workingHours}
      </div>

      <div style={{ marginTop: 8 }}>
        {point.purchasePlans.map((plan) => (
          <div key={plan.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span>{plan.rawMaterial.name}: {plan.volumeKg} кг по {plan.pricePerKg} ₽/кг</span>
            <button onClick={() => handleDeletePlan(plan.id)} style={{ border: "none", background: "none", color: "crimson", cursor: "pointer", fontSize: 12 }}>
              удалить
            </button>
          </div>
        ))}
      </div>

      {showPlanForm ? (
        <form onSubmit={handleAddPlan} style={{ display: "grid", gap: 6, marginTop: 8 }}>
          <select name="rawMaterialId" required>
            <option value="">Сырьё</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <input name="volumeKg" type="number" step="0.1" placeholder="Объём, кг" required />
          <input name="pricePerKg" type="number" step="0.1" placeholder="Цена, ₽/кг" required />
          <button type="submit" style={smallButtonStyle}>
            Добавить
          </button>
        </form>
      ) : (
        <button onClick={() => setShowPlanForm(true)} style={{ ...smallButtonStyle, marginTop: 8 }}>
          + План закупа
        </button>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 0",
  cursor: "pointer",
};

const smallButtonStyle = {
  background: "#eee",
  border: "none",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
};
