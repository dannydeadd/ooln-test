import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parseCSV } from '@/lib/tradingAnalysis';
import { matchIntent } from '@/lib/intentRouter';

export async function POST(req: NextRequest) {
  try {
    const { userMessage } = await req.json();
    const filePath = path.join(process.cwd(), 'public', 'Trades_sample.csv');
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const trades = parseCSV(csvContent);

    const intent = matchIntent(userMessage, trades);

    // Helper
    const parseAmount = (val: string) =>
      Number(val.replace(/[$,]/g, '').replace(/[()]/g, m => (m === '(' ? '-' : '')) || '0');

    const totalDeposits = trades
      .filter(t => t.description.toLowerCase().includes("deposit"))
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);

    const totalWithdrawals = trades
      .filter(t =>
        t.description.toLowerCase().includes("withdraw") ||
        (parseAmount(t.amount) < 0 && t.description.toLowerCase().includes("ach"))
      )
      .reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);

    const netProfit = trades.reduce((sum, t) => sum + parseAmount(t.amount), 0);

    const closedTrades = trades.filter(t =>
      ["STC", "SELL", "BTO", "BUY"].includes(t.transCode)
    );
    const wins = closedTrades.filter(t => parseAmount(t.amount) > 0).length;
    const totalClosed = closedTrades.length;
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    const mostProfitableTrade = trades
      .filter(t =>
        parseAmount(t.amount) > 0 &&
        !t.description.toLowerCase().includes("deposit") &&
        !t.description.toLowerCase().includes("ach")
      )
      .sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount))[0];

    const losses = trades.filter(t => parseAmount(t.amount) < 0);
    const expired = losses.filter(t => t.description.toLowerCase().includes("expire"));
    const totalLoss = losses.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
    const expiredLoss = expired.reduce((sum, t) => sum + Math.abs(parseAmount(t.amount)), 0);
    const expiredLossPercent = totalLoss ? (expiredLoss / totalLoss) * 100 : 0;

    const roi = totalDeposits > 0 ? (netProfit / totalDeposits) * 100 : 0;

    switch (intent.type) {
      case "deposit":
        return NextResponse.json({ aiResponse: `A total of $${intent.value.toFixed(2)} was deposited.` });
      case "withdrawal":
        return NextResponse.json({ aiResponse: `A total of $${intent.value.toFixed(2)} was withdrawn.` });
      case "profit":
        return NextResponse.json({ aiResponse: `Your net realized profit/loss is $${intent.value.toFixed(2)}.` });
      case "winRate":
        return NextResponse.json({ aiResponse: `Your win rate is ${intent.value.toFixed(2)}%.` });
      case "positionSize":
        return NextResponse.json({ aiResponse: `Your average position size is $${intent.value.toFixed(2)}.` });
      case "tradeCount":
        return NextResponse.json({ aiResponse: `You made a total of ${intent.value} trades.` });
      case "mostProfitable":
        return NextResponse.json({
          aiResponse: `Your most profitable trade was "${intent.description}", earning $${intent.value.toFixed(2)}.`
        });
      case "expiredLossPercent":
        return NextResponse.json({
          aiResponse: `${intent.value.toFixed(2)}% of total losses came from options that expired worthless.`
        });

      case "fallback":
      default:
        console.log("[Fallback] Unmatched user question:", userMessage);

        const fallbackPrompt = `
The user asked: "${userMessage}"

Here is a summary of the trade data:

- Total Deposits: $${totalDeposits.toFixed(2)}
- Total Withdrawals: $${totalWithdrawals.toFixed(2)}
- Net Profit/Loss: $${netProfit.toFixed(2)}
- Win Rate: ${winRate.toFixed(2)}%
- ROI: ${roi.toFixed(2)}%
- Most Profitable Trade: ${mostProfitableTrade?.description || "N/A"} ($${mostProfitableTrade ? parseAmount(mostProfitableTrade.amount).toFixed(2) : "0.00"})
- % of Losses from Expired Options: ${expiredLossPercent.toFixed(2)}%

---

Please answer the user's question using only the summary above.

Speak like a professional financial advisor coaching a retail trader. Be constructive, concise, and encouraging.

Use clean Markdown formatting, and split sections like this, dont forget to leave space between every section:

**Position Sizing**
- ...

**Leverage Control**
- ...

**Risk Management**
- ...
`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": req.headers.get("origin") || "",
            "X-Title": "Ooln"
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3-0324:free",
            messages: [{ role: "user", content: fallbackPrompt }]
          })
        });

        const data = await response.json();
        return NextResponse.json({ aiResponse: data.choices?.[0]?.message?.content });
    }
  } catch (error) {
    console.error('Error handling trading question:', error);
    return NextResponse.json({ error: 'Failed to process trading analysis' }, { status: 500 });
  }
}
