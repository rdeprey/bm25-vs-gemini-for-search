"use client";

const s = {
  wrapper: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  } as React.CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    marginBottom: 8,
  } as React.CSSProperties,
  text: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "var(--text)",
    whiteSpace: "pre-wrap" as const,
  } as React.CSSProperties,
  citation: {
    background: "rgba(108, 92, 231, 0.2)",
    color: "var(--accent-2)",
    borderRadius: 3,
    padding: "1px 4px",
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    cursor: "pointer",
  } as React.CSSProperties,
};

interface AnswerBlockProps {
  answer: string;
  onCitationClick?: (chunkId: number) => void;
}

export default function AnswerBlock({
  answer,
  onCitationClick,
}: AnswerBlockProps) {
  // Parse [Chunk N] citations and make them clickable
  const parts = answer.split(/(\[Chunk \d+\])/g);

  return (
    <div style={s.wrapper}>
      <div style={s.label}>Generated Answer</div>
      <div style={s.text}>
        {parts.map((part, i) => {
          const match = part.match(/\[Chunk (\d+)\]/);
          if (match) {
            const chunkId = parseInt(match[1], 10);
            return (
              <span
                key={i}
                style={s.citation}
                onClick={() => onCitationClick?.(chunkId)}
                title={`Jump to chunk ${chunkId}`}
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    </div>
  );
}
