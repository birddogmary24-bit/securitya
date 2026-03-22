import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

    // SEC 문서 가져오기
    const secRes = await fetch(url, {
      headers: { "User-Agent": "KakaoPaySecurityAI admin@example.com" },
    });

    if (!secRes.ok) {
      return Response.json({ error: `SEC 문서 조회 실패: ${secRes.status}` }, { status: 502 });
    }

    const html = await secRes.text();
    const text = extractText(html);

    if (text.length < 100) {
      return Response.json({ error: "문서에서 충분한 텍스트를 추출할 수 없습니다." }, { status: 422 });
    }

    // Gemini 1.5 Flash로 요약
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return Response.json({ summary });
  } catch (error) {
    console.error("Filing summarize error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
