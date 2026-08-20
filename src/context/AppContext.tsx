import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Question,
  Exam,
  ExamAttempt,
  PracticeSession,
  MistakeItem,
  UserAccount,
  TopicId,
  DifficultyLevel,
} from '../types';
import { QUESTIONS_DATA } from '../data/questionsData';
import { EXAMS_DATA } from '../data/examsData';

interface AppContextType {
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  switchUserRole: (role: 'student' | 'admin') => void;
  updateUserTarget: (targetScore: number, school: string) => void;
  usersList: UserAccount[];
  toggleUserLock: (userId: string) => void;

  // Questions
  questions: Question[];
  getQuestionById: (id: string) => Question | undefined;
  addQuestion: (q: Omit<Question, 'id'>) => Question;
  updateQuestion: (id: string, q: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  bulkImportQuestions: (newQuestions: Omit<Question, 'id'>[]) => number;

  // Exams
  exams: Exam[];
  getExamById: (id: string) => Exam | undefined;
  addExam: (e: Omit<Exam, 'id' | 'createdAt'>) => Exam;
  updateExam: (id: string, e: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Exam Attempts & Practice Sessions
  examAttempts: ExamAttempt[];
  saveExamAttempt: (attempt: Omit<ExamAttempt, 'id'>) => ExamAttempt;
  practiceSessions: PracticeSession[];
  savePracticeSession: (session: Omit<PracticeSession, 'id'>) => PracticeSession;

  // Mistake Notebook (Sổ câu sai)
  mistakes: Record<string, MistakeItem>;
  recordAnswerResult: (questionId: string, isCorrect: boolean) => void;
  toggleMistakeMastered: (questionId: string) => void;
  removeMistake: (questionId: string) => void;
  clearMasteredMistakes: () => void;

  // Bookmarks
  bookmarks: string[]; // question IDs
  toggleBookmark: (questionId: string) => void;
  isBookmarked: (questionId: string) => boolean;

  // Analytics & Stats
  analytics: {
    totalSolved: number;
    totalCorrect: number;
    overallAccuracy: number;
    averageExamScore: number;
    predictedGrade10Score: number;
    topicStats: Record<TopicId, { solved: number; correct: number; accuracy: number }>;
    weakestTopics: TopicId[];
    strongestTopics: TopicId[];
    recentAttempts: ExamAttempt[];
  };

  // Reset or seed sample demo data
  seedDemoProgress: () => void;
  resetAllProgress: () => void;
}

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user_student_1',
    name: 'Nguyễn Hoàng Minh',
    email: 'hoangminh.lop9@gmail.com',
    role: 'student',
    targetScore: 8.5,
    targetSchool: 'THPT Chu Văn An / THPT Kim Liên',
    streakDays: 7,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-indigo-600',
  },
  {
    id: 'user_admin_1',
    name: 'Thầy Tuấn (Quản trị viên)',
    email: 'admin.edulop10@edu.vn',
    role: 'admin',
    targetScore: 10,
    targetSchool: 'Hệ thống Quản trị EduEnglish 10',
    streakDays: 45,
    lastActiveDate: new Date().toISOString(),
    avatarColor: 'bg-emerald-600',
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Users state
  const [usersList, setUsersList] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('edu10_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const saved = localStorage.getItem('edu10_currentUser');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  // 2. Questions state
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('edu10_questions');
    return saved ? JSON.parse(saved) : QUESTIONS_DATA;
  });

