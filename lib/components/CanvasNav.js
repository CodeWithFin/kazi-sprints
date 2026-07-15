'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CanvasNav({ activePath = '/' }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return activePath === '/';
    return activePath.startsWith(path);
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: 'home' },
    { href: '/admin', label: 'Admin Panel', icon: 'admin', requiresAuth: true },
    { href: '/login', label: 'Log In', icon: 'login' },
  ];

  return (
    <>
      <header className="canvas-nav">
        <div className="canvas-nav-left">
          <Link className="canvas-logo-wrap" href="/" aria-label="Sprints Home">
            <span className="canvas-logo">S</span>
          </Link>

          <nav className="canvas-menu" aria-label="Main navigation">
            <Link href="/" className={activePath === '/' ? 'is-active' : ''}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                <path d="M12 3 3 10.8V21h6v-6h6v6h6V10.8L12 3Z" />
              </svg>
              Home
            </Link>

            <Link href="/login?role=admin" className={isActive('/admin') ? 'is-active' : ''}>
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Admin
            </Link>

            <Link href="/login?role=client">
              <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                <circle cx="9" cy="8" r="4" />
                <path d="M2 21c0-4 3-7 7-7s7 3 7 7Z" />
                <path d="M17 11a4 4 0 0 0 0-7" />
                <path d="M17 14c3 1 5 3 5 7" />
              </svg>
              Portal
            </Link>
          </nav>
        </div>

        <div className="canvas-nav-right">
          <Link className="canvas-login" href="/login">Log in</Link>
          <Link className="canvas-top-cta" href="/login?role=admin">Dashboard</Link>
        </div>

        <button
          className="canvas-mobile-menu"
          aria-label="Toggle menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="fixed top-24 left-0 right-0 bg-white border-b border-neutral-200 z-50 p-6 flex flex-col gap-4 shadow-lg md:hidden" style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}>
          <Link href="/" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Home</Link>
          <Link href="/login?role=admin" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
          <Link href="/login?role=client" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Client Portal</Link>
          <div className="flex gap-4 mt-2">
            <Link href="/login" className="flex-1 text-center py-3 border border-neutral-950 font-bold uppercase text-lg" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link href="/login?role=admin" className="flex-1 text-center py-3 bg-[#13a8ff] text-white font-bold uppercase text-lg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
          </div>
        </div>
      )}
    </>
  );
}
