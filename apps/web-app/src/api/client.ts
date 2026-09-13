const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL ?? "http://localhost:4000/graphql";

export class GraphQLError extends Error {}

export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = localStorage.getItem("sibir_token");
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  if (json.errors?.length) {
    throw new GraphQLError(json.errors[0].message);
  }
  return json.data as T;
}
