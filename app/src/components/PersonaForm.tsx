"use client";

import { useState } from "react";
import { Persona, PERSONA_TRAITS, DEFAULT_PERSONA } from "@/lib/types";

interface PersonaFormProps {
  initialPersona?: Persona;
  onSave: (persona: Persona) => void;
  saving?: boolean;
}

export default function PersonaForm({ initialPersona, onSave, saving }: PersonaFormProps) {
  const [persona, setPersona] = useState<Persona>(initialPersona ?? DEFAULT_PERSONA);

  function handleChange(key: keyof Persona, value: number) {
    setPersona((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold text-[#2C1810]">나의 투자 성향</h2>
        <p className="text-[14px] text-gray-400 mt-1">각 항목을 1~5로 설정해주세요</p>
      </div>

      <div className="space-y-5">
        {PERSONA_TRAITS.map((trait) => (
          <div key={trait.key} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-[14px] font-semibold text-[#2C1810]">{trait.label}</span>
                <span className="text-[13px] text-gray-400 ml-2">{trait.description}</span>
              </div>
              <span className="text-[14px] font-bold text-[#B8733A] min-w-[24px] text-right">
                {persona[trait.key]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={persona[trait.key]}
              onChange={(e) => handleChange(trait.key, Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#B8733A]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-gray-300">낮음</span>
              <span className="text-[11px] text-gray-300">높음</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSave(persona)}
        disabled={saving}
        className={`w-full py-3.5 rounded-xl text-[14px] font-bold transition-all ${
          saving
            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
            : "bg-[#B8733A] text-white active:scale-[0.98] shadow-sm"
        }`}
      >
        {saving ? "저장 중..." : "설정 완료"}
      </button>
    </div>
  );
}
