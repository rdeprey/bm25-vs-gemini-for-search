import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Passage } from "./types";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  });
}

export async function rerankPassages(
  query: string,
  passages: Passage[],
  topN: number
): Promise<Passage[]> {
  if (passages.length === 0) return [];

  const model = getModel();

  const passageList = passages
    .map(
      (p, i) =>
        `[${i}] (chunkId=${p.chunkId}) ${p.text.slice(0, 300)}${p.text.length > 300 ? "..." : ""}`
    )
    .join("\n\n");

  const prompt = `You are a search relevance judge. Score each passage for relevance to the query.

Query: "${query}"

Passages:
${passageList}

Return a JSON array of objects with "index" (passage index) and "score" (0-10, where 10 is most relevant).
Return ONLY the JSON array, no other text.
Example: [{"index": 0, "score": 8}, {"index": 1, "score": 3}]`;

  const resp = await model.generateContent(prompt);
  const raw = resp.response.text();

  let scores: Array<{ index: number; score: number }> = [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      scores = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Fallback: return passages in original order
    return passages.slice(0, topN);
  }

  // Sort by score descending and take topN
  const sorted = scores
    .filter((s) => s.index >= 0 && s.index < passages.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return sorted.map((s) => ({
    ...passages[s.index],
    score: s.score / 10, // normalize to 0-1
  }));
}

export async function generateAnswerFromPassages(
  query: string,
  passages: Passage[]
): Promise<string> {
  if (passages.length === 0) return "No relevant passages found.";

  const model = getModel();

  const context = passages
    .map(
      (p) =>
        `[Chunk ${p.chunkId}${p.section ? `, ${p.section}` : ""}]: ${p.text.slice(0, 500)}`
    )
    .join("\n\n");

  const prompt = `Answer the following question using ONLY the provided passages. Cite your sources using [Chunk N] notation.

Question: "${query}"

Passages:
${context}

Provide a concise, well-cited answer:`;

  const resp = await model.generateContent(prompt);
  return resp.response.text();
}