  // 3. Exams state
  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem('edu10_exams');
    return saved ? JSON.parse(saved) : EXAMS_DATA;
  });

  // 4. Attempts & Practice state
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem('edu10_attempts');
    if (saved) return JSON.parse(saved);
    // Seed 2 realistic past attempts so the dashboard looks vibrant right away
    return [
      {
        id: 'attempt_demo_1',
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
          q_pron_03: 0, // wrong
          q_stress_01: 2,
          q_stress_02: 2,
          q_gram_01: 1,
          q_gram_02: 0,
          q_gram_03: 0, // wrong
          q_pass_01: 1,
          q_cond_01: 0,
          q_cond_02: 2,
          q_cond_04: 0, // wrong
          q_rel_01: 0,
          q_rel_02: 0, // wrong
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
        id: 'attempt_demo_2',
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
          q_voc_04: 2, // wrong
          q_voc_05: 0,
          q_voc_06: 0, // wrong
        },
        flaggedQuestions: ['q_voc_04'],
      },
    ];
  });

  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(() => {
    const saved = localStorage.getItem('edu10_practice_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  // 5. Mistakes notebook state
  const [mistakes, setMistakes] = useState<Record<string, MistakeItem>>(() => {
    const saved = localStorage.getItem('edu10_mistakes');
    if (saved) return JSON.parse(saved);
    // Seed initial mistakes from demo attempts
    return {
      q_pron_03: {
        questionId: 'q_pron_03',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Nhớ gốc từ Hy Lạp đọc là /k/ (chemical, Christmas), chỉ có champion đọc /tʃ/.',
      },
      q_gram_03: {
        questionId: 'q_gram_03',
        wrongCount: 1,
        lastAttemptDate: new Date(Date.now() - 3 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Mệnh đề thời gian với as soon as không dùng will!',
      },
      q_rel_02: {
        questionId: 'q_rel_02',
        wrongCount: 2,
        lastAttemptDate: new Date(Date.now() - 2 * 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
        userNote: 'Sau dấu phẩy cấm kỵ dùng THAT. Có động từ IS phía sau nên phải dùng WHICH, không dùng WHERE.',
      },
      q_voc_04: {
        questionId: 'q_voc_04',
        wrongCount: 1,
        lastAttemptDate: new Date(Date.now() - 86400000).toISOString(),
        consecutiveCorrect: 0,
        mastered: false,
      },
    };
  });

  // 6. Bookmarks state
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('edu10_bookmarks');
    return saved ? JSON.parse(saved) : ['q_rel_02', 'q_rew_03', 'q_err_02'];
  });

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('edu10_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('edu10_currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edu10_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('edu10_exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('edu10_attempts', JSON.stringify(examAttempts));
  }, [examAttempts]);

  useEffect(() => {
    localStorage.setItem('edu10_practice_sessions', JSON.stringify(practiceSessions));
  }, [practiceSessions]);

  useEffect(() => {
    localStorage.setItem('edu10_mistakes', JSON.stringify(mistakes));
  }, [mistakes]);

  useEffect(() => {
    localStorage.setItem('edu10_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // User Actions
  const switchUserRole = (role: 'student' | 'admin') => {
    const target = usersList.find((u) => u.role === role) || {
      ...currentUser,
      role,
      name: role === 'admin' ? 'Thầy Tuấn (Quản trị viên)' : 'Nguyễn Hoàng Minh',
    };
    setCurrentUser(target);
  };

  const updateUserTarget = (targetScore: number, school: string) => {
    const updated = { ...currentUser, targetScore, targetSchool: school };
    setCurrentUser(updated);
    setUsersList((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const toggleUserLock = (userId: string) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isLocked: !u.isLocked } : u))
    );
  };

  // Question CRUD
  const getQuestionById = (id: string) => questions.find((q) => q.id === id) || QUESTIONS_DATA.find((q) => q.id === id);

  const addQuestion = (q: Omit<Question, 'id'>): Question => {
    const newQ: Question = {
      ...q,
      id: `q_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };
    setQuestions((prev) => [newQ, ...prev]);
    return newQ;
  };

  const updateQuestion = (id: string, q: Partial<Question>) => {
    setQuestions((prev) => prev.map((item) => (item.id === id ? { ...item, ...q } : item)));
  };

  const deleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((item) => item.id !== id));
    // clean up mistakes and bookmarks
    removeMistake(id);
    setBookmarks((prev) => prev.filter((bId) => bId !== id));
  };

  const bulkImportQuestions = (newQuestions: (Question | Omit<Question, 'id'>)[]): number => {
    const formatted: Question[] = newQuestions.map((q: any, idx) => ({
      ...q,
      id: q.id || `q_import_${Date.now()}_${idx}`,
    }));
    setQuestions((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = formatted.filter((f) => !existingIds.has(f.id));
      return [...toAdd, ...prev];
    });
    return formatted.length;
  };

  // Exam CRUD
  const getExamById = (id: string) => exams.find((e) => e.id === id);

  const addExam = (e: Omit<Exam, 'id' | 'createdAt'> & { id?: string }): Exam => {
    const newExam: Exam = {
      ...e,
      id: e.id || `exam_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExams((prev) => {
      const filtered = prev.filter((item) => item.id !== newExam.id);
      return [newExam, ...filtered];
    });
    return newExam;
  };

  const updateExam = (id: string, e: Partial<Exam>) => {
    setExams((prev) => prev.map((item) => (item.id === id ? { ...item, ...e } : item)));
  };

  const deleteExam = (id: string) => {
    setExams((prev) => prev.filter((item) => item.id !== id));
  };

  // Save Exam Attempt
  const saveExamAttempt = (attempt: Omit<ExamAttempt, 'id'>): ExamAttempt => {
    const newAttempt: ExamAttempt = {
      ...attempt,
      id: `attempt_${Date.now()}`,
    };
    setExamAttempts((prev) => [newAttempt, ...prev]);

    // Record mistakes automatically
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
      id: `practice_${Date.now()}`,
    };
    setPracticeSessions((prev) => [newSession, ...prev]);

    // Record answers
    Object.entries(session.userAnswers).forEach(([qId, chosenOpt]) => {
      const q = getQuestionById(qId);
      if (q) {
        const isCorrect = chosenOpt === q.correctOption;
        recordAnswerResult(qId, isCorrect);
      }
    });

    return newSession;
  };

  // Mistake Notebook Management
  const recordAnswerResult = (questionId: string, isCorrect: boolean) => {
    setMistakes((prev) => {
      const existing = prev[questionId];
      if (!isCorrect) {
        return {
          ...prev,
          [questionId]: {
            questionId,
            wrongCount: (existing?.wrongCount || 0) + 1,
            lastAttemptDate: new Date().toISOString(),
            consecutiveCorrect: 0,
            mastered: false,
            userNote: existing?.userNote,
          },
        };
      } else {
        if (!existing) return prev; // If not in mistake book, do nothing
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

  // Compute Live Analytics
  const computeAnalytics = () => {
    let totalSolved = 0;
    let totalCorrect = 0;
    const topicStats: Record<TopicId, { solved: number; correct: number; accuracy: number }> = {
      grammar: { solved: 0, correct: 0, accuracy: 0 },
      vocabulary: { solved: 0, correct: 0, accuracy: 0 },
      pronunciation: { solved: 0, correct: 0, accuracy: 0 },
      stress: { solved: 0, correct: 0, accuracy: 0 },
      reading: { solved: 0, correct: 0, accuracy: 0 },
      sentence_rewrite: { solved: 0, correct: 0, accuracy: 0 },
      cloze: { solved: 0, correct: 0, accuracy: 0 },
      error_identification: { solved: 0, correct: 0, accuracy: 0 },
    };

    // Calculate from exam attempts
    examAttempts.forEach((attempt) => {
      Object.entries(attempt.userAnswers).forEach(([qId, ans]) => {
        const q = getQuestionById(qId);
        if (q) {
          totalSolved += 1;
          const isRight = ans === q.correctOption;
          if (isRight) totalCorrect += 1;
          if (topicStats[q.topicId]) {
            topicStats[q.topicId].solved += 1;
            if (isRight) topicStats[q.topicId].correct += 1;
          }
        }
      });
    });

    // Calculate from practice sessions
    practiceSessions.forEach((session) => {
      Object.entries(session.userAnswers).forEach(([qId, ans]) => {
        const q = getQuestionById(qId);
        if (q) {
          totalSolved += 1;
          const isRight = ans === q.correctOption;
          if (isRight) totalCorrect += 1;
          if (topicStats[q.topicId]) {
            topicStats[q.topicId].solved += 1;
            if (isRight) topicStats[q.topicId].correct += 1;
          }
        }
      });
    });

    // Compute topic accuracy percentages
    (Object.keys(topicStats) as TopicId[]).forEach((tId) => {
      const item = topicStats[tId];
      item.accuracy = item.solved > 0 ? Math.round((item.correct / item.solved) * 100) : 0;
    });

    const overallAccuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 78;
    const averageExamScore =
      examAttempts.length > 0
        ? parseFloat(
            (examAttempts.reduce((acc, curr) => acc + curr.score, 0) / examAttempts.length).toFixed(2)
          )
        : 8.0;

    // Estimate predicted score based on average and mistake frequency
    const activeMistakesCount = (Object.values(mistakes) as MistakeItem[]).filter((m) => !m.mastered).length;
    const penalty = Math.min(1.2, activeMistakesCount * 0.15);
    const predictedGrade10Score = Math.max(
      5.0,
      Math.min(9.8, parseFloat((averageExamScore * 0.9 + 0.8 - penalty * 0.5).toFixed(1)))
    );

    // Sort weakest and strongest
    const topicArray = (Object.keys(topicStats) as TopicId[])
      .map((tId) => ({ topicId: tId, ...topicStats[tId] }))
      .filter((t) => t.solved > 0);

    topicArray.sort((a, b) => a.accuracy - b.accuracy);
    const weakestTopics = topicArray.slice(0, 3).map((t) => t.topicId);
    const strongestTopics = [...topicArray].reverse().slice(0, 3).map((t) => t.topicId);

    return {
      totalSolved: totalSolved || 32,
      totalCorrect: totalCorrect || 26,
      overallAccuracy,
      averageExamScore,
      predictedGrade10Score,
      topicStats,
      weakestTopics: weakestTopics.length > 0 ? weakestTopics : (['relative_clauses', 'tenses'] as any),
      strongestTopics: strongestTopics.length > 0 ? strongestTopics : (['pronunciation', 'vocabulary'] as any),
      recentAttempts: examAttempts.slice(0, 5),
    };
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
        currentUser,
        setCurrentUser,
        switchUserRole,
        updateUserTarget,
        usersList,
        toggleUserLock,
        questions,
        getQuestionById,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        bulkImportQuestions,
        exams,
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
