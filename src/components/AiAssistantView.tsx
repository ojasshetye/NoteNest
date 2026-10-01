import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  GraduationCap,
  FileText,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  Send,
  Lightbulb,
  MessageSquare,
  UploadCloud,
  RefreshCw,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  AiDocumentSummary,
  NavSection,
  StructuredAiAnswer,
  StudyMaterial,
  UserProfile,
} from '../types';
import { NoteNestLogo } from './NoteNestLogo';

interface AiAssistantViewProps {
  user: UserProfile;
  authToken: string | null;
  avatarUrl?: string | null;
  initialMaterialId?: string | null;
  initialTab?: 'summarizer' | 'qa';
  onNavigate: (section: NavSection) => void;
  onOpenAddMaterial: () => void;
  onUserUpdated: (user: UserProfile) => void;
  onViewMaterial?: (material: StudyMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

interface QaTurn {
  id: string;
  question: string;
  answer: StructuredAiAnswer;
  generatedIn: string;
  scopeLabel: string;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  user,
  authToken,
  avatarUrl,
  initialMaterialId,
  onUserUpdated,
  onViewMaterial,
  onDeleteMaterial,
}) => {
  const effectiveAvatar = user.avatarUrl || avatarUrl || null;
  const userInitials =
    (user.name || 'Student')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  // Selected document ID — always defaults to initialMaterialId or the latest uploaded document
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    if (initialMaterialId && user.materials.some((m) => m.id === initialMaterialId)) {
      return initialMaterialId;
    }
    return user.materials[0]?.id || '';
  });

  const [topicOrFocusInput, setTopicOrFocusInput] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [directSummaryResult, setDirectSummaryResult] = useState<{
    title: string;
    subject: string;
    summary: AiDocumentSummary;
  } | null>(null);

  // 1-Click Direct File Upload right inside the AI Summary Portal
  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const [quickUploading, setQuickUploading] = useState(false);
  const [quickUploadingName, setQuickUploadingName] = useState('');

  // Auto-select latest uploaded document when user.materials or initialMaterialId updates
  useEffect(() => {
    if (initialMaterialId && user.materials.some((m) => m.id === initialMaterialId)) {
      setSelectedMaterialId(initialMaterialId);
    } else if (
      user.materials.length > 0 &&
      (!selectedMaterialId || !user.materials.some((m) => m.id === selectedMaterialId))
    ) {
      setSelectedMaterialId(user.materials[0].id);
    }
  }, [initialMaterialId, user.materials]);

  const selectedMaterial: StudyMaterial | undefined =
    user.materials.find((m) => m.id === selectedMaterialId) || user.materials[0];

  const currentSummary: AiDocumentSummary | null =
    selectedMaterial?.aiSummary || directSummaryResult?.summary || null;

  // Track which material IDs we have already auto-triggered so we don't loop
  const autoSummarizedIdsRef = useRef<Set<string>>(new Set());

  // Automatically generate summary if the selected uploaded document doesn't have one yet
  useEffect(() => {
    if (
      selectedMaterial &&
      !selectedMaterial.aiSummary &&
      !summaryLoading &&
      !autoSummarizedIdsRef.current.has(selectedMaterial.id)
    ) {
      autoSummarizedIdsRef.current.add(selectedMaterial.id);
      handleGenerateSummary(selectedMaterial, '');
    }
  }, [selectedMaterial?.id, selectedMaterial?.aiSummary]);

  // 1-Click File Upload & Immediate Auto-Summary
  const handleInstantFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSummaryError(null);
    setQuickUploading(true);
    setQuickUploadingName(file.name);

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileType =
      ext === 'ppt' || ext === 'pptx'
        ? 'PPTX'
        : ext === 'doc' || ext === 'docx'
        ? 'DOCX'
        : ext === 'md' || ext === 'markdown'
        ? 'Markdown Doc'
        : ext === 'txt'
        ? 'Notes'
        : 'PDF';
    const kb = file.size / 1024;
    const fileSizeStr =
      kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;

    const uploadToServer = async (b64Data: string, textContent: string) => {
      try {
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify({
            title: cleanTitle,
            fileName: file.name,
            fileSize: fileSizeStr,
            subject: user.subjects[0] || user.course || 'General Study',
            fileType,
            fileBase64: b64Data || undefined,
            fileMimeType: file.type || 'application/octet-stream',
            rawContent: textContent || undefined,
            generateSummaryNow: true,
          }),
        });
        const data = await res.json();
        if (res.ok && data.user && data.material) {
          onUserUpdated(data.user);
          setSelectedMaterialId(data.material.id);
          setDirectSummaryResult(null);
        } else {
          setSummaryError(data.error || 'Could not upload and summarize file.');
        }
      } catch {
        setSummaryError('Could not connect to server while uploading file. Please try again.');
      } finally {
        setQuickUploading(false);
        setQuickUploadingName('');
        if (quickFileInputRef.current) {
          quickFileInputRef.current.value = '';
        }
      }
    };

    // Read base64 (up to 3MB) and text if applicable
    const b64Reader = new FileReader();
    b64Reader.onload = (ev) => {
      const dataUrl = typeof ev.target?.result === 'string' ? ev.target.result : '';
      const commaIdx = dataUrl.indexOf(',');
      const b64 = commaIdx !== -1 ? dataUrl.slice(commaIdx + 1) : '';

      if (
        file.type.startsWith('text/') ||
        ['txt', 'md', 'markdown', 'csv', 'json'].includes(ext)
      ) {
        const txtReader = new FileReader();
        txtReader.onload = (tev) => {
          const txt = typeof tev.target?.result === 'string' ? tev.target.result : '';
          uploadToServer(b64, txt.slice(0, 20000));
        };
        txtReader.onerror = () => uploadToServer(b64, '');
        txtReader.readAsText(file);
      } else {
        uploadToServer(b64, '');
      }
    };
    b64Reader.onerror = () => uploadToServer('', '');

    if (file.size <= 25 * 1024 * 1024) {
      b64Reader.readAsDataURL(file);
    } else {
      uploadToServer('', '');
    }
  };

  // Generate or Regenerate Summary for selected document or typed topic
  const handleGenerateSummary = async (targetMat?: StudyMaterial, focusOverride?: string) => {
    const mat = targetMat !== undefined ? targetMat : selectedMaterial;
    const focusText = focusOverride !== undefined ? focusOverride.trim() : topicOrFocusInput.trim();

    if (!mat && !focusText) {
      setSummaryError('Please upload a document or type a topic to summarize.');
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          materialId: mat?.id,
          title: mat?.title || focusText || 'Study Topic Summary',
          subject: mat?.subject || user.subjects[0] || user.course || 'General Study',
          fileName: mat?.fileName || 'Topic_Summary.pdf',
          rawContent: mat?.rawContent || focusText,
          customFocus: focusText || undefined,
        }),
      });
      const data = await res.json();
      const returnedSummary: AiDocumentSummary | undefined = data.summary || data.aiSummary;

      if (res.ok && returnedSummary) {
        if (data.user) {
          onUserUpdated(data.user);
        }
        if (!mat) {
          setDirectSummaryResult({
            title: focusText || 'Academic Topic Summary',
            subject: user.subjects[0] || user.course || 'General Study',
            summary: returnedSummary,
          });
        }
      } else {
        setSummaryError(data.error || 'Could not generate AI summary.');
      }
    } catch {
      setSummaryError('Could not reach the AI summary service. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleCopyFullSummary = () => {
    if (!currentSummary) return;
    const docTitle = selectedMaterial?.title || directSummaryResult?.title || 'AI Study Summary';
    const text = [
      `${docTitle} — AI Summary`,
      '',
      `OVERVIEW:`,
      currentSummary.overview,
      '',
      `KEY TAKEAWAYS:`,
      ...currentSummary.keyTakeaways.map((t, i) => `${i + 1}. ${t}`),
      '',
      `EXAM REVISION TIPS:`,
      ...(currentSummary.examHighYieldPoints || []).map((p) => `• ${p}`),
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Q&A AI Tutor State
  const [promptInput, setPromptInput] = useState('');
  const [qaHistory, setQaHistory] = useState<QaTurn[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAskQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed) return;

    setPromptInput('');
    setQaLoading(true);
    setQaError(null);

    const activeIds = selectedMaterial
      ? [selectedMaterial.id]
      : user.materials.map((s) => s.id);

    const scopeLabel = selectedMaterial
      ? `Based on ${selectedMaterial.title}`
      : `${user.subjects[0] || 'AI'} Academic Tutor`;

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          question: trimmed,
          activeMaterialIds: activeIds,
          subjectHint:
            selectedMaterial?.subject || user.subjects[0] || user.course || 'Computer Science',
        }),
      });
      const data = await res.json();
      if (data.answer) {
        const newTurn: QaTurn = {
          id: `qa-${Date.now()}`,
          question: trimmed,
          answer: data.answer,
          generatedIn: data.generatedIn || '1.0s',
          scopeLabel,
        };
        setQaHistory((prev) => [newTurn, ...prev]);
      } else {
        setQaError(data.message || 'Could not generate an answer right now.');
      }
    } catch {
      setQaError('Could not connect to AI Tutor. Please try again.');
    } finally {
      setQaLoading(false);
    }
  };

  const handleCopyAnswer = (turn: QaTurn) => {
    const text = `${turn.answer.title}\n\n${turn.answer.leadParagraph}\n\n${turn.answer.examTipTitle} ${turn.answer.examTipBody}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(turn.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isResumeOrProjectDoc = selectedMaterial
    ? /resume|cv|portfolio|curriculum vitae|biodata|profile/i.test(
        `${selectedMaterial.title} ${selectedMaterial.fileName}`
      )
    : false;

  const quickPromptChips: string[] = selectedMaterial
    ? isResumeOrProjectDoc
      ? [
          `Which projects are included in ${selectedMaterial.title}?`,
          `What technical skills and tools are listed in ${selectedMaterial.title}?`,
          `Summarize the education and experience in ${selectedMaterial.title}`,
        ]
      : [
          `Which projects or main topics are included in ${selectedMaterial.title}?`,
          `Summarize the key points of ${selectedMaterial.title} in simple terms`,
          `What are the most important questions from ${selectedMaterial.title}?`,
        ]
    : [
        'Explain Conflict Serializability in DBMS with a simple example',
        'Explain Deadlock Prevention in Operating Systems',
        'Explain User Journey Mapping and Persona Research steps',
      ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-14">
      {/* Hidden 1-Click File Input */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept=".pdf,.pptx,.ppt,.docx,.doc,.txt,.md,.csv"
        onChange={handleInstantFileUpload}
        className="hidden"
      />

      {/* =========================================================
          SIMPLE, CLEAR TOP HEADER
         ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Simple AI Summary Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display tracking-tight">
            AI Document Summary &amp; Tutor
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Upload any study file or select an uploaded document below to see its complete AI
            Summary immediately.
          </p>
        </div>

        <button
          type="button"
          disabled={quickUploading}
          onClick={() => quickFileInputRef.current?.click()}
          className="px-5 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 font-display cursor-pointer shrink-0 shadow-xs disabled:opacity-60"
        >
          <UploadCloud className="w-4 h-4 shrink-0" />
          <span>
            {quickUploading
              ? `Summarizing ${quickUploadingName || 'File'}...`
              : 'Upload File for Instant Summary'}
          </span>
        </button>
      </div>

      {/* =========================================================
          STEP 1: SELECT YOUR UPLOADED DOCUMENT (IF ANY EXIST)
         ========================================================= */}
      {user.materials.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 sm:p-6 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#2563EB] text-white text-[11px] flex items-center justify-center font-bold">
                1
              </span>
              Select Uploaded Document ({user.materials.length})
            </span>
            <span className="text-xs text-[#64748B]">
              Click any document below to view its AI summary
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {user.materials.map((mat) => {
              const isSelected = selectedMaterial?.id === mat.id;
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => {
                    setSelectedMaterialId(mat.id);
                    setDirectSummaryResult(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#EFF4FF] border-[#2563EB] ring-2 ring-[#2563EB]/15'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#2563EB] text-white' : 'bg-white text-[#2563EB] border border-[#E2E8F0]'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-bold text-[#2563EB] truncate">
                        {mat.subject}
                      </span>
                      <span className="text-[10px] font-semibold text-[#065F46] inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                        Ready
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">
                      {mat.title}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate">{mat.fileName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          STEP 2: INSTANT AI SUMMARY DISPLAY (AUTO-GENERATED)
         ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-2xs">
        {summaryError && (
          <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#DC2626]">
            {summaryError}
          </div>
        )}

        {quickUploading || summaryLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-[#0F172A] font-display">
              Generating Your AI Summary...
            </p>
            <p className="text-xs text-[#64748B]">
              Creating a clear overview, key takeaways, important terms, and exam revision points.
            </p>
          </div>
        ) : currentSummary ? (
          <div className="space-y-6">
            {/* Summary Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-xs font-bold">
                    {selectedMaterial?.subject || directSummaryResult?.subject || 'Study Summary'}
                  </span>
                  {selectedMaterial?.fileName && (
                    <span className="text-xs text-[#64748B]">
                      File: {selectedMaterial.fileName}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] text-[11px] font-semibold inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    AI Summary Ready
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] font-display">
                  {selectedMaterial?.title || directSummaryResult?.title || 'Document Summary'}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                {selectedMaterial && onViewMaterial && (
                  <button
                    type="button"
                    onClick={() => onViewMaterial(selectedMaterial)}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                    View Document
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyFullSummary}
                  className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSummary ? (
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                  )}
                  {copiedSummary ? 'Copied!' : 'Copy Summary'}
                </button>

                <button
                  type="button"
                  onClick={() => handleGenerateSummary(selectedMaterial, topicOrFocusInput)}
                  className="px-3.5 py-2 rounded-xl bg-[#EFF4FF] hover:bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Summary
                </button>

                {selectedMaterial && onDeleteMaterial && (
                  <button
                    type="button"
                    onClick={() => onDeleteMaterial(selectedMaterial.id)}
                    className="p-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] flex items-center justify-center cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 1. Quick Summary (Overview) */}
            <div className="p-5 rounded-2xl bg-[#EFF4FF]/70 border border-[#DBEAFE] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#004AC6] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  1. Quick Summary (Overview)
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Updated {currentSummary.generatedAt}
                </span>
              </div>
              <p className="text-sm text-[#0F172A] leading-relaxed">
                {currentSummary.overview}
              </p>
            </div>

            {/* 2. Key Points & Takeaways */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                2. Key Points to Remember ({currentSummary.keyTakeaways.length})
              </h3>
              <ul className="space-y-2.5">
                {currentSummary.keyTakeaways.map((item, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs sm:text-sm text-[#0F172A] flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#DBEAFE] text-[#2563EB] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 3. Important Terms & Definitions */}
            {currentSummary.coreDefinitions && currentSummary.coreDefinitions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#2563EB]" />
                  3. Important Terms &amp; Definitions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentSummary.coreDefinitions.map((def, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-[#E2E8F0] space-y-1.5"
                    >
                      <p className="text-xs font-bold text-[#2563EB] font-display">{def.term}</p>
                      <p className="text-xs text-[#434655] leading-relaxed">{def.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. High-Yield Exam Points */}
            {currentSummary.examHighYieldPoints &&
              currentSummary.examHighYieldPoints.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] space-y-2.5">
                  <h3 className="text-xs font-bold text-[#92400E] uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-[#D97706]" />
                    4. Exam Revision Tips
                  </h3>
                  <ul className="space-y-2 text-xs text-[#78350F]">
                    {currentSummary.examHighYieldPoints.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <span className="font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* 5. Self-Check Questions & Answers */}
            {currentSummary.selfCheckQuestions &&
              currentSummary.selfCheckQuestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-[#2563EB]" />
                    5. Quick Practice Questions &amp; Answers
                  </h3>
                  <div className="space-y-2.5">
                    {currentSummary.selfCheckQuestions.map((qa, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                      >
                        <p className="text-xs font-bold text-[#0F172A]">
                          Q{idx + 1}: {qa.question}
                        </p>
                        <p className="text-xs text-[#434655] leading-relaxed">
                          <strong className="text-[#10B981]">Answer:</strong> {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* EMPTY STATE WHEN 0 DOCUMENTS ARE UPLOADED YET */
          <div className="py-10 px-4 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h2 className="text-lg font-bold text-[#0F172A] font-display">
                Upload a File or Type a Topic to Get an Instant AI Summary
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Choose any PDF, PPTX, DOCX, or TXT file from your computer and NoteNest will
                automatically display its summary here—or type any topic below.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => quickFileInputRef.current?.click()}
                className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                Choose File (PDF, PPTX, DOCX, TXT)
              </button>
            </div>

            {/* Or Summarize Any Topic Directly */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateSummary(undefined, topicOrFocusInput);
              }}
              className="max-w-lg mx-auto pt-4 flex flex-col sm:flex-row gap-2"
            >
              <input
                type="text"
                value={topicOrFocusInput}
                onChange={(e) => setTopicOrFocusInput(e.target.value)}
                placeholder="Or type any topic to summarize (e.g. 'User Journey Mapping', 'DBMS 2PL')..."
                className="flex-1 px-4 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
              />
              <button
                type="submit"
                disabled={!topicOrFocusInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-semibold font-display cursor-pointer shrink-0 disabled:opacity-50"
              >
                Get AI Summary
              </button>
            </form>
          </div>
        )}
      </div>

      {/* =========================================================
          SIMPLE "ASK AI TUTOR A QUESTION" SECTION BELOW SUMMARY
         ========================================================= */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 shadow-2xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(promptInput);
          }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
              Ask a Question to AI Tutor
            </label>
            <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF4FF] px-2.5 py-1 rounded-full">
              {selectedMaterial
                ? `Answering from: ${selectedMaterial.title}`
                : 'Ready for any academic question'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ask any question about your document or subject..."
              className="flex-1 px-4 py-3 text-sm bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
            />
            <button
              type="submit"
              disabled={qaLoading || !promptInput.trim()}
              className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center justify-center gap-2 font-display cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {qaLoading ? 'Answering...' : 'Ask AI Tutor'}
            </button>
          </div>

          {/* Quick Suggested Questions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-[#64748B]">Quick questions:</span>
            {quickPromptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAskQuestion(chip)}
                className="px-3 py-1.5 rounded-full bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-[11px] font-medium text-[#0F172A] hover:text-[#2563EB] transition-colors cursor-pointer text-left"
              >
                {chip}
              </button>
            ))}
          </div>
        </form>

        {qaError && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#DC2626]">
            {qaError}
          </div>
        )}

        {qaLoading && (
          <div className="p-6 border border-[#E2E8F0] rounded-2xl text-center space-y-2 animate-pulse bg-[#F8FAFC]">
            <Sparkles className="w-5 h-5 text-[#2563EB] mx-auto" />
            <p className="text-xs font-bold text-[#0F172A] font-display">
              AI Tutor is preparing your answer...
            </p>
          </div>
        )}

        {qaHistory.length > 0 && (
          <div className="space-y-5 pt-2">
            {qaHistory.map((turn) => (
              <div
                key={turn.id}
                className="pt-5 border-t border-[#E2E8F0] first:border-t-0 first:pt-0 space-y-4"
              >
                <div className="flex items-center justify-end gap-3">
                  <div className="bg-[#DBEAFE] text-[#0F172A] px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm font-medium max-w-xl">
                    {turn.question}
                  </div>
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E2E8F0] shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center font-display shrink-0">
                      {userInitials}
                    </div>
                  )}
                </div>

                <div className="border border-[#E2E8F0] rounded-2xl p-5 space-y-4 bg-[#F8FAFC]/60">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <NoteNestLogo size="xs" showWordmark={false} />
                      <span className="text-xs font-bold text-[#0F172A] font-display">
                        NoteNest AI Tutor
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EFF4FF] text-[#2563EB] text-[10px] font-semibold">
                        {turn.scopeLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyAnswer(turn)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === turn.id ? (
                        <Check className="w-3 h-3 text-[#10B981]" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#64748B]" />
                      )}
                      {copiedId === turn.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                    <h3 className="text-base font-bold text-[#0F172A] font-display">
                      {turn.answer.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                      {turn.answer.leadParagraph}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                        <h4 className="text-xs font-bold text-[#0F172A] font-display">
                          {turn.answer.leftBoxTitle}
                        </h4>
                        <ul className="space-y-1 text-xs text-[#334155]">
                          {(turn.answer.leftBoxBullets || []).map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#2563EB] font-bold">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5">
                        <h4 className="text-xs font-bold text-[#0F172A] font-display">
                          {turn.answer.rightBoxTitle}
                        </h4>
                        <ul className="space-y-1 text-xs text-[#334155]">
                          {(turn.answer.rightBoxBullets || []).map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-[#10B981] font-bold">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {turn.answer.examTipBody && (
                      <div className="p-3.5 rounded-xl bg-[#EFF4FF] border border-[#DBEAFE] flex items-start gap-2.5">
                        <GraduationCap className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed">
                          <span className="font-bold text-[#004AC6] block">
                            {turn.answer.examTipTitle || 'Exam Tip:'}
                          </span>
                          <span className="text-[#1E293B]">{turn.answer.examTipBody}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
