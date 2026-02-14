
import { NextResponse } from "next/server";
import { chunkText } from "@/lib/chunk";
import { getDb, resetDoc, insertDoc, insertChunk } from "@/lib/db";

export async function POST(req: Request) {
  const { docId, text } = await req.json();
  if (!docId || !text) return NextResponse.json({ error: "Missing docId/text" }, { status: 400 });

  resetDoc(docId);
  insertDoc(docId, text);

  const chunks = chunkText(text);
  for (const c of chunks) insertChunk(docId, c);

  return NextResponse.json({ ok: true, chunks: chunks.length });
}
