"use client";
import type { SearchLaneResult } from "@/lib/types";
import ResultCard from "./ResultCard";
import LatencyPanel from "./LatencyPanel";
import CoOccurrenceSummary from "./CoOccurrenceSummary";

const s = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    minWidth: 0,
  } as React.CSSProperties,
  colHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap" as const,
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
  exactBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    background: "rgba(108, 92, 231, 0.15)",
    border: "1px solid rgba(108, 92, 231, 0.3)",
    color: "var(--accent-2)",
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
    marginLeft: "auto",
  } as React.CSSProperties,
  empty: {
    color: "var(--text-muted)",
    fontSize: 14,
    textAlign: "center" as const,
    padding: 40,
  } as React.CSSProperties,
  warning: {
    background: "rgba(255, 107, 107, 0.1)",
    border: "1px solid rgba(255, 107, 107, 0.2)",
    borderRadius: 8,
    padding: "8px 12px",
    marginBottom: 12,
    fontSize: 12,
    color: "#ff6b6b",
  } as React.CSSProperties,
};

interface SearchLaneProps {
  title: string;
  result: SearchLaneResult | null;
  loading: boolean;
  elapsed: number;
  gradient: string;
  query: string;
  onCancel?: () => void;
  formatTime: (ms: number) => string;
  highlight: (text: string) => React.ReactNode;
  docStats?: string;
  children?: React.ReactNode;
}

export default function SearchLane({
  title,
  result,
  loading,
  elapsed,
  gradient,
  query,
  onCancel,
  formatTime,
  highlight,
  docStats,
  children,
}: SearchLaneProps) {
  const hasResults = result && result.passages.length > 0;
  const bestScore = hasResults
    ? Math.max(...result.passages.map((p) => Math.abs(p.score)))
    : 0;

  const exactHits = (result?.meta?.exactHits as number) ?? 0;
  const verbatimWarnings =
    (result?.meta?.verbatimWarnings as string[]) ?? [];
  const isQuoted = result?.meta?.isQuotedQuery as boolean;

  return (
    <div style={s.card}>
      <div style={s.colHeader}>
        <span style={s.colTitle}>{title}</span>
        {result?.timing && (
          <span style={s.badge}>{formatTime(result.timing.totalMs)}</span>
        )}
        {loading && <span style={s.badge}>{formatTime(elapsed)}</span>}
        {isQuoted && exactHits > 0 && (
          <span style={s.exactBadge}>{exactHits} exact hits</span>
        )}
        {loading && onCancel && (
          <button style={s.btnCancel} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      {verbatimWarnings.length > 0 && (
        <div style={s.warning}>
          {verbatimWarnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}

      {children}

      {!hasResults && !loading && <p style={s.empty}>No results yet</p>}
      {loading && !hasResults && <p style={s.empty}>Searching...</p>}

      {hasResults && result.passages.some((p) => p.section) && (
        <CoOccurrenceSummary passages={result.passages} query={query} />
      )}

      {hasResults &&
        result.passages.map((p, i) => (
          <ResultCard
            key={i}
            passage={p}
            gradient={gradient}
            bestScore={bestScore}
            highlight={highlight}
            isExactHit={
              isQuoted
                ? p.text
                    .toLowerCase()
                    .includes(
                      query
                        .replace(/^"|"$/g, "")
                        .trim()
                        .toLowerCase()
                    )
                : undefined
            }
          />
        ))}

      {result?.timing && (
        <LatencyPanel timing={result.timing} docStats={docStats} />
      )}
    </div>
  );
}
