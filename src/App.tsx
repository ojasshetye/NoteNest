/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutGrid,
  FolderOpen,
  Lightbulb,
  CheckSquare,
  RefreshCw,
  TrendingUp,
  HelpCircle,
  Settings,
  Search,
  Plus,
  Bell,
  Menu,
  X,
  LogOut,
  Sparkles,
  FileText,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  Trash2,
} from 'lucide-react';
import { NavSection, StudyMaterial, UserProfile } from './types';
import { NoteNestLogo } from './components/NoteNestLogo';
import { LandingPage } from './components/LandingPage';
import { AuthPages } from './components/AuthPages';
import { DashboardView } from './components/DashboardView';
import { MyKnowledgeView } from './components/MyKnowledgeView';
import { AiAssistantView } from './components/AiAssistantView';
import { QuizzesView } from './components/QuizzesView';
import {
  RevisionView,
  ProgressView,
  SettingsView,
  AddMaterialModal,
  AiSummaryModal,
} from './components/RevisionAndProgressViews';

const SESSION_STORAGE_KEY = 'notenest_active_session_v2';
const USER_CACHE_PREFIX = 'notenest_user_cache_v2_';

const EMPTY_INITIAL_USER: UserProfile = {
  id: 'usr-pending',
  name: '',
  email: '',
  course: '',
  year: '',
  streakDays: 0,
  onboarded: false,
  subjects: [],
  goals: [],
  weeklyCompletedModules: 0,
  weeklyTargetModules: 10,
  createdAt: new Date().toISOString(),
  preferences: {
    theme: 'light',
    emailNotifications: true,
    revisionReminders: true,
    strictGroundedMode: true,
  },
  materials: [],
  activities: [],
  revisionTopics: [],
};

