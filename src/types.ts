export type NavSection =
  | 'dashboard'
  | 'knowledge'
  | 'ai-assistant'
  | 'quizzes'
  | 'revision'
  | 'progress'
  | 'settings';

export interface AiDocumentSummary {
  overview: string;
  keyTakeaways: string[];
  coreDefinitions: { term: string; explanation: string }[];
  examHighYieldPoints: string[];
  selfCheckQuestions: { question: string; answer: string }[];
  generatedAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  fileName: string;
  fileSize?: string;
  subject: string;
  subjectCode: string;
  fileType: 'PDF' | 'PPTX' | 'Notes' | 'Markdown Doc';
  pagesOrSlides: string;
  pageCount: number;
  conceptsCount: number;
  updatedAt: string;
  authorNote: string;
  recallProgress: number;
  statusBadge?: 'Mastered' | 'Needs Review' | 'Primary' | null;
  keyConcepts: string[];
  actionLabel: string;
  actionType: 'quiz' | 'review' | 'practice' | 'drill';
  questionCount: number;
  activeInAiScope: boolean;
  excerptPage: number;
  excerptSection: string;
  excerptText: string;
  fullSummary: string;
  rawContent?: string;
  fileDataUrl?: string;
  fileMimeType?: string;
  aiSummary?: AiDocumentSummary | null;
}

export interface ActivityItem {
  id: string;
  type: 'document' | 'quiz' | 'ai' | 'revision';
  title: string;
  highlight: string;
  meta?: string;
  timestamp: string;
}

export interface RevisionTopic {
  id: string;
  subject: string;
  title: string;
  urgency: 'Urgent' | 'Low Retention' | 'Due Soon' | 'Mastered';
  reason: string;
  estMinutes: number;
  recallScore: number;
  lastReviewed: string;
  sourceDoc: string;
  flashcards: { front: string; back: string; citation: string }[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  course: string;
  year: string;
  streakDays: number;
  onboarded: boolean;
  subjects: string[];
  goals: string[];
  weeklyCompletedModules: number;
  weeklyTargetModules: number;
  createdAt: string;
  preferences: {
    theme: 'light';
    emailNotifications: boolean;
    revisionReminders: boolean;
    strictGroundedMode: boolean;
  };
  materials: StudyMaterial[];
  activities: ActivityItem[];
  revisionTopics: RevisionTopic[];
}

export interface AiCitation {
  docName: string;
  pageRef: string;
  quote: string;
  actionText: string;
}

export interface StructuredAiAnswer {
  title: string;
  leadParagraph: string;
  leftBoxTitle: string;
  leftBoxSubtitle: string;
  leftBoxBullets: string[];
  rightBoxTitle: string;
  rightBoxSubtitle: string;
  rightBoxBullets: string[];
  scheduleLabel: string;
  scheduleSteps: string[];
  scheduleExplanation: string;
  examTipTitle: string;
  examTipBody: string;
  citations: AiCitation[];
}

export interface QuizQuestion {
  id: number;
  topicTag: string;
  typeLabel: string;
  prompt: string;
  options: {
    letter: 'A' | 'B' | 'C' | 'D';
    text: string;
  }[];
  correctLetter: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  sourceRef: string;
  sourceExcerpt: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  subject: string;
  mastery: number;
  definition: string;
  relatedIds: string[];
  sourceDocs: string[];
  x: number;
  y: number;
}
