
import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunk";
import { getDb, resetDoc, insertDoc, insertChunk } from "@/lib/db";
import { embedTexts } from "@/lib/embeddings";
import { resetLanceTable, insertVectors } from "@/lib/lancedb";

export async function POST(req: Request) {
  const { docId, text } = await req.json();
  if (!docId || !text) return NextResponse.json({ error: "Missing docId/text" }, { status: 400 });

  resetDoc(docId);
  insertDoc(docId, text);

  const chunks = chunkText(text);
  for (const c of chunks) insertChunk(docId, c);

  // Generate embeddings and store in LanceDB
  try {
    await resetLanceTable(docId);
    const vectors = await embedTexts(chunks);
    await insertVectors(docId, chunks, vectors);
  } catch (e: any) {
    console.error("Embedding/LanceDB error:", e);
    return NextResponse.json({
      ok: true,
      chunks: chunks.length,
      vectorError: e.message || "Failed to create embeddings",
    });
  }

  return NextResponse.json({ ok: true, chunks: chunks.length });
}
