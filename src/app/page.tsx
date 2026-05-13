import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ── DATA ──────────────────────────────────────────────────────────────────────

const stats = [
  {
    value: "120+",
    label: "PLAYERS WORLDWIDE",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    value: "25+",
    label: "COUNTRIES REPRESENTED",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "10+",
    label: "YEARS OF EXPERIENCE",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "100%",
    label: "DEDICATED TO OUR PLAYERS",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const whyChooseUs = [
  {
    title: "Experienced",
    desc: "Over a decade of negotiating contracts at every level of professional basketball.",
  },
  {
    title: "Personalized Approach",
    desc: "Every player gets a tailored strategy built around their unique goals.",
  },
  {
    title: "Global Network",
    desc: "Deep relationships with clubs, scouts, and leagues across 25+ countries.",
  },
  {
    title: "End-to-End Support",
    desc: "From contract talks to relocation — we handle every detail of your career.",
  },
];

const players = [
  { first: "Marcus", last: "JOHNSON", position: "Point Guard", cm: 188, ft: "6'2\"", flag: "🇺🇸", country: "USA" },
  { first: "Aleksander", last: "NOWAK", position: "Small Forward", cm: 201, ft: "6'7\"", flag: "🇵🇱", country: "Poland" },
  { first: "Carlos", last: "MENDEZ", position: "Center", cm: 213, ft: "7'0\"", flag: "🇪🇸", country: "Spain" },
  { first: "Luca", last: "BIANCHI", position: "Shooting Guard", cm: 193, ft: "6'4\"", flag: "🇮🇹", country: "Italy" },
  { first: "Yusuf", last: "OKAFOR", position: "Power Forward", cm: 206, ft: "6'9\"", flag: "🇳🇬", country: "Nigeria" },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      <Header />

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-stretch overflow-hidden">
        {/* Left: content */}
        <div className="relative z-10 flex flex-col justify-center w-full lg:w-1/2 px-6 sm:px-12 lg:px-16 pt-28 pb-20">
          {/* Radial glow behind text */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_20%_50%,_#C9A96E0d_0%,_transparent_70%)] pointer-events-none" />

          <div className="relative">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 border border-[#C9A96E]/30 text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase px-4 py-2 mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse" />
              Elite Basketball Representation
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl xl:text-[5.5rem] font-black tracking-[-0.03em] leading-none mb-8">
              <span className="block text-white">YOUR CAREER.</span>
              <span className="block text-[#C9A96E]">OUR MISSION.</span>
            </h1>

            {/* Subtext */}
            <p className="max-w-md text-gray-400 text-base sm:text-lg leading-relaxed mb-12 tracking-wide">
              <span className="text-white font-semibold">BBALLAGENCY.COM</span> is a
              leading basketball agency representing elite players worldwide.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/players"
                className="px-9 py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors"
              >
                OUR PLAYERS
              </Link>
              <Link
                href="/about"
                className="px-9 py-4 border border-white/25 text-white font-bold tracking-[0.2em] uppercase text-sm hover:border-white/60 hover:bg-white/5 transition-colors"
              >
                ABOUT US
              </Link>
            </div>
          </div>

          {/* Scroll cue */}
          <div className="mt-16 flex items-center gap-3 text-white/20">
            <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
            <span className="text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          </div>
        </div>

        {/* Right: player image placeholder */}
        <div className="hidden lg:block lg:w-1/2 relative">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#161616] via-[#111] to-[#0a0a0a]" />

          {/* Dark overlay gradient bleeding into left */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />

          {/* Court markings */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[210px] rounded-t-full border border-white/[0.07]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[120px] rounded-t-full border border-white/[0.07]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-full border border-white/[0.07]" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-white/[0.05]" />

          {/* Basketball watermark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-64 h-64 opacity-[0.06]" fill="none">
              <circle cx="100" cy="100" r="90" stroke="#C9A96E" strokeWidth="3" />
              <path d="M10 100 Q55 55 100 100 Q145 145 190 100" stroke="#C9A96E" strokeWidth="2" />
              <path d="M10 100 Q55 145 100 100 Q145 55 190 100" stroke="#C9A96E" strokeWidth="2" />
              <path d="M100 10 Q55 55 100 100 Q145 145 100 190" stroke="#C9A96E" strokeWidth="2" />
              <path d="M100 10 Q145 55 100 100 Q55 145 100 190" stroke="#C9A96E" strokeWidth="2" />
            </svg>
          </div>

          {/* Placeholder label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <p className="text-[10px] tracking-[0.5em] uppercase text-white/15">Player Photo</p>
          </div>

          {/* Gold corner brackets */}
          <div className="absolute top-8 right-8 w-10 h-10 border-t-2 border-r-2 border-[#C9A96E]/40" />
          <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-[#C9A96E]/40" />
          <div className="absolute top-8 left-12 w-10 h-10 border-t-2 border-l-2 border-[#C9A96E]/20" />
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {stats.map(({ value, label, icon }) => (
              <div key={label} className="py-10 px-6 flex flex-col items-center text-center gap-3">
                <span className="text-[#C9A96E]">{icon}</span>
                <div className="text-4xl sm:text-5xl font-black text-white tabular-nums">{value}</div>
                <div className="text-[10px] text-[#C9A96E] tracking-[0.2em] uppercase font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THREE COLUMNS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">

          {/* Col 1: About Us */}
          <div className="flex flex-col">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-4">Who We Are</p>
            <h2 className="text-3xl font-black tracking-tight mb-6">ABOUT US</h2>
            <div className="space-y-4 text-gray-400 text-sm leading-relaxed flex-1">
              <p>
                BBALLAGENCY.COM was founded with a single purpose: to give basketball
                players the professional representation they deserve at every stage of
                their career.
              </p>
              <p>
                From emerging talents to seasoned professionals, we provide the
                guidance, connections, and expertise to help athletes reach their
                full potential — on and off the court.
              </p>
            </div>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-[#C9A96E] tracking-widest uppercase group"
            >
              READ MORE
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-white/10 mx-4" />

          {/* Col 2: Why Choose Us */}
          <div className="flex flex-col">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-4">Our Advantage</p>
            <h2 className="text-3xl font-black tracking-tight mb-8">WHY CHOOSE US</h2>
            <ul className="space-y-6 flex-1">
              {whyChooseUs.map(({ title, desc }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border border-[#C9A96E]/50 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-[#C9A96E]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">{title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px bg-white/10 mx-4" />

          {/* Col 3: Teams card */}
          <div className="flex flex-col">
            <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-4">For Clubs & Coaches</p>
            <h2 className="text-3xl font-black tracking-tight mb-6">TEAMS</h2>
            <div className="flex-1 border border-[#C9A96E]/40 p-7 flex flex-col gap-5 relative overflow-hidden">
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 border-b border-l border-[#C9A96E]/20" />

              <p className="text-lg font-black text-white leading-snug">
                LOOKING FOR<br />A PLAYER?
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Browse our full roster of elite players across every position
                and league. Our team is ready to facilitate the right match
                for your club.
              </p>
              <ul className="space-y-2">
                {["All positions available", "25+ nationalities", "All league levels"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="w-1 h-1 rounded-full bg-[#C9A96E]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/players"
                className="mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-xs hover:bg-[#b8935a] transition-colors"
              >
                FIND A PLAYER
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURED PLAYERS ───────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0d0d0d] border-t border-white/10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
              <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-3">Our Roster</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                FEATURED <span className="text-[#C9A96E]">PLAYERS</span>
              </h2>
            </div>
            <Link
              href="/players"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-[#C9A96E] tracking-widest uppercase"
            >
              View All Players
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div className="px-4 sm:px-6 lg:px-8">
          <div
            className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {players.map((player) => (
              <div
                key={player.last}
                className="group flex-shrink-0 w-60 snap-start border border-white/10 bg-[#0a0a0a] hover:border-[#C9A96E]/40 transition-[border-color] duration-200 overflow-hidden cursor-pointer will-change-transform"
              >
                {/* Photo placeholder */}
                <div className="relative h-56 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] flex items-end justify-center overflow-hidden">
                  {/* Court arc */}
                  <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-44 h-22 rounded-t-full border border-white/[0.07]" />
                  {/* Basketball icon */}
                  <svg viewBox="0 0 100 100" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity" fill="none">
                    <circle cx="50" cy="50" r="44" stroke="#C9A96E" strokeWidth="2" />
                    <path d="M6 50 Q28 28 50 50 Q72 72 94 50" stroke="#C9A96E" strokeWidth="1.5" />
                    <path d="M6 50 Q28 72 50 50 Q72 28 94 50" stroke="#C9A96E" strokeWidth="1.5" />
                    <path d="M50 6 Q28 28 50 50 Q72 72 50 94" stroke="#C9A96E" strokeWidth="1.5" />
                    <path d="M50 6 Q72 28 50 50 Q28 72 50 94" stroke="#C9A96E" strokeWidth="1.5" />
                  </svg>
                  {/* Nationality flag */}
                  <div className="absolute top-3 right-3 text-lg" title={player.country}>{player.flag}</div>
                  {/* Gold slide bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A96E] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                </div>

                {/* Info */}
                <div className="p-4">
                  <p className="text-sm text-white/60 font-medium">{player.first}</p>
                  <p className="text-lg font-black text-[#C9A96E] tracking-wide leading-tight mb-3">{player.last}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">{player.position}</p>
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Height</p>
                      <p className="text-xs font-semibold">{player.cm}cm / {player.ft}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">Nation</p>
                      <p className="text-xs font-semibold">{player.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* "View All" card */}
            <div className="flex-shrink-0 w-60 snap-start border border-dashed border-white/10 flex flex-col items-center justify-center gap-4 p-8 cursor-pointer hover:border-[#C9A96E]/30 transition-colors group">
              <div className="w-12 h-12 rounded-full border border-[#C9A96E]/30 flex items-center justify-center group-hover:border-[#C9A96E]/60 transition-colors">
                <svg className="w-5 h-5 text-[#C9A96E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#C9A96E] text-center">View All Players</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,_#C9A96E0a_0%,_transparent_70%)] pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <p className="text-[#C9A96E] text-[10px] tracking-[0.35em] uppercase mb-6">Get In Touch</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none mb-8">
            READY TO TAKE<br />
            <span className="text-[#C9A96E]">THE NEXT STEP?</span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-12 max-w-xl mx-auto">
            Whether you&apos;re a player looking for representation or a club searching
            for talent — we&apos;re here to make it happen.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-10 py-4 bg-[#C9A96E] text-black font-bold tracking-[0.2em] uppercase text-sm hover:bg-[#b8935a] transition-colors"
          >
            CONTACT US
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
