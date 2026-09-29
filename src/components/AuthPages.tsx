import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Camera,
} from 'lucide-react';
import { UserProfile } from '../types';
import { NoteNestLogo } from './NoteNestLogo';

function readImageFileAsAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file'));
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

interface AuthPagesProps {
  mode: 'signin' | 'signup' | 'onboarding';
  onSwitchMode: (mode: 'signin' | 'signup' | 'onboarding' | 'landing') => void;
  onAuthSuccess: (token: string, user: UserProfile, isNewSignup?: boolean) => void;
  currentUser?: UserProfile | null;
  authToken?: string | null;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  mode,
  onSwitchMode,
  onAuthSuccess,
  currentUser,
  authToken,
}) => {
  // Sign In / Sign Up state — always starts clean without random names or random photos
  const signupPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const onboardingPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [courseInput, setCourseInput] = useState('');
  const [yearInput, setYearInput] = useState('Yr 3');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Onboarding / Profile Creation state (Step 1, 2, 3) — starts completely from scratch
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [obName, setObName] = useState(currentUser?.name || '');
  const [obAvatarUrl, setObAvatarUrl] = useState<string | null>(currentUser?.avatarUrl || null);
  const [obCourse, setObCourse] = useState(currentUser?.course || '');
  const [obYear, setObYear] = useState(currentUser?.year || 'Yr 1');
  const [obSubjects, setObSubjects] = useState<string[]>(
    currentUser?.subjects && currentUser.subjects.length > 0 ? currentUser.subjects : []
  );
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [obGoals, setObGoals] = useState<string[]>([]);

  // Sync currentUser into onboarding fields when user transitions from signup -> onboarding
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && currentUser.name !== 'Student') setObName(currentUser.name);
      if (currentUser.avatarUrl !== undefined) setObAvatarUrl(currentUser.avatarUrl || null);
      if (currentUser.course) setObCourse(currentUser.course);
      if (currentUser.year) setObYear(currentUser.year);
      if (Array.isArray(currentUser.subjects)) {
        setObSubjects(currentUser.subjects);
      }
    }
  }, [currentUser]);

  const handleAvatarFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'signup' | 'onboarding'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readImageFileAsAvatarDataUrl(file);
      if (target === 'signup') {
        setAvatarUrl(dataUrl);
        setObAvatarUrl(dataUrl);
      } else {
        setObAvatarUrl(dataUrl);
      }
    } catch {
      // ignore invalid file
    }
  };

  // Password validation rules
  const pwdHasLength = password.length >= 8;
  const pwdHasUpper = /[A-Z]/.test(password);
  const pwdHasLower = /[a-z]/.test(password);
  const pwdHasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const pwdScore = [pwdHasLength, pwdHasUpper, pwdHasLower, pwdHasNumberOrSymbol].filter(Boolean)
    .length;

  const validateClientSide = (targetMode: 'signin' | 'signup'): boolean => {
    const errs: Record<string, string> = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (targetMode === 'signup') {
      if (name.trim().length < 2) {
        errs.name = 'Please enter your full name (minimum 2 characters).';
      }
      if (courseInput.trim().length < 2) {
        errs.course = 'Please enter your course or major (e.g. Computer Science).';
      }
    }
    if (!emailRe.test(email.trim())) {
      errs.email = 'Please enter a valid university or personal email address.';
    }
    if (targetMode === 'signin') {
      if (!password) {
        errs.password = 'Please enter your password.';
      }
    } else {
      if (!pwdHasLength || !pwdHasUpper || !pwdHasLower || !pwdHasNumberOrSymbol) {
        errs.password =
          'Password must be at least 8 characters and include uppercase, lowercase, and a number or symbol.';
      }
      if (password !== confirmPassword) {
        errs.confirmPassword = 'Confirmation password does not match.';
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validateClientSide('signin')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || 'Sign in failed.');
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
      } else {
        onAuthSuccess(data.token, data.user, false);
      }
    } catch {
      setGeneralError('Network error while connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccountLogin = async () => {
    setGeneralError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'alex.chen@stanford.edu',
          password: 'Password123!',
          rememberMe: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data.token, data.user, false);
      } else {
        setGeneralError(data.error || 'Could not sign in to demo account.');
      }
    } catch {
      setGeneralError('Network error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validateClientSide('signup')) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          avatarUrl: avatarUrl || null,
          course: courseInput.trim(),
          year: yearInput,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGeneralError(data.error || 'Registration failed.');
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
      } else {
        setObName(data.user.name);
        setObAvatarUrl(data.user.avatarUrl || avatarUrl || null);
        setObCourse(data.user.course);
        setObYear(data.user.year);
        onAuthSuccess(data.token, data.user, true);
      }
    } catch {
      setGeneralError('Network error while creating your account.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomSubject = () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (!obSubjects.includes(trimmed)) {
      setObSubjects((prev) => [...prev, trimmed]);
    }
    setCustomSubjectInput('');
  };

  const handleFinishOnboarding = async () => {
    if (!obName.trim()) {
      setOnboardingStep(1);
      return;
    }
    if (!authToken) {
      handleDemoAccountLogin();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: obName.trim(),
          avatarUrl: obAvatarUrl || null,
          course: obCourse.trim() || 'General Studies',
          year: obYear,
          subjects: obSubjects,
          goals: obGoals,
          onboarded: true,
          includeSampleData: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthSuccess(authToken, data.user, false);
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SCREEN 4: PROFILE & SUBJECTS ONBOARDING WIZARD
  // ==========================================
  if (mode === 'onboarding') {
    const suggestedSubjects = [
      'DBMS',
      'Operating Systems',
      'Computer Networks',
      'Data Structures & Algorithms',
      'Machine Learning',
      'Web Technology',
      'Mathematics',
      'Software Engineering',
    ];
    const allDisplayedSubjects = Array.from(new Set([...suggestedSubjects, ...obSubjects]));

    const availableGoals = [
      'Understand concepts deeply',
      'Prepare for semester exams',
      'Generate AI summaries from my PDFs',
      'Test my knowledge with active recall',
      'Organize study material by subject',
    ];

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-xl bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm space-y-6">
          {/* Header & Step Progress */}
          <div className="flex items-center justify-between">
            <NoteNestLogo size="sm" subtitle="Profile & Subjects Setup" />
            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF4FF] px-3 py-1 rounded-full tabular-nums">
              Step {onboardingStep} of 3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-colors ${
                  s <= onboardingStep ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
                }`}
              />
            ))}
          </div>

          {onboardingStep === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] font-display">
                  Create your academic profile
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Your exact profile name, course, and academic year will appear across your
                  personal workspace.
                </p>
              </div>

              <div className="space-y-4">
                {/* Optional Profile Photo Upload in Onboarding Step 1 */}
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    {obAvatarUrl ? (
                      <img
                        src={obAvatarUrl}
                        alt={obName || 'Profile'}
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#2563EB] shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center font-display text-lg shrink-0">
                        {obName
                          .trim()
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'ST'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">
                        Profile Photo <span className="text-[#64748B] font-normal">(Optional)</span>
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Upload your own photo if you want, or keep your clean initials badge.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      ref={onboardingPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFileSelect(e, 'onboarding')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => onboardingPhotoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {obAvatarUrl ? 'Change' : 'Upload Photo'}
                    </button>
                    {obAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setObAvatarUrl(null)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    value={obName}
                    onChange={(e) => setObName(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Course / Degree / Branch *
                  </label>
                  <input
                    type="text"
                    value={obCourse}
                    onChange={(e) => setObCourse(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15"
                    placeholder="e.g. B.Tech Computer Science, Information Technology, MBA..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                    Academic Year / Semester
                  </label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {['Yr 1', 'Yr 2', 'Yr 3', 'Yr 4 / Grad'].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setObYear(yr)}
                        className={`py-2.5 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          obYear === yr
                            ? 'bg-[#DBEAFE] border-[#2563EB] text-[#2563EB]'
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!obName.trim()}
                  onClick={() => setOnboardingStep(2)}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl flex items-center gap-2 font-display cursor-pointer disabled:opacity-50"
                >
                  Next: Choose Your Subjects <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] font-display">
                  Add your subjects from scratch
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Your workspace starts completely empty. Type the subjects you are taking this
                  semester, or click any quick suggestion below to add it.
                </p>
              </div>

              {/* Add Custom Subject Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSubject();
                    }
                  }}
                  placeholder="Type a subject name (e.g. Artificial Intelligence, Calculus, DBMS)..."
                  className="flex-1 px-3.5 py-2.5 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:bg-white focus:border-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Subject
                </button>
              </div>

              {/* User's Added Subjects */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5">
                <p className="text-xs font-bold text-[#0F172A]">
                  Your Added Subjects ({obSubjects.length})
                </p>
                {obSubjects.length === 0 ? (
                  <p className="text-xs text-[#64748B]">
                    No subjects added yet. Type a subject above or click a quick suggestion below.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {obSubjects.map((subj) => (
                      <span
                        key={subj}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DBEAFE] border border-[#2563EB] text-[#2563EB] text-xs font-semibold"
                      >
                        <span>{subj}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setObSubjects((prev) => prev.filter((s) => s !== subj))
                          }
                          className="hover:text-[#DC2626] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Quick-Add Suggestions */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Quick-Add Suggestions (Optional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedSubjects
                    .filter((s) => !obSubjects.includes(s))
                    .map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setObSubjects((prev) => [...prev, subj])}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border bg-white border-[#E2E8F0] text-[#434655] hover:border-[#2563EB] hover:text-[#2563EB] transition-all cursor-pointer"
                      >
                        + {subj}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={obSubjects.length === 0}
                  onClick={() => setOnboardingStep(3)}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl flex items-center gap-2 font-display cursor-pointer disabled:opacity-50"
                >
                  Continue ({obSubjects.length} {obSubjects.length === 1 ? 'Subject' : 'Subjects'}) <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A] font-display">
                  Confirm your profile &amp; goals
                </h1>
                <p className="text-sm text-[#64748B] mt-1">
                  Review your student profile card and select your active learning goals.
                </p>
              </div>

              {/* Live Preview of the User's Profile Card */}
              <div className="p-4 rounded-2xl bg-[#EFF4FF]/80 border border-[#DBEAFE] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {obAvatarUrl ? (
                    <img
                      src={obAvatarUrl}
                      alt={obName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#2563EB] shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center font-display text-base shrink-0">
                      {obName
                        .trim()
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase() || 'ST'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#0F172A] font-display">{obName}</p>
                    <p className="text-xs text-[#2563EB] font-medium">
                      {obCourse || 'Computer Science'} · {obYear}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {obSubjects.map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#DBEAFE] text-[10px] font-semibold text-[#0F172A]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="text-xs font-semibold text-[#2563EB] hover:underline shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2">
                {availableGoals.map((goal) => {
                  const selected = obGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() =>
                        setObGoals((prev) =>
                          prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
                        )
                      }
                      className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#EFF4FF] border-[#2563EB] text-[#0F172A]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] hover:bg-white'
                      }`}
                    >
                      <span className="text-xs font-semibold">{goal}</span>
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs ${
                          selected
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-white border border-[#CBD5E1]'
                        }`}
                      >
                        {selected && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinishOnboarding}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl flex items-center gap-2 font-display cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Saving Your Profile...' : 'Launch My NoteNest Workspace'}
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // SCREEN 2 & 3: SIGN IN & SIGN UP DASHBOARD
  // ==========================================
  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
      {/* Top Bar */}
      <div className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-[#E2E8F0] bg-white">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => onSwitchMode('landing')}
            className="flex items-center gap-2 text-sm font-semibold text-[#0F172A] hover:text-[#2563EB] transition-colors font-display cursor-pointer"
          >
            <NoteNestLogo size="sm" />
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('landing')}
            className="text-xs text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Product Overview
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setGeneralError(null);
              setFieldErrors({});
              onSwitchMode('signin');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              !isSignUp
                ? 'bg-[#DBEAFE] text-[#2563EB]'
                : 'text-[#434655] hover:bg-[#F8FAFC]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setGeneralError(null);
              setFieldErrors({});
              onSwitchMode('signup');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isSignUp
                ? 'bg-[#2563EB] text-white'
                : 'bg-[#EFF4FF] text-[#2563EB] hover:bg-[#DBEAFE]'
            }`}
          >
            Sign Up &amp; Create Profile
          </button>
        </div>
      </div>

      {/* Main Centered Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-sm space-y-6">
          {/* Brand Logo & Heading */}
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center justify-center mb-1">
              <NoteNestLogo size="lg" variant="cream-card" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F172A] font-display">
              {isSignUp ? 'Create your student profile' : 'Sign in to NoteNest'}
            </h1>
            <p className="text-xs text-[#64748B]">
              {isSignUp
                ? 'Set up your personal profile, subjects, and AI-powered study workspace.'
                : 'Sign in with your account credentials or create your own profile below.'}
            </p>
          </div>

          {/* Mode Switcher Tabs right inside the card for instant visibility */}
          <div className="grid grid-cols-2 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
            <button
              type="button"
              onClick={() => {
                setGeneralError(null);
                setFieldErrors({});
                onSwitchMode('signin');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setGeneralError(null);
                setFieldErrors({});
                onSwitchMode('signup');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-white text-[#2563EB] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              Sign Up (Create Profile)
            </button>
          </div>

          {generalError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-2.5 text-xs text-[#DC2626]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          <form
            onSubmit={isSignUp ? handleSignUpSubmit : handleSignInSubmit}
            noValidate
            className="space-y-4"
          >
            {isSignUp && (
              <>
                {/* Optional Profile Photo Picker right on Sign Up */}
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={name || 'Profile preview'}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#2563EB] shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-[#2563EB] text-white font-bold flex items-center justify-center font-display text-xs shrink-0">
                        {name
                          .trim()
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'ST'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-[#0F172A]">
                        Profile Photo <span className="text-[#64748B] font-normal">(Optional)</span>
                      </p>
                      <p className="text-[11px] text-[#64748B]">
                        Add your photo or use your initials badge
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      ref={signupPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarFileSelect(e, 'signup')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => signupPhotoInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2563EB] text-[11px] font-semibold text-[#2563EB] flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      {avatarUrl ? 'Change' : 'Add Photo'}
                    </button>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(null)}
                        className="p-1 text-[#64748B] hover:text-[#DC2626] cursor-pointer"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                      }}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all ${
                        fieldErrors.name
                          ? 'border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
                          : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15'
                      }`}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] text-[#DC2626] mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                      Course / Major *
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={courseInput}
                        onChange={(e) => {
                          setCourseInput(e.target.value);
                          if (fieldErrors.course) setFieldErrors({ ...fieldErrors, course: '' });
                        }}
                        placeholder="e.g. Computer Science"
                        className={`w-full pl-10 pr-3 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all ${
                          fieldErrors.course
                            ? 'border-[#DC2626]'
                            : 'border-[#E2E8F0] focus:border-[#2563EB]'
                        }`}
                      />
                    </div>
                    {fieldErrors.course && (
                      <p className="text-[11px] text-[#DC2626] mt-1">{fieldErrors.course}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                      Year
                    </label>
                    <select
                      value={yearInput}
                      onChange={(e) => setYearInput(e.target.value)}
                      className="w-full px-2.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="Yr 1">Yr 1</option>
                      <option value="Yr 2">Yr 2</option>
                      <option value="Yr 3">Yr 3</option>
                      <option value="Yr 4">Yr 4</option>
                      <option value="Grad">Grad</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                University or personal email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                  }}
                  placeholder="you@university.edu"
                  className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all ${
                    fieldErrors.email
                      ? 'border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
                      : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-[#DC2626] mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#0F172A]">Password *</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPasswordOpen(true);
                      setResetEmailSent(false);
                    }}
                    className="text-xs font-medium text-[#2563EB] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                  }}
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                  className={`w-full pl-10 pr-10 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all ${
                    fieldErrors.password
                      ? 'border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
                      : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-[#DC2626] mt-1">{fieldErrors.password}</p>
              )}

              {/* Live Password Strength Meter & Validation Rules on Sign Up */}
              {isSignUp && (
                <div className="mt-2.5 space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div
                        key={lvl}
                        className={`h-1 rounded-full transition-colors ${
                          pwdScore >= lvl
                            ? pwdScore <= 2
                              ? 'bg-[#F59E0B]'
                              : 'bg-[#10B981]'
                            : 'bg-[#E2E8F0]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#64748B]">
                    <span className={pwdHasLength ? 'text-[#10B981] font-medium' : ''}>
                      {pwdHasLength ? '✓' : '○'} 8+ characters
                    </span>
                    <span className={pwdHasUpper ? 'text-[#10B981] font-medium' : ''}>
                      {pwdHasUpper ? '✓' : '○'} Uppercase (A-Z)
                    </span>
                    <span className={pwdHasLower ? 'text-[#10B981] font-medium' : ''}>
                      {pwdHasLower ? '✓' : '○'} Lowercase (a-z)
                    </span>
                    <span className={pwdHasNumberOrSymbol ? 'text-[#10B981] font-medium' : ''}>
                      {pwdHasNumberOrSymbol ? '✓' : '○'} Number or symbol
                    </span>
                  </div>
                </div>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                  Confirm password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                    }}
                    placeholder="Re-enter your password"
                    className={`w-full pl-10 pr-4 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
                        : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15'
                    }`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-[#DC2626] mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center justify-between pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="text-xs text-[#434655]">Remember me for 30 days</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all font-display cursor-pointer disabled:opacity-60"
            >
              {loading
                ? isSignUp
                  ? 'Creating Your Profile...'
                  : 'Signing In...'
                : isSignUp
                ? 'Continue to Choose My Subjects →'
                : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Optional Demo Account Box at bottom */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
              <div className="text-xs text-[#0F172A]">
                <p className="font-semibold text-[#0F172A]">Want to explore a sample workspace?</p>
                <p className="text-[#64748B] text-[11px]">
                  Or click &ldquo;Sign Up&rdquo; above to create your own profile &amp; subjects
                </p>
              </div>
              <button
                type="button"
                onClick={handleDemoAccountLogin}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF4FF] hover:bg-[#DBEAFE] rounded-lg transition-colors whitespace-nowrap font-display cursor-pointer"
              >
                Try Demo
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>
                Your profile, subjects, and uploaded study documents are saved to your account.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[#0F172A] font-display">Reset your password</h3>
            {resetEmailSent ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-2.5 text-xs text-[#065F46]">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>
                    If an account matches <strong>{email || 'your university email'}</strong>, a
                    password reset link has been dispatched.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#2563EB] rounded-lg font-display cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#64748B]">
                  Enter your university email address and we&apos;ll send you a recovery link.
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#2563EB]"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetEmailSent(true)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg font-display cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
