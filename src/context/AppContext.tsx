import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { logAndBroadcastActivity } from '../services/realtimeSyncService';
import { pushUserDataToOnlineDB, fetchRoomDataFromOnlineDB } from '../services/cloudSyncService';

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
  addQuestion: (q: Omit<Question, 'id'>) => Question;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  bulkImportQuestions: (newQuestions: (Question | Omit<Question, 'id'>)[]) => number;

  // Exams (combined official + math + user-created)
  exams: Exam[];
  getExamById: (id: string) => Exam | undefined;
  addExam: (e: Omit<Exam, 'id' | 'createdAt'> & { id?: string }) => Exam;
  updateExam: (id: string, e: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Exam Attempts & Practice Sessions (Per User)
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
    streakDays: 7,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-indigo-600',
    createdAt: '2026-08-01',
  },
  {
    id: 'user_student_2',
    name: 'Lê Phương Linh',
    email: 'phuonglinh.ams@gmail.com',
    password: '123',
    role: 'student',
    targetScore: 9.25,
    targetScoreEnglish: 9.5,
    targetScoreMath: 9.0,
    targetSchool: 'THPT Chuyên Hà Nội - Amsterdam',
    streakDays: 14,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-rose-600',
    createdAt: '2026-08-05',
  },
  {
    id: 'user_student_3',
    name: 'Trần Quang Huy',
    email: 'quanghuy.kimlien@gmail.com',
    password: '123',
    role: 'student',
    targetScore: 8.0,
    targetScoreEnglish: 8.0,
    targetScoreMath: 8.5,
    targetSchool: 'THPT Kim Liên',
    streakDays: 5,
    lastActiveDate: new Date(Date.now() - 86400000).toISOString(),
    avatarColor: 'bg-amber-600',
    createdAt: '2026-08-08',
  },
  {
    id: 'user_student_4',
    name: 'Vũ Thu Trang',
    email: 'thutrang.vietduc@gmail.com',
    password: '123',
    role: 'student',
    targetScore: 7.75,
    targetScoreEnglish: 7.5,
    targetScoreMath: 8.0,
    targetSchool: 'THPT Việt Đức',
    streakDays: 3,
    lastActiveDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    avatarColor: 'bg-teal-600',
    createdAt: '2026-08-10',
  },
  {
    id: 'user_student_5',
    name: 'Đặng Gia Bảo',
    email: 'giabao.thanglong@gmail.com',
    password: '123',
    role: 'student',
    targetScore: 8.75,
    targetScoreEnglish: 8.5,
    targetScoreMath: 9.0,
    targetSchool: 'THPT Thăng Long',
    streakDays: 9,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-purple-600',
    createdAt: '2026-08-12',
  },
  {
    id: 'user_admin_1',
    name: 'Thầy Tuấn (Quản trị viên / GVCN)',
    email: 'admin.edulop10@edu.vn',
    password: 'admin',
    role: 'admin',
    targetScore: 10,
    targetScoreEnglish: 10,
    targetScoreMath: 10,
    targetSchool: 'Hệ thống Quản trị EduVao10',
    streakDays: 45,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-emerald-600',
    createdAt: '2026-07-01',
  },
];

