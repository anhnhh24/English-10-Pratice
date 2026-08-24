import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, Question } from '../../types';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import {
  getLocalExamEvaluation,
  generateExamEvaluationWithAI,
  getStoredApiKey,
  ExamEvaluationReport,
  AVAILABLE_MODELS,
} from '../../services/aiExamService';
import { logAndBroadcastActivity } from '../../services/realtimeSyncService';
import { AiQuestionExplainerModal } from '../common/AiQuestionExplainerModal';
import confetti from 'canvas-confetti';
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Bookmark,
  ArrowLeft,
  Check,
  Sparkles,
  Award,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
  ListOrdered,
  X,
  FileText,
  Zap,
  Wand2,
} from 'lucide-react';

interface ExamSimulatorViewProps {
  examId?: string;
  onBackToDashboard: () => void;
  onOpenAiTutor?: (q: Question) => void;
}

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  examId,
  onBackToDashboard,
}) => {
  const {
    currentSubject,
    currentUser,
    exams,
    getQuestionById,
    saveExamAttempt,
    isBookmarked,
    toggleBookmark,
  } = useApp();

  // Filter exams by current subject
  const subjectExams = exams.filter((e) => (e.subject || 'english') === currentSubject);
  const defaultInitialExamId =
    examId && subjectExams.some((e) => e.id === examId)
      ? examId
      : subjectExams.length > 0
        ? subjectExams[0].id
        : 'exam_official_01';

  const [selectedExamId, setSelectedExamId] = useState<string>(defaultInitialExamId);
  const [examTabFilter, setExamTabFilter] = useState<'all' | 'official' | 'speed' | 'custom'>('all');

  const exam = exams.find((e) => e.id === selectedExamId) || subjectExams[0] || exams[0];

  useEffect(() => {
    setStage('intro');
    setCompletedAttempt(null);
    setUserAnswers({});
    setFlaggedIds([]);
    setCurrentIdx(0);
    setAiEvaluation(null);
    setAiError(null);
    if (examId && subjectExams.some((e) => e.id === examId)) {
      setSelectedExamId(examId);
    } else if (subjectExams.length > 0) {
      setSelectedExamId(subjectExams[0].id);
    }
  }, [examId, currentSubject]);

  // Exam States
  const [stage, setStage] = useState<'intro' | 'active' | 'result'>('intro');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(exam ? exam.timeLimitMinutes * 60 : 3600);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [filterResult, setFilterResult] = useState<'all' | 'wrong' | 'flagged'>('all');
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);

  // AI Diagnostic Assessment States
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiEvaluation, setAiEvaluation] = useState<ExamEvaluationReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiEvalModel, setAiEvalModel] = useState<string>('gemini-3.6-flash');

  // Completed Attempt State
  const [completedAttempt, setCompletedAttempt] = useState<any>(null);

  // Anti-Cheat: Tab Switch Detection State
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);

  // Focus Mode, Scratchpad & Auto-save Draft States
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [draftExists, setDraftExists] = useState<boolean>(false);
  const [aiQuestionExplain, setAiQuestionExplain] = useState<Record<string, string>>({});
  const [aiQuestionLoading, setAiQuestionLoading] = useState<string | null>(null);
  const [activeQuestionForAiExplainer, setActiveQuestionForAiExplainer] = useState<{
    question: Question;
    userSelectedOption?: number;
  } | null>(null);

  const DRAFT_KEY = `edu10_exam_draft_${examId || selectedExamId}_${currentUser?.id || 'guest'}`;

  // Check draft existence
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.userAnswers && Object.keys(parsed.userAnswers).length > 0) {
          setDraftExists(true);
        }
      }
    } catch (e) { }
  }, [DRAFT_KEY]);

  // Save draft during active exam
  useEffect(() => {
    if (stage === 'active') {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          userAnswers,
          flaggedIds,
          timeLeft,
          timestamp: new Date().toISOString()
        }));
      } catch (e) { }
    }
  }, [userAnswers, flaggedIds, timeLeft, stage, DRAFT_KEY]);

  const handleRestoreDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.userAnswers) setUserAnswers(parsed.userAnswers);
        if (parsed.flaggedIds) setFlaggedIds(parsed.flaggedIds);
        if (parsed.timeLeft) setTimeLeft(parsed.timeLeft);
        setStage('active');
        setDraftExists(false);
      }
    } catch (e) { }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setDraftExists(false);
    } catch (e) { }
  };

  // Anti-cheat listener effect
  useEffect(() => {
    if (stage !== 'active') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const nextCount = prev + 1;
          setShowTabWarning(true);

          // Broadcast alert to guardian / admin in real-time
          logAndBroadcastActivity({
            userId: currentUser.id,
            userName: currentUser.name,
            avatarColor: currentUser.avatarColor,
            subject: exam.subject || currentSubject,
            type: 'tab_switched',
            title: `Cảnh báo rời màn hình thi (${nextCount} lần)`,
            detail: `Học sinh vừa chuyển sang tab/ứng dụng khác khi đang làm bài thi "${exam.title}"!`,
            examTitle: exam.title,
            tabSwitchCount: nextCount,
          });

          return nextCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [stage, exam, currentUser, currentSubject]);

  // Timer effect
  useEffect(() => {
    if (stage !== 'active') return;

    if (timeLeft <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft <= 0]);

  const examQuestions = exam
    ? (exam.questionIds.map((id) => getQuestionById(id)).filter(Boolean) as Question[])
    : [];

  const currentQ = examQuestions[currentIdx];

  const handleStartExam = (selectedId?: string, retryCount = 0) => {
    const idToUse = selectedId || selectedExamId;
    if (selectedId) setSelectedExamId(selectedId);
    const targetExam = exams.find((e) => e.id === idToUse) || subjectExams[0] || exams[0];
    if (!targetExam) return;

    const targetQuestions = targetExam.questionIds
      .map((id) => getQuestionById(id))
      .filter(Boolean) as Question[];

    if (targetQuestions.length === 0) {
      if (retryCount < 1) {
        // Questions may have been just imported (bulkImportQuestions) and state hasn't re-rendered yet.
        // Wait one tick for React to commit the new state, then retry once.
        setTimeout(() => handleStartExam(selectedId || idToUse, retryCount + 1), 150);
        return;
      }
      alert('Đề thi này hiện chưa có câu hỏi nào trong ngân hàng đề. Vui lòng chọn đề thi khác hoặc tạo đề với AI!');
      return;
    }

    // Broadcast exam started event
    logAndBroadcastActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      avatarColor: currentUser.avatarColor,
      subject: targetExam.subject || currentSubject,
      type: 'exam_started',
      title: `Bắt đầu làm bài thi ${targetExam.subject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}`,
      detail: `Đề thi: "${targetExam.title}" (${targetQuestions.length} câu • ${targetExam.timeLimitMinutes} phút)`,
      examTitle: targetExam.title,
    });

    isSubmittingRef.current = false;
    setUserAnswers({});
    setFlaggedIds([]);
    setTimeLeft(targetExam.timeLimitMinutes * 60);
    setCurrentIdx(0);
    setStage('active');
  };

  const handleSelectOption = (optionIdx: number) => {
    if (!currentQ) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIdx,
    }));
  };

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmitExam = () => {
    if (isSubmittingRef.current || stage === 'result') return;
    isSubmittingRef.current = true;
    clearDraft();
    setShowSubmitModal(false);
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    examQuestions.forEach((q) => {
      const chosen = userAnswers[q.id];
      if (chosen === undefined) {
        unattemptedCount += 1;
      } else if (chosen === q.correctOption) {
        correctCount += 1;
      } else {
        incorrectCount += 1;
      }
    });

    const totalQ = examQuestions.length;
    const scoreVal = parseFloat(((correctCount / (totalQ || 1)) * 10).toFixed(2));
    const score100Val = Math.round((correctCount / (totalQ || 1)) * 100);
    const timeSpent = exam.timeLimitMinutes * 60 - timeLeft;

    const saved = saveExamAttempt({
      examId: exam.id,
      examTitle: exam.title,
      subject: (exam.subject || currentSubject) as any,
      date: new Date().toISOString(),
      score: scoreVal,
      score100: score100Val,
      correctCount,
      incorrectCount,
      unattemptedCount,
      totalQuestions: totalQ,
      timeSpentSeconds: timeSpent,
      userAnswers,
      flaggedQuestions: flaggedIds,
    });

    setCompletedAttempt(saved);
    setStage('result');

    if (scoreVal >= 7.5) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentSubjectTarget =
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore
      : currentUser.targetScoreEnglish || currentUser.targetScore;

  // Filter exams in list (Including all teacher/admin/AI created exams)
  const teacherOrAiExams = subjectExams.filter(
    (ex) =>
      !ex.isOfficialFormat ||
      ex.id.startsWith('exam_ai_') ||
      ex.id.startsWith('exam_custom_') ||
      ex.id.startsWith('exam_upload_') ||
      ex.creatorUserId !== undefined ||
      ex.title.includes('AI')
  );

  const filteredExamsList = subjectExams.filter((ex) => {
    if (examTabFilter === 'official') return ex.isOfficialFormat && !ex.id.startsWith('exam_ai_') && !ex.id.startsWith('exam_custom_') && !ex.id.startsWith('exam_upload_');
    if (examTabFilter === 'speed') return ex.timeLimitMinutes <= 30 && !ex.id.startsWith('exam_ai_');
    if (examTabFilter === 'custom') {
      return (
        !ex.isOfficialFormat ||
        ex.id.startsWith('exam_ai_') ||
        ex.id.startsWith('exam_custom_') ||
        ex.id.startsWith('exam_upload_') ||
        ex.creatorUserId !== undefined ||
        ex.title.includes('AI')
      );
    }
    return true;
  });

  // 1. INTRO / EXAM LIST SELECTION STAGE
  if (stage === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 sm:p-2.5 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#5A5A40]" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3D3D2D]">
                Phòng Thi Thử Vào Lớp 10: {currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#8A8A70]">
              Mô phỏng cấu trúc đề thi tuyển sinh chính thức với tính giờ tự động và chấm điểm chi tiết
            </p>
          </div>
        </div>

        {/* Draft restore banner */}
        {draftExists && (
          <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-lg">
                💾
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#3D3D2D]">Có bài làm dở chưa nộp</h4>
                <p className="text-xs text-[#8A8A70]">
                  Hệ thống đã tự động lưu nháp các câu trả lời bạn vừa tích trước đó.
                </p>
              </div>
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <button
                onClick={clearDraft}
                className="px-3.5 py-2 text-xs font-bold text-[#8A8A70] hover:text-[#3D3D2D] bg-white rounded-xl border border-[#D9D2C5] cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleRestoreDraft}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục bài làm ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter categories tabs */}
        <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#D9D2C5] max-w-lg shadow-2xs text-xs font-bold">
          <button
            onClick={() => setExamTabFilter('all')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${examTabFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
          >
            Tất cả ({subjectExams.length})
          </button>
          <button
            onClick={() => setExamTabFilter('official')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${examTabFilter === 'official' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
          >
            Đề Chuẩn Sở
          </button>
          <button
            onClick={() => setExamTabFilter('speed')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${examTabFilter === 'speed' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
          >
            Luyện Tốc Độ
          </button>
          <button
            onClick={() => setExamTabFilter('custom')}
            className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${examTabFilter === 'custom' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
          >
            Thầy Cô & AI ({teacherOrAiExams.length})
          </button>
        </div>

        {/* Exam Cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredExamsList.length === 0 ? (
            <div className="md:col-span-2 p-8 bg-white rounded-3xl border border-[#EAE7E0] text-center space-y-2">
              <p className="text-sm font-bold text-[#3D3D2D]">Chưa có đề thi nào trong mục này</p>
              <p className="text-xs text-[#8A8A70]">
                Hãy dùng tính năng "AI Tạo đề" để tự động tạo đề thi môn {currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'} mới!
              </p>
            </div>
          ) : (
            filteredExamsList.map((ex) => {
              const isSelected = ex.id === selectedExamId;
              return (
                <div
                  key={ex.id}
                  onClick={() => setSelectedExamId(ex.id)}
                  className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border transition-all cursor-pointer flex flex-col justify-between ${isSelected
                      ? 'bg-white border-[#5A5A40] shadow-md ring-2 ring-[#5A5A40]/20'
                      : 'bg-white border-[#EAE7E0] hover:border-[#D9D2C5] hover:shadow-xs'
                    }`}
                >
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold bg-[#F5F2ED] text-[#5A5A40] rounded-xl border border-[#D9D2C5]">
                        {ex.code}
                      </span>
                      <span className="text-xs font-bold text-[#8A8A70] flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{ex.timeLimitMinutes} phút</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-[#3D3D2D] text-sm sm:text-base leading-snug">{ex.title}</h3>
                    <p className="text-xs text-[#8A8A70] line-clamp-3 leading-relaxed">
                      {ex.description}
                    </p>
                  </div>

                  <div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-[#F5F2ED] flex items-center justify-between gap-2">
                    <div className="text-xs text-[#8A8A70]">
                      <strong>{ex.questionIds.length}</strong> câu hỏi
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartExam(ex.id);
                      }}
                      className="px-4 sm:px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <span>Bắt đầu thi</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rules Card */}
        <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 text-[#3D3D2D] text-xs sm:text-sm space-y-2">
          <h4 className="font-bold text-[#5A5A40] flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-[#E67E22]" />
            <span>Quy chế và Lưu ý phòng thi:</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#6B6B54]">
            <li>Hệ thống sẽ đếm ngược tự động và tự nộp bài khi hết giờ.</li>
            <li>Bạn có thể gắn cờ các câu chưa chắc chắn để xem lại trước khi nộp.</li>
            <li>Sau khi hoàn thành, hệ thống sẽ lưu kết quả vào lịch sử cá nhân của bạn kèm phân tích điểm mạnh/yếu.</li>
          </ul>
        </div>
      </div>
    );
  }

  // 2. ACTIVE EXAM SIMULATION STAGE
  if (stage === 'active') {
    if (!currentQ || examQuestions.length === 0) {
      return (
        <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-[#EAE7E0] space-y-4 my-12 shadow-sm">
          <AlertCircle className="w-12 h-12 text-[#E67E22] mx-auto" />
          <h3 className="text-lg font-bold text-[#3D3D2D]">Không tìm thấy câu hỏi của đề thi</h3>
          <p className="text-xs text-[#8A8A70]">Dữ liệu câu hỏi của đề thi này chưa được tìm thấy trong hệ thống.</p>
          <button
            onClick={() => setStage('intro')}
            className="px-6 py-2.5 bg-[#5A5A40] text-white font-bold text-xs rounded-full cursor-pointer hover:bg-[#3D3D2D]"
          >
            Quay lại danh sách đề thi
          </button>
        </div>
      );
    }

    const answeredCount = Object.keys(userAnswers).length;
    const isCurrentFlagged = flaggedIds.includes(currentQ.id);
    const isCurrentBookmarked = isBookmarked(currentQ.id);

    return (
      <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 pb-6">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-[#EAE7E0] shadow-xs p-3 sm:p-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 sm:gap-4 sticky top-0 sm:top-2 z-20">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#3D3D2D] text-xs sm:text-base truncate">
              {exam.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-[#8A8A70]">
              Đã làm:{' '}
              <strong className="text-[#5A5A40]">
                {answeredCount}/{examQuestions.length}
              </strong>{' '}
              câu
            </p>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Mobile quick palette button */}
            <button
              onClick={() => setMobilePaletteOpen(true)}
              className="lg:hidden px-2.5 py-1.5 bg-[#F5F2ED] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] flex items-center space-x-1 cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>{currentIdx + 1}/{examQuestions.length}</span>
            </button>

            <div
              className={`flex items-center space-x-1.5 px-3 sm:px-4 py-1.5 rounded-xl sm:rounded-2xl font-mono text-xs sm:text-base font-bold border ${timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                  : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#5A5A40]'
                }`}
            >
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Zen / Focus Mode Toggle */}
            <button
              onClick={() => setIsFocusMode(!isFocusMode)}
              title="Chế độ tập trung (Zen Mode)"
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center space-x-1 ${isFocusMode ? 'bg-[#1E3A8A] text-white border-blue-900 shadow-sm' : 'bg-[#FAF9F6] text-[#5A5A40] border-[#D9D2C5] hover:bg-[#E8E2D9]'
                }`}
            >
              <span>🎯</span>
              <span className="hidden sm:inline">{isFocusMode ? 'Thoát Zen Mode' : 'Zen Mode'}</span>
            </button>

            {/* Scratchpad Toggle */}
            <button
              onClick={() => setShowScratchpad(true)}
              title="Bảng nháp / Tính nhanh"
              className="px-2.5 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition cursor-pointer flex items-center space-x-1"
            >
              <span>📝</span>
              <span className="hidden sm:inline">Nháp</span>
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              id="btn-submit-exam"
              className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-[#8BA888] hover:bg-[#789675] text-white rounded-full text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              Nộp Bài
            </button>
          </div>
        </div>

        {/* Anti-Cheat Tab Switch Warning Banner */}
        {tabSwitchCount > 0 && (
          <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between gap-3 text-xs text-rose-900 animate-in fade-in">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
              <span>
                <strong>Cảnh báo Giám Sát:</strong> Bạn đã rời màn hình thi <strong>{tabSwitchCount} lần</strong>. Hệ thống đã ghi nhận và truyền dữ liệu thời gian thực về Dashboard người giám sát!
              </span>
            </div>
            <button
              onClick={() => setShowTabWarning(false)}
              className="text-rose-600 hover:text-rose-900 font-bold px-2 py-1 bg-white rounded-lg border border-rose-200 text-[11px]"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* Main 2-Column Interface: Question View (Left) & Question Palette (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Question Box (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-4 sm:p-6 lg:p-8 flex flex-col justify-between min-h-[380px] sm:min-h-[460px]">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED] gap-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#5A5A40] text-white font-bold text-xs rounded-xl">
                    Câu {currentIdx + 1}/{examQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-[#8A8A70] capitalize truncate max-w-[120px] sm:max-w-none">
                    {currentQ.topicId.replace('math_', '').replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <button
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`flex items-center space-x-1 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${isCurrentFlagged
                        ? 'bg-[#FDF2E9] border-[#E67E22] text-[#E67E22]'
                        : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                      }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-[#E67E22]' : ''}`} />
                    <span className="hidden sm:inline">{isCurrentFlagged ? 'Đã cờ' : 'Gắn cờ'}</span>
                  </button>

                  <button
                    onClick={() => toggleBookmark(currentQ.id)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${isCurrentBookmarked
                        ? 'bg-[#F5F2ED] border-[#5A5A40] text-[#5A5A40]'
                        : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#8A8A70]'
                      }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-[#5A5A40]' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {currentQ.passage && (
                <div className="p-3 sm:p-4 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl text-xs sm:text-sm text-[#4A4A4A] leading-relaxed max-h-48 sm:max-h-56 overflow-y-auto whitespace-pre-line">
                  {currentQ.passage}
                </div>
              )}

              <div className="text-sm sm:text-base font-bold text-[#3D3D2D] leading-relaxed pt-1 whitespace-pre-line">
                {currentQ.content}
              </div>

              {/* Options */}
              <div className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = userAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${isSelected
                          ? 'bg-[#F5F2ED] border-[#5A5A40] text-[#3D3D2D] ring-2 ring-[#5A5A40]/20 font-bold'
                          : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]'
                        }`}
                    >
                      <span className="pr-2 leading-relaxed whitespace-pre-line">{option}</span>
                      <div
                        className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${isSelected
                            ? 'border-[#5A5A40] bg-[#5A5A40] text-white'
                            : 'border-[#D9D2C5]'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-4 sm:mt-6 border-t border-[#F5F2ED] flex items-center justify-between gap-2">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-[#EAE7E0] text-xs font-bold text-[#6B6B54] hover:bg-[#FAF9F6] disabled:opacity-40 transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() =>
                  setCurrentIdx((prev) => Math.min(examQuestions.length - 1, prev + 1))
                }
                disabled={currentIdx === examQuestions.length - 1}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-full bg-[#5A5A40] text-white text-xs font-bold hover:bg-[#3D3D2D] disabled:opacity-40 transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Câu tiếp</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Palette Sidebar (Right on Desktop) */}
          <div className="hidden lg:block bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <h4 className="font-bold text-[#3D3D2D] text-sm">Bảng câu hỏi</h4>
              <span className="text-xs text-[#8A8A70]">
                {answeredCount}/{examQuestions.length} đã chọn
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {examQuestions.map((q, index) => {
                const isCurrent = index === currentIdx;
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedIds.includes(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(index)}
                    className={`relative h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${isCurrent
                        ? 'ring-2 ring-[#5A5A40] ring-offset-2 bg-[#5A5A40] text-white shadow-xs'
                        : isAnswered
                          ? 'bg-[#EBF2EB] text-[#8BA888] hover:bg-[#D9E8D9]'
                          : 'bg-[#FAF9F6] text-[#6B6B54] hover:bg-[#E8E2D9]'
                      }`}
                  >
                    <span>{index + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#E67E22] rounded-full border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#F5F2ED] space-y-1.5 text-[11px] text-[#8A8A70]">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#EBF2EB] border border-[#8BA888] inline-block" />
                <span>Đã trả lời</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#FAF9F6] border border-[#EAE7E0] inline-block" />
                <span>Chưa trả lời</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-md bg-[#FDF2E9] border border-[#E67E22] inline-block" />
                <span>Gắn cờ xem lại</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 bg-[#8BA888] hover:bg-[#789675] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Nộp bài thi ngay
            </button>
          </div>
        </div>

        {/* Mobile Question Palette Drawer */}
        {mobilePaletteOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
            <div className="fixed inset-0" onClick={() => setMobilePaletteOpen(false)} />
            <div className="relative bg-white rounded-t-[2.5rem] p-5 max-h-[75vh] overflow-y-auto space-y-4 border-t border-[#EAE7E0] shadow-2xl z-10">
              <div className="flex justify-between items-center pb-2 border-b border-[#F5F2ED]">
                <div>
                  <h4 className="font-bold text-[#3D3D2D] text-sm">Bảng câu hỏi</h4>
                  <p className="text-[11px] text-[#8A8A70]">{answeredCount}/{examQuestions.length} câu đã chọn</p>
                </div>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {examQuestions.map((q, index) => {
                  const isCurrent = index === currentIdx;
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flaggedIds.includes(q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIdx(index);
                        setMobilePaletteOpen(false);
                      }}
                      className={`relative h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${isCurrent
                          ? 'ring-2 ring-[#5A5A40] ring-offset-2 bg-[#5A5A40] text-white shadow-xs'
                          : isAnswered
                            ? 'bg-[#EBF2EB] text-[#8BA888]'
                            : 'bg-[#FAF9F6] text-[#6B6B54]'
                        }`}
                    >
                      <span>{index + 1}</span>
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E67E22] rounded-full border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] max-w-md w-full p-5 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
              <div className="flex items-center space-x-3 text-[#5A5A40]">
                <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#8BA888]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#3D3D2D] text-base">Xác nhận Nộp Bài Thi</h4>
                  <p className="text-xs text-[#8A8A70]">Kiểm tra lại số lượng câu đã hoàn thành</p>
                </div>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs text-[#4A4A4A]">
                <div className="flex justify-between">
                  <span>Tổng số câu hỏi:</span>
                  <strong className="text-[#3D3D2D]">{examQuestions.length} câu</strong>
                </div>
                <div className="flex justify-between text-[#8BA888]">
                  <span>Số câu đã trả lời:</span>
                  <strong>{answeredCount} câu</strong>
                </div>
                <div className="flex justify-between text-[#E67E22]">
                  <span>Số câu chưa làm:</span>
                  <strong>{examQuestions.length - answeredCount} câu</strong>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-[#6B6B54] bg-[#FAF9F6] hover:bg-[#E8E2D9] rounded-full transition cursor-pointer"
                >
                  Tiếp tục làm
                </button>
                <button
                  onClick={handleSubmitExam}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#8BA888] hover:bg-[#789675] rounded-full shadow-xs transition cursor-pointer"
                >
                  Xác nhận Nộp bài
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. POST-EXAM DIAGNOSTIC RESULT VIEW
  if (stage === 'result' && completedAttempt) {
    const questionsToReview = examQuestions.filter((q) => {
      if (filterResult === 'wrong') return userAnswers[q.id] !== q.correctOption;
      if (filterResult === 'flagged') return flaggedIds.includes(q.id);
      return true;
    });

    const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

    // 1. Compute Topic Matrix Breakdown
    const topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }> = {};
    examQuestions.forEach((q) => {
      const tMeta = currentTopicsMeta.find((t) => t.id === q.topicId);
      const tName = tMeta ? tMeta.nameVi : q.topicId;
      if (!topicBreakdown[q.topicId]) {
        topicBreakdown[q.topicId] = { total: 0, correct: 0, wrong: 0, name: tName };
      }
      topicBreakdown[q.topicId].total += 1;
      const userChoice = userAnswers[q.id];
      if (userChoice === q.correctOption) {
        topicBreakdown[q.topicId].correct += 1;
      } else {
        topicBreakdown[q.topicId].wrong += 1;
      }
    });

    // 2. Active Evaluation
    const currentEvaluation =
      aiEvaluation ||
      getLocalExamEvaluation(
        completedAttempt.score,
        completedAttempt.totalQuestions,
        completedAttempt.timeSpentSeconds,
        exam.timeLimitMinutes,
        topicBreakdown,
        currentSubjectTarget,
        currentSubject
      );

    // AI Trigger handler
    const handleRunAiDeepAnalysis = async () => {
      const key = getStoredApiKey();
      if (!key) {
        setAiError(
          'Vui lòng vào tab "AI Tạo đề" để nhập Gemini API Key trước khi sử dụng tính năng phân tích chuyên sâu.'
        );
        return;
      }
      setAiAnalyzing(true);
      setAiError(null);
      try {
        const wrongList = examQuestions
          .filter((q) => userAnswers[q.id] !== q.correctOption)
          .map((q) => ({
            content: q.content,
            userChoice: userAnswers[q.id] !== undefined ? q.options[userAnswers[q.id]] : 'Chưa làm',
            correctChoice: q.options[q.correctOption],
            topic: q.topicId,
            explanation: q.explanation,
          }));

        const result = await generateExamEvaluationWithAI(
          key,
          completedAttempt.examTitle,
          completedAttempt.score,
          completedAttempt.totalQuestions,
          completedAttempt.timeSpentSeconds,
          topicBreakdown,
          wrongList,
          currentSubjectTarget,
          aiEvalModel,
          currentSubject
        );
        setAiEvaluation(result);
      } catch (err: any) {
        setAiError(err.message || 'Không thể kết nối AI. Vui lòng thử lại.');
      } finally {
        setAiAnalyzing(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6">
        {/* Main Score & Summary Card */}
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-[#EAE7E0] shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8 bg-[#5A5A40] text-white flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
                Kết quả Thi Thử Môn {currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'}
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">{completedAttempt.examTitle}</h2>
              <p className="text-xs sm:text-sm text-[#D9D2C5]">
                Học sinh: <strong>{currentUser.name}</strong> • Thời gian: {Math.round(completedAttempt.timeSpentSeconds / 60)} phút • Ngày{' '}
                {new Date(completedAttempt.date).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div className="bg-[#FDFCFB] text-[#3D3D2D] rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 text-center min-w-[140px] sm:min-w-[160px] border border-[#D9D2C5]">
              <div className="text-[10px] sm:text-xs font-bold text-[#8A8A70] uppercase tracking-wider">
                Điểm Số
              </div>
              <div className="text-3xl sm:text-5xl font-extrabold text-[#5A5A40] mt-0.5 sm:mt-1">
                {completedAttempt.score.toFixed(2)}
              </div>
              <div className="text-[11px] sm:text-xs text-[#8BA888] font-bold mt-0.5 sm:mt-1">
                {completedAttempt.correctCount}/{completedAttempt.totalQuestions} câu đúng
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 p-3 sm:p-4 bg-[#FAF9F6] border-b border-[#EAE7E0] text-center divide-x divide-[#EAE7E0]">
            <div>
              <span className="text-[10px] sm:text-xs text-[#8A8A70]">Số câu đúng</span>
              <p className="text-sm sm:text-lg font-bold text-[#8BA888] flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{completedAttempt.correctCount}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#8A8A70]">Số câu sai</span>
              <p className="text-sm sm:text-lg font-bold text-[#E67E22] flex items-center justify-center space-x-1">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{completedAttempt.incorrectCount}</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] sm:text-xs text-[#8A8A70]">Chưa làm</span>
              <p className="text-sm sm:text-lg font-bold text-[#6B6B54]">
                {completedAttempt.unattemptedCount}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 DIAGNOSTIC & WEAKNESS EVALUATION SECTION */}
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 border border-[#D9D2C5] shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE7E0] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40] shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#3D3D2D]">
                  Đánh Giá Năng Lực & Các Điểm Cần Cải Thiện ({currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'})
                </h3>
                <p className="text-xs text-[#8A8A70]">
                  {aiEvaluation
                    ? '✨ Báo cáo phân tích chuyên sâu cá nhân hóa bởi Gemini AI'
                    : 'Phân tích ma trận kết quả tự động'}
                </p>
              </div>
            </div>

            {/* AI Deep Analysis Button & Model Selector */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={aiEvalModel}
                onChange={(e) => setAiEvalModel(e.target.value)}
                className="px-3 py-2.5 text-xs bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-[#5A5A40] outline-hidden cursor-pointer font-bold select-none hover:bg-[#E8E2D9]"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name.split(' (')[0]}
                  </option>
                ))}
              </select>
              <button
                onClick={handleRunAiDeepAnalysis}
                disabled={aiAnalyzing}
                className="px-4 py-2.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60 shrink-0"
              >
                {aiAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E67E22]" />
                    <span>AI đang phân tích...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
                    <span>{aiEvaluation ? 'Phân tích lại' : '🤖 AI Phân tích'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Overall & Grade Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="md:col-span-2 bg-[#FAF9F6] p-4 rounded-2xl border border-[#EAE7E0] space-y-1.5">
              <span className="text-[10px] font-bold text-[#8A8A70] uppercase tracking-wider block">
                Nhận xét tổng quan
              </span>
              <p className="text-xs text-[#3D3D2D] leading-relaxed">
                {currentEvaluation.overallAssessment}
              </p>
              <p className="text-[11px] text-[#6B6B54] italic pt-1">
                ⏱ {currentEvaluation.timeManagementComment}
              </p>
            </div>

            <div className="bg-[#8BA888]/15 border border-[#8BA888]/30 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">
                Dự đoán điểm thi vào 10
              </span>
              <div className="my-1">
                <p className="text-sm sm:text-base font-bold text-[#2C3E2D]">
                  {currentEvaluation.gradePrediction}
                </p>
              </div>
              <span className="text-[10px] text-[#5A5A40] font-medium">
                🎯 Mục tiêu của bạn: {currentSubjectTarget}đ ({currentUser.targetSchool})
              </span>
            </div>
          </div>

          {/* Topic Matrix Breakdown */}
          <div className="space-y-2.5 pt-1">
            <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[#8BA888]" />
              <span>Tỷ lệ chính xác theo chuyên đề trong đề thi:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {Object.entries(topicBreakdown).map(([tId, tData]) => {
                const acc = tData.total > 0 ? Math.round((tData.correct / tData.total) * 100) : 0;
                const isGood = acc >= 75;
                return (
                  <div
                    key={tId}
                    className="p-3 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#3D3D2D]">{tData.name}</span>
                      <span className={isGood ? 'text-emerald-700' : 'text-[#E67E22]'}>
                        {tData.correct}/{tData.total} câu ({acc}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isGood ? 'bg-[#8BA888]' : 'bg-[#E67E22]'
                          }`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Weaknesses (Areas for Improvement) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
            {/* Strengths */}
            <div className="bg-[#FAF9F6] border border-[#8BA888]/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Điểm mạnh đã phát huy:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#3D3D2D]">
                {currentEvaluation.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement / Weaknesses */}
            <div className="bg-[#FAF9F6] border border-[#E67E22]/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center space-x-1.5 text-[#D35400] font-bold text-xs">
                <ShieldAlert className="w-4 h-4 text-[#E67E22]" />
                <span>Các điểm cần cải thiện ngay:</span>
              </div>
              {currentEvaluation.weaknesses.length === 0 ? (
                <p className="text-xs text-[#8A8A70]">
                  Không phát hiện lỗ hổng lớn nào! Bạn đã làm rất tốt.
                </p>
              ) : (
                <div className="space-y-2">
                  {currentEvaluation.weaknesses.map((w, idx) => (
                    <div key={idx} className="text-xs space-y-0.5 border-b border-[#EAE7E0] pb-2 last:border-b-0 last:pb-0">
                      <div className="font-bold text-[#E67E22]">⚠️ {w.topicName}:</div>
                      <p className="text-[#3D3D2D]">{w.issue}</p>
                      <p className="text-[11px] text-[#5A5A40] font-medium bg-[#E8E2D9]/40 p-1.5 rounded-lg mt-1">
                        👉 <strong>Giải pháp:</strong> {w.solution}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Plan & Tactics Tip */}
          <div className="bg-[#5A5A40]/10 border border-[#5A5A40]/20 p-4 rounded-2xl space-y-2.5">
            <div className="flex items-center space-x-2">
              <ListOrdered className="w-4 h-4 text-[#5A5A40]" />
              <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                Lộ trình hành động đề xuất:
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {currentEvaluation.actionPlan.map((act, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-[#D9D2C5] text-xs text-[#3D3D2D] space-y-1 shadow-2xs"
                >
                  <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-white text-[10px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <p className="leading-snug">{act}</p>
                </div>
              ))}
            </div>

            {currentEvaluation.examTacticsTip && (
              <div className="pt-2 border-t border-[#D9D2C5] flex items-start space-x-2 text-xs text-[#5A5A40]">
                <Lightbulb className="w-4 h-4 text-[#E67E22] shrink-0 mt-0.5" />
                <span className="font-medium">{currentEvaluation.examTacticsTip}</span>
              </div>
            )}
          </div>
        </div>

        {/* Review Actions & Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button
              onClick={() => setFilterResult('all')}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${filterResult === 'all'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-white border border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
                }`}
            >
              Tất cả ({examQuestions.length})
            </button>
            <button
              onClick={() => setFilterResult('wrong')}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${filterResult === 'wrong'
                  ? 'bg-[#E67E22] text-white'
                  : 'bg-white border border-[#EAE7E0] text-[#E67E22] hover:bg-[#FDF2E9]'
                }`}
            >
              Câu sai ({completedAttempt.incorrectCount})
            </button>
            <button
              onClick={() => setFilterResult('flagged')}
              className={`px-3.5 sm:px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${filterResult === 'flagged'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-white border border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
                }`}
            >
              Gắn cờ ({flaggedIds.length})
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleStartExam(exam.id)}
              className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] text-[#4A4A4A] rounded-full text-xs font-bold shadow-2xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại đề</span>
            </button>
            <button
              onClick={onBackToDashboard}
              className="flex-1 sm:flex-none px-4 sm:px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>Về Dashboard</span>
            </button>
          </div>
        </div>

        {/* Detailed Explanations List */}
        <div className="space-y-3 sm:space-y-4">
          {questionsToReview.map((q) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.correctOption;
            const isUnattempted = userChoice === undefined;

            return (
              <div
                key={q.id}
                className={`p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] bg-white border transition-all ${isCorrect
                    ? 'border-[#8BA888]'
                    : isUnattempted
                      ? 'border-[#EAE7E0]'
                      : 'border-[#E67E22] shadow-xs'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${isCorrect
                          ? 'bg-[#EBF2EB] text-[#8BA888]'
                          : isUnattempted
                            ? 'bg-[#FAF9F6] text-[#6B6B54]'
                            : 'bg-[#FDF2E9] text-[#E67E22]'
                        }`}
                    >
                      Câu {examQuestions.findIndex((item) => item.id === q.id) + 1}
                    </span>
                    <span className="text-xs text-[#8A8A70] font-semibold capitalize">
                      {q.topicId.replace('math_', '').replace(/_/g, ' ')}
                    </span>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#8BA888]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đúng</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#E67E22]">
                      <XCircle className="w-4 h-4" />
                      <span>Sai (Đã lưu vào Sổ câu sai)</span>
                    </span>
                  )}
                </div>

                {q.passage && (
                  <div className="my-2.5 p-3 bg-[#FAF9F6] rounded-xl text-xs text-[#8A8A70] border border-[#EAE7E0] whitespace-pre-line">
                    {q.passage}
                  </div>
                )}

                <div className="mt-2.5 text-xs sm:text-sm font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
                  {q.content}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                  {q.options.map((opt, oIdx) => {
                    const isOptionCorrect = oIdx === q.correctOption;
                    const isOptionUserChosen = oIdx === userChoice;

                    let style = 'bg-[#FAF9F6] text-[#4A4A4A] border-[#EAE7E0]';
                    if (isOptionCorrect) {
                      style = 'bg-[#EBF2EB] text-[#3D3D2D] border-[#8BA888] font-bold';
                    } else if (isOptionUserChosen && !isCorrect) {
                      style = 'bg-[#FDF2E9] text-[#3D3D2D] border-[#E67E22] line-through';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center justify-between whitespace-pre-line ${style}`}
                      >
                        <span>{opt}</span>
                        {isOptionCorrect && <Check className="w-4 h-4 text-[#8BA888] shrink-0 ml-1" />}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs text-[#3D3D2D] space-y-2">
                  <div className="font-bold flex items-center space-x-1.5 text-[#5A5A40]">
                    <BookOpen className="w-4 h-4" />
                    <span>Giải thích chi tiết & Phương pháp giải:</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-line">{q.explanation}</p>

                  {q.grammarRule && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#D9D2C5] font-mono text-[11px] text-[#3D3D2D] whitespace-pre-line">
                      <strong>Công thức / Định lý:</strong> {q.grammarRule}
                    </div>
                  )}

                  {q.commonMistakeTip && (
                    <p className="text-[#E67E22] text-[11px] font-medium">💡 {q.commonMistakeTip}</p>
                  )}

                  {/* AI Tutor & Bookmark Actions */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[#EAE7E0] flex-wrap gap-2">
                    <button
                      onClick={() => toggleBookmark(q.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${isBookmarked(q.id)
                          ? 'bg-amber-100 border-amber-300 text-amber-900'
                          : 'bg-white border-[#D9D2C5] text-[#5A5A40] hover:bg-[#FAF9F6]'
                        }`}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                      <span>{isBookmarked(q.id) ? 'Đã lưu vào Bookmark' : 'Lưu câu này'}</span>
                    </button>

                    <button
                      onClick={() => setActiveQuestionForAiExplainer({ question: q, userSelectedOption: userChoice })}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>🤖 Nhờ AI Gia Sư Giảng Kỹ Câu Này</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 📝 Scratchpad Modal */}
        {showScratchpad && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border-2 border-[#5A5A40] space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                    📝
                  </div>
                  <h4 className="font-bold text-sm text-[#3D3D2D]">Bảng nháp tính toán</h4>
                </div>
                <button
                  onClick={() => setShowScratchpad(false)}
                  className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick symbols buttons */}
              <div className="flex flex-wrap gap-1.5 bg-[#FAF9F6] p-2 rounded-2xl border border-[#D9D2C5] text-xs font-mono">
                {['√', 'x²', 'Δ', 'π', '≠', '≤', '≥', '±', 'α', 'β', 'x₁', 'x₂'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setScratchpadText((prev) => prev + sym + ' ')}
                    className="px-2 py-1 bg-white hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-lg text-xs font-bold text-[#5A5A40] transition cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>

              <textarea
                rows={8}
                value={scratchpadText}
                onChange={(e) => setScratchpadText(e.target.value)}
                placeholder="Ghi chú nháp lời giải, phép tính hoặc nháp từ vựng..."
                className="w-full p-3.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs font-mono text-[#3D3D2D] focus:outline-hidden focus:ring-2 focus:ring-[#8BA888]"
              />

              <div className="flex justify-between items-center pt-1">
                <button
                  onClick={() => setScratchpadText('')}
                  className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Xóa nháp
                </button>
                <button
                  onClick={() => setShowScratchpad(false)}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
                >
                  Xong (Đóng)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🤖 AI Question Explainer Modal */}
        {activeQuestionForAiExplainer && (
          <AiQuestionExplainerModal
            question={activeQuestionForAiExplainer.question}
            userSelectedOption={activeQuestionForAiExplainer.userSelectedOption}
            onClose={() => setActiveQuestionForAiExplainer(null)}
          />
        )}
      </div>
    );
  }

  return null;
};
