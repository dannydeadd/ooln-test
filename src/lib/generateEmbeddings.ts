// lib/generateEmbeddings.ts
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { intentExamples } from "./intentExamples";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const MODEL = "text-embedding-3-small";

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text, model: MODEL }),
  });

  const json = (await res.json()) as {
    data: { embedding: number[] }[];
  };

  return json.data[0].embedding;
}


async function main() {
  const cache: Record<string, { text: string; embedding: number[] }[]> = {};

  for (const intent of intentExamples) {
    cache[intent.type] = [];
    for (const example of intent.examples) {
      console.log(`Embedding: ${example}`);
      const embedding = await getEmbedding(example);
      cache[intent.type].push({ text: example, embedding });
    }
  }

  const outputPath = path.join(__dirname, "intentEmbeddings.json");
  fs.writeFileSync(outputPath, JSON.stringify(cache, null, 2));
  console.log("✅ Embeddings saved to intentEmbeddings.json");
}

main();
