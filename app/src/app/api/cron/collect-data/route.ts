import { NextRequest } from "next/server";

// 기존 mock 데이터 수집 → Finnhub 배치로 리다이렉트
export async function GET(request: NextRequest) {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const authHeader = request.headers.get("authorization");

  const res = await fetch(`${protocol}://${host}/api/cron/finnhub-collect`, {
    headers: authHeader ? { authorization: authHeader } : {},
  });

  return Response.json(await res.json());
}
