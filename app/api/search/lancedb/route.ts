import { NextResponse } from "next/server";
import { embedQuery } from "@/lib/embeddings";
import { searchVectors } from "@/lib/lancedb";

export async function POST(req: Request) {
  const { docId, query } = await req.json();
  if (!docId || !query) return NextResponse.json({ error: "Missing docId/query" }, { status: 400 });

  try {
    const queryVector = await embedQuery(query);
    const results = await searchVectors(docId, queryVector);
    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Vector search error" }, { status: 500 });
  }
}
