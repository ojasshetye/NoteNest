import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Check,
  UploadCloud,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { NavSection, QuizQuestion, StudyMaterial, UserProfile } from '../types';
import { DBMS_QUIZ_QUESTIONS } from '../data/mockQuizAndConcepts';

interface QuizzesViewProps {
  user: UserProfile;
  authToken: string | null;
  onNavigate: (section: NavSection) => void;
  onUserUpdated: (user: UserProfile) => void;
}

function buildQuestionsFromMaterial(material: StudyMaterial): QuizQuestion[] {
  const concepts =
    material.keyConcepts.length >= 2
      ? material.keyConcepts
      : [`${material.subject} Core Model`, 'Structural Invariants', 'Execution Rules'];
  const summary = material.aiSummary;

  const qList: QuizQuestion[] = [];

  if (summary?.selfCheckQuestions && summary.selfCheckQuestions.length > 0) {
    summary.selfCheckQuestions.forEach((qa, idx) => {
      qList.push({
        id: idx + 1,
        topicTag: `${material.subject} · ${material.title}`,
        difficulty: idx === 0 ? 'Medium Level' : 'Exam Level',
        prompt: qa.question,
        correctLetter: 'B',
        sourceCitation: `${material.fileName} (${material.pagesOrSlides})`,
        explanation: qa.answer,
        options: [
          {
            letter: 'A',
            text: `It relies strictly on unverified external assumptions unrelated to ${concepts[0]}.`,
          },
          {
            letter: 'B',
            text: qa.answer.length > 160 ? `${qa.answer.slice(0, 157)}...` : qa.answer,
          },
          {
            letter: 'C',
            text: `It bypasses all validation checks in ${material.subject} to reduce latency.`,
          },
          {
            letter: 'D',
            text: `None of the principles described in ${material.fileName} apply.`,
          },
        ],
      });
    });
  }

  if (summary?.coreDefinitions && summary.coreDefinitions.length > 0) {
    summary.coreDefinitions.forEach((def) => {
      if (qList.length < 5) {
        qList.push({
          id: qList.length + 1,
          topicTag: `${material.subject} · Definitions`,
          difficulty: 'Medium Level',
          prompt: `In the context of "${material.title}" (${material.subject}), which statement accurately defines ${def.term}?`,
          correctLetter: 'A',
          sourceCitation: `${material.fileName}`,
          explanation: `${def.term}: ${def.explanation}`,
          options: [
            {
              letter: 'A',
              text:
                def.explanation.length > 160
                  ? `${def.explanation.slice(0, 157)}...`
                  : def.explanation,
            },
            {
              letter: 'B',
              text: `An obsolete hardware-only register not used in modern ${material.subject}.`,
            },
            {
              letter: 'C',
              text: `A random heuristic that ignores state consistency in ${material.title}.`,
            },
            {
              letter: 'D',
              text: `A purely cosmetic label with no operational effect.`,
            },
          ],
        });
      }
    });
  }

  if (qList.length === 0) {
    qList.push(
      {
        id: 1,
        topicTag: `${material.subject} · ${material.title}`,
        difficulty: 'Medium Level',
        prompt: `What is the primary focus and core conceptual framework covered in "${material.title}" (${material.subject})?`,
        correctLetter: 'B',
        sourceCitation: `${material.fileName}`,
        explanation:
          material.fullSummary ||
          `Covers the core architecture and rules of ${concepts.join(', ')} in ${material.subject}.`,
        options: [
          {
            letter: 'A',
            text: `Unstructured data deletion without any verification rules.`,
          },
          {
            letter: 'B',
            text:
              material.fullSummary && material.fullSummary.length <= 160
                ? material.fullSummary
                : `Systematic principles, invariants, and problem-solving methods across ${concepts.join(', ')}.`,
          },
          {
            letter: 'C',
            text: `Skipping all analytical steps during ${material.subject} evaluation.`,
          },
          {
            letter: 'D',
            text: `Replacing ${concepts[0]} with arbitrary unindexed guesses.`,
          },
        ],
      },
      {
        id: 2,
        topicTag: `${material.subject} · Core Concepts`,
        difficulty: 'Medium Level',
        prompt: `Which of the following key concepts is directly indexed in your study document "${material.fileName}"?`,
        correctLetter: 'A',
        sourceCitation: `${material.fileName}`,
        explanation: `${concepts[0]} is a primary concept extracted from ${material.fileName}.`,
        options: [
          {
            letter: 'A',
            text: `${concepts[0]} and its operational relationship with ${concepts[1] || material.subject}.`,
          },
          {
            letter: 'B',
            text: `Unrelated topics outside your ${material.subject} syllabus.`,
          },
          {
            letter: 'C',
            text: `Deprecated legacy protocols not present in ${material.fileName}.`,
          },
          {
            letter: 'D',
            text: `None of the above.`,
          },
        ],
      }
    );
  }

  return qList;
}

