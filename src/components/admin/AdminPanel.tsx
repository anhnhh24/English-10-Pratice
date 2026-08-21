import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { DifficultyLevel, Question, TopicId, SubTopicId, Exam, UserAccount, SubjectId, RealtimeActivityEvent, MistakeItem } from '../../types';
import {
  getStoredRealtimeActivities,
  subscribeToRealtimeActivities,
  broadcastRemoteTask,
  logAndBroadcastActivity,
  sendRemotePing,
} from '../../services/realtimeSyncService';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Download,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
  Check,
  X,
  Award,
  TrendingUp,
  Target,
  Clock,
  BookMarked,
  AlertTriangle,
  Flame,
  ArrowRight,
  Eye,
  MessageSquare,
  Sparkles,
  BarChart2,
  Calendar,
  Lock,
  Unlock,
  UserCheck,
  FileText,
  UserPlus,
  Radio,
  Send,
  Zap,
  Bell,
  Activity,
  HeartHandshake,
  Database,
  Cloud,
  Upload,
  Wand2,
} from 'lucide-react';
import { CloudSyncModal } from '../modals/CloudSyncModal';
import {
  generateExamWithAI,
  extractQuestionsFromText,
  getStoredApiKey,
  ExamGenerationConfig,
} from '../../services/aiExamService';
import {
  readFileAsText,
  detectFileType,
  formatFileSize,
  getFileIcon,
} from '../../services/fileReaderService';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    usersList,
    switchUser,
    register,
    toggleUserLock,
    getUserScopedData,
    saveTeacherNote,
    getTeacherNote,
    questions,
    exams,
    getQuestionById,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addExam,
    deleteExam,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'realtime_pulse' | 'students' | 'questions' | 'exams'>('overview');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<UserAccount | null>(null);

  // Detailed Exam Attempt Review State (Admin xem chi tiết bài làm của học sinh)
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<{
    attempt: ExamAttempt;
    studentName: string;
  } | null>(null);
  const [attemptQuestionFilter, setAttemptQuestionFilter] = useState<'all' | 'wrong' | 'correct'>('all');

  // Real-time Activities State
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeActivityEvent[]>(() => getStoredRealtimeActivities());
  const [liveToast, setLiveToast] = useState<RealtimeActivityEvent | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [activityFilterType, setActivityFilterType] = useState<string>('all');
  const [activityFilterSubject, setActivityFilterSubject] = useState<'all' | 'math' | 'english'>('all');

  // Remote Task Assignment State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState<boolean>(false);
  const [taskTargetStudentId, setTaskTargetStudentId] = useState<string>('user_student_1');
  const [taskSubject, setTaskSubject] = useState<SubjectId>('math');
  const [taskTitle, setTaskTitle] = useState<string>('Đề Thi Thử Tuyển Sinh Vào 10 Môn Toán - Đề Số 01');
  const [taskMessage, setTaskMessage] = useState<string>('Em hãy hoàn thành đề thi thử này trong 60 phút và chú ý câu Vi-ét nhé!');
  const [taskAssignedExamId, setTaskAssignedExamId] = useState<string>('math_exam_official_01');
  const [taskSuccessMsg, setTaskSuccessMsg] = useState<boolean>(false);

  // Sibling Focus Id (default to first student)
  const [siblingId, setSiblingId] = useState<string>('user_student_1');

  // Cloud DB Modal
  const [showCloudModal, setShowCloudModal] = useState<boolean>(false);

  // Teacher feedback note state for inspected student
  const [teacherNoteInput, setTeacherNoteInput] = useState<string>('');
  const [teacherNoteSaved, setTeacherNoteSaved] = useState<boolean>(false);

  // New Student Modal
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentEmail, setNewStudentEmail] = useState<string>('');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('123');
  const [newStudentSchool, setNewStudentSchool] = useState<string>('THPT Chu Văn An');
  const [newStudentTargetMath, setNewStudentTargetMath] = useState<number>(8.5);
  const [newStudentTargetEng, setNewStudentTargetEng] = useState<number>(8.5);
  const [addStudentMsg, setAddStudentMsg] = useState<string | null>(null);

  // Question Management States
  const [searchQuestionQuery, setSearchQuestionQuery] = useState<string>('');
  const [selectedQuestionTopic, setSelectedQuestionTopic] = useState<string>('all');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [showQModal, setShowQModal] = useState<boolean>(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);

  // Question form
  const [qSubject, setQSubject] = useState<SubjectId>('english');
  const [topicId, setTopicId] = useState<TopicId>('grammar');
  const [subTopicId, setSubTopicId] = useState<SubTopicId>('tenses');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [passage, setPassage] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [opt0, setOpt0] = useState<string>('');
  const [opt1, setOpt1] = useState<string>('');
  const [opt2, setOpt2] = useState<string>('');
  const [opt3, setOpt3] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [grammarRule, setGrammarRule] = useState<string>('');
  const [commonMistakeTip, setCommonMistakeTip] = useState<string>('');

  // Exam form
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [examSubject, setExamSubject] = useState<SubjectId>('math');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('DE-10-M04');
  const [examDesc, setExamDesc] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(60);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [examSubjectFilter, setExamSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [searchExamQuery, setSearchExamQuery] = useState<string>('');

  // ── AI Tạo Đề Modal ──────────────────────────────────────────
  const [showAiCreateModal, setShowAiCreateModal] = useState<boolean>(false);
  const [aiCreateSubject, setAiCreateSubject] = useState<SubjectId>('math');
  const [aiCreatePrompt, setAiCreatePrompt] = useState<string>('');
  const [aiCreateCount, setAiCreateCount] = useState<number>(10);
  const [aiCreateDiff, setAiCreateDiff] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [aiCreateLoading, setAiCreateLoading] = useState<boolean>(false);
  const [aiCreateProgress, setAiCreateProgress] = useState<string>('');
  const [aiCreateResult, setAiCreateResult] = useState<{ examId: string; questionCount: number } | null>(null);
  const [aiCreateError, setAiCreateError] = useState<string>('');

  const handleAiCreateExam = async () => {
    setAiCreateLoading(true);
    setAiCreateError('');
    setAiCreateResult(null);
    try {
      const apiKey = getStoredApiKey();
      const config: ExamGenerationConfig = {
        subject: aiCreateSubject,
        totalQuestions: aiCreateCount,
        difficulty: aiCreateDiff,
        timeLimitMinutes: aiCreateCount <= 10 ? 45 : 60,
        customPrompt: aiCreatePrompt,
        title: `Đề AI ${aiCreateSubject === 'math' ? 'Toán' : 'Anh'} - ${new Date().toLocaleDateString('vi-VN')}`,
      };
      const result = await generateExamWithAI(apiKey, config, setAiCreateProgress);
      // Save to app via addExam + add questions
      result.questions.forEach((q) => addQuestion(q));
      addExam(result.exam);
      setAiCreateResult({ examId: result.exam.id, questionCount: result.questions.length });
    } catch (e: any) {
      setAiCreateError(e.message || 'Lỗi không xác định');
    } finally {
      setAiCreateLoading(false);
    }
  };

  // ── AI Soạn Câu Hỏi Tự Động Modal ─────────────────────────────
  const [showAiQModal, setShowAiQModal] = useState<boolean>(false);
  const [aiQSubject, setAiQSubject] = useState<SubjectId>('math');
  const [aiQTopicId, setAiQTopicId] = useState<string>('math_pt_bac_hai_viet');
  const [aiQCount, setAiQCount] = useState<number>(3);
  const [aiQDiff, setAiQDiff] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [aiQPrompt, setAiQPrompt] = useState<string>('');
  const [aiQLoading, setAiQLoading] = useState<boolean>(false);
  const [aiQProgress, setAiQProgress] = useState<string>('');
  const [aiQSuccessMsg, setAiQSuccessMsg] = useState<string>('');
  const [aiQError, setAiQError] = useState<string>('');

  const handleAiGenerateQuestions = async () => {
    setAiQLoading(true);
    setAiQError('');
    setAiQSuccessMsg('');
    try {
      const apiKey = getStoredApiKey();
      const config: ExamGenerationConfig = {
        subject: aiQSubject,
        totalQuestions: aiQCount,
        difficulty: aiQDiff,
        timeLimitMinutes: 30,
        focusTopics: [aiQTopicId as TopicId],
        customPrompt: aiQPrompt,
        title: `Bộ câu hỏi ${aiQSubject === 'math' ? 'Toán' : 'Anh'}`,
      };
      const result = await generateExamWithAI(apiKey, config, setAiQProgress);
      result.questions.forEach((q) => addQuestion(q));
      setAiQSuccessMsg(`Đã tạo thành công ${result.questions.length} câu hỏi mới môn ${aiQSubject === 'math' ? 'Toán' : 'Tiếng Anh'} và lưu vào ngân hàng câu hỏi!`);
    } catch (e: any) {
      setAiQError(e.message || 'Lỗi không xác định khi tạo câu hỏi');
    } finally {
      setAiQLoading(false);
    }
  };

  // ── Upload & Extract Modal ─────────────────────────────────────
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadSubject, setUploadSubject] = useState<SubjectId>('math');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadFileContent, setUploadFileContent] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadFileMeta, setUploadFileMeta] = useState<{ name: string; size: string; type: string } | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);
  const [uploadReading, setUploadReading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<{ examId: string; questionCount: number } | null>(null);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileRead = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFileName(file.name);
    setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    setUploadError('');
    setUploadResult(null);
    setUploadReading(true);
    setUploadFileMeta({
      name: file.name,
      size: formatFileSize(file.size),
      type: detectFileType(file),
    });

    try {
      const extractedText = await readFileAsText(file, (msg) => {
        setUploadProgress(msg);
      });
      if (!extractedText.trim()) {
        throw new Error('Nội dung file đọc được bị trống. Vui lòng kiểm tra lại hoặc thử dán text trực tiếp.');
      }
      setUploadFileContent(extractedText);
      setUploadProgress('');
    } catch (err: any) {
      setUploadError(err.message || 'Không thể đọc nội dung file.');
      setUploadProgress('');
    } finally {
      setUploadReading(false);
    }
  };

  const handleExtractAndImport = async () => {
    if (!uploadFileContent.trim() && !uploadTitle.trim()) {
      setUploadError('Vui lòng upload file hoặc dán nội dung đề thi vào ô bên dưới.');
      return;
    }
    setUploadLoading(true);
    setUploadError('');
    setUploadResult(null);
    try {
      const apiKey = getStoredApiKey();
      const result = await extractQuestionsFromText(
        apiKey,
        uploadFileContent,
        uploadSubject,
        uploadTitle || 'Đề Thi Upload',
        setUploadProgress
      );
      result.questions.forEach((q) => addQuestion(q));
      addExam(result.exam);
      setUploadResult({ examId: result.exam.id, questionCount: result.rawQuestionCount });
    } catch (e: any) {
      setUploadError(e.message || 'Lỗi không xác định khi trích xuất');
    } finally {
      setUploadLoading(false);
    }
  };

  // Real-time Activity Subscription
  useEffect(() => {
    const unsubscribe = subscribeToRealtimeActivities((event) => {
      setRealtimeEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)].slice(0, 50));
      setLiveToast(event);
      setTimeout(() => setLiveToast(null), 5000);
    });

    return () => unsubscribe();
  }, []);

  // Calculate Aggregate Class Performance
  const studentUsers = usersList.filter((u) => u.role === 'student');

  const allStudentStats = studentUsers.map((stu) => {
    const data = getUserScopedData(stu.id);
    const attempts = data.examAttempts || [];
    const mathAttempts = attempts.filter((a) => (a.subject || 'english') === 'math');
    const engAttempts = attempts.filter((a) => (a.subject || 'english') === 'english');

    const avgMath =
      mathAttempts.length > 0
        ? parseFloat((mathAttempts.reduce((s, a) => s + a.score, 0) / mathAttempts.length).toFixed(2))
        : 0;

    const avgEng =
      engAttempts.length > 0
        ? parseFloat((engAttempts.reduce((s, a) => s + a.score, 0) / engAttempts.length).toFixed(2))
        : 0;

    const activeMistakes = (Object.values(data.mistakes || {}) as MistakeItem[]).filter((m) => !m.mastered);

    const totalQuestionsSolved = attempts.reduce((acc, a) => acc + (a.totalQuestions || 0), 0);
    const totalCorrect = attempts.reduce((acc, a) => acc + (a.correctCount || 0), 0);
    const accuracy = totalQuestionsSolved > 0 ? Math.round((totalCorrect / totalQuestionsSolved) * 100) : 0;

    const targetMath = stu.targetScoreMath || stu.targetScore || 8.5;
    const targetEng = stu.targetScoreEnglish || stu.targetScore || 8.5;
    const isTargetReached = (avgMath > 0 && avgMath >= targetMath - 0.5) && (avgEng > 0 && avgEng >= targetEng - 0.5);

    return {
      student: stu,
      attempts,
      mathAttempts,
      engAttempts,
      avgMath,
      avgEng,
      activeMistakesCount: activeMistakes.length,
      accuracy,
      totalAttemptsCount: attempts.length,
      isTargetReached,
      teacherNote: getTeacherNote(stu.id),
    };
  });

  // Class Overview Stats
  const totalStudents = studentUsers.length;
  const totalSubmissions = allStudentStats.reduce((s, st) => s + st.totalAttemptsCount, 0);

  const mathStudentStats = allStudentStats.filter((st) => st.mathAttempts.length > 0);
  const classAvgMath =
    mathStudentStats.length > 0
      ? parseFloat((mathStudentStats.reduce((s, st) => s + st.avgMath, 0) / mathStudentStats.length).toFixed(1))
      : 0;

  const engStudentStats = allStudentStats.filter((st) => st.engAttempts.length > 0);
  const classAvgEng =
    engStudentStats.length > 0
      ? parseFloat((engStudentStats.reduce((s, st) => s + st.avgEng, 0) / engStudentStats.length).toFixed(1))
      : 0;

  const targetReachCount = allStudentStats.filter((st) => st.isTargetReached).length;
  const targetReachPercent = totalStudents > 0 ? Math.round((targetReachCount / totalStudents) * 100) : 0;
  const totalClassMistakes = allStudentStats.reduce((s, st) => s + st.activeMistakesCount, 0);

  // Real Topic Performance Computation across all students
  const computeTopicRealStats = (topicId: string) => {
    let totalQuestionsAnswered = 0;
    let totalQuestionsCorrect = 0;
    let activeMistakesInTopic = 0;

    // Collect questions belonging to this topic
    const topicQIds = new Set(questions.filter((q) => q.topicId === topicId).map((q) => q.id));

    studentUsers.forEach((stu) => {
      const uData = getUserScopedData(stu.id) || {};

      // 1. Check Exam Attempts
      (uData.examAttempts || []).forEach((att: any) => {
        if (att && att.userAnswers && typeof att.userAnswers === 'object') {
          Object.entries(att.userAnswers).forEach(([qId, userChoice]) => {
            const q = getQuestionById(qId);
            if (q && q.topicId === topicId) {
              totalQuestionsAnswered++;
              if (userChoice === q.correctOption) {
                totalQuestionsCorrect++;
              }
            } else if (topicQIds.has(qId)) {
              totalQuestionsAnswered++;
              const questionObj = getQuestionById(qId);
              if (questionObj && userChoice === questionObj.correctOption) {
                totalQuestionsCorrect++;
              }
            }
          });
        }
      });

      // 2. Check Practice Sessions
      (uData.practiceSessions || []).forEach((sess: any) => {
        if (sess && sess.topicId === topicId) {
          totalQuestionsAnswered += sess.totalQuestions || 0;
          totalQuestionsCorrect += sess.correctCount || 0;
        } else if (sess && sess.userAnswers && typeof sess.userAnswers === 'object') {
          Object.entries(sess.userAnswers).forEach(([qId, userChoice]) => {
            const q = getQuestionById(qId);
            if (q && q.topicId === topicId) {
              totalQuestionsAnswered++;
              if (userChoice === q.correctOption) {
                totalQuestionsCorrect++;
              }
            }
          });
        }
      });

      // 3. Check Mistakes
      const mList = uData && uData.mistakes && typeof uData.mistakes === 'object' ? Object.values(uData.mistakes) : [];
      mList.forEach((m: any) => {
        if (m && !m.mastered) {
          const q = getQuestionById(m.questionId);
          if (q && q.topicId === topicId) {
            activeMistakesInTopic++;
          }
        }
      });
    });

    const hasData = totalQuestionsAnswered > 0;
    const accuracy = hasData ? Math.round((totalQuestionsCorrect / totalQuestionsAnswered) * 100) : null;
    const isDanger = hasData ? (accuracy! < 70 || activeMistakesInTopic > 0) : activeMistakesInTopic > 0;

    return {
      totalQuestionsAnswered,
      totalQuestionsCorrect,
      activeMistakesInTopic,
      accuracy,
      isDanger,
      hasData,
    };
  };

  // Real Grade Distribution across all students
  const totalEvaluated = studentUsers.length || 1;
  const studentsWithExams = studentUsers.filter((stu) => ((getUserScopedData(stu.id) || {}).examAttempts || []).length > 0);

  const gradeTiers = {
    excellent: studentsWithExams.filter((stu) => {
      const atts = (getUserScopedData(stu.id) || {}).examAttempts || [];
      const avg = atts.length > 0 ? atts.reduce((s: number, a: any) => s + (a.score || 0), 0) / atts.length : 0;
      return avg >= 9.0;
    }),
    good: studentsWithExams.filter((stu) => {
      const atts = (getUserScopedData(stu.id) || {}).examAttempts || [];
      const avg = atts.length > 0 ? atts.reduce((s: number, a: any) => s + (a.score || 0), 0) / atts.length : 0;
      return avg >= 8.0 && avg < 9.0;
    }),
    fair: studentsWithExams.filter((stu) => {
      const atts = (getUserScopedData(stu.id) || {}).examAttempts || [];
      const avg = atts.length > 0 ? atts.reduce((s: number, a: any) => s + (a.score || 0), 0) / atts.length : 0;
      return avg >= 6.5 && avg < 8.0;
    }),
    average: studentsWithExams.filter((stu) => {
      const atts = (getUserScopedData(stu.id) || {}).examAttempts || [];
      const avg = atts.length > 0 ? atts.reduce((s: number, a: any) => s + (a.score || 0), 0) / atts.length : 0;
      return avg < 6.5;
    }),
    unattempted: studentUsers.filter((stu) => ((getUserScopedData(stu.id) || {}).examAttempts || []).length === 0),
  };

  const gradeDistribution = {
    excellent: { count: gradeTiers.excellent.length, percent: Math.round((gradeTiers.excellent.length / totalEvaluated) * 100) },
    good: { count: gradeTiers.good.length, percent: Math.round((gradeTiers.good.length / totalEvaluated) * 100) },
    fair: { count: gradeTiers.fair.length, percent: Math.round((gradeTiers.fair.length / totalEvaluated) * 100) },
    average: { count: gradeTiers.average.length, percent: Math.round((gradeTiers.average.length / totalEvaluated) * 100) },
    unattempted: { count: gradeTiers.unattempted.length, percent: Math.round((gradeTiers.unattempted.length / totalEvaluated) * 100) },
  };

  // Sibling Focus Stat (Ưu tiên em trai Nguyễn Hoàng Hà)
  const siblingStat =
    allStudentStats.find(
      (s) =>
        s.student.id === 'user_ha' ||
        s.student.name.toLowerCase().includes('nguyễn hoàng hà') ||
        s.student.name.toLowerCase().includes('hà') ||
        s.student.id === siblingId
    ) || allStudentStats[0];

  // Filtered student list
  const filteredStudents = allStudentStats.filter(({ student }) => {
    const q = searchStudentQuery.toLowerCase();
    const matchName = student.name.toLowerCase().includes(q);
    const matchEmail = student.email.toLowerCase().includes(q);
    const matchSchool = (student.targetSchool || '').toLowerCase().includes(q);
    return matchName || matchEmail || matchSchool;
  });

  // Inspector handlers
  const handleOpenStudentDetail = (stu: UserAccount) => {
    setSelectedStudentForDetail(stu);
    setTeacherNoteInput(getTeacherNote(stu.id) || '');
    setTeacherNoteSaved(false);
  };

  const handleSaveTeacherNote = () => {
    if (!selectedStudentForDetail) return;
    saveTeacherNote(selectedStudentForDetail.id, teacherNoteInput);
    setTeacherNoteSaved(true);
    setTimeout(() => setTeacherNoteSaved(false), 2500);
  };

  // Remote Task Send Handler
  const handleSendRemoteTask = (e: React.FormEvent) => {
    e.preventDefault();
    broadcastRemoteTask({
      senderName: currentUser.name || 'Anh/Chị (Người giám sát)',
      recipientUserId: taskTargetStudentId,
      subject: taskSubject,
      title: taskTitle,
      message: taskMessage,
      assignedExamId: taskAssignedExamId,
    });
    setTaskSuccessMsg(true);
    setTimeout(() => {
      setTaskSuccessMsg(false);
      setShowAssignTaskModal(false);
    }, 1500);
  };

  const [quickPingMessage, setQuickPingMessage] = useState<string>('');
  const [pingSentSuccess, setPingSentSuccess] = useState<boolean>(false);

  const handleSendQuickPing = (
    msg?: string,
    type: 'encouragement' | 'warning' | 'reminder' | 'custom' = 'custom'
  ) => {
    const textToSend = msg || quickPingMessage;
    if (!textToSend.trim()) return;
    sendRemotePing({
      senderName: currentUser.name || 'Người anh (Giám sát)',
      recipientUserId: siblingId,
      message: textToSend.trim(),
      pingType: type,
    });
    setQuickPingMessage('');
    setPingSentSuccess(true);
    setTimeout(() => setPingSentSuccess(false), 2500);
  };

  // Live Test Simulation Trigger
  const handleSimulateStudentExam = (score: number) => {
    const targetStu = studentUsers.find((s) => s.id === siblingId) || studentUsers[0];
    logAndBroadcastActivity({
      userId: targetStu.id,
      userName: `${targetStu.name} (Em tôi)`,
      avatarColor: targetStu.avatarColor,
      subject: 'math',
      type: 'exam_submitted',
      title: `Vừa nộp bài thi Môn Toán (${score}/10đ)`,
      detail: `Đạt ${score}/10 điểm • Đề Thi Thử Vào 10 Chuẩn Sở GD&ĐT`,
      score,
      examTitle: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 Môn Toán (Sở GD&ĐT)',
    });
  };

  const handleSimulateStudentMistake = () => {
    const targetStu = studentUsers.find((s) => s.id === siblingId) || studentUsers[0];
    logAndBroadcastActivity({
      userId: targetStu.id,
      userName: `${targetStu.name} (Em tôi)`,
      avatarColor: targetStu.avatarColor,
      subject: 'math',
      type: 'question_wrong',
      title: 'Làm sai câu hỏi Hệ thức Vi-ét',
      detail: 'Sai câu tìm tham số m để phương trình có 2 nghiệm đối xứng',
      topicName: 'Phương trình bậc hai & Vi-ét',
    });
  };

  const [adminEmail, setAdminEmail] = useState<string>('admin');
  const [adminPass, setAdminPass] = useState<string>('123');
  const [adminError, setAdminError] = useState<string | null>(null);

  // If NOT logged in as Admin, show Dedicated Secure Admin Gateway Portal
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-in fade-in">
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-[#D9D2C5] shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#5A5A40] text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8 text-[#8BA888]" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold text-[#3D3D2D]">Cổng Quản Trị & Giám Sát Riêng Biệt</h2>
            <p className="text-xs text-[#8A8A70]">
              Đăng nhập bằng tài khoản Quản trị viên / Phụ huynh để theo dõi kết quả học tập của <strong>Nguyễn Hoàng Hà</strong>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = adminEmail.trim().toLowerCase();
              const adminAcc = usersList.find(
                (u) =>
                  (u.email.toLowerCase() === trimmed || u.id === trimmed || trimmed === 'admin') &&
                  u.role === 'admin'
              );
              if (adminAcc && adminAcc.password === adminPass) {
                switchUser(adminAcc.id);
                setAdminError(null);
              } else {
                setAdminError('Tài khoản hoặc mật khẩu quản trị không chính xác! (Gợi ý: admin / 123)');
              }
            }}
            className="space-y-3.5 text-left text-xs"
          >
            <div>
              <label className="block font-bold text-[#5A5A40] mb-1">Tài khoản Quản Trị:</label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-medium text-[#3D3D2D]"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-[#5A5A40] mb-1">Mật khẩu:</label>
              <input
                type="password"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                placeholder="123"
                className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                required
              />
            </div>

            {adminError && (
              <p className="text-red-600 font-bold text-[11px]">{adminError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold rounded-2xl shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Đăng nhập vào Dashboard Giám Sát</span>
            </button>
          </form>

          {/* 1-Click Fast Admin Switch */}
          <div className="pt-2 border-t border-[#F5F2ED] space-y-2">
            <p className="text-[11px] text-[#8A8A70]">Hoặc truy cập nhanh với tài khoản giám sát:</p>
            <button
              onClick={() => {
                const adminAcc = usersList.find((u) => u.role === 'admin');
                if (adminAcc) switchUser(adminAcc.id);
              }}
              className="w-full py-2.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#8BA888]" />
              <span>Đăng nhập 1-Chạm: Admin (Người Giám Sát)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 relative">
      {/* Real-time Live Toast Alert */}
      {liveToast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm bg-white rounded-2xl p-4 border-2 border-[#8BA888] shadow-2xl flex items-start space-x-3 animate-in slide-in-from-top duration-300">
          <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40] shrink-0 mt-0.5 animate-pulse">
            <Radio className="w-4 h-4 text-[#8BA888]" />
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.2 bg-[#8BA888] text-[#2C3E2D] text-[9px] font-bold rounded-full uppercase">
                ⚡ Realtime Pulse
              </span>
              <button onClick={() => setLiveToast(null)} className="text-[#8A8A70] hover:text-[#3D3D2D]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-bold text-[#3D3D2D] truncate">{liveToast.userName}: {liveToast.title}</p>
            <p className="text-[11px] text-[#6B6B54] line-clamp-2">{liveToast.detail}</p>
          </div>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm space-y-6">
        {/* Top Info Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3.5 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold text-[#E8E2D9] border border-white/10">
              <Radio className="w-3.5 h-3.5 text-[#8BA888] animate-pulse" />
              <span>Giám Sát Thời Gian Thực (Real-time Live Sync)</span>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold">
              ● Live 0ms
            </span>
          </div>

          <div className="text-xs text-[#D9D2C5] flex items-center space-x-1.5">
            <span>Học sinh trọng tâm:</span>
            <strong className="text-white bg-white/15 px-2.5 py-0.5 rounded-lg">
              {siblingStat ? siblingStat.student.name : 'Nguyễn Hoàng Hà'}
            </strong>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Dashboard Giám Sát Quá Trình Học & Kiểm Soát Từ Xa
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed max-w-3xl">
            Cập nhật kết quả làm bài, câu sai và tiến độ học tập của em bạn thời gian thực không độ trễ. Hỗ trợ giao bài tập, tạo đề thi AI và dặn dò trực tiếp từ xa.
          </p>
        </div>

        {/* Action Toolbar Grid (6 Quick Action Buttons) */}
        <div className="pt-2 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setShowAiCreateModal(true)}
            className="p-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md border border-blue-400/40 text-center"
          >
            <Wand2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="truncate">🤖 AI Tạo Đề Mới</span>
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="p-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md border border-amber-400/40 text-center"
          >
            <Upload className="w-4 h-4 text-amber-200 shrink-0" />
            <span className="truncate">📄 Upload & Trích Xuất</span>
          </button>

          <button
            onClick={() => setShowAiQModal(true)}
            className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs border border-white/20 text-center"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
            <span className="truncate">✨ AI Soạn Câu Hỏi</span>
          </button>

          <button
            onClick={() => setShowCloudModal(true)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs border border-white/15 text-center"
            title="Cài đặt mã phòng & đồng bộ Online DB"
          >
            <Database className="w-4 h-4 text-[#8BA888] shrink-0" />
            <span className="truncate">DB Online</span>
          </button>

          <button
            onClick={() => setShowAssignTaskModal(true)}
            className="p-3 bg-[#8BA888] hover:bg-[#789675] text-white rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer text-center"
          >
            <Send className="w-4 h-4 shrink-0" />
            <span className="truncate">Giao bài từ xa</span>
          </button>

          <button
            onClick={() => setShowAddStudentModal(true)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer text-center"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* 2. Sibling Quick Live Spotlight Card */}
      {siblingStat && (
        <div className="bg-[#FAF9F6] p-5 sm:p-6 rounded-[2.5rem] border border-[#D9D2C5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-2xl ${siblingStat.student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-lg flex items-center justify-center shadow-sm`}
              >
                {siblingStat.student.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.2 bg-[#5A5A40] text-white text-[10px] font-bold rounded-md uppercase">
                  Đang Giám Sát
                </span>
                <h3 className="font-bold text-[#3D3D2D] text-base">{siblingStat.student.name}</h3>
              </div>
              <p className="text-xs text-[#8A8A70]">
                Mục tiêu: <strong>{siblingStat.student.targetSchool}</strong> (Toán: {siblingStat.student.targetScoreMath}đ • Anh: {siblingStat.student.targetScoreEnglish}đ)
              </p>
            </div>
          </div>

          {/* Quick Metrics of Sibling */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Dự đoán Toán</span>
              <strong className="text-base font-extrabold text-[#5A5A40]">{siblingStat.avgMath}đ</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Dự đoán Anh</span>
              <strong className="text-base font-extrabold text-[#5A5A40]">{siblingStat.avgEng}đ</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Đề thi đã làm</span>
              <strong className="text-base font-extrabold text-[#3D3D2D]">{siblingStat.totalAttemptsCount} bài</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Câu sai chưa sửa</span>
              <strong className="text-base font-extrabold text-[#E67E22]">{siblingStat.activeMistakesCount} câu</strong>
            </div>

            <button
              onClick={() => handleOpenStudentDetail(siblingStat.student)}
              className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <span>Xem hồ sơ 360°</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex bg-[#E8E2D9] p-1.5 rounded-2xl max-w-2xl shadow-2xs text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'overview'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Tổng quan học tập</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('realtime_pulse')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'realtime_pulse'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#8BA888]" />
          <span>Nhật ký Live Realtime ({realtimeEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('students')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'students'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh sách học sinh ({totalStudents})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('questions')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'questions'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ngân hàng câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('exams')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            activeAdminTab === 'exams'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Đề thi tuyển sinh</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ⚡ TAB: REALTIME LIVE PULSE & SIMULATION TESTING                           */}
      {/* ========================================================================= */}
      {activeAdminTab === 'realtime_pulse' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Live Simulator Trigger Box */}
          <div className="bg-[#FDFCFB] p-5 sm:p-6 rounded-[2.5rem] border border-[#D9D2C5] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#E67E22]" />
                <h3 className="text-sm font-bold text-[#3D3D2D]">Trình Thử Nghiệm Kết Nối Real-time (Side-by-Side)</h3>
              </div>
              <span className="text-[11px] text-[#8A8A70]">Kích hoạt để kiểm tra truyền tin 0ms</span>
            </div>
            <p className="text-xs text-[#8A8A70]">
              Bạn có thể mở một tab phụ với tài khoản của em để làm bài, hoặc bấm các nút mô phỏng bên dưới để thấy thông số và bảng tin cập nhật tức thì:
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleSimulateStudentExam(9.0)}
                className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡ Em nộp bài thi thử Toán (9.0đ)</span>
              </button>

              <button
                onClick={() => handleSimulateStudentExam(8.5)}
                className="px-3.5 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <span>⚡ Em nộp bài thi Tiếng Anh (8.5đ)</span>
              </button>

            </div>
          </div>

          {/* 💬 Quick Ping & Encouragement Box */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white p-5 sm:p-6 rounded-[2.5rem] shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                  <Send className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Gửi Lời Nhắn Tức Thời Đến Màn Hình Của Hà</h3>
                  <p className="text-[11px] text-blue-100">Thông điệp sẽ xuất hiện tức thì dạng popup trên màn hình em</p>
                </div>
              </div>
              {pingSentSuccess && (
                <span className="px-3 py-1 bg-emerald-500 text-white font-bold text-xs rounded-full animate-bounce">
                  ✓ Đã gửi tin nhắn!
                </span>
              )}
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleSendQuickPing('💪 Cố lên em trai! Hoàn thành nốt bài thi rồi nghỉ ngơi nhé.', 'encouragement')}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/20 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
              >
                🌟 "💪 Cố lên em trai! Hoàn thành..."
              </button>
              <button
                onClick={() => handleSendQuickPing('⚠️ Em vừa chuyển tab đúng không? Tập trung làm bài thi nghiêm túc nhé!', 'warning')}
                className="px-3 py-1.5 bg-amber-500/30 hover:bg-amber-500/40 backdrop-blur-xs border border-amber-300/30 rounded-xl text-xs font-semibold text-amber-200 transition cursor-pointer"
              >
                ⚠️ "⚠️ Em vừa chuyển tab đúng không..."
              </button>
              <button
                onClick={() => handleSendQuickPing('⏰ Đã đến giờ làm bài tập toán chuyên đề hôm nay rồi đấy!', 'reminder')}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs border border-white/20 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
              >
                ⏰ "⏰ Đã đến giờ làm bài tập..."
              </button>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={quickPingMessage}
                onChange={(e) => setQuickPingMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendQuickPing()}
                placeholder="Nhập nội dung lời nhắn riêng cho em..."
                className="flex-1 px-4 py-2.5 bg-white/10 backdrop-blur-xs border border-white/20 rounded-2xl text-xs text-white placeholder-blue-200 focus:outline-hidden focus:ring-2 focus:ring-white/40"
              />
              <button
                onClick={() => handleSendQuickPing()}
                className="px-5 py-2.5 bg-white text-[#1E3A8A] font-bold text-xs rounded-2xl hover:bg-blue-50 transition cursor-pointer shadow-sm flex items-center space-x-1.5"
              >
                <span>Gửi ngay</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chronological Live Feed */}
          {(() => {
            const filteredEvents = realtimeEvents.filter((evt) => {
              if (activityFilterType !== 'all' && evt.type !== activityFilterType) return false;
              if (activityFilterSubject !== 'all' && evt.subject && evt.subject !== activityFilterSubject) return false;
              return true;
            });

            return (
              <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#EAE7E0] shadow-xs space-y-4">
                {/* Feed Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#F5F2ED]">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-[#8BA888]" />
                    <div>
                      <h3 className="text-base font-bold text-[#3D3D2D]">
                        Dòng Hoạt Động Thời Gian Thực ({filteredEvents.length})
                      </h3>
                      <p className="text-[11px] text-[#8A8A70]">Tự động cập nhật không cần tải lại trang</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        const current = getStoredRealtimeActivities();
                        setRealtimeEvents(current);
                      }}
                      className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#5A5A40] border border-[#D9D2C5] rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      🔄 Làm mới
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Bạn có muốn xóa toàn bộ lịch sử log hoạt động đã lưu trên máy này?')) {
                          localStorage.removeItem('edu10_realtime_activities');
                          setRealtimeEvents([]);
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      🗑️ Xóa log
                    </button>
                  </div>
                </div>

                {/* Filter Tabs Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {/* Event Type Filter */}
                  <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold shrink-0 flex-wrap gap-1">
                    <button
                      onClick={() => setActivityFilterType('all')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      Tất cả
                    </button>
                    <button
                      onClick={() => setActivityFilterType('exam_submitted')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'exam_submitted' ? 'bg-emerald-700 text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      📝 Nộp bài thi
                    </button>
                    <button
                      onClick={() => setActivityFilterType('practice_completed')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'practice_completed' ? 'bg-blue-700 text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      ⚡ Luyện tập
                    </button>
                    <button
                      onClick={() => setActivityFilterType('question_wrong')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'question_wrong' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      ⚠️ Làm sai
                    </button>
                    <button
                      onClick={() => setActivityFilterType('mistake_mastered')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'mistake_mastered' ? 'bg-indigo-700 text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      ✅ Sửa câu sai
                    </button>
                    <button
                      onClick={() => setActivityFilterType('study_start')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterType === 'study_start' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      👤 Đăng nhập
                    </button>
                  </div>

                  {/* Subject Filter */}
                  <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold shrink-0">
                    <button
                      onClick={() => setActivityFilterSubject('all')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterSubject === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      Tất cả môn
                    </button>
                    <button
                      onClick={() => setActivityFilterSubject('math')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterSubject === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      📐 Môn Toán
                    </button>
                    <button
                      onClick={() => setActivityFilterSubject('english')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        activityFilterSubject === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                    >
                      🇬🇧 Tiếng Anh
                    </button>
                  </div>
                </div>

                {/* Event List */}
                <div className="space-y-3 max-h-[550px] overflow-y-auto no-scrollbar pt-2">
                  {filteredEvents.length === 0 ? (
                    <div className="p-10 bg-[#FAF9F6] rounded-3xl border border-[#EAE7E0] text-center space-y-2">
                      <p className="text-3xl">📡</p>
                      <h4 className="font-bold text-sm text-[#3D3D2D]">Chưa có hoạt động nào phù hợp với bộ lọc</h4>
                      <p className="text-xs text-[#8A8A70] max-w-md mx-auto">
                        Khi em vào làm bài thi, giải câu hỏi hoặc sửa lỗi sai, toàn bộ tiến độ sẽ được đẩy lên đây tức thời không độ trễ.
                      </p>
                    </div>
                  ) : (
                    filteredEvents.map((evt) => {
                      const dateObj = new Date(evt.timestamp);
                      const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const isToday = new Date().toDateString() === dateObj.toDateString();
                      const dateDisplay = isToday ? `Hôm nay ${timeStr}` : `${dateObj.toLocaleDateString('vi-VN')} ${timeStr}`;

                      return (
                        <div
                          key={evt.id}
                          className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#D9D2C5] transition flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start space-x-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-2xl ${evt.avatarColor || 'bg-[#5A5A40]'} text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}
                            >
                              {evt.userName.charAt(0)}
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-bold text-[#3D3D2D]">{evt.userName}</span>
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                    evt.type === 'exam_submitted'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : evt.type === 'practice_completed'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : evt.type === 'question_wrong'
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : evt.type === 'mistake_mastered'
                                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                      : 'bg-[#F5F2ED] text-[#5A5A40] border border-[#D9D2C5]'
                                  }`}
                                >
                                  {evt.type === 'exam_submitted'
                                    ? '📝 Nộp bài thi'
                                    : evt.type === 'practice_completed'
                                    ? '⚡ Hoàn thành luyện tập'
                                    : evt.type === 'question_wrong'
                                    ? '⚠️ Làm sai câu hỏi'
                                    : evt.type === 'mistake_mastered'
                                    ? '✅ Đã sửa câu sai'
                                    : evt.type === 'study_start'
                                    ? '👤 Đăng nhập'
                                    : 'Học tập'}
                                </span>

                                {evt.subject && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-[#5A5A40] border border-[#D9D2C5]">
                                    {evt.subject === 'math' ? '📐 Toán' : '🇬🇧 Tiếng Anh'}
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-[#3D3D2D] leading-snug">{evt.title}</p>
                              <p className="text-[#6B6B54] leading-relaxed whitespace-pre-line">{evt.detail}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] text-[#8A8A70] block font-mono">
                              {dateDisplay}
                            </span>
                            {evt.score !== undefined && (
                              <span className="text-sm font-extrabold text-[#1E3A8A] block mt-1">
                                {typeof evt.score === 'number' && evt.score <= 10 ? `${evt.score.toFixed(1)}đ` : `${evt.score} câu`}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📊 TAB: OVERVIEW                                                          */}
      {/* ========================================================================= */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* 5 Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <Users className="w-4 h-4 text-[#5A5A40]" />
                <span>Sĩ số học sinh</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{totalStudents} em</div>
              <p className="text-[10px] text-[#8A8A70]">Lớp 9 Ôn thi Vào 10</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <span className="text-base">📐</span>
                <span>Điểm TB Môn Toán</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{classAvgMath}/10</div>
              <p className="text-[10px] text-[#8BA888] font-semibold">Tất cả đề thi thử Toán</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <span className="text-base">🇬🇧</span>
                <span>Điểm TB Môn Anh</span>
              </div>
              <div className="text-3xl font-extrabold text-[#5A5A40]">{classAvgEng}/10</div>
              <p className="text-[10px] text-[#8BA888] font-semibold">Tất cả đề thi thử Anh</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <Target className="w-4 h-4 text-[#8BA888]" />
                <span>Đạt Mục Tiêu NV1</span>
              </div>
              <div className="text-3xl font-extrabold text-[#8BA888]">{targetReachPercent}%</div>
              <p className="text-[10px] text-[#8A8A70]">{targetReachCount}/{totalStudents} học sinh vững vàng</p>
            </div>

            <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1 col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-1.5 text-[#8A8A70] text-[11px] font-bold uppercase">
                <AlertTriangle className="w-4 h-4 text-[#E67E22]" />
                <span>Câu sai cần chữa</span>
              </div>
              <div className="text-3xl font-extrabold text-[#E67E22]">{totalClassMistakes} câu</div>
              <p className="text-[10px] text-[#8A8A70]">{totalSubmissions} bài thi đã nộp</p>
            </div>
          </div>

          {/* 2-Column: Class Weakness Matrix & Grade Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Class Weakness Heatmap (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <div>
                  <h3 className="text-base font-bold text-[#3D3D2D]">
                    Ma Trận Báo Động Lỗ Hổng Kiến Thức
                  </h3>
                  <p className="text-xs text-[#8A8A70]">
                    Tỷ lệ chính xác bình quân của cả lớp theo từng dạng bài trọng tâm
                  </p>
                </div>
                <div className="flex space-x-1 bg-[#FAF9F6] p-1 rounded-xl border border-[#D9D2C5] text-[11px] font-bold">
                  <button
                    onClick={() => setSelectedSubjectFilter('all')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                      selectedSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('math')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                      selectedSubjectFilter === 'math' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Toán
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('english')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                      selectedSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                    }`}
                  >
                    Tiếng Anh
                  </button>
                </div>
              </div>

              {/* Topics Grid */}
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                {(selectedSubjectFilter === 'all' || selectedSubjectFilter === 'math') && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block">
                      📐 Chuyên đề Môn Toán 9 Vào 10:
                    </span>
                    {MATH_TOPICS_META.map((t) => {
                      const topicStat = computeTopicRealStats(t.id);
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                topicStat.hasData
                                  ? topicStat.isDanger
                                    ? 'bg-[#E67E22] animate-ping'
                                    : 'bg-[#8BA888]'
                                  : 'bg-[#C5C0B5]'
                              }`}
                            />
                            <span className="font-bold text-[#3D3D2D] truncate">{t.nameVi}</span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            {topicStat.hasData ? (
                              <>
                                <div className="w-24 bg-[#E8E2D9] h-2 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${topicStat.isDanger ? 'bg-[#E67E22]' : 'bg-[#8BA888]'}`}
                                    style={{ width: `${topicStat.accuracy}%` }}
                                  />
                                </div>
                                <span className={`font-extrabold ${topicStat.isDanger ? 'text-[#E67E22]' : 'text-[#5A5A40]'}`}>
                                  {topicStat.accuracy}% {topicStat.isDanger && '⚠️ Cần ôn'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-[#8A8A70] italic">
                                Chưa có bài làm
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(selectedSubjectFilter === 'all' || selectedSubjectFilter === 'english') && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider block">
                      🇬🇧 Chuyên đề Môn Tiếng Anh 9 Vào 10:
                    </span>
                    {TOPICS_META.map((t) => {
                      const topicStat = computeTopicRealStats(t.id);
                      return (
                        <div
                          key={t.id}
                          className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2 min-w-0 flex-1 pr-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                topicStat.hasData
                                  ? topicStat.isDanger
                                    ? 'bg-[#E67E22] animate-ping'
                                    : 'bg-[#8BA888]'
                                  : 'bg-[#C5C0B5]'
                              }`}
                            />
                            <span className="font-bold text-[#3D3D2D] truncate">{t.nameVi}</span>
                          </div>
                          <div className="flex items-center space-x-3 shrink-0">
                            {topicStat.hasData ? (
                              <>
                                <div className="w-24 bg-[#E8E2D9] h-2 rounded-full overflow-hidden hidden sm:block">
                                  <div
                                    className={`h-full rounded-full ${topicStat.isDanger ? 'bg-[#E67E22]' : 'bg-[#8BA888]'}`}
                                    style={{ width: `${topicStat.accuracy}%` }}
                                  />
                                </div>
                                <span className={`font-extrabold ${topicStat.isDanger ? 'text-[#E67E22]' : 'text-[#5A5A40]'}`}>
                                  {topicStat.accuracy}% {topicStat.isDanger && '⚠️ Cần ôn'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[11px] text-[#8A8A70] italic">
                                Chưa có bài làm
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Grade Tier Distribution & Top Students (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Grade Tier Chart */}
              <div className="bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#3D3D2D]">Phổ Điểm Tuyển Sinh Cả Lớp</h3>
                  <span className="text-[11px] text-[#8A8A70]">Theo điểm thi thực tế</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-emerald-700">Xuất sắc (9.0 - 10.0đ)</span>
                      <span>{gradeDistribution.excellent.count} em ({gradeDistribution.excellent.percent}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${gradeDistribution.excellent.percent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-[#5A5A40]">Giỏi (8.0 - 8.9đ)</span>
                      <span>{gradeDistribution.good.count} em ({gradeDistribution.good.percent}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-[#5A5A40] h-full rounded-full transition-all duration-500" style={{ width: `${gradeDistribution.good.percent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-[#E67E22]">Khá (6.5 - 7.9đ)</span>
                      <span>{gradeDistribution.fair.count} em ({gradeDistribution.fair.percent}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-[#E67E22] h-full rounded-full transition-all duration-500" style={{ width: `${gradeDistribution.fair.percent}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-[#3D3D2D] mb-1">
                      <span className="text-red-700">Cần cố gắng (&lt; 6.5đ)</span>
                      <span>{gradeDistribution.average.count} em ({gradeDistribution.average.percent}%)</span>
                    </div>
                    <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full transition-all duration-500" style={{ width: `${gradeDistribution.average.percent}%` }} />
                    </div>
                  </div>

                  {gradeDistribution.unattempted.count > 0 && (
                    <div>
                      <div className="flex justify-between font-bold text-[#8A8A70] mb-1">
                        <span>Chưa thi thử lần nào</span>
                        <span>{gradeDistribution.unattempted.count} em ({gradeDistribution.unattempted.percent}%)</span>
                      </div>
                      <div className="w-full bg-[#FAF9F6] h-2 rounded-full border border-[#EAE7E0] overflow-hidden">
                        <div className="bg-[#C5C0B5] h-full rounded-full transition-all duration-500" style={{ width: `${gradeDistribution.unattempted.percent}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Performer Highlights */}
              <div className="bg-[#FAF9F6] rounded-[2.5rem] p-6 border border-[#D9D2C5] space-y-3">
                <div className="flex items-center space-x-2 text-[#5A5A40] font-bold text-sm">
                  <Award className="w-4 h-4 text-[#8BA888]" />
                  <span>Học sinh tiêu biểu & Chăm chỉ nhất</span>
                </div>

                <div className="space-y-2">
                  {allStudentStats.slice(0, 3).map(({ student, avgMath, avgEng }) => (
                    <div
                      key={student.id}
                      onClick={() => handleOpenStudentDetail(student)}
                      className="p-3 bg-white rounded-2xl border border-[#EAE7E0] hover:border-[#5A5A40] transition cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-xl ${student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-xs flex items-center justify-center`}
                        >
                          {student.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#3D3D2D] truncate">{student.name}</p>
                          <p className="text-[10px] text-[#8A8A70] truncate">{student.targetSchool}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-[#5A5A40]">
                          T: {avgMath} • A: {avgEng}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB: STUDENT ROSTER                                                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'students' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px] relative">
              <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchStudentQuery}
                onChange={(e) => setSearchStudentQuery(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email, trường THPT mục tiêu..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#8A8A70]">
                Hiển thị <strong>{filteredStudents.length}</strong> / {totalStudents} học sinh
              </span>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm học sinh</span>
              </button>
            </div>
          </div>

          {/* Student Cards Roster Table */}
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FAF9F6] text-[#8A8A70] uppercase font-bold border-b border-[#EAE7E0]">
                  <tr>
                    <th className="p-3.5">Học sinh Lớp 9</th>
                    <th className="p-3.5">Trường NV1</th>
                    <th className="p-3.5 text-center">Dự đoán Toán</th>
                    <th className="p-3.5 text-center">Dự đoán Anh</th>
                    <th className="p-3.5 text-center">Đề đã làm</th>
                    <th className="p-3.5 text-center">Câu sai tồn</th>
                    <th className="p-3.5 text-center">Chuỗi ngày</th>
                    <th className="p-3.5 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F2ED]">
                  {filteredStudents.map(({ student, avgMath, avgEng, totalAttemptsCount, activeMistakesCount }) => {
                    const isLocked = student.isLocked;
                    return (
                      <tr key={student.id} className="hover:bg-[#FAF9F6] transition">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl ${student.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                            >
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#3D3D2D] leading-snug">{student.name}</p>
                              <p className="text-[10px] text-[#8A8A70]">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-[#4A4A4A] font-medium max-w-[160px] truncate">
                          {student.targetSchool || 'THPT Chu Văn An'}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-sm text-[#5A5A40]">{avgMath}</span>
                          <span className="text-[10px] text-[#8A8A70] block">/ {student.targetScoreMath || 8.5}đ</span>
                        </td>

                        <td className="p-3.5 text-center">
                          <span className="font-bold text-sm text-[#5A5A40]">{avgEng}</span>
                          <span className="text-[10px] text-[#8A8A70] block">/ {student.targetScoreEnglish || 8.5}đ</span>
                        </td>

                        <td className="p-3.5 text-center font-bold text-[#3D3D2D]">
                          {totalAttemptsCount} bài
                        </td>

                        <td className="p-3.5 text-center">
                          {activeMistakesCount > 0 ? (
                            <span className="px-2 py-0.5 bg-[#FDF2E9] text-[#E67E22] font-bold rounded-md">
                              {activeMistakesCount} câu
                            </span>
                          ) : (
                            <span className="text-[#8BA888] font-bold">0</span>
                          )}
                        </td>

                        <td className="p-3.5 text-center font-bold text-[#E67E22]">
                          🔥 {student.streakDays || 1} ngày
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenStudentDetail(student)}
                              className="px-2.5 py-1 bg-[#5A5A40] text-white hover:bg-[#3D3D2D] rounded-xl text-[11px] font-bold shadow-2xs transition cursor-pointer"
                              title="Xem chi tiết 360 độ"
                            >
                              Chi tiết
                            </button>

                            <button
                              onClick={() => {
                                switchUser(student.id);
                              }}
                              className="p-1.5 bg-[#FAF9F6] border border-[#D9D2C5] text-[#5A5A40] hover:bg-[#E8E2D9] rounded-xl text-[11px] font-bold transition cursor-pointer"
                              title="Chuyển sang đăng nhập tài khoản học sinh này"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => toggleUserLock(student.id)}
                              className="p-1.5 text-[#8A8A70] hover:text-[#C0392B] rounded-xl transition cursor-pointer"
                              title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              {isLocked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📚 TAB: QUESTIONS BANK                                                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'questions' && (() => {
        const mathQCount = questions.filter((q) => q.subject === 'math').length;
        const engQCount = questions.filter((q) => (q.subject || 'english') === 'english').length;

        const filteredQuestions = questions.filter((q) => {
          if (questionSubjectFilter === 'math' && q.subject !== 'math') return false;
          if (questionSubjectFilter === 'english' && (q.subject || 'english') !== 'english') return false;
          if (selectedQuestionTopic !== 'all' && q.topicId !== selectedQuestionTopic) return false;
          if (
            searchQuestionQuery &&
            !q.content.toLowerCase().includes(searchQuestionQuery.toLowerCase()) &&
            !q.explanation.toLowerCase().includes(searchQuestionQuery.toLowerCase())
          ) {
            return false;
          }
          return true;
        });

        return (
          <div className="space-y-4 animate-in fade-in">
            {/* Header Toolbar */}
            <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Subject Tabs */}
              <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold shrink-0">
                <button
                  onClick={() => setQuestionSubjectFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    questionSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  onClick={() => setQuestionSubjectFilter('math')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    questionSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  <span>📐 Toán ({mathQCount})</span>
                </button>
                <button
                  onClick={() => setQuestionSubjectFilter('english')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    questionSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  <span>🇬🇧 Tiếng Anh ({engQCount})</span>
                </button>
              </div>

              {/* Search & Topic Selector */}
              <div className="flex flex-1 items-center space-x-2 min-w-0">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuestionQuery}
                    onChange={(e) => setSearchQuestionQuery(e.target.value)}
                    placeholder="Tìm câu hỏi, công thức, từ vựng..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                  />
                </div>

                <select
                  value={selectedQuestionTopic}
                  onChange={(e) => setSelectedQuestionTopic(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-[#4A4A4A] outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả chuyên đề</option>
                  {(questionSubjectFilter === 'all' || questionSubjectFilter === 'math') && (
                    <optgroup label="📐 Môn Toán">
                      {MATH_TOPICS_META.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameVi}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {(questionSubjectFilter === 'all' || questionSubjectFilter === 'english') && (
                    <optgroup label="🇬🇧 Môn Tiếng Anh">
                      {TOPICS_META.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameVi}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setShowAiQModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>✨ AI Soạn Câu Hỏi</span>
                </button>

                <button
                  onClick={() => {
                    setEditingQ(null);
                    setQSubject(questionSubjectFilter === 'math' ? 'math' : 'english');
                    setTopicId(questionSubjectFilter === 'math' ? 'math_can_thuc' : 'grammar');
                    setContent('');
                    setOpt0('A. ');
                    setOpt1('B. ');
                    setOpt2('C. ');
                    setOpt3('D. ');
                    setCorrectOption(0);
                    setExplanation('');
                    setShowQModal(true);
                  }}
                  className="px-3.5 py-2 bg-[#8BA888] hover:bg-[#789675] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thủ công</span>
                </button>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE7E0] text-xs text-[#8A8A70]">
                  Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 bg-white rounded-[2rem] border border-[#EAE7E0] shadow-sm hover:border-[#D9D2C5] transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-lg border border-[#D9D2C5]">
                          #{idx + 1} • {q.subject === 'math' ? '📐 Toán' : '🇬🇧 Anh'} • {q.topicId.replace('math_', '').replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F5F2ED] text-[#6B6B54] uppercase">
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingQ(q);
                            setQSubject(q.subject || 'english');
                            setTopicId(q.topicId);
                            setContent(q.content);
                            setOpt0(q.options[0] || '');
                            setOpt1(q.options[1] || '');
                            setOpt2(q.options[2] || '');
                            setOpt3(q.options[3] || '');
                            setCorrectOption(q.correctOption);
                            setExplanation(q.explanation);
                            setShowQModal(true);
                          }}
                          className="p-1.5 text-[#8A8A70] hover:text-[#5A5A40] rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Bạn có chắc muốn xóa câu hỏi này?')) deleteQuestion(q.id);
                          }}
                          className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-[#3D3D2D] whitespace-pre-line">{q.content}</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl border whitespace-pre-line ${
                            oIdx === q.correctOption
                              ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold'
                              : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-[#8A8A70] pt-1 whitespace-pre-line">
                      <strong>Lời giải:</strong> {q.explanation}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 🎓 TAB: EXAMS LIST                                                        */}
      {/* ========================================================================= */}
      {activeAdminTab === 'exams' && (() => {
        const mathExamsCount = exams.filter((e) => e.subject === 'math').length;
        const engExamsCount = exams.filter((e) => (e.subject || 'english') === 'english').length;

        const filteredExams = exams.filter((ex) => {
          if (examSubjectFilter === 'math' && ex.subject !== 'math') return false;
          if (examSubjectFilter === 'english' && (ex.subject || 'english') !== 'english') return false;
          if (
            searchExamQuery &&
            !ex.title.toLowerCase().includes(searchExamQuery.toLowerCase()) &&
            !ex.code.toLowerCase().includes(searchExamQuery.toLowerCase())
          ) {
            return false;
          }
          return true;
        });

        return (
          <div className="space-y-4 animate-in fade-in">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm gap-3">
              {/* Subject Tabs */}
              <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold shrink-0">
                <button
                  onClick={() => setExamSubjectFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    examSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  Tất cả ({exams.length})
                </button>
                <button
                  onClick={() => setExamSubjectFilter('math')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    examSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  <span>📐 Đề Toán ({mathExamsCount})</span>
                </button>
                <button
                  onClick={() => setExamSubjectFilter('english')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${
                    examSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
                >
                  <span>🇬🇧 Đề Tiếng Anh ({engExamsCount})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchExamQuery}
                  onChange={(e) => setSearchExamQuery(e.target.value)}
                  placeholder="Tìm theo tên đề, mã đề thi..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  onClick={() => setShowAiCreateModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Wand2 className="w-4 h-4 text-amber-300" />
                  <span>🤖 AI Tạo Đề Mới</span>
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>📄 Upload & Trích Xuất</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedQIds(questions.slice(0, 12).map((q) => q.id));
                    setShowExamModal(true);
                  }}
                  className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo thủ công</span>
                </button>
              </div>
            </div>

            {/* 2 Feature Card Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Create Card */}
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white p-5 rounded-[2rem] shadow-md space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">🤖 AI Tạo Đề Tuyển Sinh Tự Động</h4>
                    <p className="text-[11px] text-blue-100">Gemini AI biên soạn đề chuẩn Toán & Tiếng Anh</p>
                  </div>
                </div>
                <ul className="text-[11px] text-blue-100 space-y-1 pl-1">
                  <li>✓ Chọn môn học (Toán học / Tiếng Anh), số lượng câu, độ khó</li>
                  <li>✓ Nhập yêu cầu chuyên đề trọng tâm theo ý muốn</li>
                  <li>✓ Tự động lưu đề thi và import câu hỏi vào hệ thống</li>
                </ul>
                <button
                  onClick={() => setShowAiCreateModal(true)}
                  className="w-full py-2 bg-white text-[#1E3A8A] font-bold text-xs rounded-xl hover:bg-blue-50 transition cursor-pointer"
                >
                  Tạo đề với AI ngay →
                </button>
              </div>

              {/* Upload Extract Card */}
              <div className="bg-gradient-to-br from-amber-600 to-orange-500 text-white p-5 rounded-[2rem] shadow-md space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-200" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">📄 Upload Đề Thi & AI Trích Xuất</h4>
                    <p className="text-[11px] text-orange-100">Tự động đọc file Word (.docx), PDF, ảnh chụp OCR</p>
                  </div>
                </div>
                <ul className="text-[11px] text-orange-100 space-y-1 pl-1">
                  <li>✓ Hỗ trợ file PDF, Word, ảnh chụp đề thi hoặc dán text</li>
                  <li>✓ AI tự động nhận diện câu hỏi, 4 đáp án và tạo lời giải</li>
                  <li>✓ Lưu thành đề thi hoàn chỉnh và có thể giao cho em ngay</li>
                </ul>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full py-2 bg-white text-orange-700 font-bold text-xs rounded-xl hover:bg-orange-50 transition cursor-pointer"
                >
                  Upload đề thi ngay →
                </button>
              </div>
            </div>

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.length === 0 ? (
                <div className="col-span-2 p-8 text-center bg-white rounded-3xl border border-[#EAE7E0] text-xs text-[#8A8A70]">
                  Không tìm thấy đề thi nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredExams.map((ex) => (
                  <div
                    key={ex.id}
                    className="bg-white p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`px-2.5 py-1 font-bold text-xs rounded-xl border ${
                        ex.subject === 'math'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-[#F5F2ED] text-[#5A5A40] border-[#D9D2C5]'
                      }`}>
                        {ex.subject === 'math' ? '📐 Môn Toán' : '🇬🇧 Môn Tiếng Anh'} • {ex.code}
                      </span>
                      <span className="text-xs text-[#8A8A70]">{ex.timeLimitMinutes} phút</span>
                    </div>

                    <h4 className="font-bold text-base text-[#3D3D2D]">{ex.title}</h4>
                    <p className="text-xs text-[#8A8A70] line-clamp-2">{ex.description}</p>

                    <div className="pt-3 border-t border-[#F5F2ED] flex justify-between items-center text-xs">
                      <span className="text-[#8A8A70]">
                        Số câu: <strong>{ex.questionIds.length} câu</strong>
                      </span>
                      <button
                        onClick={() => {
                          if (confirm('Xóa đề thi này khỏi hệ thống?')) deleteExam(ex.id);
                        }}
                        className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                      >
                        Xóa đề
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: REMOTE TASK ASSIGNMENT (GIAO NHIỆM VỤ CHO EM TỪ XA)            */}
      {/* ========================================================================= */}
      {showAssignTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                  <Send className="w-4 h-4 text-[#8BA888]" />
                </div>
                <h3 className="font-bold text-[#3D3D2D] text-base">Giao Bài Tập & Nhắc Nhở Từ Xa</h3>
              </div>
              <button
                onClick={() => setShowAssignTaskModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRemoteTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Giao cho ai:</label>
                <select
                  value={taskTargetStudentId}
                  onChange={(e) => setTaskTargetStudentId(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold text-[#3D3D2D]"
                >
                  {studentUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.targetSchool})
                    </option>
                  ))}
                  <option value="all">📢 Tất cả học sinh trong lớp</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Môn học:</label>
                  <select
                    value={taskSubject}
                    onChange={(e) => {
                      const s = e.target.value as SubjectId;
                      setTaskSubject(s);
                      setTaskAssignedExamId(s === 'math' ? 'math_exam_official_01' : 'exam_official_01');
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  >
                    <option value="math">📐 Môn Toán</option>
                    <option value="english">🇬🇧 Môn Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Chỉ định đề thi:</label>
                  <select
                    value={taskAssignedExamId}
                    onChange={(e) => {
                      setTaskAssignedExamId(e.target.value);
                      const found = exams.find((x) => x.id === e.target.value);
                      if (found) setTaskTitle(found.title);
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    {exams
                      .filter((ex) => (ex.subject || 'english') === taskSubject)
                      .map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.code} - {ex.title.slice(0, 24)}...
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Tiêu đề nhiệm vụ:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Lời nhắn & Dặn dò của bạn:</label>
                <textarea
                  rows={2}
                  value={taskMessage}
                  onChange={(e) => setTaskMessage(e.target.value)}
                  placeholder="Ví dụ: Em nhớ căn giờ 60 phút và làm kỹ bài hình tứ giác nội tiếp nhé!"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                  required
                />
              </div>

              {taskSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã phát sóng nhiệm vụ thời gian thực đến học sinh!</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi nhiệm vụ ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL: STUDENT 360° DETAILED PERFORMANCE INSPECTOR                     */}
      {/* ========================================================================= */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] max-h-[92vh] overflow-y-auto space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#F5F2ED] gap-3">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl ${selectedStudentForDetail.avatarColor || 'bg-[#5A5A40]'} text-white font-bold text-lg flex items-center justify-center shadow-md`}
                >
                  {selectedStudentForDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-[#3D3D2D]">{selectedStudentForDetail.name}</h3>
                    <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] rounded-lg text-[11px] font-bold">
                      Học sinh Lớp 9
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8A70]">
                    {selectedStudentForDetail.email} • Nguyện vọng 1: <strong>{selectedStudentForDetail.targetSchool}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    switchUser(selectedStudentForDetail.id);
                    setSelectedStudentForDetail(null);
                  }}
                  className="px-3.5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Đăng nhập tư cách học sinh này</span>
                </button>

                <button
                  onClick={() => setSelectedStudentForDetail(null)}
                  className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Student Quick Scores Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#D9D2C5]">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Môn Toán</span>
                <p className="text-lg font-extrabold text-[#5A5A40]">
                  {selectedStudentForDetail.targetScoreMath || 8.5}/10
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Tiếng Anh</span>
                <p className="text-lg font-extrabold text-[#5A5A40]">
                  {selectedStudentForDetail.targetScoreEnglish || 8.5}/10
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Chuỗi ngày chuyên cần</span>
                <p className="text-lg font-extrabold text-[#E67E22]">
                  🔥 {selectedStudentForDetail.streakDays || 1} ngày
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Trạng thái tài khoản</span>
                <p className="text-sm font-bold text-[#8BA888]">
                  {selectedStudentForDetail.isLocked ? '🔒 Đang khóa' : '✓ Hoạt động'}
                </p>
              </div>
            </div>

            {/* Exam Attempts History for this student */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <GraduationCap className="w-4 h-4 text-[#5A5A40]" />
                <span>Lịch Sử Bài Thi Thử Đã Hoàn Thành:</span>
              </h4>

              {getUserScopedData(selectedStudentForDetail.id).examAttempts.length === 0 ? (
                <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-center text-xs text-[#8A8A70]">
                  Học sinh chưa hoàn thành bài thi thử nào.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                  {getUserScopedData(selectedStudentForDetail.id).examAttempts.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#D9D2C5] transition flex items-center justify-between text-xs gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="font-bold text-[#3D3D2D] truncate">{att.examTitle}</span>
                          <span className="px-2 py-0.5 bg-white rounded-lg text-[10px] font-bold text-[#5A5A40] border border-[#D9D2C5]">
                            {att.subject === 'math' ? '📐 Môn Toán' : '🇬🇧 Môn Tiếng Anh'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8A8A70]">
                          Thời gian: {Math.round((att.timeSpentSeconds || 1800) / 60)} phút • Ngày {new Date(att.date).toLocaleDateString('vi-VN')}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <span className="text-base font-extrabold text-[#5A5A40]">{att.score.toFixed(2)}đ</span>
                          <span className="text-[10px] text-[#8BA888] block font-semibold">
                            {att.correctCount}/{att.totalQuestions} câu đúng
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedAttemptForReview({
                              attempt: att,
                              studentName: selectedStudentForDetail.name,
                            });
                          }}
                          className="px-3 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Mistakes for this student */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <BookMarked className="w-4 h-4 text-[#E67E22]" />
                <span>Sổ Câu Sai Cần Bồi Dưỡng Của Học Sinh:</span>
              </h4>

              {Object.keys(getUserScopedData(selectedStudentForDetail.id).mistakes || {}).length === 0 ? (
                <div className="p-4 bg-[#EBF2EB] rounded-2xl border border-[#8BA888]/30 text-center text-xs text-emerald-800 font-medium">
                  Không có câu sai tồn đọng! Học sinh đã nắm chắc kiến thức.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                  {(Object.values(getUserScopedData(selectedStudentForDetail.id).mistakes || {}) as MistakeItem[]).map((m, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 bg-[#FDF2E9] text-[#E67E22] font-bold rounded text-[10px]">
                          Sai {m.wrongCount} lần
                        </span>
                        <span className="text-[10px] text-[#8A8A70] uppercase font-bold">
                          {m.subject === 'math' ? 'Toán' : 'Anh'}
                        </span>
                      </div>
                      <p className="text-[#3D3D2D] font-medium line-clamp-2">
                        Mã câu hỏi: <code className="font-mono text-[11px]">{m.questionId}</code>
                      </p>
                      {m.userNote && (
                        <p className="text-[11px] text-[#5A5A40] italic bg-white p-1.5 rounded border border-[#EAE7E0]">
                          💡 {m.userNote}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Feedback / Pedagogical Note Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#5A5A40]/10 border border-[#5A5A40]/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#5A5A40] font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                  <span>Lời dặn dò & Nhận xét của Giáo viên dành cho em {selectedStudentForDetail.name}:</span>
                </div>
                {teacherNoteSaved && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã lưu nhận xét!</span>
                  </span>
                )}
              </div>

              <textarea
                rows={2}
                value={teacherNoteInput}
                onChange={(e) => setTeacherNoteInput(e.target.value)}
                placeholder="Ví dụ: Em cần chú ý hơn dạng toán Vi-ét đối xứng và câu bị động kép. Tối nay hoàn thành 1 đề tốc độ nhé!"
                className="w-full p-3 bg-white border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleSaveTeacherNote}
                  className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu nhận xét sư phạm</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ MODAL: ADD NEW STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#3D3D2D] text-base">Thêm Học Sinh Mới</h3>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStudentName.trim() || !newStudentEmail.trim()) {
                  setAddStudentMsg('Vui lòng điền đầy đủ tên và email.');
                  return;
                }
                const res = register({
                  name: newStudentName.trim(),
                  email: newStudentEmail.trim().toLowerCase(),
                  password: newStudentPassword.trim() || '123',
                  targetSchool: newStudentSchool.trim(),
                  targetScoreMath: newStudentTargetMath,
                  targetScoreEnglish: newStudentTargetEng,
                  targetScore: parseFloat(((newStudentTargetMath + newStudentTargetEng) / 2).toFixed(2)),
                });
                if (res.success) {
                  setShowAddStudentModal(false);
                  setNewStudentName('');
                  setNewStudentEmail('');
                  setAddStudentMsg(null);
                } else {
                  setAddStudentMsg(res.message || 'Lỗi khi tạo học sinh');
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Họ và tên học sinh (*):</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Minh Tuấn"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Email đăng nhập (*):</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                  placeholder="minhtuan.lop9@gmail.com"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Mật khẩu ban đầu:</label>
                <input
                  type="text"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  placeholder="Mặc định: 123"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Trường THPT Nguyện vọng 1:</label>
                <input
                  type="text"
                  value={newStudentSchool}
                  onChange={(e) => setNewStudentSchool(e.target.value)}
                  placeholder="THPT Chu Văn An / THPT Kim Liên"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Mục tiêu Môn Toán:</label>
                  <input
                    type="number"
                    step="0.25"
                    min="5"
                    max="10"
                    value={newStudentTargetMath}
                    onChange={(e) => setNewStudentTargetMath(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Mục tiêu Tiếng Anh:</label>
                  <input
                    type="number"
                    step="0.25"
                    min="5"
                    max="10"
                    value={newStudentTargetEng}
                    onChange={(e) => setNewStudentTargetEng(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              {addStudentMsg && (
                <p className="text-red-600 font-medium text-[11px]">{addStudentMsg}</p>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Tạo học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">
                {editingQ ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
              </h3>
              <button
                onClick={() => setShowQModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const qData = {
                  subject: qSubject,
                  topicId,
                  subTopicId,
                  difficulty,
                  content,
                  passage: passage.trim() ? passage : undefined,
                  options: [opt0, opt1, opt2, opt3],
                  correctOption,
                  explanation,
                  grammarRule: grammarRule.trim() ? grammarRule : undefined,
                  commonMistakeTip: commonMistakeTip.trim() ? commonMistakeTip : undefined,
                };
                if (editingQ) {
                  updateQuestion(editingQ.id, qData);
                } else {
                  addQuestion(qData);
                }
                setShowQModal(false);
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Môn học:</label>
                  <select
                    value={qSubject}
                    onChange={(e) => {
                      const s = e.target.value as SubjectId;
                      setQSubject(s);
                      setTopicId(s === 'math' ? 'math_can_thuc' : 'grammar');
                    }}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="math">📐 Môn Toán</option>
                    <option value="english">🇬🇧 Môn Tiếng Anh</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Chuyên đề:</label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value as TopicId)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    {(qSubject === 'math' ? MATH_TOPICS_META : TOPICS_META).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Độ khó:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="easy">Nhận biết (Dễ)</option>
                    <option value="medium">Thông hiểu (Vừa)</option>
                    <option value="hard">Vận dụng (Khó)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Nội dung câu hỏi / Đề bài (*):
                </label>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#4A4A4A]">4 Phương án lựa chọn:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={opt0}
                    onChange={(e) => setOpt0(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Đáp án đúng:</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(parseInt(e.target.value))}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                >
                  <option value={0}>Đáp án A</option>
                  <option value={1}>Đáp án B</option>
                  <option value={2}>Đáp án C</option>
                  <option value={3}>Đáp án D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Lời giải chi tiết & Phương pháp giải (*):
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Lưu câu hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">Tạo Đề Thi Tuyển Sinh Mới</h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addExam({
                  subject: examSubject,
                  title: examTitle,
                  code: examCode,
                  description: examDesc,
                  targetProvince: 'Toàn quốc',
                  timeLimitMinutes: examTime,
                  totalQuestions: selectedQIds.length,
                  difficulty: 'standard',
                  questionIds: selectedQIds.length > 0 ? selectedQIds : questions.slice(0, 10).map((q) => q.id),
                  isOfficialFormat: true,
                });
                setShowExamModal(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Môn thi:</label>
                  <select
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value as SubjectId)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="math">📐 Toán Học</option>
                    <option value="english">🇬🇧 Tiếng Anh</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Mã đề:</label>
                  <input
                    type="text"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Tên đề thi:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ví dụ: Đề thi thử Sở GD&ĐT Hà Nội - Đợt 2"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Mô tả cấu trúc:</label>
                <textarea
                  rows={2}
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Tạo đề thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Cloud DB & Room Key Modal */}
      <CloudSyncModal
        isOpen={showCloudModal}
        onClose={() => setShowCloudModal(false)}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ✨ MODAL: AI SOẠN CÂU HỎI TỰ ĐỘNG                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showAiQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">✨ AI Soạn Câu Hỏi Tự Động</h3>
                  <p className="text-[11px] text-[#8A8A70]">Gemini AI tạo câu hỏi chuẩn 4 đáp án & lời giải chi tiết</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiQModal(false);
                  setAiQSuccessMsg('');
                  setAiQError('');
                }}
                className="text-[#8A8A70] hover:text-red-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {aiQSuccessMsg ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <h4 className="font-bold text-[#3D3D2D] text-lg">Soạn câu hỏi thành công!</h4>
                <p className="text-sm text-[#5A5A40]">{aiQSuccessMsg}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => {
                      setAiQSuccessMsg('');
                      setAiQPrompt('');
                    }}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Soạn tiếp
                  </button>
                  <button
                    onClick={() => {
                      setShowAiQModal(false);
                      setAiQSuccessMsg('');
                      setActiveAdminTab('questions');
                    }}
                    className="px-5 py-2 bg-[#F5F2ED] text-[#3D3D2D] rounded-xl text-sm font-bold hover:bg-[#EAE7E0] cursor-pointer"
                  >
                    Xem ngân hàng câu hỏi
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Môn học</label>
                  <div className="flex gap-2">
                    {(['math', 'english'] as SubjectId[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setAiQSubject(s);
                          setAiQTopicId(s === 'math' ? 'math_pt_bac_hai_viet' : 'grammar');
                        }}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          aiQSubject === s
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-[#F5F2ED] text-[#5A5A40] border-[#EAE7E0]'
                        }`}
                      >
                        {s === 'math' ? '📐 Môn Toán' : '🇬🇧 Môn Tiếng Anh'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chuyên đề */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Chuyên đề mục tiêu</label>
                  <select
                    value={aiQTopicId}
                    onChange={(e) => setAiQTopicId(e.target.value)}
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    {aiQSubject === 'math'
                      ? MATH_TOPICS_META.map((t) => (
                          <option key={t.id} value={t.id}>
                            📐 {t.nameVi}
                          </option>
                        ))
                      : TOPICS_META.map((t) => (
                          <option key={t.id} value={t.id}>
                            🇬🇧 {t.nameVi}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Số lượng & Độ khó */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Số lượng câu</label>
                    <select
                      value={aiQCount}
                      onChange={(e) => setAiQCount(Number(e.target.value))}
                      className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    >
                      {[1, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} câu hỏi
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Độ khó</label>
                    <select
                      value={aiQDiff}
                      onChange={(e) => setAiQDiff(e.target.value as any)}
                      className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    >
                      <option value="standard">Cơ bản (7 - 8đ)</option>
                      <option value="advanced">Khá - Giỏi (8 - 8.5đ)</option>
                      <option value="challenge">Phân loại (9 - 10đ)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">
                    Yêu cầu nội dung cụ thể (tuỳ chọn)
                  </label>
                  <textarea
                    value={aiQPrompt}
                    onChange={(e) => setAiQPrompt(e.target.value)}
                    rows={3}
                    placeholder={
                      aiQSubject === 'math'
                        ? 'Ví dụ: Soạn câu hỏi tìm m để phương trình x² - 2mx + m² - 1 = 0 có 2 nghiệm x₁, x₂ thỏa mãn x₁² + x₂² = 6...'
                        : 'Ví dụ: Soạn câu hỏi phân biệt thì Quá khứ đơn vs Hiện tại hoàn thành có bẫy về mốc thời gian since/for...'
                    }
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-400 focus:outline-none placeholder:text-[#C5C0B5]"
                  />
                </div>

                {/* Error */}
                {aiQError && (
                  <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200">
                    ⚠️ {aiQError}
                  </div>
                )}

                {/* Progress */}
                {aiQLoading && (
                  <div className="bg-indigo-50 text-indigo-700 text-xs font-medium p-3 rounded-xl border border-indigo-200 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>{aiQProgress || 'AI đang soạn câu hỏi và lời giải chi tiết...'}</span>
                  </div>
                )}

                <button
                  onClick={handleAiGenerateQuestions}
                  disabled={aiQLoading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {aiQLoading ? '⏳ Đang soạn câu hỏi...' : `🚀 AI Soạn ${aiQCount} Câu Hỏi Ngay`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🤖 MODAL: AI TẠO ĐỀ NHANH                                  */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showAiCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">🤖 AI Tạo Đề Mới</h3>
                  <p className="text-[11px] text-[#8A8A70]">Gemini AI biên soạn đề thi & lời giải chi tiết</p>
                </div>
              </div>
              <button onClick={() => { setShowAiCreateModal(false); setAiCreateResult(null); setAiCreateError(''); }} className="text-[#8A8A70] hover:text-red-500 cursor-pointer">✕</button>
            </div>

            {aiCreateResult ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <h4 className="font-bold text-[#3D3D2D] text-lg">Tạo đề thành công!</h4>
                <p className="text-sm text-[#5A5A40]">AI đã tạo <strong>{aiCreateResult.questionCount} câu hỏi</strong> và lưu vào hệ thống.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setAiCreateResult(null); setAiCreatePrompt(''); }} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 cursor-pointer">Tạo đề khác</button>
                  <button onClick={() => { setShowAiCreateModal(false); setAiCreateResult(null); setActiveAdminTab('exams'); }} className="px-5 py-2 bg-[#F5F2ED] text-[#3D3D2D] rounded-xl text-sm font-bold hover:bg-[#EAE7E0] cursor-pointer">Xem danh sách</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Môn học</label>
                  <div className="flex gap-2">
                    {(['math', 'english'] as SubjectId[]).map((s) => (
                      <button key={s} onClick={() => setAiCreateSubject(s)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${aiCreateSubject === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-[#F5F2ED] text-[#5A5A40] border-[#EAE7E0]'}`}>
                        {s === 'math' ? '📐 Toán học' : '🇬🇧 Tiếng Anh'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Số câu & Độ khó */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Số câu hỏi</label>
                    <select value={aiCreateCount} onChange={(e) => setAiCreateCount(Number(e.target.value))}
                      className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-blue-400 focus:outline-none">
                      {[5, 10, 15, 20, 25, 30].map((n) => <option key={n} value={n}>{n} câu</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Độ khó</label>
                    <select value={aiCreateDiff} onChange={(e) => setAiCreateDiff(e.target.value as any)}
                      className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-blue-400 focus:outline-none">
                      <option value="standard">Cơ bản (Trung bình)</option>
                      <option value="advanced">Khá - Giỏi</option>
                      <option value="challenge">Phân loại (Khó)</option>
                    </select>
                  </div>
                </div>

                {/* Custom Prompt */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Yêu cầu trọng tâm (tuỳ chọn)</label>
                  <textarea
                    value={aiCreatePrompt}
                    onChange={(e) => setAiCreatePrompt(e.target.value)}
                    rows={3}
                    placeholder={aiCreateSubject === 'math'
                      ? 'Ví dụ: Tập trung vào hệ phương trình, Vi-ét và hình học đường tròn. Tăng tỉ lệ câu khó...'
                      : 'Ví dụ: Tập trung ngữ pháp thì hoàn thành và câu điều kiện. Có cả dạng cloze test...'}
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-[#C5C0B5]"
                  />
                </div>

                {/* Error */}
                {aiCreateError && (
                  <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200">
                    ⚠️ {aiCreateError}
                  </div>
                )}

                {/* Progress */}
                {aiCreateLoading && (
                  <div className="bg-blue-50 text-blue-700 text-xs font-medium p-3 rounded-xl border border-blue-200 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>{aiCreateProgress || 'Đang khởi tạo...'}</span>
                  </div>
                )}

                <button
                  onClick={handleAiCreateExam}
                  disabled={aiCreateLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] text-white font-bold text-sm rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {aiCreateLoading ? '⏳ AI đang tạo đề...' : `🚀 Tạo ${aiCreateCount} câu hỏi ngay`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📄 MODAL: UPLOAD ĐỀ & AI EXTRACT                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">📄 Upload Đề & AI Extract</h3>
                  <p className="text-[11px] text-[#8A8A70]">AI tự đọc file và trích xuất câu hỏi trắc nghiệm</p>
                </div>
              </div>
              <button onClick={() => { setShowUploadModal(false); setUploadResult(null); setUploadError(''); setUploadFileContent(''); setUploadFileName(''); }} className="text-[#8A8A70] hover:text-red-500 cursor-pointer">✕</button>
            </div>

            {uploadResult ? (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">✅</span>
                </div>
                <h4 className="font-bold text-[#3D3D2D] text-lg">Import thành công!</h4>
                <p className="text-sm text-[#5A5A40]">AI đã trích xuất <strong>{uploadResult.questionCount} câu hỏi</strong> và lưu vào hệ thống.</p>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { setUploadResult(null); setUploadFileContent(''); setUploadFileName(''); setUploadTitle(''); }} className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 cursor-pointer">Upload thêm</button>
                  <button onClick={() => { setShowUploadModal(false); setUploadResult(null); setActiveAdminTab('exams'); }} className="px-5 py-2 bg-[#F5F2ED] text-[#3D3D2D] rounded-xl text-sm font-bold hover:bg-[#EAE7E0] cursor-pointer">Xem danh sách</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Môn học của đề</label>
                  <div className="flex gap-2">
                    {(['math', 'english'] as SubjectId[]).map((s) => (
                      <button key={s} onClick={() => setUploadSubject(s)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${uploadSubject === s ? 'bg-amber-600 text-white border-amber-600' : 'bg-[#F5F2ED] text-[#5A5A40] border-[#EAE7E0]'}`}>
                        {s === 'math' ? '📐 Toán học' : '🇬🇧 Tiếng Anh'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tên đề */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Tên đề thi</label>
                  <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="Ví dụ: Đề Thi Thử Toán HK2 2024 - Trường ABC"
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none" />
                </div>

                {/* Upload Zone */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5 flex items-center justify-between">
                    <span>Chọn file đề thi bất kỳ</span>
                    <span className="text-[10px] text-[#8A8A70]">PDF • Word (.docx) • Ảnh • TXT</span>
                  </label>
                  <label className="flex flex-col items-center justify-center w-full min-h-[100px] p-4 border-2 border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100/70 rounded-2xl cursor-pointer transition">
                    <Upload className="w-6 h-6 text-amber-600 mb-1.5" />
                    {uploadReading ? (
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                        <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                        <span>{uploadProgress || 'Đang đọc và phân tích file...'}</span>
                      </div>
                    ) : uploadFileMeta ? (
                      <div className="text-center space-y-0.5">
                        <span className="text-xs font-bold text-amber-900 flex items-center justify-center space-x-1">
                          <span>{uploadFileMeta.type === 'pdf' ? '📕' : uploadFileMeta.type === 'docx' ? '📝' : uploadFileMeta.type === 'image' ? '🖼️' : '📄'}</span>
                          <span>{uploadFileMeta.name}</span>
                        </span>
                        <span className="text-[10px] text-amber-700 font-medium">({uploadFileMeta.size} • Đã đọc xong nội dung)</span>
                      </div>
                    ) : (
                      <div className="text-center space-y-1">
                        <span className="text-xs text-amber-800 font-bold">
                          Nhấn để chọn file đề thi (hoặc kéo thả vào đây)
                        </span>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-amber-600">
                          <span className="px-1.5 py-0.5 bg-amber-200/60 rounded">PDF</span>
                          <span className="px-1.5 py-0.5 bg-amber-200/60 rounded">Word</span>
                          <span className="px-1.5 py-0.5 bg-amber-200/60 rounded">Ảnh đề thi (OCR)</span>
                          <span className="px-1.5 py-0.5 bg-amber-200/60 rounded">TXT</span>
                        </div>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".txt,.md,.pdf,.docx,.doc,image/*,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileRead}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Paste / Extracted Content */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#5A5A40]">
                      Nội dung văn bản đề thi (AI sẽ đọc phần này)
                    </label>
                    {uploadFileContent && (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ {uploadFileContent.length.toLocaleString()} ký tự
                      </span>
                    )}
                  </div>
                  <textarea
                    value={uploadFileContent}
                    onChange={(e) => setUploadFileContent(e.target.value)}
                    rows={5}
                    placeholder={'Dán nội dung đề thi hoặc upload file ở trên...\n\nVí dụ:\nCâu 1. Cho hàm số y = 2x - 3...\nA. Đồng biến   B. Nghịch biến   C. Hằng số   D. Vô nghiệm\n\nCâu 2. ...'}
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-xs font-mono resize-none focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder:text-[#C5C0B5] bg-[#FAF9F5]"
                  />
                </div>

                {/* Note */}
                <div className="bg-amber-50/80 text-amber-900 text-[11px] p-3 rounded-xl border border-amber-200 flex items-start space-x-2">
                  <span className="text-sm">💡</span>
                  <div>
                    <strong>Hỗ trợ toàn diện:</strong> File Word (.docx), PDF scan, ảnh chụp đề thi trên giấy (Gemini Vision tự động nhận diện chữ), hoặc dán văn bản trực tiếp. AI sẽ tự động phân tách câu hỏi, 4 đáp án A/B/C/D và tạo lời giải.
                  </div>
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl border border-red-200">
                    ⚠️ {uploadError}
                  </div>
                )}

                {/* Progress */}
                {uploadLoading && (
                  <div className="bg-amber-50 text-amber-700 text-xs font-medium p-3 rounded-xl border border-amber-200 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span>{uploadProgress || 'Đang xử lý...'}</span>
                  </div>
                )}

                <button
                  onClick={handleExtractAndImport}
                  disabled={uploadLoading || (!uploadFileContent.trim())}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500 text-white font-bold text-sm rounded-2xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {uploadLoading ? '⏳ AI đang đọc đề...' : '🔍 Trích Xuất & Import Câu Hỏi'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔍 MODAL: XEM CHI TIẾT BÀI LÀM CỦA HỌC SINH                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {selectedAttemptForReview && (() => {
        const { attempt, studentName } = selectedAttemptForReview;
        const examObj = exams.find((e) => e.id === attempt.examId);

        // Collect question list
        let reviewQuestions: Question[] = [];
        if (examObj && examObj.questionIds && examObj.questionIds.length > 0) {
          reviewQuestions = examObj.questionIds
            .map((qId) => getQuestionById(qId))
            .filter((q): q is Question => Boolean(q));
        }

        // If not found in examObj, look up from attempt.userAnswers keys
        if (reviewQuestions.length === 0 && attempt.userAnswers) {
          reviewQuestions = Object.keys(attempt.userAnswers)
            .map((qId) => getQuestionById(qId))
            .filter((q): q is Question => Boolean(q));
        }

        // If still empty, try questions filtered by subject
        if (reviewQuestions.length === 0) {
          reviewQuestions = questions.filter((q) => q.subject === attempt.subject).slice(0, attempt.totalQuestions || 10);
        }

        const totalQ = attempt.totalQuestions || reviewQuestions.length || 1;
        const correctQ = attempt.correctCount || 0;
        const wrongQ = attempt.incorrectCount || (totalQ - correctQ);
        const accuracy = Math.round((correctQ / totalQ) * 100);

        // Filter questions according to active tab
        const filteredList = reviewQuestions.filter((q) => {
          const userChoice = attempt.userAnswers?.[q.id];
          const isCorrect = userChoice !== undefined && userChoice === q.correctOption;
          if (attemptQuestionFilter === 'wrong') return !isCorrect;
          if (attemptQuestionFilter === 'correct') return isCorrect;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#FAF9F6] rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D9D2C5] overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-white border-b border-[#EAE7E0] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-2xl ${attempt.subject === 'math' ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'} text-white flex items-center justify-center font-bold text-base shadow-sm`}>
                    {attempt.subject === 'math' ? '📐' : '🇬🇧'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="font-bold text-[#3D3D2D] text-base sm:text-lg">{attempt.examTitle}</h3>
                      <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] font-extrabold text-[11px] rounded-full border border-[#D9D2C5]">
                        {attempt.subject === 'math' ? 'Toán 9 Vào 10' : 'Tiếng Anh 9 Vào 10'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8A8A70]">
                      Học sinh: <strong className="text-[#3D3D2D]">{studentName}</strong> • Nộp bài lúc {new Date(attempt.date).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAttemptForReview(null)}
                  className="p-2 rounded-xl bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#5A5A40] hover:text-red-500 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats Score Ribbon */}
              <div className="bg-[#FAF9F6] p-4 sm:p-5 border-b border-[#EAE7E0] shrink-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Điểm số đạt được</span>
                    <p className="text-xl sm:text-2xl font-black text-[#5A5A40]">{attempt.score.toFixed(2)} <span className="text-xs font-bold text-[#8A8A70]">/ 10đ</span></p>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Độ chính xác</span>
                    <p className="text-xl sm:text-2xl font-black text-emerald-700">{accuracy}% <span className="text-xs font-bold text-emerald-600">({correctQ}/{totalQ} câu)</span></p>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Số câu sai / bỏ qua</span>
                    <p className="text-xl sm:text-2xl font-black text-red-600">{wrongQ} <span className="text-xs font-bold text-red-500">câu</span></p>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Thời gian hoàn thành</span>
                    <p className="text-xl sm:text-2xl font-black text-[#E67E22]">
                      {Math.floor((attempt.timeSpentSeconds || 1800) / 60)} <span className="text-xs font-bold text-[#E67E22]">phút</span> {(attempt.timeSpentSeconds || 0) % 60}s
                    </p>
                  </div>
                </div>

                {/* Filter Selector */}
                <div className="flex bg-[#E8E2D9] p-1 rounded-2xl mt-3 max-w-md">
                  <button
                    onClick={() => setAttemptQuestionFilter('all')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                      attemptQuestionFilter === 'all'
                        ? 'bg-white text-[#3D3D2D] shadow-xs'
                        : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                    }`}
                  >
                    Tất cả ({reviewQuestions.length})
                  </button>
                  <button
                    onClick={() => setAttemptQuestionFilter('wrong')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
                      attemptQuestionFilter === 'wrong'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'text-red-700 hover:text-red-900'
                    }`}
                  >
                    <span>❌ Làm sai ({wrongQ})</span>
                  </button>
                  <button
                    onClick={() => setAttemptQuestionFilter('correct')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
                      attemptQuestionFilter === 'correct'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    <span>✅ Làm đúng ({correctQ})</span>
                  </button>
                </div>
              </div>

              {/* Question Review Scrollable Content */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {filteredList.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE7E0] text-xs text-[#8A8A70]">
                    Không có câu hỏi nào trong danh mục này.
                  </div>
                ) : (
                  filteredList.map((q, qIndex) => {
                    const studentChoice = attempt.userAnswers?.[q.id];
                    const isAnswered = studentChoice !== undefined && studentChoice !== -1;
                    const isCorrect = isAnswered && studentChoice === q.correctOption;

                    return (
                      <div
                        key={q.id || qIndex}
                        className={`p-5 rounded-[2rem] border transition space-y-3.5 bg-white ${
                          isCorrect
                            ? 'border-emerald-200 shadow-xs'
                            : isAnswered
                            ? 'border-red-200 shadow-xs'
                            : 'border-amber-200 shadow-xs'
                        }`}
                      >
                        {/* Question Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F5F2ED]">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="font-extrabold text-sm text-[#3D3D2D]">
                              Câu {qIndex + 1}
                            </span>
                            <span className="px-2.5 py-0.5 bg-[#FAF9F6] text-[#5A5A40] font-bold text-[10px] rounded-lg border border-[#EAE7E0]">
                              {q.topicId || 'Chuyên đề ôn thi'}
                            </span>
                            <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#8A8A70] text-[10px] rounded-lg">
                              Độ khó: {q.difficulty === 'easy' ? 'Cơ bản' : q.difficulty === 'medium' ? 'Trung bình' : q.difficulty === 'hard' ? 'Khá' : 'Phân loại'}
                            </span>
                          </div>

                          <div>
                            {isCorrect ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đúng (+{(10 / totalQ).toFixed(2)}đ)</span>
                              </span>
                            ) : isAnswered ? (
                              <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-red-300">
                                <X className="w-3.5 h-3.5 text-red-600" />
                                <span>Sai (0đ)</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-amber-300">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                <span>Chưa làm</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Passage if any */}
                        {q.passage && (
                          <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs text-[#5A5A40] italic leading-relaxed">
                            {q.passage}
                          </div>
                        )}

                        {/* Question Content */}
                        <div className="text-sm font-semibold text-[#3D3D2D] leading-relaxed">
                          {q.content}
                        </div>

                        {/* Options A, B, C, D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelectedByStudent = studentChoice === optIdx;
                            const isCorrectOpt = q.correctOption === optIdx;

                            let optStyle = 'bg-[#FAF9F6] border-[#EAE7E0] text-[#3D3D2D]';
                            let badge = null;

                            if (isSelectedByStudent && isCorrectOpt) {
                              optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-300/50';
                              badge = (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-extrabold flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Lựa chọn của em (Chính xác)</span>
                                </span>
                              );
                            } else if (isSelectedByStudent && !isCorrectOpt) {
                              optStyle = 'bg-red-50 border-red-400 text-red-900 font-bold ring-2 ring-red-300/50';
                              badge = (
                                <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-extrabold flex items-center space-x-1">
                                  <X className="w-3 h-3" />
                                  <span>Lựa chọn của em (Sai)</span>
                                </span>
                              );
                            } else if (isCorrectOpt) {
                              optStyle = 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold';
                              badge = (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold">
                                  ✓ Đáp án đúng
                                </span>
                              );
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-2xl border text-xs transition space-y-1 ${optStyle}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span className="leading-snug">{opt}</span>
                                </div>
                                {badge && <div className="pt-0.5">{badge}</div>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Detailed Step-by-Step Explanation Box */}
                        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs">
                          <div className="flex items-center space-x-1.5 text-[#5A5A40] font-bold">
                            <span>💡</span>
                            <span>Lời giải chi tiết & Phương pháp giải:</span>
                          </div>
                          <p className="text-[#3D3D2D] leading-relaxed whitespace-pre-line pl-4 border-l-2 border-[#5A5A40]">
                            {q.explanation || 'Không có lời giải chi tiết cho câu hỏi này.'}
                          </p>

                          {q.grammarRule && (
                            <div className="pt-2 border-t border-[#EAE7E0] flex items-start space-x-2 text-[#5A5A40]">
                              <span className="font-bold shrink-0">📐 Định lý / Quy tắc:</span>
                              <span className="font-medium text-[#3D3D2D]">{q.grammarRule}</span>
                            </div>
                          )}

                          {q.commonMistakeTip && (
                            <div className="pt-1.5 flex items-start space-x-2 text-[#E67E22]">
                              <span className="font-bold shrink-0">⚠️ Cảnh báo bẫy:</span>
                              <span className="font-medium">{q.commonMistakeTip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-[#EAE7E0] flex justify-between items-center shrink-0">
                <span className="text-xs text-[#8A8A70]">
                  Đang xem bài làm của <strong>{studentName}</strong> ({filteredList.length}/{reviewQuestions.length} câu)
                </span>
                <button
                  onClick={() => setSelectedAttemptForReview(null)}
                  className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đóng cửa sổ bài làm
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
