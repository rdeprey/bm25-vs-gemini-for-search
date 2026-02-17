"use client";
import { useState } from "react";
import type { SearchSettings } from "@/lib/types";

const s = {
  wrapper: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
  } as React.CSSProperties,
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    cursor: "pointer",
    userSelect: "none" as const,
  } as React.CSSProperties,
  headerTitle: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
  } as React.CSSProperties,
  body: {
    padding: "0 20px 20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 16,
  } as React.CSSProperties,
  group: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  } as React.CSSProperties,
  groupLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  } as React.CSSProperties,
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  } as React.CSSProperties,
  label: {
    fontSize: 13,
    color: "var(--text)",
  } as React.CSSProperties,
  slider: {
    width: 100,
    accentColor: "var(--accent)",
  } as React.CSSProperties,
  value: {
    fontSize: 12,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: "var(--text-muted)",
    minWidth: 36,
    textAlign: "right" as const,
  } as React.CSSProperties,
  checkbox: {
    accentColor: "var(--accent)",
  } as React.CSSProperties,
};

interface SettingsPanelProps {
  settings: SearchSettings;
  onChange: (settings: SearchSettings) => void;
  onReindex?: () => void;
}

export default function SettingsPanel({
  settings,
  onChange,
  onReindex,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  function update(partial: Partial<SearchSettings>) {
    onChange({ ...settings, ...partial });
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header} onClick={() => setOpen(!open)}>
        <span style={s.headerTitle}>
          {open ? "▾" : "▸"} Search Settings
        </span>
      </div>
      {open && (
        <div style={s.body}>
          <div style={s.group}>
            <span style={s.groupLabel}>Chunking</span>
            <div style={s.row}>
              <span style={s.label}>Size</span>
              <input
                type="range"
                min={500}
                max={3000}
                step={100}
                value={settings.chunkSize}
                onChange={(e) =>
                  update({ chunkSize: parseInt(e.target.value) })
                }
                style={s.slider}
              />
              <span style={s.value}>{settings.chunkSize}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Overlap</span>
              <input
                type="range"
                min={0}
                max={500}
                step={50}
                value={settings.chunkOverlap}
                onChange={(e) =>
                  update({ chunkOverlap: parseInt(e.target.value) })
                }
                style={s.slider}
              />
              <span style={s.value}>{settings.chunkOverlap}</span>
            </div>
            <div style={s.row}>
              <label style={s.label}>
                <input
                  type="checkbox"
                  checked={settings.useChapterChunking}
                  onChange={(e) => {
                    update({ useChapterChunking: e.target.checked });
                    if (onReindex) {
                      if (
                        confirm(
                          "Changing chunking mode requires re-indexing. Re-index now?"
                        )
                      ) {
                        onReindex();
                      }
                    }
                  }}
                  style={s.checkbox}
                />{" "}
                Chapter mode
              </label>
            </div>
          </div>

          <div style={s.group}>
            <span style={s.groupLabel}>Retrieval</span>
            <div style={s.row}>
              <span style={s.label}>BM25 topK</span>
              <input
                type="range"
                min={1}
                max={50}
                value={settings.bm25TopK}
                onChange={(e) =>
                  update({ bm25TopK: parseInt(e.target.value) })
                }
                style={s.slider}
              />
              <span style={s.value}>{settings.bm25TopK}</span>
            </div>
            <div style={s.row}>
              <span style={s.label}>Vector topK</span>
              <input
                type="range"
                min={1}
                max={50}
                value={settings.vectorTopK}
                onChange={(e) =>
                  update({ vectorTopK: parseInt(e.target.value) })
                }
                style={s.slider}
              />
              <span style={s.value}>{settings.vectorTopK}</span>
            </div>
          </div>

          <div style={s.group}>
            <span style={s.groupLabel}>Hybrid</span>
            <div style={s.row}>
              <span style={s.label}>Rerank topN</span>
              <input
                type="range"
                min={1}
                max={20}
                value={settings.rerankTopN}
                onChange={(e) =>
                  update({ rerankTopN: parseInt(e.target.value) })
                }
                style={s.slider}
              />
              <span style={s.value}>{settings.rerankTopN}</span>
            </div>
            <div style={s.row}>
              <label style={s.label}>
                <input
                  type="checkbox"
                  checked={settings.includeNeighbors}
                  onChange={(e) =>
                    update({ includeNeighbors: e.target.checked })
                  }
                  style={s.checkbox}
                />{" "}
                Include neighbors
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
