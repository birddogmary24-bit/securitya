"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import PersonaForm from "@/components/PersonaForm";
import { Persona } from "@/lib/types";
import { getPersona, savePersona, getUserId } from "@/lib/persona";

export default function PersonaPage() {
  const router = useRouter();
  const [initialPersona, setInitialPersona] = useState<Persona | undefined>();
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getPersona();
    if (existing) setInitialPersona(existing);
  }, []);

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
    </div>
  );
}
