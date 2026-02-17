"use client";
import { useState } from "react";
import type { TimingBreakdown } from "@/lib/types";

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
  tree: {
    marginTop: 6,
    padding: "8px 12px",
    background: "var(--surface-2)",
    borderRadius: 8,
    border: "1px solid var(--border)",
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  } as React.CSSProperties,
  step: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2px 0",
  } as React.CSSProperties,
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
    borderBottom: "1px solid var(--border)",
    marginBottom: 4,
    fontWeight: 700,
  } as React.CSSProperties,
};

function durationColor(ms: number): string {
  if (ms < 100) return "#00b894";
  if (ms < 1000) return "#fdcb6e";
  return "#ff6b6b";
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

interface LatencyPanelProps {
  timing: TimingBreakdown;
  docStats?: string;
}

export default function LatencyPanel({ timing, docStats }: LatencyPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div style={s.wrapper}>
      <button style={s.toggle} onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} Latency breakdown
      </button>
      {open && (
        <div style={s.tree}>
          <div style={s.totalRow}>
            <span>Total</span>
            <span style={{ color: durationColor(timing.totalMs) }}>
              {formatMs(timing.totalMs)}
            </span>
          </div>
          {timing.steps.map((step, i) => (
            <div key={i} style={s.step}>
              <span style={{ color: "var(--text-muted)" }}>├─ {step.label}</span>
              <span style={{ color: durationColor(step.durationMs) }}>
                {formatMs(step.durationMs)}
              </span>
            </div>
          ))}
          {docStats && (
            <div
              style={{
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontSize: 11,
              }}
            >
              {docStats}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
