
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
      text,
      tokenize = 'unicode61'
    );
  `);

  return db;
}

export function resetDoc(docId: string) {
  const db = getDb();
  db.prepare("DELETE FROM docs WHERE docId = ?").run(docId);
  db.prepare("DELETE FROM chunks_fts WHERE docId = ?").run(docId);
}

export function insertDoc(docId: string, text: string) {
  const db = getDb();
  db.prepare("INSERT INTO docs (docId, text) VALUES (?, ?)").run(docId, text);
}

export function insertChunk(docId: string, text: string) {
  const db = getDb();
  db.prepare("INSERT INTO chunks_fts (docId, text) VALUES (?, ?)").run(docId, text);
}

export function getDoc(docId: string) {
  const db = getDb();
  return db.prepare("SELECT text FROM docs WHERE docId = ?").get(docId) as any;
}
