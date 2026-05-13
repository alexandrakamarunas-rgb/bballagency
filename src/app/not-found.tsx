import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center">
      <div
        className="font-black text-[#C9A96E] leading-none select-none mb-4"
        style={{ fontSize: "clamp(80px, 20vw, 180px)", opacity: 0.15 }}
      >
        404
      </div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 -mt-6 text-white">
        PAGE NOT FOUND
      </h1>
      <p className="text-gray-500 text-sm mb-10 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="px-7 py-3 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors"
        >
          GO HOME
        </Link>
        <Link
          href="/players"
          className="px-7 py-3 border border-white/20 text-white font-bold tracking-[0.2em] uppercase text-sm hover:border-white/40 transition-colors"
        >
          BROWSE PLAYERS
        </Link>
      </div>
    </div>
  );
}
