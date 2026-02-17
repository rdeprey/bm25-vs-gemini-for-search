"use client";
import { useState } from "react";
import type { AgentTrace } from "@/lib/types";

const s = {
  wrapper: {
    marginTop: 12,
  } as React.CSSProperties,
  toggle: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    fontSize: 11,
    cursor: "pointer",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    padding: "4px 0",
  } as React.CSSProperties,
  box: {
    marginTop: 6,
    padding: "12px 14px",
    background: "#1a1510",
    borderRadius: 8,
    border: "1px solid #3d2e1a",
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    lineHeight: 1.8,
    color: "#fdcb6e",
  } as React.CSSProperties,
  line: {
    display: "block",
  } as React.CSSProperties,
  dim: {
    color: "#8b7355",
  } as React.CSSProperties,
};

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

interface AgentTraceBoxProps {
  trace: AgentTrace;
}

export default function AgentTraceBox({ trace }: AgentTraceBoxProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={s.wrapper}>
      <button style={s.toggle} onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} Agent trace
      </button>
      {open && (
        <div style={s.box}>
          <span style={s.line}>
            <span style={s.dim}>intent:</span> {trace.intent}
          </span>
          <span style={s.line}>
            <span style={s.dim}>bm25TopK:</span> {trace.bm25TopK}{" "}
            <span style={s.dim}>vectorTopK:</span> {trace.vectorTopK}{" "}
            <span style={s.dim}>rerankTopN:</span> {trace.rerankTopN}
          </span>
          <span style={{ ...s.line, marginTop: 8, marginBottom: 4 }}>
            <span style={s.dim}>--- pipeline ---</span>
          </span>
          {trace.steps.map((step, i) => (
            <span key={i} style={s.line}>
              <span style={s.dim}>{i + 1}.</span> {step.label}{" "}
              <span style={s.dim}>({formatMs(step.durationMs)})</span>
              {step.detail && (
                <>
                  <br />
                  <span style={{ ...s.dim, marginLeft: 16 }}>
                    → {step.detail}
                  </span>
                </>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
