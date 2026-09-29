import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Network,
  CheckCircle2,
  BarChart3,
  ArrowRight,
  FileText,
  Presentation,
  StickyNote,
  ShieldCheck,
  Check,
  Play,
} from 'lucide-react';
import { NoteNestLogo } from './NoteNestLogo';

interface LandingPageProps {
  onNavigateSignIn: () => void;
  onNavigateSignUp: () => void;
  onQuickDemoLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateSignIn,
  onNavigateSignUp,
  onQuickDemoLogin,
}) => {
  const [selectedDemoOption, setSelectedDemoOption] = useState<'A' | 'B' | 'C'>('B');
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E2E8F0] px-6 lg:px-12 h-16 flex items-center justify-between">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="#top"
          className="inline-flex items-center whitespace-nowrap"
        >
          <NoteNestLogo size="sm" />
        </a>

        {/* Zone 2: 4 clean navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#64748B]">
          <a href="#features" className="hover:text-[#0F172A] transition-colors whitespace-nowrap">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#0F172A] transition-colors whitespace-nowrap">
            How It Works
          </a>
          <a href="#ai-learning" className="hover:text-[#0F172A] transition-colors whitespace-nowrap">
            AI Learning
          </a>
          <a href="#active-recall" className="hover:text-[#0F172A] transition-colors whitespace-nowrap">
            Active Recall
          </a>
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateSignIn}
            className="px-4 py-2 text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors font-display whitespace-nowrap cursor-pointer"
          >
            Log in
          </button>
          <button
            onClick={onNavigateSignUp}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-all font-display whitespace-nowrap cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="top" className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <p className="text-sm font-medium text-[#2563EB] tracking-normal">
              Academic Knowledge & Active Recall Workspace · University Edition
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-[#0F172A] tracking-tight leading-[1.15] font-display"
              style={{ textWrap: 'balance' }}
            >
              A home for everything you learn.
            </h1>
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              Bring your scattered study materials into one intelligent knowledge space. Ask
              questions, connect concepts and test yourself with AI-powered active recall.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onNavigateSignUp}
                className="px-6 py-3 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-all flex items-center gap-2 font-display whitespace-nowrap cursor-pointer"
              >
                Create My Nest
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onQuickDemoLogin}
                className="px-5 py-3 text-base font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg transition-all flex items-center gap-2 font-display whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#2563EB]" />
                Explore Live Student Workspace
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3 text-xs text-[#64748B]">
              <span>Zero hallucination source citations</span>
              <span aria-hidden="true">·</span>
              <span>PDF, PPTX & handwritten OCR</span>
              <span aria-hidden="true">·</span>
              <span>Spaced active recall</span>
            </div>
          </div>

          {/* Right Hero Interactive Workspace Preview */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                <div>
                  <p className="text-xs text-[#64748B]">
                    Knowledge Workspace · DBMS · Unit 3
                  </p>
                  <h3 className="text-base font-semibold text-[#0F172A] font-display">
                    Concurrency Control & Serializability
                  </h3>
                </div>
                <span className="text-xs font-medium text-[#10B981] tabular-nums">
                  73% Avg Recall
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B]">Indexed Sources</p>
                  <p className="text-xl font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    42 Docs
                  </p>
                  <p className="text-[11px] text-[#64748B] mt-0.5">PDFs, PPTs, Notes</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B]">Connected Nodes</p>
                  <p className="text-xl font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    126 Concepts
                  </p>
                  <p className="text-[11px] text-[#2563EB] mt-0.5">8 Courses linked</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  <p className="text-xs text-[#64748B]">AI Summaries</p>
                  <p className="text-xl font-bold text-[#0F172A] font-display tabular-nums mt-0.5">
                    42 Ready
                  </p>
                  <p className="text-[11px] text-[#10B981] mt-0.5">Instant synthesis</p>
                </div>
              </div>

              {/* Grounded Citation Preview inside Hero */}
              <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#2563EB]">
                    Grounded AI Synthesis · Verified Citations
                  </span>
                  <span className="text-[#64748B] tabular-nums">DBMS Unit 3.pdf · p. 14</span>
                </div>
                <p className="text-xs text-[#0F172A] leading-relaxed">
                  “A schedule S is <strong>conflict serializable</strong> if it can be transformed
                  into a serial schedule by swapping pairs of non-conflicting operations. Cycles in
                  the Precedence Graph imply non-serializable causal dependencies.”
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-[#64748B]">
                  Try Alex Chen’s pre-loaded Computer Science workspace:
                </span>
                <button
                  onClick={onQuickDemoLogin}
                  className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Full Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-white border-y border-[#E2E8F0] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-2xl">
            <h2
              className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display"
              style={{ textWrap: 'balance' }}
            >
              Everything you learn shouldn&apos;t have to live everywhere.
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] mt-2">
              Lecture slides on Canvas, PDFs in your downloads folder, handwritten diagrams on your
              tablet. NoteNest unifies every file into a single structured knowledge graph.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <FileText className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Course Textbooks & PDFs
              </h3>
              <p className="text-xs text-[#64748B]">
                DBMS Unit 3.pdf · OS Unit 4.pdf · Indexed down to exact page and section numbers.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <Presentation className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Professor Slide Decks
              </h3>
              <p className="text-xs text-[#64748B]">
                Lecture 7 — Concurrency Slides.pptx · Automatically parsed into testable concepts.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <StickyNote className="w-5 h-5 text-[#10B981]" />
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Handwritten Class Notes
              </h3>
              <p className="text-xs text-[#64748B]">
                Class Notes — Transactions.pdf · OCR extracts precedence graphs and margin formulas.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#DBEAFE]/40 border border-[#2563EB]/30 space-y-2">
              <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
              <h3 className="text-base font-semibold text-[#0F172A] font-display">
                Your Unified Knowledge Nest
              </h3>
              <p className="text-xs text-[#0F172A]">
                Cross-referenced concepts, grounded AI answers, and adaptive active recall quizzes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Feature Cards */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 w-full">
        <div className="max-w-2xl mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display">
            Designed for deep comprehension, not passive rereading.
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-2">
            Six core capabilities built around how university students actually prepare for midterms
            and finals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: BookOpen,
              title: '01. Personal Knowledge Nest',
              desc: 'Organize PDFs, lecture slides, and markdown notes by course with automatic concept extraction and mastery tracking.',
            },
            {
              icon: Search,
              title: '02. Semantic Search',
              desc: 'Locate exact definitions, theorems, and professor examples across 40+ semester documents in milliseconds.',
            },
            {
              icon: Sparkles,
              title: '03. AI Study Assistant',
              desc: 'Strictly grounded in your uploaded syllabus. Every explanation cites the exact PDF page and slide number.',
            },
            {
              icon: Network,
              title: '04. Concept Connections',
              desc: 'Visualize how Transactions connect to ACID, Concurrency Control, Serializability, and OS Deadlocks.',
            },
            {
              icon: CheckCircle2,
              title: '05. Active Recall Quizzes',
              desc: 'Generate targeted multiple-choice and short-answer checks calibrated by your confidence and exam readiness.',
            },
            {
              icon: BarChart3,
              title: '06. Learning Insights',
              desc: 'Identify memory decay before exam week. See what you know, what you are forgetting, and what to revise next.',
            },
          ].map((feat) => {
            const IconComponent = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-3 hover:border-[#2563EB]/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
                  <IconComponent className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-[#0F172A] font-display">{feat.title}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works: Collect -> Understand -> Practice -> Remember */}
      <section id="how-it-works" className="bg-white border-y border-[#E2E8F0] py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display mb-8">
            How NoteNest Works: Collect → Understand → Practice → Remember
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: 'Step 01 · Collect',
                title: 'Upload Your Coursework',
                body: 'Drop lecture PDFs, PPTX slide decks, or handwritten notes into your subject workspace.',
              },
              {
                step: 'Step 02 · Understand',
                title: 'Ask Grounded Questions',
                body: 'Query specific units with zero hallucinations—inspecting verbatim PDF passages side-by-side.',
              },
              {
                step: 'Step 03 · Practice',
                title: 'Test with Active Recall',
                body: 'Take 10-question timed drills with Socratic clues and confidence calibration.',
              },
              {
                step: 'Step 04 · Remember',
                title: 'Spaced Revision Plan',
                body: 'Focus 10-minute revision sessions strictly on weak spots flagged by memory decay.',
              },
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-xs font-semibold text-[#2563EB]">{item.step}</p>
                <h3 className="text-base font-semibold text-[#0F172A] font-display mt-1">
                  {item.title}
                </h3>
                <p className="text-sm text-[#64748B] mt-2 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section & Interactive Active Recall Section */}
      <section id="ai-learning" className="max-w-7xl mx-auto px-6 lg:px-12 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Grounded AI Example */}
          <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <p className="text-xs font-semibold text-[#2563EB]">
              Grounded AI Study Assistant
            </p>
            <h3 className="text-2xl font-bold text-[#0F172A] font-display">
              Ask questions about everything you&apos;ve learned.
            </h3>
            <div className="p-3.5 rounded-xl bg-[#EFF4FF] text-sm text-[#0F172A] font-medium">
              Student: “Explain deadlock prevention using my notes.”
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 text-sm text-[#0F172A]">
              <p className="leading-relaxed">
                <strong>NoteNest Assistant:</strong> Based on your uploaded{' '}
                <span className="text-[#2563EB] font-medium">OS Unit 4.pdf (p. 19)</span> and{' '}
                <span className="text-[#2563EB] font-medium">Class Notes.pdf (p. 4)</span>,
                deadlocks require four simultaneous Coffman conditions. In DBMS concurrency control,
                circular wait is prevented using transaction timestamps:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs text-[#434655]">
                <li>
                  <strong>Wait-Die (Non-preemptive):</strong> Older transactions wait for younger
                  ones; younger transactions abort (“die”) rather than wait.
                </li>
                <li>
                  <strong>Wound-Wait (Preemptive):</strong> Older transactions preempt (“wound”)
                  younger transactions holding locks.
                </li>
              </ul>
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center gap-3 text-xs text-[#2563EB] font-medium">
                <span>Cited: OS Unit 4.pdf · p. 19 § 4.3</span>
                <span aria-hidden="true">·</span>
                <span>Class Notes.pdf · p. 4</span>
              </div>
            </div>
          </div>

          {/* Interactive Active Recall Preview */}
          <div
            id="active-recall"
            className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#10B981]">
                Interactive Active Recall Check
              </p>
              <span className="text-xs text-[#64748B] tabular-nums">
                DBMS · Concurrency Control
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] font-display">
              Under what condition is a schedule S deemed conflict serializable?
            </h3>

            <div className="space-y-2.5">
              {[
                {
                  letter: 'A' as const,
                  text: 'If every pair of consecutive actions in S can be swapped unconditionally.',
                },
                {
                  letter: 'B' as const,
                  text: 'If S can be transformed into a serial schedule by swapping non-conflicting instructions.',
                },
                {
                  letter: 'C' as const,
                  text: 'If all transactions execute only shared read locks without write operations.',
                },
              ].map((opt) => {
                const isSelected = selectedDemoOption === opt.letter;
                const isCorrect = demoSubmitted && opt.letter === 'B';
                const isWrong = demoSubmitted && isSelected && opt.letter !== 'B';

                return (
                  <button
                    key={opt.letter}
                    onClick={() => {
                      setSelectedDemoOption(opt.letter);
                      setDemoSubmitted(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isCorrect
                        ? 'border-[#10B981] bg-[#ECFDF5]'
                        : isWrong
                        ? 'border-[#DC2626] bg-[#FEF2F2]'
                        : isSelected
                        ? 'border-[#2563EB] bg-[#EFF4FF]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white border border-[#CBD5E1] text-[#0F172A]'
                      }`}
                    >
                      {opt.letter}
                    </span>
                    <span className="text-xs sm:text-sm text-[#0F172A] flex-1">{opt.text}</span>
                    {isSelected && <Check className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2">
              {demoSubmitted ? (
                <p className="text-xs font-medium text-[#10B981]">
                  {selectedDemoOption === 'B'
                    ? '✓ Correct! Cited from DBMS Unit 3.pdf (p. 14).'
                    : 'Option B is correct — only non-conflicting pairs can be swapped.'}
                </p>
              ) : (
                <span className="text-xs text-[#64748B]">
                  Select an option to test active recall
                </span>
              )}
              <button
                onClick={() => setDemoSubmitted(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors font-display cursor-pointer"
              >
                Check Answer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#0F172A] text-white py-16 mt-auto">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="flex justify-center">
            <NoteNestLogo size="md" variant="light" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display">
            Make NoteNest your home for learning.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Start organizing your semester PDFs, generating grounded exam quizzes, and retaining
            what you study.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={onNavigateSignUp}
              className="px-6 py-3 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-all font-display cursor-pointer"
            >
              Get Started Free
            </button>
            <button
              onClick={onQuickDemoLogin}
              className="px-6 py-3 text-base font-semibold text-white border border-slate-700 hover:bg-slate-800 rounded-lg transition-all font-display cursor-pointer"
            >
              Launch Demo Workspace (Alex Chen)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
