import { NextResponse } from "next/server";
import { embedQuery } from "@/lib/embeddings";
import { searchVectors } from "@/lib/lancedb";
import type { SearchLaneResult, Passage } from "@/lib/types";

export async function POST(req: Request) {
  const { docId, query, topK } = await req.json();
  if (!docId || !query)
    return NextResponse.json(
      { error: "Missing docId/query" },
      { status: 400 }
    );

  const limit = topK || 10;
  const totalStart = performance.now();

  try {
    const embedStart = performance.now();
    const queryVector = await embedQuery(query);
    const embedMs = performance.now() - embedStart;

    const searchStart = performance.now();
    const results = await searchVectors(docId, queryVector, limit);
    const searchMs = performance.now() - searchStart;

    const passages: Passage[] = results.map((r) => ({
      chunkId: r.chunkId,
      text: r.text,
      score: r.score,
      section: r.section || undefined,
    }));

    const totalMs = Math.round(performance.now() - totalStart);

    const result: SearchLaneResult = {
      passages,
      timing: {
        totalMs,
        steps: [
          { label: "Embed query", durationMs: Math.round(embedMs) },
          { label: "Vector search", durationMs: Math.round(searchMs) },
        ],
      },
    };

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Vector search error" },
      { status: 500 }
    );
  }
}
