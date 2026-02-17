// Shared types used across the hybrid search application

export interface ChunkMeta {
  chunkId: number;
  section?: string;
  charOffset: number;
}

export interface ChunkWithMeta {
  text: string;
  section?: string;
  charOffset: number;
}

export interface Passage {
  chunkId: number;
  text: string;
  score: number;
  section?: string;
  highlights?: string[];
}

export interface TimingStep {
  label: string;
  durationMs: number;
}

export interface TimingBreakdown {
  totalMs: number;
  steps: TimingStep[];
}

export interface SearchLaneResult {
  passages: Passage[];
  answer?: string;
  timing: TimingBreakdown;
  meta?: Record<string, unknown>;
}

export interface SearchSettings {
  chunkSize: number;
  chunkOverlap: number;
  useChapterChunking: boolean;
  bm25TopK: number;
  vectorTopK: number;
  rerankTopN: number;
  includeNeighbors: boolean;
}

export const DEFAULT_SETTINGS: SearchSettings = {
  chunkSize: 1500,
  chunkOverlap: 200,
  useChapterChunking: false,
  bm25TopK: 10,
  vectorTopK: 10,
  rerankTopN: 5,
  includeNeighbors: false,
};

export type QueryIntent = "quote" | "boolean" | "conceptual";

export interface AgentTraceStep {
  label: string;
  durationMs: number;
  detail?: string;
}

export interface AgentTrace {
  intent: QueryIntent;
  bm25TopK: number;
  vectorTopK: number;
  rerankTopN: number;
  steps: AgentTraceStep[];
}
