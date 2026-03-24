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
    <div className="min-h-screen bg-[#FDF8F3]">
      <Header title="투자 성향 설정" />
      <div className="px-4 py-6">
        <PersonaForm
          initialPersona={initialPersona}
          onSave={handleSave}
          saving={saving}
        />
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
          <div className="w-full max-w-[320px] bg-white rounded-2xl shadow-xl px-6 py-7">
            <div className="text-center mb-3">
              <span className="text-3xl">🐶</span>
            </div>
            <h3 className="text-lg font-extrabold text-center text-[#2C1810] mb-4">
              투자성향을 알려주세요!
            </h3>
            <div className="text-[14px] leading-[1.7] text-gray-500 text-center space-y-1">
              <p>메리가 성향에 딱 맞는 브리핑을 준비할게요!</p>
              <p>고민해볼 포인트까지 짚어드립니다.</p>
            </div>
            <button
              onClick={dismissGuide}
              className="mt-5 w-full py-3 rounded-xl text-[14px] font-bold bg-[#B8733A] text-white active:scale-[0.98] transition-all shadow-sm"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