export const QuizzesView: React.FC<QuizzesViewProps> = ({
  user,
  authToken,
  onNavigate,
  onUserUpdated,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    user.materials[0]?.id || ''
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [quizScreen, setQuizScreen] = useState<'session' | 'results'>('session');
  const [socraticClue, setSocraticClue] = useState<string | null>(null);
  const [loadingClue, setLoadingClue] = useState(false);

  const activeMaterial =
    user.materials.find((m) => m.id === selectedMaterialId) || user.materials[0];

  const questions: QuizQuestion[] = useMemo(() => {
    if (!activeMaterial) return [];
    if (activeMaterial.id === 'mat-1') {
      return DBMS_QUIZ_QUESTIONS.slice(0, 5);
    }
    return buildQuestionsFromMaterial(activeMaterial);
  }, [activeMaterial]);

  // ==========================================
  // CLEAN EMPTY STATE WHEN USER HAS NO MATERIALS
  // ==========================================
  if (user.materials.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            Active Recall Quizzes
          </span>
          <h1 className="text-3xl font-bold text-[#0F172A] font-display mt-2">
            Active Recall Quizzes
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Test your understanding with quizzes generated from your own uploaded study materials.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-xl font-bold text-[#0F172A] font-display">
              No study documents available for quizzing yet
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Upload a study material in your Knowledge Library first. NoteNest will automatically
              build active-recall questions grounded in your uploaded document.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('knowledge')}
            className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Go to My Knowledge Library
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex] || questions[0];
  const selectedLetter = selectedAnswers[currentQuestion.id];
  const isChecked = Boolean(checkedQuestions[currentQuestion.id]);

  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctLetter
  ).length;

  const handleSelectMaterial = (matId: string) => {
    setSelectedMaterialId(matId);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setCheckedQuestions({});
    setQuizScreen('session');
    setSocraticClue(null);
  };

  const handleFinishQuiz = async () => {
    setQuizScreen('results');
    if (authToken && activeMaterial) {
      try {
        const res = await fetch('/api/quizzes/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            quizTitle: activeMaterial.title,
            score: correctCount,
            total: questions.length,
            materialId: activeMaterial.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onUserUpdated(data.user);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleGenerateSocraticClue = async () => {
    setLoadingClue(true);
    try {
      const res = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          questionText: currentQuestion.prompt,
          topic: currentQuestion.topicTag,
        }),
      });
      const data = await res.json();
      setSocraticClue(data.clue || currentQuestion.explanation);
    } catch {
      setSocraticClue(currentQuestion.explanation);
    } finally {
      setLoadingClue(false);
    }
  };

  if (quizScreen === 'results') {
    const pct = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#10B981] text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Quiz Completed
              </span>
              <h1 className="text-2xl font-bold text-[#0F172A] font-display mt-2">
                {activeMaterial?.title}
              </h1>
              <p className="text-xs text-[#64748B] mt-0.5">
                Subject: {activeMaterial?.subject} · Source: {activeMaterial?.fileName}
              </p>
            </div>

            <div className="bg-[#EFF4FF] border border-[#DBEAFE] rounded-2xl px-6 py-4 text-center shrink-0">
              <span className="block text-xs font-semibold text-[#2563EB] uppercase">SCORE</span>
              <span className="text-3xl font-bold text-[#0F172A] font-display tabular-nums">
                {correctCount} / {questions.length} ({pct}%)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setSelectedAnswers({});
                setCheckedQuestions({});
                setQuizScreen('session');
              }}
              className="px-5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
            >
              Retake Quiz
            </button>
            <button
              type="button"
              onClick={() => onNavigate('progress')}
              className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display cursor-pointer"
            >
              View Progress →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header & Material Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] font-display">Active Recall Quiz</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Select one of your uploaded study documents to test your recall.
          </p>
        </div>

        <select
          value={activeMaterial?.id || ''}
          onChange={(e) => handleSelectMaterial(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-[#E2E8F0] rounded-xl text-[#0F172A]"
        >
          {user.materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.subject}: {m.title}
            </option>
          ))}
        </select>
      </div>

      {/* Question Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between text-xs">
          <span className="px-3 py-1 rounded-full bg-[#EFF4FF] text-[#2563EB] font-semibold">
            {currentQuestion.topicTag}
          </span>
          <span className="font-semibold text-[#64748B] tabular-nums">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <h2 className="text-lg font-bold text-[#0F172A] font-display leading-snug">
          {currentQuestion.prompt}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((opt) => {
            const isSelected = selectedLetter === opt.letter;
            const isCorrect = opt.letter === currentQuestion.correctLetter;

            let cardStyle = 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white';
            if (isChecked) {
              if (isCorrect) {
                cardStyle = 'bg-[#ECFDF5] border-[#10B981]';
              } else if (isSelected) {
                cardStyle = 'bg-[#FEF2F2] border-[#DC2626]';
              }
            } else if (isSelected) {
              cardStyle = 'bg-[#EFF4FF] border-[#2563EB]';
            }

            return (
              <button
                key={opt.letter}
                type="button"
                disabled={isChecked}
                onClick={() =>
                  setSelectedAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: opt.letter,
                  }))
                }
                className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3.5 transition-all cursor-pointer ${cardStyle}`}
              >
                <span
                  className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white border border-[#CBD5E1] text-[#0F172A]'
                  }`}
                >
                  {opt.letter}
                </span>
                <span className="text-xs sm:text-sm text-[#0F172A] leading-relaxed pt-0.5">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Socratic Hint / Explanation */}
        {socraticClue && !isChecked && (
          <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#78350F] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#D97706]" />
              AI Study Hint
            </p>
            <p>{socraticClue}</p>
          </div>
        )}

        {isChecked && (
          <div className="p-4 rounded-2xl bg-[#EFF4FF] border border-[#DBEAFE] text-xs space-y-1">
            <p className="font-bold text-[#004AC6] flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#10B981]" />
              Grounded Explanation ({currentQuestion.sourceCitation})
            </p>
            <p className="text-[#0F172A] leading-relaxed">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0]">
          <button
            type="button"
            disabled={loadingClue}
            onClick={handleGenerateSocraticClue}
            className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loadingClue ? 'Getting Hint...' : 'Ask AI for a Hint'}
          </button>

          <div className="flex items-center gap-2.5">
            {!isChecked ? (
              <button
                type="button"
                disabled={!selectedLetter}
                onClick={() =>
                  setCheckedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }))
                }
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold font-display cursor-pointer disabled:opacity-50"
              >
                Check Answer
              </button>
            ) : currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentIndex((prev) => prev + 1);
                  setSocraticClue(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold font-display cursor-pointer"
              >
                Next Question →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold font-display cursor-pointer"
              >
                Finish Quiz &amp; Save Score
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
