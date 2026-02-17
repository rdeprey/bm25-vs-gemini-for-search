
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { SearchLaneResult, Passage } from "@/lib/types";

const STOP_WORDS = new Set([
  "a","an","the","is","are","was","were","be","been","being",
  "do","does","did","will","would","shall","should","may","might",
  "can","could","has","have","had","having","i","me","my","we","our",
  "you","your","he","him","his","she","her","it","its","they","them",
  "their","what","which","who","whom","this","that","these","those",
  "am","in","on","at","to","for","of","with","by","from","as","into",
  "about","between","through","during","before","after","above","below",
  "and","but","or","nor","not","no","so","if","then","than","too",
  "very","just","where","when","how","why",
]);

function isQuotedQuery(query: string): boolean {
  return /^".*"$/.test(query.trim());
}

function sanitizeFts5Query(query: string, phraseMode: boolean): string {
  const cleaned = query.replace(/^"|"$/g, "").replace(/[^\w\s]/g, "");
  if (phraseMode) {
    const words = cleaned.split(/\s+/).filter(Boolean);
    return `"${words.join(" ")}"`;
  }
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .filter((t) => !STOP_WORDS.has(t))
    .map((term) => `"${term}"`)
    .join(" ");
}

export async function POST(req: Request) {
  const { docId, query, topK } = await req.json();
  const db = getDb();
  const limit = topK || 10;
  const totalStart = performance.now();

  const quoted = isQuotedQuery(query);
  const ftsQuery = sanitizeFts5Query(query, quoted);
  if (!ftsQuery) {
    return NextResponse.json({
      passages: [],
      timing: { totalMs: 0, steps: [] },
      meta: {},
    } satisfies SearchLaneResult);
  }

  const phrase = query.replace(/[^\w\s]/g, "").trim().toLowerCase();

  const queryStart = performance.now();
  const rows = db.prepare(`
    SELECT f.text, f.chunkId,
      bm25(chunks_fts) - (CASE WHEN instr(lower(f.text), ?) > 0 THEN 5.0 ELSE 0.0 END) as score,
      c.section, c.charOffset
    FROM chunks_fts f
    LEFT JOIN chunks c ON c.docId = f.docId AND c.chunkId = f.chunkId
    WHERE f.docId = ? AND chunks_fts MATCH ?
    ORDER BY score ASC
    LIMIT ?;
  `).all(phrase, docId, ftsQuery, limit) as Array<{
    text: string;
    chunkId: number;
    score: number;
    section: string | null;
    charOffset: number | null;
  }>;
  const queryMs = performance.now() - queryStart;

  let exactHits = 0;
  let firstOccurrenceChunkId: number | undefined;
  if (quoted) {
    const exactPhrase = query.replace(/^"|"$/g, "").trim().toLowerCase();
    for (const row of rows) {
      if (row.text.toLowerCase().includes(exactPhrase)) {
        exactHits++;
        if (firstOccurrenceChunkId === undefined) {
          firstOccurrenceChunkId = row.chunkId;
        }
      }
    }
  }

  const passages: Passage[] = rows.map((r) => ({
    chunkId: r.chunkId,
    text: r.text,
    score: r.score,
    section: r.section ?? undefined,
  }));

  const totalMs = Math.round(performance.now() - totalStart);

  const result: SearchLaneResult = {
    passages,
    timing: {
      totalMs,
      steps: [{ label: "FTS5 query", durationMs: Math.round(queryMs) }],
    },
    meta: {
      exactHits: quoted ? exactHits : undefined,
      firstOccurrenceChunkId,
      isQuotedQuery: quoted,
    },
  };

  return NextResponse.json(result);
}
