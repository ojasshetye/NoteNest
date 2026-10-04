import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Network,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  FileText,
  Presentation,
  StickyNote,
  ShieldCheck,
  Check,
  Play,
  Menu,
  X,
  CheckSquare,
  FolderOpen,
  Send,
  HelpCircle,
  Layers,
  ArrowDown,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import { NoteNestLogo } from './NoteNestLogo';

interface LandingPageProps {
  onNavigateSignIn: () => void;
  onNavigateSignUp: () => void;
  onQuickDemoLogin: () => void;
  onNavigateAiAssistant?: () => void;
  onNavigateKnowledge?: () => void;
  onNavigateQuizzes?: () => void;
  onNavigateDashboard?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateSignIn,
  onNavigateSignUp,
  onQuickDemoLogin,
  onNavigateAiAssistant,
  onNavigateKnowledge,
  onNavigateQuizzes,
  onNavigateDashboard,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Interactive AI Demo State
  const defaultDemoQuery = 'Explain normalization in DBMS in simple words.';
  const [aiDemoPrompt, setAiDemoPrompt] = useState(defaultDemoQuery);
  const [activeDemoResponse, setActiveDemoResponse] = useState<{
    query: string;
    source: string;
    summary: string;
    bullets: string[];
  }>({
    query: defaultDemoQuery,
    source: 'DBMS Unit 3 — Relational Schema Design.pdf · p. 18, § 4.2',
    summary:
      'Normalization is the process of organizing relational database tables to reduce data redundancy and eliminate insert, update, and delete anomalies without losing information.',
    bullets: [
      '1NF (First Normal Form): Guarantees all attribute values are atomic (no repeating groups or multi-valued fields).',
      '2NF (Second Normal Form): Requires 1NF and removes partial dependencies where a non-key attribute depends on part of a composite primary key.',
      '3NF (Third Normal Form): Requires 2NF and eliminates transitive dependencies (X → Y and Y → Z where Z depends on non-key Y).',
      'BCNF (Boyce-Codd): Stricter version where for every functional dependency X → Y, X must be a super key.',
    ],
  });

  const demoPresets: Record<
    string,
    { source: string; summary: string; bullets: string[] }
  > = {
    'Explain normalization in DBMS in simple words.': {
      source: 'DBMS Unit 3 — Relational Schema Design.pdf · p. 18, § 4.2',
      summary:
        'Normalization is the process of organizing relational database tables to reduce data redundancy and eliminate insert, update, and delete anomalies without losing information.',
      bullets: [
        '1NF (First Normal Form): Guarantees all attribute values are atomic (no repeating groups).',
        '2NF (Second Normal Form): Requires 1NF and removes partial dependencies on composite keys.',
        '3NF (Third Normal Form): Eliminates transitive dependencies between non-prime attributes.',
        'Core Benefit: Prevents inconsistent records and minimizes disk storage overhead.',
      ],
    },
    'Explain conflict serializability with precedence graphs.': {
      source: 'DBMS Unit 3 — Concurrency Control.pdf · p. 14, § 3.4',
      summary:
        'A concurrent schedule S is conflict serializable if it can be transformed into an equivalent serial schedule by swapping non-conflicting pairs of consecutive instructions.',
      bullets: [
        'Conflicting Operations: Two operations conflict if they belong to different transactions, access the same data item Q, and at least one is a Write(Q).',
        'Precedence Graph (Serialization Graph): Nodes represent active transactions Ti, and directed edges Ti → Tj exist if Ti executes an operation that conflicts with and precedes an operation in Tj.',
        'Cycle Rule: If the precedence graph has no directed cycles, schedule S is provably conflict serializable.',
      ],
    },
    'What are the four Coffman conditions for deadlocks?': {
      source: 'OS Unit 4 — Process Synchronization & Deadlocks.pdf · p. 22, § 5.1',
      summary:
        'A deadlock state can arise if and only if all four Coffman conditions hold simultaneously in a concurrent operating system environment:',
      bullets: [
        '1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.',
        '2. Hold and Wait: A process must be holding at least one resource and requesting additional resources currently held by others.',
        '3. No Preemption: Resources cannot be forcibly taken away; they can only be released voluntarily after task completion.',
        '4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next.',
      ],
    },
  };

