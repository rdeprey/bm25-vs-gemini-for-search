"use client";
import type { Passage } from "@/lib/types";

const s = {
  wrapper: {
    padding: "10px 14px",
    background: "rgba(108, 92, 231, 0.08)",
    border: "1px solid rgba(108, 92, 231, 0.2)",
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 12,
    color: "var(--accent-2)",
    lineHeight: 1.6,
  } as React.CSSProperties,
  sectionName: {
    fontWeight: 600,
  } as React.CSSProperties,
};

interface CoOccurrenceSummaryProps {
  passages: Passage[];
  query: string;
}

export default function CoOccurrenceSummary({
  passages,
  query,
}: CoOccurrenceSummaryProps) {
  // Group passages by section
  const sectionMap = new Map<string, number>();
  for (const p of passages) {
    if (p.section) {
      sectionMap.set(p.section, (sectionMap.get(p.section) || 0) + 1);
    }
  }

  if (sectionMap.size === 0) return null;

  // Check for boolean query co-occurrence
  const isBooleanQuery = /\b(AND|OR)\b/.test(query);
  const queryTerms = query
    .replace(/\b(AND|OR|NOT)\b/g, "")
    .split(/\s+/)
    .filter(Boolean);

  if (isBooleanQuery && queryTerms.length >= 2) {
    // Find sections where multiple terms co-occur
    const coOccurSections: string[] = [];
    for (const [section] of sectionMap) {
      const sectionPassages = passages.filter((p) => p.section === section);
      const combinedText = sectionPassages
        .map((p) => p.text.toLowerCase())
        .join(" ");
      const allPresent = queryTerms.every((t) =>
        combinedText.includes(t.toLowerCase())
      );
      if (allPresent) coOccurSections.push(section);
    }

    if (coOccurSections.length > 0) {
      return (
        <div style={s.wrapper}>
          {queryTerms.join(" + ")} co-occur in:{" "}
          {coOccurSections.map((sec, i) => (
            <span key={i}>
              {i > 0 && ", "}
              <span style={s.sectionName}>{sec}</span>
            </span>
          ))}
        </div>
      );
    }
  }

  // Default: show section distribution
  const entries = Array.from(sectionMap.entries()).sort((a, b) => b[1] - a[1]);
  return (
    <div style={s.wrapper}>
      Results by section:{" "}
      {entries.map(([section, count], i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span style={s.sectionName}>{section}</span> ({count})
        </span>
      ))}
    </div>
  );
}
