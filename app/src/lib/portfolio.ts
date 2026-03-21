import { StockHolding } from "./types";

const STORAGE_KEY = "briefing-portfolio";

export function getPortfolio(): StockHolding[] {
  if (typeof window === "undefined") return [];
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

export function savePortfolio(holdings: StockHolding[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
}

export function addHolding(holding: StockHolding): StockHolding[] {
  const portfolio = getPortfolio();
  const existing = portfolio.findIndex((h) => h.ticker === holding.ticker);
  if (existing >= 0) {
    portfolio[existing] = holding;
  } else {
    portfolio.push(holding);
  }
  savePortfolio(portfolio);
  return portfolio;
}

export function removeHolding(ticker: string): StockHolding[] {
  const portfolio = getPortfolio().filter((h) => h.ticker !== ticker);
  savePortfolio(portfolio);
  return portfolio;
}
