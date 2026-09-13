import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function AuthPage() {
  const { register, requestCode, verifyCode } = useAuth();
  const [step, setStep] = useState<"form" | "code">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(phone, name);
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

        {step === "form" ? (
          <>
            <label style={fieldStyle}>
              Ваше имя
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
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
