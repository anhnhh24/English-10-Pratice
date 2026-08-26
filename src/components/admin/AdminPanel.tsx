import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { DifficultyLevel, Question, TopicId, SubTopicId, Exam, ExamAttempt, UserAccount, SubjectId, RealtimeActivityEvent, MistakeItem, RemoteTaskAssignment } from '../../types';
import {
  getStoredRealtimeActivities,
  subscribeToRealtimeActivities,
  fetchLiveActivitiesFromFirebase,
  getStoredRemoteTasks,
  broadcastRemoteTask,
  subscribeToRemoteTasks,
  deleteRemoteTask,
  toggleRemoteTaskCompleted,
  logAndBroadcastActivity,
  sendRemotePing,
  adminConfirmRemoteTask,
  adminRequestRemoteTaskRedo,
  updateRemoteTaskDeadline,
} from '../../services/realtimeSyncService';
import { subscribeToGlobalSync } from '../../services/cookieService';
import { fetchRoomDataFromOnlineDB } from '../../services/cloudSyncService';
import { ScorePill, SubjectBadge, EmptyState } from '../common';
import { VocabManagementTab } from './VocabManagementTab';
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
  Filter,
  CheckCircle,
  XCircle,
  HelpCircle,
  Printer,
  Share2,
  ClipboardList,
  CheckSquare,
  Square,
  RotateCcw,
  Key,
  EyeOff,
} from 'lucide-react';
import { CloudSyncModal } from '../modals/CloudSyncModal';
import { formatDateVi, formatRelativeTime, formatTimeLimit, formatTopicTitle } from '../../utils/formatters';
import {
  generateExamWithAI,
  extractQuestionsFromText,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  validateApiKey,
  isApiKeyFromEnv,
  AVAILABLE_MODELS,
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
    updateUserByAdmin,
    deleteUser,
    getUserScopedData,
    saveTeacherNote,
    getTeacherNote,
    deleteTeacherNote,
    questions,
    exams,
    getQuestionById,
    addQuestion,
    bulkImportQuestions,
    updateQuestion,
    deleteQuestion,
    addExam,
    updateExam,
    deleteExam,
    deleteExamAttempt,
    vocabularyWords,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'overview' | 'tasks' | 'submissions' | 'exams' | 'students' | 'questions' | 'vocab' | 'realtime_pulse'>('overview');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState<string>('');
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<UserAccount | null>(null);

  // Assigned Tasks Management State (Quản lý bài tập đang giao)
  const [assignedTasks, setAssignedTasks] = useState<RemoteTaskAssignment[]>(() => getStoredRemoteTasks());
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'confirmed' | 'overdue'>('all');
  const [taskStudentFilter, setTaskStudentFilter] = useState<string>('all');
  const [taskSubjectFilter, setTaskSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');

  // Remote Task Modals: Confirmation, Redo, and Deadline Editing
  const [confirmModalTask, setConfirmModalTask] = useState<RemoteTaskAssignment | null>(null);
  const [confirmFeedback, setConfirmFeedback] = useState<string>('');
  const [redoModalTask, setRedoModalTask] = useState<RemoteTaskAssignment | null>(null);
  const [redoFeedback, setRedoFeedback] = useState<string>('');
  const [editDeadlineTask, setEditDeadlineTask] = useState<RemoteTaskAssignment | null>(null);
  const [editDeadlineInput, setEditDeadlineInput] = useState<string>('');

  // Exam preview & origin filter states
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<Exam | null>(null);
  const [examOriginFilter, setExamOriginFilter] = useState<'all' | 'ai' | 'upload' | 'official'>('all');

  // Submissions Tab Filter States
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState<string>('');
  const [submissionSubjectFilter, setSubmissionSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [submissionStudentFilter, setSubmissionStudentFilter] = useState<string>('all');
  const [submissionRev, setSubmissionRev] = useState<number>(0);

  // Detailed Exam Attempt Review State (Admin xem chi tiết bài làm của học sinh)
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<{
    attempt: ExamAttempt;
    studentName: string;
    studentId?: string;
  } | null>(null);
  const [attemptQuestionFilter, setAttemptQuestionFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [attemptTeacherNote, setAttemptTeacherNote] = useState<string>('');
  const [attemptTeacherNoteSaved, setAttemptTeacherNoteSaved] = useState<boolean>(false);

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
  const [taskDeadline, setTaskDeadline] = useState<string>('');
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

  // Exam form — shared between Create and Edit
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null); // null = create mode
  const [examSubject, setExamSubject] = useState<SubjectId>('math');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('DE-10-M04');
  const [examDesc, setExamDesc] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(60);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);
  const [examSubjectFilter, setExamSubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [searchExamQuery, setSearchExamQuery] = useState<string>('');

  // Edit Student Modal
  const [showEditStudentModal, setShowEditStudentModal] = useState<boolean>(false);
  const [editStudentTarget, setEditStudentTarget] = useState<UserAccount | null>(null);
  const [editStudentName, setEditStudentName] = useState<string>('');
  const [editStudentPassword, setEditStudentPassword] = useState<string>('');
  const [editStudentSchool, setEditStudentSchool] = useState<string>('');
  const [editStudentTargetMath, setEditStudentTargetMath] = useState<number>(8.5);
  const [editStudentTargetEng, setEditStudentTargetEng] = useState<number>(8.5);
  const [editStudentMsg, setEditStudentMsg] = useState<string | null>(null);

  // ── Gemini API Key Management State ─────────────────────────
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState<boolean>(false);
  const [adminApiKeyInput, setAdminApiKeyInput] = useState<string>(() => getStoredApiKey());
  const [adminKeyTesting, setAdminKeyTesting] = useState<boolean>(false);
  const [adminKeyValidationResult, setAdminKeyValidationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [adminKeySavedMsg, setAdminKeySavedMsg] = useState<boolean>(false);
  const [adminShowKeyText, setAdminShowKeyText] = useState<boolean>(false);
  const [adminSelectedModel, setAdminSelectedModel] = useState<string>('gemini-3.6-flash');

  // ── AI Tạo Đề Modal ──────────────────────────────────────────
  const [showAiCreateModal, setShowAiCreateModal] = useState<boolean>(false);
  const [aiCreateSubject, setAiCreateSubject] = useState<SubjectId>('math');
  const [aiCreatePrompt, setAiCreatePrompt] = useState<string>('');
  const [aiCreateCount, setAiCreateCount] = useState<number>(10);
  const [aiCreateDiff, setAiCreateDiff] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [aiCreateSelectedTopics, setAiCreateSelectedTopics] = useState<TopicId[]>([
    'math_can_thuc',
    'math_he_phuong_trinh',
    'math_pt_bac_hai_viet',
    'math_duong_tron_tu_giac',
  ]);
  const [aiCreateTopicDifficulties, setAiCreateTopicDifficulties] = useState<Record<string, 'easy' | 'medium' | 'hard' | 'expert'>>({
    math_can_thuc: 'easy',
    math_he_phuong_trinh: 'medium',
    math_pt_bac_hai_viet: 'hard',
    math_duong_tron_tu_giac: 'hard',
    math_bat_dang_thuc_cuc_tri: 'expert',
    pronunciation: 'easy',
    stress: 'easy',
    grammar: 'medium',
    vocabulary: 'medium',
    reading: 'hard',
    sentence_rewrite: 'hard',
  });
  const [aiCreateLoading, setAiCreateLoading] = useState<boolean>(false);
  const [aiCreateProgress, setAiCreateProgress] = useState<string>('');
  const [aiCreateResult, setAiCreateResult] = useState<{ examId: string; questionCount: number } | null>(null);
  const [aiCreateError, setAiCreateError] = useState<string>('');
  const [aiCreateModel, setAiCreateModel] = useState<string>('gemini-3.6-flash');

  const handleAiCreateSubjectChange = (s: SubjectId) => {
    setAiCreateSubject(s);
    if (s === 'math') {
      setAiCreateSelectedTopics(['math_can_thuc', 'math_he_phuong_trinh', 'math_pt_bac_hai_viet', 'math_duong_tron_tu_giac']);
    } else {
      setAiCreateSelectedTopics(['grammar', 'vocabulary', 'pronunciation', 'stress', 'sentence_rewrite']);
    }
  };

  const handleToggleAiCreateTopic = (tId: TopicId) => {
    setAiCreateSelectedTopics((prev) =>
      prev.includes(tId) ? prev.filter((x) => x !== tId) : [...prev, tId]
    );
  };

  const handleSetAiCreateTopicDiff = (tId: string, diff: 'easy' | 'medium' | 'hard' | 'expert') => {
    setAiCreateTopicDifficulties((prev) => ({
      ...prev,
      [tId]: diff,
    }));
  };

  const handleApplyAiCreateDiffPreset = (mode: 'gradual' | 'all_basic' | 'all_hard') => {
    const next: Record<string, 'easy' | 'medium' | 'hard' | 'expert'> = {};
    aiCreateSelectedTopics.forEach((tId, idx) => {
      if (mode === 'all_basic') {
        next[tId] = 'easy';
      } else if (mode === 'all_hard') {
        next[tId] = idx === aiCreateSelectedTopics.length - 1 ? 'expert' : 'hard';
      } else {
        const ratio = idx / Math.max(1, aiCreateSelectedTopics.length - 1);
        if (ratio < 0.35) next[tId] = 'easy';
        else if (ratio < 0.7) next[tId] = 'medium';
        else if (ratio < 0.9) next[tId] = 'hard';
        else next[tId] = 'expert';
      }
    });
    setAiCreateTopicDifficulties((prev) => ({ ...prev, ...next }));
  };

  const handleAiCreateExam = async () => {
    setAiCreateLoading(true);
    setAiCreateError('');
    setAiCreateResult(null);
    try {
      const apiKey = getStoredApiKey();

      const activeTopicDifficulties: Record<string, 'easy' | 'medium' | 'hard' | 'expert'> = {};
      aiCreateSelectedTopics.forEach((tId) => {
        if (aiCreateTopicDifficulties[tId]) {
          activeTopicDifficulties[tId] = aiCreateTopicDifficulties[tId];
        }
      });

      const config: ExamGenerationConfig = {
        subject: aiCreateSubject,
        totalQuestions: aiCreateCount,
        difficulty: aiCreateDiff,
        timeLimitMinutes: aiCreateCount <= 10 ? 45 : 60,
        focusTopics: aiCreateSelectedTopics,
        topicDifficulties: Object.keys(activeTopicDifficulties).length > 0 ? activeTopicDifficulties : undefined,
        customPrompt: aiCreatePrompt,
        title: `Đề AI ${aiCreateSubject === 'math' ? 'Toán' : 'Anh'} - ${new Date().toLocaleDateString('vi-VN')}`,
        modelName: aiCreateModel,
      };
      const result = await generateExamWithAI(apiKey, config, setAiCreateProgress);
      // Save to app via addExam + add questions
      bulkImportQuestions(result.questions);
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
  const [aiQModel, setAiQModel] = useState<string>('gemini-3.6-flash');

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
        modelName: aiQModel,
      };
      const result = await generateExamWithAI(apiKey, config, setAiQProgress);
      bulkImportQuestions(result.questions);
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
  const [uploadModel, setUploadModel] = useState<string>('gemini-3.6-flash');

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
        setUploadProgress,
        uploadModel
      );
      bulkImportQuestions(result.questions);
      addExam(result.exam);
      setUploadResult({ examId: result.exam.id, questionCount: result.rawQuestionCount });
    } catch (e: any) {
      setUploadError(e.message || 'Lỗi không xác định khi trích xuất');
    } finally {
      setUploadLoading(false);
    }
  };

  // Real-time Activity Subscription & Initial DB Fetch
  useEffect(() => {
    // Initial fetch of up to 50 latest activities from Firebase
    fetchLiveActivitiesFromFirebase().then((acts) => {
      if (acts && acts.length > 0) {
        setRealtimeEvents((prev) => {
          const map = new Map<string, RealtimeActivityEvent>();
          prev.forEach((e) => map.set(e.id, e));
          acts.forEach((e) => map.set(e.id, e));
          const unified = Array.from(map.values());
          unified.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return unified.slice(0, 50);
        });
      }
    });

    const unsubscribeActivities = subscribeToRealtimeActivities((event) => {
      setRealtimeEvents((prev) => [event, ...prev.filter((e) => e.id !== event.id)].slice(0, 50));
      setLiveToast(event);
      setTimeout(() => setLiveToast(null), 5000);
    });

    const unsubscribeTasks = subscribeToRemoteTasks((task) => {
      setAssignedTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== task.id);
        return [task, ...filtered];
      });
    });

    const unsubscribeSync = subscribeToGlobalSync((event) => {
      if (event.type === 'ATTEMPTS_UPDATED' || event.type === 'EXAMS_UPDATED' || event.type === 'USER_CHANGED') {
        setSubmissionRev((r) => r + 1);
      }
      if (event.type === 'TASKS_UPDATED') {
        setAssignedTasks(getStoredRemoteTasks());
      }
    });

    const handleStorage = () => {
      setAssignedTasks(getStoredRemoteTasks());
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribeActivities();
      unsubscribeTasks();
      unsubscribeSync();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Fetch all student submissions once when Admin opens the panel
  useEffect(() => {
    fetchRoomDataFromOnlineDB().catch((err) => console.warn('Admin fetch room data error:', err));
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

  // All Exam Submissions / Attempts across all students
  const allSubmissions = studentUsers.flatMap((stu) => {
    const data = getUserScopedData(stu.id) || {};
    const attempts = data.examAttempts || [];
    return attempts.map((att: ExamAttempt) => ({
      ...att,
      studentId: stu.id,
      studentName: stu.name,
      studentEmail: stu.email,
      studentAvatar: stu.avatarColor,
      targetSchool: stu.targetSchool,
    }));
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filtered Submissions
  const filteredSubmissions = allSubmissions.filter((sub) => {
    if (submissionStudentFilter !== 'all' && sub.studentId !== submissionStudentFilter) return false;
    if (submissionSubjectFilter === 'math' && sub.subject !== 'math') return false;
    if (submissionSubjectFilter === 'english' && (sub.subject || 'english') !== 'english') return false;
    if (submissionSearchQuery) {
      const q = submissionSearchQuery.toLowerCase();
      const matchExam = (sub.examTitle || '').toLowerCase().includes(q);
      const matchStudent = (sub.studentName || '').toLowerCase().includes(q);
      if (!matchExam && !matchStudent) return false;
    }
    return true;
  });

  const handleOpenAttemptReview = (att: any, studentName?: string, studentId?: string) => {
    setSelectedAttemptForReview({
      attempt: att,
      studentName: studentName || att.studentName || 'Học sinh',
      studentId: studentId || att.studentId || att.userId,
    });
    setAttemptQuestionFilter('all');
    if (studentId || att.studentId) {
      setAttemptTeacherNote(getTeacherNote(studentId || att.studentId) || '');
    }
    setAttemptTeacherNoteSaved(false);
  };

  const handleSaveAttemptTeacherNote = () => {
    if (!selectedAttemptForReview?.studentId) return;
    saveTeacherNote(selectedAttemptForReview.studentId, attemptTeacherNote);
    setAttemptTeacherNoteSaved(true);
    setTimeout(() => setAttemptTeacherNoteSaved(false), 2500);
  };

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

  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);

  // Helper to compute deadline badge data
  const getTaskDeadlineInfo = (deadlineStr?: string) => {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const isOverdue = diffMs < 0;
    const isUrgent = !isOverdue && diffHours <= 6;

    const dateFormatted = deadline.toLocaleDateString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });

    let label = '';
    if (isOverdue) {
      const absH = Math.abs(diffHours);
      label = absH < 24 ? `Quá hạn ${absH}h` : `Quá hạn ${Math.abs(diffDays)} ngày`;
    } else if (diffHours <= 1) {
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
      label = `Còn ${diffMins} phút`;
    } else if (diffHours < 24) {
      label = `Còn ${diffHours} giờ`;
    } else {
      label = `Còn ${diffDays} ngày`;
    }

    return { dateFormatted, isOverdue, isUrgent, label };
  };

  // Quick deadline preset helpers
  const setQuickDeadlineToday2359 = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    setTaskDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T23:59`);
  };

  const setQuickDeadlineTomorrow2100 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setTaskDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
  };

  const setQuickDeadlineInDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(21, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setTaskDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
  };

  const setQuickDeadlineSunday = () => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilSunday = (7 - day) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSunday);
    d.setHours(22, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    setTaskDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T22:00`);
  };

  // Remote Task Send Handler
  const handleSendRemoteTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingTask) return;
    setIsSubmittingTask(true);
    const newTask = broadcastRemoteTask({
      senderName: currentUser.name || 'Anh/Chị (Người giám sát)',
      recipientUserId: taskTargetStudentId,
      subject: taskSubject,
      title: taskTitle,
      message: taskMessage,
      assignedExamId: taskAssignedExamId,
      targetDeadline: taskDeadline ? taskDeadline : undefined,
    });
    setAssignedTasks((prev) => [newTask, ...prev.filter((t) => t.id !== newTask.id)]);
    setTaskSuccessMsg(true);
    setTimeout(() => {
      setTaskSuccessMsg(false);
      setIsSubmittingTask(false);
      setShowAssignTaskModal(false);
      setTaskDeadline('');
    }, 1200);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Bạn có chắc muốn thu hồi / xóa nhiệm vụ này?')) {
      deleteRemoteTask(taskId);
      setAssignedTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const handleToggleTaskStatus = (taskId: string) => {
    const newStatus = toggleRemoteTaskCompleted(taskId);
    setAssignedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: newStatus, status: newStatus ? 'confirmed' : 'pending' } : t))
    );
  };

  const handleAdminConfirmTask = (task: RemoteTaskAssignment, feedback?: string) => {
    adminConfirmRemoteTask(task.id, feedback || 'Làm rất tốt, đạt yêu cầu!', currentUser.name || 'Người giám sát');
    setAssignedTasks(getStoredRemoteTasks());
    setConfirmModalTask(null);
    setConfirmFeedback('');
  };

  const handleAdminRequestRedo = (task: RemoteTaskAssignment, feedback: string) => {
    if (!feedback.trim()) {
      alert('Vui lòng nhập lý do / lời dặn dò khi yêu cầu học sinh làm lại.');
      return;
    }
    adminRequestRemoteTaskRedo(task.id, feedback.trim(), currentUser.name || 'Người giám sát');
    setAssignedTasks(getStoredRemoteTasks());
    setRedoModalTask(null);
    setRedoFeedback('');
  };

  const handleSaveDeadlineEdit = () => {
    if (!editDeadlineTask) return;
    updateRemoteTaskDeadline(editDeadlineTask.id, editDeadlineInput);
    setAssignedTasks(getStoredRemoteTasks());
    setEditDeadlineTask(null);
  };

  const handleRemindTaskPing = (task: RemoteTaskAssignment) => {
    const targetStudent = studentUsers.find((s) => s.id === task.recipientUserId);
    const stuName = targetStudent?.name || 'Học sinh';
    const dl = getTaskDeadlineInfo(task.targetDeadline);
    const deadlineMsg = dl ? ` (Hạn chót: ${dl.dateFormatted} - ${dl.label})` : '';

    sendRemotePing({
      senderName: currentUser.name || 'Thầy/Cô (Giám sát)',
      recipientUserId: task.recipientUserId,
      message: `🔔 Nhắc nhở bài tập: Em hãy vào hoàn thành bài "${task.title}" nhé!${deadlineMsg}`,
      pingType: 'reminder',
    });
    alert(`Đã gửi thông báo nhắc nhở làm bài trực tiếp đến màn hình em ${stuName}!`);
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

  // ── Open Edit Exam Modal with prefilled data ─────────────────────────────
  const handleOpenEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamSubject((ex.subject || 'english') as SubjectId);
    setExamTitle(ex.title);
    setExamCode(ex.code);
    setExamDesc(ex.description);
    setExamTime(ex.timeLimitMinutes);
    setSelectedQIds(ex.questionIds || []);
    setShowExamModal(true);
  };

  const handleOpenCreateExam = () => {
    setEditingExam(null);
    setExamTitle('');
    setExamCode('DE-10-M04');
    setExamDesc('');
    setExamTime(60);
    setSelectedQIds([]);
    setExamSubject('math');
    setShowExamModal(true);
  };

  // ── Open Edit Student Modal ─────────────────────────────────────
  const handleOpenEditStudent = (stu: UserAccount) => {
    setEditStudentTarget(stu);
    setEditStudentName(stu.name);
    setEditStudentPassword(stu.password || '');
    setEditStudentSchool(stu.targetSchool || '');
    setEditStudentTargetMath(stu.targetScoreMath || stu.targetScore || 8.5);
    setEditStudentTargetEng(stu.targetScoreEnglish || stu.targetScore || 8.5);
    setEditStudentMsg(null);
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = () => {
    if (!editStudentTarget) return;
    updateUserByAdmin(editStudentTarget.id, {
      name: editStudentName.trim() || editStudentTarget.name,
      ...(editStudentPassword.trim() ? { password: editStudentPassword.trim() } : {}),
      targetSchool: editStudentSchool.trim() || editStudentTarget.targetSchool,
      targetScoreMath: editStudentTargetMath,
      targetScoreEnglish: editStudentTargetEng,
      targetScore: Math.max(editStudentTargetMath, editStudentTargetEng),
    });
    setEditStudentMsg('Đã lưu thông tin học sinh thành công!');
    setTimeout(() => setShowEditStudentModal(false), 1200);
  };

  const handleDeleteStudent = (stu: UserAccount) => {
    if (!confirm(`Bạn có chắc muốn XÓA tài khoản học sinh "${stu.name}"?\nDữ liệu học tập sẽ bị xóa và không thể khôi phục.`)) return;
    deleteUser(stu.id);
    if (selectedStudentForDetail?.id === stu.id) setSelectedStudentForDetail(null);
  };

  // ── Teacher Note Delete ──────────────────────────────────────────────
  const handleDeleteTeacherNote = (userId: string) => {
    if (!confirm('Bạn có muốn xóa ghi chú giáo viên cho học sinh này không?')) return;
    deleteTeacherNote(userId);
    setTeacherNoteInput('');
    setTeacherNoteSaved(false);
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

        {/* Action Toolbar Grid (7 Quick Action Buttons) */}
        <div className="pt-2 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          <button
            onClick={() => {
              setAdminApiKeyInput(getStoredApiKey());
              setAdminKeyValidationResult(null);
              setShowGeminiKeyModal(true);
            }}
            className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-md border border-emerald-400/40 text-center relative"
          >
            <Key className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="truncate">🔑 Gemini Key</span>
            {getStoredApiKey() ? (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0 ml-0.5" title="Đã có API Key" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-300 shrink-0 ml-0.5" title="Chưa cài API Key" />
            )}
          </button>

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
      <div className="flex bg-[#E8E2D9] p-1.5 rounded-2xl max-w-5xl shadow-2xs text-xs font-bold overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveAdminTab('overview')}
          className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'overview'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('tasks')}
          className={`py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'tasks'
              ? 'bg-[#1E3A8A] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <ClipboardList className="w-4 h-4 text-amber-300" />
          <span>🎯 Bài tập đang giao ({assignedTasks.filter((t) => !t.completed).length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('submissions')}
          className={`py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'submissions'
              ? 'bg-[#1E3A8A] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <FileText className="w-4 h-4 text-blue-300" />
          <span>📝 Bài làm học sinh ({allSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('exams')}
          className={`py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'exams'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-300" />
          <span>Quản lý đề thi ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('students')}
          className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'students'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <Users className="w-4 h-4" />
          <span>Học sinh ({totalStudents})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('questions')}
          className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'questions'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ngân hàng câu hỏi</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('vocab')}
          className={`py-2 px-3.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'vocab'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <BookMarked className="w-4 h-4 text-amber-400" />
          <span>Từ vựng & Flashcards ({vocabularyWords.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('realtime_pulse')}
          className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${activeAdminTab === 'realtime_pulse'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
            }`}
        >
          <Activity className="w-4 h-4 text-[#8BA888]" />
          <span>Nhật ký Live ({realtimeEvents.length})</span>
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
            const todayStr = new Date().toDateString();
            const todayEvents = realtimeEvents.filter((e) => new Date(e.timestamp).toDateString() === todayStr);
            const todayExamSubmissions = todayEvents.filter((e) => e.type === 'exam_submitted');
            const todayTasksSubmitted = todayEvents.filter((e) => (e.type as string) === 'task_submitted');
            const todayMistakesMastered = todayEvents.filter((e) => e.type === 'mistake_mastered');
            const todayAlerts = todayEvents.filter(
              (e) => e.type === 'tab_switched' || e.type === 'exam_abandoned' || e.severity === 'alert' || e.severity === 'warning'
            );
            const todayAvgScore =
              todayExamSubmissions.length > 0
                ? (
                    todayExamSubmissions.reduce((s, e) => s + (typeof e.score === 'number' ? e.score : 0), 0) /
                    todayExamSubmissions.length
                  ).toFixed(1)
                : null;

            const filteredEvents = realtimeEvents.filter((evt) => {
              if (activityFilterType === 'alerts') {
                if (evt.type !== 'tab_switched' && evt.type !== 'exam_abandoned' && evt.severity !== 'alert' && evt.severity !== 'warning') {
                  return false;
                }
              } else if (activityFilterType !== 'all' && evt.type !== activityFilterType) {
                return false;
              }
              if (activityFilterSubject !== 'all' && evt.subject && evt.subject !== activityFilterSubject) return false;
              return true;
            });

            const handleReviewAttemptFromActivity = (evt: RealtimeActivityEvent) => {
              // 1. Try finding attempt by attemptId in student scoped data
              let foundAttempt: ExamAttempt | undefined;
              const stuData = getUserScopedData(evt.userId);
              if (evt.attemptId && stuData.examAttempts) {
                foundAttempt = stuData.examAttempts.find((a) => a.id === evt.attemptId);
              }
              // 2. Fallback: match by examId or examTitle
              if (!foundAttempt && stuData.examAttempts) {
                foundAttempt = stuData.examAttempts.find((a) => a.examId === evt.examId || a.examTitle === evt.examTitle);
              }
              // 3. Global fallback across all students
              if (!foundAttempt) {
                for (const st of allStudentStats) {
                  const match = st.attempts.find((a) => a.id === evt.attemptId || (evt.examId && a.examId === evt.examId));
                  if (match) {
                    foundAttempt = match;
                    break;
                  }
                }
              }

              if (foundAttempt) {
                setSelectedAttemptForReview({
                  attempt: foundAttempt,
                  studentName: evt.userName,
                  studentId: evt.userId,
                });
              } else {
                alert(`Bài làm của "${evt.userName}" đang được đồng bộ hoặc đã được làm trên thiết bị khác.`);
              }
            };

            return (
              <div className="space-y-4">
                {/* 1. Daily Pulse Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 bg-white rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Đề thi nộp hôm nay</span>
                    <div className="text-xl sm:text-2xl font-black text-[#3D3D2D] my-1">
                      {todayExamSubmissions.length} <span className="text-xs font-normal text-[#8A8A70]">đề</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold truncate">
                      {todayAvgScore ? `🎯 Điểm TB: ${todayAvgScore}đ` : 'Chưa có lượt nộp'}
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Nhiệm vụ hoàn thành</span>
                    <div className="text-xl sm:text-2xl font-black text-blue-700 my-1">
                      {todayTasksSubmitted.length} <span className="text-xs font-normal text-[#8A8A70]">bài</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] truncate">
                      {todayTasksSubmitted.length > 0 ? 'Đã gửi báo cáo' : 'Chưa có báo cáo mới'}
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Câu sai đã khắc phục</span>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 my-1">
                      {todayMistakesMastered.length} <span className="text-xs font-normal text-[#8A8A70]">câu</span>
                    </div>
                    <span className="text-[11px] text-emerald-800 font-bold truncate">
                      ✓ Đã làm chủ trong Sổ
                    </span>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Cảnh báo giám sát</span>
                    <div className="text-xl sm:text-2xl font-black text-[#E67E22] my-1">
                      {todayAlerts.length} <span className="text-xs font-normal text-[#8A8A70]">lượt</span>
                    </div>
                    <span className={`text-[11px] font-bold truncate ${todayAlerts.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {todayAlerts.length > 0 ? '⚠️ Rời màn hình / Hủy thi' : '✓ Phòng thi an toàn'}
                    </span>
                  </div>
                </div>

                {/* 2. Chronological Feed Container */}
                <div className="bg-white rounded-[2.5rem] p-5 sm:p-7 border border-[#EAE7E0] shadow-xs space-y-4">
                  {/* Feed Header & Actions */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#F5F2ED]">
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
                        onClick={async () => {
                          const current = await fetchLiveActivitiesFromFirebase();
                          setRealtimeEvents(current);
                        }}
                        className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#5A5A40] border border-[#D9D2C5] rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                      >
                        <span>🔄 Làm mới từ máy chủ</span>
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
                        onClick={() => setActivityFilterType('task_submitted' as any)}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          activityFilterType === ('task_submitted' as any) ? 'bg-blue-700 text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                      >
                        🎯 Nộp nhiệm vụ
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
                        onClick={() => setActivityFilterType('mistake_mastered')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          activityFilterType === 'mistake_mastered' ? 'bg-indigo-700 text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                      >
                        ✅ Sửa câu sai
                      </button>
                      <button
                        onClick={() => setActivityFilterType('ai_exam_generated')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          activityFilterType === 'ai_exam_generated' ? 'bg-purple-700 text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                      >
                        🤖 Đề AI
                      </button>
                      <button
                        onClick={() => setActivityFilterType('alerts')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                          activityFilterType === 'alerts' ? 'bg-rose-700 text-white shadow-xs' : 'text-rose-700'
                        }`}
                      >
                        ⚠️ Cảnh báo ({todayAlerts.length})
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
                          Khi học sinh vào làm bài thi, nộp bài hoặc gửi nhiệm vụ hoàn thành, toàn bộ tiến độ sẽ hiển thị tại đây thời gian thực.
                        </p>
                      </div>
                    ) : (
                      filteredEvents.map((evt) => {
                        const dateObj = new Date(evt.timestamp);
                        const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        const isToday = new Date().toDateString() === dateObj.toDateString();
                        const dateDisplay = isToday ? `Hôm nay ${timeStr}` : `${dateObj.toLocaleDateString('vi-VN')} ${timeStr}`;

                        const isReviewable = evt.type === 'exam_submitted' || (evt.type as string) === 'task_submitted' || evt.attemptId;
                        const isWarningOrAlert = evt.type === 'tab_switched' || evt.type === 'exam_abandoned' || evt.severity === 'alert' || evt.severity === 'warning';

                        return (
                          <div
                            key={evt.id}
                            className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 text-xs ${
                              isWarningOrAlert
                                ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                                : evt.severity === 'positive'
                                ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                                : 'bg-[#FAF9F6] border-[#EAE7E0] hover:border-[#D9D2C5]'
                            }`}
                          >
                            <div className="flex items-start space-x-3.5 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-2xl ${
                                  isWarningOrAlert
                                    ? 'bg-rose-600'
                                    : evt.avatarColor || 'bg-[#5A5A40]'
                                } text-white font-extrabold text-sm flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}
                              >
                                {isWarningOrAlert ? '⚠️' : evt.userName.charAt(0)}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <span className="font-bold text-[#3D3D2D]">{evt.userName}</span>
                                  <span
                                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                                      evt.type === 'exam_submitted' || (evt.type as string) === 'task_submitted'
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        : evt.type === 'practice_completed'
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : evt.type === 'mistake_mastered'
                                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                        : evt.type === 'ai_exam_generated'
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                        : evt.type === 'tab_switched' || evt.type === 'exam_abandoned'
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : evt.type === 'scratchpad_used'
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-[#F5F2ED] text-[#5A5A40] border border-[#D9D2C5]'
                                    }`}
                                  >
                                    {evt.type === 'exam_submitted'
                                      ? '📝 Nộp bài thi'
                                      : (evt.type as string) === 'task_submitted'
                                      ? '🎯 Nộp nhiệm vụ'
                                      : evt.type === 'practice_completed'
                                      ? '⚡ Hoàn thành luyện tập'
                                      : evt.type === 'mistake_mastered'
                                      ? '✅ Đã sửa câu sai'
                                      : evt.type === 'ai_exam_generated'
                                      ? '🤖 AI Tạo đề'
                                      : evt.type === 'tab_switched'
                                      ? '🚨 Rời màn hình thi'
                                      : evt.type === 'exam_abandoned'
                                      ? '⚠️ Thoát thi giữa chừng'
                                      : evt.type === 'scratchpad_used'
                                      ? '✏️ Bảng nháp'
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

                                {isReviewable && (
                                  <button
                                    onClick={() => handleReviewAttemptFromActivity(evt)}
                                    className="mt-1 font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center space-x-1 cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Xem bài làm chi tiết của học sinh →</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0 space-y-1">
                              <span className="text-[11px] text-[#8A8A70] block font-mono">
                                {dateDisplay}
                              </span>
                              {evt.score !== undefined && (
                                <span className={`text-sm font-extrabold block ${
                                  typeof evt.score === 'number' && evt.score >= 8
                                    ? 'text-emerald-700'
                                    : typeof evt.score === 'number' && evt.score >= 5
                                    ? 'text-[#1E3A8A]'
                                    : 'text-[#E67E22]'
                                }`}>
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
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${selectedSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                      }`}
                  >
                    Tất cả
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('math')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${selectedSubjectFilter === 'math' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                      }`}
                  >
                    Toán
                  </button>
                  <button
                    onClick={() => setSelectedSubjectFilter('english')}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${selectedSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
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
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${topicStat.hasData
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
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${topicStat.hasData
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

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* 4. DASHBOARD SECTION: BÀI TẬP ĐANG GIAO & BÀI NỘP GẦN ĐÂY */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Danh Sách Nhiệm Vụ & Bài Tập Đang Giao (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                      🎯
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-[#3D3D2D]">
                          Nhiệm Vụ & Bài Tập Đang Giao
                        </h3>
                        {assignedTasks.filter((t) => t.status === 'submitted').length > 0 ? (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-full animate-pulse">
                            {assignedTasks.filter((t) => t.status === 'submitted').length} cần xác nhận
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full">
                            {assignedTasks.filter((t) => !t.completed || t.status === 'pending' || t.status === 'redo').length} đang làm
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#8A8A70]">
                        Tiến độ làm bài, hạn chót và xác nhận bài tập của học sinh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAssignTaskModal(true)}
                      className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Giao bài mới</span>
                    </button>
                    <button
                      onClick={() => setActiveAdminTab('tasks')}
                      className="text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer hidden sm:inline-block"
                    >
                      Xem tất cả ({assignedTasks.length}) →
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-3 pt-3">
                  {assignedTasks.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-[#D9D2C5] space-y-2">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-2xs">
                        🎯
                      </div>
                      <p className="text-xs font-bold text-[#3D3D2D]">Chưa có bài tập nào được giao</p>
                      <p className="text-[11px] text-[#8A8A70]">
                        Hãy bấm nút "Giao bài mới" để gửi bài thi hoặc nhiệm vụ ôn tập tới học sinh.
                      </p>
                      <button
                        onClick={() => setShowAssignTaskModal(true)}
                        className="mt-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Giao bài tập đầu tiên</span>
                      </button>
                    </div>
                  ) : (
                    assignedTasks.slice(0, 4).map((task) => {
                      const targetStudent = studentUsers.find((s) => s.id === task.recipientUserId);
                      const linkedExam = task.assignedExamId ? exams.find((e) => e.id === task.assignedExamId) : null;
                      const studentAttempt = linkedExam
                        ? allSubmissions.find((sub) => sub.examId === linkedExam.id && sub.userId === task.recipientUserId)
                        : null;
                      const dl = getTaskDeadlineInfo(task.targetDeadline);
                      const isConfirmed = task.status === 'confirmed' || (!task.status && task.completed);
                      const isSubmitted = task.status === 'submitted';
                      const isRedo = task.status === 'redo';

                      return (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-2xl border transition flex flex-col justify-between space-y-2.5 ${
                            isConfirmed
                              ? 'bg-emerald-50/30 border-emerald-200'
                              : isSubmitted
                              ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                              : isRedo
                              ? 'bg-rose-50/40 border-rose-200'
                              : dl?.isOverdue
                              ? 'bg-amber-50/40 border-amber-300'
                              : 'bg-[#FAF9F6] border-[#EAE7E0] hover:border-[#D9D2C5]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                                style={{ backgroundColor: targetStudent?.avatarColor || '#5A5A40' }}
                              >
                                {targetStudent?.name?.charAt(0) || 'H'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-[#3D3D2D] truncate">
                                    {task.recipientUserId === 'all' ? '📢 Cả lớp' : targetStudent?.name || 'Học sinh'}
                                  </span>
                                  {task.recipientUserId === siblingId && (
                                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-md text-[9px] font-extrabold">
                                      ⭐ Em tôi
                                    </span>
                                  )}
                                  <SubjectBadge subject={task.subject} />
                                </div>
                                <h4 className="font-bold text-xs text-[#3D3D2D] truncate mt-0.5" title={task.title}>
                                  {task.title}
                                </h4>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="shrink-0 flex items-center space-x-1.5">
                              {isConfirmed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                                  <Check className="w-3 h-3" />
                                  <span>Đã duyệt</span>
                                </span>
                              ) : isSubmitted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center space-x-1 animate-pulse">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>Chờ duyệt</span>
                                </span>
                              ) : isRedo ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Cần sửa</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                                  <span>Đang làm</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Deadline Alert on card */}
                          {dl && (
                            <div
                              className={`flex items-center space-x-1.5 text-[10px] font-bold px-2 py-1 rounded-lg ${
                                dl.isOverdue
                                  ? 'bg-rose-100 text-rose-800'
                                  : dl.isUrgent
                                  ? 'bg-amber-100 text-amber-900 animate-pulse'
                                  : 'bg-blue-50 text-blue-800'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>Hạn chót: {dl.dateFormatted}</span>
                              <span className="opacity-80">({dl.label})</span>
                            </div>
                          )}

                          {task.message && (
                            <p className="text-[11px] text-[#64748B] italic bg-white/80 p-2 rounded-xl border border-[#EAE7E0]/60 line-clamp-1">
                              💬 "{task.message}"
                            </p>
                          )}

                          {/* Submission Result / Student Note */}
                          {isSubmitted && (
                            <div className="p-2 bg-blue-100/60 rounded-xl border border-blue-200 text-[11px] flex items-center justify-between">
                              <span className="font-bold text-blue-900">
                                {task.studentScore !== undefined
                                  ? `🎯 Điểm nộp: ${task.studentScore.toFixed(1)}/10đ`
                                  : '📝 Học sinh đã gửi bài nộp'}
                              </span>
                              <button
                                onClick={() => setConfirmModalTask(task)}
                                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold cursor-pointer"
                              >
                                Duyệt ngay
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 border-t border-[#EAE7E0]/50 text-[11px]">
                            <span className="text-[#8A8A70]">
                              {formatRelativeTime(task.timestamp)}
                            </span>

                            <div className="flex items-center space-x-1.5">
                              {studentAttempt && (
                                <button
                                  onClick={() => handleOpenAttemptReview(studentAttempt, targetStudent?.name, targetStudent?.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Xem bài ({studentAttempt.score}đ)</span>
                                </button>
                              )}

                              {isSubmitted && (
                                <>
                                  <button
                                    onClick={() => handleAdminConfirmTask(task)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                                    title="Xác nhận hoàn thành đạt yêu cầu"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Duyệt đạt</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRedoModalTask(task);
                                      setRedoFeedback('');
                                    }}
                                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                    title="Yêu cầu làm lại bài"
                                  >
                                    <span>Làm lại</span>
                                  </button>
                                </>
                              )}

                              {!task.completed && !isSubmitted && (
                                <button
                                  onClick={() => handleRemindTaskPing(task)}
                                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-[10px] font-bold transition flex items-center space-x-1 cursor-pointer"
                                  title="Gửi thông báo nhắc nhở làm bài"
                                >
                                  <Bell className="w-3 h-3 text-amber-700" />
                                  <span>Nhắc bài</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleTaskStatus(task.id)}
                                className="p-1 hover:bg-[#EAE7E0] text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg transition cursor-pointer"
                                title={isConfirmed ? 'Mở lại nhiệm vụ' : 'Đánh dấu đã duyệt'}
                              >
                                <CheckCircle className={`w-3.5 h-3.5 ${isConfirmed ? 'text-emerald-600' : ''}`} />
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1 hover:bg-red-50 text-[#8A8A70] hover:text-red-600 rounded-lg transition cursor-pointer"
                                title="Thu hồi / Xóa nhiệm vụ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {assignedTasks.length > 4 && (
                <div className="pt-2 text-center border-t border-[#F5F2ED]">
                  <button
                    onClick={() => setActiveAdminTab('tasks')}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>Xem tất cả {assignedTasks.length} nhiệm vụ đã giao</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Bài Làm & Lượt Nộp Đề Mới Nhất (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-[2.5rem] p-6 border border-[#EAE7E0] shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                      📝
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#3D3D2D]">
                        Bài Làm Vừa Nộp
                      </h3>
                      <p className="text-xs text-[#8A8A70]">
                        {allSubmissions.length} lượt nộp đề thi
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveAdminTab('submissions')}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    Xem tất cả →
                  </button>
                </div>

                {/* Submissions List */}
                <div className="space-y-2.5 pt-3">
                  {allSubmissions.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-[#D9D2C5] space-y-2">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-2xs">
                        📝
                      </div>
                      <p className="text-xs font-bold text-[#3D3D2D]">Chưa có bài nộp nào</p>
                      <p className="text-[11px] text-[#8A8A70]">
                        Kết quả làm bài thi của học sinh sẽ hiển thị ở đây ngay khi nộp bài.
                      </p>
                    </div>
                  ) : (
                    allSubmissions.slice(0, 5).map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        onClick={() => handleOpenAttemptReview(sub)}
                        className="p-3 bg-[#FAF9F6] hover:bg-white hover:border-[#1E3A8A] border border-[#EAE7E0] rounded-2xl transition cursor-pointer flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                            style={{ backgroundColor: sub.studentAvatar || '#5A5A40' }}
                          >
                            {sub.studentName?.charAt(0) || 'H'}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-[#3D3D2D] truncate group-hover:text-[#1E3A8A]">
                                {sub.studentName}
                              </span>
                              <SubjectBadge subject={sub.subject} />
                            </div>
                            <p className="text-[11px] text-[#8A8A70] truncate mt-0.5">
                              {sub.examTitle}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2 space-y-0.5">
                          <ScorePill score={sub.score} maxScore={10} />
                          <span className="text-[10px] text-[#8A8A70] block">
                            {formatRelativeTime(sub.date)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {allSubmissions.length > 5 && (
                <div className="pt-2 text-center border-t border-[#F5F2ED]">
                  <button
                    onClick={() => setActiveAdminTab('submissions')}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer inline-flex items-center space-x-1"
                  >
                    <span>Xem toàn bộ {allSubmissions.length} bài làm của học sinh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎯 TAB: ASSIGNED TASKS MANAGEMENT (QUẢN LÝ BÀI TẬP ĐANG GIAO)             */}
      {/* ========================================================================= */}
      {activeAdminTab === 'tasks' && (() => {
        const pendingCount = assignedTasks.filter((t) => (!t.completed || t.status === 'pending' || t.status === 'redo') && t.status !== 'submitted' && t.status !== 'confirmed').length;
        const submittedCount = assignedTasks.filter((t) => t.status === 'submitted').length;
        const confirmedCount = assignedTasks.filter((t) => t.status === 'confirmed' || (!t.status && t.completed)).length;
        const overdueCount = assignedTasks.filter((t) => {
          if (t.status === 'confirmed' || (!t.status && t.completed)) return false;
          const dl = getTaskDeadlineInfo(t.targetDeadline);
          return !!dl?.isOverdue;
        }).length;
        const recipientStudents = Array.from(new Set(assignedTasks.map((t) => t.recipientUserId)));

        const filteredTasks = assignedTasks.filter((task) => {
          const dl = getTaskDeadlineInfo(task.targetDeadline);
          const isConfirmed = task.status === 'confirmed' || (!task.status && task.completed);
          const isSubmitted = task.status === 'submitted';
          const isPending = !isConfirmed && !isSubmitted;

          // Status filter
          if (taskStatusFilter === 'pending' && !isPending) return false;
          if (taskStatusFilter === 'submitted' && !isSubmitted) return false;
          if (taskStatusFilter === 'confirmed' && !isConfirmed) return false;
          if (taskStatusFilter === 'overdue' && (!dl?.isOverdue || isConfirmed)) return false;

          // Student filter
          if (taskStudentFilter !== 'all' && task.recipientUserId !== taskStudentFilter) return false;

          // Subject filter
          if (taskSubjectFilter !== 'all' && task.subject !== taskSubjectFilter) return false;

          // Search Query
          if (taskSearchQuery) {
            const query = taskSearchQuery.toLowerCase();
            const studentName = studentUsers.find((s) => s.id === task.recipientUserId)?.name || '';
            const matchTitle = task.title.toLowerCase().includes(query);
            const matchMsg = task.message?.toLowerCase().includes(query);
            const matchStudent = studentName.toLowerCase().includes(query);
            if (!matchTitle && !matchMsg && !matchStudent) return false;
          }
          return true;
        });

        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Stat Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-[#8A8A70] font-bold">
                  <ClipboardList className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Tổng nhiệm vụ</span>
                </div>
                <p className="text-2xl font-extrabold text-[#3D3D2D]">{assignedTasks.length} <span className="text-xs font-normal text-[#8A8A70]">nhiệm vụ</span></p>
                <p className="text-[11px] text-[#8A8A70]">Toàn bộ danh sách bài tập</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-amber-700 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Đang chờ hoàn thành</span>
                </div>
                <p className="text-2xl font-extrabold text-amber-600">{pendingCount} <span className="text-xs font-normal text-[#8A8A70]">bài</span></p>
                <p className="text-[11px] text-amber-700/80 font-medium">Học sinh đang giải bài</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-blue-200 shadow-xs space-y-1 relative overflow-hidden">
                {submittedCount > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
                <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-bold">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span>Chờ bạn xác nhận</span>
                </div>
                <p className="text-2xl font-extrabold text-blue-700">{submittedCount} <span className="text-xs font-normal text-blue-600">bài đã nộp</span></p>
                <p className="text-[11px] text-blue-700/80 font-medium">Học sinh đã làm xong và chờ duyệt</p>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã duyệt đạt</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700">{confirmedCount} <span className="text-xs font-normal text-[#8A8A70]">bài</span></p>
                <p className="text-[11px] text-emerald-700/80 font-medium">Đã hoàn thành và xác nhận</p>
              </div>
            </div>

            {/* Header Action Banner & Giao Bài Nút */}
            <div className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white p-6 rounded-[2.5rem] shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <h3 className="text-lg font-bold">Trung Tâm Quản Lý & Điều Phối Bài Tập</h3>
                </div>
                <p className="text-xs text-blue-100 max-w-xl">
                  Giao bài tập/đề thi kèm hạn chót (Deadline) theo thời gian thực tới từng em, theo dõi tiến độ nộp bài và duyệt xác nhận kết quả.
                </p>
              </div>
              <button
                onClick={() => setShowAssignTaskModal(true)}
                className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-[#1E3A8A] rounded-2xl font-extrabold text-xs transition cursor-pointer shadow-sm flex items-center space-x-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>➕ Giao Bài Tập Mới Ngay</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                {/* Status Filter */}
                <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] flex-wrap gap-1">
                  <button
                    onClick={() => setTaskStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${taskStatusFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                      }`}
                  >
                    Tất cả ({assignedTasks.length})
                  </button>
                  <button
                    onClick={() => setTaskStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${taskStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700'
                      }`}
                  >
                    <span>🟡 Đang làm ({pendingCount})</span>
                  </button>
                  <button
                    onClick={() => setTaskStatusFilter('submitted')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${taskStatusFilter === 'submitted' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-700'
                      }`}
                  >
                    <span>🔵 Chờ xác nhận ({submittedCount})</span>
                  </button>
                  <button
                    onClick={() => setTaskStatusFilter('confirmed')}
                    className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${taskStatusFilter === 'confirmed' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-700'
                      }`}
                  >
                    <span>🟢 Đã duyệt ({confirmedCount})</span>
                  </button>
                  {overdueCount > 0 && (
                    <button
                      onClick={() => setTaskStatusFilter('overdue')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${taskStatusFilter === 'overdue' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
                        }`}
                    >
                      <span>🚨 Quá hạn ({overdueCount})</span>
                    </button>
                  )}
                </div>

                {/* Subject Filter */}
                <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5]">
                  <button
                    onClick={() => setTaskSubjectFilter('all')}
                    className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${taskSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                      }`}
                  >
                    Tất cả môn
                  </button>
                  <button
                    onClick={() => setTaskSubjectFilter('math')}
                    className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${taskSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white' : 'text-[#6B6B54]'
                      }`}
                  >
                    📐 Toán
                  </button>
                  <button
                    onClick={() => setTaskSubjectFilter('english')}
                    className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${taskSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                      }`}
                  >
                    🇬🇧 Tiếng Anh
                  </button>
                </div>

                {/* Student Filter */}
                <select
                  value={taskStudentFilter}
                  onChange={(e) => setTaskStudentFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] font-bold outline-hidden cursor-pointer"
                >
                  <option value="all">👥 Tất cả học sinh</option>
                  {studentUsers.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.name} {stu.id === siblingId ? '⭐ (Em tôi)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[220px] flex-1 max-w-xs">
                <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Tìm bài tập, học sinh..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>
            </div>

            {/* Tasks List */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-12 border border-[#EAE7E0] text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl flex items-center justify-center mx-auto text-3xl">
                  🎯
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-[#3D3D2D]">Chưa có bài tập nào phù hợp bộ lọc</h4>
                  <p className="text-xs text-[#8A8A70]">
                    Hãy đổi bộ lọc hoặc nhấn nút "Giao bài tập mới ngay" để giao nhiệm vụ luyện thi cho học sinh.
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignTaskModal(true)}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Giao bài tập đầu tiên</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTasks.map((task) => {
                  const targetStudent = studentUsers.find((s) => s.id === task.recipientUserId);
                  const linkedExam = task.assignedExamId ? exams.find((e) => e.id === task.assignedExamId) : null;
                  const studentAttempt = linkedExam
                    ? allSubmissions.find((sub) => sub.examId === linkedExam.id && sub.userId === task.recipientUserId)
                    : null;
                  const dl = getTaskDeadlineInfo(task.targetDeadline);
                  const isConfirmed = task.status === 'confirmed' || (!task.status && task.completed);
                  const isSubmitted = task.status === 'submitted';
                  const isRedo = task.status === 'redo';

                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-[2rem] p-5 border transition-all shadow-xs space-y-3.5 flex flex-col justify-between ${
                        isConfirmed
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isSubmitted
                          ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-200'
                          : isRedo
                          ? 'border-rose-200 bg-rose-50/20'
                          : dl?.isOverdue
                          ? 'border-amber-300 bg-amber-50/20'
                          : 'border-[#EAE7E0] hover:border-[#D9D2C5]'
                      }`}
                    >
                      {/* Card Top: Student Info + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-2xs"
                            style={{ backgroundColor: targetStudent?.avatarColor || '#5A5A40' }}
                          >
                            {targetStudent?.name?.charAt(0) || 'H'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-[#3D3D2D]">{targetStudent?.name || 'Học sinh'}</span>
                              {task.recipientUserId === siblingId && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-extrabold">
                                  ⭐ Em tôi
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#8A8A70] block">
                              Giao bởi: {task.senderName} • {formatRelativeTime(task.timestamp)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <SubjectBadge subject={task.subject} />
                          {isConfirmed ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-1">
                              <Check className="w-3 h-3" />
                              <span>Đã duyệt</span>
                            </span>
                          ) : isSubmitted ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center space-x-1 animate-pulse">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>Chờ duyệt</span>
                            </span>
                          ) : isRedo ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Cần làm lại</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              <span>Đang làm</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Task Content & Deadline Badge */}
                      <div className="space-y-2">
                        <h4 className="font-extrabold text-sm text-[#3D3D2D] leading-snug">
                          {task.title}
                        </h4>

                        {/* Deadline Indicator */}
                        <div className="flex items-center justify-between p-2.5 rounded-xl border bg-white/90 text-xs">
                          <div className="flex items-center space-x-2">
                            <Clock className={`w-4 h-4 ${dl?.isOverdue ? 'text-rose-600' : 'text-blue-600'}`} />
                            <div>
                              <span className="font-bold text-[#3D3D2D] block">
                                {dl ? `Hạn chót: ${dl.dateFormatted}` : 'Không đặt hạn chót'}
                              </span>
                              {dl && (
                                <span className={`text-[10px] font-bold ${dl.isOverdue ? 'text-rose-600' : dl.isUrgent ? 'text-amber-700' : 'text-blue-700'}`}>
                                  {dl.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditDeadlineTask(task);
                              setEditDeadlineInput(task.targetDeadline || '');
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-[#5A5A40] hover:bg-[#FAF9F6] border border-[#EAE7E0] rounded-lg transition cursor-pointer flex items-center space-x-1"
                            title="Điều chỉnh hoặc gia hạn deadline"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>{task.targetDeadline ? 'Đổi hạn' : 'Thêm hạn'}</span>
                          </button>
                        </div>

                        {task.message && (
                          <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EAE7E0] text-xs text-[#5A5A40] italic">
                            💬 "{task.message}"
                          </div>
                        )}

                        {/* Linked Exam Card */}
                        {linkedExam && (
                          <div className="flex items-center justify-between bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 text-xs">
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                              <div>
                                <span className="font-bold text-[#1E3A8A] block truncate max-w-[200px]">
                                  {linkedExam.title}
                                </span>
                                <span className="text-[10px] text-blue-700 font-mono">
                                  {linkedExam.code} • {linkedExam.timeLimitMinutes}p • {linkedExam.totalQuestions} câu
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedExamForPreview(linkedExam)}
                              className="px-2.5 py-1 bg-white hover:bg-blue-100 text-[#1E3A8A] border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                            >
                              👁️ Xem đề
                            </button>
                          </div>
                        )}

                        {/* Submission Result badge & Student note if student submitted */}
                        {(isSubmitted || studentAttempt || task.studentScore !== undefined || task.studentNote) && (
                          <div className={`p-3 rounded-xl border space-y-1.5 text-xs ${
                            isConfirmed ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50/80 border-blue-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle2 className={`w-4 h-4 ${isConfirmed ? 'text-emerald-600' : 'text-blue-600'}`} />
                                <span className="font-bold text-[#3D3D2D]">
                                  {task.studentScore !== undefined
                                    ? `Kết quả nộp: ${task.studentScore.toFixed(1)}/10 điểm`
                                    : studentAttempt
                                    ? `Kết quả: ${studentAttempt.score.toFixed(1)}/10 điểm`
                                    : 'Học sinh đã báo cáo hoàn thành'}
                                </span>
                              </div>
                              {studentAttempt && (
                                <button
                                  onClick={() =>
                                    setSelectedAttemptForReview({
                                      attempt: studentAttempt,
                                      studentName: targetStudent?.name || 'Học sinh',
                                      studentId: task.recipientUserId,
                                    })
                                  }
                                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                                >
                                  Chi tiết bài làm
                                </button>
                              )}
                            </div>

                            {task.studentNote && (
                              <p className="text-[11px] text-[#64748B] italic bg-white/70 p-2 rounded-lg border border-[#EAE7E0]">
                                📝 Lời nhắn học sinh: "{task.studentNote}"
                              </p>
                            )}

                            {isConfirmed && task.adminFeedback && (
                              <p className="text-[11px] text-emerald-800 font-medium bg-white/70 p-2 rounded-lg border border-emerald-200">
                                💬 Nhận xét của bạn: "{task.adminFeedback}"
                              </p>
                            )}

                            {isRedo && task.adminFeedback && (
                              <p className="text-[11px] text-rose-800 font-medium bg-white/70 p-2 rounded-lg border border-rose-200">
                                ⚠️ Lời dặn làm lại: "{task.adminFeedback}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Action Buttons */}
                      <div className="pt-2 border-t border-[#F5F2ED] flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                          {isSubmitted ? (
                            <>
                              <button
                                onClick={() => setConfirmModalTask(task)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Xác nhận đạt</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRedoModalTask(task);
                                  setRedoFeedback('');
                                }}
                                className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Yêu cầu làm lại</span>
                              </button>
                            </>
                          ) : (
                            <>
                              {!isConfirmed && (
                                <button
                                  onClick={() => handleRemindTaskPing(task)}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                                  title="Gửi tín hiệu nhắc nhở tới màn hình của em"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                                  <span>⚡ Nhắc làm bài</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleTaskStatus(task.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
                                  isConfirmed
                                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isConfirmed ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                <span>{isConfirmed ? 'Mở lại' : 'Duyệt hoàn thành'}</span>
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                          title="Thu hồi / Xóa nhiệm vụ này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 📝 TAB: STUDENT EXAM SUBMISSIONS (BÀI LÀM HỌC SINH CHI TIẾT)             */}
      {/* ========================================================================= */}
      {activeAdminTab === 'submissions' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Top Stat Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-[#8A8A70] font-bold">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Tổng bài thi đã nộp</span>
              </div>
              <p className="text-2xl font-extrabold text-[#3D3D2D]">{allSubmissions.length} <span className="text-xs font-normal text-[#8A8A70]">bài</span></p>
              <p className="text-[11px] text-[#8A8A70]">Tất cả học sinh trong hệ thống</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-blue-700 font-bold">
                <span>📐 Điểm TB Môn Toán</span>
              </div>
              <p className="text-2xl font-extrabold text-[#1E3A8A]">
                {allSubmissions.filter(s => s.subject === 'math').length > 0
                  ? (allSubmissions.filter(s => s.subject === 'math').reduce((acc, c) => acc + c.score, 0) / allSubmissions.filter(s => s.subject === 'math').length).toFixed(2)
                  : '--'}
                <span className="text-xs font-normal text-[#8A8A70]"> / 10đ</span>
              </p>
              <p className="text-[11px] text-[#8A8A70]">{allSubmissions.filter(s => s.subject === 'math').length} bài thi Toán</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 font-bold">
                <span>🇬🇧 Điểm TB Tiếng Anh</span>
              </div>
              <p className="text-2xl font-extrabold text-emerald-700">
                {allSubmissions.filter(s => (s.subject || 'english') === 'english').length > 0
                  ? (allSubmissions.filter(s => (s.subject || 'english') === 'english').reduce((acc, c) => acc + c.score, 0) / allSubmissions.filter(s => (s.subject || 'english') === 'english').length).toFixed(2)
                  : '--'}
                <span className="text-xs font-normal text-[#8A8A70]"> / 10đ</span>
              </p>
              <p className="text-[11px] text-[#8A8A70]">{allSubmissions.filter(s => (s.subject || 'english') === 'english').length} bài thi Tiếng Anh</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
              <div className="flex items-center space-x-1.5 text-xs text-amber-700 font-bold">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Em Nguyễn Hoàng Hà</span>
              </div>
              <p className="text-2xl font-extrabold text-[#3D3D2D]">
                {allSubmissions.filter(s => s.studentId === siblingStat?.student?.id || s.studentName?.toLowerCase().includes('hà')).length} <span className="text-xs font-normal text-[#8A8A70]">bài</span>
              </p>
              <p className="text-[11px] text-[#8A8A70]">
                Điểm gần nhất: {allSubmissions.find(s => s.studentId === siblingStat?.student?.id || s.studentName?.toLowerCase().includes('hà'))?.score ?? '--'}đ
              </p>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Student Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#8A8A70] shrink-0">Học sinh:</span>
              <select
                value={submissionStudentFilter}
                onChange={(e) => setSubmissionStudentFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#3D3D2D] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả học sinh ({studentUsers.length})</option>
                {studentUsers.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.name} {stu.id === siblingStat?.student?.id ? '(Em bạn)' : ''} ({stu.targetSchool || 'THPT'})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter Tabs */}
            <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] text-xs font-bold shrink-0">
              <button
                onClick={() => setSubmissionSubjectFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${submissionSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
              >
                Tất cả môn
              </button>
              <button
                onClick={() => setSubmissionSubjectFilter('math')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${submissionSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
              >
                <span>📐 Toán ({allSubmissions.filter(s => s.subject === 'math').length})</span>
              </button>
              <button
                onClick={() => setSubmissionSubjectFilter('english')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${submissionSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                  }`}
              >
                <span>🇬🇧 Tiếng Anh ({allSubmissions.filter(s => (s.subject || 'english') === 'english').length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
              <input
                type="text"
                value={submissionSearchQuery}
                onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                placeholder="Tìm theo tên đề thi, tên học sinh..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              title="Chưa có bài thi nào được nộp"
              description="Khi học sinh hoàn thành các đề thi thử, toàn bộ kết quả, đáp án chi tiết và thời gian làm bài sẽ hiển thị đầy đủ tại đây."
              actionLabel="⚡ Mô phỏng nộp bài thi thử"
              onAction={() => handleSimulateStudentExam(9.0)}
            />
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub, idx) => {
                const accuracy = sub.totalQuestions > 0 ? Math.round((sub.correctCount / sub.totalQuestions) * 100) : 0;
                return (
                  <div
                    key={`${sub.id}_${idx}`}
                    className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-xs hover:border-[#D9D2C5] transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Left: Student & Exam Info */}
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl ${sub.studentAvatar || 'bg-[#5A5A40]'} text-white font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs`}>
                        {sub.studentName.charAt(0)}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h4 className="font-extrabold text-sm text-[#3D3D2D]">{sub.studentName}</h4>
                          <span className="text-[11px] text-[#8A8A70]">({sub.targetSchool || 'THPT'})</span>
                          <SubjectBadge subject={sub.subject || 'english'} size="sm" />
                        </div>

                        <p className="text-xs font-bold text-[#5A5A40] truncate max-w-lg">
                          📄 {sub.examTitle}
                        </p>

                        <div className="flex items-center space-x-3 text-[11px] text-[#8A8A70] flex-wrap gap-y-0.5">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDateVi(sub.date)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{Math.floor((sub.timeSpentSeconds || 0) / 60)} phút {(sub.timeSpentSeconds || 0) % 60} giây</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Scores & Action Button */}
                    <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F5F2ED]">
                      {/* Metric Pills */}
                      <div className="text-right space-y-0.5">
                        <div className="flex items-center space-x-2 justify-end">
                          <span className="text-xs font-bold text-[#8A8A70]">Đúng {sub.correctCount}/{sub.totalQuestions} ({accuracy}%)</span>
                          <ScorePill score={sub.score} size="md" />
                        </div>
                        <span className="text-[10px] text-[#8A8A70] block">
                          Sai: {sub.incorrectCount} câu • Bỏ qua: {sub.unattemptedCount || 0} câu
                        </span>
                      </div>

                      {/* Review Details Button */}
                      <button
                        onClick={() => handleOpenAttemptReview(sub, sub.studentName, sub.studentId)}
                        className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Xem bài làm</span>
                      </button>

                      {/* Delete Attempt Button */}
                      <button
                        onClick={() => {
                          if (confirm(`Xóa lần thi "${sub.examTitle}" của ${sub.studentName}?\nHành động này không thể hoàn tác.`)) {
                            deleteExamAttempt(sub.id, sub.studentId);
                            setSubmissionRev((r) => r + 1);
                          }
                        }}
                        className="p-2.5 text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 rounded-2xl hover:bg-red-50 transition cursor-pointer shrink-0"
                        title="Xóa lần thi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

                            <button
                              onClick={() => handleOpenEditStudent(student)}
                              className="p-1.5 text-blue-500 hover:text-blue-700 rounded-xl hover:bg-blue-50 transition cursor-pointer"
                              title="Chỉnh sửa thông tin học sinh"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(student)}
                              className="p-1.5 text-red-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition cursor-pointer"
                              title="Xóa tài khoản học sinh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${questionSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                    }`}
                >
                  Tất cả ({questions.length})
                </button>
                <button
                  onClick={() => setQuestionSubjectFilter('math')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${questionSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                    }`}
                >
                  <span>📐 Toán ({mathQCount})</span>
                </button>
                <button
                  onClick={() => setQuestionSubjectFilter('english')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${questionSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
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
                          className={`p-2 rounded-xl border whitespace-pre-line ${oIdx === q.correctOption
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
      {/* 🎓 TAB: EXAMS LIST (QUẢN LÝ ĐỀ THI AI & ĐỀ THI CHUẨN)                    */}
      {/* ========================================================================= */}
      {activeAdminTab === 'exams' && (() => {
        const mathExamsCount = exams.filter((e) => e.subject === 'math').length;
        const engExamsCount = exams.filter((e) => (e.subject || 'english') === 'english').length;
        const aiExamsCount = exams.filter((e) => e.id.startsWith('exam_ai_') || e.title.includes('AI') || e.title.includes('Generator')).length;
        const uploadExamsCount = exams.filter((e) => e.id.startsWith('admin_upload_') || e.title.includes('Upload')).length;
        const officialExamsCount = exams.filter((e) => !e.id.startsWith('exam_ai_') && !e.id.startsWith('admin_upload_')).length;

        const filteredExams = exams.filter((ex) => {
          // Subject Filter
          if (examSubjectFilter === 'math' && ex.subject !== 'math') return false;
          if (examSubjectFilter === 'english' && (ex.subject || 'english') !== 'english') return false;

          // Origin Filter
          const isAi = ex.id.startsWith('exam_ai_') || ex.title.includes('AI') || ex.title.includes('Generator');
          const isUpload = ex.id.startsWith('admin_upload_') || ex.title.includes('Upload');
          if (examOriginFilter === 'ai' && !isAi) return false;
          if (examOriginFilter === 'upload' && !isUpload) return false;
          if (examOriginFilter === 'official' && (isAi || isUpload)) return false;

          // Search Query
          if (
            searchExamQuery &&
            !ex.title.toLowerCase().includes(searchExamQuery.toLowerCase()) &&
            !ex.code.toLowerCase().includes(searchExamQuery.toLowerCase())
          ) {
            return false;
          }
          return true;
        });

        // Handler to export exam as JSON
        const handleExportExamJson = (ex: Exam) => {
          const examQuestions = ex.questionIds.map((qId) => getQuestionById(qId)).filter(Boolean);
          const exportData = { exam: ex, questions: examQuestions, exportedAt: new Date().toISOString() };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `de_thi_${ex.code || ex.id}.json`;
          a.click();
          URL.revokeObjectURL(url);
        };

        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Header Toolbar (2-Tier Spacious Layout) */}
            <div className="bg-white p-5 sm:p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-xs space-y-4">
              {/* Row 1: Title & Action Hub */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#F5F2ED]">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-[#1E3A8A]" />
                    <h3 className="text-base font-extrabold text-[#3D3D2D]">Ngân Hàng Đề Thi Tuyển Sinh Vào Lớp 10</h3>
                  </div>
                  <p className="text-xs text-[#8A8A70]">
                    Tổng cộng <span className="font-bold text-[#3D3D2D]">{exams.length} đề thi</span> • {mathExamsCount} Đề Toán • {engExamsCount} Đề Tiếng Anh • {aiExamsCount} Đề AI • {uploadExamsCount} Đề Upload
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAiCreateModal(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:opacity-95 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Wand2 className="w-4 h-4 text-amber-300" />
                    <span>🤖 AI Soạn Đề Mới</span>
                  </button>

                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>📄 Upload & Trích Xuất File</span>
                  </button>

                  <button
                    onClick={handleOpenCreateExam}
                    className="px-4 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>➕ Tạo Đề Thủ Công</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Filter & Search Controls */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                  {/* Subject Tabs */}
                  <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] shrink-0">
                    <button
                      onClick={() => setExamSubjectFilter('all')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${examSubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                    >
                      Tất cả ({exams.length})
                    </button>
                    <button
                      onClick={() => setExamSubjectFilter('math')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${examSubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                    >
                      <span>📐 Toán ({mathExamsCount})</span>
                    </button>
                    <button
                      onClick={() => setExamSubjectFilter('english')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${examSubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                        }`}
                    >
                      <span>🇬🇧 Tiếng Anh ({engExamsCount})</span>
                    </button>
                  </div>

                  {/* Origin Sub-Filter */}
                  <div className="flex items-center space-x-1 bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] shrink-0">
                    <button
                      onClick={() => setExamOriginFilter('all')}
                      className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${examOriginFilter === 'all' ? 'bg-[#5A5A40] text-white' : 'text-[#6B6B54]'
                        }`}
                    >
                      Tất cả nguồn
                    </button>
                    <button
                      onClick={() => setExamOriginFilter('ai')}
                      className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${examOriginFilter === 'ai' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'
                        }`}
                    >
                      <Wand2 className="w-3 h-3" />
                      <span>Đề AI ({aiExamsCount})</span>
                    </button>
                    <button
                      onClick={() => setExamOriginFilter('upload')}
                      className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer flex items-center space-x-1 ${examOriginFilter === 'upload' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-50'
                        }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Đề Upload ({uploadExamsCount})</span>
                    </button>
                    <button
                      onClick={() => setExamOriginFilter('official')}
                      className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer ${examOriginFilter === 'official' ? 'bg-emerald-700 text-white' : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                    >
                      Chuẩn Sở ({officialExamsCount})
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[220px] flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchExamQuery}
                    onChange={(e) => setSearchExamQuery(e.target.value)}
                    placeholder="Tìm theo tên đề, mã đề thi..."
                    className="w-full pl-9 pr-7 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                  />
                  {searchExamQuery && (
                    <button
                      onClick={() => setSearchExamQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-[#8A8A70] hover:text-[#3D3D2D]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 2 Feature Quick Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* AI Create Card */}
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white p-5 rounded-[2rem] shadow-md space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">🤖 AI Biên Soạn Đề Tuyển Sinh Vào 10</h4>
                    <p className="text-[11px] text-blue-100">Tự động soạn đề Toán & Tiếng Anh bám sát cấu trúc Sở GD&ĐT</p>
                  </div>
                </div>
                <ul className="text-[11px] text-blue-100 space-y-1 pl-1">
                  <li>✓ Tùy chỉnh môn học, ma trận kiến thức, thời gian thi và số lượng câu</li>
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
                    <h4 className="font-bold text-sm">📄 Upload Đề Thi & AI Trích Xuất File</h4>
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
                filteredExams.map((ex) => {
                  const isAiExam = ex.id.startsWith('exam_ai_') || ex.title.includes('AI') || ex.title.includes('Generator');
                  const isUploadExam = ex.id.startsWith('admin_upload_') || ex.title.includes('Upload');
                  const isMathExam = ex.subject === 'math';

                  return (
                    <div
                      key={ex.id}
                      className={`bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-3 transition hover:shadow-md ${isAiExam
                          ? 'border-blue-200 hover:border-blue-400'
                          : isUploadExam
                            ? 'border-amber-200 hover:border-amber-400'
                            : 'border-[#EAE7E0] hover:border-[#D9D2C5]'
                        }`}
                    >
                      {/* Top Badges */}
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                          <SubjectBadge subject={ex.subject || 'english'} size="sm" />
                          <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#5A5A40] text-[10px] font-mono font-bold rounded-lg border border-[#EAE7E0]">
                            {ex.code || ex.id}
                          </span>
                          {isAiExam ? (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center space-x-1 shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5 text-yellow-300" />
                              <span>AI Tạo Đề</span>
                            </span>
                          ) : isUploadExam ? (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300 flex items-center space-x-1">
                              <FileText className="w-2.5 h-2.5" />
                              <span>Trích Xuất File</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                              Chuẩn Sở GD&ĐT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-1 text-xs text-[#8A8A70]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{ex.timeLimitMinutes} phút</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="font-bold text-base text-[#3D3D2D] leading-snug">{ex.title}</h4>
                      <p className="text-xs text-[#8A8A70] line-clamp-2">{ex.description || 'Đề thi trắc nghiệm tuyển sinh vào lớp 10 THPT.'}</p>

                      {/* Question Count & Actions */}
                      <div className="pt-3 border-t border-[#F5F2ED] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <span className="text-[#8A8A70]">
                          Số lượng: <strong className="text-[#3D3D2D]">{ex.questionIds.length} câu hỏi</strong>
                        </span>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          {/* Preview Exam Button */}
                          <button
                            onClick={() => setSelectedExamForPreview(ex)}
                            className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer text-xs"
                            title="Xem trước toàn bộ câu hỏi và đáp án"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem đề</span>
                          </button>

                          {/* Assign to student Button */}
                          <button
                            onClick={() => {
                              setTaskAssignedExamId(ex.id);
                              setTaskTitle(ex.title);
                              setTaskSubject(ex.subject || 'math');
                              setShowAssignTaskModal(true);
                            }}
                            className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer text-xs shadow-2xs"
                            title="Giao đề thi này cho học sinh làm bài"
                          >
                            <Send className="w-3 h-3" />
                            <span>Giao bài</span>
                          </button>

                          {/* Export JSON Button */}
                          <button
                            onClick={() => handleExportExamJson(ex)}
                            className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                            title="Tải file JSON đề thi"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Exam Button */}
                          <button
                            onClick={() => handleOpenEditExam(ex)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                            title="Chỉnh sửa đề thi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Exam Button */}
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa đề thi "${ex.title}"?`)) deleteExam(ex.id);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Xóa đề thi khỏi hệ thống"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 📚 TAB: VOCABULARY & FLASHCARDS MANAGEMENT                                */}
      {/* ========================================================================= */}
      {activeAdminTab === 'vocab' && <VocabManagementTab />}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: REMOTE TASK ASSIGNMENT (GIAO NHIỆM VỤ CHO EM TỪ XA)            */}
      {/* ========================================================================= */}
      {showAssignTaskModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingTask) setShowAssignTaskModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
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

              {/* Deadline Setting */}
              <div className="space-y-1.5 p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0]">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#5A5A40] flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hạn chót làm bài (Deadline):</span>
                  </label>
                  {taskDeadline && (
                    <button
                      type="button"
                      onClick={() => setTaskDeadline('')}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Xóa hạn chót
                    </button>
                  )}
                </div>

                <input
                  type="datetime-local"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full p-2 bg-white border border-[#D9D2C5] rounded-xl outline-hidden font-bold text-xs text-[#3D3D2D]"
                />

                {/* Quick preset buttons */}
                <div className="flex flex-wrap gap-1 pt-1 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={setQuickDeadlineToday2359}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-lg transition cursor-pointer"
                  >
                    Tối nay 23:59
                  </button>
                  <button
                    type="button"
                    onClick={setQuickDeadlineTomorrow2100}
                    className="px-2 py-1 bg-white hover:bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-lg transition cursor-pointer"
                  >
                    Tối mai 21:00
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineInDays(2)}
                    className="px-2 py-1 bg-white hover:bg-[#EAE7E0] text-[#5A5A40] border border-[#D9D2C5] rounded-lg transition cursor-pointer"
                  >
                    +2 ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDeadlineInDays(3)}
                    className="px-2 py-1 bg-white hover:bg-[#EAE7E0] text-[#5A5A40] border border-[#D9D2C5] rounded-lg transition cursor-pointer"
                  >
                    +3 ngày
                  </button>
                  <button
                    type="button"
                    onClick={setQuickDeadlineSunday}
                    className="px-2 py-1 bg-white hover:bg-[#EAE7E0] text-[#5A5A40] border border-[#D9D2C5] rounded-lg transition cursor-pointer"
                  >
                    Chủ nhật
                  </button>
                </div>
              </div>

              {taskSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đã phát sóng nhiệm vụ thời gian thực đến học sinh!</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  disabled={isSubmittingTask}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask || taskSuccessMsg}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingTask ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi nhiệm vụ ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: ADMIN CONFIRM TASK COMPLETION (XÁC NHẬN HOÀN THÀNH BÀI TẬP)     */}
      {/* ========================================================================= */}
      {confirmModalTask && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModalTask(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">Xác Nhận Đạt Nhiệm Vụ</h3>
                  <p className="text-[11px] text-[#8A8A70]">Duyệt kết quả và gửi lời khen đến học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModalTask(null)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-1.5 text-xs">
              <p className="font-extrabold text-[#3D3D2D]">{confirmModalTask.title}</p>
              {confirmModalTask.studentScore !== undefined && (
                <p className="text-emerald-700 font-bold">
                  🎯 Điểm đạt được: {confirmModalTask.studentScore.toFixed(1)}/10 điểm
                </p>
              )}
              {confirmModalTask.studentNote && (
                <p className="text-[11px] text-[#64748B] italic">
                  📝 Lời nhắn học sinh: "{confirmModalTask.studentNote}"
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-[#5A5A40]">
                Lời nhận xét & Khen ngợi (tùy chọn):
              </label>
              <textarea
                rows={2}
                value={confirmFeedback}
                onChange={(e) => setConfirmFeedback(e.target.value)}
                placeholder="Ví dụ: Em làm bài rất tốt, câu khó giải chuẩn xác! Cố gắng phát huy nhé."
                className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-emerald-600 text-[#3D3D2D]"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
              <button
                type="button"
                onClick={() => setConfirmModalTask(null)}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleAdminConfirmTask(confirmModalTask, confirmFeedback)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 text-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Xác nhận hoàn thành</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: ADMIN REQUEST TASK REDO (YÊU CẦU LÀM LẠI BÀI TẬP)              */}
      {/* ========================================================================= */}
      {redoModalTask && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setRedoModalTask(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">Yêu Cầu Làm Lại Nhiệm Vụ</h3>
                  <p className="text-[11px] text-[#8A8A70]">Gửi yêu cầu làm lại kèm hướng dẫn sửa sai</p>
                </div>
              </div>
              <button
                onClick={() => setRedoModalTask(null)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-1 text-xs">
              <p className="font-extrabold text-[#3D3D2D]">{redoModalTask.title}</p>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-rose-800">
                Lời dặn dò & Điểm cần sửa (bắt buộc):
              </label>
              <textarea
                rows={3}
                value={redoFeedback}
                onChange={(e) => setRedoFeedback(e.target.value)}
                placeholder="Ví dụ: Em xem lại các câu hình học phần tứ giác nội tiếp và làm lại để đạt trên 8.0 điểm nhé."
                className="w-full p-2.5 bg-[#FAF9F6] border border-rose-200 rounded-xl outline-hidden focus:ring-1 focus:ring-rose-500 text-[#3D3D2D]"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
              <button
                type="button"
                onClick={() => setRedoModalTask(null)}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleAdminRequestRedo(redoModalTask, redoFeedback)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 text-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi yêu cầu làm lại</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🚀 MODAL: EDIT TASK DEADLINE (ĐIỀU CHỈNH / GIA HẠN DEADLINE)              */}
      {/* ========================================================================= */}
      {editDeadlineTask && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditDeadlineTask(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-blue-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">Điều Chỉnh Hạn Chót (Deadline)</h3>
                  <p className="text-[11px] text-[#8A8A70]">Gia hạn hoặc xóa hạn chót làm bài</p>
                </div>
              </div>
              <button
                onClick={() => setEditDeadlineTask(null)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-1 text-xs">
              <p className="font-extrabold text-[#3D3D2D]">{editDeadlineTask.title}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#5A5A40]">Hạn chót mới:</label>
                {editDeadlineInput && (
                  <button
                    type="button"
                    onClick={() => setEditDeadlineInput('')}
                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Xóa hạn chót
                  </button>
                )}
              </div>

              <input
                type="datetime-local"
                value={editDeadlineInput}
                onChange={(e) => setEditDeadlineInput(e.target.value)}
                className="w-full p-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl outline-hidden font-bold text-xs text-[#3D3D2D]"
              />

              {/* Quick presets for edit modal */}
              <div className="flex flex-wrap gap-1 pt-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    d.setHours(21, 0, 0, 0);
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    setEditDeadlineInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
                  }}
                  className="px-2 py-1 bg-[#FAF9F6] hover:bg-blue-50 text-[#1E3A8A] border border-blue-200 rounded-lg transition cursor-pointer"
                >
                  Tối mai 21:00
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 3);
                    d.setHours(21, 0, 0, 0);
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    setEditDeadlineInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
                  }}
                  className="px-2 py-1 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] border border-[#D9D2C5] rounded-lg transition cursor-pointer"
                >
                  +3 ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    d.setHours(21, 0, 0, 0);
                    const pad = (n: number) => n.toString().padStart(2, '0');
                    setEditDeadlineInput(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`);
                  }}
                  className="px-2 py-1 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] border border-[#D9D2C5] rounded-lg transition cursor-pointer"
                >
                  +1 tuần
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
              <button
                type="button"
                onClick={() => setEditDeadlineTask(null)}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveDeadlineEdit}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 text-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Lưu hạn chót</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL: STUDENT 360° DETAILED PERFORMANCE INSPECTOR                     */}
      {/* ========================================================================= */}
      {selectedStudentForDetail && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStudentForDetail(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
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

            {/* Student Quick Scores Banner & Real-time stats */}
            {(() => {
              const studentData = getUserScopedData(selectedStudentForDetail.id);
              const studentAttempts = studentData.examAttempts || [];
              const studentMistakes = Object.values(studentData.mistakes || {}) as MistakeItem[];
              const mathAttempts = studentAttempts.filter((a) => a.subject === 'math');
              const engAttempts = studentAttempts.filter((a) => (a.subject || 'english') === 'english');
              const avgMath = mathAttempts.length > 0
                ? (mathAttempts.reduce((acc, c) => acc + c.score, 0) / mathAttempts.length).toFixed(1)
                : '--';
              const avgEng = engAttempts.length > 0
                ? (engAttempts.reduce((acc, c) => acc + c.score, 0) / engAttempts.length).toFixed(1)
                : '--';
              const activeMistakes = studentMistakes.filter((m) => !m.mastered);

              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#D9D2C5]">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Toán / Điểm TB</span>
                      <p className="text-lg font-extrabold text-[#1E3A8A]">
                        {selectedStudentForDetail.targetScoreMath || selectedStudentForDetail.targetScore || 8.5}đ{' '}
                        <span className="text-xs font-normal text-[#8A8A70]">({avgMath}đ TB)</span>
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Mục tiêu Anh / Điểm TB</span>
                      <p className="text-lg font-extrabold text-[#5A5A40]">
                        {selectedStudentForDetail.targetScoreEnglish || selectedStudentForDetail.targetScore || 8.5}đ{' '}
                        <span className="text-xs font-normal text-[#8A8A70]">({avgEng}đ TB)</span>
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Chuỗi ngày học</span>
                      <p className="text-lg font-extrabold text-[#E67E22]">
                        🔥 {selectedStudentForDetail.streakDays || 0} ngày
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-[#8A8A70]">Trạng thái / Đề đã nộp</span>
                      <p className="text-sm font-bold text-[#8BA888]">
                        {selectedStudentForDetail.isLocked ? '🔒 Đang khóa' : `✓ ${studentAttempts.length} đề thi`}
                      </p>
                    </div>
                  </div>

                  {/* Exam Attempts History for this student */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-[#5A5A40]" />
                        <span>Lịch Sử Bài Thi Thử Đã Hoàn Thành ({studentAttempts.length} bài):</span>
                      </div>
                    </h4>

                    {studentAttempts.length === 0 ? (
                      <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-center text-xs text-[#8A8A70] space-y-1">
                        <p className="font-semibold text-[#3D3D2D]">Học sinh chưa hoàn thành bài thi thử nào.</p>
                        <p className="text-[11px]">
                          Khi học sinh làm bài và nộp bài, toàn bộ kết quả, điểm số và chi tiết từng câu sẽ tự động hiển thị ở đây.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                        {studentAttempts.map((att, idx) => (
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
                                Thời gian: {Math.round((att.timeSpentSeconds || 1800) / 60)} phút • Ngày{' '}
                                {new Date(att.date).toLocaleDateString('vi-VN')}
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
                                    studentId: selectedStudentForDetail.id,
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
                    <h4 className="text-sm font-bold text-[#3D3D2D] flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BookMarked className="w-4 h-4 text-[#E67E22]" />
                        <span>Sổ Câu Sai Cần Bồi Dưỡng Của Học Sinh ({activeMistakes.length} câu):</span>
                      </div>
                    </h4>

                    {activeMistakes.length === 0 ? (
                      <div className="p-4 bg-[#EBF2EB] rounded-2xl border border-[#8BA888]/30 text-center text-xs text-emerald-800 font-medium">
                        Không có câu sai tồn đọng! Học sinh đã nắm chắc kiến thức hoặc chưa làm sai câu nào.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                        {activeMistakes.map((m, idx) => (
                          <div key={idx} className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-[#FDF2E9] text-[#E67E22] font-bold rounded text-[10px]">
                                Sai {m.wrongCount} lần
                              </span>
                              <span className="text-[10px] text-[#8A8A70] uppercase font-bold">
                                {m.subject === 'math' ? '📐 Toán' : '🇬🇧 Anh'}
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
                </>
              );
            })()}

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

              <div className="flex justify-end gap-2">
                {teacherNoteInput.trim() && (
                  <button
                    onClick={() => handleDeleteTeacherNote(selectedStudentForDetail!.id)}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa ghi chú</span>
                  </button>
                )}
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

      {/* ✏️ MODAL: EDIT STUDENT */}
      {showEditStudentModal && editStudentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#3D3D2D] text-base">Chỉnh Sửa Thông Tin Học Sinh</h3>
              </div>
              <button
                onClick={() => setShowEditStudentModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Mật khẩu mới (để trống = không đổi):</label>
                <input
                  type="text"
                  value={editStudentPassword}
                  onChange={(e) => setEditStudentPassword(e.target.value)}
                  placeholder="Để trống nếu không muốn đổi mật khẩu"
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Trường THPT Nguyện vọng 1:</label>
                <input
                  type="text"
                  value={editStudentSchool}
                  onChange={(e) => setEditStudentSchool(e.target.value)}
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
                    value={editStudentTargetMath}
                    onChange={(e) => setEditStudentTargetMath(parseFloat(e.target.value) || 8.5)}
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
                    value={editStudentTargetEng}
                    onChange={(e) => setEditStudentTargetEng(parseFloat(e.target.value) || 8.5)}
                    className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40]"
                  />
                </div>
              </div>

              {editStudentMsg && (
                <p className="text-green-600 font-bold text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editStudentMsg}</span>
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditStudent}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
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
              <h3 className="font-bold text-[#3D3D2D] text-base">
                {editingExam ? '✏️ Chỉnh Sửa Đề Thi' : 'Tạo Đề Thi Tuyển Sinh Mới'}
              </h3>
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
                const examData = {
                  subject: examSubject,
                  title: examTitle,
                  code: examCode,
                  description: examDesc,
                  targetProvince: 'Toàn quốc',
                  timeLimitMinutes: examTime,
                  totalQuestions: selectedQIds.length,
                  difficulty: 'standard' as const,
                  questionIds: selectedQIds.length > 0 ? selectedQIds : questions.slice(0, 10).map((q) => q.id),
                  isOfficialFormat: true,
                };
                if (editingExam) {
                  updateExam(editingExam.id, examData);
                } else {
                  addExam(examData);
                }
                setShowExamModal(false);
                setEditingExam(null);
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
                  {editingExam ? 'Cập nhật đề thi' : 'Tạo đề thi'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[94vh] overflow-y-auto">
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
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${aiQSubject === s
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

                {/* Chọn Model AI */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Mô hình AI (Model)</label>
                  <select
                    value={aiQModel}
                    onChange={(e) => setAiQModel(e.target.value)}
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  >
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
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
      {/* 🤖 MODAL: AI TẠO ĐỀ NHANH (MÀN HÌNH RỘNG MAX-W-5XL)        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showAiCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[94vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-xs">
                  <Wand2 className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-extrabold text-[#3D3D2D] text-lg sm:text-xl">🤖 AI Tạo Đề Thi Tuyển Sinh Vào 10</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                      Studio Soạn Đề
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8A70]">Tùy biến ma trận, độ khó từng chuyên đề & sinh lời giải tự động</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAiCreateModal(false);
                  setAiCreateResult(null);
                  setAiCreateError('');
                }}
                className="p-2 text-[#8A8A70] hover:text-red-600 rounded-xl hover:bg-[#FAF9F6] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiCreateResult ? (
              <div className="text-center space-y-4 py-8 overflow-y-auto flex-1 flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                  <span className="text-4xl">🎉</span>
                </div>
                <div>
                  <h4 className="font-extrabold text-[#3D3D2D] text-xl">Tạo đề thi thành công!</h4>
                  <p className="text-sm text-[#5A5A40] mt-1">
                    AI đã biên soạn hoàn chỉnh <strong>{aiCreateResult.questionCount} câu hỏi</strong> chuẩn ma trận và lưu vào kho đề thi của bạn.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center pt-2">
                  <button
                    onClick={() => {
                      const newExam = exams.find((e) => e.id === aiCreateResult.examId);
                      setShowAiCreateModal(false);
                      setAiCreateResult(null);
                      setActiveAdminTab('exams');
                      if (newExam) setSelectedExamForPreview(newExam);
                    }}
                    className="px-6 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:bg-[#1E40AF] transition cursor-pointer shadow-xs flex items-center space-x-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Xem trước đề vừa tạo</span>
                  </button>
                  <button
                    onClick={() => {
                      setAiCreateResult(null);
                      setAiCreatePrompt('');
                    }}
                    className="px-5 py-2.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#3D3D2D] border border-[#D9D2C5] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    + Tạo thêm đề khác
                  </button>
                  <button
                    onClick={() => {
                      setShowAiCreateModal(false);
                      setAiCreateResult(null);
                      setActiveAdminTab('exams');
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-[#FAF9F6] text-[#6B6B54] border border-[#EAE7E0] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Về kho đề thi
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-y-auto space-y-4 flex-1 pr-1">
                {!getStoredApiKey() && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">⚠️</span>
                      <span>Chưa cài đặt Gemini API Key để khởi tạo đề thi bằng AI.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAdminApiKeyInput(getStoredApiKey());
                        setAdminKeyValidationResult(null);
                        setShowGeminiKeyModal(true);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition cursor-pointer"
                    >
                      🔑 Cài Key ngay
                    </button>
                  </div>
                )}

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Cấu hình cơ bản & Prompt (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">Môn học</label>
                      <div className="flex gap-2">
                        {(['math', 'english'] as SubjectId[]).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleAiCreateSubjectChange(s)}
                            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
                              aiCreateSubject === s
                                ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                                : 'bg-[#FAF9F6] text-[#5A5A40] border-[#D9D2C5] hover:bg-[#E8E2D9]'
                            }`}
                          >
                            {s === 'math' ? '📐 Toán học 9' : '🇬🇧 Tiếng Anh 9'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Số câu & Độ khó chung */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">Số lượng câu</label>
                        <select
                          value={aiCreateCount}
                          onChange={(e) => setAiCreateCount(Number(e.target.value))}
                          className="w-full border border-[#D9D2C5] bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold text-[#3D3D2D] focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                          {[5, 10, 12, 15, 20, 25, 30, 40].map((n) => (
                            <option key={n} value={n}>
                              {n} câu hỏi
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">Độ khó tổng thể</label>
                        <select
                          value={aiCreateDiff}
                          onChange={(e) => setAiCreateDiff(e.target.value as any)}
                          className="w-full border border-[#D9D2C5] bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-bold text-[#3D3D2D] focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        >
                          <option value="standard">Cơ bản (Mục tiêu 7 - 8đ)</option>
                          <option value="advanced">Khá - Giỏi (Mục tiêu 8 - 8.5đ)</option>
                          <option value="challenge">Phân loại cao (Mục tiêu 9 - 10đ)</option>
                        </select>
                      </div>
                    </div>

                    {/* Chọn Model AI */}
                    <div>
                      <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">Mô hình Gemini AI</label>
                      <select
                        value={aiCreateModel}
                        onChange={(e) => setAiCreateModel(e.target.value)}
                        className="w-full border border-[#D9D2C5] bg-[#FAF9F6] rounded-xl px-3 py-2 text-xs font-semibold text-[#3D3D2D] focus:ring-2 focus:ring-blue-400 focus:outline-none"
                      >
                        {AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Prompt */}
                    <div>
                      <label className="block text-xs font-bold text-[#5A5A40] mb-1.5">
                        Yêu cầu nội dung cụ thể (Prompt tự do)
                      </label>
                      <textarea
                        value={aiCreatePrompt}
                        onChange={(e) => setAiCreatePrompt(e.target.value)}
                        rows={4}
                        placeholder={
                          aiCreateSubject === 'math'
                            ? 'Ví dụ: Tập trung vào Hệ thức Vi-ét có tham số m, bài toán chuyển động thực tế và câu hình tứ giác nội tiếp. Câu cuối 0.5đ BĐT Cauchy...'
                            : 'Ví dụ: Tập trung ngữ pháp câu điều kiện loại 2-3, câu bị động kép, 5 câu hỏi đuôi và 1 bài đọc hiểu về bảo vệ môi trường...'
                        }
                        className="w-full border border-[#D9D2C5] bg-[#FAF9F6] rounded-2xl p-3 text-xs resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none placeholder:text-[#A09F8E]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Chuyên đề & Tinh chỉnh độ khó từng mục (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Topic Selection Checklist */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[#5A5A40]">
                          Chuyên đề kiểm tra ({aiCreateSelectedTopics.length} đã chọn):
                        </label>
                        <span className="text-[10px] text-[#8A8A70]">Bấm để bật / tắt chuyên đề</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl">
                        {(aiCreateSubject === 'math' ? MATH_TOPICS_META : TOPICS_META).map((t) => {
                          const isChecked = aiCreateSelectedTopics.includes(t.id as TopicId);
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => handleToggleAiCreateTopic(t.id as TopicId)}
                              className={`p-2 rounded-xl text-left text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                isChecked
                                  ? 'bg-[#1E3A8A] text-white shadow-2xs'
                                  : 'bg-white border border-[#D9D2C5] text-[#6B6B54] hover:bg-[#E8E2D9]'
                              }`}
                            >
                              <span className="truncate pr-1">{t.nameVi}</span>
                              {isChecked ? (
                                <Check className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-[#D9D2C5] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Granular Per-Topic Difficulty Customizer */}
                    {aiCreateSelectedTopics.length > 0 && (
                      <div className="p-3.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-[#EAE7E0]">
                          <label className="text-xs font-extrabold text-[#3D3D2D] flex items-center space-x-1">
                            <span>🎯 Tinh chỉnh độ khó riêng từng mục:</span>
                          </label>
                          <div className="flex flex-wrap gap-1">
                            <button
                              type="button"
                              onClick={() => handleApplyAiCreateDiffPreset('gradual')}
                              className="px-2 py-1 bg-white hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[10px] font-bold text-[#5A5A40] rounded-lg transition cursor-pointer"
                            >
                              ⚡ Đầu dễ - đuôi khó
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyAiCreateDiffPreset('all_basic')}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              🟢 Cơ bản
                            </button>
                            <button
                              type="button"
                              onClick={() => handleApplyAiCreateDiffPreset('all_hard')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            >
                              🔥 Khó (9-10)
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {aiCreateSelectedTopics.map((tId) => {
                            const meta = (aiCreateSubject === 'math' ? MATH_TOPICS_META : TOPICS_META).find((m) => m.id === tId);
                            const curDiff = aiCreateTopicDifficulties[tId] || 'medium';

                            return (
                              <div
                                key={tId}
                                className="p-2.5 bg-white rounded-xl border border-[#EAE7E0] flex items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-bold text-[#3D3D2D] truncate block">
                                    {meta?.nameVi || tId}
                                  </span>
                                  <span className="text-[10px] text-[#8A8A70] block truncate">
                                    {meta?.weightInExam || 'Trọng tâm'}
                                  </span>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  {[
                                    { id: 'easy', label: 'Dễ (6-7)', bg: 'bg-emerald-700 text-white' },
                                    { id: 'medium', label: 'TB (7-8)', bg: 'bg-blue-700 text-white' },
                                    { id: 'hard', label: 'Khá (8-9)', bg: 'bg-amber-600 text-white' },
                                    { id: 'expert', label: 'Điểm 10', bg: 'bg-rose-700 text-white' },
                                  ].map((lvl) => (
                                    <button
                                      key={lvl.id}
                                      type="button"
                                      onClick={() => handleSetAiCreateTopicDiff(tId, lvl.id as any)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                        curDiff === lvl.id
                                          ? `${lvl.bg} shadow-2xs ring-1 ring-black/10`
                                          : 'bg-[#F5F2ED] text-[#6B6B54] hover:bg-[#EAE7E0]'
                                      }`}
                                    >
                                      {lvl.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {aiCreateError && (
                  <div className="bg-red-50 text-red-700 text-xs font-medium p-3.5 rounded-2xl border border-red-200">
                    ⚠️ {aiCreateError}
                  </div>
                )}

                {/* Progress */}
                {aiCreateLoading && (
                  <div className="bg-blue-50 text-blue-700 text-xs font-medium p-3.5 rounded-2xl border border-blue-200 flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                    <span>{aiCreateProgress || 'Đang khởi tạo câu hỏi & lời giải chi tiết...'}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleAiCreateExam}
                    disabled={aiCreateLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#172554] hover:to-[#1D4ED8] text-white font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{aiCreateLoading ? '⏳ AI đang biên soạn đề thi...' : `🚀 AI Biên Soạn ${aiCreateCount} Câu Hỏi & Lưu Đề Thi`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📄 MODAL: UPLOAD ĐỀ & AI EXTRACT                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[94vh] overflow-y-auto">
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
                <p className="text-sm text-[#5A5A40]">Hệ thống và AI đã trích xuất hoàn chỉnh <strong>{uploadResult.questionCount} câu hỏi</strong> và gắn bài đọc tương ứng.</p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <button
                    onClick={() => {
                      const newExam = exams.find((e) => e.id === uploadResult.examId);
                      setShowUploadModal(false);
                      setUploadResult(null);
                      setActiveAdminTab('exams');
                      if (newExam) setSelectedExamForPreview(newExam);
                    }}
                    className="px-5 py-2.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:bg-[#1E40AF] transition cursor-pointer shadow-xs"
                  >
                    👁️ Xem trước đề thi vừa tạo
                  </button>
                  <button
                    onClick={() => {
                      setUploadResult(null);
                      setUploadFileContent('');
                      setUploadFileName('');
                      setUploadTitle('');
                    }}
                    className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition cursor-pointer"
                  >
                    + Upload thêm
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!getStoredApiKey() && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">⚠️</span>
                      <span>Chưa cài đặt Gemini API Key để trích xuất đề thi.</span>
                    </div>
                    <button
                      onClick={() => {
                        setAdminApiKeyInput(getStoredApiKey());
                        setAdminKeyValidationResult(null);
                        setShowGeminiKeyModal(true);
                      }}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition cursor-pointer shrink-0 ml-2"
                    >
                      🔑 Cài Key ngay
                    </button>
                  </div>
                )}
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

                {/* Chọn Model AI */}
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1.5">Mô hình AI (Model)</label>
                  <select value={uploadModel} onChange={(e) => setUploadModel(e.target.value)}
                    className="w-full border border-[#EAE7E0] rounded-xl px-3 py-2 text-sm text-[#3D3D2D] focus:ring-2 focus:ring-amber-400 focus:outline-none">
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
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
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedAttemptForReview(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in"
          >
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
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${attemptQuestionFilter === 'all'
                        ? 'bg-white text-[#3D3D2D] shadow-xs'
                        : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                      }`}
                  >
                    Tất cả ({reviewQuestions.length})
                  </button>
                  <button
                    onClick={() => setAttemptQuestionFilter('wrong')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${attemptQuestionFilter === 'wrong'
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'text-red-700 hover:text-red-900'
                      }`}
                  >
                    <span>❌ Làm sai ({wrongQ})</span>
                  </button>
                  <button
                    onClick={() => setAttemptQuestionFilter('correct')}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${attemptQuestionFilter === 'correct'
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
                        className={`p-5 rounded-[2rem] border transition space-y-3.5 bg-white ${isCorrect
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

      {/* ========================================================================= */}
      {/* 👁️ MODAL: EXAM PREVIEW & FULL QUESTION MATRIX (XEM TRƯỚC ĐỀ THI AI/CHUẨN) */}
      {/* ========================================================================= */}
      {selectedExamForPreview && (() => {
        const previewQuestions: Question[] = selectedExamForPreview.questionIds
          .map((qId) => getQuestionById(qId))
          .filter(Boolean) as Question[];

        const isAi = selectedExamForPreview.id.startsWith('exam_ai_') || selectedExamForPreview.title.includes('AI');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-[#FAF9F6] rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D9D2C5] overflow-hidden">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-white border-b border-[#EAE7E0] flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl ${isAi ? 'bg-blue-600 text-white' : 'bg-[#5A5A40] text-white'} flex items-center justify-center shrink-0 shadow-xs`}>
                    {isAi ? <Wand2 className="w-5 h-5 text-amber-300" /> : <GraduationCap className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <SubjectBadge subject={selectedExamForPreview.subject || 'english'} size="sm" />
                      <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#5A5A40] text-[10px] font-mono font-bold rounded-lg border border-[#EAE7E0]">
                        {selectedExamForPreview.code || selectedExamForPreview.id}
                      </span>
                      {isAi && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full">
                          AI Generator
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-base sm:text-lg text-[#3D3D2D] truncate">
                      {selectedExamForPreview.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      const ex = selectedExamForPreview;
                      setTaskAssignedExamId(ex.id);
                      setTaskTitle(ex.title);
                      setTaskSubject(ex.subject || 'math');
                      setSelectedExamForPreview(null);
                      setShowAssignTaskModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs font-bold rounded-xl flex items-center space-x-1 transition cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Giao đề này</span>
                  </button>
                  <button
                    onClick={() => setSelectedExamForPreview(null)}
                    className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl hover:bg-[#FAF9F6] transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Meta Summary Bar */}
              <div className="bg-[#FAF9F6] px-6 py-3 border-b border-[#EAE7E0] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5A5A40]">
                <div className="flex items-center space-x-4">
                  <span>⏱️ Thời gian: <strong>{selectedExamForPreview.timeLimitMinutes} phút</strong></span>
                  <span>📝 Số lượng: <strong>{previewQuestions.length} câu hỏi</strong></span>
                  <span>🎯 Mục tiêu: <strong>{selectedExamForPreview.targetProvince || 'Toàn quốc'}</strong></span>
                </div>
                <span className="text-[11px] text-[#8A8A70]">
                  {selectedExamForPreview.description || 'Đề thi trắc nghiệm tuyển sinh vào 10'}
                </span>
              </div>

              {/* Questions List */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {previewQuestions.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-[#EAE7E0] text-xs text-[#8A8A70]">
                    Đề thi này chưa có câu hỏi nào được liên kết.
                  </div>
                ) : (
                  previewQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F5F2ED]">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 bg-[#5A5A40] text-white text-xs font-extrabold rounded-lg">
                            Câu {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#5A5A40] text-[10px] font-bold rounded-lg border border-[#EAE7E0]">
                            {q.topicId || 'Chuyên đề ôn thi'}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#8A8A70]">
                          Độ khó: {q.difficulty === 'easy' ? 'Nhận biết' : q.difficulty === 'medium' ? 'Thông hiểu' : 'Vận dụng'}
                        </span>
                      </div>

                      {q.passage && (
                        <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] text-xs text-[#5A5A40] italic leading-relaxed">
                          {q.passage}
                        </div>
                      )}

                      <div className="text-sm font-semibold text-[#3D3D2D] leading-relaxed">
                        {q.content}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correctOption;
                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                  : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#3D3D2D]'
                                }`}
                            >
                              <span>{opt}</span>
                              {isCorrect && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold shrink-0 ml-2">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs space-y-1.5">
                        <div className="font-bold text-[#5A5A40] flex items-center space-x-1">
                          <span>💡 Lời giải & Phương pháp:</span>
                        </div>
                        <p className="text-[#3D3D2D] leading-relaxed pl-3 border-l-2 border-[#5A5A40]">
                          {q.explanation}
                        </p>
                        {q.grammarRule && (
                          <p className="text-[11px] text-[#5A5A40]">
                            <strong>📐 Định lý:</strong> {q.grammarRule}
                          </p>
                        )}
                        {q.commonMistakeTip && (
                          <p className="text-[11px] text-[#E67E22]">
                            <strong>⚠️ Lưu ý bẫy:</strong> {q.commonMistakeTip}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white border-t border-[#EAE7E0] flex justify-between items-center shrink-0">
                <span className="text-xs text-[#8A8A70]">
                  Tổng số: <strong>{previewQuestions.length} câu hỏi</strong> trong đề thi
                </span>
                <button
                  onClick={() => setSelectedExamForPreview(null)}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Đóng xem trước
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🔑 MODAL: CẤU HÌNH GEMINI API KEY CHO ADMIN                 */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showGeminiKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#3D3D2D] text-base sm:text-lg">🔑 Cấu Hình Gemini AI Key</h3>
                  <p className="text-[11px] text-[#8A8A70]">Dùng cho tính năng Trích xuất đề thi, Tạo đề AI & AI Gia sư</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGeminiKeyModal(false);
                  setAdminKeyValidationResult(null);
                  setAdminKeySavedMsg(false);
                }}
                className="text-[#8A8A70] hover:text-red-500 font-bold p-1 cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            {/* Current Key Status Badge */}
            <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#5A5A40]">Trạng thái hiện tại:</span>
                {getStoredApiKey() ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[11px] font-bold flex items-center space-x-1">
                    <span>🟢 Đã kết nối API Key</span>
                    {isApiKeyFromEnv() && <span className="text-[9px] opacity-75">(từ .env)</span>}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[11px] font-bold">
                    🔴 Chưa cấu hình Key
                  </span>
                )}
              </div>
              {getStoredApiKey() && (
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa Gemini API Key đã lưu khỏi trình duyệt?')) {
                      clearStoredApiKey();
                      setAdminApiKeyInput('');
                      setAdminKeyValidationResult(null);
                      setAdminKeySavedMsg(true);
                      setTimeout(() => setAdminKeySavedMsg(false), 2000);
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center space-x-1 cursor-pointer transition"
                  title="Xóa Key khỏi trình duyệt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa Key</span>
                </button>
              )}
            </div>

            {/* Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3D3D2D] mb-1.5">
                  Nhập Google Gemini API Key:
                </label>
                <div className="relative">
                  <input
                    type={adminShowKeyText ? 'text' : 'password'}
                    value={adminApiKeyInput}
                    onChange={(e) => {
                      setAdminApiKeyInput(e.target.value);
                      setAdminKeyValidationResult(null);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full px-3.5 py-2.5 pr-10 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs font-mono text-[#3D3D2D] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAdminShowKeyText(!adminShowKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
                  >
                    {adminShowKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Choice */}
              <div>
                <label className="block text-xs font-bold text-[#3D3D2D] mb-1.5">
                  Mô hình AI ưu tiên (Mặc định):
                </label>
                <select
                  value={adminSelectedModel}
                  onChange={(e) => setAdminSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Validation Result Notice */}
              {adminKeyValidationResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${adminKeyValidationResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                >
                  {adminKeyValidationResult.success ? '✅ ' : '❌ '}
                  {adminKeyValidationResult.message}
                </div>
              )}

              {/* Saved Success Notice */}
              {adminKeySavedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl text-center">
                  ✨ Đã cập nhật Gemini API Key thành công!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (!adminApiKeyInput.trim()) {
                      setAdminKeyValidationResult({ success: false, message: 'Vui lòng nhập API Key để kiểm tra' });
                      return;
                    }
                    setAdminKeyTesting(true);
                    setAdminKeyValidationResult(null);
                    try {
                      const res = await validateApiKey(adminApiKeyInput.trim(), adminSelectedModel);
                      setAdminKeyValidationResult(res);
                    } catch (e: any) {
                      setAdminKeyValidationResult({ success: false, message: e.message || 'Lỗi kiểm tra API Key' });
                    } finally {
                      setAdminKeyTesting(false);
                    }
                  }}
                  disabled={adminKeyTesting || !adminApiKeyInput.trim()}
                  className="flex-1 py-2.5 bg-[#FAF9F6] hover:bg-[#EAE7E0] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {adminKeyTesting ? (
                    <span>⏳ Đang kiểm tra...</span>
                  ) : (
                    <>
                      <span>🔍 Kiểm tra kết nối (Validate)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!adminApiKeyInput.trim()) {
                      setAdminKeyValidationResult({ success: false, message: 'Vui lòng nhập API Key trước khi lưu' });
                      return;
                    }
                    setStoredApiKey(adminApiKeyInput.trim());
                    setAdminKeySavedMsg(true);
                    setTimeout(() => {
                      setAdminKeySavedMsg(false);
                      setShowGeminiKeyModal(false);
                    }, 1200);
                  }}
                  disabled={!adminApiKeyInput.trim()}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>💾 Lưu API Key</span>
                </button>
              </div>

              {/* Free API Key Instructions */}
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1.5">
                <div className="font-bold flex items-center space-x-1">
                  <span>💡 Hướng dẫn lấy Gemini API Key miễn phí:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-blue-900 leading-relaxed">
                  <li>Truy cập Google AI Studio: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700 hover:text-blue-900">aistudio.google.com/app/apikey</a></li>
                  <li>Đăng nhập tài khoản Google và bấm <strong>"Create API key"</strong>.</li>
                  <li>Copy chuỗi khóa API (bắt đầu bằng <code>AIzaSy...</code>) và dán vào ô trên rồi bấm <strong>Lưu</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
