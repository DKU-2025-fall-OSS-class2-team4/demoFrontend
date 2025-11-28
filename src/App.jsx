import { useState } from 'react';
import './App.css';
import { createData, getData, getApiBase } from './api/Backend.jsx';
import MassiveRequests from './MassiveRequests.jsx';

function App() {
  const [content, setContent] = useState("");
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("basic");
  const Grafana_icon = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Grafana_icon.svg/1969px-Grafana_icon.svg.png";

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await createData(content);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to send data");
    } finally {
      setLoading(false);
    }
  };

  const handleGet = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getData(id);
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>Demo Frontend</h1>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <a href='http://localhost:3000' >
          <img src = {Grafana_icon} height = '15px'></img> Grafana 페이지로 이동
        </a>
      </div>

      <div className="view-switcher">
        <button
          type="button"
          className={`tab-button ${view === "basic" ? "active" : ""}`}
          aria-pressed={view === "basic"}
          onClick={() => setView("basic")}
        >
          Basic CRUD
        </button>
        <button
          type="button"
          className={`tab-button ${view === "massive" ? "active" : ""}`}
          aria-pressed={view === "massive"}
          onClick={() => setView("massive")}
        >
          Massive HTTP
        </button>
      </div>

      {view === "basic" && (
        <div className="crud-container">
          <p style={{ textAlign: "center", color: "#555", marginBottom: "20px" }}>
            API 주소: <strong>{getApiBase()}</strong>
          </p>

          {error && (
            <div className="crud-error">
              ❌ 오류: {error}
            </div>
          )}

          <div className="crud-card">
            <div className="crud-card-title">➕ 데이터 추가</div>
            <input
              className="crud-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
            />
            <div className="flex flex-col contecrud-button-group">
              <button className="crud-button" onClick={handleCreate} disabled={loading}>
                {loading ? "전송 중..." : "전송"}
              </button>
              <button className="crud-button-clear" onClick={() => { setResult(null); setError(""); }}>
                초기화
              </button>
            </div>
          </div>

          <div className="crud-card">
            <div className="crud-card-title">🔍 데이터 조회</div>
            <input
              className="crud-input"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="ID를 입력하세요"
            />
            <button className="crud-button" onClick={handleGet} disabled={loading}>
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>

          <div className="crud-card">
            <div className="crud-card-title">📋 결과</div>
            <pre className="crud-result-box">
              {result ? JSON.stringify(result, null, 2) : "결과가 없습니다"}
            </pre>
          </div>
        </div>
      )}

      {view === "massive" && <MassiveRequests />}
    </div>
  );
}

export default App;
