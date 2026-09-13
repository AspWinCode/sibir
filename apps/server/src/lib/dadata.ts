/**
 * Dadata address suggestion wrapper. Without DADATA_API_KEY, returns an empty
 * list so the client falls back to a plain text address field.
 */

const DADATA_API_KEY = process.env.DADATA_API_KEY;
const SUGGEST_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

export interface AddressSuggestion {
  value: string;
  latitude: number | null;
  longitude: number | null;
}

export async function suggestAddress(query: string): Promise<AddressSuggestion[]> {
  if (!DADATA_API_KEY || !query.trim()) {
    return [];
  }

  const response = await fetch(SUGGEST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Token ${DADATA_API_KEY}`,
    },
    body: JSON.stringify({ query, count: 5 }),
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    suggestions: { value: string; data: { geo_lat: string | null; geo_lon: string | null } }[];
  };

  return data.suggestions.map((s) => ({
    value: s.value,
    latitude: s.data.geo_lat ? Number(s.data.geo_lat) : null,
    longitude: s.data.geo_lon ? Number(s.data.geo_lon) : null,
  }));
}
