import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { Persona } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userId, persona } = (await request.json()) as {
      userId: string;
      persona: Persona;
    };

    if (!userId || !persona) {
      return Response.json({ error: "userId와 persona가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabase.from("user_personas").upsert(
      {
        user_id: userId,
        swing: persona.swing,
        long_term: persona.longTerm,
        scalping: persona.scalping,
        blue_chip: persona.blueChip,
        etf: persona.etf,
        small_cap: persona.smallCap,
        tech: persona.tech,
        dividend: persona.dividend,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Persona save error:", error);
      return Response.json({ error: "페르소나 저장 실패" }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Persona API error:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return Response.json({ error: "userId가 필요합니다." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("user_personas")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return Response.json({ persona: null });
    }

    const persona: Persona = {
      swing: data.swing,
      longTerm: data.long_term,
      scalping: data.scalping,
      blueChip: data.blue_chip,
      etf: data.etf,
      smallCap: data.small_cap,
      tech: data.tech,
      dividend: data.dividend,
    };

    return Response.json({ persona });
  } catch (error) {
    console.error("Persona GET error:", error);
    return Response.json({ error: "서버 오류" }, { status: 500 });
  }
}
