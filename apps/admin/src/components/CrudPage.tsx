import { useEffect, useState, type CSSProperties, type FormEvent } from "react";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select";
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface CrudPageProps<T extends { id: string }> {
  title: string;
  fields: FieldConfig[];
  columns?: { key: string; label: string; render?: (item: T) => string }[];
  load: () => Promise<T[]>;
  create: (values: Record<string, string>) => Promise<void>;
  update: (id: string, values: Record<string, string>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function toFormValues<T extends { id: string }>(item: T | null, fields: FieldConfig[]) {
  const values: Record<string, string> = {};
  for (const f of fields) {
    const raw = item ? (item as unknown as Record<string, unknown>)[f.name] : "";
    values[f.name] = raw == null ? "" : String(raw);
  }
  return values;
}

export function CrudPage<T extends { id: string }>({
  title,
  fields,
  columns,
  load,
  create,
  update,
  remove,
}: CrudPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<T | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(toFormValues(null, fields));

  const refresh = () => {
    setLoading(true);
    load()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayColumns: NonNullable<CrudPageProps<T>["columns"]> =
    columns ?? fields.map((f) => ({ key: f.name, label: f.label }));

  const openCreate = () => {
    setEditing(null);
    setValues(toFormValues(null, fields));
    setShowForm(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setValues(toFormValues(item, fields));
    setShowForm(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editing) {
        await update(editing.id, values);
      } else {
        await create(values);
      }
      setShowForm(false);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить запись?")) return;
    try {
      await remove(id);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>{title}</h2>
        <button onClick={openCreate} style={buttonStyle}>
          + Добавить
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            margin: "12px 0",
            display: "grid",
            gap: 10,
            maxWidth: 480,
          }}
        >
          {fields.map((f) => (
            <label key={f.name} style={{ display: "grid", gap: 4, fontSize: 13 }}>
              {f.label}
              {f.type === "textarea" ? (
                <textarea
                  value={values[f.name] ?? ""}
                  required={f.required}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  rows={3}
                />
              ) : f.type === "select" ? (
                <select
                  value={values[f.name] ?? ""}
                  required={f.required}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                >
                  <option value="">—</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  value={values[f.name] ?? ""}
                  required={f.required}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                />
              )}
            </label>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={buttonStyle}>
              Сохранить
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={secondaryButtonStyle}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Загрузка…</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
          <thead>
            <tr>
              {displayColumns.map((c) => (
                <th key={c.key} style={thStyle}>
                  {c.label}
                </th>
              ))}
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {displayColumns.map((c) => (
                  <td key={c.key} style={tdStyle}>
                    {c.render
                      ? c.render(item)
                      : String((item as unknown as Record<string, unknown>)[c.key] ?? "")}
                  </td>
                ))}
                <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(item)} style={linkButtonStyle}>
                    Изменить
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={linkButtonStyle}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={displayColumns.length + 1} style={{ ...tdStyle, textAlign: "center" }}>
                  Нет записей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const buttonStyle: CSSProperties = {
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  background: "#eee",
  border: "none",
  borderRadius: 6,
  padding: "8px 14px",
  cursor: "pointer",
};

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#3a5a3a",
  cursor: "pointer",
  marginRight: 8,
  padding: 0,
  textDecoration: "underline",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  borderBottom: "2px solid #ddd",
  padding: "8px 10px",
  fontSize: 13,
};

const tdStyle: CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "8px 10px",
  fontSize: 13,
};
