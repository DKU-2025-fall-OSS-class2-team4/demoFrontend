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
      <h1>Demo Frontend</h1>
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
        <>
          <p style={{ color: "#555" }}>
            API base: <strong>{getApiBase()}</strong>
          </p>

          <div style={{ marginBottom: "20px" }}>
            <h2>Insert Data</h2>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content"
            />
            <button onClick={handleCreate} style={{ marginLeft: "10px" }} disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>
            <button onClick={() => setResult(null)} style={{ marginLeft: "10px" }}>
              Stop
            </button>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h2>Get Data</h2>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter ID"
            />
            <button onClick={handleGet} style={{ marginLeft: "10px" }} disabled={loading}>
              {loading ? "Fetching..." : "Fetch"}
            </button>
          </div>

          {error && (
            <div style={{ color: "red", marginBottom: "10px" }}>
              Error: {error}
            </div>
          )}

          <h3>Result</h3>
          <pre>{result ? JSON.stringify(result, null, 2) : "No result"}</pre>
        </>
      )}

      {view === "massive" && <MassiveRequests />}
    </div>
  );
}

export default App;
