// Index Mover Constituents Data & Mathematical Engine for NIFTY 50, BANK NIFTY & SENSEX

export const RAW_INDEX_CONSTITUENTS = {
  nifty: {
    symbol: 'NIFTY 50',
    basePrice: 26018.70,
    gainersCount: 24,
    losersCount: 25,
    constituents: [
      // Top Positive Contributors (Gainers)
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', weight: 3.4, pChange: 2.55, points: 8.7, price: 1845.50, category: 'Banking', impactPct: 12 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', weight: 7.9, pChange: 0.99, points: 7.8, price: 1225.00, category: 'Banking', impactPct: 9 },
      { symbol: 'POWERGRID', name: 'Power Grid Corp', weight: 2.6, pChange: 2.81, points: 7.3, price: 342.20, category: 'Energy', impactPct: 8 },
      { symbol: 'RELIANCE', name: 'Reliance Industries', weight: 9.6, pChange: 0.56, points: 5.4, price: 3010.50, category: 'Energy', impactPct: 6 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', weight: 11.2, pChange: 0.37, points: 4.1, price: 1658.00, category: 'Banking', impactPct: 5 },
      { symbol: 'NESTLEIND', name: 'Nestle India', weight: 1.2, pChange: 2.92, points: 3.5, price: 2540.00, category: 'FMCG', impactPct: 4 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 3.8, pChange: 0.84, points: 3.2, price: 4215.00, category: 'IT', impactPct: 4 },
      { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv', weight: 1.5, pChange: 1.87, points: 2.8, price: 1720.00, category: 'Finance', impactPct: 3 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', weight: 3.1, pChange: 0.90, points: 2.8, price: 1485.00, category: 'Telecom', impactPct: 3 },
      { symbol: 'AXISBANK', name: 'Axis Bank', weight: 2.8, pChange: 0.86, points: 2.4, price: 1180.00, category: 'Banking', impactPct: 3 },
      { symbol: 'LT', name: 'Larsen & Toubro', weight: 4.2, pChange: 0.50, points: 2.1, price: 3650.00, category: 'Infra', impactPct: 2 },
      { symbol: 'SBIN', name: 'State Bank of India', weight: 2.7, pChange: 0.70, points: 1.9, price: 845.00, category: 'Banking', impactPct: 2 },
      { symbol: 'TITAN', name: 'Titan Company', weight: 1.4, pChange: 1.21, points: 1.7, price: 3480.00, category: 'Consumer', impactPct: 2 },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement', weight: 1.1, pChange: 1.45, points: 1.6, price: 11200.00, category: 'Materials', impactPct: 2 },
      { symbol: 'NTPC', name: 'NTPC Ltd', weight: 1.8, pChange: 0.83, points: 1.5, price: 412.00, category: 'Energy', impactPct: 2 },
      { symbol: 'TATASTEEL', name: 'Tata Steel', weight: 1.3, pChange: 1.08, points: 1.4, price: 165.40, category: 'Metals', impactPct: 2 },
      { symbol: 'ADANIENT', name: 'Adani Enterprises', weight: 0.9, pChange: 1.44, points: 1.3, price: 3180.00, category: 'Metals', impactPct: 2 },
      { symbol: 'GRASIM', name: 'Grasim Industries', weight: 0.8, pChange: 1.50, points: 1.2, price: 2680.00, category: 'Materials', impactPct: 1 },
      { symbol: 'WIPRO', name: 'Wipro Ltd', weight: 0.7, pChange: 1.57, points: 1.1, price: 525.00, category: 'IT', impactPct: 1 },
      { symbol: 'DIVISLAB', name: 'Divis Laboratories', weight: 0.6, pChange: 1.67, points: 1.0, price: 4950.00, category: 'Pharma', impactPct: 1 },
      { symbol: 'CIPLA', name: 'Cipla Ltd', weight: 0.7, pChange: 1.29, points: 0.9, price: 1580.00, category: 'Pharma', impactPct: 1 },
      { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals', weight: 0.6, pChange: 1.33, points: 0.8, price: 6750.00, category: 'Healthcare', impactPct: 1 },
      { symbol: 'M&M', name: 'Mahindra & Mahindra', weight: 2.3, pChange: 0.30, points: 0.7, price: 2790.00, category: 'Auto', impactPct: 1 },
      { symbol: 'EICHERMOT', name: 'Eicher Motors', weight: 0.6, pChange: 0.96, points: 0.6, price: 4890.00, category: 'Auto', impactPct: 1 },

      // Negative Contributors (Losers)
      { symbol: 'INFY', name: 'Infosys Ltd', weight: 5.8, pChange: -2.14, points: -12.4, price: 1812.00, category: 'IT', impactPct: 14 },
      { symbol: 'MARUTI', name: 'Maruti Suzuki', weight: 2.4, pChange: -3.58, points: -8.6, price: 12150.00, category: 'Auto', impactPct: 10 },
      { symbol: 'ITC', name: 'ITC Ltd', weight: 4.1, pChange: -1.56, points: -6.4, price: 498.50, category: 'FMCG', impactPct: 7 },
      { symbol: 'HCLTECH', name: 'HCL Technologies', weight: 1.7, pChange: -3.65, points: -6.2, price: 1740.00, category: 'IT', impactPct: 7 },
      { symbol: 'BRITANNIA', name: 'Britannia Industries', weight: 0.9, pChange: -5.33, points: -4.8, price: 5780.00, category: 'FMCG', impactPct: 5 },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', weight: 2.5, pChange: -1.92, points: -4.8, price: 2790.00, category: 'FMCG', impactPct: 5 },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', weight: 1.6, pChange: -2.56, points: -4.1, price: 1065.00, category: 'Auto', impactPct: 4 },
      { symbol: 'SUNPHARMA', name: 'Sun Pharma', weight: 1.8, pChange: -2.00, points: -3.6, price: 1710.00, category: 'Pharma', impactPct: 4 },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance', weight: 2.1, pChange: -1.52, points: -3.2, price: 6850.00, category: 'Finance', impactPct: 3 },
      { symbol: 'TECHM', name: 'Tech Mahindra', weight: 0.9, pChange: -3.11, points: -2.8, price: 1520.00, category: 'IT', impactPct: 3 },
      { symbol: 'COALINDIA', name: 'Coal India', weight: 0.7, pChange: -3.14, points: -2.2, price: 518.00, category: 'Energy', impactPct: 2 },
      { symbol: 'ONGC', name: 'Oil & Natural Gas Corp', weight: 0.8, pChange: -2.25, points: -1.8, price: 322.00, category: 'Energy', impactPct: 2 },
      { symbol: 'BPCL', name: 'Bharat Petroleum', weight: 0.5, pChange: -3.20, points: -1.6, price: 352.00, category: 'Energy', impactPct: 2 },
      { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp', weight: 0.6, pChange: -2.50, points: -1.5, price: 5240.00, category: 'Auto', impactPct: 2 },
      { symbol: 'TATACONSUMER', name: 'Tata Consumer Products', weight: 0.6, pChange: -2.33, points: -1.4, price: 1160.00, category: 'FMCG', impactPct: 2 },
      { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', weight: 0.9, pChange: -1.44, points: -1.3, price: 9850.00, category: 'Auto', impactPct: 1 },
      { symbol: 'HDFCLIFE', name: 'HDFC Life Insurance', weight: 0.7, pChange: -1.71, points: -1.2, price: 712.00, category: 'Finance', impactPct: 1 },
      { symbol: 'SBILIFE', name: 'SBI Life Insurance', weight: 0.7, pChange: -1.57, points: -1.1, price: 1740.00, category: 'Finance', impactPct: 1 },
      { symbol: 'JSWSTEEL', name: 'JSW Steel', weight: 0.8, pChange: -1.25, points: -1.0, price: 940.00, category: 'Metals', impactPct: 1 },
      { symbol: 'ADANIPORTS', name: 'Adani Ports', weight: 0.9, pChange: -1.00, points: -0.9, price: 1470.00, category: 'Infra', impactPct: 1 },
      { symbol: 'DRREDDY', name: 'Dr Reddys Labs', weight: 0.6, pChange: -1.33, points: -0.8, price: 6880.00, category: 'Pharma', impactPct: 1 },
      { symbol: 'BEL', name: 'Bharat Electronics', weight: 0.8, pChange: -0.88, points: -0.7, price: 295.00, category: 'Capital Goods', impactPct: 1 },
      { symbol: 'TRENT', name: 'Trent Ltd', weight: 1.1, pChange: -0.55, points: -0.6, price: 7120.00, category: 'Retail', impactPct: 1 },
      { symbol: 'SHRIRAMFIN', name: 'Shriram Finance', weight: 0.7, pChange: -0.71, points: -0.5, price: 2890.00, category: 'Finance', impactPct: 1 },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank', weight: 0.8, pChange: -0.50, points: -0.4, price: 1390.00, category: 'Banking', impactPct: 1 }
    ]
  },
  bankNifty: {
    symbol: 'BANK NIFTY',
    basePrice: 52140.80,
    gainersCount: 7,
    losersCount: 5,
    constituents: [
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', weight: 15.2, pChange: 2.55, points: 112.5, price: 1845.50, category: 'Banking', impactPct: 32 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', weight: 23.5, pChange: 0.99, points: 98.4, price: 1225.00, category: 'Banking', impactPct: 28 },
      { symbol: 'AXISBANK', name: 'Axis Bank', weight: 12.8, pChange: 0.86, points: 64.2, price: 1180.00, category: 'Banking', impactPct: 18 },
      { symbol: 'SBIN', name: 'State Bank of India', weight: 11.4, pChange: 0.70, points: 48.0, price: 845.00, category: 'Banking', impactPct: 14 },
      { symbol: 'BANKBARODA', name: 'Bank of Baroda', weight: 3.2, pChange: 1.20, points: 18.5, price: 282.00, category: 'Banking', impactPct: 5 },
      { symbol: 'PNB', name: 'Punjab National Bank', weight: 2.5, pChange: 1.05, points: 12.4, price: 124.50, category: 'Banking', impactPct: 3 },
      { symbol: 'AUBANK', name: 'AU Small Finance Bank', weight: 2.8, pChange: 0.45, points: 8.2, price: 645.00, category: 'Banking', impactPct: 2 },
      
      { symbol: 'HDFCBANK', name: 'HDFC Bank', weight: 28.5, pChange: -0.98, points: -145.2, price: 1658.00, category: 'Banking', impactPct: 62 },
      { symbol: 'INDUSINDBK', name: 'IndusInd Bank', weight: 5.6, pChange: -1.78, points: -52.0, price: 1390.00, category: 'Banking', impactPct: 22 },
      { symbol: 'IDFCFIRSTB', name: 'IDFC First Bank', weight: 2.1, pChange: -1.65, points: -18.2, price: 78.40, category: 'Banking', impactPct: 8 },
      { symbol: 'FEDERALBNK', name: 'Federal Bank', weight: 2.6, pChange: -0.62, points: -8.5, price: 198.00, category: 'Banking', impactPct: 5 },
      { symbol: 'BANDHANBNK', name: 'Bandhan Bank', weight: 1.8, pChange: -0.42, points: -3.1, price: 205.00, category: 'Banking', impactPct: 3 }
    ]
  },
  sensex: {
    symbol: 'SENSEX',
    basePrice: 80640.20,
    gainersCount: 16,
    losersCount: 14,
    constituents: [
      { symbol: 'RELIANCE', name: 'Reliance Industries', weight: 12.5, pChange: 0.85, points: 85.5, price: 3010.50, category: 'Energy', impactPct: 15 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank', weight: 13.8, pChange: 0.55, points: 61.2, price: 1658.00, category: 'Banking', impactPct: 11 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank', weight: 9.8, pChange: 0.65, points: 51.4, price: 1225.00, category: 'Banking', impactPct: 9 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', weight: 4.8, pChange: 0.90, points: 34.8, price: 4215.00, category: 'IT', impactPct: 6 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel', weight: 3.9, pChange: 1.10, points: 34.5, price: 1485.00, category: 'Telecom', impactPct: 6 },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank', weight: 4.2, pChange: 0.82, points: 27.8, price: 1845.50, category: 'Banking', impactPct: 5 },
      { symbol: 'LT', name: 'Larsen & Toubro', weight: 5.2, pChange: 0.60, points: 25.1, price: 3650.00, category: 'Infra', impactPct: 4 },
      { symbol: 'SBIN', name: 'State Bank of India', weight: 3.4, pChange: 0.75, points: 20.6, price: 845.00, category: 'Banking', impactPct: 4 },
      { symbol: 'AXISBANK', name: 'Axis Bank', weight: 3.5, pChange: 0.68, points: 19.2, price: 1180.00, category: 'Banking', impactPct: 3 },
      { symbol: 'POWERGRID', name: 'Power Grid Corp', weight: 2.1, pChange: 1.15, points: 19.5, price: 342.20, category: 'Energy', impactPct: 3 },

      { symbol: 'INFY', name: 'Infosys Ltd', weight: 7.2, pChange: -1.85, points: -107.5, price: 1812.00, category: 'IT', impactPct: 38 },
      { symbol: 'ITC', name: 'ITC Ltd', weight: 5.1, pChange: -1.10, points: -45.2, price: 498.50, category: 'FMCG', impactPct: 16 },
      { symbol: 'HCLTECH', name: 'HCL Technologies', weight: 2.2, pChange: -1.75, points: -31.0, price: 1740.00, category: 'IT', impactPct: 11 },
      { symbol: 'MARUTI', name: 'Maruti Suzuki', weight: 3.1, pChange: -1.20, points: -30.0, price: 12150.00, category: 'Auto', impactPct: 11 },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', weight: 3.1, pChange: -0.85, points: -21.2, price: 2790.00, category: 'FMCG', impactPct: 8 },
      { symbol: 'TATAMOTORS', name: 'Tata Motors', weight: 2.0, pChange: -1.30, points: -20.9, price: 1065.00, category: 'Auto', impactPct: 7 }
    ]
  }
};

/**
 * Calculates derived Index Mover metrics for a given dataset
 */
export function computeIndexMoverState(rawIndexData) {
  const constituents = rawIndexData.constituents.map(c => {
    // If points are positive, it's a gainer, else loser
    const isGainer = c.points >= 0;
    return {
      ...c,
      isGainer
    };
  });

  const gainers = constituents.filter(c => c.isGainer).sort((a, b) => b.points - a.points);
  const losers = constituents.filter(c => !c.isGainer).sort((a, b) => a.points - b.points);

  const totalGainPoints = Math.round(gainers.reduce((acc, g) => acc + g.points, 0) * 10) / 10;
  const totalLossPoints = Math.round(losers.reduce((acc, l) => acc + Math.abs(l.points), 0) * 10) / 10;

  const netPoints = Math.round((totalGainPoints - totalLossPoints) * 100) / 100;
  const indexPrice = Math.round((rawIndexData.basePrice + netPoints) * 10) / 10;
  const pChange = Math.round(((netPoints / rawIndexData.basePrice) * 100) * 100) / 100;

  // Recalculate impact percentage dynamically
  const gainersWithImpact = gainers.map(g => ({
    ...g,
    impactPct: totalGainPoints > 0 ? Math.round((g.points / totalGainPoints) * 100) : 0
  }));

  const losersWithImpact = losers.map(l => ({
    ...l,
    impactPct: totalLossPoints > 0 ? Math.round((Math.abs(l.points) / totalLossPoints) * 100) : 0
  }));

  return {
    symbol: rawIndexData.symbol,
    indexPrice,
    netPoints,
    pChange,
    gainersCount: gainers.length,
    losersCount: losers.length,
    totalGainPoints,
    totalLossPoints,
    gainers: gainersWithImpact,
    losers: losersWithImpact,
    allConstituents: [...gainersWithImpact, ...losersWithImpact]
  };
}
