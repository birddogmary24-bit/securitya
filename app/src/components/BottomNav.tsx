"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "브리핑", icon: BriefingIcon },
  { href: "/portfolio", label: "관심종목", icon: PortfolioIcon },
  { href: "/filings", label: "공시", icon: FilingsIcon },
  { href: "/persona", label: "투자성향", icon: PersonaIcon },
];

function BriefingIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#B8733A" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function PortfolioIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#B8733A" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function FilingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#B8733A" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="2" y1="13" x2="12" y2="13" />
      <line x1="2" y1="17" x2="10" y2="17" />
    </svg>
  );
}

function PersonaIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#B8733A" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F5EDE6] z-50 max-w-[430px] mx-auto">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 ${
                active ? "text-[#B8733A]" : "text-gray-400"
              }`}
            >
              <Icon active={active} />
              <span className={`text-[11px] font-medium ${active ? "text-[#B8733A]" : ""}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
