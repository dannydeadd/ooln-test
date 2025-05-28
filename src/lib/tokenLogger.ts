import { encode } from 'gpt-3-encoder';

type ModelName = "text-embedding-3-small" | "gpt-4" | "gpt-4-32k" | "gpt-3.5-turbo";

const PRICE_PER_1K: Record<ModelName, number> = {
  "text-embedding-3-small": 0.00002,
  "gpt-4": 0.03,
  "gpt-4-32k": 0.06,
  "gpt-3.5-turbo": 0.0015
};

export function estimateTokens(text: string): number {
  return encode(text).length;
}

export function estimateCost(tokens: number, model: ModelName): number {
  const price = PRICE_PER_1K[model];
  return (tokens / 1000) * price;
}

export function logTokenUsage(text: string, model: ModelName) {
  const tokens = estimateTokens(text);
  const cost = estimateCost(tokens, model);
  console.log(`[💰] ${model}: ${tokens} tokens → ~$${cost.toFixed(6)}`);
  return { tokens, cost };
}
