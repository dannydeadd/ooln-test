export type IntentResult =
  | { type: "deposit"; value: number }
  | { type: "withdrawal"; value: number }
  | { type: "profit"; value: number }
  | { type: "winRate"; value: number }
  | { type: "positionSize"; value: number }
  | { type: "tradeCount"; value: number }
  | { type: "mostProfitable"; description: string; value: number }
  | { type: "expiredLossPercent"; value: number }
  | { type: "fallback" };

export function matchIntent(question: string, trades: any[]): IntentResult {
  const q = question.toLowerCase();

  // Check for deposit
  if (q.includes("deposit")) {
    const value = trades
      .filter(t => t.description.toLowerCase().includes("deposit"))
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    return { type: "deposit", value };
  }

  // Check for withdrawal
  if (q.includes("withdrawal")) {
    const value = trades
      .filter(t =>
        t.description.toLowerCase().includes("withdraw") ||
        (parseAmount(t.amount) < 0 && t.description.toLowerCase().includes("ach"))
      )
      .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
    return { type: "withdrawal", value };
  }

  // Check for most profitable trade
  if (
    q.includes("most profitable") ||
    q.includes("best trade") ||
    q.includes("top trade") ||
    q.includes("highest profit")
  ) {
    const profitable = trades
      .filter(t =>
        parseAmount(t.amount) > 0 &&
        !t.description.toLowerCase().includes("deposit") &&
        !t.description.toLowerCase().includes("ach")
      )
      .sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount))[0];

    if (profitable) {
      return {
        type: "mostProfitable",
        description: profitable.description,
        value: parseAmount(profitable.amount),
      };
    }
  }

  // Check for expired losses
  if (
    q.includes("expired") &&
    (q.includes("loss") || q.includes("option") || q.includes("percentage") || q.includes("expire"))
  ) {
    const losses = trades.filter(t => parseAmount(t.amount) < 0);
    const expired = losses.filter(t => t.description.toLowerCase().includes("expire"));
    const lossSum = losses.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
    const expiredSum = expired.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
    const percent = lossSum ? (expiredSum / lossSum) * 100 : 0;
    return { type: "expiredLossPercent", value: percent };
  }

  // Generic profit/loss question
  if (q.includes("profit") || q.includes("loss")) {
    const value = trades.reduce((sum, t) => sum + parseAmount(t.amount), 0);
    return { type: "profit", value };
  }

  // Win rate
  if (q.includes("win rate")) {
    const wins = trades.filter(t => parseAmount(t.amount) > 0).length;
    const total = trades.filter(t => t.transCode === "STC").length;
    const rate = total > 0 ? (wins / total) * 100 : 0;
    return { type: "winRate", value: rate };
  }

  // Average position size
  if (q.includes("average") && q.includes("position")) {
    const filled = trades.filter(t => parseAmount(t.amount) !== 0);
    const value = filled.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0) / (filled.length || 1);
    return { type: "positionSize", value };
  }

  // Trade count
  if (q.includes("how many trades") || q.includes("number of trades")) {
    return { type: "tradeCount", value: trades.length };
  }

  console.log("Matched intent: fallback");
  return { type: "fallback" };
}

function parseAmount(value: string): number {
  return Number(value.replace(/[$,]/g, '').replace(/[()]/g, m => (m === '(' ? '-' : '')) || '0');
}
