export type SubjectId = 'english' | 'math';

export type EnglishTopicId =
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'stress'
  | 'reading'
  | 'sentence_rewrite'
  | 'cloze'
  | 'error_identification';

export type MathTopicId =
  | 'math_can_thuc'
  | 'math_he_phuong_trinh'
  | 'math_ham_so_do_thi'
  | 'math_pt_bac_hai_viet'
  | 'math_giai_toan_lap_pt'
  | 'math_he_thuc_luong'
  | 'math_duong_tron_tu_giac'
  | 'math_hinh_khong_gian_thuc_te'
  | 'math_bat_dang_thuc_cuc_tri';

export type TopicId = EnglishTopicId | MathTopicId;

export type EnglishSubTopicId =
  | 'tenses'
  | 'passive_voice'
  | 'reported_speech'
  | 'conditionals'
  | 'relative_clauses'
  | 'comparisons'
  | 'wish_clauses'
  | 'gerund_infinitive'
  | 'tag_questions'
  | 'modal_verbs'
  | 'phrasal_verbs'
  | 'prepositions'
  | 'pronunciation_s_es'
  | 'pronunciation_ed'
  | 'pronunciation_vowels'
  | 'stress_2_syllables'
  | 'stress_3_syllables'
  | 'vocab_environment'
  | 'vocab_city_life'
  | 'vocab_teen_stress'
  | 'vocab_past_life'
  | 'vocab_wonders'
  | 'vocab_space'
  | 'rewrite_conditionals'
  | 'rewrite_passive'
  | 'rewrite_reported'
  | 'rewrite_connectors'
  | 'rewrite_so_such'
  | 'rewrite_too_enough'
  | 'reading_comprehension'
  | 'cloze_test'
  | 'find_error';

export type MathSubTopicId =
  | 'can_thuc_dkxd'
  | 'can_thuc_rut_gon'
  | 'can_thuc_bai_toan_phu'
  | 'he_pt_the_cong'
  | 'he_pt_chua_tham_so'
  | 'ham_so_bac_nhat_song_song'
  | 'ham_so_parabol_cat_thang'
  | 'pt_bac_hai_delta'
  | 'viet_tong_tich'
  | 'viet_he_thuc_doi_xung'
  | 'toan_chuyen_dong'
  | 'toan_nang_suat_cong_viec'
  | 'toan_thuc_te_phan_tram'
  | 'he_thuc_luong_tam_giac_vuong'
  | 'ti_so_luong_giac_thuc_te'
  | 'tiep_tuyen_duong_tron'
  | 'goc_noi_tiep'
  | 'tu_giac_noi_tiep_4_dau_hieu'
  | 'hinh_tru_non_cau'
  | 'toan_thuc_te_hinh_hoc'
  | 'bdt_cauchy_am_gm'
  | 'bdt_bunhiacopxki_cuc_tri';

export type SubTopicId = EnglishSubTopicId | MathSubTopicId | string;

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface Question {
  id: string;
  subject?: SubjectId; // 'english' | 'math', defaults to english if missing
  topicId: TopicId;
  subTopicId: SubTopicId;
  difficulty: DifficultyLevel;
  content: string;
  passage?: string; // For reading, cloze or math problem background description
  options: string[]; // [A, B, C, D]
  correctOption: number; // 0, 1, 2, 3
  explanation: string; // Detailed Vietnamese step-by-step explanation
  grammarRule?: string; // Specific rule name, formula or math theorem (e.g. Định lý Vi-ét)
  commonMistakeTip?: string; // Warning on traps/distractors (e.g. Quên đối chiếu ĐKXĐ)
  translation?: string; // Translation (English) or Method summary (Math)
}

export interface LessonFormula {
  name: string;
  formula: string;
  example: string;
  note?: string;
}

export interface Lesson {
  id: string;
  subject?: SubjectId;
  topicId: TopicId;
  subTopicId: SubTopicId;
  title: string;
  subTitle: string;
  summary: string;
  formulas: LessonFormula[];
  rules: { title: string; detail: string; examples: string[] }[];
  examTips: string[];
  keySignals: string[];
}

export interface VocabularyWord {
  id: string;
  word: string;
  ipa: string;
  partOfSpeech: 'noun' | 'verb' | 'adj' | 'adv' | 'phrasal_verb' | 'idiom' | 'collocation';
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  unit: string;
  theme: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  collocations?: string[];
  audioText?: string;
  synonyms?: string[];
  antonyms?: string[];
  dateAdded?: string;
  dailyBatch?: string; // e.g. '2026-08-25'
  source?: 'system' | 'admin' | 'ai_daily' | 'imported';
}

export interface DailyVocabSyncConfig {
  enabled: boolean;
  autoHour: number; // default 12 (12:00 PM)
  wordsPerBatch: number; // default 20
  lastSyncDate: string; // 'YYYY-MM-DD'
  targetDifficulty: 'all' | 'easy' | 'medium' | 'hard';
  preferAiGeneration: boolean;
}

export interface VocabClassificationCategory {
  id: string;
  nameVi: string;
  unit: string;
  description: string;
  icon?: string;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'all';
}

