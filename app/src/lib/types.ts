export interface StockHolding {
  ticker: string;
  name: string;
  nameKr: string;
  quantity: number;
  avgPrice?: number;
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
  sentiment: "positive" | "negative" | "neutral";
  summary: string;
  keyPoints: string[];
  proactivesuggestion?: string;
  relatedNews: NewsItem[];
  quote?: StockQuote;
}

export interface DailyBriefing {
  date: string;
  generatedAt: string; // KST ISO string
  greeting: string;
  marketOverview: string;
  cards: BriefingCard[];
  macroAlert?: string;
  source?: "gemini" | "mock";
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
