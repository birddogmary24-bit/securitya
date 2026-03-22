import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const CACHE_TTL_DAYS = 90;

// 저렴한 순서로 fallback 체인 (2.5 최신 → 2.0 레거시)
const MODEL_CHAIN = [
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

// SEC 문서에서 텍스트 추출 (HTML 태그 제거, 길이 제한)
function extractText(html: string, maxLength = 15000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

// accession number 추출 (URL에서)
function extractAccessionNumber(url: string): string | null {
  const match = url.match(/(\d{10}-\d{2}-\d{6})/);
  return match ? match[1] : null;
}

export async function POST(request: NextRequest) {
  try {
    const { url, filingType, ticker } = (await request.json()) as {
      url: string;
      filingType: string;
      ticker: string;
    };

    if (!url || !ticker) {
      return Response.json({ error: "url과 ticker가 필요합니다." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "AI API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    // 캐시 조회
    const accessionNumber = extractAccessionNumber(url);
    if (accessionNumber) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - CACHE_TTL_DAYS);

      const { data: cached } = await supabase
        .from("sec_filing_summaries")
        .select("summary, model")
        .eq("accession_number", accessionNumber)
        .gte("created_at", cutoff.toISOString())
        .single();

      if (cached) {
        return Response.json({ summary: cached.summary, model: cached.model, cached: true });
      }
    }

    // SEC 문서 가져오기
    const secRes = await fetch(url, {
      headers: { "User-Agent": "SecurityA-AIBriefing admin@example.com" },
    });

    if (!secRes.ok) {
      return Response.json({ error: `SEC 문서 조회 실패: ${secRes.status}` }, { status: 502 });
    }

    const html = await secRes.text();
    const text = extractText(html);

    if (text.length < 100) {
      return Response.json({ error: "문서에서 충분한 텍스트를 추출할 수 없습니다." }, { status: 422 });
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `다음은 ${ticker}의 SEC ${filingType} 공시 문서 원문 일부입니다. 한국 개인 투자자가 이해하기 쉽게 한국어로 요약해주세요.

## 요약 규칙
- 핵심 내용을 3~5개 항목으로 정리
- 각 항목은 1~2문장으로 간결하게
- 숫자/재무 데이터는 가능한 포함
- 투자 판단에 영향을 줄 수 있는 내용 우선
- 전문 용어는 괄호 안에 한국어 설명 추가
- 마지막에 "⚠️ 이 요약은 AI가 자동 생성한 것으로, 투자 판단의 근거로 사용하지 마세요." 추가

## 문서 원문
${text}`;

    // fallback 체인: 순서대로 시도, 실패 시 다음 모델
    const errors: string[] = [];

    for (const modelName of MODEL_CHAIN) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        // 캐시 저장
        if (accessionNumber) {
          await supabase
            .from("sec_filing_summaries")
            .upsert({
              accession_number: accessionNumber,
              ticker,
              filing_type: filingType,
              summary,
              model: modelName,
            });
        }

        return Response.json({ summary, model: modelName, cached: false });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`Model ${modelName} failed: ${msg}`);
        errors.push(`${modelName}: ${msg}`);
        // 429(쿼터) 또는 404(모델 없음)면 다음 모델로
        if (msg.includes("429") || msg.includes("404") || msg.includes("not found")) {
          continue;
        }
        // 다른 에러(인증 등)는 바로 중단
        break;
      }
    }

    return Response.json(
      { error: `모든 AI 모델이 실패했습니다. 잠시 후 다시 시도해주세요.\n${errors.join("\n")}` },
      { status: 503 }
    );
  } catch (error) {
    console.error("Filing summarize error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
