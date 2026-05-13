"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Players", href: "/players" },
  { label: "Teams", href: "/teams" },
  { label: "Positions", href: "/positions" },
  { label: "Agents", href: "/agents" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-lg sm:text-xl font-black tracking-widest">
              <span className="text-white">BBALL</span>
              <span className="text-[#C9A96E]">AGENCY</span>
              <span className="text-white/60">.com</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* JOIN US */}
          <div className="hidden md:block">
            <Link
              href="/register"
              className="px-5 py-2 text-xs font-bold tracking-widest uppercase border border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E] hover:text-black transition-all"
            >
              JOIN US
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-1 text-white"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu — always in DOM, animated with max-height */}
        <div
          className={`md:hidden overflow-hidden transition-[max-height,opacity] duration-250 ease-in-out ${
            open ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="border-t border-white/10 py-5 space-y-3">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="block text-xs font-semibold tracking-widest uppercase text-gray-400 hover:text-white py-1 transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="inline-block mt-2 px-5 py-2 text-xs font-bold tracking-widest uppercase border border-[#C9A96E] text-[#C9A96E]"
            >
              JOIN US
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
