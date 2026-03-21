import { Persona, DEFAULT_PERSONA } from "./types";

const PERSONA_KEY = "briefing-persona";
const USER_ID_KEY = "briefing-user-id";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getPersona(): Persona | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem(PERSONA_KEY);
  return saved ? JSON.parse(saved) : null;
}

export function savePersona(persona: Persona): void {
  localStorage.setItem(PERSONA_KEY, JSON.stringify(persona));
}

export function hasPersona(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PERSONA_KEY) !== null;
}
