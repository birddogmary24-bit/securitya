"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PersonaForm from "@/components/PersonaForm";
import { Persona } from "@/lib/types";
import { getPersona, savePersona, getUserId } from "@/lib/persona";

const POPUP_DISMISSED_KEY = "persona_guide_dismissed";

export default function PersonaPage() {
  const router = useRouter();
  const [initialPersona, setInitialPersona] = useState<Persona | undefined>();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getPersona();
    if (existing) setInitialPersona(existing);

    if (!localStorage.getItem(POPUP_DISMISSED_KEY)) {
      setShowGuide(true);
    }
  }, []);

  function dismissGuide() {
    localStorage.setItem(POPUP_DISMISSED_KEY, "true");
    setShowGuide(false);
  }

  async function handleSave(persona: Persona) {
    setSaving(true);
    try {
      // localStorage에 즉시 저장
      savePersona(persona);

      // Supabase에 비동기 저장 (실패해도 localStorage로 동작)
      const userId = getUserId();
      await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, persona }),
      }).catch((err) => console.error("Persona sync error:", err));

      router.push("/");
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header title="투자 성향 설정" />
      <div className="px-4 py-6">
        <PersonaForm
          initialPersona={initialPersona}
          onSave={handleSave}
          saving={saving}
        />
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in duration-200">
            <h3
              className="text-xl font-bold text-center text-[#191919] mb-4"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              투자성향 입력하기
            </h3>
            <p className="text-[15px] leading-relaxed text-gray-600 text-center">
              투자성향을 입력하면, 그에 맞는 전략을 수시로 제안하고,
              반대로 검토해봐야 할 보완점까지 제안해줍니다.
              <br className="hidden sm:block" />
              투자 성공을 위해 Agent의 다양한 투자조언을 들어보세요!
            </p>
            <button
              onClick={dismissGuide}
              className="mt-6 w-full py-3 rounded-xl text-sm font-semibold bg-[#FEE500] text-[#191919] active:scale-[0.98] transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
