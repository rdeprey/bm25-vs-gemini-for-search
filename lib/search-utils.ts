import { getDb } from "./db";
import { embedQuery } from "./embeddings";
import { searchVectors } from "./lancedb";
import type { Passage, QueryIntent } from "./types";

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

function sanitizeFts5Query(query: string): string {
  return query
    .replace(/^"|"$/g, "")
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .filter((t) => !STOP_WORDS.has(t))
    .map((term) => `"${term}"`)
    .join(" ");
}

export async function internalBm25Search(
  docId: string,
  query: string,
  topK: number
): Promise<Passage[]> {
  const db = getDb();
  const ftsQuery = sanitizeFts5Query(query);
  if (!ftsQuery) return [];

  const phrase = query.replace(/[^\w\s]/g, "").trim().toLowerCase();

  const rows = db
    .prepare(
      `SELECT f.text, f.chunkId,
        bm25(chunks_fts) - (CASE WHEN instr(lower(f.text), ?) > 0 THEN 5.0 ELSE 0.0 END) as score,
        c.section
      FROM chunks_fts f
      LEFT JOIN chunks c ON c.docId = f.docId AND c.chunkId = f.chunkId
      WHERE f.docId = ? AND chunks_fts MATCH ?
      ORDER BY score ASC
      LIMIT ?`
    )
    .all(phrase, docId, ftsQuery, topK) as Array<{
    text: string;
    chunkId: number;
    score: number;
    section: string | null;
  }>;

  return rows.map((r) => ({
    chunkId: r.chunkId,
    text: r.text,
    score: r.score,
    section: r.section ?? undefined,
  }));
}

export async function internalVectorSearch(
  docId: string,
  query: string,
  topK: number
): Promise<Passage[]> {
  const queryVector = await embedQuery(query);
  const results = await searchVectors(docId, queryVector, topK);
  return results.map((r) => ({
    chunkId: r.chunkId,
    text: r.text,
    score: r.score,
    section: r.section || undefined,
  }));
}

export function mergeAndDeduplicate(
  bm25Results: Passage[],
  vectorResults: Passage[]
): Passage[] {
  // Reciprocal Rank Fusion (RRF) scoring
  const k = 60; // standard RRF constant
  const scoreMap = new Map<number, { passage: Passage; rrfScore: number }>();

  bm25Results.forEach((p, rank) => {
    const rrfContrib = 1 / (k + rank + 1);
    const existing = scoreMap.get(p.chunkId);
    if (existing) {
      existing.rrfScore += rrfContrib;
    } else {
      scoreMap.set(p.chunkId, { passage: p, rrfScore: rrfContrib });
    }
  });

  vectorResults.forEach((p, rank) => {
    const rrfContrib = 1 / (k + rank + 1);
    const existing = scoreMap.get(p.chunkId);
    if (existing) {
      existing.rrfScore += rrfContrib;
    } else {
      scoreMap.set(p.chunkId, { passage: p, rrfScore: rrfContrib });
    }
  });

  return Array.from(scoreMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .map((entry) => ({
      ...entry.passage,
      score: entry.rrfScore,
    }));
}

export function classifyIntent(query: string): QueryIntent {
  const trimmed = query.trim();
  if (/^".*"$/.test(trimmed)) return "quote";
  if (/\b(AND|OR|NOT)\b/.test(trimmed)) return "boolean";
  return "conceptual";
}
