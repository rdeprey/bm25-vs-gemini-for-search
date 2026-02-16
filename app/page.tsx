"use client";
import { useEffect, useRef, useState } from "react";

const s = {
  wrapper: {
    maxWidth: 1600,
    margin: "0 auto",
    padding: "48px 24px",
    position: "relative",
  } as React.CSSProperties,
  header: {
    textAlign: "center",
    marginBottom: 48,
  } as React.CSSProperties,
  title: {
    fontSize: 48,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    background: "linear-gradient(135deg, #6c5ce7, #a29bfe, #74b9ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 8,
  } as React.CSSProperties,
  subtitle: {
    color: "var(--text-muted)",
    fontSize: 16,
  } as React.CSSProperties,
  infoBox: {
    marginTop: 20,
    maxWidth: 720,
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left" as const,
    fontSize: 14,
    lineHeight: 1.7,
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "16px 20px",
  } as React.CSSProperties,
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: 10,
  } as React.CSSProperties,
  textarea: {
    width: "100%",
    minHeight: 160,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 16,
    color: "var(--text)",
    fontSize: 13,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    lineHeight: 1.6,
    resize: "vertical" as const,
    outline: "none",
    transition: "border-color 0.2s",
  } as React.CSSProperties,
  searchRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  } as React.CSSProperties,
  input: {
    flex: 1,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 16px",
    color: "var(--text)",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
  } as React.CSSProperties,
  btnPrimary: {
    background: "linear-gradient(135deg, #6c5ce7, #a29bfe)",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  btnSecondary: {
    background: "var(--surface-2)",
    color: "var(--text-muted)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 20px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  btnCancel: {
    background: "transparent",
    color: "#ff6b6b",
    border: "1px solid #ff6b6b44",
    borderRadius: 8,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    marginLeft: 12,
  } as React.CSSProperties,
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 24,
  } as React.CSSProperties,
  colHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
  } as React.CSSProperties,
  colTitle: {
    fontSize: 18,
    fontWeight: 700,
  } as React.CSSProperties,
  badge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    color: "var(--text-muted)",
  } as React.CSSProperties,
  resultCard: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    transition: "border-color 0.2s",
  } as React.CSSProperties,
  scoreRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  } as React.CSSProperties,
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    background: "var(--border)",
    overflow: "hidden",
  } as React.CSSProperties,
  scoreMeta: {
    fontSize: 11,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: "var(--text-muted)",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  resultText: {
    fontSize: 13,
    lineHeight: 1.7,
    color: "var(--text-muted)",
    maxHeight: 160,
    overflow: "auto",
  } as React.CSSProperties,
  geminiOutput: {
    whiteSpace: "pre-wrap" as const,
    fontSize: 14,
    lineHeight: 1.8,
    color: "var(--text)",
    fontFamily: "inherit",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 20,
  } as React.CSSProperties,
  empty: {
    color: "var(--text-muted)",
    fontSize: 14,
    textAlign: "center" as const,
    padding: 40,
  } as React.CSSProperties,
};

