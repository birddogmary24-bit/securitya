/**
 * SEC 공시 제목 이중언어(영/한) 매핑
 * 8-K item 번호 → 구체적 설명, 10-K/10-Q → 정적 제목
 */

const ITEM_8K_MAP: Record<string, { en: string; ko: string }> = {
  "1.01": { en: "Entry into Material Definitive Agreement", ko: "주요 계약 체결" },
  "1.02": { en: "Termination of Material Definitive Agreement", ko: "주요 계약 해지" },
  "1.03": { en: "Bankruptcy or Receivership", ko: "파산 또는 관리" },
  "1.04": { en: "Mine Safety", ko: "광산 안전" },
  "2.01": { en: "Completion of Acquisition or Disposition", ko: "인수·처분 완료" },
  "2.02": { en: "Results of Operations and Financial Condition", ko: "영업 실적 발표" },
  "2.03": { en: "Creation of Direct Financial Obligation", ko: "직접 금융 채무 발생" },
  "2.04": { en: "Triggering Events for Acceleration of Obligations", ko: "채무 가속 조건 발생" },
  "2.05": { en: "Costs for Exit or Disposal Activities", ko: "사업 철수·처분 비용" },
  "2.06": { en: "Material Impairments", ko: "중요 자산 손상" },
  "3.01": { en: "Notice of Delisting", ko: "상장 폐지 통보" },
  "3.02": { en: "Unregistered Sales of Equity Securities", ko: "미등록 주식 매도" },
  "3.03": { en: "Material Modification to Rights of Holders", ko: "주주 권리 변경" },
  "4.01": { en: "Changes in Certifying Accountant", ko: "회계 감사인 변경" },
  "4.02": { en: "Non-Reliance on Previously Issued Financials", ko: "기존 재무제표 신뢰 불가" },
  "5.01": { en: "Changes in Control of Registrant", ko: "경영권 변경" },
  "5.02": { en: "Departure/Election of Directors or Officers", ko: "이사·임원 선임/퇴임" },
  "5.03": { en: "Amendments to Articles of Incorporation", ko: "정관 변경" },
  "5.04": { en: "Temporary Suspension of Trading Under Benefit Plans", ko: "복리후생 거래 일시 중단" },
  "5.05": { en: "Amendments to Code of Ethics", ko: "윤리강령 변경" },
  "5.06": { en: "Change in Shell Company Status", ko: "명목회사 지위 변경" },
  "5.07": { en: "Submission of Matters to Vote of Security Holders", ko: "주주 투표 안건 제출" },
  "5.08": { en: "Shareholder Nominations", ko: "주주 이사 후보 추천" },
  "7.01": { en: "Regulation FD Disclosure", ko: "Reg FD 공시" },
  "8.01": { en: "Other Events", ko: "기타 공시" },
  "9.01": { en: "Financial Statements and Exhibits", ko: "재무제표 및 첨부서류" },
};

const FORM_TITLE_MAP: Record<string, { en: string; ko: string }> = {
  "10-K": { en: "Annual Report", ko: "연간 보고서" },
  "10-Q": { en: "Quarterly Report", ko: "분기 보고서" },
};

/**
 * SEC 공시 제목을 이중언어(영/한)로 생성
 * @param form - 공시 유형 (10-K, 10-Q, 8-K)
 * @param items - 8-K item 번호 (쉼표 구분, 예: "2.02,9.01")
 */
export function buildFilingTitle(form: string, items?: string): string {
  // 10-K, 10-Q: 정적 매핑
  const formTitle = FORM_TITLE_MAP[form];
  if (formTitle) {
    return `${formTitle.en} / ${formTitle.ko}`;
  }

  // 8-K: item 번호 기반 제목
  if (form === "8-K" && items) {
    const itemList = items.split(",").map((s) => s.trim()).filter(Boolean);
    // 9.01(첨부서류)은 의미 없으므로 다른 항목 우선
    const meaningful = itemList.filter((i) => i !== "9.01");
    const primaryItem = meaningful[0] ?? itemList[0];

    if (primaryItem) {
      const mapped = ITEM_8K_MAP[primaryItem];
      if (mapped) {
        return `${mapped.en} / ${mapped.ko}`;
      }
    }
  }

  // 폴백: 폼 타입 그대로
  return form;
}
