export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between h-12 px-4">
        <h1 className="text-base font-semibold text-[#191919]">{title}</h1>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">AI</span>
        </div>
      </div>
    </header>
  );
}
