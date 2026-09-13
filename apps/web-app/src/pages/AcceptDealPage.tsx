import { useEffect, useRef, useState } from "react";
import { gql } from "../api/client";

interface Deal {
  id: string;
  number: number;
  status: string;
  quantityKg: number;
  pricePerKg: number;
  amount: number;
  qrToken: string;
  collector: { name: string; phone: string };
  rawMaterial: { name: string };
}

const LOOKUP = /* GraphQL */ `
  query Lookup($qrToken: String!) {
    dealByQrToken(qrToken: $qrToken) {
      id
      number
      status
      quantityKg
      pricePerKg
      amount
      qrToken
      collector {
        name
        phone
      }
      rawMaterial {
        name
      }
    }
  }
`;

const COMPLETE = /* GraphQL */ `
  mutation Complete($qrToken: String!) {
    completeDealByQr(qrToken: $qrToken) {
      id
      status
    }
  }
`;

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
    };
  }
}

export function AcceptDealPage() {
  const [token, setToken] = useState("");
  const [deal, setDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const lookup = async (qrToken: string) => {
    setError(null);
    setDeal(null);
    try {
      const data = await gql<{ dealByQrToken: Deal | null }>(LOOKUP, { qrToken });
      if (!data.dealByQrToken) {
        setError("Сделка с таким кодом не найдена");
        return;
      }
      setDeal(data.dealByQrToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleComplete = async () => {
    if (!deal) return;
    try {
      await gql(COMPLETE, { qrToken: deal.qrToken });
      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const startScan = async () => {
    if (!window.BarcodeDetector) {
      setError("Камера-сканер не поддерживается этим браузером — введите код вручную");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setError("Нет доступа к камере");
    }
  };

  const stopScan = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => {
    if (!scanning || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    let cancelled = false;

    const tick = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes[0]) {
          setToken(codes[0].rawValue);
          lookup(codes[0].rawValue);
          stopScan();
          return;
        }
      } catch {
        // keep trying
      }
      requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  useEffect(() => () => stopScan(), []);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, color: "#2c3e2c" }}>Приёмка сырья</h1>
      <p style={{ color: "#666", fontSize: 13 }}>Отсканируйте QR-код из приложения сборщика или введите код вручную</p>

      {!scanning ? (
        <button onClick={startScan} style={secondaryButtonStyle}>
          📷 Сканировать QR
        </button>
      ) : (
        <div>
          <video ref={videoRef} style={{ width: "100%", borderRadius: 10 }} muted playsInline />
          <button onClick={stopScan} style={secondaryButtonStyle}>
            Остановить сканирование
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Код сделки (вручную)" />
        <button onClick={() => lookup(token)} style={smallButtonStyle}>
          Найти
        </button>
      </div>

      {error && <p style={{ color: "crimson", fontSize: 13 }}>{error}</p>}

      {deal && !completed && (
        <div style={{ background: "#fff", border: "1px solid #e2e2e2", borderRadius: 10, padding: 12, marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>
            #{deal.number} {deal.rawMaterial.name} · {deal.quantityKg} кг
          </div>
          <div style={{ fontSize: 13, color: "#666" }}>
            Сборщик: {deal.collector.name} ({deal.collector.phone})
          </div>
          <div style={{ fontSize: 13 }}>
            Сумма: <strong>{deal.amount} ₽</strong> ({deal.pricePerKg} ₽/кг)
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>Статус: {deal.status}</div>
          <button onClick={handleComplete} style={{ ...primaryButtonStyle, marginTop: 10 }}>
            Оформить приёмку
          </button>
        </div>
      )}

      {completed && (
        <div style={{ background: "#eaf7ea", border: "1px solid #bfe3bf", borderRadius: 10, padding: 12, marginTop: 12 }}>
          Сделка успешно оформлена ✓
        </div>
      )}
    </div>
  );
}

const primaryButtonStyle = {
  width: "100%",
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 0",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  width: "100%",
  background: "#eee",
  border: "none",
  borderRadius: 8,
  padding: "10px 0",
  cursor: "pointer",
  marginTop: 8,
};

const smallButtonStyle = {
  background: "#3a5a3a",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "0 14px",
  cursor: "pointer",
};
