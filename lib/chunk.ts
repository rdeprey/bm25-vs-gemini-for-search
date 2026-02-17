
import { ChunkWithMeta } from "./types";

export function chunkText(
  text: string,
  size = 1500,
  overlap = 0
): ChunkWithMeta[] {
  const chunks: ChunkWithMeta[] = [];
  let i = 0;
  const step = Math.max(1, size - overlap);
  while (i < text.length) {
    chunks.push({
      text: text.slice(i, i + size),
      charOffset: i,
    });
    i += step;
  }
  return chunks;
}

const CHAPTER_RE = /^(Chapter\s+[IVXLCDM]+[.\s].*)/im;

export function chunkByChapter(
  text: string,
  maxChunkSize = 3000,
  overlap = 200
): ChunkWithMeta[] {
  const parts = text.split(CHAPTER_RE);
  const chapters: { section: string; text: string; offset: number }[] = [];

  let currentSection = "Preamble";
  let charOffset = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (CHAPTER_RE.test(part)) {
      currentSection = part.trim();
    } else if (part.trim()) {
      chapters.push({
        section: currentSection,
        text: part,
        offset: text.indexOf(part, charOffset),
      });
    }
    charOffset += part.length;
  }

  const result: ChunkWithMeta[] = [];
  for (const ch of chapters) {
    if (ch.text.length <= maxChunkSize) {
      result.push({
        text: ch.text,
        section: ch.section,
        charOffset: ch.offset,
      });
    } else {
      const step = Math.max(1, maxChunkSize - overlap);
      let j = 0;
      while (j < ch.text.length) {
        result.push({
          text: ch.text.slice(j, j + maxChunkSize),
          section: ch.section,
          charOffset: ch.offset + j,
        });
        j += step;
      }
    }
  }

  return result;
}
