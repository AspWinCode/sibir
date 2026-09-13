import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

type Role = "COLLECTOR" | "PROCUREMENT";

export function AuthPage() {
  const { registerCollector, registerProcurement, requestCode, verifyCode } = useAuth();
  const [role, setRole] = useState<Role>("COLLECTOR");
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [inn, setInn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (role === "COLLECTOR") {
        await registerCollector(phone, name);
      } else {
        await registerProcurement({ phone, name, orgName, inn, email });
      }
      await requestCode(phone);
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyCode(phone, code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <form
        onSubmit={step === "form" ? handleSubmitForm : handleVerify}
        style={{ width: "100%", maxWidth: 360, display: "grid", gap: 14 }}
      >
        <h1 style={{ fontSize: 22, margin: "0 0 4px", color: "#2c3e2c" }}>🌲 Сибирь</h1>
        <p style={{ margin: 0, color: "#666", fontSize: 14 }}>Сбор и сдача дикоросов</p>

        {step === "form" && (
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" onClick={() => setRole("COLLECTOR")} style={roleTabStyle(role === "COLLECTOR")}>
              Я сборщик
            </button>
            <button type="button" onClick={() => setRole("PROCUREMENT")} style={roleTabStyle(role === "PROCUREMENT")}>
              Я заготовитель
            </button>
          </div>
        )}

        {step === "form" ? (
          <>
            <label style={fieldStyle}>
              {role === "COLLECTOR" ? "Ваше имя" : "Имя контактного лица"}
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            {role === "PROCUREMENT" && (
              <>
                <label style={fieldStyle}>
                  Название организации / ИП
                  <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
                </label>
                <label style={fieldStyle}>
                  ИНН
                  <input value={inn} onChange={(e) => setInn(e.target.value)} required />
                </label>
                <label style={fieldStyle}>
                  Email
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
              </>
            )}
            <label style={fieldStyle}>
              Номер телефона
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </>
        ) : (
          <label style={fieldStyle}>
            Код из SMS
            <input value={code} onChange={(e) => setCode(e.target.value)} autoFocus required />
          </label>
        )}

        {error && <p style={{ color: "crimson", fontSize: 13, margin: 0 }}>{error}</p>}

        <button type="submit" disabled={loading} style={buttonStyle}>
          {step === "form" ? "Получить код" : "Войти"}
        </button>
      </form>
    </div>
  );
}

function roleTabStyle(active: boolean) {
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

const fieldStyle = { display: "grid", gap: 4, fontSize: 14 } as const;
const buttonStyle = {
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 16,
  cursor: "pointer",
};
