"use client";

import { useState } from "react";

export default function StockLogo({
  ticker,
  logoUrl,
  size = 24,
}: {
  ticker: string;
  logoUrl?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (!logoUrl || failed) {
    return (
      <span
        className="rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {ticker.slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={logoUrl}
      alt={ticker}
      width={size}
      height={size}
      className="rounded-full object-contain shrink-0 bg-white"
      onError={() => setFailed(true)}
    />
  );
}
