import { gql } from "../api/client";
import { CrudPage, type FieldConfig } from "../components/CrudPage";

interface Region {
  id: string;
  name: string;
  district: string | null;
}

const FIELDS: FieldConfig[] = [
  { name: "name", label: "Название района/поселения", required: true },
  { name: "district", label: "Область/край" },
];

const LIST = /* GraphQL */ `
  query {
    regions {
      id
      name
      district
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: RegionInput!) {
    createRegion(input: $input) {
      id
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation Update($id: ID!, $input: RegionInput!) {
    updateRegion(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteRegion(id: $id)
  }
`;

export function RegionsPage() {
  return (
    <CrudPage<Region>
      title="Районы сбора"
      fields={FIELDS}
      load={async () => (await gql<{ regions: Region[] }>(LIST)).regions}
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
