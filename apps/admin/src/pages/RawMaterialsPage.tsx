import { gql } from "../api/client";
import { CrudPage, type FieldConfig } from "../components/CrudPage";

interface RawMaterial {
  id: string;
  name: string;
  composition: string | null;
  benefits: string | null;
  seasonStart: string | null;
  seasonEnd: string | null;
  harvestGuide: string | null;
  gostReference: string | null;
  photoUrl: string | null;
}

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Название", required: true },
  { name: "photoUrl", label: "Ссылка на фото" },
  { name: "composition", label: "Состав", type: "textarea" },
  { name: "benefits", label: "Полезные свойства", type: "textarea" },
  { name: "seasonStart", label: "Начало сезона сбора" },
  { name: "seasonEnd", label: "Конец сезона сбора" },
  { name: "harvestGuide", label: "Как заготавливать", type: "textarea" },
  { name: "gostReference", label: "ГОСТ" },
];

const LIST = /* GraphQL */ `
  query {
    rawMaterials {
      id
      name
      composition
      benefits
      seasonStart
      seasonEnd
      harvestGuide
      gostReference
      photoUrl
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: RawMaterialInput!) {
    createRawMaterial(input: $input) {
      id
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation Update($id: ID!, $input: RawMaterialInput!) {
    updateRawMaterial(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteRawMaterial(id: $id)
  }
`;

export function RawMaterialsPage() {
  return (
    <CrudPage<RawMaterial>
      title="Справочник сырья"
      fields={FIELDS}
      columns={[
        { key: "name", label: "Название" },
        { key: "seasonStart", label: "Сезон с" },
        { key: "seasonEnd", label: "по" },
        { key: "gostReference", label: "ГОСТ" },
      ]}
      load={async () => (await gql<{ rawMaterials: RawMaterial[] }>(LIST)).rawMaterials}
      create={async (input) => {
        await gql(CREATE, { input });
      }}
      update={async (id, input) => {
        await gql(UPDATE, { id, input });
      }}
      remove={async (id) => {
        await gql(DELETE, { id });
      }}
    />
  );
}
