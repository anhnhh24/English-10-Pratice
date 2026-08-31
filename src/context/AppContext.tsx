import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Question,
  Exam,
  ExamAttempt,
  PracticeSession,
  MistakeItem,
  MistakeReason,
  UserAccount,
  TopicId,
  SubjectId,
  VocabularyWord,
  DailyVocabSyncConfig,
} from '../types';
import { QUESTIONS_DATA } from '../data/questionsData';
import { EXAMS_DATA } from '../data/examsData';
import { MATH_QUESTIONS_DATA } from '../data/mathQuestionsData';
import { MATH_EXAMS_DATA } from '../data/mathExamsData';
import { logAndBroadcastActivity, deleteRemoteTasksByExamId } from '../services/realtimeSyncService';
import {
  pushUserDataToOnlineDB,
  fetchRoomDataFromOnlineDB,
  fetchStudentDataFromOnlineDB,
  fetchExamsFromOnlineDB,
  fetchQuestionsFromOnlineDB,
  fetchDeletedIdsFromOnlineDB,
  saveExamToOnlineDB,
  deleteExamFromOnlineDB,
  saveQuestionToOnlineDB,
  saveQuestionsToOnlineDB,
  deleteQuestionFromOnlineDB,
  saveExamAttemptToOnlineDB,
  deleteExamAttemptFromOnlineDB,
  deleteStudentFromOnlineDB,
  clearOnlineStudentData,
  syncDeletedIdToOnlineDB,
  saveUserToOnlineDB,
  saveUsersToOnlineDB,
  fetchUsersFromOnlineDB,
  subscribeToUsersFromOnlineDB,
  deleteUserFromOnlineDB,
  mergeUserScopedData,
  mergeExamsList,
  mergeQuestionsList,
  mergeUsersList,
  subscribeToStudentData,
  subscribeToRoomData,
  subscribeToExamsFromOnlineDB,
  subscribeToQuestionsFromOnlineDB,
  subscribeToDeletedIdsFromOnlineDB,
} from '../services/cloudSyncService';
import {
  setCookie,
  getCookie,
  dispatchGlobalSync,
  subscribeToGlobalSync,
} from '../services/cookieService';
import {
  getStoredVocabularyWords,
  saveStoredVocabularyWords,
  getStoredDailyVocabConfig,
  saveDailyVocabConfig,
  getTodayDateString,
  shouldRunDailyVocabImport,
  generateCuratedDailyBatch,
  generateVocabBatchWithAI,
} from '../services/vocabService';
import { getStoredApiKey } from '../services/aiExamService';

interface UserScopedData {
  examAttempts: ExamAttempt[];
  practiceSessions: PracticeSession[];
  mistakes: Record<string, MistakeItem>;
  bookmarks: string[];
}

interface AppContextType {
  // Current active subject (English or Math)
  currentSubject: SubjectId;
  switchSubject: (subject: SubjectId) => void;

  // Authentication & Users
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  usersList: UserAccount[];
  login: (email: string, password?: string) => { success: boolean; message?: string };
  register: (data: {
    name: string;
    email: string;
    password?: string;
    targetScore?: number;
    targetScoreMath?: number;
    targetScoreEnglish?: number;
    targetSchool?: string;
  }) => { success: boolean; message?: string };
  logout: () => void;
  switchUser: (userId: string) => void;
  switchUserRole: (role: 'student' | 'admin') => void;
  updateUserTarget: (targetScore: number, school: string) => void;
  updateUserProfile: (data: Partial<UserAccount>) => void;
  updateUserByAdmin: (userId: string, data: Partial<UserAccount>) => void;
  deleteUser: (userId: string) => void;
  toggleUserLock: (userId: string) => void;

  // Questions (combined english + math + custom)
  questions: Question[];
  getQuestionById: (id: string) => Question | undefined;
  addQuestion: (q: (Omit<Question, 'id'> & { id?: string }) | Question) => Question;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  bulkImportQuestions: (newQuestions: (Question | (Omit<Question, 'id'> & { id?: string }))[]) => number;

  // Exams (combined official + math + user-created / DB-synced)
  exams: Exam[];
  getExamById: (id: string) => Exam | undefined;
  addExam: (e: Omit<Exam, 'id' | 'createdAt'> & { id?: string }) => Exam;
  updateExam: (id: string, e: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Exam Attempts management
  deleteExamAttempt: (attemptId: string, userId?: string) => void;

  // Exam Attempts & Practice Sessions (Per User - Synced to DB)
  examAttempts: ExamAttempt[];
  saveExamAttempt: (attempt: Omit<ExamAttempt, 'id'>) => ExamAttempt;
  practiceSessions: PracticeSession[];
  savePracticeSession: (session: Omit<PracticeSession, 'id'>) => PracticeSession;

  // Mistake Notebook (Per User)
  mistakes: Record<string, MistakeItem>;
  recordAnswerResult: (questionId: string, isCorrect: boolean, selectedOption?: number) => void;
  toggleMistakeMastered: (questionId: string) => void;
  updateMistakeNote: (questionId: string, note: string) => void;
  updateMistakeReason: (questionId: string, reason: MistakeReason) => void;
  removeMistake: (questionId: string) => void;
  clearMasteredMistakes: () => void;

  // Bookmarks (Per User)
  bookmarks: string[]; // question IDs
  toggleBookmark: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;

  // Vocabulary & Daily Sync
  vocabularyWords: VocabularyWord[];
  dailyVocabConfig: DailyVocabSyncConfig;
  learnedVocabIds: string[];
  masteredVocabIds: string[];
  starredVocabIds: string[];
  addVocabularyWord: (word: Omit<VocabularyWord, 'id'>) => VocabularyWord;
  updateVocabularyWord: (id: string, updates: Partial<VocabularyWord>) => void;
  deleteVocabularyWord: (id: string) => void;
  bulkImportVocabularyWords: (words: VocabularyWord[]) => number;
  triggerDailyVocabImport: (force?: boolean) => Promise<{ count: number; date: string } | null>;
  updateDailyVocabConfig: (updates: Partial<DailyVocabSyncConfig>) => void;
  toggleVocabLearned: (id: string) => void;
  toggleVocabMastered: (id: string) => void;
  toggleVocabStarred: (id: string) => void;
  vocabSrsData: Record<string, { box: number; nextReviewDate: string; streak: number }>;
  promoteVocabSrs: (id: string) => void;
  demoteVocabSrs: (id: string) => void;
  getVocabBox: (id: string) => number;

  // Analytics & Stats (Calculated dynamically for current subject and overall)
  analytics: {
    totalSolved: number;
    totalCorrect: number;
    overallAccuracy: number;
    averageExamScore: number;
    predictedGrade10Score: number;
    topicStats: Record<string, { solved: number; correct: number; accuracy: number }>;
    weakestTopics: TopicId[];
    strongestTopics: TopicId[];
    recentAttempts: ExamAttempt[];
  };

  // Theme Mode (Light / Dark / Sepia)
  themeMode: 'light' | 'dark' | 'sepia';
  setThemeMode: (mode: 'light' | 'dark' | 'sepia') => void;

  // Teacher / Admin Helpers
  getUserScopedData: (userId: string) => UserScopedData;
  saveTeacherNote: (userId: string, note: string) => void;
  getTeacherNote: (userId: string) => string;
  deleteTeacherNote: (userId: string) => void;

  // Reset or seed sample demo data
  seedDemoProgress: () => void;
  resetAllProgress: () => void;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_student_1',
    name: 'Nguyễn Hoàng Hà',
    email: 'hoangha.lop9@gmail.com',
    password: '123',
    role: 'student',
    targetScore: 8.5,
    targetScoreEnglish: 8.5,
    targetScoreMath: 8.5,
    targetSchool: 'THPT Chu Văn An (Hà Nội)',
    streakDays: 0,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-indigo-600',
    createdAt: '2026-08-01',
  },
  {
    id: 'user_admin_1',
    name: 'Admin (Giám sát)',
    email: 'admin',
    password: '123',
    role: 'admin',
    targetScore: 10,
    targetScoreEnglish: 10,
    targetScoreMath: 10,
    targetSchool: 'Hệ thống Giám Sát Học Tập',
    streakDays: 0,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-emerald-600',
    createdAt: '2026-07-01',
  },
];

