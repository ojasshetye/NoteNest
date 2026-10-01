import React from 'react';
import {
  PlusCircle,
  Lightbulb,
  Folder,
  FileText,
  Share2,
  TrendingUp,
  BookOpen,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Settings,
  ArrowRight,
  Eye,
  Trash2,
} from 'lucide-react';
import { NavSection, StudyMaterial, UserProfile } from '../types';

interface DashboardViewProps {
  user: UserProfile;
  onNavigate: (section: NavSection, subView?: string) => void;
  onOpenAddMaterial: (subjectName?: string) => void;
  onStartRevisionTopic: (topicId?: string) => void;
  onOpenAiSummaryForMaterial: (material: StudyMaterial) => void;
  onViewMaterial?: (material: StudyMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onNavigate,
  onOpenAddMaterial,
  onStartRevisionTopic,
  onOpenAiSummaryForMaterial,
  onViewMaterial,
  onDeleteMaterial,
}) => {
  const [selectedDashSubject, setSelectedDashSubject] = React.useState<string>('ALL');

  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const allSubjects = Array.from(
    new Set([...(user.subjects || []), ...user.materials.map((m) => m.subject).filter(Boolean)])
  );
  const totalSubjects = allSubjects.length;
  const totalDocs = user.materials.length;
  const totalConcepts = user.materials.reduce((acc, m) => acc + m.conceptsCount, 0);
  const avgRecall =
    user.materials.length > 0
      ? Math.round(
          user.materials.reduce((acc, m) => acc + m.recallProgress, 0) / user.materials.length
        )
      : 0;

  const filteredDashboardDocs =
    selectedDashSubject === 'ALL'
      ? user.materials
      : user.materials.filter((m) => m.subject === selectedDashSubject);

  return (
    <div className="space-y-6 pb-12">
      {/* Greeting & Quick Actions Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] font-display tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {user.course ? `${user.course} · ${user.year}` : user.year} — Your personal academic
            workspace.
          </p>
        </div>

        {/* Clean Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              onOpenAddMaterial(selectedDashSubject !== 'ALL' ? selectedDashSubject : undefined)
            }
            className="px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all flex items-center gap-2 font-display whitespace-nowrap shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Add New Document</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('ai-assistant')}
            className="px-4 py-2.5 text-xs font-semibold text-[#2563EB] bg-[#EFF4FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-all flex items-center gap-2 font-display whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>AI Summary Portal</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('quizzes')}
            className="px-4 py-2.5 text-xs font-semibold text-[#0F172A] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl transition-all font-display whitespace-nowrap cursor-pointer"
          >
            Quizzes
          </button>
        </div>
      </div>

      {/* Student Profile & Enrolled Subjects Bar (Click any subject to view its documents) */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              onClick={() => onNavigate('settings')}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#2563EB] shrink-0 cursor-pointer"
            />
          ) : (
            <div
              onClick={() => onNavigate('settings')}
              className="w-12 h-12 rounded-full bg-[#2563EB] text-white font-bold text-sm flex items-center justify-center font-display shrink-0 cursor-pointer"
            >
              {user.name
                .trim()
                .split(/\s+/)
                .map((w) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'ST'}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-base font-bold text-[#0F172A] hover:text-[#2563EB] font-display cursor-pointer"
              >
                {user.name}
              </button>
              {user.course && (
                <span className="px-2.5 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-[11px] font-semibold">
                  {user.course} · {user.year}
                </span>
              )}
              <span className="text-xs text-[#64748B]">{user.email}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-[#64748B] mr-1">
                Click Subject to View Documents:
              </span>
              <button
                type="button"
                onClick={() => setSelectedDashSubject('ALL')}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedDashSubject === 'ALL'
                    ? 'bg-[#2563EB] border-[#2563EB] text-white'
                    : 'bg-[#F8FAFC] hover:bg-[#EFF4FF] border-[#E2E8F0] text-[#0F172A]'
                }`}
              >
                All Documents ({user.materials.length})
              </button>
              {allSubjects.length === 0 ? (
                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
                >
                  + Add your first subject
                </button>
              ) : (
                allSubjects.map((subj) => {
                  const count = user.materials.filter((m) => m.subject === subj).length;
                  const active = selectedDashSubject === subj;
                  return (
                    <button
                      key={subj}
                      type="button"
                      onClick={() => setSelectedDashSubject(subj)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#EFF4FF] border-[#2563EB] text-[#2563EB]'
                          : 'bg-[#F8FAFC] hover:bg-[#EFF4FF] border-[#E2E8F0] text-[#0F172A]'
                      }`}
                    >
                      {subj} ({count})
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="px-4 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5 self-start md:self-center shrink-0 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5" />
          Profile &amp; All Subjects
        </button>
      </div>

      {/* 4 Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="text-left bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] tracking-wider">MY SUBJECTS</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {totalSubjects}
          </div>
          <p className="text-xs text-[#64748B] mt-2 truncate">
            {user.subjects.join(' · ') || 'No subjects added yet'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('knowledge')}
          className="text-left bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] tracking-wider">DOCUMENTS</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {totalDocs}
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            {totalDocs === 0 ? 'Upload PDFs, PPTX, or notes' : 'Stored in your library'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('knowledge', 'connections')}
          className="text-left bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] tracking-wider">CONCEPTS</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {totalConcepts}
          </div>
          <p className="text-xs text-[#64748B] mt-2">Extracted from your documents</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('progress')}
          className="text-left bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#CBD5E1] transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B] tracking-wider">
              RECALL SCORE
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#0F172A] font-display tabular-nums mt-2">
            {avgRecall}%
          </div>
          <p className="text-xs text-[#64748B] mt-2">
            {totalDocs === 0 ? 'Complete a quiz to track recall' : 'Across your active subjects'}
          </p>
        </button>
      </div>

      {/* Main Content Area: Clean Empty State when 0 Materials OR Clean 2-Column Document List */}
      {user.materials.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-10 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <UploadCloud className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-bold text-[#0F172A] font-display">
              Your workspace is clean and ready
            </h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              You haven&apos;t uploaded any study documents yet. Add your first lecture PDF, slide
              deck, or study note to organize your subjects and use the dedicated AI Studio.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                onOpenAddMaterial(selectedDashSubject !== 'ALL' ? selectedDashSubject : undefined)
              }
              className="px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span>Upload Your First Document</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="px-5 py-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] font-display cursor-pointer"
            >
              View Profile &amp; All Subjects
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Clean Uploaded Study Materials List */}
          <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] font-display">
                  {selectedDashSubject === 'ALL'
                    ? `All Uploaded Documents (${filteredDashboardDocs.length})`
                    : `${selectedDashSubject} — Documents (${filteredDashboardDocs.length})`}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Click <strong>Summarise Topic</strong> beside any document to view its AI Summary.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedDashSubject !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedDashSubject('ALL')}
                    className="px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    View All Documents ({user.materials.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onOpenAddMaterial(
                      selectedDashSubject !== 'ALL' ? selectedDashSubject : undefined
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {selectedDashSubject === 'ALL'
                      ? 'Add New Document'
                      : `Add Document to ${selectedDashSubject}`}
                  </span>
                </button>
              </div>
            </div>

            {filteredDashboardDocs.length === 0 ? (
              <div className="py-10 px-4 text-center bg-[#F8FAFC] border border-dashed border-[#CBD5E1] rounded-2xl space-y-3">
                <p className="text-sm font-bold text-[#0F172A] font-display">
                  No documents in &ldquo;{selectedDashSubject}&rdquo; yet
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDashSubject('ALL')}
                    className="px-4 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    View All Documents
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenAddMaterial(selectedDashSubject)}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display cursor-pointer"
                  >
                    + Add Document to {selectedDashSubject}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDashboardDocs.slice(0, 8).map((mat) => (
                  <div
                    key={mat.id}
                    className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#2563EB] text-[10px] font-bold">
                            {mat.subject}
                          </span>
                          <span className="text-[11px] text-[#64748B]">{mat.pagesOrSlides}</span>
                          <span className="text-[11px] text-[#64748B]">· {mat.updatedAt}</span>
                        </div>
                        <h3 className="text-sm font-bold text-[#0F172A] font-display truncate mt-1">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-[#64748B] truncate">{mat.fileName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {onViewMaterial && (
                        <button
                          type="button"
                          onClick={() => onViewMaterial(mat)}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                          View Document
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenAiSummaryForMaterial(mat)}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Summarise Topic
                      </button>
                      {onDeleteMaterial && (
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Delete document"
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

            {user.materials.length > 6 && (
              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => onNavigate('knowledge')}
                  className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  View all {user.materials.length} documents in My Knowledge{' '}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Recent Activity & Quick Revision */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[#0F172A] font-display">Recent Activity</h2>
                <span className="text-[11px] text-[#64748B]">Latest actions</span>
              </div>

              {user.activities.length === 0 ? (
                <p className="text-xs text-[#64748B] py-4 text-center">
                  No activity recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {user.activities.slice(0, 5).map((act) => (
                    <div key={act.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                        {act.type === 'quiz' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        ) : act.type === 'ai' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : act.type === 'revision' ? (
                          <RefreshCw className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="text-xs leading-snug min-w-0">
                        <p className="text-[#0F172A] truncate">
                          {act.title}{' '}
                          <strong className="font-semibold text-[#2563EB]">{act.highlight}</strong>
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">{act.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user.revisionTopics.length > 0 && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#0F172A] font-display">
                    Revision Flashcards
                  </h2>
                  <button
                    type="button"
                    onClick={() => onStartRevisionTopic(user.revisionTopics[0].id)}
                    className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Start</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#64748B]">
                  {user.revisionTopics.length} topic(s) ready for active recall review.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
