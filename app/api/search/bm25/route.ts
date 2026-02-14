
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => t.toLowerCase())
    .filter((t) => !STOP_WORDS.has(t))
    .map((term) => `"${term}"`)
    .join(" ");
}

export async function POST(req: Request) {
  const { docId, query } = await req.json();
  const db = getDb();

  const ftsQuery = sanitizeFts5Query(query);
  if (!ftsQuery) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const phrase = query.replace(/[^\w\s]/g, "").trim().toLowerCase();

  const rows = db.prepare(`
    SELECT text,
      bm25(chunks_fts) - (CASE WHEN instr(lower(text), ?) > 0 THEN 5.0 ELSE 0.0 END) as score
    FROM chunks_fts
    WHERE docId = ? AND chunks_fts MATCH ?
    ORDER BY score ASC
    LIMIT 10;
  `).all(phrase, docId, ftsQuery);

  return NextResponse.json({ ok: true, results: rows });
}
