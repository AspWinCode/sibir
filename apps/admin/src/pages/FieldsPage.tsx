import { useEffect, useState } from "react";
import { gql } from "../api/client";
import { CrudPage, type FieldConfig } from "../components/CrudPage";

interface FieldItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  hasRoute: boolean;
  region: { id: string; name: string };
  rawMaterial: { id: string; name: string };
  regionId: string;
  rawMaterialId: string;
}

const LIST = /* GraphQL */ `
  query {
    fields {
      id
      name
      latitude
      longitude
      hasRoute
      region {
        id
        name
      }
      rawMaterial {
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
    rawMaterials {
      id
      name
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: FieldInput!) {
    createField(input: $input) {
      id
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation Update($id: ID!, $input: FieldInput!) {
    updateField(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteField(id: $id)
  }
`;

export function FieldsPage() {
  const [options, setOptions] = useState<{
    regions: { id: string; name: string }[];
    rawMaterials: { id: string; name: string }[];
  } | null>(null);

  useEffect(() => {
    gql<{
      regions: { id: string; name: string }[];
      rawMaterials: { id: string; name: string }[];
    }>(OPTIONS).then(setOptions);
  }, []);

  if (!options) return <p>Загрузка…</p>;

  const fields: FieldConfig[] = [
    { name: "name", label: "Название поляны", required: true },
    { name: "latitude", label: "Широта", type: "number", required: true },
    { name: "longitude", label: "Долгота", type: "number", required: true },
    {
      name: "regionId",
      label: "Район",
      type: "select",
      required: true,
      options: options.regions.map((r) => ({ value: r.id, label: r.name })),
    },
    {
      name: "rawMaterialId",
      label: "Сырьё",
      type: "select",
      required: true,
      options: options.rawMaterials.map((r) => ({ value: r.id, label: r.name })),
    },
  ];

  return (
    <CrudPage<FieldItem>
      title="Поляны"
      fields={fields}
      columns={[
        { key: "name", label: "Название" },
        { key: "region", label: "Район", render: (i) => i.region.name },
        { key: "rawMaterial", label: "Сырьё", render: (i) => i.rawMaterial.name },
        { key: "hasRoute", label: "Есть маршрут", render: (i) => (i.hasRoute ? "да" : "нет") },
      ]}
      load={async () => {
        const data = (await gql<{ fields: FieldItem[] }>(LIST)).fields;
        return data.map((f) => ({ ...f, regionId: f.region.id, rawMaterialId: f.rawMaterial.id }));
      }}
      create={async (values) => {
        await gql(CREATE, {
          input: {
            name: values.name,
            latitude: Number(values.latitude),
            longitude: Number(values.longitude),
            regionId: values.regionId,
            rawMaterialId: values.rawMaterialId,
          },
        });
      }}
      update={async (id, values) => {
        await gql(UPDATE, {
          id,
          input: {
            name: values.name,
            latitude: Number(values.latitude),
            longitude: Number(values.longitude),
            regionId: values.regionId,
            rawMaterialId: values.rawMaterialId,
          },
        });
      }}
      remove={async (id) => {
        await gql(DELETE, { id });
      }}
    />
  );
}
