import { GoogleGenerativeAI } from "@google/generative-ai";

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

function getEmbeddingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-embedding-001" });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function batchWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  batch: string[],
): Promise<number[][]> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await model.batchEmbedContents({
        requests: batch.map((text) => ({
          content: { role: "user", parts: [{ text }] },
        })),
      });
      return result.embeddings.map((e) => e.values);
    } catch (e: any) {
      const is429 = e?.status === 429 || e?.message?.includes("429");
      if (is429 && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
  throw new Error("Unreachable");
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getEmbeddingModel();
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const embeddings = await batchWithRetry(model, batch);
    allEmbeddings.push(...embeddings);
    // Pause between batches to avoid rate limits
    if (i + BATCH_SIZE < texts.length) {
      await sleep(500);
    }
  }

  return allEmbeddings;
}

export async function embedQuery(query: string): Promise<number[]> {
  const model = getEmbeddingModel();
  const result = await model.embedContent(query);
  return result.embedding.values;
}
