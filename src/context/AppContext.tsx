import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Question,
  Exam,
  ExamAttempt,
  PracticeSession,
  MistakeItem,
  UserAccount,
  TopicId,
  SubjectId,
} from '../types';
import { QUESTIONS_DATA } from '../data/questionsData';
import { EXAMS_DATA } from '../data/examsData';
import { MATH_QUESTIONS_DATA } from '../data/mathQuestionsData';
import { MATH_EXAMS_DATA } from '../data/mathExamsData';
import { logAndBroadcastActivity, deleteRemoteTasksByExamId } from '../services/realtimeSyncService';
import {
  pushUserDataToOnlineDB,
  fetchRoomDataFromOnlineDB,
  saveExamToOnlineDB,
  deleteExamFromOnlineDB,
  subscribeToExamsFromOnlineDB,
  saveQuestionToOnlineDB,
  saveQuestionsToOnlineDB,
  deleteQuestionFromOnlineDB,
  subscribeToQuestionsFromOnlineDB,
  saveExamAttemptToOnlineDB,
  subscribeToStudentData,
  subscribeToRoomData,
  clearOnlineStudentData,
  syncDeletedIdToOnlineDB,
  subscribeToDeletedIdsFromOnlineDB,
} from '../services/cloudSyncService';
import {
  setCookie,
  getCookie,
  dispatchGlobalSync,
  subscribeToGlobalSync,
} from '../services/cookieService';

interface UserScopedData {
  examAttempts: ExamAttempt[];
  practiceSessions: PracticeSession[];
  mistakes: Record<string, MistakeItem>;
  bookmarks: string[];
  customExams: Exam[];
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

  // Exam Attempts & Practice Sessions (Per User - Synced to DB)
  examAttempts: ExamAttempt[];
  saveExamAttempt: (attempt: Omit<ExamAttempt, 'id'>) => ExamAttempt;
  practiceSessions: PracticeSession[];
  savePracticeSession: (session: Omit<PracticeSession, 'id'>) => PracticeSession;

  // Mistake Notebook (Per User)
  mistakes: Record<string, MistakeItem>;
  recordAnswerResult: (questionId: string, isCorrect: boolean) => void;
  toggleMistakeMastered: (questionId: string) => void;
  removeMistake: (questionId: string) => void;
  clearMasteredMistakes: () => void;

  // Bookmarks (Per User)
  bookmarks: string[]; // question IDs
  toggleBookmark: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;

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

