
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDoc, getDb } from "@/lib/db";
import type { SearchLaneResult, Passage } from "@/lib/types";

function fuzzyMatchChunk(
  excerpt: string,
  docId: string
): { chunkId: number; section?: string } | null {
  const db = getDb();
  const rows = db
    .prepare("SELECT chunkId, text, section FROM chunks WHERE docId = ?")
    .all(docId) as Array<{
    chunkId: number;
    text: string;
    section: string | null;
  }>;

  const lower = excerpt.toLowerCase().slice(0, 100);
  let bestMatch: (typeof rows)[0] | null = null;
  let bestOverlap = 0;

  for (const row of rows) {
    const rowLower = row.text.toLowerCase();
    if (rowLower.includes(lower)) {
      return { chunkId: row.chunkId, section: row.section ?? undefined };
    }
    // Check word overlap
    const excerptWords = new Set(lower.split(/\s+/));
    const rowWords = rowLower.split(/\s+/);
    let overlap = 0;
    for (const w of rowWords) {
      if (excerptWords.has(w)) overlap++;
    }
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      bestMatch = row;
    }
  }

  if (bestMatch && bestOverlap > 5) {
    return {
      chunkId: bestMatch.chunkId,
      section: bestMatch.section ?? undefined,
    };
  }
  return null;
}

export async function POST(req: Request) {
  const { docId, query } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY" },
      { status: 400 }
    );

  const doc = getDoc(docId);
  if (!doc)
    return NextResponse.json(
      { error: "Document not indexed" },
      { status: 400 }
    );

  const totalStart = performance.now();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });

  const isQuoted = /^".*"$/.test(query.trim());
  const verbatimInstruction = isQuoted
    ? `The query is an exact phrase search. Only return excerpts that contain this EXACT phrase verbatim: ${query}. If no exact matches exist, return an empty array.`
    : "";

  const prompt = `Find excerpts relevant to: "${query}".
${verbatimInstruction}
Return a JSON array of objects with "text" (the verbatim excerpt) and "relevance" (a score from 0 to 1).
Return ONLY the JSON array, no other text.
Example: [{"text": "excerpt here", "relevance": 0.9}]

Document:
${doc.text}`;

  try {
    const apiStart = performance.now();
    const resp = await model.generateContent(prompt);
    const apiMs = performance.now() - apiStart;

    const raw = resp.response.text();

    let parsed: Array<{ text: string; relevance: number }> = [];
    try {
      // Try to extract JSON from response (may have markdown code blocks)
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: parse as bullet list
      const lines = raw
        .split("\n")
        .filter((l) => l.trim().startsWith("-") || l.trim().startsWith("*"));
      parsed = lines.map((l, i) => ({
        text: l.replace(/^[\s*-]+/, "").trim(),
        relevance: 1 - i * 0.1,
      }));
    }

    // Fuzzy-match to chunks and verify verbatim
    const verbatimWarnings: string[] = [];
    const passages: Passage[] = parsed.map((item, i) => {
      const match = fuzzyMatchChunk(item.text, docId);
      if (!doc.text.includes(item.text.slice(0, 50))) {
        verbatimWarnings.push(
          `Excerpt ${i + 1} may not be verbatim from the document`
        );
      }
      return {
        chunkId: match?.chunkId ?? -1,
        text: item.text,
        score: item.relevance,
        section: match?.section,
      };
    });

    const totalMs = Math.round(performance.now() - totalStart);

    const result: SearchLaneResult = {
      passages,
      answer: raw,
      timing: {
        totalMs,
        steps: [
          { label: "Gemini API call", durationMs: Math.round(apiMs) },
          {
            label: "Chunk matching",
            durationMs: Math.round(totalMs - apiMs),
          },
        ],
      },
      meta: {
        verbatimWarnings:
          verbatimWarnings.length > 0 ? verbatimWarnings : undefined,
        isQuotedQuery: isQuoted,
        rawOutput: raw,
      },
    };

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gemini API error" },
      { status: 502 }
    );
  }
}
