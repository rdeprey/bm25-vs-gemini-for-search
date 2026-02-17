"use client";
import type { Passage } from "@/lib/types";

const s = {
  card: {
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
  chunkBadge: {
    fontSize: 10,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: "var(--text-muted)",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "1px 5px",
    marginLeft: 6,
  } as React.CSSProperties,
  sectionTag: {
    fontSize: 10,
    color: "var(--accent-2)",
    marginBottom: 6,
    fontWeight: 600,
  } as React.CSSProperties,
};

interface ResultCardProps {
  passage: Passage;
  gradient: string;
  bestScore: number;
  highlight: (text: string) => React.ReactNode;
  isExactHit?: boolean;
}

export default function ResultCard({
  passage,
  gradient,
  bestScore,
  highlight,
  isExactHit,
}: ResultCardProps) {
  const pct = bestScore ? Math.round(Math.abs(passage.score / bestScore) * 100) : 0;

  return (
    <div
      style={{
        ...s.card,
        borderColor: isExactHit ? "var(--accent)" : undefined,
      }}
    >
      {passage.section && <div style={s.sectionTag}>{passage.section}</div>}
      <div style={s.scoreRow}>
        <div style={s.barTrack}>
          <div
            style={{
              width: `${Math.min(pct, 100)}%`,
              height: "100%",
              borderRadius: 3,
              background: gradient,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <span style={s.scoreMeta}>
          {passage.score.toFixed(passage.score < 1 ? 4 : 2)} ({Math.min(pct, 100)}%)
        </span>
        {passage.chunkId >= 0 && (
          <span style={s.chunkBadge}>#{passage.chunkId}</span>
        )}
      </div>
      <div style={s.resultText}>{highlight(passage.text)}</div>
    </div>
  );
}
