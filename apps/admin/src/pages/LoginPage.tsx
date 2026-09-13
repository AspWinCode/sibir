import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { requestCode, verifyCode } = useAuth();
  const [phone, setPhone] = useState("+70000000000");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
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
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <form
        onSubmit={step === "phone" ? handleRequestCode : handleVerify}
        style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 28, width: 320, display: "grid", gap: 12 }}
      >
        <h1 style={{ fontSize: 18, margin: 0 }}>Вход администратора</h1>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Телефон
          <input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={step === "code"} required />
        </label>
        {step === "code" && (
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Код из SMS
            <input value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
          </label>
        )}
        {error && <p style={{ color: "crimson", fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 14px", cursor: "pointer" }}
        >
          {step === "phone" ? "Получить код" : "Войти"}
        </button>
      </form>
    </div>
  );
}
