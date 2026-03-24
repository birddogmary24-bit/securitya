export default function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#F5EDE6]">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🐶</span>
          <h1 className="text-[17px] font-bold text-[#2C1810]">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#B8733A] bg-[#FFF5EC] px-2.5 py-1 rounded-full font-semibold border border-[#B8733A]/20">AI</span>
        </div>
      </div>
    </header>
  );
}
