
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDoc } from "@/lib/db";

export async function POST(req: Request) {
  const { docId, query } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 400 });

  const doc = getDoc(docId);
  if (!doc) return NextResponse.json({ error: "Document not indexed" }, { status: 400 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

  const prompt = `
Find excerpts relevant to: "${query}".
Return them verbatim as a bullet list.
Document:
${doc.text}
`;

  try {
    const resp = await model.generateContent(prompt);
    return NextResponse.json({ ok: true, output: resp.response.text() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gemini API error" }, { status: 502 });
  }
}