export default function App() {
  // Start the preview right from the Sign In / Sign Up screen unless an active session token exists
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem(SESSION_STORAGE_KEY)
  );
  const [appMode, setAppMode] = useState<
    'workspace' | 'landing' | 'signin' | 'signup' | 'onboarding'
  >(() => (localStorage.getItem(SESSION_STORAGE_KEY) ? 'workspace' : 'signin'));

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [knowledgeSubView, setKnowledgeSubView] = useState<string | undefined>(undefined);
  const [selectedRevisionTopicId, setSelectedRevisionTopicId] = useState<string | null>(null);
  const [selectedAiMaterialId, setSelectedAiMaterialId] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile>(() => {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    if (token) {
      try {
        const cached = localStorage.getItem(`${USER_CACHE_PREFIX}${token.slice(-16)}`);
        if (cached) return JSON.parse(cached) as UserProfile;
      } catch {
        // ignore cache parse error
      }
    }
    return EMPTY_INITIAL_USER;
  });

  const updateAuthenticatedUser = useCallback(
    (nextUser: UserProfile | ((prev: UserProfile) => UserProfile), tokenOverride?: string | null) => {
      setUser((prev) => {
        const resolved = typeof nextUser === 'function' ? nextUser(prev) : nextUser;
        const activeToken = tokenOverride !== undefined ? tokenOverride : authToken;
        if (activeToken && resolved && resolved.id !== 'usr-pending') {
          try {
            localStorage.setItem(
              `${USER_CACHE_PREFIX}${activeToken.slice(-16)}`,
              JSON.stringify(resolved)
            );
          } catch {
            // ignore quota errors
          }
        }
        return resolved;
      });
    },
    [authToken]
  );

  // Modals & Drawers
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addMaterialSubject, setAddMaterialSubject] = useState<string | undefined>(undefined);
  const [aiSummaryMaterial, setAiSummaryMaterial] = useState<StudyMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  const handleOpenAddMaterial = (subjectName?: string) => {
    setAddMaterialSubject(typeof subjectName === 'string' ? subjectName : undefined);
    setAddMaterialOpen(true);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    // Optimistically remove from UI immediately
    updateAuthenticatedUser((prev) => ({
      ...prev,
      materials: prev.materials.filter((m) => m.id !== materialId),
      revisionTopics: prev.revisionTopics.filter((r) => r.id !== `rev-${materialId}`),
    }));
    if (viewingMaterial?.id === materialId) setViewingMaterial(null);
    if (aiSummaryMaterial?.id === materialId) setAiSummaryMaterial(null);
    if (selectedAiMaterialId === materialId) setSelectedAiMaterialId(null);

    try {
      const res = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) updateAuthenticatedUser(data.user);
      }
    } catch {
      // Keep optimistic state if offline
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cmdKOpen, setCmdKOpen] = useState(false);
  const [cmdKQuery, setCmdKQuery] = useState('');
  const [headerSearchFocused, setHeaderSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Restore & synchronize session from backend across devices (on mount, tab focus, visibilitychange, and reconnect)
  const syncSessionFromServer = useCallback(async () => {
    if (!authToken) {
      setAppMode((prev) => (prev === 'workspace' ? 'signin' : prev));
      return;
    }
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: 'no-store',
      });
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user) {
          updateAuthenticatedUser(data.user, authToken);
          return;
        }
      }
      if (meRes.status === 401) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setAuthToken(null);
        setUser(EMPTY_INITIAL_USER);
        setAppMode('signin');
      }
    } catch {
      // Keep cached user state if temporarily offline
    }
  }, [authToken, updateAuthenticatedUser]);

  useEffect(() => {
    syncSessionFromServer();
  }, [syncSessionFromServer]);

  useEffect(() => {
    if (!authToken) return;
    const onFocusOrOnline = () => {
      syncSessionFromServer();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSessionFromServer();
      }
    };
    window.addEventListener('focus', onFocusOrOnline);
    window.addEventListener('online', onFocusOrOnline);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('focus', onFocusOrOnline);
      window.removeEventListener('online', onFocusOrOnline);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [authToken, syncSessionFromServer]);

  // Keyboard shortcuts Cmd+K / Ctrl+K and Escape to close search/modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdKOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCmdKOpen(false);
        setHeaderSearchFocused(false);
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleNavigate = (section: NavSection, subView?: string) => {
    setActiveNav(section);
    setKnowledgeSubView(subView);
    setMobileMenuOpen(false);
  };

  const handleAuthSuccess = (token: string, authedUser: UserProfile, isNewSignup?: boolean) => {
    localStorage.setItem(SESSION_STORAGE_KEY, token);
    setAuthToken(token);
    updateAuthenticatedUser(authedUser, token);
    if (isNewSignup) {
      setAppMode('onboarding');
    } else {
      setAppMode('workspace');
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (authToken) {
      localStorage.removeItem(`${USER_CACHE_PREFIX}${authToken.slice(-16)}`);
    }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthToken(null);
    setUser(EMPTY_INITIAL_USER);
    setAppMode('signin');
  };

  // Render Landing Page
  if (appMode === 'landing') {
    return (
      <LandingPage
        onNavigateSignIn={() => setAppMode('signin')}
        onNavigateSignUp={() => setAppMode('signup')}
        onQuickDemoLogin={() => setAppMode('signin')}
      />
    );
  }

  // Render Sign In / Sign Up / Onboarding
  if (appMode === 'signin' || appMode === 'signup' || appMode === 'onboarding') {
    return (
      <AuthPages
        mode={appMode}
        onSwitchMode={(m) => setAppMode(m)}
        onAuthSuccess={handleAuthSuccess}
        currentUser={user}
        authToken={authToken}
      />
    );
  }

  const navItems: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'knowledge', label: 'My Knowledge', icon: FolderOpen },
    { id: 'ai-assistant', label: 'AI Summary & Tutor', icon: Sparkles },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'revision', label: 'Revision', icon: RefreshCw },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
  ];

  const cmdKMatches = user.materials.filter(
    (m) =>
      !cmdKQuery.trim() ||
      m.title.toLowerCase().includes(cmdKQuery.toLowerCase()) ||
      m.fileName.toLowerCase().includes(cmdKQuery.toLowerCase()) ||
      m.subject.toLowerCase().includes(cmdKQuery.toLowerCase()) ||
      m.keyConcepts.some((c) => c.toLowerCase().includes(cmdKQuery.toLowerCase()))
  );

  const userInitials =
    user.name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0B1C30] flex">
      {/* ==========================================
          PERSISTENT 260PX DESKTOP SIDEBAR
         ========================================== */}
      <aside className="hidden lg:flex flex-col justify-between w-[260px] shrink-0 bg-white border-r border-[#E2E8F0] px-4 py-5 sticky top-0 h-screen overflow-y-auto">
        {/* Top Brand & Primary Navigation */}
        <div className="space-y-6">
          {/* Brand Lockup */}
          <div className="px-2 space-y-1">
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <NoteNestLogo size="sm" subtitle="A home for everything you learn" />
            </button>
          </div>

          {/* Primary Nav Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#DBEAFE]/80 text-[#2563EB] font-semibold'
                      : 'text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#2563EB]' : 'text-[#434655]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Student's Enrolled Subjects List in Sidebar */}
          <div className="px-2 space-y-2 pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-[#2563EB]" />
                My Subjects ({user.subjects.length})
              </span>
              <button
                type="button"
                onClick={() => handleNavigate('settings')}
                className="text-[10px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
              >
                + Edit
              </button>
            </div>
            {user.subjects.length === 0 ? (
              <p className="text-[11px] text-[#64748B] italic">
                No subjects added yet. Click + Edit to add your courses.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {user.subjects.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => handleNavigate('knowledge')}
                    className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-[11px] font-medium text-[#0F172A] transition-colors cursor-pointer truncate max-w-full"
                  >
                    {subj}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Support, Profile & Logout */}
        <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#64748B]" />
              <span>Help &amp; Support</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('settings')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer ${
                activeNav === 'settings'
                  ? 'bg-[#DBEAFE]/80 text-[#2563EB] font-semibold'
                  : 'text-[#434655] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#64748B]" />
              <span>My Profile &amp; Subjects</span>
            </button>
          </div>

          {/* Student Profile Card */}
          <button
            type="button"
            onClick={() => handleNavigate('settings')}
            className="w-full p-2.5 rounded-2xl bg-[#F8FAFC] hover:bg-[#EFF4FF]/60 border border-[#E2E8F0] flex items-center gap-3 text-left transition-colors cursor-pointer"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-[#2563EB] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center font-display shrink-0">
                {userInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F172A] font-display truncate">
                {user.name || 'Student'}
              </p>
              <p className="text-[11px] text-[#64748B] truncate">
                {user.course || 'Add course'} {user.year ? `· ${user.year}` : ''}
              </p>
            </div>
          </button>

          {/* Logout Button at Bottom of Menu */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center justify-center gap-2 font-display transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ==========================================
          MAIN WORKSPACE COLUMN
         ========================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#F8FAFC]/95 backdrop-blur border-b border-[#E2E8F0]/80 px-3 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* Mobile Menu Button + Brand + Search Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#0F172A] shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('dashboard')}
              className="lg:hidden shrink-0 cursor-pointer"
              aria-label="Go to Dashboard"
            >
              <NoteNestLogo size="xs" showWordmark={false} className="sm:hidden" />
              <NoteNestLogo size="xs" className="hidden sm:inline-flex" />
            </button>

            <div className="relative flex-1 min-w-0">
              <div className="w-full flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 py-2 bg-[#EFF4FF]/70 focus-within:bg-white border border-[#E2E8F0] focus-within:border-[#2563EB] rounded-xl text-xs text-[#0F172A] transition-all">
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <input
                    type="text"
                    value={cmdKQuery}
                    onFocus={() => setHeaderSearchFocused(true)}
                    onChange={(e) => {
                      setCmdKQuery(e.target.value);
                      setHeaderSearchFocused(true);
                    }}
                    placeholder="Search notes, PDFs, or subjects..."
                    aria-label="Search notes, PDFs, or subjects"
                    className="w-full min-w-0 bg-transparent text-xs text-[#0F172A] placeholder:text-[#64748B] focus:outline-none"
                  />
                </span>
                {(cmdKQuery || headerSearchFocused) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (cmdKQuery) {
                        setCmdKQuery('');
                      } else {
                        setHeaderSearchFocused(false);
                      }
                    }}
                    aria-label={cmdKQuery ? 'Clear search query' : 'Close search'}
                    title={cmdKQuery ? 'Clear search' : 'Close search'}
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] shrink-0 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Instant Top Search Bar Dropdown */}
              {headerSearchFocused && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setHeaderSearchFocused(false)}
                  />
                  <div className="fixed sm:absolute left-3 right-3 sm:left-0 sm:right-0 top-16 sm:top-auto sm:mt-2 bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-3 z-40 space-y-2 max-h-[75dvh] sm:max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-2 py-1 border-b border-[#E2E8F0]">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                        {cmdKQuery.trim()
                          ? `Matching Documents (${cmdKMatches.length})`
                          : `All Uploaded Documents (${user.materials.length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setHeaderSearchFocused(false)}
                        aria-label="Close search results"
                        className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {cmdKMatches.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        No matching documents found for &ldquo;{cmdKQuery}&rdquo;.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {cmdKMatches.map((m) => (
                          <div
                            key={m.id}
                            className="p-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF]/70 border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderSearchFocused(false);
                                setViewingMaterial(m);
                              }}
                              className="flex items-center gap-2.5 min-w-0 text-left flex-1 cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-[#0F172A] truncate hover:text-[#2563EB]">
                                  {m.title}
                                </p>
                                <p className="text-[11px] text-[#64748B] truncate">
                                  {m.subject} · {m.fileName}
                                </p>
                              </div>
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setHeaderSearchFocused(false);
                                  setViewingMaterial(m);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] text-[#0F172A] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-[#2563EB]" />
                                View Document
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHeaderSearchFocused(false);
                                  setSelectedAiMaterialId(m.id);
                                  handleNavigate('ai-assistant');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3" />
                                Summarize
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMaterial(m.id)}
                                className="p-1.5 rounded-lg bg-white hover:bg-[#FEF2F2] border border-[#E2E8F0] text-[#DC2626] cursor-pointer"
                                title="Delete document"
                                aria-label={`Delete ${m.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Header Controls: Upload Material, Bell, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setAddMaterialOpen(true)}
              className="px-2.5 sm:px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display transition-colors whitespace-nowrap shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Upload Document</span>
              <span className="sm:hidden">Upload</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl hover:bg-white text-[#434655] relative cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-[#DC2626] absolute top-1.5 right-1.5" />
              </button>

              {notificationsOpen && (
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] max-w-80 bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xl space-y-3 z-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] font-display">
                      Study Notifications
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Close notifications"
                      className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-[#EFF4FF] border border-[#DBEAFE] text-xs space-y-1">
                    <p className="font-semibold text-[#004AC6]">
                      AI Study Summary Available
                    </p>
                    <p className="text-[11px] text-[#434655]">
                      Upload any study document and click &ldquo;Ask for AI Summary&rdquo; to
                      extract key takeaways and exam notes.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleNavigate('settings')}
              className="flex items-center gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#EFF4FF] border border-[#E2E8F0] cursor-pointer"
              title={`${user.name} (${user.email})`}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#2563EB] shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white font-bold text-[10px] flex items-center justify-center font-display shrink-0">
                  {userInitials}
                </div>
              )}
              <span className="hidden md:inline text-xs font-semibold text-[#0F172A] max-w-[120px] truncate">
                {user.name}
              </span>
            </button>
          </div>
        </header>

        {/* Main Content Canvas */}
        <main className="flex-1 px-4 sm:px-8 pt-6 max-w-[1360px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              user={user}
              onNavigate={handleNavigate}
              onOpenAddMaterial={handleOpenAddMaterial}
              onStartRevisionTopic={(topicId) => {
                setSelectedRevisionTopicId(topicId || null);
                setActiveNav('revision');
              }}
              onOpenAiSummaryForMaterial={(mat) => {
                setSelectedAiMaterialId(mat.id);
                handleNavigate('ai-assistant');
              }}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeNav === 'knowledge' && (
            <MyKnowledgeView
              user={user}
              initialSubView={knowledgeSubView}
              onNavigate={handleNavigate}
              onOpenAddMaterial={handleOpenAddMaterial}
              onSelectMaterialForAi={(matId) => {
                if (matId) setSelectedAiMaterialId(matId);
                handleNavigate('ai-assistant');
              }}
              onStartQuizForMaterial={() => handleNavigate('quizzes')}
              onOpenAiSummaryForMaterial={(mat) => {
                setSelectedAiMaterialId(mat.id);
                handleNavigate('ai-assistant');
              }}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeNav === 'ai-assistant' && (
            <AiAssistantView
              user={user}
              authToken={authToken}
              avatarUrl={user.avatarUrl || null}
              initialMaterialId={selectedAiMaterialId}
              onNavigate={handleNavigate}
              onOpenAddMaterial={() => handleOpenAddMaterial()}
              onUserUpdated={updateAuthenticatedUser}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}

          {activeNav === 'quizzes' && (
            <QuizzesView
              user={user}
              authToken={authToken}
              onNavigate={handleNavigate}
              onOpenAddMaterial={() => handleOpenAddMaterial()}
              onUserUpdated={updateAuthenticatedUser}
            />
          )}

          {activeNav === 'revision' && (
            <RevisionView
              user={user}
              authToken={authToken}
              initialTopicId={selectedRevisionTopicId}
              onUserUpdated={updateAuthenticatedUser}
              onNavigate={handleNavigate}
              onOpenAddMaterial={() => handleOpenAddMaterial()}
            />
          )}

          {activeNav === 'progress' && (
            <ProgressView
              user={user}
              onNavigate={handleNavigate}
              onOpenAddMaterial={() => handleOpenAddMaterial()}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              user={user}
              authToken={authToken}
              avatarUrl={user.avatarUrl || null}
              onUserUpdated={updateAuthenticatedUser}
              onSignOut={handleSignOut}
              onOpenAddMaterialForSubject={handleOpenAddMaterial}
              onSummariseMaterial={(mat) => {
                setSelectedAiMaterialId(mat.id);
                handleNavigate('ai-assistant');
              }}
              onViewMaterial={(mat) => setViewingMaterial(mat)}
              onDeleteMaterial={handleDeleteMaterial}
            />
          )}
        </main>
      </div>

      {/* ==========================================
          MOBILE SLIDE-OVER NAVIGATION DRAWER
         ========================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-[#0F172A]/40 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-[85vw] max-w-72 bg-white h-full p-5 flex flex-col justify-between shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <NoteNestLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const IconComp = item.icon;
                  const active = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavigate(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                        active
                          ? 'bg-[#DBEAFE] text-[#2563EB] font-semibold'
                          : 'text-[#434655] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleNavigate('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer ${
                    activeNav === 'settings'
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-semibold'
                      : 'text-[#434655] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>My Profile &amp; Subjects</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setHelpOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#434655] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-[#64748B]" />
                  <span>Help &amp; Support</span>
                </button>
              </nav>

              {user.subjects.length > 0 && (
                <div className="pt-3 border-t border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-[#2563EB]" />
                      My Subjects ({user.subjects.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavigate('settings')}
                      className="text-[10px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.subjects.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => handleNavigate('knowledge')}
                        className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#EFF4FF] border border-[#E2E8F0] text-[11px] font-medium text-[#0F172A] truncate max-w-full cursor-pointer"
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full py-2.5 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center justify-center gap-2 font-display cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CMD+K SEMANTIC SEARCH MODAL
         ========================================== */}
      {cmdKOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4"
          onClick={() => setCmdKOpen(false)}
        >
          <div
            className="bg-white border border-[#E2E8F0] rounded-2xl max-w-2xl w-full p-4 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-[#E2E8F0] pb-3">
              <button
                type="button"
                onClick={() => setCmdKOpen(false)}
                aria-label="Back to workspace"
                title="Back"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <Search className="w-4 h-4 text-[#2563EB] shrink-0" />
              <input
                type="text"
                autoFocus
                value={cmdKQuery}
                onChange={(e) => setCmdKQuery(e.target.value)}
                placeholder="Search across your documents, subjects, or concepts..."
                aria-label="Search across your documents, subjects, or concepts"
                className="w-full min-w-0 text-sm text-[#0F172A] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (cmdKQuery) {
                    setCmdKQuery('');
                  } else {
                    setCmdKOpen(false);
                  }
                }}
                aria-label={cmdKQuery ? 'Clear search input' : 'Close search'}
                title={cmdKQuery ? 'Clear search' : 'Close search'}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1.5">
              {cmdKMatches.map((m) => (
                <div
                  key={m.id}
                  className="w-full p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF4FF]/70 border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCmdKOpen(false);
                      setViewingMaterial(m);
                    }}
                    className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0F172A] truncate hover:text-[#2563EB]">
                        {m.title}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">
                        {m.subject} · {m.fileName} · {m.keyConcepts.join(' · ')}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCmdKOpen(false);
                        setViewingMaterial(m);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFF4FF] border border-[#CBD5E1] text-[#0F172A] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-[#2563EB]" />
                      View Document
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCmdKOpen(false);
                        setSelectedAiMaterialId(m.id);
                        handleNavigate('ai-assistant');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Summarize Topic
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMaterial(m.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-[#FEF2F2] border border-[#E2E8F0] text-[#DC2626] cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span>Click any document to view its full content</span>
              <button
                type="button"
                onClick={() => {
                  setCmdKOpen(false);
                  handleNavigate('ai-assistant');
                }}
                className="font-semibold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Open AI Summary &amp; Tutor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          GLOBAL DOCUMENT VIEWER MODAL
         ========================================== */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-4xl w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#DBEAFE] text-[#004AC6] text-[10px] font-bold uppercase">
                      {viewingMaterial.subject}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B]">
                      {viewingMaterial.fileName} · {viewingMaterial.pagesOrSlides}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] font-display truncate">
                    {viewingMaterial.title}
                  </h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetId = viewingMaterial.id;
                    setViewingMaterial(null);
                    setSelectedAiMaterialId(targetId);
                    handleNavigate('ai-assistant');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 font-display cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Summarize Topic
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMaterial(viewingMaterial.id)}
                  className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMaterial(null)}
                  aria-label="Close document viewer"
                  className="p-2 rounded-xl bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#434655] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* If actual PDF data URL was uploaded, show embedded PDF viewer first */}
              {viewingMaterial.fileDataUrl &&
                viewingMaterial.fileDataUrl.startsWith('data:application/pdf') && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Uploaded PDF Document Preview
                    </span>
                    <iframe
                      src={viewingMaterial.fileDataUrl}
                      title={viewingMaterial.title}
                      className="w-full h-[260px] sm:h-[420px] rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                    />
                  </div>
                )}

              {/* Full Document Content & Extracted Text */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#004AC6]">
                    Document Content &amp; Extracted Study Notes
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    {viewingMaterial.updatedAt}
                  </span>
                </div>
                <div className="text-sm text-[#0F172A] leading-relaxed whitespace-pre-line font-sans">
                  {viewingMaterial.rawContent || viewingMaterial.fullSummary}
                </div>
              </div>

              {/* Highlighted Excerpt */}
              {viewingMaterial.excerptText && (
                <div className="p-4 rounded-xl bg-[#EFF4FF] border-l-4 border-[#2563EB] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                    Key Document Passage{' '}
                    {viewingMaterial.excerptSection ? `(${viewingMaterial.excerptSection})` : ''}
                  </span>
                  <p className="text-xs text-[#0F172A] leading-relaxed italic">
                    {viewingMaterial.excerptText}
                  </p>
                </div>
              )}

              {/* Key Concepts */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                  Key Concepts Covered ({viewingMaterial.keyConcepts.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {viewingMaterial.keyConcepts.map((concept) => (
                    <span
                      key={concept}
                      className="px-3 py-1 rounded-lg bg-[#EFF4FF] border border-[#DBEAFE] text-xs font-semibold text-[#004AC6]"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* If AI Summary is available, show a quick preview of Key Takeaways */}
              {viewingMaterial.aiSummary && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#DBEAFE] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#004AC6] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#2563EB]" />
                      AI Topic Summary Highlights
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = viewingMaterial.id;
                        setViewingMaterial(null);
                        setSelectedAiMaterialId(targetId);
                        handleNavigate('ai-assistant');
                      }}
                      className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Full AI Summary Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    {viewingMaterial.aiSummary.overview}
                  </p>
                  <ul className="space-y-1.5">
                    {viewingMaterial.aiSummary.keyTakeaways.slice(0, 4).map((pt, i) => (
                      <li key={i} className="text-xs text-[#0F172A] flex items-start gap-2">
                        <span className="text-[#2563EB] font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          HELP & SUPPORT MODAL
         ========================================== */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0F172A] font-display">
                NoteNest Academic Guide
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#434655] leading-relaxed">
              NoteNest combines your course PDFs, slide decks, and lecture notes into a grounded
              personal study system.
            </p>
            <ul className="space-y-2 text-xs text-[#0F172A]">
              <li>
                • <strong>My Profile &amp; Subjects:</strong> Customize your name, course, academic
                year, and add or remove subjects anytime.
              </li>
              <li>
                • <strong>Upload Document &amp; AI Summary:</strong> Select a file from your
                computer and click <em>Ask for AI Summary</em> to generate key takeaways, core
                definitions, and exam revision points.
              </li>
              <li>
                • <strong>AI Study Assistant:</strong> Strictly grounded explanations with
                side-by-side Verified PDF Passage inspection.
              </li>
              <li>
                • <strong>Quizzes:</strong> Timed active recall checks with confidence calibration
                and Socratic clues.
              </li>
            </ul>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold font-display cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Study Material Modal */}
      <AddMaterialModal
        isOpen={addMaterialOpen}
        user={user}
        authToken={authToken}
        initialSubject={addMaterialSubject}
        onClose={() => {
          setAddMaterialOpen(false);
          setAddMaterialSubject(undefined);
        }}
        onMaterialAdded={(updatedUser) => updateAuthenticatedUser(updatedUser)}
        onNavigateToAiSection={(materialId) => {
          if (materialId) setSelectedAiMaterialId(materialId);
          handleNavigate('ai-assistant');
        }}
      />

      {/* AI Summary Studio Modal for Any Uploaded Material */}
      <AiSummaryModal
        material={aiSummaryMaterial}
        authToken={authToken}
        onClose={() => setAiSummaryMaterial(null)}
        onUserUpdated={(updatedUser) => {
          updateAuthenticatedUser(updatedUser);
          if (aiSummaryMaterial) {
            const refreshed = updatedUser.materials.find((m) => m.id === aiSummaryMaterial.id);
            if (refreshed) setAiSummaryMaterial(refreshed);
          }
        }}
        onAskFollowUpAi={() => {
          setAiSummaryMaterial(null);
          handleNavigate('ai-assistant');
        }}
      />
    </div>
  );
}
