import { useEffect, useState } from "react";

interface Position {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Геолокация не поддерживается браузером");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  return { position, error };
}
