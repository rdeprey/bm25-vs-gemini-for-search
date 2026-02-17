
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "demo.db");

let db: Database.Database;

export function getDb() {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS docs (
      docId TEXT PRIMARY KEY,
      text TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
      docId UNINDEXED,
      chunkId UNINDEXED,
      text,
      tokenize = 'unicode61'
    );

    CREATE TABLE IF NOT EXISTS chunks (
      chunkId INTEGER NOT NULL,
      docId TEXT NOT NULL,
      text TEXT NOT NULL,
      section TEXT,
      charOffset INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (docId, chunkId)
    );
  `);

  return db;
}

export function resetDoc(docId: string) {
  const db = getDb();
  db.prepare("DELETE FROM docs WHERE docId = ?").run(docId);
  db.prepare("DELETE FROM chunks_fts WHERE docId = ?").run(docId);
  resetChunks(docId);
}

export function resetChunks(docId: string) {
  const db = getDb();
  db.prepare("DELETE FROM chunks WHERE docId = ?").run(docId);
}

export function insertDoc(docId: string, text: string) {
  const db = getDb();
  db.prepare("INSERT INTO docs (docId, text) VALUES (?, ?)").run(docId, text);
}

export function insertChunk(docId: string, text: string) {
  const db = getDb();
  db.prepare(
    "INSERT INTO chunks_fts (docId, chunkId, text) VALUES (?, 0, ?)"
  ).run(docId, text);
}

export function insertChunkWithMeta(
  docId: string,
  text: string,
  chunkId: number,
  section?: string,
  charOffset?: number
) {
  const db = getDb();
  db.prepare(
    "INSERT INTO chunks_fts (docId, chunkId, text) VALUES (?, ?, ?)"
  ).run(docId, chunkId, text);
  db.prepare(
    "INSERT INTO chunks (chunkId, docId, text, section, charOffset) VALUES (?, ?, ?, ?, ?)"
  ).run(chunkId, docId, text, section ?? null, charOffset ?? 0);
}

export function getDoc(docId: string) {
  const db = getDb();
  return db.prepare("SELECT text FROM docs WHERE docId = ?").get(docId) as
    | { text: string }
    | undefined;
}

export function getChunkById(docId: string, chunkId: number) {
  const db = getDb();
  return db
    .prepare("SELECT * FROM chunks WHERE docId = ? AND chunkId = ?")
    .get(docId, chunkId) as
    | {
        chunkId: number;
        docId: string;
        text: string;
        section: string | null;
        charOffset: number;
      }
    | undefined;
}

export function getChunkNeighbors(docId: string, chunkId: number, range = 1) {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM chunks WHERE docId = ? AND chunkId BETWEEN ? AND ? ORDER BY chunkId"
    )
    .all(docId, chunkId - range, chunkId + range) as Array<{
    chunkId: number;
    docId: string;
    text: string;
    section: string | null;
    charOffset: number;
  }>;
}

export function getChunksBySection(docId: string, section: string) {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM chunks WHERE docId = ? AND section = ? ORDER BY chunkId"
    )
    .all(docId, section) as Array<{
    chunkId: number;
    docId: string;
    text: string;
    section: string | null;
    charOffset: number;
  }>;
}

export function getAllSections(docId: string): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT section, MIN(chunkId) as minId FROM chunks WHERE docId = ? AND section IS NOT NULL GROUP BY section ORDER BY minId"
    )
    .all(docId) as Array<{ section: string; minId: number }>;
  return rows.map((r) => r.section);
}
