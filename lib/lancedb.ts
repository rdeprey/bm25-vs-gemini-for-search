import * as lancedb from "@lancedb/lancedb";
import path from "path";
import fs from "fs";
import { ChunkWithMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "lancedb");

let db: lancedb.Connection | null = null;

export async function getLanceDb() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  db = await lancedb.connect(DATA_DIR);
  return db;
}

function tableName(docId: string) {
  return `chunks_${docId}`;
}

export async function resetLanceTable(docId: string) {
  const db = await getLanceDb();
  const tables = await db.tableNames();
  if (tables.includes(tableName(docId))) {
    await db.dropTable(tableName(docId));
  }
}

export async function insertVectors(
  docId: string,
  chunks: ChunkWithMeta[],
  chunkIds: number[],
  vectors: number[][]
) {
  const db = await getLanceDb();
  const data = chunks.map((chunk, i) => ({
    text: chunk.text,
    vector: vectors[i],
    chunkId: chunkIds[i],
    section: chunk.section ?? "",
  }));
  await db.createTable(tableName(docId), data, { mode: "overwrite" });
}

export async function searchVectors(
  docId: string,
  queryVector: number[],
  limit = 10
): Promise<{ text: string; score: number; chunkId: number; section: string }[]> {
  const db = await getLanceDb();
  const tables = await db.tableNames();
  if (!tables.includes(tableName(docId))) return [];

  const table = await db.openTable(tableName(docId));
  const results = await table
    .vectorSearch(queryVector)
    .distanceType("cosine")
    .limit(limit)
    .toArray();

  return results.map((r: any) => ({
    text: r.text,
    score: 1 - (r._distance ?? 0),
    chunkId: r.chunkId ?? 0,
    section: r.section ?? "",
  }));
}
