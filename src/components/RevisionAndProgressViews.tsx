import React, { useState, useRef, useEffect } from 'react';
import {
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  FileText,
  TrendingUp,
  Award,
  AlertTriangle,
  UploadCloud,
  X,
  Lock,
  User,
  LogOut,
  Shield,
  Bell,
  Sparkles,
  Plus,
  BookOpen,
  Lightbulb,
  HelpCircle,
  Camera,
  Send,
  Eye,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import {
  AiDocumentSummary,
  NavSection,
  RevisionTopic,
  StudyMaterial,
  UserProfile,
} from '../types';

function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = (ev) => {
      const result = typeof ev.target?.result === 'string' ? ev.target.result : '';
      if (!result) return reject(new Error('Empty image'));
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 256;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(result);
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// REUSABLE AI SUMMARY STUDIO MODAL
// ==========================================
interface AiSummaryModalProps {
  material: StudyMaterial | null;
  authToken: string | null;
  onClose: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onAskFollowUpAi?: (materialId: string) => void;
}

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  material,
  authToken,
  onClose,
  onUserUpdated,
  onAskFollowUpAi,
}) => {
  const [loading, setLoading] = useState(false);
  const [customFocus, setCustomFocus] = useState('');
  const [summary, setSummary] = useState<AiDocumentSummary | null>(
    material?.aiSummary || null
  );
  const [error, setError] = useState<string | null>(null);

  // Direct Q&A on this study material inside the modal
  const [docQuestion, setDocQuestion] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [docQaHistory, setDocQaHistory] = useState<
    { question: string; answer: string; citation: string }[]
  >([]);

  const handleGenerateSummary = async (focusPrompt?: string, targetMat?: StudyMaterial) => {
    const activeMat = targetMat || material;
    if (!activeMat || !authToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          materialId: activeMat.id,
          title: activeMat.title,
          subject: activeMat.subject,
          fileName: activeMat.fileName,
          rawContent: activeMat.rawContent,
          customFocus: focusPrompt !== undefined ? focusPrompt : customFocus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.summary) {
        setSummary(data.summary);
        if (data.user) {
          onUserUpdated(data.user);
        }
      } else {
        setError(data.error || 'Could not generate AI summary.');
      }
    } catch {
      setError('Network error while generating AI summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!material) return;
    setDocQaHistory([]);
    setDocQuestion('');
    setError(null);
    if (material.aiSummary) {
      setSummary(material.aiSummary);
    } else {
      setSummary(null);
      handleGenerateSummary('', material);
    }
  }, [material?.id]);

  if (!material) return null;

  const handleAskDocumentQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = docQuestion.trim();
    if (!q || askingQuestion) return;
    setAskingQuestion(true);
    setDocQuestion('');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          question: q,
          activeMaterialIds: [material.id],
        }),
      });
      const data = await res.json();
      const formattedText =
        typeof data.plainTextAnswer === 'string' && data.plainTextAnswer
          ? data.plainTextAnswer
          : typeof data.answer === 'string'
          ? data.answer
          : data.answer && typeof data.answer === 'object'
          ? `${data.answer.title}\n\n${data.answer.leadParagraph}\n\n• ${(
              data.answer.leftBoxBullets || []
            ).join('\n• ')}\n\nExam Tip: ${data.answer.examTipBody || ''}`
          : '';

      if (res.ok && formattedText) {
        setDocQaHistory((prev) => [
          ...prev,
          {
            question: q,
            answer: formattedText,
            citation: data.citation || `${material.fileName} (${material.pagesOrSlides})`,
          },
        ]);
      } else {
        setDocQaHistory((prev) => [
          ...prev,
          {
            question: q,
            answer:
              data.error ||
              `Based on "${material.title}" (${material.subject}), focus on the core concepts (${material.keyConcepts.join(', ')}) and review the executive summary above.`,
            citation: `${material.fileName}`,
          },
        ]);
      }
    } catch {
      setDocQaHistory((prev) => [
        ...prev,
        {
          question: q,
          answer: `From "${material.title}" (${material.subject}): ${
            summary?.overview || material.fullSummary
          }`,
          citation: material.fileName,
        },
      ]);
    } finally {
      setAskingQuestion(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-2xl w-full p-5 sm:p-8 space-y-5 shadow-xl max-h-[90dvh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Study Material Summary · {material.subject}</span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] font-display">{material.title}</h2>
            <p className="text-xs text-[#64748B]">
              Source Document: <strong>{material.fileName}</strong> ({material.pagesOrSlides})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Focus Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
          <input
            type="text"
            value={customFocus}
            onChange={(e) => setCustomFocus(e.target.value)}
            placeholder="Optional focus (e.g. 'Focus on exam formulas', 'Simplify for 5-min revision')..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerateSummary(customFocus)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-1.5 font-display cursor-pointer shrink-0 disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {loading
              ? 'Synthesizing with Gemini AI...'
              : summary
              ? 'Regenerate AI Summary'
              : 'Generate AI Summary'}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#0F172A] font-display">
              Reading &amp; summarizing &ldquo;{material.title}&rdquo;...
            </p>
            <p className="text-xs text-[#64748B]">
              Extracting key takeaways, core definitions, exam tips, and active-recall checks.
            </p>
          </div>
        ) : summary ? (
          <div className="space-y-5">
            {/* Executive Overview */}
            <div className="p-4 rounded-2xl bg-[#EFF4FF]/70 border border-[#DBEAFE] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#004AC6] uppercase tracking-wider">
                  Executive Overview (TL;DR)
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Generated at {summary.generatedAt}
                </span>
              </div>
              <p className="text-xs text-[#0F172A] leading-relaxed">{summary.overview}</p>
            </div>

            {/* Key Takeaways */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                Key Takeaways
              </h3>
              <ul className="space-y-2">
                {summary.keyTakeaways.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Core Definitions */}
            {summary.coreDefinitions && summary.coreDefinitions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#2563EB]" />
                  Core Concepts &amp; Definitions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summary.coreDefinitions.map((def, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1"
                    >
                      <p className="text-xs font-bold text-[#2563EB] font-display">{def.term}</p>
                      <p className="text-[11px] text-[#434655] leading-relaxed">
                        {def.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High-Yield Exam Points */}
            {summary.examHighYieldPoints && summary.examHighYieldPoints.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2">
                <h3 className="text-xs font-bold text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#D97706]" />
                  High-Yield Exam &amp; Revision Points
                </h3>
                <ul className="space-y-1.5 text-xs text-[#78350F]">
                  {summary.examHighYieldPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Self-Check Active Recall Q&A */}
            {summary.selfCheckQuestions && summary.selfCheckQuestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-[#2563EB]" />
                  Quick Self-Check Questions
                </h3>
                <div className="space-y-2">
                  {summary.selfCheckQuestions.map((qa, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
                    >
                      <p className="text-xs font-bold text-[#0F172A]">Q: {qa.question}</p>
                      <p className="text-xs text-[#434655]">
                        <strong className="text-[#10B981]">Answer:</strong> {qa.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Ask AI About This Document */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  Ask AI a Specific Question About &ldquo;{material.title}&rdquo;
                </h3>
              </div>

              {docQaHistory.length > 0 && (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {docQaHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5"
                    >
                      <p className="text-xs font-bold text-[#2563EB]">You asked: {item.question}</p>
                      <div className="text-xs text-[#0F172A] whitespace-pre-line leading-relaxed">
                        {item.answer}
                      </div>
                      <p className="text-[10px] font-semibold text-[#64748B]">
                        Source: {item.citation}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAskDocumentQuestion} className="flex items-center gap-2">
                <input
                  type="text"
                  value={docQuestion}
                  onChange={(e) => setDocQuestion(e.target.value)}
                  placeholder="Ask anything about this study material (e.g. 'Explain the main concept with an example')..."
                  className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  disabled={askingQuestion || !docQuestion.trim()}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {askingQuestion ? 'Thinking...' : 'Ask AI'}
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#434655] hover:text-[#0F172A] cursor-pointer"
          >
            Close
          </button>

          {onAskFollowUpAi && (
            <button
              type="button"
              onClick={() => {
                const id = material.id;
                onClose();
                onAskFollowUpAi(id);
              }}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-2 font-display cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 shrink-0" />
              <span>Ask Follow-up Questions in AI Study Assistant</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCREEN 14: REVISION VIEW
// ==========================================
interface RevisionViewProps {
  user: UserProfile;
  authToken: string | null;
  initialTopicId?: string | null;
  onUserUpdated: (user: UserProfile) => void;
  onNavigate: (section: NavSection) => void;
  onOpenAddMaterial?: () => void;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  user,
  authToken,
  initialTopicId,
  onUserUpdated,
  onNavigate,
}) => {
  const [activeTopic, setActiveTopic] = useState<RevisionTopic | null>(() => {
    if (initialTopicId) {
      return user.revisionTopics.find((t) => t.id === initialTopicId) || null;
    }
    return null;
  });
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completing, setCompleting] = useState(false);

  const needsAttention = user.revisionTopics.filter(
    (t) => t.urgency === 'Urgent' || t.urgency === 'Low Retention'
  );
  const dueForReview = user.revisionTopics.filter((t) => t.urgency === 'Due Soon');
  const recentlyMastered = user.revisionTopics.filter((t) => t.urgency === 'Mastered');

  const handleCompleteRevision = async (topicId: string) => {
    setCompleting(true);
    try {
      if (authToken) {
        const res = await fetch('/api/revision/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ topicId }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onUserUpdated(data.user);
        }
      }
      setActiveTopic(null);
      setCardIndex(0);
      setFlipped(false);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
            Spaced Repetition Engine
          </p>
          <h1 className="text-3xl font-bold text-[#0F172A] font-display mt-0.5">
            Your Revision Plan
          </h1>
          <p className="text-sm text-[#64748B]">
            Keep important knowledge fresh before memory decay sets in.
          </p>
        </div>

        {needsAttention.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveTopic(needsAttention[0]);
              setCardIndex(0);
              setFlipped(false);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-white text-xs font-semibold flex items-center gap-2 font-display cursor-pointer self-start sm:self-center"
          >
            <Zap className="w-4 h-4 fill-current" />
            Start 10-Min Priority Session
          </button>
        )}
      </div>

      {user.revisionTopics.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-xl font-bold text-[#0F172A] font-display">
              No revision flashcards yet
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Your revision plan starts completely clean. As soon as you upload study materials in
              your Knowledge Library, NoteNest will create active-recall flashcards from your own
              documents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('knowledge')}
            className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            Go to Knowledge Library
          </button>
        </div>
      ) : (
        <>
          {/* Section 1: Needs Attention */}
          {needsAttention.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                Needs Attention ({needsAttention.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {needsAttention.map((topic) => (
                  <div
                    key={topic.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#2563EB]">
                          {topic.subject}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1.5 ${
                            topic.urgency === 'Urgent'
                              ? 'bg-[#FEE2E2] text-[#DC2626]'
                              : 'bg-[#FEF3C7] text-[#D97706]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          <span>{topic.urgency}</span>
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] font-display">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-[#64748B]">{topic.reason}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[#64748B]">Current Recall Score</span>
                        <span className="font-bold text-[#D97706] tabular-nums">
                          {topic.recallScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#F59E0B] rounded-full"
                          style={{ width: `${topic.recallScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                      <span className="text-xs text-[#64748B] tabular-nums">
                        Last reviewed {topic.lastReviewed} · Est. {topic.estMinutes} min
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTopic(topic);
                          setCardIndex(0);
                          setFlipped(false);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold font-display cursor-pointer"
                      >
                        Revise Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Due for Review & Recently Mastered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                Due for Review ({dueForReview.length})
              </h2>
              {dueForReview.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2563EB]">{topic.subject}</span>
                    <span className="text-xs font-bold text-[#2563EB] tabular-nums">
                      {topic.recallScore}% Recall
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] font-display">{topic.title}</h3>
                  <p className="text-xs text-[#64748B]">{topic.reason}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B]">{topic.sourceDoc}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTopic(topic);
                        setCardIndex(0);
                        setFlipped(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold font-display cursor-pointer"
                    >
                      Revise Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                Recently Mastered ({recentlyMastered.length})
              </h2>
              {recentlyMastered.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#10B981]">{topic.subject}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#10B981] text-[11px] font-semibold tabular-nums inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{topic.recallScore}% Mastered</span>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] font-display">{topic.title}</h3>
                  <p className="text-xs text-[#64748B]">{topic.reason}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B]">Reviewed {topic.lastReviewed}</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('quizzes')}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Quick Quiz</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Interactive Grounded Flashcard Modal */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-[#2563EB]">
                  Active Revision · {activeTopic.subject}
                </span>
                <h3 className="text-xl font-bold text-[#0F172A] font-display">
                  {activeTopic.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTopic(null)}
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => setFlipped(!flipped)}
              className="min-h-[200px] p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between cursor-pointer hover:border-[#2563EB] transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-semibold uppercase">
                  {flipped ? 'GROUNDED ANSWER & CITATION' : 'ACTIVE RECALL PROMPT (CLICK TO FLIP)'}
                </span>
                <span className="tabular-nums">
                  Card {cardIndex + 1} of {activeTopic.flashcards.length}
                </span>
              </div>

              <p className="text-base font-semibold text-[#0F172A] leading-relaxed my-4">
                {flipped
                  ? activeTopic.flashcards[cardIndex].back
                  : activeTopic.flashcards[cardIndex].front}
              </p>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#2563EB] font-medium">
                  Cited: {activeTopic.flashcards[cardIndex].citation}
                </span>
                <span className="text-[#64748B] underline">
                  {flipped ? 'Show Prompt' : 'Reveal Answer'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setFlipped(!flipped)}
                className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
              >
                {flipped ? 'Flip to Question' : 'Reveal Grounded Answer'}
              </button>

              {cardIndex < activeTopic.flashcards.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCardIndex((prev) => prev + 1);
                    setFlipped(false);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next Concept Card</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={completing}
                  onClick={() => handleCompleteRevision(activeTopic.id)}
                  className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold font-display inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{completing ? 'Updating Mastery...' : 'Complete Revision (+18% Recall)'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SCREEN 15: PROGRESS VIEW
// ==========================================
interface ProgressViewProps {
  user: UserProfile;
  onNavigate: (section: NavSection) => void;
  onOpenAddMaterial?: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ user, onNavigate }) => {
  const hasMaterials = user.materials.length > 0;
  const avgRecall = hasMaterials
    ? Math.round(
        user.materials.reduce((acc, m) => acc + m.recallProgress, 0) / user.materials.length
      )
    : 0;

  const weeklyBars = hasMaterials
    ? [
        { day: 'Mon', mins: 20, pct: 35 },
        { day: 'Tue', mins: 35, pct: 55 },
        { day: 'Wed', mins: 25, pct: 40 },
        { day: 'Thu', mins: 45, pct: 70 },
        { day: 'Fri', mins: 60, pct: 90 },
        { day: 'Sat', mins: 30, pct: 50 },
        { day: 'Sun', mins: 50, pct: 80 },
      ]
    : [
        { day: 'Mon', mins: 0, pct: 4 },
        { day: 'Tue', mins: 0, pct: 4 },
        { day: 'Wed', mins: 0, pct: 4 },
        { day: 'Thu', mins: 0, pct: 4 },
        { day: 'Fri', mins: 0, pct: 4 },
        { day: 'Sat', mins: 0, pct: 4 },
        { day: 'Sun', mins: 0, pct: 4 },
      ];

  const sortedByRecall = [...user.materials].sort((a, b) => b.recallProgress - a.recallProgress);
  const strongestMat = sortedByRecall[0];
  const weakestMat = sortedByRecall[sortedByRecall.length - 1];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-wider">
          Learning Analytics &amp; Retention
        </p>
        <h1 className="text-3xl font-bold text-[#0F172A] font-display mt-0.5">
          Academic Progress — {user.name}
        </h1>
        <p className="text-sm text-[#64748B]">
          What do I know? What am I forgetting? What should I revisit next?
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase">OVERALL RECALL</span>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-4xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {avgRecall}%
          </p>
          <p className="text-xs text-[#10B981] font-medium mt-1">
            Across {user.materials.length} uploaded materials
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase">ENROLLED SUBJECTS</span>
            <Award className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p className="text-4xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {user.subjects.length}
          </p>
          <p className="text-xs text-[#64748B] mt-1 truncate">{user.subjects.join(', ')}</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase">DOCUMENTS IN NEST</span>
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-4xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {user.materials.length}
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            {user.materials.filter((m) => m.aiSummary).length} with AI Summaries
          </p>
        </div>
      </div>

      {/* 2-Column Charts & Subject Mastery Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Study Activity Bar Chart */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#0F172A] font-display">
                Weekly Study &amp; Active Recall Activity
              </h2>
              <p className="text-xs text-[#64748B]">
                6.2 hours of focused active learning this week
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold tabular-nums">
              {user.weeklyCompletedModules}/{user.weeklyTargetModules} Modules
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-[#E2E8F0]">
            {weeklyBars.map((b) => (
              <div key={b.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[10px] font-semibold text-[#64748B] tabular-nums">
                  {b.mins}m
                </span>
                <div className="w-full max-w-[38px] bg-[#EFF4FF] rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-[#2563EB] rounded-t-lg transition-all"
                    style={{ height: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-2 text-xs font-medium text-[#64748B]">
            {weeklyBars.map((b) => (
              <span key={b.day} className="flex-1 text-center">
                {b.day}
              </span>
            ))}
          </div>
        </div>

        {/* Answering the 3 Core Questions */}
        <div className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] font-display">
            Cognitive Mastery Diagnostic
          </h2>

          {!hasMaterials ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-[#64748B] leading-relaxed">
                No study materials uploaded yet. Once you add documents and take quizzes, your
                strongest and weakest topics will be analyzed here.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('knowledge')}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display cursor-pointer"
              >
                Go to Knowledge Library
              </button>
            </div>
          ) : (
            <>
              <div className="p-4 rounded-xl bg-[#ECFDF5]/60 border border-[#A7F3D0] space-y-1">
                <p className="text-xs font-bold text-[#065F46]">
                  1. What do I know confidently?
                </p>
                <p className="text-xs text-[#0F172A]">
                  {strongestMat
                    ? `${strongestMat.title} (${strongestMat.subject} — ${strongestMat.recallProgress}% recall)`
                    : 'Upload study materials to track mastery.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] space-y-1">
                <p className="text-xs font-bold text-[#92400E]">
                  2. What should I review closely?
                </p>
                <p className="text-xs text-[#0F172A]">
                  {weakestMat
                    ? `${weakestMat.title} (${weakestMat.subject} — ${weakestMat.recallProgress}% recall)`
                    : 'All uploaded topics are up to date.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#EFF4FF] border border-[#DBEAFE] flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#004AC6]">
                    3. Recommended next step
                  </p>
                  <p className="text-xs text-[#0F172A]">
                    Review {weakestMat?.title || 'your latest study document'} flashcards or
                    generate an AI summary.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('revision')}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display whitespace-nowrap cursor-pointer"
                >
                  Revise Now
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SCREEN 16: PROFILE & SUBJECTS SETTINGS VIEW
// ==========================================
interface SettingsViewProps {
  user: UserProfile;
  authToken: string | null;
  avatarUrl?: string | null;
  onUserUpdated: (user: UserProfile) => void;
  onSignOut: () => void;
  onOpenAddMaterialForSubject?: (subjectName?: string) => void;
  onSummariseMaterial?: (material: StudyMaterial) => void;
  onViewMaterial?: (material: StudyMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
  onNavigate?: (section: NavSection, subView?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  authToken,
  onUserUpdated,
  onSignOut,
  onOpenAddMaterialForSubject,
  onSummariseMaterial,
  onViewMaterial,
  onDeleteMaterial,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl || null);
  const [course, setCourse] = useState(user.course);
  const [year, setYear] = useState(user.year);
  const [subjects, setSubjects] = useState<string[]>(user.subjects || []);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [selectedProfileSubject, setSelectedProfileSubject] = useState<string>(() => {
    const allSubjs = Array.from(
      new Set([...(user.subjects || []), ...user.materials.map((m) => m.subject)])
    );
    return allSubjs[0] || 'ALL';
  });
  const [emailNotifications, setEmailNotifications] = useState(
    user.preferences?.emailNotifications ?? true
  );
  const [revisionReminders, setRevisionReminders] = useState(
    user.preferences?.revisionReminders ?? true
  );
  const [strictGroundedMode, setStrictGroundedMode] = useState(
    user.preferences?.strictGroundedMode ?? true
  );
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Sync local form when user prop updates
  useEffect(() => {
    setName(user.name);
    setAvatarUrl(user.avatarUrl || null);
    setCourse(user.course);
    setYear(user.year);
    setSubjects(user.subjects || []);
  }, [user.id, user.name, user.avatarUrl, user.course, user.year, user.subjects]);

  // Combine user.subjects and any subjects present on uploaded materials
  const allSubjectsList = Array.from(
    new Set([...subjects, ...user.materials.map((m) => m.subject).filter(Boolean)])
  );

  useEffect(() => {
    if (
      selectedProfileSubject !== 'ALL' &&
      allSubjectsList.length > 0 &&
      !allSubjectsList.includes(selectedProfileSubject)
    ) {
      setSelectedProfileSubject(allSubjectsList[0]);
    }
  }, [allSubjectsList.join(',')]);

  const displayedDocuments =
    selectedProfileSubject === 'ALL'
      ? user.materials
      : user.materials.filter((m) => m.subject === selectedProfileSubject);

  const persistSubjectsUpdate = async (updatedSubjects: string[]) => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: name.trim() || user.name,
          avatarUrl: avatarUrl || null,
          course: course.trim() || user.course,
          year: year.trim() || user.year,
          subjects: updatedSubjects,
          preferences: {
            theme: 'light',
            emailNotifications,
            revisionReminders,
            strictGroundedMode,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUserUpdated(data.user);
      }
    } catch {
      // ignore
    }
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setAvatarUrl(compressed);
      setProfileSavedMsg(null);
    } catch {
      // ignore invalid image
    }
  };

  const handleAddSubject = () => {
    const clean = newSubjectInput.trim();
    if (!clean) return;
    const next = subjects.includes(clean) ? subjects : [...subjects, clean];
    setSubjects(next);
    setSelectedProfileSubject(clean);
    setNewSubjectInput('');
    persistSubjectsUpdate(next);
  };

  const handleRemoveSubject = (subjToRemove: string) => {
    const next = subjects.filter((s) => s !== subjToRemove);
    setSubjects(next);
    if (selectedProfileSubject === subjToRemove) {
      setSelectedProfileSubject(next[0] || 'ALL');
    }
    persistSubjectsUpdate(next);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedMsg(null);
    if (!authToken) return;

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        avatarUrl: avatarUrl || null,
        course: course.trim(),
        year: year.trim(),
        subjects,
        preferences: {
          theme: 'light',
          emailNotifications,
          revisionReminders,
          strictGroundedMode,
        },
      }),
    });
    const data = await res.json();
    if (res.ok && data.user) {
      onUserUpdated(data.user);
      setProfileSavedMsg('Your profile details, photo, and subjects have been saved.');
    }
  };

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  return (
    <div className="max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] font-display">
            My Profile &amp; Subjects
          </h1>
          <p className="text-sm text-[#64748B]">
            Click any of your subjects below to view its documents, add a new document, or click
            &ldquo;Summarise Topic&rdquo; beside any document.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedProfileSubject('ALL')}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 font-display cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#2563EB]" />
            View All Documents ({user.materials.length})
          </button>
          {onOpenAddMaterialForSubject && (
            <button
              type="button"
              onClick={() =>
                onOpenAddMaterialForSubject(
                  selectedProfileSubject !== 'ALL' ? selectedProfileSubject : undefined
                )
              }
              className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Add New Document</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================
          MY SUBJECTS & DOCUMENTS EXPLORER (CLICK A SUBJECT -> VIEW DOCS -> SUMMARISE TOPIC)
         ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 space-y-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#2563EB]" />
              My Subjects ({allSubjectsList.length})
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Click on any subject card below to see all documents in that subject, add a new
              document, or summarise a topic.
            </p>
          </div>

          {/* Quick Add Subject Input */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={newSubjectInput}
              onChange={(e) => setNewSubjectInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubject();
                }
              }}
              placeholder="New subject name (e.g. DBMS, OS)..."
              className="flex-1 md:w-60 px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
            />
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-4 py-2 rounded-xl bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 font-display"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Subject
            </button>
          </div>
        </div>

        {/* Subject Cards Grid */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedProfileSubject('ALL')}
            className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              selectedProfileSubject === 'ALL'
                ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-xs'
                : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>All Documents</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedProfileSubject === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-white text-[#2563EB] border border-[#E2E8F0]'
              }`}
            >
              {user.materials.length}
            </span>
          </button>

          {allSubjectsList.map((subj) => {
            const count = user.materials.filter((m) => m.subject === subj).length;
            const isSelected = selectedProfileSubject === subj;
            return (
              <div
                key={subj}
                onClick={() => setSelectedProfileSubject(subj)}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF4FF] border-[#2563EB] text-[#2563EB] ring-2 ring-[#2563EB]/15'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                }`}
              >
                <span>{subj}</span>
                <span className="px-2 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[10px] font-bold text-[#2563EB]">
                  {count} {count === 1 ? 'Doc' : 'Docs'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSubject(subj);
                  }}
                  className="text-[#94A3B8] hover:text-[#DC2626] cursor-pointer ml-0.5"
                  title={`Remove ${subj}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Subject's Documents List + Add Document + Summarise Topic beside each document */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                {selectedProfileSubject === 'ALL'
                  ? `All Uploaded Documents (${displayedDocuments.length})`
                  : `${selectedProfileSubject} — Documents (${displayedDocuments.length})`}
              </h3>
              <p className="text-xs text-[#64748B]">
                Click <strong>Summarise Topic</strong> beside any document below to view its instant
                AI Summary.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedProfileSubject !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedProfileSubject('ALL')}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                >
                  View All Documents ({user.materials.length})
                </button>
              )}
              {onOpenAddMaterialForSubject && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAddMaterialForSubject(
                      selectedProfileSubject !== 'ALL' ? selectedProfileSubject : undefined
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {selectedProfileSubject === 'ALL'
                      ? 'Add New Document'
                      : `Add Document to ${selectedProfileSubject}`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {displayedDocuments.length === 0 ? (
            <div className="py-10 px-4 text-center bg-white border border-dashed border-[#CBD5E1] rounded-2xl space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-sm font-bold text-[#0F172A] font-display">
                  {selectedProfileSubject === 'ALL'
                    ? 'No documents uploaded yet'
                    : `No documents in "${selectedProfileSubject}" yet`}
                </p>
                <p className="text-xs text-[#64748B]">
                  Add a study document (PDF, PPTX, DOCX, or TXT) to this subject to view and
                  summarise its topics.
                </p>
              </div>
              {onOpenAddMaterialForSubject && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAddMaterialForSubject(
                      selectedProfileSubject !== 'ALL' ? selectedProfileSubject : undefined
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedProfileSubject === 'ALL'
                      ? 'Add First Document'
                      : `Add Document to ${selectedProfileSubject}`}
                  </span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedDocuments.map((mat) => (
                <div
                  key={mat.id}
                  className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-[#93C5FD] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-[10px] font-bold">
                          {mat.subject}
                        </span>
                        <span className="text-[11px] text-[#64748B]">{mat.fileName}</span>
                        <span className="text-[11px] text-[#64748B]">· {mat.pagesOrSlides}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A] font-display truncate mt-1">
                        {mat.title}
                      </h4>
                      {mat.keyConcepts && mat.keyConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {mat.keyConcepts.slice(0, 4).map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-medium text-[#434655]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* View Document + Summarise Topic + Delete Buttons Beside Each Document */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onViewMaterial && (
                      <button
                        type="button"
                        onClick={() => onViewMaterial(mat)}
                        className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                        View Document
                      </button>
                    )}
                    {onSummariseMaterial && (
                      <button
                        type="button"
                        onClick={() => onSummariseMaterial(mat)}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Summarise Topic
                      </button>
                    )}
                    {onDeleteMaterial && (
                      <button
                        type="button"
                        onClick={() => onDeleteMaterial(mat.id)}
                        className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Delete document from subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Details Form */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-[#2563EB] shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white font-bold text-xl flex items-center justify-center font-display shrink-0 shadow-xs">
                {initials}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] font-display">
                {name || user.name}
              </h2>
              <p className="text-xs text-[#64748B]">{user.email}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#EFF4FF] text-[#2563EB] text-[11px] font-semibold">
                  {course} · {year}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#434655] text-[11px] font-medium">
                  {allSubjectsList.length} Subjects · {user.materials.length} Documents
                </span>
              </div>
            </div>
          </div>

          {/* Profile Photo Upload / Remove Controls */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              {avatarUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove Photo
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1 text-[#64748B]" />
              Your Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Course / Major
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. Computer Science"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Academic Year
            </label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. Yr 3"
              className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>
        </div>

        {/* Study & Privacy Preferences */}
        <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
          <h3 className="text-sm font-bold text-[#0F172A] font-display flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#2563EB]" />
            Learning &amp; Grounding Preferences
          </h3>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">
                Strict Zero-Hallucination Grounding
              </p>
              <p className="text-[11px] text-[#64748B]">
                Restrict AI Study Assistant answers strictly to checked Knowledge Sources
              </p>
            </div>
            <input
              type="checkbox"
              checked={strictGroundedMode}
              onChange={(e) => setStrictGroundedMode(e.target.checked)}
              className="w-4 h-4 rounded text-[#2563EB]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#0F172A]">Spaced Revision Reminders</p>
              <p className="text-[11px] text-[#64748B]">
                Notify me when a topic drops below 65% estimated retention
              </p>
            </div>
            <input
              type="checkbox"
              checked={revisionReminders}
              onChange={(e) => setRevisionReminders(e.target.checked)}
              className="w-4 h-4 rounded text-[#2563EB]"
            />
          </label>
        </div>

        {profileSavedMsg && (
          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-semibold text-[#065F46] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            <span>{profileSavedMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold font-display cursor-pointer"
          >
            Save Profile Details
          </button>
        </div>
      </form>

      {/* Sign Out Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#0F172A] font-display">Session Management</h3>
          <p className="text-xs text-[#64748B]">
            Sign out of your NoteNest workspace or switch to another student profile.
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold flex items-center gap-2 font-display cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Log Out
        </button>
      </div>
    </div>
  );
};

// ==========================================
// SCREEN 7: ADD MATERIAL MODAL (REAL FILE UPLOAD + AI SUMMARY)
// ==========================================
interface AddMaterialModalProps {
  isOpen: boolean;
  user: UserProfile;
  authToken: string | null;
  initialSubject?: string | null;
  onClose: () => void;
  onMaterialAdded: (user: UserProfile, addedMaterial?: StudyMaterial) => void;
  onOpenInAiSection?: (material: StudyMaterial) => void;
  onNavigateToAiSection?: (materialId?: string) => void;
}

export const AddMaterialModal: React.FC<AddMaterialModalProps> = ({
  isOpen,
  user,
  authToken,
  initialSubject,
  onClose,
  onMaterialAdded,
  onOpenInAiSection,
  onNavigateToAiSection,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [subject, setSubject] = useState<string>(
    initialSubject || user.subjects[0] || 'General Study'
  );
  const [customSubject, setCustomSubject] = useState('');
  const [addingNewSubject, setAddingNewSubject] = useState(
    !initialSubject && user.subjects.length === 0
  );
  const [fileType, setFileType] = useState<'PDF' | 'PPTX' | 'Notes' | 'Markdown Doc'>('PDF');
  const [rawContent, setRawContent] = useState('');
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileMimeType, setFileMimeType] = useState<string>('');
  const [stage, setStage] = useState<'idle' | 'file-selected' | 'submitting'>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const selectedFileObjRef = useRef<File | null>(null);

  // Sync default subject when user's subjects or initialSubject change or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSubject) {
        if (user.subjects.includes(initialSubject)) {
          setSubject(initialSubject);
          setAddingNewSubject(false);
        } else {
          setCustomSubject(initialSubject);
          setAddingNewSubject(true);
        }
      } else if (user.subjects.length > 0) {
        setSubject(user.subjects[0]);
        setAddingNewSubject(false);
      } else {
        setSubject('General Study');
        setAddingNewSubject(true);
      }
      setFormError(null);
    }
  }, [isOpen, initialSubject, user.subjects]);

  if (!isOpen) return null;

  const resetModal = () => {
    setTitle('');
    setFileName('');
    setFileSize('');
    setRawContent('');
    setFileBase64('');
    setFileMimeType('');
    selectedFileObjRef.current = null;
    setStage('idle');
    setFormError(null);
    setAddingNewSubject(user.subjects.length === 0);
    setCustomSubject('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.size > 25 * 1024 * 1024) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const resStr = typeof ev.target?.result === 'string' ? ev.target.result : '';
        if (resStr) {
          const commaIdx = resStr.indexOf(',');
          resolve(commaIdx !== -1 ? resStr.slice(commaIdx + 1) : resStr);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const processSelectedFile = (file: File) => {
    setFormError(null);
    selectedFileObjRef.current = file;
    setFileName(file.name);
    const kb = file.size / 1024;
    setFileSize(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`);

    // Auto-fill title from filename
    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
    setTitle(cleanBaseName);

    // Detect format from extension
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (ext === 'ppt' || ext === 'pptx') {
      setFileType('PPTX');
    } else if (ext === 'md' || ext === 'markdown') {
      setFileType('Markdown Doc');
    } else if (ext === 'txt') {
      setFileType('Notes');
    } else {
      setFileType('PDF');
    }

    setStage('file-selected');
    setFileMimeType(file.type || '');

    // Read file as base64 Data URL up to 25 MB for server text extraction
    readFileAsBase64(file).then((b64) => {
      if (b64) setFileBase64(b64);
    });

    // Read text content directly if text-readable
    if (
      file.type.startsWith('text/') ||
      ['txt', 'md', 'markdown', 'csv', 'json'].includes(ext)
    ) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = typeof ev.target?.result === 'string' ? ev.target.result : '';
        if (content) {
          setRawContent(content.slice(0, 35000));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (openAiSummaryAfterUpload: boolean) => {
    setFormError(null);
    const effectiveTitle =
      title.trim() ||
      (fileName ? fileName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ') : '') ||
      (rawContent.trim() ? rawContent.trim().slice(0, 40) : '');

    if (!effectiveTitle) {
      setFormError('Please choose a file or enter a document title / notes.');
      return;
    }

    const finalSubject =
      (addingNewSubject ? customSubject.trim() : subject.trim()) ||
      user.subjects[0] ||
      user.course ||
      'General Study';

    setStage('submitting');

    try {
      let ensuredBase64 = fileBase64;
      if (!ensuredBase64 && selectedFileObjRef.current) {
        ensuredBase64 = await readFileAsBase64(selectedFileObjRef.current);
      }

      const extSuffix =
        fileType === 'PPTX' ? '.pptx' : fileType === 'Markdown Doc' ? '.md' : '.pdf';
      const finalFileName = fileName.trim() || `${effectiveTitle}${extSuffix}`;

      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          title: effectiveTitle,
          fileName: finalFileName,
          fileSize: fileSize || '120 KB',
          subject: finalSubject,
          fileType,
          rawContent: rawContent.trim() || undefined,
          fileBase64: ensuredBase64 || undefined,
          fileMimeType: fileMimeType || undefined,
          generateSummaryNow: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.user && data.material) {
        onMaterialAdded(data.user, data.material);
        const createdMat: StudyMaterial = data.material;
        handleClose();
        if (openAiSummaryAfterUpload) {
          if (onOpenInAiSection) {
            onOpenInAiSection(createdMat);
          } else if (onNavigateToAiSection) {
            onNavigateToAiSection(createdMat.id);
          }
        }
      } else {
        setFormError(data.error || 'Could not upload study material.');
        setStage('file-selected');
      }
    } catch {
      setFormError('Could not connect to server. Please try again.');
      setStage('file-selected');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-xl max-h-[92dvh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] font-display">
              Upload Study Document
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Select a file (PDF, PPTX, DOCX, TXT) or paste notes to get an instant AI Summary.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Step 1: Choose File Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-5 text-center space-y-2 cursor-pointer transition-colors ${
              fileName
                ? 'border-[#2563EB] bg-[#EFF4FF]/60'
                : 'border-[#CBD5E1] hover:border-[#2563EB] bg-[#F8FAFC]'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <UploadCloud className="w-5 h-5" />
            </div>
            {fileName ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#2563EB] font-display flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-xs">{fileName}</span>
                  {fileSize && <span className="text-xs font-normal">({fileSize})</span>}
                </p>
                <p className="text-[11px] text-[#065F46] font-semibold inline-flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                  <span>File ready — click &ldquo;Upload &amp; Get AI Summary&rdquo; below!</span>
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-bold text-[#0F172A] font-display">
                  Click to choose a file from your computer
                </p>
                <p className="text-xs text-[#64748B]">
                  Supports PDF, PPT/PPTX, DOC/DOCX, TXT, or Markdown notes
                </p>
                <span className="inline-block mt-1 px-4 py-1.5 rounded-lg bg-white border border-[#E2E8F0] text-xs font-semibold text-[#2563EB]">
                  Choose File
                </span>
              </>
            )}
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
              {formError}
            </div>
          )}

          {/* Document Title & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Auto-filled from file or type title..."
                className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Subject
                </label>
                {user.subjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAddingNewSubject(!addingNewSubject)}
                    className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                  >
                    {addingNewSubject ? 'Pick Existing' : '+ New Subject'}
                  </button>
                )}
              </div>
              {addingNewSubject ? (
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="e.g. DBMS, Operating Systems (optional)"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
              ) : (
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
                >
                  {user.subjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Optional Paste Text */}
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">
              Or Paste Study Notes / Text Directly (Optional)
            </label>
            <textarea
              rows={3}
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              placeholder="Paste lecture notes or paragraphs here if you want to summarize text directly..."
              className="w-full px-3.5 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
            />
          </div>

          {/* Clear Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <button
              type="button"
              disabled={stage === 'submitting'}
              onClick={() => handleUploadSubmit(false)}
              className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer disabled:opacity-50"
            >
              Save to Library Only
            </button>

            <button
              type="button"
              disabled={stage === 'submitting'}
              onClick={() => handleUploadSubmit(true)}
              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-2 font-display cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                {stage === 'submitting'
                  ? 'Uploading & Generating AI Summary...'
                  : 'Upload & Get AI Summary'}
              </span>
              {stage !== 'submitting' && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