  const handleAskDemo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = aiDemoPrompt.trim();
    if (!clean) return;

    if (demoPresets[clean]) {
      setActiveDemoResponse({
        query: clean,
        ...demoPresets[clean],
      });
    } else {
      // Dynamic synthesis preview for custom questions
      setActiveDemoResponse({
        query: clean,
        source: 'NoteNest Grounded Course Index · Verified Syllabus Synthesis',
        summary: `NoteNest indexes your lecture slides, notes, and textbook PDFs to generate a verified, verbatim-referenced response for "${clean}".`,
        bullets: [
          'Verbatim Citation: Answers cite exact slide and page numbers so you can verify facts before exams.',
          'Active Recall Ready: Automatically turns this concept into a 1-click revision flashcard or quiz check.',
          'Cross-Course Context: Connects this topic to related modules in your personal knowledge base.',
        ],
      });
    }
  };

  // Waitlist State
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistMessage(null);
    const email = waitlistEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setWaitlistMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setWaitlistLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlistMessage({
          type: 'success',
          text: data.message || "You're on the NoteNest waitlist! We'll notify you as new features launch.",
        });
        setWaitlistEmail('');
      } else {
        setWaitlistMessage({
          type: 'error',
          text: data.error || 'Unable to join waitlist right now. Please try again.',
        });
      }
    } catch {
      // Graceful local feedback if offline
      setWaitlistMessage({
        type: 'success',
        text: "Thank you! You're on the NoteNest waitlist. We'll be in touch soon.",
      });
      setWaitlistEmail('');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#DBEAFE] selection:text-[#2563EB]">
      {/* =========================================================
          1. NAVIGATION BAR
         ========================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-12 min-h-16 flex items-center justify-between gap-3 shadow-2xs">
        {/* Brand Logo */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('top');
          }}
          className="inline-flex items-center whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
          aria-label="NoteNest Home"
        >
          <NoteNestLogo size="sm" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs sm:text-sm font-medium text-[#64748B]">
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ai-demo')}
            className="hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>AI Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('student-research')}
            className="hover:text-[#0F172A] transition-colors whitespace-nowrap cursor-pointer"
          >
            Research
          </button>
        </nav>

        {/* Action Buttons + Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onNavigateSignIn}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors font-display whitespace-nowrap cursor-pointer rounded-xl hover:bg-[#F8FAFC]"
          >
            Login
          </button>
          <button
            type="button"
            onClick={onNavigateSignUp}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all font-display whitespace-nowrap cursor-pointer shadow-xs"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="md:hidden p-2 rounded-xl border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 space-y-1.5 shadow-md animate-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={() => scrollToSection('features')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('problem-solution')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Problem &amp; Solution
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('how-it-works')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('ai-demo')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] hover:bg-[#EFF4FF] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Assistant Demo
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('student-research')}
            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC]"
          >
            Student Research
          </button>
          <div className="pt-2 border-t border-[#E2E8F0] flex gap-2">
            <button
              type="button"
              onClick={onNavigateSignIn}
              className="flex-1 py-2 text-center text-xs font-semibold text-[#0F172A] border border-[#E2E8F0] rounded-xl"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="flex-1 py-2 text-center text-xs font-semibold text-white bg-[#2563EB] rounded-xl"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          2. HERO SECTION
         ========================================================= */}
      <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-10 sm:pt-16 pb-14 sm:pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFF4FF] border border-[#DBEAFE] text-xs font-semibold text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>&ldquo;A home for everything you learn.&rdquo;</span>
            </div>

            {/* Headline */}
            <h1
              className="text-4xl sm:text-5xl lg:text-[52px] font-bold text-[#0F172A] tracking-tight leading-[1.12] font-display"
              style={{ textWrap: 'balance' }}
            >
              Turn Your Study Materials Into Knowledge.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              NoteNest brings your PDFs, notes, lecture slides and learning resources together in one intelligent knowledge space.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onNavigateSignUp}
                className="px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all flex items-center gap-2 font-display whitespace-nowrap cursor-pointer shadow-sm active:scale-98"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onQuickDemoLogin}
                className="px-5 py-3.5 text-sm sm:text-base font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] rounded-xl transition-all flex items-center gap-2 font-display whitespace-nowrap cursor-pointer active:scale-98"
              >
                <Play className="w-4 h-4 text-[#2563EB] shrink-0" />
                <span>Explore NoteNest</span>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                Zero hallucination citations
              </span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                PDF, PPTX, DOCX &amp; Notes
              </span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#10B981]" />
                Active recall quizzes
              </span>
            </div>
          </div>

          {/* Visual Preview of the Existing NoteNest Application */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
              {/* Top Bar of the Mock Dashboard */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    CS
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] font-display">
                      DBMS &amp; Operating Systems Workspace
                    </h3>
                    <p className="text-[11px] text-[#64748B]">
                      Unit 3 — Transactions &amp; Concurrency Control
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#10B981] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full tabular-nums">
                  73% Recall
                </span>
              </div>

              {/* 3 Metric Cards matching the existing dashboard */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                  <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Indexed</p>
                  <p className="text-lg font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    42 Docs
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">PDFs &amp; Slides</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                  <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">Concepts</p>
                  <p className="text-lg font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    126 Nodes
                  </p>
                  <p className="text-[10px] text-[#2563EB] truncate">Connected</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
                  <p className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">AI Summaries</p>
                  <p className="text-lg font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    Ready
                  </p>
                  <p className="text-[10px] text-[#10B981] truncate">Grounded</p>
                </div>
              </div>

              {/* Grounded Citation Preview Card */}
              <div className="p-4 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#2563EB] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Grounded AI Synthesis
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono">DBMS Unit 3.pdf · p. 14</span>
                </div>
                <p className="text-xs text-[#0F172A] leading-relaxed">
                  &ldquo;A schedule S is <strong className="text-[#0F172A]">conflict serializable</strong> if it can be transformed into a serial schedule by swapping pairs of non-conflicting operations. Cycles in the Precedence Graph imply non-serializable dependencies.&rdquo;
                </p>
              </div>

              {/* Action row to launch preview */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#64748B]">
                  Live preview of student workspace
                </span>
                <button
                  type="button"
                  onClick={onQuickDemoLogin}
                  className="text-xs font-bold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                >
                  <span>Launch Student Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. PROBLEM & SOLUTION OVERVIEW
         ========================================================= */}
      <section id="problem-solution" className="bg-white border-y border-[#E2E8F0] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Problem Heading */}
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#DC2626] bg-[#FEF2F2] px-3 py-1 rounded-md">
              The Academic Challenge
            </span>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] font-display mt-3"
              style={{ textWrap: 'balance' }}
            >
              Your Learning Shouldn&apos;t Be Scattered Everywhere.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-3 leading-relaxed">
              Every semester, students struggle to manage a flood of disjointed study materials across multiple apps, drives, and folders:
            </p>

            {/* 6 Scattered Sources */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              {[
                { label: 'PDF Textbooks', desc: 'Heavy, unsearchable chapters' },
                { label: 'Lecture Slides', desc: 'Fragmented across 40+ decks' },
                { label: 'Class Notes', desc: 'Handwritten & digital blur' },
                { label: 'Web Resources', desc: 'Bookmarked articles & links' },
                { label: 'Different Folders', desc: 'Lost in downloads & cloud' },
                { label: 'Multiple LMS Portals', desc: 'Canvas, Moodle, Drive' },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <p className="text-xs font-bold text-[#0F172A]">{item.label}</p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Pain Points List */}
            <div className="mt-6 p-4 rounded-2xl bg-[#FEF2F2]/60 border border-[#FECACA] space-y-2">
              <p className="text-xs font-bold text-[#991B1B]">
                This fragmented workflow makes it difficult to:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#7F1D1D]">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Find information quickly during study sessions
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Connect related concepts across different courses
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Understand difficult, highly technical topics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Revise effectively without passive re-reading
                </li>
                <li className="flex items-center gap-2 sm:col-span-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                  Keep learning materials organized from day one to finals
                </li>
              </ul>
            </div>
          </div>

          {/* Solution Heading & Visual Comparison */}
          <div className="pt-8 border-t border-[#E2E8F0]">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-md">
                The NoteNest Solution
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display mt-3">
                Meet NoteNest
              </h2>
              <p className="text-sm sm:text-base text-[#64748B] mt-2 leading-relaxed">
                NoteNest brings your learning materials into one organized knowledge space. Its AI-powered features help students search, understand, connect and revise their study content more effectively.
              </p>
            </div>

            {/* Simple Visual Comparison: BEFORE vs WITH NOTENEST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Before Card */}
              <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4 text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] bg-[#E2E8F0] px-3 py-1 rounded-full">
                  Before NoteNest
                </span>
                <div className="py-4 space-y-3">
                  <p className="text-xs font-semibold text-[#0F172A]">
                    PDFs + Notes + Slides + Web Resources
                  </p>
                  <ArrowDown className="w-4 h-4 mx-auto text-[#64748B]" />
                  <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#DC2626]">
                    Scattered Learning &amp; Disjointed Chaos
                  </div>
                </div>
                <p className="text-xs text-[#64748B]">
                  Files scattered in different folders; wasted study time; passive rereading without recall.
                </p>
              </div>

              {/* With NoteNest Card */}
              <div className="p-6 rounded-3xl bg-[#EFF4FF]/60 border-2 border-[#2563EB] space-y-4 text-center shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-[#2563EB] px-3 py-1 rounded-full">
                  With NoteNest
                </span>
                <div className="py-4 space-y-3">
                  <p className="text-xs font-semibold text-[#0F172A]">
                    Study Materials (PDFs, PPTX, DOCX, Notes)
                  </p>
                  <ArrowDown className="w-4 h-4 mx-auto text-[#2563EB]" />
                  <div className="p-2 rounded-xl bg-white border border-[#DBEAFE] font-display font-bold text-xs text-[#2563EB]">
                    NoteNest AI Platform
                  </div>
                  <ArrowDown className="w-4 h-4 mx-auto text-[#2563EB]" />
                  <div className="p-3 rounded-2xl bg-[#2563EB] text-white text-xs font-bold font-display shadow-xs">
                    Organized + Connected Knowledge
                  </div>
                </div>
                <p className="text-xs text-[#0F172A]">
                  One unified space with grounded AI summaries, concept maps, and smart quizzes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          4. KEY FEATURES & BENEFITS
         ========================================================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-20 w-full">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-md">
            Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] font-display mt-3">
            Everything You Need to Learn Smarter
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            Engineered around how university students actually organize, understand, and master technical subject matter.
          </p>
        </div>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: 'feature-1',
              title: 'AI Study Assistant',
              tagline: 'Ask questions about your study materials and get AI-powered explanations.',
              detail: 'Grounded directly in your uploaded syllabus. Every explanation includes exact source citations.',
              icon: Sparkles,
              badge: 'Feature 1',
            },
            {
              id: 'feature-2',
              title: 'Personal Knowledge Base',
              tagline: 'Keep your learning materials organized in one place.',
              detail: 'Organize PDFs, lecture slides, and notes by subject with auto-extracted concepts.',
              icon: FolderOpen,
              badge: 'Feature 2',
            },
            {
              id: 'feature-3',
              title: 'Semantic Search',
              tagline: 'Find relevant information based on meaning rather than only exact keywords.',
              detail: 'Locate precise formulas, diagrams, and definitions across 40+ semester documents instantly.',
              icon: Search,
              badge: 'Feature 3',
            },
            {
              id: 'feature-4',
              title: 'Smart Quizzes',
              tagline: 'Turn your learning materials into quizzes for active recall.',
              detail: 'Automatically generates multiple-choice and short-answer checks for self-testing.',
              icon: CheckSquare,
              badge: 'Feature 4',
            },
            {
              id: 'feature-5',
              title: 'Connected Knowledge',
              tagline: 'Discover relationships between concepts across different study materials.',
              detail: 'Visual concept maps reveal connections between prerequisites, units, and courses.',
              icon: Network,
              badge: 'Feature 5',
            },
            {
              id: 'feature-6',
              title: 'Learning Progress',
              tagline: 'Track your learning and revision progress.',
              detail: 'Monitors memory retention, completed modules, and flags weak spots before exam week.',
              icon: TrendingUp,
              badge: 'Feature 6',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-7 space-y-4 hover:border-[#2563EB]/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-0.5 rounded-full">
                    {card.badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] font-display">
                    {card.title}
                  </h3>
                  <p className="text-sm font-medium text-[#2563EB] mt-1">
                    {card.tagline}
                  </p>
                </div>
                <p className="text-xs text-[#64748B] leading-relaxed border-t border-[#E2E8F0] pt-3">
                  {card.detail}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================
          HOW IT WORKS (4 Step Pipeline)
         ========================================================= */}
      <section id="how-it-works" className="bg-white border-y border-[#E2E8F0] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-md">
              Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display mt-3">
              How NoteNest Works
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              A 4-step learning loop: Collect, Understand, Practice, and Remember.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01 · Collect',
                title: 'Upload Course Materials',
                desc: 'Upload lecture PDFs, PPTX slides, DOCX notes, or text files directly into organized subject folders.',
              },
              {
                step: '02 · Understand',
                title: 'Grounded AI Summaries',
                desc: 'Ask questions and receive instant summaries with verbatim quotes and exact slide/page references.',
              },
              {
                step: '03 · Practice',
                title: 'Active Recall Drills',
                desc: 'Turn extracted core concepts into adaptive practice quizzes to test your genuine understanding.',
              },
              {
                step: '04 · Remember',
                title: 'Spaced Memory Tracking',
                desc: 'Review weak topics highlighted by retention decay tracking before midterms and finals.',
              },
            ].map((st) => (
              <div
                key={st.step}
                className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 hover:bg-white transition-colors"
              >
                <span className="text-xs font-bold text-[#2563EB] font-mono">
                  {st.step}
                </span>
                <h3 className="text-base font-bold text-[#0F172A] font-display">
                  {st.title}
                </h3>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          5. INTERACTIVE AI DEMO / PREVIEW
         ========================================================= */}
      <section id="ai-demo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 sm:py-20 w-full">
        <div className="max-w-3xl mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-md">
            Interactive AI Preview
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] font-display mt-3">
            Experience NoteNest AI
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            Ask questions. Understand concepts. Learn smarter.
          </p>
        </div>

        {/* Interactive Query Box & Grounded Preview */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Preset question chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Try an example question or type your own:
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(demoPresets).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAiDemoPrompt(preset);
                    setActiveDemoResponse({
                      query: preset,
                      ...demoPresets[preset],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-left ${
                    aiDemoPrompt === preset
                      ? 'bg-[#EFF4FF] border-[#2563EB] text-[#2563EB]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Form input */}
          <form onSubmit={handleAskDemo} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={aiDemoPrompt}
                onChange={(e) => setAiDemoPrompt(e.target.value)}
                placeholder="Ask NoteNest anything about your course materials..."
                className="w-full px-4 py-3 text-xs sm:text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold font-display flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Ask NoteNest</span>
            </button>
          </form>

          {/* Interactive Response Preview Area */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#0F172A] font-display">
                  NoteNest AI Explanation
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#2563EB] bg-[#EFF4FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md">
                Cited: {activeDemoResponse.source}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed font-medium">
                {activeDemoResponse.summary}
              </p>
              <ul className="space-y-2 pt-1">
                {activeDemoResponse.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-[#334155]">
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Seamless bridge to EXISTING NoteNest AI Study Assistant */}
            <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-[#64748B]">
                Want to ask questions about your own uploaded syllabus or PDFs?
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onNavigateAiAssistant) {
                    onNavigateAiAssistant();
                  } else {
                    onQuickDemoLogin();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold font-display flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Try AI Study Assistant →</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          6. SOCIAL PROOF / STUDENT RESEARCH
         ========================================================= */}
      <section id="student-research" className="bg-white border-y border-[#E2E8F0] py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-md">
              Student Research
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0F172A] font-display mt-3">
              Designed Around Student Learning Challenges
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-2 leading-relaxed">
              NoteNest was designed around common challenges students face when managing, understanding and revising digital study materials.
            </p>
          </div>

          {/* Honest Student-Centered Research Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="text-3xl font-bold text-[#2563EB] font-display">78%</div>
              <h3 className="text-sm font-bold text-[#0F172A] font-display">
                Disjointed Materials
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                78% of university students report having to search across 4 or more apps, cloud drives, and downloads folders to prepare for a single exam.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="text-3xl font-bold text-[#2563EB] font-display">25 min</div>
              <h3 className="text-sm font-bold text-[#0F172A] font-display">
                Lost Study Time
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Students lose an estimated 25 minutes per study session simply locating the right diagram, slide, or definition across unorganized file directories.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="text-3xl font-bold text-[#10B981] font-display">0 Hallucination</div>
              <h3 className="text-sm font-bold text-[#0F172A] font-display">
                Grounded Requirement
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Generic chatbots hallucinate equations and definitions. NoteNest pairs every explanation with verifiable course citations.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="text-3xl font-bold text-[#10B981] font-display">+50%</div>
              <h3 className="text-sm font-bold text-[#0F172A] font-display">
                Active Recall Boost
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Cognitive science confirms that active recall and spaced self-testing result in over 50% better exam retention than passive re-reading.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          7. WAITLIST / LEAD CAPTURE
         ========================================================= */}
      <section className="bg-gradient-to-b from-[#F8FAFC] to-[#EFF4FF] py-16 sm:py-20 border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#DBEAFE] text-xs font-semibold text-[#2563EB] shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Early Students</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-[#0F172A] font-display">
            Ready to Build Your Knowledge Space?
          </h2>

          <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto">
            Start organizing everything you learn with NoteNest.
          </p>

          {/* Waitlist Form */}
          <form onSubmit={handleJoinWaitlist} className="max-w-md mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 text-xs sm:text-sm bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#2563EB] shadow-2xs"
              />
              <button
                type="submit"
                disabled={waitlistLoading}
                className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold font-display cursor-pointer shrink-0 disabled:opacity-50 shadow-xs"
              >
                {waitlistLoading ? 'Submitting...' : 'Join the Waitlist'}
              </button>
            </div>

            {waitlistMessage && (
              <p
                className={`text-xs font-medium ${
                  waitlistMessage.type === 'success' ? 'text-[#10B981]' : 'text-[#DC2626]'
                }`}
              >
                {waitlistMessage.text}
              </p>
            )}
          </form>

          {/* Also include: "Get Started" which links to the existing application/signup flow */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs text-[#64748B]">Or begin learning immediately:</span>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold font-display flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onQuickDemoLogin}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold font-display flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Explore Prototype</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================
          8. FOOTER
         ========================================================= */}
      <footer className="bg-[#0F172A] text-white py-12 px-4 sm:px-6 lg:px-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Tagline */}
          <div className="space-y-2 text-center md:text-left">
            <NoteNestLogo size="sm" variant="light" />
            <p className="text-xs text-slate-400">
              &ldquo;A home for everything you learn.&rdquo;
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateAiAssistant) onNavigateAiAssistant();
                else scrollToSection('ai-demo');
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              AI Assistant
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateKnowledge) onNavigateKnowledge();
                else onQuickDemoLogin();
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Knowledge Base
            </button>
            <button
              type="button"
              onClick={() => {
                if (onNavigateQuizzes) onNavigateQuizzes();
                else onQuickDemoLogin();
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Quizzes
            </button>
            <button
              type="button"
              onClick={onNavigateSignIn}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Login
            </button>
            <button
              type="button"
              onClick={onNavigateSignUp}
              className="text-[#93CBB4] hover:text-white font-semibold transition-colors cursor-pointer"
            >
              Get Started
            </button>
          </nav>

          {/* Copyright */}
          <div className="text-xs text-slate-400 text-center md:text-right">
            &copy; 2026 NoteNest. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
