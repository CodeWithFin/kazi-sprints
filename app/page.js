'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white text-neutral-950 antialiased min-h-screen" style={{ fontFamily: "'Comic Neue', cursive" }}>
      <main className="overflow-hidden bg-white">
        <section className="canvas-hero" style={{ background: 'rgb(255, 255, 255)' }}>
          
          {/* Header/Nav */}
          <header className="canvas-nav">
            <div className="canvas-nav-left">
              <Link className="canvas-logo-wrap" href="/" aria-label="Canvas Home">
                <span className="canvas-logo">C</span>
              </Link>

              <nav className="canvas-menu" aria-label="Main navigation">
                <Link href="/" className="is-active">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                    <path d="M12 3 3 10.8V21h6v-6h6v6h6V10.8L12 3Z"></path>
                  </svg>
                  Home
                </Link>

                <a href="#features">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                    <circle cx="7" cy="7" r="3"></circle>
                    <circle cx="17" cy="7" r="3"></circle>
                    <circle cx="7" cy="17" r="3"></circle>
                    <circle cx="17" cy="17" r="3"></circle>
                  </svg>
                  Features
                </a>

                <Link href="/login?role=admin">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  </svg>
                  Admin Panel
                </Link>

                <Link href="/login?role=client">
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" aria-hidden="true">
                    <circle cx="9" cy="8" r="4"></circle>
                    <path d="M2 21c0-4 3-7 7-7s7 3 7 7Z"></path>
                    <path d="M17 11a4 4 0 0 0 0-7"></path>
                    <path d="M17 14c3 1 5 3 5 7"></path>
                  </svg>
                  Client Portal
                </Link>
              </nav>
            </div>

            <div className="canvas-nav-right">
              <Link className="canvas-login" href="/login">Log in</Link>
              <Link className="canvas-top-cta" href="/login?role=admin">Start for free</Link>
            </div>

            <button 
              className="canvas-mobile-menu" 
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12"></path>
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </header>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-20 left-0 right-0 bg-white border-b border-neutral-200 z-50 p-6 flex flex-col gap-4 shadow-lg md:hidden" style={{ fontFamily: "'Patrick Hand', 'Inter', sans-serif" }}>
              <Link href="/" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <a href="#features" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <Link href="/login?role=admin" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
              <Link href="/login?role=client" className="text-xl font-bold uppercase py-2 border-b border-neutral-100" onClick={() => setMobileMenuOpen(false)}>Client Portal</Link>
              <div className="flex gap-4 mt-2">
                <Link href="/login" className="flex-1 text-center py-3 border border-neutral-950 font-bold uppercase text-lg" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
                <Link href="/login?role=admin" className="flex-1 text-center py-3 bg-[#13a8ff] text-white font-bold uppercase text-lg" onClick={() => setMobileMenuOpen(false)}>Start for free</Link>
              </div>
            </div>
          )}

          {/* Canvas Stage */}
          <div className="canvas-stage">
            
            {/* Floating Notes */}
            <div className="canvas-floating-note note-green">
              <span className="canvas-tape"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="8" cy="8" r="3"></circle>
                <path d="M2 21c0-4 2.7-7 6-7s6 3 6 7"></path>
                <circle cx="17" cy="9" r="2.6"></circle>
                <path d="M15 15c3.5.7 5.5 3 5.5 6"></path>
              </svg>
              <span className="font-medium text-lg leading-tight">
                Real-time
                <br />
                collaboration
              </span>
            </div>

            <div className="canvas-floating-note note-orange">
              <span className="canvas-tape"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
              </svg>
              <span className="font-medium text-lg leading-tight">Custom Templates</span>
            </div>

            <div className="canvas-floating-note note-yellow">
              <span className="canvas-tape"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 16c5 0 7-8 12-8a4 4 0 1 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8Z"></path>
              </svg>
              <span className="font-medium text-lg leading-tight">
                Infinite
                <br />
                boards
              </span>
            </div>

            <div className="canvas-floating-note note-cyan">
              <span className="canvas-tape"></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="8" cy="8" r="3"></circle>
                <path d="M2 21c0-4 2.7-7 6-7s6 3 6 7"></path>
                <circle cx="17" cy="9" r="2.6"></circle>
                <path d="M15 15c3.5.7 5.5 3 5.5 6"></path>
              </svg>
              <span className="font-medium text-lg leading-tight">
                Built for
                <br />
                teams
              </span>
            </div>

            <div className="canvas-floating-note note-pink rounded-none" style={{ borderRadius: '0px !important' }}>
              <span className="canvas-tape rounded-none" style={{ borderRadius: '0px !important' }}></span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 4h18"></path>
                <path d="M20 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4"></path>
                <path d="m12 17 4 4m-4-4-4 4"></path>
              </svg>
              <span className="font-medium text-lg leading-tight">
                GitHub sync
                <br />
                progress
              </span>
            </div>

            {/* Doodles */}
            <svg className="canvas-doodle doodle-arrow-left" viewBox="0 0 100 100" fill="none" stroke="#13a8ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 10 Q 50 20 80 80" />
              <path d="M60 80 L 80 80 L 80 60" />
            </svg>

            <svg className="canvas-doodle doodle-arrow-right" viewBox="0 0 100 100" fill="none" stroke="#aa71ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M90 10 Q 50 20 20 80" />
              <path d="M40 80 L 20 80 L 20 60" />
            </svg>

            <svg className="canvas-doodle doodle-loop" viewBox="0 0 100 100" fill="none" stroke="#f6c800" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 10 C 20 10 10 40 10 60 C 10 80 30 90 60 90 C 90 90 90 60 90 40 C 90 20 70 10 50 25 C 30 40 40 70 60 70" />
            </svg>

            <svg className="canvas-doodle doodle-pop-blue" viewBox="0 0 100 100" fill="none" stroke="#13a8ff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M50 20 L 50 10 M50 80 L 50 90 M20 50 L 10 50 M80 50 L 90 50 M29 29 L 21 21 M71 71 L 79 79 M29 71 L 21 79 M71 29 L 79 21" />
            </svg>

            <svg className="canvas-doodle doodle-triangle" viewBox="0 0 100 100" fill="none" stroke="#14b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M50 15 L 85 80 L 15 80 Z" />
            </svg>

            {/* Toolbar */}
            <div className="canvas-toolbar">
              <div className="canvas-tool active" data-tooltip="Select pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                  <path d="m13 13 6 6"></path>
                </svg>
              </div>
              <div className="canvas-tool" data-tooltip="Pencil draw">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
              </div>
              <div className="canvas-tool" data-tooltip="Sticky note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                </svg>
              </div>
              <div className="canvas-tool" data-tooltip="Add text">
                <span style={{ fontFamily: '"Inter", sans-serif' }}>T</span>
              </div>
              <div className="canvas-tool" data-tooltip="Image frame">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
              </div>
              <div className="canvas-tool" data-tooltip="Eraser">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m20 20-5-5L12 18H3v-3l9-9 9 9-1 1Z"></path>
                </svg>
              </div>
            </div>

            {/* Mouse Cursors */}
            <div className="cursor-blue" style={{ animation: "cursorFollow 12s infinite linear" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '28px', height: '28px' }}>
                <path d="M4.5 3V17l4.3-4.3 3.7 8.3 2.5-1.1-3.7-8.3 5.7-.3L4.5 3z" stroke="white" strokeWidth="1.5" />
              </svg>
              <span className="absolute left-6 top-6 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md whitespace-nowrap" style={{ background: '#13a8ff', fontFamily: '"Inter", sans-serif' }}>
                Finley (Admin)
              </span>
            </div>

            <div className="cursor-purple">
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '28px', height: '28px', color: '#aa71ff' }}>
                <path d="M4.5 3V17l4.3-4.3 3.7 8.3 2.5-1.1-3.7-8.3 5.7-.3L4.5 3z" stroke="white" strokeWidth="1.5" />
              </svg>
              <span className="absolute left-6 top-6 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-md whitespace-nowrap" style={{ background: '#aa71ff', fontFamily: '"Inter", sans-serif' }}>
                Acme Client (Viewer)
              </span>
            </div>

            {/* Main Center Content Box */}
            <div className="canvas-center">
              
              <div className="canvas-eyebrow-wrap">
                <div className="canvas-sketch-lines">
                  <span></span>
                </div>
                <span className="canvas-eyebrow">Client Progress Portal</span>
              </div>

              <div className="canvas-select-box" style={{ animation: "boxResize 12s infinite linear" }}>
                {/* Border Drawing Lines */}
                <div style={{ animation: "drawBorderTop 12s infinite linear" }}></div>
                <div style={{ animation: "drawBorderRight 12s infinite linear" }}></div>
                <div style={{ animation: "drawBorderBottom 12s infinite linear" }}></div>
                <div style={{ animation: "drawBorderLeft 12s infinite linear" }}></div>

                {/* Corner Handles */}
                <div className="canvas-handle tl" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle tc" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle tr" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle ml" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle mr" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle bl" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle bc" style={{ animation: "handlePop 12s infinite linear" }}></div>
                <div className="canvas-handle br" style={{ animation: "handlePop 12s infinite linear" }}></div>

                <h1 className="canvas-title">SPRINTS</h1>
              </div>

              <p className="canvas-subtitle font-bold text-slate-800">
                Show clients real-time project progress directly from <span className="canvas-underline">GitHub activity</span> — without exposing source code or repository access.
              </p>

              <div className="canvas-actions">
                <Link className="canvas-primary-btn hover:scale-105 transition-transform" href="/login?role=admin">
                  Admin Dashboard
                </Link>
                <Link className="canvas-secondary-btn hover:scale-105 transition-transform" href="/login?role=client">
                  Client Portal
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* Feature Section Grid */}
        <section id="features" className="canvas-feature-bar border-t border-b border-neutral-200 py-12 px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-center font-bold text-4xl mb-12 uppercase" style={{ fontFamily: "'Patrick Hand', sans-serif", color: '#070707' }}>
              Designed to protect code, build trust
            </h2>
            <div className="canvas-feature-grid">
              
              <div className="canvas-feature">
                <svg className="stroke-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Milestone Progress</h3>
                  <p className="text-slate-600">Clients see clear milestones, tasks, and completion rates at a glance.</p>
                </div>
              </div>

              <div className="canvas-feature">
                <svg className="stroke-green" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">GitHub Automation</h3>
                  <p className="text-slate-600">Instantly links GitHub push events directly to active milestones.</p>
                </div>
              </div>

              <div className="canvas-feature">
                <svg className="stroke-yellow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Absolute Code Privacy</h3>
                  <p className="text-slate-600">No source code, file structures, diffs, or secrets are ever exposed.</p>
                </div>
              </div>

              <div className="canvas-feature">
                <svg className="stroke-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Real-time Feedback</h3>
                  <p className="text-slate-600">Keep communication direct with portal comments linked to milestones.</p>
                </div>
              </div>

              <div className="canvas-feature" style={{ borderRight: 0 }}>
                <svg className="stroke-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Admin Control</h3>
                  <p className="text-slate-600">Complete dashboard control to register repos, webhooks, and client accounts.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
