import { useEffect, useState } from "react";
import { gql } from "../api/client";

interface Test { id: string; title: string; questions: { id: string; text: string }[] }
interface Video { id: string; title: string; url: string; description: string | null }

const QUERY = `query { fireSafetyTests { id title questions { id text } } videoContents { id title url description } }`;

export function LearningPage() {
  const [data, setData] = useState<{ fireSafetyTests: Test[]; videoContents: Video[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gql<{ fireSafetyTests: Test[]; videoContents: Video[] }>(QUERY).then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p style={{ padding: 16, color: "crimson" }}>{error}</p>;
  if (!data) return <p style={{ padding: 16 }}>Загрузка…</p>;
  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: "0 0 4px", color: "#2c3e2c", fontSize: 20 }}>Обучение</h1>
      <p style={{ color: "#666", fontSize: 13 }}>Материалы по безопасному сбору и работе с приёмкой.</p>
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Пожарная безопасность</h2>
        {data.fireSafetyTests.length === 0 ? <p style={mutedStyle}>Тесты пока не добавлены.</p> : data.fireSafetyTests.map((test) => (
          <article key={test.id} style={itemStyle}><strong>{test.title}</strong><span>{test.questions.length} вопросов</span></article>
        ))}
      </section>
      <section style={sectionStyle}>
        <h2 style={headingStyle}>Видео и памятки</h2>
        {data.videoContents.length === 0 ? <p style={mutedStyle}>Материалы пока не добавлены.</p> : data.videoContents.map((video) => (
          <article key={video.id} style={itemStyle}><a href={video.url} target="_blank" rel="noreferrer" style={{ color: "#2c5a36" }}>{video.title}</a>{video.description && <span>{video.description}</span>}</article>
        ))}
      </section>
    </div>
  );
}

const sectionStyle = { display: "grid", gap: 8, marginTop: 14, padding: 12, background: "#fff", border: "1px solid #e2e2e2", borderRadius: 12 };
const headingStyle = { margin: 0, fontSize: 16, color: "#2c3e2c" };
const itemStyle = { display: "grid", gap: 3, padding: "9px 0", borderTop: "1px solid #f0f0f0", fontSize: 13 };
const mutedStyle = { margin: 0, color: "#888", fontSize: 13 };
