import { NextResponse } from "next/server";
import {
  internalBm25Search,
  internalVectorSearch,
  mergeAndDeduplicate,
  classifyIntent,
} from "@/lib/search-utils";
import { rerankPassages, generateAnswerFromPassages } from "@/lib/rerank";
import type { SearchLaneResult, AgentTrace, AgentTraceStep } from "@/lib/types";

export async function POST(req: Request) {
  const { docId, query, bm25TopK, vectorTopK, rerankTopN } = await req.json();
  if (!docId || !query)
    return NextResponse.json(
      { error: "Missing docId/query" },
      { status: 400 }
    );

  const bK = bm25TopK || 10;
  const vK = vectorTopK || 10;
  const rN = rerankTopN || 5;

  const totalStart = performance.now();
  const traceSteps: AgentTraceStep[] = [];

  // Step 1: Classify intent
  const intentStart = performance.now();
  const intent = classifyIntent(query);
  const intentMs = performance.now() - intentStart;
  traceSteps.push({
    label: "Classify intent",
    durationMs: Math.round(intentMs),
    detail: `Intent: ${intent}`,
  });

  // Step 2: Run BM25 + Vector in parallel
  const retrievalStart = performance.now();
  const [bm25Results, vectorResults] = await Promise.all([
    internalBm25Search(docId, query, bK),
    internalVectorSearch(docId, query, vK),
  ]);
  const retrievalMs = performance.now() - retrievalStart;
  traceSteps.push({
    label: "Parallel retrieval (BM25 + Vector)",
    durationMs: Math.round(retrievalMs),
    detail: `BM25: ${bm25Results.length} results, Vector: ${vectorResults.length} results`,
  });

  // Step 3: Merge + deduplicate with RRF
  const mergeStart = performance.now();
  const merged = mergeAndDeduplicate(bm25Results, vectorResults);
  const mergeMs = performance.now() - mergeStart;
  traceSteps.push({
    label: "Merge + RRF deduplicate",
    durationMs: Math.round(mergeMs),
    detail: `${merged.length} unique passages`,
  });

  // Step 4: Rerank with Gemini
  const rerankStart = performance.now();
  let reranked = merged;
  try {
    // Only rerank if we have enough passages
    const toRerank = merged.slice(0, 20); // cap at 20
    reranked = await rerankPassages(query, toRerank, rN);
    const rerankMs = performance.now() - rerankStart;
    traceSteps.push({
      label: "Gemini rerank",
      durationMs: Math.round(rerankMs),
      detail: `Reranked ${toRerank.length} → top ${reranked.length}`,
    });
  } catch (e: any) {
    const rerankMs = performance.now() - rerankStart;
    traceSteps.push({
      label: "Gemini rerank (failed, using RRF order)",
      durationMs: Math.round(rerankMs),
      detail: e.message,
    });
    reranked = merged.slice(0, rN);
  }

  // Step 5: Generate answer with citations
  const answerStart = performance.now();
  let answer = "";
  try {
    answer = await generateAnswerFromPassages(query, reranked);
    const answerMs = performance.now() - answerStart;
    traceSteps.push({
      label: "Generate answer",
      durationMs: Math.round(answerMs),
    });
  } catch (e: any) {
    const answerMs = performance.now() - answerStart;
    traceSteps.push({
      label: "Generate answer (failed)",
      durationMs: Math.round(answerMs),
      detail: e.message,
    });
  }

  const totalMs = Math.round(performance.now() - totalStart);

  const trace: AgentTrace = {
    intent,
    bm25TopK: bK,
    vectorTopK: vK,
    rerankTopN: rN,
    steps: traceSteps,
  };

  const result: SearchLaneResult = {
    passages: reranked,
    answer: answer || undefined,
    timing: {
      totalMs,
      steps: traceSteps.map((s) => ({
        label: s.label,
        durationMs: s.durationMs,
      })),
    },
    meta: { trace },
  };

  return NextResponse.json(result);
}
