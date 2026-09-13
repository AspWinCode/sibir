import { gql } from "../api/client";
import { CrudPage, type FieldConfig } from "../components/CrudPage";

interface VideoContent {
  id: string;
  title: string;
  url: string;
  description: string | null;
}

const FIELDS: FieldConfig[] = [
  { name: "title", label: "Название", required: true },
  { name: "url", label: "Ссылка на видео", required: true },
  { name: "description", label: "Описание", type: "textarea" },
];

const LIST = /* GraphQL */ `
  query {
    videoContents {
      id
      title
      url
      description
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: VideoContentInput!) {
    createVideoContent(input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteVideoContent(id: $id)
  }
`;

export function VideoContentPage() {
  return (
    <CrudPage<VideoContent>
      title="Видео-контент"
      fields={FIELDS}
      columns={[
        { key: "title", label: "Название" },
        { key: "url", label: "Ссылка" },
      ]}
      load={async () => (await gql<{ videoContents: VideoContent[] }>(LIST)).videoContents}
      create={async (input) => {
        await gql(CREATE, { input });
      }}
      update={async () => {
        throw new Error("Редактирование видео не поддерживается — удалите и добавьте заново");
      }}
      remove={async (id) => {
        await gql(DELETE, { id });
      }}
    />
  );
}
