"use client";

const s = {
  wrapper: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    marginRight: 4,
  } as React.CSSProperties,
  chip: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 13,
    color: "var(--text)",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,
  loadBtn: {
    background: "linear-gradient(135deg, #00b894, #55efc4)",
    border: "none",
    borderRadius: 20,
    padding: "6px 16px",
    fontSize: 13,
    fontWeight: 600,
    color: "#0a0a0f",
    cursor: "pointer",
    transition: "opacity 0.2s",
  } as React.CSSProperties,
};

const PRESET_QUERIES = [
  "Who is Dorothy?",
  '"silver shoes"',
  "courage AND lion",
  "How does Dorothy get home?",
];

interface PresetBarProps {
  onLoadSample: () => void;
  onSelectQuery: (query: string) => void;
}

export default function PresetBar({
  onLoadSample,
  onSelectQuery,
}: PresetBarProps) {
  return (
    <div style={s.wrapper}>
      <button
        style={s.loadBtn}
        onClick={onLoadSample}
      >
        Load Wizard of Oz
      </button>
      <span style={s.label}>Presets:</span>
      {PRESET_QUERIES.map((q) => (
        <button
          key={q}
          style={s.chip}
          onClick={() => onSelectQuery(q)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.color = "var(--accent-2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text)";
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
}
