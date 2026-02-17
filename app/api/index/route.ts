
import { chunkText, chunkByChapter } from "@/lib/chunk";
import { resetDoc, insertDoc, insertChunkWithMeta, getAllSections } from "@/lib/db";
import { embedTexts } from "@/lib/embeddings";
import { resetLanceTable, insertVectors } from "@/lib/lancedb";
import { SearchSettings, DEFAULT_SETTINGS } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { docId, text, chunkingMode, settings } = body as {
    docId: string;
    text: string;
    chunkingMode?: "fixed" | "chapter";
    settings?: Partial<SearchSettings>;
  };
  if (!docId || !text)
    return new Response(JSON.stringify({ error: "Missing docId/text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  const cfg = { ...DEFAULT_SETTINGS, ...settings };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      const indexStart = performance.now();

      try {
        send({ stage: "chunking", progress: 0 });

        resetDoc(docId);
        insertDoc(docId, text);

        const useChapter =
          chunkingMode === "chapter" || cfg.useChapterChunking;
        const chunks = useChapter
          ? chunkByChapter(text, cfg.chunkSize, cfg.chunkOverlap)
          : chunkText(text, cfg.chunkSize, cfg.chunkOverlap);

        const chunkIds = chunks.map((_, i) => i);
        for (let i = 0; i < chunks.length; i++) {
          insertChunkWithMeta(
            docId,
            chunks[i].text,
            i,
            chunks[i].section,
            chunks[i].charOffset
          );
        }

        send({ stage: "chunked", chunks: chunks.length, progress: 5 });

        // Generate embeddings with progress
        await resetLanceTable(docId);
        const vectors = await embedTexts(
          chunks.map((c) => c.text),
          (embedded, total) => {
            const pct = 5 + Math.round((embedded / total) * 85);
            send({
              stage: "embedding",
              embedded,
              total,
              progress: pct,
            });
          }
        );

        send({ stage: "storing", progress: 92 });
        await insertVectors(docId, chunks, chunkIds, vectors);

        const indexTimeMs = Math.round(performance.now() - indexStart);
        const sections = useChapter ? getAllSections(docId) : undefined;

        send({
          stage: "done",
          progress: 100,
          ok: true,
          chunks: chunks.length,
          indexTimeMs,
          chunkingMode: useChapter ? "chapter" : "fixed",
          sections,
        });
      } catch (e: any) {
        console.error("Indexing error:", e);
        const indexTimeMs = Math.round(performance.now() - indexStart);
        send({
          stage: "error",
          progress: 100,
          ok: true,
          indexTimeMs,
          vectorError: e.message || "Failed to create embeddings",
        });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