  // Teacher / Admin Helpers
  getUserScopedData: (userId: string) => UserScopedData;
  saveTeacherNote: (userId: string, note: string) => void;
  getTeacherNote: (userId: string) => string;

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
    customExams: [],
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
        return parsed;
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_DEMO_DATA[userId] || {
      examAttempts: [],
      practiceSessions: [],
      mistakes: {},
      bookmarks: [],
      customExams: [],
    };
  };

  // Active User Data States
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => loadUserData(currentUser.id).examAttempts || []);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(() => loadUserData(currentUser.id).practiceSessions || []);
  const [mistakes, setMistakes] = useState<Record<string, MistakeItem>>(() => loadUserData(currentUser.id).mistakes || {});
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadUserData(currentUser.id).bookmarks || []);
  const [customExams, setCustomExams] = useState<Exam[]>(() => loadUserData(currentUser.id).customExams || []);

  // Local ref to prevent synchronization feedback loops when loading/syncing from cloud
  const lastSyncedDataRef = useRef<string>('');
  if (!lastSyncedDataRef.current) {
    const initialData = loadUserData(currentUser.id);
    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: initialData.examAttempts || [],
      practiceSessions: initialData.practiceSessions || [],
      mistakes: initialData.mistakes || {},
      bookmarks: initialData.bookmarks || [],
      customExams: initialData.customExams || [],
    });
  }

  // Global custom exams created on this device (so all user accounts can see/run them)
  const [globalCustomExams, setGlobalCustomExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('edu10_global_custom_exams');
    return saved ? JSON.parse(saved) : [];
  });

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

  // Base Question Bank (English + Math + Custom) - Filtered by deleted blacklist
  const deletedQSet = new Set(deletedQuestionIds);
  const allQuestions: Question[] = [
    ...QUESTIONS_DATA.map((q) => ({ ...q, subject: 'english' as SubjectId })),
    ...MATH_QUESTIONS_DATA.map((q) => ({ ...q, subject: 'math' as SubjectId })),
    ...customQuestions,
  ].filter((q) => !deletedQSet.has(q.id));

  // Base Exam Bank (English + Math + Global Custom + User Custom + DB-synced) - Filtered by deleted blacklist
  const deletedESet = new Set(deletedExamIds);
  const allExamsMap = new Map<string, Exam>();
  [
    ...EXAMS_DATA.map((e) => ({ ...e, subject: 'english' as SubjectId })),
    ...MATH_EXAMS_DATA.map((e) => ({ ...e, subject: 'math' as SubjectId })),
    ...globalCustomExams,
    ...customExams,
    ...dbExams,
  ].forEach((e) => {
    if (!deletedESet.has(e.id)) {
      allExamsMap.set(e.id, e);
    }
  });
  const allExams: Exam[] = Array.from(allExamsMap.values());

  // Subscribe to Firebase DB in real-time for Exams, Questions, Deleted IDs, and Student Data
  useEffect(() => {
    // 1. Subscribe to Exams on DB
    const unsubExams = subscribeToExamsFromOnlineDB((cloudExams) => {
      if (cloudExams && Array.isArray(cloudExams)) {
        setDbExams(cloudExams);
      }
    });

    // 2. Subscribe to Custom Questions on DB
    const unsubQuestions = subscribeToQuestionsFromOnlineDB((cloudQuestions) => {
      if (cloudQuestions && Array.isArray(cloudQuestions)) {
        setCustomQuestions(cloudQuestions);
        try {
          localStorage.setItem('edu10_custom_questions', JSON.stringify(cloudQuestions));
        } catch (_) {}
      }
    });

    // 3. Subscribe to Deleted IDs on DB
    const unsubDeleted = subscribeToDeletedIdsFromOnlineDB((delData) => {
      if (delData.deletedExamIds && delData.deletedExamIds.length > 0) {
        setDeletedExamIds((prev) => {
          const merged = Array.from(new Set([...prev, ...delData.deletedExamIds]));
          try {
            localStorage.setItem('edu10_deleted_exam_ids', JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
      if (delData.deletedQuestionIds && delData.deletedQuestionIds.length > 0) {
        setDeletedQuestionIds((prev) => {
          const merged = Array.from(new Set([...prev, ...delData.deletedQuestionIds]));
          try {
            localStorage.setItem('edu10_deleted_question_ids', JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    });

    return () => {
      unsubExams();
      unsubQuestions();
      unsubDeleted();
    };
  }, []);

  // Helper to update state from cloud sync payload
  const updateStatesFromCloud = (uData: any) => {
    if (!uData) return;

    // Pre-serialize matching payload to update the ref and prevent feedback loop pushes
    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: uData.examAttempts || [],
      practiceSessions: uData.practiceSessions || [],
      mistakes: uData.mistakes || {},
      bookmarks: uData.bookmarks || [],
      customExams: uData.customExams || [],
    });

    if (Array.isArray(uData.examAttempts)) {
      // Filter out legacy mock data if any
      const cleanAttempts = uData.examAttempts.filter(
        (a: any) => a.id && !a.id.startsWith('attempt_demo_')
      );
      setExamAttempts(cleanAttempts);
    }
    if (Array.isArray(uData.practiceSessions)) {
      setPracticeSessions(uData.practiceSessions);
    }
    if (uData.mistakes && typeof uData.mistakes === 'object') {
      setMistakes(uData.mistakes);
    }
    if (Array.isArray(uData.bookmarks)) {
      setBookmarks(uData.bookmarks);
    }
    if (Array.isArray(uData.customExams)) {
      setCustomExams(uData.customExams);
    }
  };

  // Subscribe to Student Data on DB for active currentUser
  useEffect(() => {
    const unsubStudent = subscribeToStudentData(currentUser.id, (cloudPayload) => {
      if (cloudPayload && cloudPayload.userData) {
        updateStatesFromCloud(cloudPayload.userData);
      }
    });

    return () => unsubStudent();
  }, [currentUser.id]);

  // Subscribe to real-time room data for ALL students (so Admin sees live submissions from any student on any device)
  useEffect(() => {
    const unsubRoom = subscribeToRoomData((studentsPayload) => {
      if (studentsPayload && typeof studentsPayload === 'object') {
        Object.entries(studentsPayload).forEach(([stuId, payload]: [string, any]) => {
          if (payload && payload.userData) {
            try {
              localStorage.setItem(getUserDataKey(stuId), JSON.stringify(payload.userData));
            } catch (_) {}
            if (stuId === currentUser.id) {
              updateStatesFromCloud(payload.userData);
            }
          }
        });
      }
    });

    return () => unsubRoom();
  }, [currentUser.id]);

  // Global Sync Listener for Cross-Tab & Cross-Component Reactivity without page reload
  useEffect(() => {
    const unsub = subscribeToGlobalSync((event) => {
      if (event.type === 'EXAMS_UPDATED') {
        const savedGlobal = localStorage.getItem('edu10_global_custom_exams');
        if (savedGlobal) {
          try {
            setGlobalCustomExams(JSON.parse(savedGlobal));
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
            customExams: uData.customExams || [],
          });

          setExamAttempts(uData.examAttempts || []);
          setPracticeSessions(uData.practiceSessions || []);
          setMistakes(uData.mistakes || {});
          setBookmarks(uData.bookmarks || []);
          setCustomExams(uData.customExams || []);
        }
      }
    });

    return () => unsub();
  }, [currentUser.id]);

  // Flag to avoid pushing initial empty/stale state over cloud DB right on initial mount
  const hasMountedRef = useRef(false);

  // Sync user data to localStorage and Online Cloud DB on user changes
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const currentSerialized = JSON.stringify({
      examAttempts,
      practiceSessions,
      mistakes,
      bookmarks,
      customExams,
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
      customExams,
    };
    localStorage.setItem(getUserDataKey(currentUser.id), JSON.stringify(userData));
    // Automatically push to Online Cloud DB
    pushUserDataToOnlineDB(currentUser.id, userData, currentUser);
  }, [examAttempts, practiceSessions, mistakes, bookmarks, customExams, currentUser.id]);

  // Periodic Cloud DB fetch polling for multi-device sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetchRoomDataFromOnlineDB();
      } catch (e) {}
    }, 15000);

    return () => clearInterval(interval);
  }, []);

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

    // Load target user's data
    const uData = loadUserData(target.id);

    lastSyncedDataRef.current = JSON.stringify({
      examAttempts: uData.examAttempts || [],
      practiceSessions: uData.practiceSessions || [],
      mistakes: uData.mistakes || {},
      bookmarks: uData.bookmarks || [],
      customExams: uData.customExams || [],
    });

    setExamAttempts(uData.examAttempts || []);
    setPracticeSessions(uData.practiceSessions || []);
    setMistakes(uData.mistakes || {});
    setBookmarks(uData.bookmarks || []);
    setCustomExams(uData.customExams || []);

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
  };

  const toggleUserLock = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: !u.isLocked } : u))
    );
  };

  // Questions
  const getQuestionById = (id: string) => allQuestions.find((q) => q.id === id);

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
      return [newExam, ...filtered];
    });
    setGlobalCustomExams((prev) => {
      const filtered = prev.filter((item) => item.id !== newExam.id);
      const updated = [newExam, ...filtered];
      localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
      return updated;
    });
    // Immediately persist to Firebase Realtime Database
    saveExamToOnlineDB(newExam).catch((err) => console.warn('DB Exam save error:', err));
    dispatchGlobalSync('EXAMS_UPDATED');
    return newExam;
  };

  const updateExam = (id: string, e: Partial<Exam>) => {
    setCustomExams((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...e } : item));
      const target = updated.find((item) => item.id === id);
      if (target) {
        saveExamToOnlineDB(target).catch((err) => console.warn('DB Exam update error:', err));
      }
      return updated;
    });
    setGlobalCustomExams((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...e } : item));
      localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
      return updated;
    });
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
    // 2. Remove from local states
    setCustomExams((prev) => prev.filter((item) => item.id !== id));
    setGlobalCustomExams((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      localStorage.setItem('edu10_global_custom_exams', JSON.stringify(updated));
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
    logAndBroadcastActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      subject: attempt.subject || currentSubject,
      type: 'exam_submitted',
      title: `Vừa hoàn thành bài thi ${attempt.subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
      detail: `Đạt ${newAttempt.score.toFixed(2)}/10đ (${newAttempt.correctCount}/${newAttempt.totalQuestions} câu đúng) • ${attempt.examTitle}`,
      score: newAttempt.score,
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
      const wrongCountMap: Record<string, number> = {};
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
          wrongCountMap[qSubj] = (wrongCountMap[qSubj] || 0) + 1;
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

      // Log consolidated activity events for wrong answers
      Object.entries(wrongCountMap).forEach(([subj, count]) => {
        if (count > 0) {
          logAndBroadcastActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            avatarColor: currentUser.avatarColor,
            subject: subj as SubjectId,
            type: 'question_wrong',
            title: `Làm sai ${count} câu hỏi ${subj === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
            detail: `Lịch sử vừa ghi nhận thêm ${count} lỗi sai mới vào sổ tay ôn tập.`,
            topicName: 'general',
          });
        }
      });

      return hasChanges ? nextMistakes : prev;
    });
  };

  // Mistake Notebook
  const recordAnswerResult = (questionId: string, isCorrect: boolean) => {
    const q = getQuestionById(questionId);
    const qSubj = q?.subject || currentSubject;

    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!isCorrect) {
        if (q) {
          logAndBroadcastActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            avatarColor: currentUser.avatarColor,
            subject: qSubj,
            type: 'question_wrong',
            title: `Làm sai câu hỏi ${qSubj === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
            detail: `Chuyên đề: ${q.topicId.replace('math_', '').replace(/_/g, ' ')}`,
            topicName: q.topicId,
          });
        }

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
          },
        };
      }
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
        examAttempts,
        practiceSessions,
        mistakes,
        bookmarks,
        customExams,
      };
    }
    try {
      const stored = localStorage.getItem(`edu10_userdata_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      examAttempts: [],
      practiceSessions: [],
      mistakes: {},
      bookmarks: [],
      customExams: [],
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
        updateUserTarget,
        updateUserProfile,
        toggleUserLock,
        getUserScopedData,
        saveTeacherNote,
        getTeacherNote,
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
        practiceSessions,
        savePracticeSession,
        mistakes,
        recordAnswerResult,
        toggleMistakeMastered,
        removeMistake,
        clearMasteredMistakes,
        bookmarks,
        toggleBookmark,
        isBookmarked,
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

