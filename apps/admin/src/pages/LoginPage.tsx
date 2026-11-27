import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 10, padding: 28, width: 320, display: "grid", gap: 12 }}
      >
        <h1 style={{ fontSize: 18, margin: 0 }}>Вход администратора</h1>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
          Логин
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label style={{ display: "grid", gap: 4, fontSize: 13 }}>Пароль<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {error && <p style={{ color: "crimson", fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 14px", cursor: "pointer" }}
        >
          Войти
        </button>
      </form>
    </div>
  );
}
