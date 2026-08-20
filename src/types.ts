export type TopicId =
  | 'grammar'
  | 'vocabulary'
  | 'pronunciation'
  | 'stress'
  | 'reading'
  | 'sentence_rewrite'
  | 'cloze'
  | 'error_identification';

export type SubTopicId =
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

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export interface Question {
  id: string;
  topicId: TopicId;
  subTopicId: SubTopicId;
  difficulty: DifficultyLevel;
  content: string;
  passage?: string; // For reading and cloze
  options: string[]; // [A, B, C, D]
  correctOption: number; // 0, 1, 2, 3
  explanation: string; // Detailed Vietnamese explanation
  grammarRule?: string; // Specific rule name or formula
  commonMistakeTip?: string; // Warning on traps/distractors
  translation?: string; // Sentence translation to Vietnamese
}

export interface LessonFormula {
  name: string;
  formula: string;
  example: string;
  note?: string;
}

export interface Lesson {
  id: string;
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
  partOfSpeech: 'noun' | 'verb' | 'adj' | 'adv' | 'phrasal_verb' | 'idiom';
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  unit: string;
  theme: string;
  collocations?: string[];
  audioText?: string;
}

export interface Exam {
  id: string;
  title: string;
  code: string;
  description: string;
  targetProvince?: string; // e.g. "Đề chuẩn Sở GD&ĐT Hà Nội", "TP.HCM"
  timeLimitMinutes: number;
  totalQuestions: number;
  difficulty: 'standard' | 'advanced' | 'challenge';
  questionIds: string[];
  isOfficialFormat: boolean;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
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
  role: 'student' | 'admin';
  targetScore: number;
  targetSchool: string;
  streakDays: number;
  lastActiveDate: string;
  avatarColor: string;
  isLocked?: boolean;
}

export interface TopicMeta {
  id: TopicId;
  nameVi: string;
  iconName: string;
  color: string;
  description: string;
  weightInExam: string; // e.g. "25-30% đề thi"
}
