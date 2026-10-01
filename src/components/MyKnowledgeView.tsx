import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  BookOpen,
  Share2,
  Database,
  Cpu,
  Network,
  Code2,
  Sigma,
  FileText,
  Sparkles,
  UploadCloud,
  FolderOpen,
  Eye,
  Trash2,
  X,
  ArrowRight,
} from 'lucide-react';
import { NavSection, StudyMaterial, UserProfile } from '../types';

interface MyKnowledgeViewProps {
  user: UserProfile;
  initialSubView?: string;
  onNavigate: (section: NavSection, subView?: string) => void;
  onOpenAddMaterial: (subjectName?: string) => void;
  onSelectMaterialForAi: (materialId: string) => void;
  onStartQuizForMaterial: (materialId: string) => void;
  onOpenAiSummaryForMaterial: (material: StudyMaterial) => void;
  onViewMaterial?: (material: StudyMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
}

export const MyKnowledgeView: React.FC<MyKnowledgeViewProps> = ({
  user,
  initialSubView,
  onNavigate,
  onOpenAddMaterial,
  onOpenAiSummaryForMaterial,
  onViewMaterial,
  onDeleteMaterial,
}) => {
  const [subTab, setSubTab] = useState<'materials' | 'connections'>(
    initialSubView === 'connections' ? 'connections' : 'materials'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [inspectMaterial, setInspectMaterial] = useState<StudyMaterial | null>(null);

  const getSubjectIcon = (subjName: string) => {
    const lower = subjName.toLowerCase();
    if (lower.includes('dbms') || lower.includes('data')) return Database;
    if (lower.includes('os') || lower.includes('operating')) return Cpu;
    if (lower.includes('network') || lower.includes('cn')) return Network;
    if (lower.includes('web') || lower.includes('code') || lower.includes('software')) return Code2;
    if (lower.includes('math')) return Sigma;
    return BookOpen;
  };

  const subjectFolders = useMemo(() => {
    const allSubjs = Array.from(
      new Set([...(user.subjects || []), ...user.materials.map((m) => m.subject)])
    );
    return [
      {
        id: 'ALL',
        label: 'All Materials',
        count: user.materials.length,
        icon: FolderOpen,
      },
      ...allSubjs.map((s) => ({
        id: s,
        label: s,
        count: user.materials.filter((m) => m.subject === s).length,
        icon: getSubjectIcon(s),
      })),
    ];
  }, [user.subjects, user.materials]);

  const filteredMaterials = useMemo(() => {
    return user.materials.filter((m) => {
      const matchesSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.fileName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.keyConcepts.some((c) => c.toLowerCase().includes(q));
      return matchesSubject && matchesQuery;
    });
  }, [user.materials, selectedSubject, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Sub-Navigation Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] font-display tracking-tight">
            My Knowledge Library
          </h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Organize your uploaded documents by subject and explore extracted concepts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('materials')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'materials'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#434655] hover:text-[#0F172A]'
              }`}
            >
              Documents ({user.materials.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab('connections')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                subTab === 'connections'
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#434655] hover:text-[#0F172A]'
              }`}
            >
              Concept Map
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenAddMaterial(selectedSubject !== 'ALL' ? selectedSubject : undefined)
            }
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>
              {selectedSubject !== 'ALL'
                ? `Add Document to ${selectedSubject}`
                : 'Add New Document'}
            </span>
          </button>
        </div>
      </div>

      {subTab === 'materials' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Subject Sidebar (3 cols) */}
          <div className="lg:col-span-3 bg-white border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                My Subjects
              </span>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                + Manage
              </button>
            </div>