export interface MathFormulaCard {
  id: string;
  title: string;
  category: 'algebra' | 'geometry' | 'real_life' | 'calculus_ineq';
  formula: string;
  shortDesc: string;
  casioTip?: string;
  trapWarning?: string;
}

export interface Exam {
  id: string;
  subject?: SubjectId;
  title: string;
  code: string;
  description: string;
  targetProvince?: string; // e.g. "Đề chuẩn Sở GD&ĐT Hà Nội", "TP.HCM", "Đà Nẵng"
  timeLimitMinutes: number;
  totalQuestions: number;
  difficulty: 'standard' | 'advanced' | 'challenge';
  questionIds: string[];
  isOfficialFormat: boolean;
  createdAt: string;
  creatorUserId?: string;
}

export interface ExamAttempt {
  id: string;
  userId?: string;
  subject?: SubjectId;
  examId: string;
  examTitle: string;
  date: string;
  score: number; // Out of 10
  score100: number; // Out of 100 or percentage
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, number>; // questionId -> option index
  flaggedQuestions: string[];
}

export interface PracticeSession {
  id: string;
  userId?: string;
  subject?: SubjectId;
  type: 'topic' | 'quick_blitz' | 'mistake_redo' | 'custom';
  topicId?: TopicId;
  date: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  timeSpentSeconds: number;
  questionIds: string[];
  userAnswers: Record<string, number>;
}

export interface MistakeItem {
  questionId: string;
  subject?: SubjectId;
  wrongCount: number;
  lastAttemptDate: string;
  consecutiveCorrect: number; // 2 in a row = mastered
  mastered: boolean;
  userNote?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'student' | 'admin';
  targetScore: number; // Overall target
  targetScoreEnglish?: number;
  targetScoreMath?: number;
  targetSchool: string;
  streakDays: number;
  lastActiveDate: string;
  avatarColor: string;
  createdAt?: string;
  isLocked?: boolean;
}

export interface TopicMeta {
  id: TopicId;
  subject?: SubjectId;
  nameVi: string;
  iconName: string;
  color: string;
  description: string;
  weightInExam: string; // e.g. "20% Đề thi"
}

export type ActivitySeverity = 'positive' | 'normal' | 'warning' | 'alert';

export interface RealtimeActivityEvent {
  id: string;
  userId: string;
  userName: string;
  avatarColor?: string;
  subject?: SubjectId;
  type:
    | 'exam_submitted'
    | 'exam_started'
    | 'exam_abandoned'
    | 'practice_completed'
    | 'task_submitted'
    | 'mistake_mastered'
    | 'streak_milestone'
    | 'ai_exam_generated'
    | 'scratchpad_used'
    | 'study_start'
    | 'flashcard_mastered'
    | 'goal_updated'
    | 'tab_switched'
    | 'question_wrong'
    | 'question_correct';
  title: string;
  detail: string;
  timestamp: string;
  severity?: ActivitySeverity;
  score?: number;
  attemptId?: string;
  examId?: string;
  examTitle?: string;
  topicName?: string;
  tabSwitchCount?: number;
  streakDays?: number;
}

export type RemoteTaskStatus = 'pending' | 'submitted' | 'confirmed' | 'redo';

export interface RemoteTaskAssignment {
  id: string;
  senderName: string;
  recipientUserId: string; // 'all' or student userId
  subject: SubjectId;
  title: string;
  message: string;
  assignedExamId?: string;
  assignedTopicId?: string;
  targetDeadline?: string;
  timestamp: string;
  completed?: boolean;
  status?: RemoteTaskStatus;
  studentCompletedAt?: string;
  studentScore?: number;
  studentAttemptId?: string;
  studentNote?: string;
  confirmedByAdminAt?: string;
  adminFeedback?: string;
}

export interface RemotePing {
  id: string;
  senderName: string;
  recipientUserId: string;
  message: string;
  pingType: 'encouragement' | 'warning' | 'reminder' | 'custom';
  timestamp: string;
  read?: boolean;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  subject: SubjectId;
  type: 'exam' | 'topic_practice' | 'mistake_review' | 'flashcard';
  targetCount: number;
  currentCount: number;
  targetId?: string;
  rewardPoints: number;
  completed: boolean;
}

export interface StudyMilestone {
  id: string;
  phaseNumber: number;
  title: string;
  scoreTarget: string; // e.g. "Mục tiêu 6.5 - 7.5đ"
  description: string;
  color: string;
  subject: SubjectId;
  topics: {
    topicId: TopicId;
    topicName: string;
    description: string;
    mustMasterKey: string;
  }[];
  completedTopicCount: number;
}

export interface MathEssayProblem {
  id: string;
  title: string;
  category: 'can_thuc' | 'he_pt' | 'ham_so' | 'viet' | 'lap_pt' | 'hinh_hoc' | 'bdt';
  examWeight: string; // e.g. "1.5 - 2.0 điểm"
  problemContent: string;
  steps: {
    stepNumber: number;
    stepTitle: string;
    pointWeight: string;
    stepDetail: string;
    trapsToAvoid: string;
  }[];
  finalAnswer: string;
}
