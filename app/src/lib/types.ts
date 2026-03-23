export interface Persona {
  swing: number;
  longTerm: number;
  scalping: number;
  blueChip: number;
  etf: number;
  smallCap: number;
  tech: number;
  dividend: number;
}

export const PERSONA_TRAITS: { key: keyof Persona; label: string; description: string }[] = [
  { key: "swing", label: "스윙매매", description: "수일~수주 단위 매매" },
  { key: "longTerm", label: "장기투자", description: "1년 이상 보유" },
  { key: "scalping", label: "스캘핑", description: "초단타 매매" },
  { key: "blueChip", label: "우량주", description: "대형 안정주 선호" },
  { key: "etf", label: "ETF", description: "지수/섹터 ETF 투자" },
  { key: "smallCap", label: "소형주", description: "성장 잠재력 소형주" },
  { key: "tech", label: "테크주", description: "기술/AI/반도체 섹터" },
  { key: "dividend", label: "배당주", description: "배당 수익 중심" },
];

export const DEFAULT_PERSONA: Persona = {
  swing: 3,
  longTerm: 3,
  scalping: 3,
  blueChip: 3,
  etf: 3,
  smallCap: 3,
  tech: 3,
  dividend: 3,
};

export interface StockHolding {
  ticker: string;
  name: string;
  nameKr: string;
  quantity: number;
  avgPrice?: number;
  logoUrl?: string;
}

export interface StockQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  relatedTickers: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

export interface BriefingCard {
  ticker: string;
  nameKr: string;
  logoUrl?: string;
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  keyPoints: string[];
  proactivesuggestion?: string;
  relatedNews: NewsItem[];
  quote?: StockQuote;
  recentFilings?: SecFiling[];
}

export interface SecFiling {
  id?: string;
  ticker: string;
  cik: string;
  filingType: string;
  filedDate: string;
  title: string;
  accessionNumber: string;
  url: string;
}

export interface DailyBriefing {
  date: string;
  generatedAt: string; // KST ISO string
  greeting: string;
  marketOverview: string;
  cards: BriefingCard[];
  macroAlert?: string;
  source?: "gemini" | "mock";
  dataSource?: "supabase" | "mock";
  cached?: boolean;           // 캐시된 브리핑 여부
  cachedAt?: string;          // 캐시 생성 시각 (KST)
}

export const POPULAR_STOCKS: StockHolding[] = [
  { ticker: "AAPL", name: "Apple Inc.", nameKr: "애플", quantity: 0 },
  { ticker: "MSFT", name: "Microsoft Corp.", nameKr: "마이크로소프트", quantity: 0 },
  { ticker: "NVDA", name: "NVIDIA Corp.", nameKr: "엔비디아", quantity: 0 },
  { ticker: "GOOGL", name: "Alphabet Inc.", nameKr: "알파벳(구글)", quantity: 0 },
  { ticker: "AMZN", name: "Amazon.com Inc.", nameKr: "아마존", quantity: 0 },
  { ticker: "TSLA", name: "Tesla Inc.", nameKr: "테슬라", quantity: 0 },
  { ticker: "META", name: "Meta Platforms Inc.", nameKr: "메타", quantity: 0 },
  { ticker: "AMD", name: "AMD Inc.", nameKr: "AMD", quantity: 0 },
  { ticker: "NFLX", name: "Netflix Inc.", nameKr: "넷플릭스", quantity: 0 },
  { ticker: "COIN", name: "Coinbase Global", nameKr: "코인베이스", quantity: 0 },
];

export interface CompanyProfile {
  ticker: string;
  name: string;
  nameKr: string;
  sector: string;
  marketCap: number;
  logoUrl: string;
  websiteUrl: string;
  tier: 1 | 2 | 3;
}

export interface BasicFinancials {
  ticker: string;
  peRatio: number | null;
  pbRatio: number | null;
  dividendYield: number | null;
  week52High: number;
  week52Low: number;
  marketCap: number;
  beta: number | null;
}

export interface RecommendationTrend {
  ticker: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export interface PriceTarget {
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
}

export interface UpgradeDowngrade {
  ticker: string;
  company: string;
  action: string;
  fromGrade: string;
  toGrade: string;
  gradedAt: string;
}

export interface InsiderTransaction {
  ticker: string;
  personName: string;
  position: string;
  transactionType: string;
  shares: number;
  price: number;
  filedAt: string;
}

export interface EarningsEvent {
  ticker: string;
  reportDate: string;
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: string;
}
