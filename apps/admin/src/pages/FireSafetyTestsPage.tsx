import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

interface FireSafetyTest {
  id: string;
  title: string;
  questions: Question[];
}

const LIST = /* GraphQL */ `
  query {
    fireSafetyTests {
      id
      title
      questions {
        text
        options
        correctIndex
        order
      }
    }
  }
`;

const CREATE = /* GraphQL */ `
  mutation Create($input: FireSafetyTestInput!) {
    createFireSafetyTest(input: $input) {
      id
    }
  }
`;

const UPDATE = /* GraphQL */ `
  mutation Update($id: ID!, $input: FireSafetyTestInput!) {
    updateFireSafetyTest(id: $id, input: $input) {
      id
    }
  }
`;

const DELETE = /* GraphQL */ `
  mutation Delete($id: ID!) {
    deleteFireSafetyTest(id: $id)
  }
`;

function emptyQuestion(): Question {
  return { text: "", options: ["", ""], correctIndex: 0 };
}

export function FireSafetyTestsPage() {
  const [tests, setTests] = useState<FireSafetyTest[] | null>(null);
  const [editing, setEditing] = useState<FireSafetyTest | null>(null);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion()]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    gql<{ fireSafetyTests: FireSafetyTest[] }>(LIST).then((d) => setTests(d.fireSafetyTests));
  };

  useEffect(refresh, []);

  const openCreate = () => {
    setEditing(null);
    setTitle("");
    setQuestions([emptyQuestion()]);
    setShowForm(true);
  };

  const openEdit = (test: FireSafetyTest) => {
    setEditing(test);
    setTitle(test.title);
    setQuestions(test.questions.map((q) => ({ ...q, options: [...q.options] })));
    setShowForm(true);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const input = { title, questions };
      if (editing) {
        await gql(UPDATE, { id: editing.id, input });
      } else {
        await gql(CREATE, { input });
      }
      setShowForm(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить тест?")) return;
    await gql(DELETE, { id });
    refresh();
  };

  if (!tests) return <p>Загрузка…</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Тест по пожарной безопасности в лесу</h2>
        <button onClick={openCreate} style={buttonStyle}>
          + Добавить тест
        </button>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {showForm && (
        <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, margin: "12px 0", maxWidth: 640 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 13, marginBottom: 12 }}>
            Название теста
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>

          {questions.map((q, qi) => (
            <div key={qi} style={{ border: "1px solid #eee", borderRadius: 6, padding: 10, marginBottom: 10 }}>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Вопрос {qi + 1}
                <input
                  value={q.text}
                  onChange={(e) =>
                    setQuestions((qs) => qs.map((item, i) => (i === qi ? { ...item, text: e.target.value } : item)))
                  }
                />
              </label>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() =>
                      setQuestions((qs) => qs.map((item, i) => (i === qi ? { ...item, correctIndex: oi } : item)))
                    }
                  />
                  <input
                    value={opt}
                    placeholder={`Вариант ${oi + 1}`}
                    onChange={(e) =>
                      setQuestions((qs) =>
                        qs.map((item, i) =>
                          i === qi
                            ? { ...item, options: item.options.map((o, oidx) => (oidx === oi ? e.target.value : o)) }
                            : item,
                        ),
                      )
                    }
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() =>
                    setQuestions((qs) => qs.map((item, i) => (i === qi ? { ...item, options: [...item.options, ""] } : item)))
                  }
                  style={smallButtonStyle}
                >
                  + вариант ответа
                </button>
                <button
                  type="button"
                  onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}
                  style={smallButtonStyle}
                >
                  Удалить вопрос
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])} style={smallButtonStyle}>
            + вопрос
          </button>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={handleSubmit} style={buttonStyle}>
              Сохранить
            </button>
            <button onClick={() => setShowForm(false)} style={secondaryButtonStyle}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {tests.map((t) => (
          <div key={t.id} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{t.title}</strong>
              <div>
                <button onClick={() => openEdit(t)} style={linkButtonStyle}>
                  Изменить
                </button>
                <button onClick={() => handleDelete(t.id)} style={linkButtonStyle}>
                  Удалить
                </button>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#555" }}>{t.questions.length} вопрос(ов)</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const buttonStyle = { background: "#3a5a3a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const secondaryButtonStyle = { background: "#eee", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer" };
const smallButtonStyle = { background: "#eee", border: "none", borderRadius: 4, padding: "4px 8px", cursor: "pointer", fontSize: 12 };
const linkButtonStyle = { background: "none", border: "none", color: "#3a5a3a", cursor: "pointer", marginRight: 8, padding: 0, textDecoration: "underline" };
