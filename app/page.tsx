"use client";
import { useEffect, useRef, useState } from "react";
import type {
  SearchLaneResult,
  SearchSettings,
  AgentTrace,
} from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";
import SearchLane from "@/components/SearchLane";
import AnswerBlock from "@/components/AnswerBlock";
import AgentTraceBox from "@/components/AgentTraceBox";
import SettingsPanel from "@/components/SettingsPanel";
import PresetBar from "@/components/PresetBar";

const s = {
  wrapper: {
    maxWidth: 1800,
    margin: "0 auto",
    padding: "48px 24px",
    position: "relative",
  } as React.CSSProperties,
  header: {
    textAlign: "center",
    marginBottom: 48,
  } as React.CSSProperties,
  title: {
    fontSize: 44,
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
    maxWidth: 800,
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 20,
  } as React.CSSProperties,
  indexInfo: {
    fontSize: 12,
    color: "var(--text-muted)",
    marginTop: 8,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
};

export default function Page() {
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState<SearchSettings>(DEFAULT_SETTINGS);
  const [indexInfo, setIndexInfo] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState(0);
  const [indexStage, setIndexStage] = useState("");

  // Lane results
  const [bm25Result, setBm25Result] = useState<SearchLaneResult | null>(null);
  const [geminiResult, setGeminiResult] = useState<SearchLaneResult | null>(null);
  const [vectorResult, setVectorResult] = useState<SearchLaneResult | null>(null);
  const [hybridResult, setHybridResult] = useState<SearchLaneResult | null>(null);

  // Loading states
  const [bm25Loading, setBm25Loading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [vectorLoading, setVectorLoading] = useState(false);
  const [hybridLoading, setHybridLoading] = useState(false);

  // Elapsed timers
  const [geminiElapsed, setGeminiElapsed] = useState(0);
  const [vectorElapsed, setVectorElapsed] = useState(0);
  const [hybridElapsed, setHybridElapsed] = useState(0);

  // Abort controllers & timers
  const geminiAbort = useRef<AbortController | null>(null);
  const geminiTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const geminiStart = useRef(0);
  const vectorAbort = useRef<AbortController | null>(null);
  const vectorTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const vectorStart = useRef(0);
  const hybridAbort = useRef<AbortController | null>(null);
  const hybridTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hybridStart = useRef(0);

  useEffect(() => {
    fetch("/api/sample-doc")
      .then((r) => r.json())
      .then((j) => {
        if (j.text) setText(j.text);
      });
  }, []);

  async function indexDoc() {
    setIndexing(true);
    setIndexProgress(0);
    setIndexStage("Starting...");
    setIndexInfo("");

    try {
      const r = await fetch("/api/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: "demo",
          text,
          chunkingMode: settings.useChapterChunking ? "chapter" : "fixed",
          settings,
        }),
      });

      const reader = r.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const match = line.match(/^data: (.+)$/m);
          if (!match) continue;
          try {
            const data = JSON.parse(match[1]);
            setIndexProgress(data.progress ?? 0);

            if (data.stage === "chunking") {
              setIndexStage("Chunking text...");
            } else if (data.stage === "chunked") {
              setIndexStage(`${data.chunks} chunks created`);
            } else if (data.stage === "embedding") {
              setIndexStage(
                `Embedding ${data.embedded}/${data.total} chunks...`
              );
            } else if (data.stage === "storing") {
              setIndexStage("Storing vectors...");
            } else if (data.stage === "done") {
              const sectionInfo = data.sections
                ? ` | ${data.sections.length} sections`
                : "";
              setIndexInfo(
                `${data.chunks} chunks | ${data.chunkingMode} mode${sectionInfo} | ${data.indexTimeMs}ms`
              );
              setIndexStage("Done!");
            } else if (data.stage === "error") {
              setIndexInfo(
                `${data.indexTimeMs}ms | vector error: ${data.vectorError}`
              );
              setIndexStage("Completed with errors");
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }
    } catch (e: any) {
      setIndexStage("Failed");
      setIndexInfo(e.message || "Indexing failed");
    } finally {
      setTimeout(() => {
        setIndexing(false);
        setIndexProgress(0);
        setIndexStage("");
      }, 1500);
    }
  }

  async function runBm25() {
    setBm25Loading(true);
    setBm25Result(null);
    try {
      const r = await fetch("/api/search/bm25", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: "demo",
          query,
          topK: settings.bm25TopK,
        }),
      });
      const j = await r.json();
      if (j.passages) {
        setBm25Result(j);
      } else {
        setBm25Result({
          passages: [],
          timing: { totalMs: 0, steps: [] },
        });
      }
    } catch {
      setBm25Result({ passages: [], timing: { totalMs: 0, steps: [] } });
    } finally {
      setBm25Loading(false);
    }
  }

  function startTimer(
    startRef: React.MutableRefObject<number>,
    timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
    setElapsed: (ms: number) => void
  ) {
    startRef.current = performance.now();
    timerRef.current = setInterval(() => {
      setElapsed(performance.now() - startRef.current);
    }, 100);
  }

  function stopTimer(
    timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  ) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function runGemini() {
    geminiAbort.current?.abort();
    stopTimer(geminiTimer);
    const controller = new AbortController();
    geminiAbort.current = controller;
    setGeminiLoading(true);
    setGeminiResult(null);
    setGeminiElapsed(0);
    startTimer(geminiStart, geminiTimer, setGeminiElapsed);
    try {
      const r = await fetch("/api/search/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: "demo", query }),
        signal: controller.signal,
      });
      const j = await r.json();
      if (j.passages) {
        setGeminiResult(j);
      } else if (j.error) {
        setGeminiResult({
          passages: [],
          answer: j.error,
          timing: {
            totalMs: Math.round(performance.now() - geminiStart.current),
            steps: [],
          },
        });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setGeminiResult({
          passages: [],
          answer: e.message || "Request failed",
          timing: {
            totalMs: Math.round(performance.now() - geminiStart.current),
            steps: [],
          },
        });
      }
    } finally {
      stopTimer(geminiTimer);
      setGeminiLoading(false);
    }
  }

  async function runVector() {
    vectorAbort.current?.abort();
    stopTimer(vectorTimer);
    const controller = new AbortController();
    vectorAbort.current = controller;
    setVectorLoading(true);
    setVectorResult(null);
    setVectorElapsed(0);
    startTimer(vectorStart, vectorTimer, setVectorElapsed);
    try {
      const r = await fetch("/api/search/lancedb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: "demo",
          query,
          topK: settings.vectorTopK,
        }),
        signal: controller.signal,
      });
      const j = await r.json();
      if (j.passages) {
        setVectorResult(j);
      } else {
        setVectorResult({
          passages: [],
          timing: { totalMs: 0, steps: [] },
        });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setVectorResult({
          passages: [],
          timing: { totalMs: 0, steps: [] },
        });
      }
    } finally {
      stopTimer(vectorTimer);
      setVectorLoading(false);
    }
  }

  async function runHybrid() {
    hybridAbort.current?.abort();
    stopTimer(hybridTimer);
    const controller = new AbortController();
    hybridAbort.current = controller;
    setHybridLoading(true);
    setHybridResult(null);
    setHybridElapsed(0);
    startTimer(hybridStart, hybridTimer, setHybridElapsed);
    try {
      const r = await fetch("/api/search/hybrid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: "demo",
          query,
          bm25TopK: settings.bm25TopK,
          vectorTopK: settings.vectorTopK,
          rerankTopN: settings.rerankTopN,
        }),
        signal: controller.signal,
      });
      const j = await r.json();
      if (j.passages) {
        setHybridResult(j);
      } else if (j.error) {
        setHybridResult({
          passages: [],
          answer: j.error,
          timing: {
            totalMs: Math.round(performance.now() - hybridStart.current),
            steps: [],
          },
        });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setHybridResult({
          passages: [],
          answer: e.message || "Request failed",
          timing: {
            totalMs: Math.round(performance.now() - hybridStart.current),
            steps: [],
          },
        });
      }
    } finally {
      stopTimer(hybridTimer);
      setHybridLoading(false);
    }
  }

  function runAll() {
    if (!query.trim()) return;
    runBm25();
    runGemini();
    runVector();
    runHybrid();
  }

  function formatTime(ms: number): string {
    if (ms >= 60000) return `${(ms / 60000).toFixed(1)}m`;
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    return `${ms.toFixed(0)}ms`;
  }

  function highlight(text: string): React.ReactNode {
    if (!query.trim()) return text;
    const cleanQuery = query.replace(/^"|"$/g, "");
    const words = cleanQuery
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    if (words.length === 0) return text;
    const pattern = new RegExp(
      `(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
      "gi"
    );
    const parts = text.split(pattern);
    return parts.map((part, i) =>
      pattern.test(part) ? (
        <mark
          key={i}
          style={{
            background: "rgba(108, 92, 231, 0.35)",
            color: "var(--text)",
            borderRadius: 3,
            padding: "1px 2px",
          }}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  function handleLoadSample() {
    fetch("/api/sample-doc")
      .then((r) => r.json())
      .then((j) => {
        if (j.text) setText(j.text);
      });
  }

  function handleSelectQuery(q: string) {
    setQuery(q);
  }

  const docStats = indexInfo || undefined;
  const hybridTrace = hybridResult?.meta?.trace as AgentTrace | undefined;

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
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
          aria-label="View on GitHub"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
        <h1 style={s.title}>BM25 vs Gemini vs Vector vs Hybrid Search</h1>
        <p style={s.subtitle}>
          Compare full-text search, AI retrieval, semantic vectors, and hybrid
          RAG pipelines
        </p>
        <div style={s.infoBox}>
          <p>
            <strong>BM25</strong> is a ranking algorithm built into SQLite via
            its FTS5 engine. It scores documents by term frequency weighted by
            inverse document frequency. Runs locally in milliseconds.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Gemini</strong> reads the full document and reasons about
            your query to produce natural-language answers. Powerful but requires
            a network round-trip.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Vector Search</strong> uses Gemini embeddings + LanceDB
            cosine similarity. Captures semantic meaning beyond exact keyword
            matches.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong style={{ color: "var(--hybrid)" }}>Hybrid</strong> combines
            BM25 + Vector retrieval, deduplicates with Reciprocal Rank Fusion,
            reranks with Gemini, and generates a cited answer. The best of all
            worlds.
          </p>
        </div>
      </header>

      <div style={s.card}>
        <label style={s.label}>Document</label>
        <PresetBar
          onLoadSample={handleLoadSample}
          onSelectQuery={handleSelectQuery}
        />
        <textarea
          style={s.textarea}
          placeholder="Paste a large document here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div
          style={{
            marginTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            style={{
              ...s.btnSecondary,
              position: "relative" as const,
              overflow: "hidden",
              minWidth: 180,
              pointerEvents: indexing ? "none" : undefined,
              borderColor: indexing ? "var(--accent)" : undefined,
            }}
            onClick={indexDoc}
            disabled={indexing}
          >
            {indexing && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${indexProgress}%`,
                  background:
                    "linear-gradient(90deg, rgba(108,92,231,0.25), rgba(162,155,254,0.35))",
                  transition: "width 0.4s ease",
                  borderRadius: 10,
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>
              {indexing ? indexStage : "Index Document"}
            </span>
          </button>
          {indexInfo && <span style={s.indexInfo}>{indexInfo}</span>}
        </div>
      </div>

      <SettingsPanel
        settings={settings}
        onChange={setSettings}
        onReindex={indexDoc}
      />

      <div style={s.card}>
        <label style={s.label}>Search</label>
        <div style={s.searchRow}>
          <input
            style={s.input}
            placeholder='Enter your search query... (use "quotes" for exact phrase)'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runAll();
            }}
          />
          <button style={s.btnPrimary} onClick={runAll}>
            Search
          </button>
        </div>
      </div>

      <div className="search-grid" style={s.grid}>
        <SearchLane
          title="BM25"
          result={bm25Result}
          loading={bm25Loading}
          elapsed={0}
          gradient="linear-gradient(90deg, #6c5ce7, #74b9ff)"
          query={query}
          formatTime={formatTime}
          highlight={highlight}
          docStats={docStats}
        />

        <SearchLane
          title="Gemini"
          result={geminiResult}
          loading={geminiLoading}
          elapsed={geminiElapsed}
          gradient="linear-gradient(90deg, #fd79a8, #e84393)"
          query={query}
          onCancel={() => geminiAbort.current?.abort()}
          formatTime={formatTime}
          highlight={highlight}
        >
          {geminiResult?.answer && (
            <div
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--text-muted)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {geminiResult.answer}
            </div>
          )}
        </SearchLane>

        <SearchLane
          title="Vector Search"
          result={vectorResult}
          loading={vectorLoading}
          elapsed={vectorElapsed}
          gradient="linear-gradient(90deg, #00b894, #55efc4)"
          query={query}
          onCancel={() => vectorAbort.current?.abort()}
          formatTime={formatTime}
          highlight={highlight}
        />

        <SearchLane
          title="Hybrid RAG"
          result={hybridResult}
          loading={hybridLoading}
          elapsed={hybridElapsed}
          gradient="linear-gradient(90deg, #e17055, #fdcb6e)"
          query={query}
          onCancel={() => hybridAbort.current?.abort()}
          formatTime={formatTime}
          highlight={highlight}
        >
          {hybridResult?.answer && (
            <AnswerBlock answer={hybridResult.answer} />
          )}
          {hybridTrace && <AgentTraceBox trace={hybridTrace} />}
        </SearchLane>
      </div>
    </div>
  );
}