export default function Page() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [bm25, setBm25] = useState<any[]>([]);
  const [gemini, setGemini] = useState("");
  const [lancedbResults, setLancedbResults] = useState<any[]>([]);
  const [bm25Time, setBm25Time] = useState<number | null>(null);
  const [geminiTime, setGeminiTime] = useState<number | null>(null);
  const [lancedbTime, setLancedbTime] = useState<number | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiElapsed, setGeminiElapsed] = useState<number>(0);
  const [lancedbLoading, setLancedbLoading] = useState(false);
  const [lancedbElapsed, setLancedbElapsed] = useState<number>(0);
  const geminiAbort = useRef<AbortController | null>(null);
  const geminiTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const geminiStart = useRef<number>(0);
  const lancedbAbort = useRef<AbortController | null>(null);
  const lancedbTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lancedbStart = useRef<number>(0);

  useEffect(() => {
    fetch("/api/sample-doc")
      .then((r) => r.json())
      .then((j) => { if (j.text) setText(j.text); });
  }, []);

  async function indexDoc() {
    const r = await fetch("/api/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docId: "demo", text }),
    });
    const j = await r.json();
    if (j.vectorError) {
      alert(`Indexed ${j.chunks} chunks for BM25, but vector indexing failed: ${j.vectorError}`);
    } else if (j.error) {
      alert(`Indexing failed: ${j.error}`);
    } else {
      alert(`Indexed ${j.chunks} chunks (BM25 + vectors)`);
    }
  }

  async function runBm25() {
    const start = performance.now();
    try {
      const r = await fetch("/api/search/bm25", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "demo", query }),
      });
      const text = await r.text();
      const j = text ? JSON.parse(text) : { results: [] };
      setBm25Time(performance.now() - start);
      setBm25(j.results || []);
    } catch {
      setBm25Time(performance.now() - start);
      setBm25([]);
    }
  }

  async function runGemini() {
    geminiAbort.current?.abort();
    if (geminiTimer.current) clearInterval(geminiTimer.current);
    const controller = new AbortController();
    geminiAbort.current = controller;
    setGeminiLoading(true);
    setGeminiTime(null);
    setGemini("");
    setGeminiElapsed(0);
    geminiStart.current = performance.now();
    geminiTimer.current = setInterval(() => {
      setGeminiElapsed(performance.now() - geminiStart.current);
    }, 100);
    try {
      const r = await fetch("/api/search/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "demo", query }),
        signal: controller.signal,
      });
      const text = await r.text();
      let j;
      try { j = JSON.parse(text); } catch { j = { error: text || "Empty response from server" }; }
      setGeminiTime(performance.now() - geminiStart.current);
      setGemini(j.output || j.error);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setGemini("Cancelled.");
      } else {
        setGemini(e.message || "Request failed");
      }
    } finally {
      if (geminiTimer.current) clearInterval(geminiTimer.current);
      setGeminiLoading(false);
    }
  }

  async function runLanceDb() {
    lancedbAbort.current?.abort();
    if (lancedbTimer.current) clearInterval(lancedbTimer.current);
    const controller = new AbortController();
    lancedbAbort.current = controller;
    setLancedbLoading(true);
    setLancedbTime(null);
    setLancedbResults([]);
    setLancedbElapsed(0);
    lancedbStart.current = performance.now();
    lancedbTimer.current = setInterval(() => {
      setLancedbElapsed(performance.now() - lancedbStart.current);
    }, 100);
    try {
      const r = await fetch("/api/search/lancedb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "demo", query }),
        signal: controller.signal,
      });
      const j = await r.json();
      setLancedbTime(performance.now() - lancedbStart.current);
      setLancedbResults(j.results || []);
    } catch (e: any) {
      if (e.name === "AbortError") {
        setLancedbResults([]);
      }
    } finally {
      if (lancedbTimer.current) clearInterval(lancedbTimer.current);
      setLancedbLoading(false);
    }
  }

  function formatTime(ms: number): string {
    if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms.toFixed(0)}ms`;
  }

  function cancelGemini() {
    geminiAbort.current?.abort();
  }

  function cancelLanceDb() {
    lancedbAbort.current?.abort();
  }

  function highlight(text: string): React.ReactNode {
    if (!query.trim()) return text;
    const words = query
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return text;
    const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(pattern);
    return parts.map((part, i) =>
      pattern.test(part)
        ? <mark key={i} style={{
            background: "rgba(108, 92, 231, 0.35)",
            color: "var(--text)",
            borderRadius: 3,
            padding: "1px 2px",
          }}>{part}</mark>
        : part
    );
  }

  const best = bm25.length ? Math.min(...bm25.map((r) => r.score)) : 0;
  const bestLancedb = lancedbResults.length ? Math.max(...lancedbResults.map((r) => r.score)) : 0;

  return (
    <div style={s.wrapper}>
      <header style={s.header}>
        <a
          href="https://github.com/rdeprey/bm25-vs-gemini-for-search"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            color: "var(--text-muted)",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          aria-label="View on GitHub"
        >
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <h1 style={s.title}>BM25 vs Gemini vs Vector Search</h1>
        <p style={s.subtitle}>Compare local full-text search, AI-powered retrieval, and semantic vector search</p>
        <div style={s.infoBox}>
          <p>
            <strong>BM25</strong> is a ranking algorithm built into SQLite via its
            FTS5 (Full-Text Search) engine. It scores documents by term frequency
            (how often your search words appear) weighted by inverse document
            frequency (rarer words matter more). It runs entirely locally in
            milliseconds with zero API calls.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Gemini 3 Flash</strong> is Google{"'"}s fast multimodal model. It
            reads the full document and reasons about your query to produce a
            natural-language answer. Powerful, but requires a network round-trip.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Vector Search</strong> uses Gemini embeddings to convert text into
            high-dimensional vectors, then finds chunks whose meaning is closest to your
            query via cosine similarity in LanceDB. It captures semantic meaning beyond
            exact keyword matches.
          </p>
        </div>
      </header>

      <div style={s.card}>
        <label style={s.label}>Document</label>
        <textarea
          style={s.textarea}
          placeholder="Paste a large document here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={{ marginTop: 12 }}>
          <button style={s.btnSecondary} onClick={indexDoc}>Index Document</button>
        </div>
      </div>

      <div style={s.card}>
        <label style={s.label}>Search</label>
        <div style={s.searchRow}>
          <input
            style={s.input}
            placeholder="Enter your search query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { runBm25(); runGemini(); runLanceDb(); } }}
          />
          <button style={s.btnPrimary} onClick={() => { runBm25(); runGemini(); runLanceDb(); }}>Search</button>
        </div>
      </div>

      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>BM25</span>
            {bm25Time !== null && <span style={s.badge}>{formatTime(bm25Time)}</span>}
          </div>
          {bm25.length === 0 && <p style={s.empty}>No results yet</p>}
          {bm25.map((r, i) => {
            const pct = best ? Math.round((r.score / best) * 100) : 0;
            return (
              <div key={i} style={s.resultCard}>
                <div style={s.scoreRow}>
                  <div style={s.barTrack}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: `linear-gradient(90deg, #6c5ce7, #74b9ff)`,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  <span style={s.scoreMeta}>{r.score.toFixed(2)} ({pct}%)</span>
                </div>
                <div style={s.resultText}>{highlight(r.text)}</div>
              </div>
            );
          })}
        </div>

        <div style={s.card}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>Gemini 3 Flash</span>
            {geminiTime !== null && <span style={s.badge}>{formatTime(geminiTime)}</span>}
            {geminiLoading && <span style={s.badge}>{formatTime(geminiElapsed)}</span>}
            {geminiLoading && (
              <button style={s.btnCancel} onClick={cancelGemini}>Cancel</button>
            )}
          </div>
          {!gemini && !geminiLoading && <p style={s.empty}>No results yet</p>}
          {geminiLoading && !gemini && <p style={s.empty}>Thinking...</p>}
          {gemini && <pre style={s.geminiOutput}>{highlight(gemini)}</pre>}
        </div>

        <div style={s.card}>
          <div style={s.colHeader}>
            <span style={s.colTitle}>Vector Search</span>
            {lancedbTime !== null && <span style={s.badge}>{formatTime(lancedbTime)}</span>}
            {lancedbLoading && <span style={s.badge}>{formatTime(lancedbElapsed)}</span>}
            {lancedbLoading && (
              <button style={s.btnCancel} onClick={cancelLanceDb}>Cancel</button>
            )}
          </div>
          {lancedbResults.length === 0 && !lancedbLoading && <p style={s.empty}>No results yet</p>}
          {lancedbLoading && lancedbResults.length === 0 && <p style={s.empty}>Searching...</p>}
          {lancedbResults.map((r, i) => {
            const pct = bestLancedb ? Math.round((r.score / bestLancedb) * 100) : 0;
            return (
              <div key={i} style={s.resultCard}>
                <div style={s.scoreRow}>
                  <div style={s.barTrack}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: `linear-gradient(90deg, #00b894, #55efc4)`,
                      transition: "width 0.3s ease",
                    }} />
                  </div>
                  <span style={s.scoreMeta}>{r.score.toFixed(4)} ({pct}%)</span>
                </div>
                <div style={s.resultText}>{highlight(r.text)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
