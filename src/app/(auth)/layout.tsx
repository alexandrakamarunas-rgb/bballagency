import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <div className="px-6 py-6">
        <Link href="/">
          <span className="text-lg font-black tracking-widest">
            <span className="text-white">BBALL</span>
            <span className="text-[#C9A96E]">AGENCY</span>
            <span className="text-white/50">.com</span>
          </span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