const INITIAL_DEMO_DATA: Record<string, UserScopedData> = {
  user_student_1: {
    examAttempts: [
      {
        id: 'attempt_demo_1',
        userId: 'user_student_1',
        subject: 'english',
        examId: 'exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        score: 7.75,
        score100: 77.5,
        correctCount: 16,
        incorrectCount: 4,
        unattemptedCount: 0,
        totalQuestions: 20,
        timeSpentSeconds: 2450,
        userAnswers: {
          q_pron_01: 3,
          q_pron_02: 3,
          q_pron_03: 0,
          q_stress_01: 2,
          q_stress_02: 2,
          q_gram_01: 1,
          q_gram_02: 0,
          q_gram_03: 0,
          q_pass_01: 1,
          q_cond_01: 0,
          q_cond_02: 2,
          q_cond_04: 0,
          q_rel_01: 0,
          q_rel_02: 0,
          q_rep_01: 1,
          q_voc_01: 0,
          q_rew_01: 0,
          q_rew_02: 0,
          q_err_01: 1,
          q_cloze_01: 0,
        },
        flaggedQuestions: ['q_gram_03', 'q_rel_02'],
      },
      {
        id: 'attempt_demo_math_1',
        userId: 'user_student_1',
        subject: 'math',
        examId: 'math_exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán - Đề Chuẩn Số 01 (Sở GD&ĐT)',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 8.5,
        score100: 85,
        correctCount: 10,
        incorrectCount: 2,
        unattemptedCount: 0,
        totalQuestions: 12,
        timeSpentSeconds: 2980,
        userAnswers: {
          q_math_can_01: 0,
          q_math_can_02: 0,
          q_math_can_03: 0,
          q_math_he_01: 0,
          q_math_ham_01: 0,
          q_math_ham_02: 0,
          q_math_viet_01: 0,
          q_math_lap_pt_01: 0,
          q_math_he_thuc_01: 0,
          q_math_tron_01: 0,
          q_math_kg_01: 1,
          q_math_bdt_01: 1,
        },
        flaggedQuestions: ['q_math_bdt_01'],
      },
      {
        id: 'attempt_demo_2',
        userId: 'user_student_1',
        subject: 'english',
        examId: 'exam_speed_sprint_03',
        examTitle: 'Đề Luyện Tốc Độ 30 Phút - Bứt Phá Ngữ Âm & Từ Vựng',
        date: new Date(Date.now() - 86400000).toISOString(),
        score: 8.5,
        score100: 85,
        correctCount: 10,
        incorrectCount: 2,
        unattemptedCount: 0,
        totalQuestions: 12,
        timeSpentSeconds: 1120,
        userAnswers: {
          q_pron_01: 3,
          q_pron_02: 3,
          q_pron_03: 2,
          q_stress_01: 2,
          q_stress_02: 2,
          q_stress_03: 1,
          q_voc_01: 0,
          q_voc_02: 1,
          q_voc_03: 1,
          q_voc_04: 2,
          q_voc_05: 0,
          q_voc_06: 0,
        },
        flaggedQuestions: ['q_voc_04'],
      },
    ],
    practiceSessions: [],
    mistakes: {
      q_pron_03: {
        questionId: 'q_pron_03',
        subject: 'english',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Nhớ gốc từ Hy Lạp đọc là /k/ (chemical, Christmas), chỉ có champion đọc /tʃ/.',
      },
      q_gram_03: {
        questionId: 'q_gram_03',
        subject: 'english',
        wrongCount: 1,
        lastAttemptDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Mệnh đề thời gian với as soon as không dùng will!',
      },
      q_rel_02: {
        questionId: 'q_rel_02',
        subject: 'english',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Sau dấu phẩy cấm kỵ dùng THAT. Có động từ IS phía sau nên phải dùng WHICH.',
      },
      q_math_bdt_01: {
        questionId: 'q_math_bdt_01',
        subject: 'math',
        wrongCount: 1,
        lastAttemptDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Áp dụng Cauchy cho x và 9/x: Min = 2√(x . 9/x) = 6 khi x = 3.',
      },
      q_math_kg_01: {
        questionId: 'q_math_kg_01',
        subject: 'math',
        wrongCount: 1,
        lastAttemptDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Đường sinh hình nón l = √(r² + h²) = √(3² + 4²) = 5cm.',
      },
    },
    bookmarks: ['q_rel_02', 'q_math_viet_02', 'q_math_bdt_01'],
    customExams: [],
  },
  user_student_2: {
    examAttempts: [
      {
        id: 'attempt_linh_1',
        userId: 'user_student_2',
        subject: 'english',
        examId: 'exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
        date: new Date(Date.now() - 86400000).toISOString(),
        score: 9.5,
        score100: 95,
        correctCount: 19,
        incorrectCount: 1,
        unattemptedCount: 0,
        totalQuestions: 20,
        timeSpentSeconds: 2100,
        userAnswers: {},
        flaggedQuestions: [],
      },
      {
        id: 'attempt_linh_math_1',
        userId: 'user_student_2',
        subject: 'math',
        examId: 'math_exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán - Đề Chuẩn Số 01 (Sở GD&ĐT)',
        date: new Date().toISOString(),
        score: 9.25,
        score100: 92.5,
        correctCount: 11,
        incorrectCount: 1,
        unattemptedCount: 0,
        totalQuestions: 12,
        timeSpentSeconds: 2700,
        userAnswers: {},
        flaggedQuestions: [],
      },
    ],
    practiceSessions: [],
    mistakes: {
      q_math_bdt_01: {
        questionId: 'q_math_bdt_01',
        subject: 'math',
        wrongCount: 1,
        lastAttemptDate: new Date().toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
      },
    },
    bookmarks: ['q_math_bdt_01'],
    customExams: [],
  },
  user_student_3: {
    examAttempts: [
      {
        id: 'attempt_huy_1',
        userId: 'user_student_3',
        subject: 'math',
        examId: 'math_exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán - Đề Chuẩn Số 01 (Sở GD&ĐT)',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 8.25,
        score100: 82.5,
        correctCount: 10,
        incorrectCount: 2,
        unattemptedCount: 0,
        totalQuestions: 12,
        timeSpentSeconds: 3100,
        userAnswers: {},
        flaggedQuestions: [],
      },
      {
        id: 'attempt_huy_eng_1',
        userId: 'user_student_3',
        subject: 'english',
        examId: 'exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
        date: new Date(Date.now() - 86400000).toISOString(),
        score: 7.5,
        score100: 75,
        correctCount: 15,
        incorrectCount: 5,
        unattemptedCount: 0,
        totalQuestions: 20,
        timeSpentSeconds: 2600,
        userAnswers: {},
        flaggedQuestions: [],
      },
    ],
    practiceSessions: [],
    mistakes: {
      q_rew_01: {
        questionId: 'q_rew_01',
        subject: 'english',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
      },
    },
    bookmarks: [],
    customExams: [],
  },
  user_student_4: {
    examAttempts: [
      {
        id: 'attempt_trang_1',
        userId: 'user_student_4',
        subject: 'english',
        examId: 'exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        score: 7.25,
        score100: 72.5,
        correctCount: 14,
        incorrectCount: 6,
        unattemptedCount: 0,
        totalQuestions: 20,
        timeSpentSeconds: 2750,
        userAnswers: {},
        flaggedQuestions: [],
      },
      {
        id: 'attempt_trang_math_1',
        userId: 'user_student_4',
        subject: 'math',
        examId: 'math_exam_speed_sprint_02',
        examTitle: 'Đề Luyện Tốc Độ 30 Phút - Đại Số & Hình Học Cơ Bản',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
        score: 7.75,
        score100: 77.5,
        correctCount: 6,
        incorrectCount: 2,
        unattemptedCount: 0,
        totalQuestions: 8,
        timeSpentSeconds: 1650,
        userAnswers: {},
        flaggedQuestions: [],
      },
    ],
    practiceSessions: [],
    mistakes: {
      q_cond_02: {
        questionId: 'q_cond_02',
        subject: 'english',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
      },
    },
    bookmarks: [],
    customExams: [],
  },
  user_student_5: {
    examAttempts: [
      {
        id: 'attempt_bao_1',
        userId: 'user_student_5',
        subject: 'math',
        examId: 'math_exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán - Đề Chuẩn Số 01 (Sở GD&ĐT)',
        date: new Date(Date.now() - 86400000).toISOString(),
        score: 9.0,
        score100: 90,
        correctCount: 11,
        incorrectCount: 1,
        unattemptedCount: 0,
        totalQuestions: 12,
        timeSpentSeconds: 2850,
        userAnswers: {},
        flaggedQuestions: [],
      },
      {
        id: 'attempt_bao_eng_1',
        userId: 'user_student_5',
        subject: 'english',
        examId: 'exam_official_01',
        examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
        date: new Date().toISOString(),
        score: 8.5,
        score100: 85,
        correctCount: 17,
        incorrectCount: 3,
        unattemptedCount: 0,
        totalQuestions: 20,
        timeSpentSeconds: 2350,
        userAnswers: {},
        flaggedQuestions: [],
      },
    ],
    practiceSessions: [],
    mistakes: {},
    bookmarks: [],
    customExams: [],
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current Subject state
  const [currentSubject, setCurrentSubject] = useState<SubjectId>(() => {
    const saved = localStorage.getItem('edu10_current_subject');
    return (saved as SubjectId) || 'english';
  });

  const switchSubject = (subj: SubjectId) => {
    setCurrentSubject(subj);
    localStorage.setItem('edu10_current_subject', subj);
  };

  // 2. Users state
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('edu10_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('edu10_currentUser');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  // 3. User Scoped Data Helper
  const getUserDataKey = (userId: string) => `edu10_userdata_${userId}`;

  const loadUserData = (userId: string): UserScopedData => {
    const raw = localStorage.getItem(getUserDataKey(userId));
    if (raw) {
      try {
        return JSON.parse(raw);
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
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => loadUserData(currentUser.id).examAttempts);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(() => loadUserData(currentUser.id).practiceSessions);
  const [mistakes, setMistakes] = useState<Record<string, MistakeItem>>(() => loadUserData(currentUser.id).mistakes);
  const [bookmarks, setBookmarks] = useState<string[]>(() => loadUserData(currentUser.id).bookmarks);
  const [customExams, setCustomExams] = useState<Exam[]>(() => loadUserData(currentUser.id).customExams);

  // Custom User Questions
  const [customQuestions, setCustomQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('edu10_custom_questions');
    return saved ? JSON.parse(saved) : [];
  });

  // Base Question Bank (English + Math + Custom)
  const allQuestions: Question[] = [
    ...QUESTIONS_DATA.map((q) => ({ ...q, subject: 'english' as SubjectId })),
    ...MATH_QUESTIONS_DATA.map((q) => ({ ...q, subject: 'math' as SubjectId })),
    ...customQuestions,
  ];

  // Base Exam Bank (English + Math + Custom)
  const allExams: Exam[] = [
    ...EXAMS_DATA.map((e) => ({ ...e, subject: 'english' as SubjectId })),
    ...MATH_EXAMS_DATA.map((e) => ({ ...e, subject: 'math' as SubjectId })),
    ...customExams,
  ];

  // Sync user data to localStorage and Online Cloud DB on changes
  useEffect(() => {
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
  const login = (email: string, password?: string): { success: boolean; message?: string } => {
    const cleanEmail = email.trim().toLowerCase();
    const user = usersList.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Email này chưa được đăng ký trong hệ thống.' };
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
      streakDays: 1,
      lastActiveDate: new Date().toISOString(),
      avatarColor: 'bg-emerald-600',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsersList((prev) => [newUser, ...prev]);
    switchUser(newUser.id, newUser);
    return { success: true, message: 'Đăng ký tài khoản mới thành công!' };
  };

  const logout = () => {
    // Revert to demo student 1 or guest
    switchUser(DEFAULT_USERS[0].id);
  };

  const switchUser = (userId: string, directUserObj?: UserAccount) => {
    const target = directUserObj || usersList.find((u) => u.id === userId) || DEFAULT_USERS[0];
    setCurrentUser(target);

    // Load target user's data
    const uData = loadUserData(target.id);
    setExamAttempts(uData.examAttempts || []);
    setPracticeSessions(uData.practiceSessions || []);
    setMistakes(uData.mistakes || {});
    setBookmarks(uData.bookmarks || []);
    setCustomExams(uData.customExams || []);
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
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const updateUserProfile = (data: Partial<UserAccount>) => {
    const updated: UserAccount = { ...currentUser, ...data };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const toggleUserLock = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: !u.isLocked } : u))
    );
  };

  // Questions
  const getQuestionById = (id: string) => allQuestions.find((q) => q.id === id);

  const addQuestion = (q: Omit<Question, 'id'>): Question => {
    const newQ: Question = {
      ...q,
      subject: q.subject || currentSubject,
      id: `q_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setCustomQuestions((prev) => [newQ, ...prev]);
    return newQ;
  };

  const updateQuestion = (id: string, q: Partial<Question>) => {
    setCustomQuestions((prev) => prev.map((item) => (item.id === id ? { ...item, ...q } : item)));
  };

  const deleteQuestion = (id: string) => {
    setCustomQuestions((prev) => prev.filter((item) => item.id !== id));
    removeMistake(id);
    setBookmarks((prev) => prev.filter((bId) => bId !== id));
  };

  const bulkImportQuestions = (newQuestions: (Question | Omit<Question, 'id'>)[]): number => {
    const formatted: Question[] = newQuestions.map((q: any, idx) => ({
      ...q,
      subject: q.subject || currentSubject,
      id: q.id || `q_import_${Date.now()}_${idx}`,
    }));
    setCustomQuestions((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = formatted.filter((f) => !existingIds.has(f.id));
      return [...toAdd, ...prev];
    });
    return formatted.length;
  };

  // Exams
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
    return newExam;
  };

  const updateExam = (id: string, e: Partial<Exam>) => {
    setCustomExams((prev) => prev.map((item) => (item.id === id ? { ...item, ...e } : item)));
  };

  const deleteExam = (id: string) => {
    setCustomExams((prev) => prev.filter((item) => item.id !== id));
  };

  // Attempts & Practice
  const saveExamAttempt = (attempt: Omit<ExamAttempt, 'id'>): ExamAttempt => {
    const newAttempt: ExamAttempt = {
      ...attempt,
      userId: currentUser.id,
      subject: attempt.subject || currentSubject,
      id: `attempt_${Date.now()}`,
    };
    setExamAttempts((prev) => [newAttempt, ...prev]);

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

    // Automatically record mistakes
    Object.entries(attempt.userAnswers).forEach(([qId, chosenOpt]) => {
      const q = getQuestionById(qId);
      if (q) {
        const isCorrect = chosenOpt === q.correctOption;
        recordAnswerResult(qId, isCorrect);
      }
    });

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

    Object.entries(session.userAnswers).forEach(([qId, chosenOpt]) => {
      const q = getQuestionById(qId);
      if (q) {
        const isCorrect = chosenOpt === q.correctOption;
        recordAnswerResult(qId, isCorrect);
      }
    });

    return newSession;
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
      return {
        ...prev,
        [questionId]: {
          ...existing,
          mastered: !existing.mastered,
          consecutiveCorrect: !existing.mastered ? 2 : 0,
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

  // Compute Live Analytics (Filtered by current subject)
  const computeAnalytics = () => {
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
    });

    filteredSessions.forEach((session) => {
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
    });

    Object.keys(topicStats).forEach((tId) => {
      const item = topicStats[tId];
      item.accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
    });

    const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 80;
    const averageExamScore =
      filteredAttempts.length > 0
        ? parseFloat(
            (filteredAttempts.reduce((acc, curr) => acc + curr.score, 0) / filteredAttempts.length).toFixed(2)
          )
        : 8.2;

    const activeMistakesCount = Object.values(mistakes).filter(
      (m) => !m.mastered && (m.subject || 'english') === currentSubject
    ).length;

    const penalty = Math.min(1.2, activeMistakesCount * 0.15);
    const targetScore =
      currentSubject === 'math'
        ? currentUser.targetScoreMath || currentUser.targetScore
        : currentUser.targetScoreEnglish || currentUser.targetScore;

    const predictedGrade10Score = Math.max(
      5.0,
      Math.min(9.8, parseFloat((averageExamScore * 0.9 + 0.8 - penalty * 0.4).toFixed(1)))
    );

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
      totalSolved: totalSolved || (currentSubject === 'math' ? 24 : 32),
      totalCorrect: totalCorrect || (currentSubject === 'math' ? 20 : 26),
      overallAccuracy,
      averageExamScore,
      predictedGrade10Score,
      topicStats,
      weakestTopics: weakestTopics.length > 0 ? weakestTopics : defaultWeakest,
      strongestTopics: strongestTopics.length > 0 ? strongestTopics : defaultStrongest,
      recentAttempts: filteredAttempts.slice(0, 5),
    };
  };

  const getUserScopedData = (userId: string): UserScopedData => {
    try {
      const stored = localStorage.getItem(`edu10_userdata_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }
    if (INITIAL_DEMO_DATA[userId]) {
      return INITIAL_DEMO_DATA[userId];
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
    localStorage.clear();
    window.location.reload();
  };

  const resetAllProgress = () => {
    setExamAttempts([]);
    setPracticeSessions([]);
    setMistakes({});
    setBookmarks([]);
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
        analytics: computeAnalytics(),
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
