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

  // Check for expired losses (includes expiring, expired, etc.)
  if (
    (q.includes("expire") || q.includes("expired") || q.includes("expiration") || q.includes("expiring")) &&
    (q.includes("loss") || q.includes("option") || q.includes("percentage"))
  ) {
    // Find all expired options (OEXP transactions)
    const expiredOptions = trades.filter(t => t.transCode === "OEXP");
    
    // Calculate total cost of expired options by matching with their BTO transactions
    let totalExpiredCost = 0;
    
    expiredOptions.forEach(expired => {
      // Find matching BTO transactions for this expired option
      const matchingBTOs = trades.filter(t => 
        t.transCode === "BTO" && 
        areOptionsMatching(t.description, expired.description)
      );
      
      // Sum up the cost of all matching BTO transactions
      matchingBTOs.forEach(bto => {
        totalExpiredCost += Math.abs(parseAmount(bto.amount));
      });
    });
    
    // Calculate total money spent on positions that resulted in losses
    // (BTO cost for positions that either expired or were sold at a loss)
    
    let totalMoneyOnLosingPositions = totalExpiredCost; // Start with expired costs
    
    // Find positions that were closed at a loss
    const positionMap = new Map();
    
    trades.forEach(trade => {
      if (trade.transCode === "BTO" || trade.transCode === "STC") {
        const key = trade.description;
        if (!positionMap.has(key)) {
          positionMap.set(key, { btoCost: 0, stcRevenue: 0, expired: false });
        }
        const pos = positionMap.get(key);
        
        if (trade.transCode === "BTO") {
          pos.btoCost += Math.abs(parseAmount(trade.amount));
        } else if (trade.transCode === "STC") {
          pos.stcRevenue += parseAmount(trade.amount);
        }
      }
    });
    
    // Mark expired positions
    expiredOptions.forEach(expired => {
      if (positionMap.has(expired.description)) {
        positionMap.get(expired.description).expired = true;
      }
    });
    
    // Add BTO costs for positions that were closed at a loss (but not expired)
    positionMap.forEach((pos, description) => {
      if (!pos.expired && pos.stcRevenue > 0) {
        const netResult = pos.stcRevenue - pos.btoCost;
        if (netResult < 0) { // Position resulted in a loss
          totalMoneyOnLosingPositions += pos.btoCost;
        }
      }
    });
    
    const percent = totalMoneyOnLosingPositions > 0 ? (totalExpiredCost / totalMoneyOnLosingPositions) * 100 : 0;
    return { type: "expiredLossPercent", value: percent };
  }

  // Generic profit/loss question — intentionally placed *after* specific loss checks
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

// Helper function to match option descriptions
function areOptionsMatching(btoDescription: string, expiredDescription: string): boolean {
  const bto = btoDescription.toLowerCase();
  const exp = expiredDescription.toLowerCase();
  
  // Extract key components: symbol, date, type (put/call), strike
  const extractOptionDetails = (desc: string) => {
    const match = desc.match(/(\w+)\s+(\d+\/\d+\/\d+)\s+(put|call)\s+\$?([\d,]+\.?\d*)/);
    return match ? {
      symbol: match[1],
      date: match[2],
      type: match[3],
      strike: match[4].replace(/,/g, '')
    } : null;
  };
  
  const btoDetails = extractOptionDetails(bto);
  const expDetails = extractOptionDetails(exp);
  
  if (!btoDetails || !expDetails) return false;
  
  return (
    btoDetails.symbol === expDetails.symbol &&
    btoDetails.date === expDetails.date &&
    btoDetails.type === expDetails.type &&
    btoDetails.strike === expDetails.strike
  );
}

function parseAmount(value: string): number {
  return Number(value.replace(/[$,]/g, '').replace(/[()]/g, m => (m === '(' ? '-' : '')) || '0');
}