            <div className="space-y-1">
              {subjectFolders.map((folder) => {
                const IconComp = folder.icon;
                const active = selectedSubject === folder.id;
                return (
                  <button
                    key={folder.id}
                    type="button"
                    onClick={() => setSelectedSubject(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#EFF4FF] text-[#2563EB] font-semibold'
                        : 'text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <IconComp
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-[#2563EB]' : 'text-[#64748B]'
                        }`}
                      />
                      <span className="truncate">{folder.label}</span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tabular-nums ${
                        active ? 'bg-white text-[#2563EB]' : 'bg-[#F8FAFC] text-[#64748B]'
                      }`}
                    >
                      {folder.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Document Library (9 cols) */}
          <div className="lg:col-span-9 space-y-4">
            {/* Active Subject Header Bar with View All Documents & Add New Document */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] font-display flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-[#2563EB]" />
                  {selectedSubject === 'ALL'
                    ? `All Subjects — All Documents (${filteredMaterials.length})`
                    : `${selectedSubject} — Documents (${filteredMaterials.length})`}
                </h2>
                <p className="text-xs text-[#64748B]">
                  Click <strong>Summarise Topic</strong> beside any document to view its AI Summary.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {selectedSubject !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('ALL')}
                    className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                  >
                    View All Documents ({user.materials.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onOpenAddMaterial(selectedSubject !== 'ALL' ? selectedSubject : undefined)
                  }
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {selectedSubject !== 'ALL'
                      ? `Add Document to ${selectedSubject}`
                      : 'Add New Document'}
                  </span>
                </button>
              </div>
            </div>

            {/* Search & View Mode Controls */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && searchQuery) {
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Search your uploaded documents by title, subject, or concept..."
                  aria-label="Search uploaded documents"
                  className="w-full pl-10 pr-9 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear document search"
                    title="Clear search"
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0]/50 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#EFF4FF] border-[#DBEAFE] text-[#2563EB]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#EFF4FF] border-[#DBEAFE] text-[#2563EB]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B]'
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Clean Empty State or Document Grid */}
            {filteredMaterials.length === 0 ? (
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h3 className="text-lg font-bold text-[#0F172A] font-display">
                    {selectedSubject === 'ALL'
                      ? 'No study materials uploaded yet'
                      : `No documents in "${selectedSubject}" yet`}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {selectedSubject === 'ALL'
                      ? 'Upload your first lecture PDF, PPTX, DOCX, or text notes to build your personal knowledge library from scratch.'
                      : `Add a study document to "${selectedSubject}" or click View All Documents to see materials across all subjects.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {selectedSubject !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setSelectedSubject('ALL')}
                      className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] cursor-pointer"
                    >
                      View All Documents
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onOpenAddMaterial(selectedSubject !== 'ALL' ? selectedSubject : undefined)
                    }
                    className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedSubject !== 'ALL'
                        ? `Add Document to ${selectedSubject}`
                        : 'Add New Document'}
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                    : 'space-y-3'
                }
              >
                {filteredMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#CBD5E1] transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-[11px] font-bold">
                          {mat.subject}
                        </span>
                        <span className="text-[11px] text-[#64748B]">{mat.pagesOrSlides}</span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#0F172A] font-display">
                          {mat.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {mat.fileName} {mat.fileSize ? `(${mat.fileSize})` : ''} · {mat.updatedAt}
                        </p>
                      </div>

                      {/* Extracted Concept Tags */}
                      {mat.keyConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {mat.keyConcepts.slice(0, 4).map((concept) => (
                            <span
                              key={concept}
                              className="px-2.5 py-0.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-medium text-[#434655]"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clean Card Actions: View Document + Summarise Topic + Delete beside each document */}
                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-[#E2E8F0] gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onViewMaterial ? onViewMaterial(mat) : setInspectMaterial(mat)
                          }
                          className="px-3 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-xs font-semibold text-[#0F172A] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                          View Document
                        </button>
                        {onDeleteMaterial && (
                          <button
                            type="button"
                            onClick={() => onDeleteMaterial(mat.id)}
                            className="px-2.5 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-xs font-semibold text-[#DC2626] flex items-center gap-1 cursor-pointer"
                            title="Delete document from subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenAiSummaryForMaterial(mat)}
                        className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Summarise Topic
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =========================================================
           CONCEPT MAP SUB-VIEW (DYNAMICALLY BUILT FROM USER'S DOCS)
           ========================================================= */
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 space-y-6">
          {user.materials.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
                <Share2 className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg font-bold text-[#0F172A] font-display">
                  Your Concept Map will grow as you upload study materials
                </h3>
                <p className="text-xs text-[#64748B]">
                  Upload your first document so NoteNest can extract key concepts and map how your
                  subjects connect.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenAddMaterial()}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-2 font-display cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Upload Document</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A] font-display">
                  Extracted Concepts Across Your Subjects
                </h2>
                <p className="text-xs text-[#64748B]">
                  Automatically organized from your {user.materials.length} uploaded study
                  material(s).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold">
                        {mat.subject}
                      </span>
                      <span className="text-[11px] text-[#64748B]">
                        {mat.keyConcepts.length} Concepts
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-[#0F172A] font-display">{mat.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {mat.keyConcepts.map((c) => (
                        <span
                          key={c}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#E2E8F0] text-xs font-medium text-[#0F172A]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean Document Details Modal */}
      {inspectMaterial && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold">
                  {inspectMaterial.subject} · {inspectMaterial.pagesOrSlides}
                </span>
                <h2 className="text-xl font-bold text-[#0F172A] font-display mt-1.5">
                  {inspectMaterial.title}
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  File: {inspectMaterial.fileName} · {inspectMaterial.updatedAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectMaterial(null)}
                aria-label="Close document details"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inspectMaterial.rawContent && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  Extracted Document Text / Notes
                </p>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#334155] whitespace-pre-line max-h-56 overflow-y-auto leading-relaxed">
                  {inspectMaterial.rawContent}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Key Concepts
              </p>
              <div className="flex flex-wrap gap-1.5">
                {inspectMaterial.keyConcepts.map((c) => (
                  <span
                    key={c}
                    className="px-2.5 py-1 rounded-lg bg-[#EFF4FF] text-[#2563EB] text-xs font-semibold"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setInspectMaterial(null)}
                className="px-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#434655] cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = inspectMaterial;
                  setInspectMaterial(null);
                  onOpenAiSummaryForMaterial(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-2 font-display cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Summarize in AI Section</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
