import rawIntentEmbeddings from "./intentEmbeddings.json";

type IntentEmbedding = {
  text: string;
  embedding: number[];
};

const intentEmbeddings: Record<string, IntentEmbedding[]> = rawIntentEmbeddings as Record<string, IntentEmbedding[]>;


// Function to embed the user query using OpenAI
async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: "text-embedding-3-small"
    })
  });

  const json = await res.json();
  return json.data[0].embedding;
}

// Cosine similarity function
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

// Flattened cache of all examples and their embeddings
const cachedExamples: { type: string; text: string; embedding: number[] }[] = [];

for (const type in intentEmbeddings) {
  for (const entry of intentEmbeddings[type]) {
    cachedExamples.push({ type, text: entry.text, embedding: entry.embedding });
  }
}

// Main function: classify user intent
export async function classifyIntent(userMessage: string): Promise<{ type: string; score: number }> {
  const userEmbedding = await getEmbedding(userMessage);
  let bestIntent = { type: "fallback", score: 0.7 };

  for (const { type, text, embedding } of cachedExamples) {
    const score = cosineSimilarity(userEmbedding, embedding);
    console.log(`[🧠] "${userMessage}" vs "${text}" → ${type} (score: ${score.toFixed(4)})`);

    if (score > bestIntent.score) {
      bestIntent = { type, score };
    }
  }

  console.log(`[✅] Chosen Intent: ${bestIntent.type} (score: ${bestIntent.score.toFixed(4)})`);
  return bestIntent;
}
