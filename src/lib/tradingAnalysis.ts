// lib/tradingAnalysis.ts
import Papa from 'papaparse';

export function parseCSV(csvString: string) {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row: any) => ({
    date: row['Activity Date'],
    description: row['Description'] || '',
    transCode: row['Trans Code'] || '',
    quantity: parseFloat(row['Quantity']) || 0,
    price: parseFloat(row['Price']) || 0,
    amount: row['Amount'] || '$0.00'
  }));
}