// Clean blank data for all users (No fake mock attempts or fake mistakes)
const INITIAL_DEMO_DATA: Record<string, UserScopedData> = {
  user_student_1: {
    examAttempts: [],
    practiceSessions: [],
    mistakes: {},
    bookmarks: [],
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current Subject state (Cookie + localStorage fallback)
  const [currentSubject, setCurrentSubject] = useState<SubjectId>(() => {
    const cookieSubj = getCookie('edu10_subject');
    if (cookieSubj === 'math' || cookieSubj === 'english') return cookieSubj as SubjectId;
    const saved = localStorage.getItem('edu10_current_subject');
    return (saved as SubjectId) || 'english';
  });

  const switchSubject = (subj: SubjectId) => {
    setCurrentSubject(subj);
    localStorage.setItem('edu10_current_subject', subj);
    setCookie('edu10_subject', subj);
    dispatchGlobalSync('SUBJECT_CHANGED', subj);
  };

  // 2. Users state
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('edu10_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('edu10_currentUser');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const cookieUid = getCookie('edu10_uid');
    if (cookieUid) {
      const match = DEFAULT_USERS.find((u) => u.id === cookieUid);
      if (match) return match;
    }
    return DEFAULT_USERS[0];
  });

  // Theme Mode (light / dark / sepia)
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'sepia'>(() => {
    try {
      const saved = localStorage.getItem('edu10_theme_mode');
      if (saved === 'dark' || saved === 'sepia' || saved === 'light') return saved;
    } catch {}
    return 'light';
  });

  const setThemeMode = (mode: 'light' | 'dark' | 'sepia') => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('edu10_theme_mode', mode);
    } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else if (themeMode === 'sepia') {
      root.classList.add('theme-sepia');
    }
  }, [themeMode]);

  // 3. User Scoped Data Helper
  const getUserDataKey = (userId: string) => `edu10_userdata_${userId}`;

  const loadUserData = (userId: string): UserScopedData => {
    const raw = localStorage.getItem(getUserDataKey(userId));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Sanitize legacy mock attempts if any exist in local storage
        if (parsed.examAttempts && Array.isArray(parsed.examAttempts)) {
          parsed.examAttempts = parsed.examAttempts.filter(
            (a: any) => a.id && !a.id.startsWith('attempt_demo_')
          );
        }
        return {
          examAttempts: parsed.examAttempts || [],
          practiceSessions: parsed.practiceSessions || [],
          mistakes: parsed.mistakes || {},
          bookmarks: parsed.bookmarks || [],
        };
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_DEMO_DATA[userId] || {
      examAttempts: [],
      practiceSessions: [],
      mistakes: {},
      bookmarks: [],
    };
  };

  // Active User Data States (Personal user progress)
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => loadUserData(currentUser.id).examAttempts || []);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(() => loadUserData(currentUser.id).practiceSessions || []);
  const [mistakes, setMistakes] = useState<Record<string, MistakeItem>>(() => loadUserData(currentUser.id).mistakes || {});
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadUserData(currentUser.id).bookmarks || []);

  // 4. Shared Custom Exams Bank (Shared globally across all students & admin)
  const [customExams, setCustomExams] = useState<Exam[]>(() => {
    const map = new Map<string, Exam>();

    // A. Read from global/shared custom exams storage
    try {
      const saved = localStorage.getItem('edu10_custom_exams') || localStorage.getItem('edu10_global_custom_exams');
      if (saved) {
        const list: Exam[] = JSON.parse(saved);
        if (Array.isArray(list)) {
          list.forEach((e) => map.set(e.id, e));
        }
      }
    } catch (_) {}

    // B. Migrate any legacy user-scoped customExams into the shared bank
    try {
      DEFAULT_USERS.forEach((u) => {
        const raw = localStorage.getItem(`edu10_userdata_${u.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.customExams)) {
            parsed.customExams.forEach((e: Exam) => map.set(e.id, e));
          }
        }
      });
    } catch (_) {}

    const unified = Array.from(map.values());
    try {
      localStorage.setItem('edu10_custom_exams', JSON.stringify(unified));
      localStorage.setItem('edu10_global_custom_exams', JSON.stringify(unified));
    } catch (_) {}
    return unified;
  });

  // Local ref to prevent synchronization feedback loops when loading/syncing from cloud
  const lastSyncedDataRef = useRef<string>('');
  if (!lastSyncedDataRef.current) {
    const initialData = loadUserData(currentUser.id);
    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: initialData.examAttempts || [],
      practiceSessions: initialData.practiceSessions || [],
      mistakes: initialData.mistakes || {},
      bookmarks: initialData.bookmarks || [],
    });
  }

  // Online DB Exams
  const [dbExams, setDbExams] = useState<Exam[]>([]);

  // Custom User Questions
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('edu10_custom_questions');
    return saved ? JSON.parse(saved) : [];
  });

  // Deleted ID Blacklists (for deleting both custom and built-in/hardcoded exams/questions permanently)
  const [deletedExamIds, setDeletedExamIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu10_deleted_exam_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('edu10_deleted_question_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Vocabulary & Daily Sync State
  const [vocabularyWords, setVocabularyWords] = useState<VocabularyWord[]>(() => getStoredVocabularyWords());
  const [dailyVocabConfig, setDailyVocabConfig] = useState<DailyVocabSyncConfig>(() => getStoredDailyVocabConfig());
  const [learnedVocabIds, setLearnedVocabIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`edu10_learned_vocab_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [masteredVocabIds, setMasteredVocabIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`edu10_mastered_vocab_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [starredVocabIds, setStarredVocabIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`edu10_starred_vocab_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [vocabSrsData, setVocabSrsData] = useState<
    Record<string, { box: number; nextReviewDate: string; streak: number }>
  >(() => {
    try {
      const raw = localStorage.getItem(`edu10_vocab_srs_${currentUser.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // Base Question Bank (English + Math + Custom) - Filtered by deleted blacklist
  const deletedQSet = new Set(deletedQuestionIds);
  const allQuestions: Question[] = [
    ...QUESTIONS_DATA.map((q) => ({ ...q, subject: 'english' as SubjectId })),
    ...MATH_QUESTIONS_DATA.map((q) => ({ ...q, subject: 'math' as SubjectId })),
    ...customQuestions,
  ].filter((q) => !deletedQSet.has(q.id));

  // Base Exam Bank (English + Math + Shared Custom + DB-synced) - Filtered by deleted blacklist
  const deletedESet = new Set(deletedExamIds);
  const allExamsMap = new Map<string, Exam>();

  [
    ...EXAMS_DATA.map((e) => ({ ...e, subject: 'english' as SubjectId })),
    ...MATH_EXAMS_DATA.map((e) => ({ ...e, subject: 'math' as SubjectId })),
    ...customExams,
    ...dbExams,
  ].forEach((e) => {
    if (!deletedESet.has(e.id)) {
      allExamsMap.set(e.id, e);
    }
  });
  const allExams: Exam[] = Array.from(allExamsMap.values());

  // Hydration state flags to protect against race conditions and stale overwrites
  const isCloudHydratingRef = useRef(false);
  const isCloudHydratedRef = useRef(false);
  const hasMountedRef = useRef(false);

  // Helper to update user state from non-destructive merged payload
  const updateStatesFromMerged = (mergedData: UserScopedData) => {
    if (!mergedData) return;

    isCloudHydratingRef.current = true;
    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: mergedData.examAttempts || [],
      practiceSessions: mergedData.practiceSessions || [],
      mistakes: mergedData.mistakes || {},
      bookmarks: mergedData.bookmarks || [],
    });

    if (Array.isArray(mergedData.examAttempts)) {
      const cleanAttempts = mergedData.examAttempts.filter(
        (a: any) => a && a.id && !a.id.startsWith('attempt_demo_')
      );
      setExamAttempts(cleanAttempts);
    }
    if (Array.isArray(mergedData.practiceSessions)) {
      setPracticeSessions(mergedData.practiceSessions);
    }
    if (mergedData.mistakes && typeof mergedData.mistakes === 'object') {
      setMistakes(mergedData.mistakes);
    }
    if (Array.isArray(mergedData.bookmarks)) {
      setBookmarks(mergedData.bookmarks);
    }

    try {
      localStorage.setItem(getUserDataKey(currentUser.id), JSON.stringify(mergedData));
    } catch (_) {}
  };

  // ═════════════════════════════════════════════════════════════
  // CLOUD SYNC: INITIAL LOAD & LIVE REALTIME MULTI-DEVICE LISTENERS
  // ═════════════════════════════════════════════════════════════
  useEffect(() => {
    let isSubscribed = true;
    isCloudHydratedRef.current = false;

    // 1. Initial async fetch: Load from Cloud DB and deep-merge with LocalStorage
    const initializeCloudData = async () => {
      try {
        const [delData, cloudExams, cloudQuestions, cloudUsers, cloudStudent] = await Promise.all([
          fetchDeletedIdsFromOnlineDB(),
          fetchExamsFromOnlineDB(),
          fetchQuestionsFromOnlineDB(),
          fetchUsersFromOnlineDB(),
          fetchStudentDataFromOnlineDB(currentUser.id),
        ]);

        if (!isSubscribed) return;

        // A. Merge Deleted Blacklist IDs
        if (delData.deletedExamIds?.length > 0) {
          setDeletedExamIds((prev) => {
            const merged = Array.from(new Set([...prev, ...delData.deletedExamIds]));
            try { localStorage.setItem('edu10_deleted_exam_ids', JSON.stringify(merged)); } catch (_) {}
            return merged;
          });
        }
        if (delData.deletedQuestionIds?.length > 0) {
          setDeletedQuestionIds((prev) => {
            const merged = Array.from(new Set([...prev, ...delData.deletedQuestionIds]));
            try { localStorage.setItem('edu10_deleted_question_ids', JSON.stringify(merged)); } catch (_) {}
            return merged;
          });
        }

        // B. Merge Custom Exams
        if (cloudExams && cloudExams.length > 0) {
          setCustomExams((prevLocal) => {
            const merged = mergeExamsList(prevLocal, cloudExams, delData.deletedExamIds);
            try {
              localStorage.setItem('edu10_custom_exams', JSON.stringify(merged));
              localStorage.setItem('edu10_global_custom_exams', JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
          setDbExams(cloudExams);
        }

        // C. Merge Custom Questions
        if (cloudQuestions && cloudQuestions.length > 0) {
          setCustomQuestions((prevLocal) => {
            const merged = mergeQuestionsList(prevLocal, cloudQuestions, delData.deletedQuestionIds);
            try { localStorage.setItem('edu10_custom_questions', JSON.stringify(merged)); } catch (_) {}
            return merged;
          });
        }

        // D. Merge Users List (accounts registered on any device)
        if (cloudUsers && cloudUsers.length > 0) {
          setUsersList((prevLocal) => {
            const merged = mergeUsersList(DEFAULT_USERS, prevLocal, cloudUsers);
            try { localStorage.setItem('edu10_users', JSON.stringify(merged)); } catch (_) {}
            return merged;
          });
        }

        // E. Merge Student Progress for current active user
        if (cloudStudent && cloudStudent.userData) {
          const localData = loadUserData(currentUser.id);
          const mergedData = mergeUserScopedData(localData, cloudStudent.userData);
          updateStatesFromMerged(mergedData);
        }
      } catch (err) {
        console.warn('Initial cloud data fetch failed:', err);
      } finally {
        if (isSubscribed) {
          isCloudHydratedRef.current = true;
        }
      }
    };

    initializeCloudData();

    // 2. Set up Live Realtime Subscriptions from Firebase (Cross-Device Instant Sync)
    // 2a. Live Student Data Listener
    const unsubStudent = subscribeToStudentData(currentUser.id, (cloudPayload) => {
      if (!isSubscribed || !cloudPayload?.userData) return;
      const localData = loadUserData(currentUser.id);
      const mergedData = mergeUserScopedData(localData, cloudPayload.userData);
      updateStatesFromMerged(mergedData);
    });

    // 2b. Live Exams Listener
    const unsubExams = subscribeToExamsFromOnlineDB((cloudExams) => {
      if (!isSubscribed || !Array.isArray(cloudExams)) return;
      setCustomExams((prevLocal) => {
        const merged = mergeExamsList(prevLocal, cloudExams, deletedExamIds);
        try {
          localStorage.setItem('edu10_custom_exams', JSON.stringify(merged));
          localStorage.setItem('edu10_global_custom_exams', JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
      setDbExams(cloudExams);
    });

    // 2c. Live Questions Listener
    const unsubQuestions = subscribeToQuestionsFromOnlineDB((cloudQuestions) => {
      if (!isSubscribed || !Array.isArray(cloudQuestions)) return;
      setCustomQuestions((prevLocal) => {
        const merged = mergeQuestionsList(prevLocal, cloudQuestions, deletedQuestionIds);
        try { localStorage.setItem('edu10_custom_questions', JSON.stringify(merged)); } catch (_) {}
        return merged;
      });
    });

    // 2d. Live Deleted Blacklist Listener
    const unsubDeleted = subscribeToDeletedIdsFromOnlineDB((delData) => {
      if (!isSubscribed) return;
      if (delData.deletedExamIds?.length) {
        setDeletedExamIds((prev) => {
          const merged = Array.from(new Set([...prev, ...delData.deletedExamIds]));
          try { localStorage.setItem('edu10_deleted_exam_ids', JSON.stringify(merged)); } catch (_) {}
          return merged;
        });
      }
      if (delData.deletedQuestionIds?.length) {
        setDeletedQuestionIds((prev) => {
          const merged = Array.from(new Set([...prev, ...delData.deletedQuestionIds]));
          try { localStorage.setItem('edu10_deleted_question_ids', JSON.stringify(merged)); } catch (_) {}
          return merged;
        });
      }
    });

    // 2e. Live User Accounts Listener
    const unsubUsers = subscribeToUsersFromOnlineDB((cloudUsers) => {
      if (!isSubscribed || !Array.isArray(cloudUsers)) return;
      setUsersList((prevLocal) => {
        const merged = mergeUsersList(DEFAULT_USERS, prevLocal, cloudUsers);
        try { localStorage.setItem('edu10_users', JSON.stringify(merged)); } catch (_) {}
        return merged;
      });
    });

    // 2f. Live Room Data Listener (updates all students' progress in real time for Admin / Guardian)
    const unsubRoom = subscribeToRoomData((roomStudents) => {
      if (!isSubscribed || !roomStudents || typeof roomStudents !== 'object') return;
      Object.entries(roomStudents).forEach(([stuId, payload]: [string, any]) => {
        if (payload && payload.userData && stuId !== currentUser.id) {
          try {
            const localStuData = loadUserData(stuId);
            const merged = mergeUserScopedData(localStuData, payload.userData);
            localStorage.setItem(getUserDataKey(stuId), JSON.stringify(merged));
          } catch (_) {}
        }
      });
      dispatchGlobalSync('STUDENT_DATA_UPDATED');
    });

    return () => {
      isSubscribed = false;
      unsubStudent();
      unsubExams();
      unsubQuestions();
      unsubDeleted();
      unsubUsers();
      unsubRoom();
    };
  }, [currentUser.id]);

  // Global Sync Listener for Cross-Tab & Cross-Component Reactivity
  useEffect(() => {
    const unsub = subscribeToGlobalSync((event) => {
      if (event.type === 'EXAMS_UPDATED') {
        const saved = localStorage.getItem('edu10_custom_exams') || localStorage.getItem('edu10_global_custom_exams');
        if (saved) {
          try {
            setCustomExams(JSON.parse(saved));
          } catch (_) {}
        }
      } else if (event.type === 'QUESTIONS_UPDATED') {
        const savedQ = localStorage.getItem('edu10_custom_questions');
        if (savedQ) {
          try {
            setCustomQuestions(JSON.parse(savedQ));
          } catch (_) {}
        }
      } else if (event.type === 'SUBJECT_CHANGED' && event.payload) {
        setCurrentSubject(event.payload);
      } else if (event.type === 'USER_CHANGED' && event.payload) {
        if (event.payload.id !== currentUser.id) {
          const uData = loadUserData(event.payload.id);
          setCurrentUser(event.payload);

          lastSyncedDataRef.current = JSON.stringify({
            examAttempts: uData.examAttempts || [],
            practiceSessions: uData.practiceSessions || [],
            mistakes: uData.mistakes || {},
            bookmarks: uData.bookmarks || [],
          });

          setExamAttempts(uData.examAttempts || []);
          setPracticeSessions(uData.practiceSessions || []);
          setMistakes(uData.mistakes || {});
          setBookmarks(uData.bookmarks || []);
        }
      }
    });

    return () => unsub();
  }, [currentUser.id]);

  // Sync user data to localStorage and Online Cloud DB (Protected against startup overwrites & debounced)
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    // Do NOT push to Cloud DB until initial cloud data has hydrated (prevents wiping remote DB with stale local state)
    if (!isCloudHydratedRef.current) {
      return;
    }

    // If state update originated from cloud hydration, skip writing back to cloud
    if (isCloudHydratingRef.current) {
      isCloudHydratingRef.current = false;
      return;
    }

    const currentSerialized = JSON.stringify({
      examAttempts,
      practiceSessions,
      mistakes,
      bookmarks,
    });

    // Check if there is an actual local state change before writing to DB
    if (lastSyncedDataRef.current && currentSerialized === lastSyncedDataRef.current) {
      return;
    }

    lastSyncedDataRef.current = currentSerialized;

    const userData: UserScopedData = {
      examAttempts,
      practiceSessions,
      mistakes,
      bookmarks,
    };

    // 1. Instant update in localStorage
    localStorage.setItem(getUserDataKey(currentUser.id), JSON.stringify(userData));

    // 2. Debounced push to Online Cloud DB
    const timer = setTimeout(() => {
      pushUserDataToOnlineDB(currentUser.id, userData, currentUser);
    }, 1200);

    return () => clearTimeout(timer);
  }, [examAttempts, practiceSessions, mistakes, bookmarks, currentUser.id]);

  useEffect(() => {
    localStorage.setItem('edu10_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('edu10_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edu10_custom_questions', JSON.stringify(customQuestions));
  }, [customQuestions]);

  // Auth Operations
  const login = (emailOrUsername: string, password?: string): { success: boolean; message?: string } => {
    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    const user = usersList.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        (cleanInput === 'admin' && u.role === 'admin') ||
        (cleanInput === 'admin@gmail.com' && u.role === 'admin')
    );

    if (!user) {
      return { success: false, message: 'Tài khoản hoặc email này chưa được đăng ký trong hệ thống.' };
    }

    if (user.isLocked) {
      return { success: false, message: 'Tài khoản này đang bị tạm khóa. Vui lòng liên hệ Admin.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác. Vui lòng thử lại.' };
    }

    // Switch active user & load their data
    switchUser(user.id);
    return { success: true, message: `Chào mừng ${user.name} đã quay trở lại!` };
  };

  const register = (data: {
    name: string;
    email: string;
    password?: string;
    targetScore?: number;
    targetScoreMath?: number;
    targetScoreEnglish?: number;
    targetSchool?: string;
  }): { success: boolean; message?: string } => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (usersList.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Email này đã được sử dụng. Vui lòng dùng email khác.' };
    }

    const newUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password || '123456',
      role: 'student',
      targetScore: data.targetScore || 8.5,
      targetScoreEnglish: data.targetScoreEnglish || data.targetScore || 8.5,
      targetScoreMath: data.targetScoreMath || data.targetScore || 8.5,
      targetSchool: data.targetSchool || 'THPT Chu Văn An / Kim Liên',
      streakDays: 0,
      lastActiveDate: new Date().toISOString(),
      avatarColor: 'bg-emerald-600',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsersList((prev) => [newUser, ...prev]);
    saveUserToOnlineDB(newUser).catch((err) => console.warn('Online DB saveUser error:', err));
    switchUser(newUser.id, newUser);
    return { success: true, message: 'Đăng ký tài khoản mới thành công!' };
  };

  const logout = () => {
    switchUser(DEFAULT_USERS[0].id);
  };

  const switchUser = (userId: string, directUserObj?: UserAccount) => {
    const target = directUserObj || usersList.find((u) => u.id === userId) || DEFAULT_USERS[0];
    setCurrentUser(target);
    localStorage.setItem('edu10_currentUser', JSON.stringify(target));
    setCookie('edu10_uid', target.id);

    // Load target user's personal progress data
    const uData = loadUserData(target.id);

    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: uData.examAttempts || [],
      practiceSessions: uData.practiceSessions || [],
      mistakes: uData.mistakes || {},
      bookmarks: uData.bookmarks || [],
    });

    setExamAttempts(uData.examAttempts || []);
    setPracticeSessions(uData.practiceSessions || []);
    setMistakes(uData.mistakes || {});
    setBookmarks(uData.bookmarks || []);

    dispatchGlobalSync('USER_CHANGED', target);
  };

  const switchUserRole = (role: 'student' | 'admin') => {
    const target = usersList.find((u) => u.role === role);
    if (target) {
      switchUser(target.id);
    }
  };

  const updateUserTarget = (targetScore: number, school: string) => {
    const updated: UserAccount = {
      ...currentUser,
      targetScore,
      targetScoreEnglish: currentSubject === 'english' ? targetScore : currentUser.targetScoreEnglish,
      targetScoreMath: currentSubject === 'math' ? targetScore : currentUser.targetScoreMath,
      targetSchool: school,
    };
    setCurrentUser(updated);
    localStorage.setItem('edu10_currentUser', JSON.stringify(updated));
    setUsersList((prev) => {
      const next = prev.map((u) => (u.id === currentUser.id ? updated : u));
      localStorage.setItem('edu10_users', JSON.stringify(next));
      return next;
    });
    saveUserToOnlineDB(updated).catch((err) => console.warn('Online DB saveUser error:', err));

    logAndBroadcastActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      subject: currentSubject,
      type: 'goal_updated',
      severity: 'normal',
      title: `Cập nhật mục tiêu điểm thi`,
      detail: `Mục tiêu mới: ${targetScore}đ môn ${currentSubject === 'math' ? 'Toán' : 'Anh'} • Trường: ${school}`,
      score: targetScore,
    });
  };

  const updateUserProfile = (data: Partial<UserAccount>) => {
    const updated: UserAccount = { ...currentUser, ...data };
    setCurrentUser(updated);
    localStorage.setItem('edu10_currentUser', JSON.stringify(updated));
    setUsersList((prev) => {
      const next = prev.map((u) => (u.id === currentUser.id ? updated : u));
      localStorage.setItem('edu10_users', JSON.stringify(next));
      return next;
    });
    saveUserToOnlineDB(updated).catch((err) => console.warn('Online DB saveUser error:', err));
  };

  const toggleUserLock = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: !u.isLocked } : u))
    );
  };

  /**
   * Admin updates another user's profile data (name, password, target scores, school, etc.)
   */
  const updateUserByAdmin = (userId: string, data: Partial<UserAccount>) => {
    setUsersList((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...data } : u));
      localStorage.setItem('edu10_users', JSON.stringify(updated));
      const target = updated.find((u) => u.id === userId);
      if (target) {
        saveUserToOnlineDB(target).catch((err) => console.warn('Online DB saveUser error:', err));
      }
      return updated;
    });
    // If updating currentUser themselves, also update currentUser state
    if (userId === currentUser.id) {
      setCurrentUser((prev) => {
        const updated = { ...prev, ...data };
        localStorage.setItem('edu10_currentUser', JSON.stringify(updated));
        return updated;
      });
    }
  };

  /**
   * Admin deletes a student account.
   * - Removes from usersList
   * - Clears their localStorage data
   * - Deletes from Firebase
   * - Does NOT allow deleting admin accounts
   */
  const deleteUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (!target || target.role === 'admin') {
      console.warn('Cannot delete admin accounts.');
      return;
    }
    // Remove from usersList
    setUsersList((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      localStorage.setItem('edu10_users', JSON.stringify(updated));
      return updated;
    });
    // Clear their localStorage scoped data
    try {
      localStorage.removeItem(`edu10_userdata_${userId}`);
      localStorage.removeItem(`edu10_teachernote_${userId}`);
    } catch (_) {}
    // Delete from Firebase
    deleteUserFromOnlineDB(userId).catch((err) =>
      console.warn('DB deleteUser error:', err)
    );
  };

  // Questions
  const getQuestionById = (id: string): Question | undefined => {
    // First look in the in-memory list (fast path)
    const inMemory = allQuestions.find((q) => q.id === id);
    if (inMemory) return inMemory;

    // Fallback: read from localStorage in case bulkImportQuestions was called
    // just before this render cycle and React state hasn't updated yet
    try {
      const raw = localStorage.getItem('edu10_custom_questions');
      if (raw) {
        const persisted: Question[] = JSON.parse(raw);
        return persisted.find((q) => q.id === id);
      }
    } catch (_) {}
    return undefined;
  };

  const addQuestion = (q: (Omit<Question, 'id'> & { id?: string }) | Question): Question => {
    const newQ: Question = {
      ...q,
      subject: q.subject || currentSubject,
      id: q.id || `q_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setCustomQuestions((prev) => {
      const existing = prev.filter((item) => item.id !== newQ.id);
      const updated = [newQ, ...existing];
      try {
        localStorage.setItem('edu10_custom_questions', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    // Save to Firebase Realtime DB
    saveQuestionToOnlineDB(newQ).catch((err) => console.warn('DB Question save error:', err));
    dispatchGlobalSync('QUESTIONS_UPDATED');
    return newQ;
  };

  const updateQuestion = (id: string, q: Partial<Question>) => {
    setCustomQuestions((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...q } : item));
      const target = updated.find((item) => item.id === id);
      if (target) {
        saveQuestionToOnlineDB(target).catch((err) => console.warn('DB Question update error:', err));
      }
      try {
        localStorage.setItem('edu10_custom_questions', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    dispatchGlobalSync('QUESTIONS_UPDATED');
  };

  const deleteQuestion = (id: string) => {
    // 1. Add to deleted blacklist permanently so it never comes back
    setDeletedQuestionIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('edu10_deleted_question_ids', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    // 2. Remove from local state
    setCustomQuestions((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('edu10_custom_questions', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    removeMistake(id);
    setBookmarks((prev) => prev.filter((bId) => bId !== id));
    // 3. Delete & Sync to Firebase Realtime DB
    deleteQuestionFromOnlineDB(id).catch((err) => console.warn('DB Question delete error:', err));
    syncDeletedIdToOnlineDB('question', id).catch(() => {});
    dispatchGlobalSync('QUESTIONS_UPDATED');
  };

  const bulkImportQuestions = (newQuestions: (Question | (Omit<Question, 'id'> & { id?: string }))[]): number => {
    const formatted: Question[] = newQuestions.map((q: any, idx) => ({
      ...q,
      subject: q.subject || currentSubject,
      id: q.id || `q_import_${Date.now()}_${idx}`,
    }));
    setCustomQuestions((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = formatted.filter((f) => !existingIds.has(f.id));
      const updated = [...toAdd, ...prev];
      try {
        localStorage.setItem('edu10_custom_questions', JSON.stringify(updated));
      } catch (_) {}
      // Save all new questions in a single DB update batch to avoid race conditions
      saveQuestionsToOnlineDB(toAdd).catch((err) => console.warn('DB Questions batch save error:', err));
      return updated;
    });
    dispatchGlobalSync('QUESTIONS_UPDATED');
    return formatted.length; // Return total formatted count (caller uses this as an indicator of AI generation size)
  };

  // Exams (Saved & Synced to Firebase Realtime DB)
  const getExamById = (id: string) => allExams.find((e) => e.id === id);

  const addExam = (e: Omit<Exam, 'id' | 'createdAt'> & { id?: string }): Exam => {
    const newExam: Exam = {
      ...e,
      subject: e.subject || currentSubject,
      id: e.id || `exam_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      creatorUserId: currentUser.id,
    };
    setCustomExams((prev) => {
      const filtered = prev.filter((item) => item.id !== newExam.id);
      const updated = [newExam, ...filtered];
      try {
        localStorage.setItem('edu10_custom_exams', JSON.stringify(updated));
        localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    // Immediately persist to Firebase Realtime Database
    saveExamToOnlineDB(newExam).catch((err) => console.warn('DB Exam save error:', err));
    dispatchGlobalSync('EXAMS_UPDATED');
    return newExam;
  };

  const updateExam = (id: string, e: Partial<Exam>) => {
    const isInCustom = customExams.some((item) => item.id === id);
    const isInDb = dbExams.some((item) => item.id === id);

    if (!isInCustom && !isInDb) {
      // Built-in exam — clone it to customExams before patching
      const builtIn = allExams.find((item) => item.id === id);
      if (builtIn) {
        const patched: Exam = { ...builtIn, ...e };
        setCustomExams((prev) => {
          const filtered = prev.filter((item) => item.id !== id);
          const updated = [patched, ...filtered];
          try {
            localStorage.setItem('edu10_custom_exams', JSON.stringify(updated));
            localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
        saveExamToOnlineDB(patched).catch((err) => console.warn('DB Exam update (built-in clone) error:', err));
        dispatchGlobalSync('EXAMS_UPDATED');
        return;
      }
    }

    setCustomExams((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...e } : item));
      const target = updated.find((item) => item.id === id);
      try {
        localStorage.setItem('edu10_custom_exams', JSON.stringify(updated));
        localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
      } catch (_) {}
      if (target) {
        saveExamToOnlineDB(target).catch((err) => console.warn('DB Exam update error:', err));
      }
      return updated;
    });

    if (isInDb) {
      setDbExams((prev) => prev.map((item) => (item.id === id ? { ...item, ...e } : item)));
      const dbTarget = dbExams.find((item) => item.id === id);
      if (dbTarget) {
        saveExamToOnlineDB({ ...dbTarget, ...e }).catch((err) => console.warn('DB Exam update error:', err));
      }
    }
    dispatchGlobalSync('EXAMS_UPDATED');
  };

  const deleteExam = (id: string) => {
    // 1. Add to deleted blacklist permanently so it never comes back
    setDeletedExamIds((prev) => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('edu10_deleted_exam_ids', JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    // 2. Remove from shared customExams
    setCustomExams((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem('edu10_custom_exams', JSON.stringify(updated));
        localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    setDbExams((prev) => prev.filter((item) => item.id !== id));
    // 3. Delete & Sync to Firebase Realtime DB
    deleteExamFromOnlineDB(id).catch((err) => console.warn('DB Exam delete error:', err));
    syncDeletedIdToOnlineDB('exam', id).catch(() => {});
    // 4. Clean up any assigned tasks referencing this deleted exam
    deleteRemoteTasksByExamId(id);
    dispatchGlobalSync('EXAMS_UPDATED');
  };

  // ─── deleteExamAttempt ───────────────────────────────────────────
  /**
   * Delete a specific exam attempt.
   * - If userId is provided (admin deleting for another user), update that user's localStorage and Firebase
   * - Otherwise deletes from current user's state
   */
  const deleteExamAttempt = (attemptId: string, userId?: string) => {
    const targetUserId = userId || currentUser.id;

    if (targetUserId === currentUser.id) {
      // Update live state for current user
      setExamAttempts((prev) => prev.filter((a) => a.id !== attemptId));
    }

    // Always update target user's stored data and push to Firebase
    try {
      const raw = localStorage.getItem(`edu10_userdata_${targetUserId}`);
      if (raw) {
        const userData = JSON.parse(raw);
        userData.examAttempts = (userData.examAttempts || []).filter(
          (a: ExamAttempt) => a.id !== attemptId
        );
        localStorage.setItem(`edu10_userdata_${targetUserId}`, JSON.stringify(userData));
        pushUserDataToOnlineDB(targetUserId, userData).catch((err) =>
          console.warn('Firebase pushUserData after delete attempt error:', err)
        );
      }
    } catch (_) {}

    // Delete from Firebase global attempt index
    deleteExamAttemptFromOnlineDB(targetUserId, attemptId).catch((err) =>
      console.warn('DB deleteExamAttempt error:', err)
    );

    dispatchGlobalSync('ATTEMPTS_UPDATED', { userId: targetUserId, attemptId });
  };

  // Attempts & Practice (Saved & Synced to Firebase Realtime DB)
  const saveExamAttempt = (attempt: Omit<ExamAttempt, 'id'>): ExamAttempt => {
    const newAttempt: ExamAttempt = {
      ...attempt,
      userId: currentUser.id,
      subject: attempt.subject || currentSubject,
      id: `attempt_${Date.now()}`,
    };
    setExamAttempts((prev) => [newAttempt, ...prev]);

    // Save directly to Firebase Realtime Database
    saveExamAttemptToOnlineDB(currentUser.id, newAttempt).catch((err) =>
      console.warn('DB saveExamAttempt error:', err)
    );

    // Automatically log and broadcast activity in real-time
    const wrongCount = newAttempt.totalQuestions - newAttempt.correctCount;
    const scoreVal = newAttempt.score;
    const severity = scoreVal >= 8.0 ? 'positive' : scoreVal >= 5.0 ? 'normal' : 'warning';

    logAndBroadcastActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      subject: attempt.subject || currentSubject,
      type: 'exam_submitted',
      severity,
      title: `Vừa hoàn thành bài thi ${attempt.subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
      detail: `Đạt ${newAttempt.score.toFixed(2)}/10đ (Đúng ${newAttempt.correctCount}/${newAttempt.totalQuestions} câu${wrongCount > 0 ? `, sai ${wrongCount} câu` : ''}) • ${attempt.examTitle}`,
      score: newAttempt.score,
      attemptId: newAttempt.id,
      examId: newAttempt.examId,
      examTitle: attempt.examTitle,
    });

    // Record mistakes for ALL questions in the exam:
    // - Wrong answers: increment wrongCount
    // - Unattempted questions: also counted as wrong (not skipped silently)
    // - Only use userAnswers keys as fallback if examObj not found
    const examObj = getExamById(attempt.examId);
    const allExamQIds = (examObj?.questionIds && examObj.questionIds.length > 0)
      ? examObj.questionIds
      : Object.keys(attempt.userAnswers || {});

    const results = allExamQIds.map((qId) => {
      const q = getQuestionById(qId);
      const chosenOpt = attempt.userAnswers?.[qId];
      // Unattempted (chosenOpt === undefined) is treated as incorrect
      const isCorrect = q !== undefined && chosenOpt !== undefined && chosenOpt === q.correctOption;
      return { questionId: qId, isCorrect };
    });
    recordMultipleAnswerResults(results);

    return newAttempt;
  };

  const savePracticeSession = (session: Omit<PracticeSession, 'id'>): PracticeSession => {
    const newSession: PracticeSession = {
      ...session,
      userId: currentUser.id,
      subject: session.subject || currentSubject,
      id: `practice_${Date.now()}`,
    };
    setPracticeSessions((prev) => [newSession, ...prev]);

    const topicLabel = session.topicId
      ? session.topicId.replace('math_', '').replace(/_/g, ' ')
      : 'Tổng hợp phản xạ';

    // Log practice activity
    logAndBroadcastActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      subject: session.subject || currentSubject,
      type: 'practice_completed',
      title: `Hoàn thành bài luyện tập ${session.subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
      detail: `Đúng ${session.correctCount}/${session.totalQuestions} câu • Chuyên đề: ${topicLabel}`,
      score: session.correctCount,
      topicName: session.topicId || 'general',
    });

    return newSession;
  };

  // Mistake Notebook batch recorder to prevent state updates & logs in tight loops
  const recordMultipleAnswerResults = (results: Array<{ questionId: string; isCorrect: boolean }>) => {
    if (results.length === 0) return;

    setMistakes((prev) => {
      const nextMistakes = { ...prev };
      let hasChanges = false;

      results.forEach(({ questionId, isCorrect }) => {
        const q = getQuestionById(questionId);
        const qSubj = q?.subject || currentSubject;
        const existing = prev[questionId];

        if (!isCorrect) {
          nextMistakes[questionId] = {
            questionId,
            subject: qSubj,
            wrongCount: (existing?.wrongCount || 0) + 1,
            lastAttemptDate: new Date().toISOString(),
            consecutiveCorrect: 0,
            mastered: false,
            userNote: existing?.userNote,
          };
          hasChanges = true;
        } else {
          if (existing) {
            const newConsecutive = (existing.consecutiveCorrect || 0) + 1;
            const isNowMastered = newConsecutive >= 2;
            nextMistakes[questionId] = {
              ...existing,
              consecutiveCorrect: newConsecutive,
              mastered: isNowMastered,
              lastAttemptDate: new Date().toISOString(),
            };
            hasChanges = true;
          }
        }
      });

      return hasChanges ? nextMistakes : prev;
    });
  };

  // Mistake Notebook
  const recordAnswerResult = (questionId: string, isCorrect: boolean, selectedOption?: number) => {
    const q = getQuestionById(questionId);
    const qSubj = q?.subject || currentSubject;

    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!isCorrect) {
        return {
          ...prev,
          [questionId]: {
            questionId,
            subject: qSubj,
            wrongCount: (existing?.wrongCount || 0) + 1,
            lastAttemptDate: new Date().toISOString(),
            consecutiveCorrect: 0,
            mastered: false,
            userNote: existing?.userNote,
            reason: existing?.reason,
            lastSelectedOption: selectedOption !== undefined ? selectedOption : existing?.lastSelectedOption,
          },
        };
      } else {
        if (!existing) return prev;
        const newConsecutive = (existing.consecutiveCorrect || 0) + 1;
        const isNowMastered = newConsecutive >= 2;
        return {
          ...prev,
          [questionId]: {
            ...existing,
            consecutiveCorrect: newConsecutive,
            mastered: isNowMastered,
            lastAttemptDate: new Date().toISOString(),
            lastSelectedOption: selectedOption !== undefined ? selectedOption : existing.lastSelectedOption,
          },
        };
      }
    });
  };

  const updateMistakeNote = (questionId: string, note: string) => {
    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!existing) return prev;
      return {
        ...prev,
        [questionId]: {
          ...existing,
          userNote: note,
        },
      };
    });
  };

  const updateMistakeReason = (questionId: string, reason: MistakeReason) => {
    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!existing) return prev;
      return {
        ...prev,
        [questionId]: {
          ...existing,
          reason,
        },
      };
    });
  };

  const toggleMistakeMastered = (questionId: string) => {
    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!existing) return prev;
      const willBeMastered = !existing.mastered;

      if (willBeMastered) {
        const q = getQuestionById(questionId);
        logAndBroadcastActivity({
          userId: currentUser.id,
          userName: currentUser.name,
          avatarColor: currentUser.avatarColor,
          subject: existing.subject || currentSubject,
          type: 'mistake_mastered',
          title: `Đã hiểu và thuần thục câu sai ${existing.subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
          detail: q ? `Câu hỏi: "${q.content.slice(0, 50)}..."` : 'Đã nắm chắc lời giải',
          topicName: q?.topicId,
        });
      }

      return {
        ...prev,
        [questionId]: {
          ...existing,
          mastered: willBeMastered,
          consecutiveCorrect: willBeMastered ? 2 : 0,
        },
      };
    });
  };

  const removeMistake = (questionId: string) => {
    setMistakes((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const clearMasteredMistakes = () => {
    setMistakes((prev) => {
      const updated: Record<string, MistakeItem> = {};
      (Object.entries(prev) as [string, MistakeItem][]).forEach(([id, item]) => {
        if (!item.mastered) updated[id] = item;
      });
      return updated;
    });
  };

  // Bookmarks
  const toggleBookmark = (questionId: string) => {
    setBookmarks((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const isBookmarked = (questionId: string) => bookmarks.includes(questionId);

  // ─── VOCABULARY MANAGEMENT & DAILY 12H / MIDNIGHT SYNC ───
  const addVocabularyWord = (word: Omit<VocabularyWord, 'id'>): VocabularyWord => {
    const newWord: VocabularyWord = {
      ...word,
      id: `vocab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      dateAdded: new Date().toISOString(),
      source: word.source || 'admin',
    };
    setVocabularyWords((prev) => {
      const updated = [newWord, ...prev];
      saveStoredVocabularyWords(updated);
      return updated;
    });
    dispatchGlobalSync('VOCAB_UPDATED');
    return newWord;
  };

  const updateVocabularyWord = (id: string, updates: Partial<VocabularyWord>) => {
    setVocabularyWords((prev) => {
      const updated = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
      saveStoredVocabularyWords(updated);
      return updated;
    });
    dispatchGlobalSync('VOCAB_UPDATED');
  };

  const deleteVocabularyWord = (id: string) => {
    setVocabularyWords((prev) => {
      const updated = prev.filter((w) => w.id !== id);
      saveStoredVocabularyWords(updated);
      return updated;
    });
    dispatchGlobalSync('VOCAB_UPDATED');
  };

  const bulkImportVocabularyWords = (words: VocabularyWord[]): number => {
    if (!words || words.length === 0) return 0;
    setVocabularyWords((prev) => {
      const existingMap = new Map<string, VocabularyWord>(prev.map((w) => [w.word.toLowerCase().trim(), w]));
      words.forEach((w) => {
        const key = w.word.toLowerCase().trim();
        if (!existingMap.has(key)) {
          existingMap.set(key, w);
        }
      });
      const updated: VocabularyWord[] = Array.from(existingMap.values());
      saveStoredVocabularyWords(updated);
      return updated;
    });
    dispatchGlobalSync('VOCAB_UPDATED');
    return words.length;
  };

  const triggerDailyVocabImport = async (force = false): Promise<{ count: number; date: string } | null> => {
    const today = getTodayDateString();
    if (!force && dailyVocabConfig.lastSyncDate === today) {
      return null;
    }

    const batchCount = dailyVocabConfig.wordsPerBatch || 20;
    let newBatch: VocabularyWord[] = [];

    const apiKey = getStoredApiKey();
    if (dailyVocabConfig.preferAiGeneration && apiKey) {
      try {
        newBatch = await generateVocabBatchWithAI(
          apiKey,
          batchCount,
          'Unit 1 to 12 & Grade 9-10 Entrance Exam Vocabulary',
          dailyVocabConfig.targetDifficulty
        );
      } catch (err) {
        console.warn('AI vocab generation fallback to curated bank:', err);
        newBatch = generateCuratedDailyBatch(vocabularyWords, today, batchCount);
      }
    } else {
      newBatch = generateCuratedDailyBatch(vocabularyWords, today, batchCount);
    }

    if (newBatch.length > 0) {
      setVocabularyWords((prev) => {
        const existingTexts = new Set(prev.map((w) => w.word.toLowerCase().trim()));
        const uniqueBatch = newBatch.filter((w) => !existingTexts.has(w.word.toLowerCase().trim()));
        const updated = [...uniqueBatch, ...prev];
        saveStoredVocabularyWords(updated);
        return updated;
      });

      const updatedConfig: DailyVocabSyncConfig = {
        ...dailyVocabConfig,
        lastSyncDate: today,
      };
      setDailyVocabConfig(updatedConfig);
      saveDailyVocabConfig(updatedConfig);

      dispatchGlobalSync('VOCAB_UPDATED');
      logAndBroadcastActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarColor: currentUser.avatarColor,
        type: 'flashcard_mastered',
        severity: 'normal',
        title: `Nạp tự động ${newBatch.length} từ vựng Flashcard mới`,
        detail: `Học sinh đã nhận bộ từ vựng ngày ${today}`,
      });

      return { count: newBatch.length, date: today };
    }

    return null;
  };

  const updateDailyVocabConfig = (updates: Partial<DailyVocabSyncConfig>) => {
    setDailyVocabConfig((prev) => {
      const updated = { ...prev, ...updates };
      saveDailyVocabConfig(updated);
      return updated;
    });
  };

  const toggleVocabLearned = (id: string) => {
    setLearnedVocabIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(`edu10_learned_vocab_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleVocabMastered = (id: string) => {
    setMasteredVocabIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(`edu10_mastered_vocab_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleVocabStarred = (id: string) => {
    setStarredVocabIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(`edu10_starred_vocab_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const promoteVocabSrs = (id: string) => {
    setVocabSrsData((prev) => {
      const current = prev[id] || { box: 1, nextReviewDate: new Date().toISOString(), streak: 0 };
      const nextBox = Math.min(current.box + 1, 5);
      const intervals = [1, 3, 7, 14, 30]; // Days for boxes 1..5
      const daysToAdd = intervals[nextBox - 1] || 1;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysToAdd);

      const updated = {
        ...prev,
        [id]: {
          box: nextBox,
          nextReviewDate: nextDate.toISOString().split('T')[0],
          streak: current.streak + 1,
        },
      };
      localStorage.setItem(`edu10_vocab_srs_${currentUser.id}`, JSON.stringify(updated));

      // If reached Box 5, auto-master
      if (nextBox === 5 && !masteredVocabIds.includes(id)) {
        setMasteredVocabIds((mPrev) => {
          const mUpdated = [...mPrev, id];
          localStorage.setItem(`edu10_mastered_vocab_${currentUser.id}`, JSON.stringify(mUpdated));
          return mUpdated;
        });
      }

      return updated;
    });
  };

  const demoteVocabSrs = (id: string) => {
    setVocabSrsData((prev) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const updated = {
        ...prev,
        [id]: {
          box: 1,
          nextReviewDate: tomorrow.toISOString().split('T')[0],
          streak: 0,
        },
      };
      localStorage.setItem(`edu10_vocab_srs_${currentUser.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const getVocabBox = (id: string): number => {
    return vocabSrsData[id]?.box || 1;
  };

  // Background midnight auto-check (12h đêm / 00:00)
  useEffect(() => {
    const checkMidnightSync = () => {
      const cfg = getStoredDailyVocabConfig();
      if (shouldRunDailyVocabImport(cfg)) {
        triggerDailyVocabImport(false).catch((e) =>
          console.error('Daily vocab auto-sync error:', e)
        );
      }
    };

    checkMidnightSync();
    const interval = setInterval(checkMidnightSync, 60 * 1000);
    return () => clearInterval(interval);
  }, [dailyVocabConfig]);

  // Compute Live Analytics (Memoized for peak performance, filtered by current subject)
  const analytics = useMemo(() => {
    let totalSolved = 0;
    let totalCorrect = 0;
    const topicStats: Record<string, { solved: number; correct: number; accuracy: number }> = {};

    // Filter attempts and sessions by current subject
    const filteredAttempts = examAttempts.filter(
      (a) => (a.subject || 'english') === currentSubject
    );
    const filteredSessions = practiceSessions.filter(
      (s) => (s.subject || 'english') === currentSubject
    );

    filteredAttempts.forEach((attempt) => {
      if (attempt && attempt.userAnswers && typeof attempt.userAnswers === 'object') {
        Object.entries(attempt.userAnswers).forEach(([qId, ans]) => {
          const q = getQuestionById(qId);
          if (q && (q.subject || 'english') === currentSubject) {
            totalSolved += 1;
            const isRight = ans === q.correctOption;
            if (isRight) totalCorrect += 1;
            if (!topicStats[q.topicId]) {
              topicStats[q.topicId] = { solved: 0, correct: 0, accuracy: 0 };
            }
            topicStats[q.topicId].solved += 1;
            if (isRight) topicStats[q.topicId].correct += 1;
          }
        });
      }
    });

    filteredSessions.forEach((session) => {
      if (session && session.userAnswers && typeof session.userAnswers === 'object') {
        Object.entries(session.userAnswers).forEach(([qId, ans]) => {
          const q = getQuestionById(qId);
          if (q && (q.subject || 'english') === currentSubject) {
            totalSolved += 1;
            const isRight = ans === q.correctOption;
            if (isRight) totalCorrect += 1;
            if (!topicStats[q.topicId]) {
              topicStats[q.topicId] = { solved: 0, correct: 0, accuracy: 0 };
            }
            topicStats[q.topicId].solved += 1;
            if (isRight) topicStats[q.topicId].correct += 1;
          }
        });
      }
    });

    // Compute percentage for each topic
    Object.keys(topicStats).forEach((tId) => {
      const item = topicStats[tId];
      item.accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
    });

    const overallAccuracy =
      totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

    const averageExamScore =
      filteredAttempts.length > 0
        ? parseFloat(
            (filteredAttempts.reduce((acc, curr) => acc + curr.score, 0) / filteredAttempts.length).toFixed(2)
          )
        : 0;

    const activeMistakesCount = (Object.values(mistakes || {}) as MistakeItem[]).filter(
      (m) => !m.mastered && (m.subject || 'english') === currentSubject
    ).length;

    const penalty = Math.min(1.2, activeMistakesCount * 0.15);

    // If no attempts or solved questions yet, predicted grade 10 score is 0 (clean state)
    const predictedGrade10Score =
      filteredAttempts.length > 0 || totalSolved > 0
        ? Math.max(
            1.0,
            Math.min(10.0, parseFloat((averageExamScore * 0.9 + 0.8 - penalty * 0.4).toFixed(1)))
          )
        : 0;

    const topicArray = Object.keys(topicStats)
      .map((tId) => ({ topicId: tId as TopicId, ...topicStats[tId] }))
      .filter((t) => t.solved > 0);

    topicArray.sort((a, b) => a.accuracy - b.accuracy);
    const weakestTopics = topicArray.slice(0, 3).map((t) => t.topicId);
    const strongestTopics = [...topicArray].reverse().slice(0, 3).map((t) => t.topicId);

    const defaultWeakest: TopicId[] =
      currentSubject === 'math' ? ['math_pt_bac_hai_viet', 'math_duong_tron_tu_giac'] : ['grammar', 'sentence_rewrite'];
    const defaultStrongest: TopicId[] =
      currentSubject === 'math' ? ['math_can_thuc', 'math_he_thuc_luong'] : ['pronunciation', 'vocabulary'];

    return {
      totalSolved,
      totalCorrect,
      overallAccuracy,
      averageExamScore,
      predictedGrade10Score,
      topicStats,
      weakestTopics: weakestTopics.length > 0 ? weakestTopics : defaultWeakest,
      strongestTopics: strongestTopics.length > 0 ? strongestTopics : defaultStrongest,
      recentAttempts: filteredAttempts.slice(0, 5),
    };
  }, [examAttempts, practiceSessions, mistakes, currentSubject, allQuestions]);

  const getUserScopedData = (userId: string): UserScopedData => {
    if (userId === currentUser.id) {
      return {
        examAttempts: examAttempts || [],
        practiceSessions: practiceSessions || [],
        mistakes: mistakes || {},
        bookmarks: bookmarks || [],
      };
    }
    try {
      const stored = localStorage.getItem(`edu10_userdata_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          examAttempts: Array.isArray(parsed.examAttempts)
            ? parsed.examAttempts.filter((a: any) => a && a.id && !a.id.startsWith('attempt_demo_'))
            : [],
          practiceSessions: Array.isArray(parsed.practiceSessions) ? parsed.practiceSessions : [],
          mistakes: parsed.mistakes && typeof parsed.mistakes === 'object' ? parsed.mistakes : {},
          bookmarks: Array.isArray(parsed.bookmarks) ? parsed.bookmarks : [],
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      examAttempts: [],
      practiceSessions: [],
      mistakes: {},
      bookmarks: [],
    };
  };

  const saveTeacherNote = (userId: string, note: string) => {
    try {
      localStorage.setItem(`edu10_teachernote_${userId}`, note);
    } catch (e) {
      console.error(e);
    }
  };

  const getTeacherNote = (userId: string): string => {
    try {
      return localStorage.getItem(`edu10_teachernote_${userId}`) || '';
    } catch (e) {
      return '';
    }
  };

  const deleteTeacherNote = (userId: string) => {
    try {
      localStorage.removeItem(`edu10_teachernote_${userId}`);
    } catch (e) {
      console.error(e);
    }
  };

  const seedDemoProgress = () => {
    resetAllProgress();
  };

  const resetAllProgress = () => {
    setExamAttempts([]);
    setPracticeSessions([]);
    setMistakes({});
    setBookmarks([]);
    setCustomExams([]);
    setCustomQuestions([]);
    
    // Clear localStorage for user
    try {
      localStorage.removeItem(getUserDataKey(currentUser.id));
      localStorage.removeItem('edu10_custom_questions');
    } catch (_) {}

    // Reset online DB state to clean blank data
    clearOnlineStudentData(currentUser.id).catch((err) =>
      console.warn('DB clear error:', err)
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentSubject,
        switchSubject,
        currentUser,
        setCurrentUser,
        usersList,
        login,
        register,
        logout,
        switchUser,
        switchUserRole,
        updateUserByAdmin,
        deleteUser,
        updateUserTarget,
        updateUserProfile,
        toggleUserLock,
        getUserScopedData,
        saveTeacherNote,
        getTeacherNote,
        deleteTeacherNote,
        questions: allQuestions,
        getQuestionById,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        bulkImportQuestions,
        exams: allExams,
        getExamById,
        addExam,
        updateExam,
        deleteExam,
        examAttempts,
        saveExamAttempt,
        deleteExamAttempt,
        practiceSessions,
        savePracticeSession,
        mistakes,
        recordAnswerResult,
        toggleMistakeMastered,
        updateMistakeNote,
        updateMistakeReason,
        removeMistake,
        clearMasteredMistakes,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        vocabularyWords,
        dailyVocabConfig,
        learnedVocabIds,
        masteredVocabIds,
        starredVocabIds,
        vocabSrsData,
        promoteVocabSrs,
        demoteVocabSrs,
        getVocabBox,
        addVocabularyWord,
        updateVocabularyWord,
        deleteVocabularyWord,
        bulkImportVocabularyWords,
        triggerDailyVocabImport,
        updateDailyVocabConfig,
        toggleVocabLearned,
        toggleVocabMastered,
        toggleVocabStarred,
        themeMode,
        setThemeMode,
        analytics,
        seedDemoProgress,
        resetAllProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

