import { useState, useRef } from "react";
import { apiRequest, getApiBase } from "./api/Backend.jsx";
import "./massive.css";

const defaultPayload = JSON.stringify({ content: "load-test" }, null, 2);
const MIN_DURATION_MS = 10_000;
const MAX_DURATION_MS = 120_000;
const MIN_INVALID_PERCENT = 0.01;
const MAX_INVALID_PERCENT = 1;

const randomString = () => Math.random().toString(36).slice(2, 10);

function parseBody(input) {
  if (!input.trim()) return undefined;
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new Error("Request body must be valid JSON.");
  }
}

export default function MassiveRequests() {
  const [path, setPath] = useState("/api/data");
  const [method, setMethod] = useState("POST");
  const [body, setBody] = useState(defaultPayload);
  const [concurrency, setConcurrency] = useState(5);
  const [durationMs, setDurationMs] = useState(60_000);
  const [invalidPercent, setInvalidPercent] = useState(0.1); // percentage
  const [logs, setLogs] = useState("");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentRequests, setCurrentRequests] = useState(0);
  const stopRequested = useRef(false);

  const handleRun = async () => {
    setError("");
    setSummary(null);
    setLogs("");
    setProgress(0);
    setCurrentRequests(0);
    stopRequested.current = false;
    const trimmedPath = path.trim();

    if (!trimmedPath.startsWith("/")) {
      setError("Path should start with '/'.");
      return;
    }
    if (!Number.isFinite(concurrency) || concurrency <= 0) {
      setError("Concurrency must be greater than 0.");
      return;
    }
    if (!Number.isFinite(durationMs) || durationMs < MIN_DURATION_MS || durationMs > MAX_DURATION_MS) {
      setError("Duration must be between 10 seconds and 2 minutes.");
      return;
    }
    if (!Number.isFinite(invalidPercent) || invalidPercent < MIN_INVALID_PERCENT || invalidPercent > MAX_INVALID_PERCENT) {
      setError("Invalid ratio must be between 0.01% and 1%.");
      return;
    }

    let parsedBody;
    try {
      parsedBody = parseBody(body);
    } catch (err) {
      setError(err.message);
      return;
    }

    setRunning(true);
    const start = performance.now();
    const deadline = start + durationMs;
    const parallel = Math.max(1, Math.floor(concurrency));

    let sent = 0;
    let success = 0;
    let failed = 0;
    const invalidRatio = invalidPercent / 100;

    const appendLog = (line) => {
      setLogs((prev) => (prev ? `${prev}\n${line}` : line));
    };

    const makeTask = async (seq) => {
      const isInvalid = Math.random() < invalidRatio;
      const targetPath = isInvalid ? `${trimmedPath}-invalid` : trimmedPath;
      const options = { method };
      if (method !== "GET" && parsedBody !== undefined) {
        const randomToken = randomString();
        const payload = typeof parsedBody === "object"
          ? { ...parsedBody, _seq: seq, invalid: isInvalid, _rnd: randomToken }
          : { value: parsedBody, _seq: seq, invalid: isInvalid, _rnd: randomToken };
        options.body = JSON.stringify(payload);
      }
      const ts = new Date().toISOString();
      try {
        await apiRequest(targetPath, options);
        success += 1;
        appendLog(`[${ts}] #${seq} -> ${targetPath} OK${isInvalid ? " (invalid target succeeded)" : ""}`);
      } catch (err) {
        failed += 1;
        appendLog(`[${ts}] #${seq} -> ${targetPath} FAIL: ${err?.message || err}`);
      }
    };

    const worker = async () => {
      while (performance.now() < deadline && !stopRequested.current) {
        sent += 1;
        await makeTask(sent);
        setCurrentRequests(sent);
        const elapsed = performance.now() - start;
        const progressPercent = Math.min(100, (elapsed / durationMs) * 100);
        setProgress(progressPercent);
      }
    };

    await Promise.all(Array.from({ length: parallel }, worker));
    const totalDuration = performance.now() - start;

    setSummary({
      count: sent,
      success,
      failed,
      durationMs: Math.round(totalDuration),
      concurrency: parallel,
      apiBase: getApiBase(),
      path: trimmedPath,
      method,
      invalidPercent,
      stopped: stopRequested.current,
    });
    setRunning(false);
  };

  const handleStop = () => {
    stopRequested.current = true;
  };

  return (
    <div className="mr-container">
      <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Massive HTTP Request Runner</h2>
      <p style={{ textAlign: "center", color: "#555", marginBottom: "20px" }}>
        API base: <strong>{getApiBase() || "same origin"}</strong>
      </p>

      <div className={`mr-status-badge ${running ? "mr-status-running" : "mr-status-idle"}`} style={{ textAlign: "center", display: "block" }}>
        {running ? "🔄 실행 중" : "⏸️ 대기 중"}
      </div>

      {running && (
        <div>
          <div className="mr-progress-container">
            <div className="mr-progress-bar" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mr-progress-text">
            {progress.toFixed(1)}% • {currentRequests} requests sent
          </div>
        </div>
      )}

      <div className="mr-card">
        <div className="mr-card-title">⚙️ Configuration</div>
        <div className="mr-grid">
        <label className="mr-label">
          Endpoint Path
          <input className="mr-input" value={path} onChange={(e) => setPath(e.target.value)} />
        </label>

        <label className="mr-label">
          Method
          <select className="mr-select" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
        </label>

        <label className="mr-label">
          Concurrency
          <input
            className="mr-input"
            type="number"
            min="1"
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
          />
        </label>
        </div>

        <div className="mr-grid" style={{ marginTop: "10px" }}>
          <label className="mr-label">
            Run Duration ({(durationMs / 1000).toFixed(0)}s)
            <input
              className="mr-range"
              type="range"
              min={MIN_DURATION_MS}
              max={MAX_DURATION_MS}
              step={1000}
              value={durationMs}
              onChange={(e) => setDurationMs(Number(e.target.value))}
            />
            <div className="mr-row">
              <span className="mr-pill">10s</span>
              <span className="mr-pill">2m</span>
            </div>
          </label>

          <label className="mr-label">
            Invalid Request Ratio ({invalidPercent.toFixed(2)}%)
            <input
              className="mr-range"
              type="range"
              min={MIN_INVALID_PERCENT}
              max={MAX_INVALID_PERCENT}
              step={0.01}
              value={invalidPercent}
              onChange={(e) => setInvalidPercent(Number(e.target.value))}
            />
            <div className="mr-row">
              <span className="mr-pill">0.01%</span>
              <span className="mr-pill">1%</span>
            </div>
          </label>
        </div>

        <label className="mr-label" style={{ marginTop: "12px" }}>
          JSON Body (ignored for GET)
          <textarea
            className="mr-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
          />
        </label>

        <div style={{ marginTop: "12px", display: "flex", gap: "10px", justifyContent: "center" }}>
          <button className="mr-button" onClick={handleRun} disabled={running}>
            {running ? "Running..." : `Run for ${(durationMs / 1000).toFixed(0)}s`}
          </button>
          <button className="mr-button-stop" onClick={handleStop} disabled={!running}>
            Stop
          </button>
        </div>
      </div>

      {error && (
        <div className="mr-card" style={{ borderColor: "var(--danger)", background: "#fef2f2" }}>
          <div className="mr-card-title" style={{ color: "var(--danger)", borderBottomColor: "var(--danger)" }}>
            ❌ Error
          </div>
          <div style={{ color: "var(--danger)" }}>{error}</div>
        </div>
      )}

      {summary && (
        <div className="mr-card" style={{ borderColor: summary.stopped ? "var(--warning)" : "var(--success)", background: summary.stopped ? "#fffbeb" : "#f0fdf4" }}>
          <div className="mr-card-title" style={{ color: summary.stopped ? "var(--warning)" : "var(--success)", borderBottomColor: summary.stopped ? "var(--warning)" : "var(--success)" }}>
            {summary.stopped ? "⚠️ summary (중단됨)" : "✅ summary"}
          </div>
          <div style={{ display: "grid", gap: "8px", color: "var(--text)" }}>
            <div><strong>메서드:</strong> {summary.method}</div>
            <div><strong>경로:</strong> {summary.path}</div>
            <div><strong>API 주소:</strong> {summary.apiBase}</div>
            <div><strong>요청 수:</strong> {summary.count} (✅ 성공: {summary.success}, ❌ 실패: {summary.failed})</div>
            <div><strong>잘못된 요청 비율:</strong> {summary.invalidPercent.toFixed(2)}%</div>
            <div><strong>동시 실행:</strong> {summary.concurrency}</div>
            <div><strong>소요 시간:</strong> {summary.durationMs} ms ({(summary.durationMs / 1000).toFixed(2)}초)</div>
          </div>
        </div>
      )}

      <div className="mr-card">
        <div className="mr-card-title">📋 Communication Log</div>
        <textarea
          className="mr-log-box"
          value={logs}
          readOnly
          rows={12}
        />
      </div>
    </div>
  );
}
