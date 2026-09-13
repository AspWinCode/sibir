import { useEffect, useState } from "react";
import { gql } from "../api/client";
import { CrudPage, type FieldConfig } from "../components/CrudPage";

interface RouteItem {
  id: string;
  name: string;
  distanceKm: number | null;
  durationMin: number | null;
  field: { id: string; name: string };
  region: { id: string; name: string };
  fieldId: string;
  regionId: string;
}

const LIST = /* GraphQL */ `
  query {
    routes {
      id
      name
      distanceKm
      durationMin
      field {
        id
        name
      }
      region {
        id
        name
      }
    }
  }
`;

const OPTIONS = /* GraphQL */ `
  query {
    regions {
      id
      name
    }
    fields {
      id
      name
      region {
        id
      }
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: RouteInput!) {
    createRoute(input: $input) {
      id
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation Update($id: ID!, $input: RouteInput!) {
    updateRoute(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteRoute(id: $id)
  }
`;

export function RoutesPage() {
  const [options, setOptions] = useState<{
    regions: { id: string; name: string }[];
    fields: { id: string; name: string; region: { id: string } }[];
  } | null>(null);

  useEffect(() => {
    gql<{
      regions: { id: string; name: string }[];
      fields: { id: string; name: string; region: { id: string } }[];
    }>(OPTIONS).then(setOptions);
  }, []);

  if (!options) return <p>Загрузка…</p>;

  const fields: FieldConfig[] = [
    { name: "name", label: "Название маршрута", required: true },
    {
      name: "fieldId",
      label: "Поляна",
      type: "select",
      required: true,
      options: options.fields.map((f) => ({ value: f.id, label: f.name })),
    },
    {
      name: "regionId",
      label: "Район",
      type: "select",
      required: true,
      options: options.regions.map((r) => ({ value: r.id, label: r.name })),
    },
    { name: "distanceKm", label: "Расстояние, км", type: "number" },
    { name: "durationMin", label: "Время в пути, мин", type: "number" },
  ];

  return (
    <CrudPage<RouteItem>
      title="Маршруты"
      fields={fields}
      columns={[
        { key: "name", label: "Название" },
        { key: "field", label: "Поляна", render: (i) => i.field.name },
        { key: "region", label: "Район", render: (i) => i.region.name },
        { key: "distanceKm", label: "км", render: (i) => String(i.distanceKm ?? "—") },
      ]}
      load={async () => {
        const data = (await gql<{ routes: RouteItem[] }>(LIST)).routes;
        return data.map((r) => ({ ...r, fieldId: r.field.id, regionId: r.region.id }));
      }}
      create={async (values) => {
        await gql(CREATE, {
          input: {
            name: values.name,
            fieldId: values.fieldId,
            regionId: values.regionId,
            distanceKm: values.distanceKm ? Number(values.distanceKm) : null,
            durationMin: values.durationMin ? Number(values.durationMin) : null,
          },
        });
      }}
      update={async (id, values) => {
        await gql(UPDATE, {
          id,
          input: {
            name: values.name,
            fieldId: values.fieldId,
            regionId: values.regionId,
            distanceKm: values.distanceKm ? Number(values.distanceKm) : null,
            durationMin: values.durationMin ? Number(values.durationMin) : null,
          },
        });
      }}
      remove={async (id) => {
        await gql(DELETE, { id });
      }}
    />
  );
}
