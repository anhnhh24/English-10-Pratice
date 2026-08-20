import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Exam, Question, TopicId } from '../types';
import { TOPICS_META } from '../data/topicsMeta';
import {
  getLocalExamEvaluation,
  generateExamEvaluationWithAI,
  getStoredApiKey,
  ExamEvaluationReport,
} from '../services/aiExamService';
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
  Target,
  Wand2,
  RefreshCw,
  Lightbulb,
  ShieldAlert,
  ListOrdered,
} from 'lucide-react';

interface ExamSimulatorViewProps {
  examId?: string;
  onBackToDashboard: () => void;
  onOpenAiTutor?: (q: Question) => void;
}

export const ExamSimulatorView: React.FC<ExamSimulatorViewProps> = ({
  examId = 'exam_official_01',
  onBackToDashboard,
  onOpenAiTutor,
}) => {
  const { currentUser, exams, getQuestionById, saveExamAttempt, isBookmarked, toggleBookmark } = useApp();

  const [selectedExamId, setSelectedExamId] = useState<string>(examId);
  const exam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Exam States
  const [stage, setStage] = useState<'intro' | 'active' | 'result'>('intro');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(exam ? exam.timeLimitMinutes * 60 : 3600);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [filterResult, setFilterResult] = useState<'all' | 'wrong' | 'flagged'>('all');

  // AI Diagnostic Assessment States
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiEvaluation, setAiEvaluation] = useState<ExamEvaluationReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Completed Attempt State
  const [completedAttempt, setCompletedAttempt] = useState<any>(null);

  // Timer effect
  useEffect(() => {
    let timer: any;
    if (stage === 'active' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage, timeLeft]);

  const examQuestions = exam
    ? (exam.questionIds.map((id) => getQuestionById(id)).filter(Boolean) as Question[])
    : [];

  const currentQ = examQuestions[currentIdx];

  const handleStartExam = (selectedId?: string) => {
    if (selectedId) setSelectedExamId(selectedId);
    const targetExam = exams.find((e) => e.id === (selectedId || selectedExamId)) || exams[0];
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
    const scoreVal = parseFloat(((correctCount / totalQ) * 10).toFixed(2));
    const score100Val = Math.round((correctCount / totalQ) * 100);
    const timeSpent = exam.timeLimitMinutes * 60 - timeLeft;

    const saved = saveExamAttempt({
      examId: exam.id,
      examTitle: exam.title,
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

  // 1. INTRO / EXAM LIST SELECTION STAGE
  if (stage === 'intro') {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#5A5A40]" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3D3D2D]">
              Phòng Thi Thử Tuyển Sinh Vào Lớp 10
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8A70]">
              Mô phỏng cấu trúc đề thi chính thức với tính giờ tự động và chấm điểm chi tiết
            </p>
          </div>
        </div>

        {/* Exam Cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((ex) => {
            const isSelected = ex.id === selectedExamId;
            return (
              <div
                key={ex.id}
                onClick={() => setSelectedExamId(ex.id)}
                className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#5A5A40] shadow-md ring-2 ring-[#5A5A40]/20'
                    : 'bg-white border-[#EAE7E0] hover:border-[#D9D2C5] hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-bold bg-[#F5F2ED] text-[#5A5A40] rounded-xl border border-[#D9D2C5]">
                      {ex.code}
                    </span>
                    <span className="text-xs font-bold text-[#8A8A70] flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{ex.timeLimitMinutes} phút</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-[#3D3D2D] text-base leading-snug">{ex.title}</h3>
                  <p className="text-xs text-[#8A8A70] line-clamp-3 leading-relaxed">
                    {ex.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#F5F2ED] flex items-center justify-between">
                  <div className="text-xs text-[#8A8A70]">
                    <strong>{ex.questionIds.length}</strong> câu hỏi trắc nghiệm
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartExam(ex.id);
                    }}
                    className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Bắt đầu thi</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rules Card */}
        <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-[2rem] p-5 text-[#3D3D2D] text-xs sm:text-sm space-y-2">
          <h4 className="font-bold text-[#5A5A40] flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 text-[#E67E22]" />
            <span>Quy chế và Lưu ý phòng thi:</span>
          </h4>
          <ul className="list-disc list-inside space-y-1 text-xs text-[#6B6B54]">
            <li>Hệ thống sẽ đếm ngược tự động và tự nộp bài khi hết 60 phút.</li>
            <li>Bạn có thể gắn cờ các câu chưa chắc chắn để xem lại trước khi nộp.</li>
            <li>Sau khi hoàn thành, hệ thống sẽ trả bảng điểm chi tiết kèm lời giải thích cặn kẽ.</li>
          </ul>
        </div>
      </div>
    );
  }

  // 2. ACTIVE EXAM SIMULATION STAGE
  if (stage === 'active' && currentQ) {
    const answeredCount = Object.keys(userAnswers).length;
    const isCurrentFlagged = flaggedIds.includes(currentQ.id);
    const isCurrentBookmarked = isBookmarked(currentQ.id);

    return (
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        {/* Top Control Bar */}
        <div className="bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs p-4 flex items-center justify-between gap-4 sticky top-4 z-30">
          <div>
            <h3 className="font-bold text-[#3D3D2D] text-sm sm:text-base line-clamp-1">
              {exam.title}
            </h3>
            <p className="text-xs text-[#8A8A70]">
              Đã làm:{' '}
              <strong className="text-[#5A5A40]">
                {answeredCount}/{examQuestions.length}
              </strong>{' '}
              câu
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-2xl font-mono text-sm sm:text-base font-bold border ${
                timeLeft < 300
                  ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                  : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#5A5A40]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              id="btn-submit-exam"
              className="px-5 py-2 bg-[#8BA888] hover:bg-[#789675] text-white rounded-full text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              Nộp Bài
            </button>
          </div>
        </div>

        {/* Main 2-Column Interface: Question View (Left) & Question Palette (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Question Box (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 flex flex-col justify-between min-h-[460px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#5A5A40] text-white font-bold text-xs rounded-xl">
                    Câu {currentIdx + 1}/{examQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-[#8A8A70] capitalize">
                    {currentQ.topicId.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isCurrentFlagged
                        ? 'bg-[#FDF2E9] border-[#E67E22] text-[#E67E22]'
                        : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${isCurrentFlagged ? 'fill-[#E67E22]' : ''}`} />
                    <span>{isCurrentFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
                  </button>

                  <button
                    onClick={() => toggleBookmark(currentQ.id)}
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${
                      isCurrentBookmarked
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
                <div className="p-4 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl text-xs sm:text-sm text-[#4A4A4A] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-line">
                  {currentQ.passage}
                </div>
              )}

              <div className="text-sm sm:text-base font-bold text-[#3D3D2D] leading-relaxed pt-1 whitespace-pre-line">
                {currentQ.content}
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((option, idx) => {
                  const isSelected = userAnswers[currentQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#F5F2ED] border-[#5A5A40] text-[#3D3D2D] ring-2 ring-[#5A5A40]/20 font-bold'
                          : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]'
                      }`}
                    >
                      <span>{option}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
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

            <div className="pt-4 mt-6 border-t border-[#F5F2ED] flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-full border border-[#EAE7E0] text-xs font-bold text-[#6B6B54] hover:bg-[#FAF9F6] disabled:opacity-40 transition flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() =>
                  setCurrentIdx((prev) => Math.min(examQuestions.length - 1, prev + 1))
                }
                disabled={currentIdx === examQuestions.length - 1}
                className="px-5 py-2 rounded-full bg-[#5A5A40] text-white text-xs font-bold hover:bg-[#3D3D2D] disabled:opacity-40 transition flex items-center space-x-1 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Question Palette Sidebar (Right) */}
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 space-y-4">
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
                    className={`relative h-10 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                      isCurrent
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

        {/* Submit Confirmation Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] space-y-4">
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

    // 1. Compute Topic Matrix Breakdown
    const topicBreakdown: Record<string, { total: number; correct: number; wrong: number; name: string }> = {};
    examQuestions.forEach((q) => {
      const tMeta = TOPICS_META.find((t) => t.id === q.topicId);
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

    // 2. Active Evaluation (either AI or Local rule-based)
    const currentEvaluation =
      aiEvaluation ||
      getLocalExamEvaluation(
        completedAttempt.score,
        completedAttempt.totalQuestions,
        completedAttempt.timeSpentSeconds,
        exam.timeLimitMinutes,
        topicBreakdown,
        currentUser.targetScore
      );

    // AI Trigger handler
    const handleRunAiDeepAnalysis = async () => {
      const key = getStoredApiKey();
      if (!key) {
        setAiError(
          'Vui lòng vào tab "AI Tạo đề theo yêu cầu" để nhập Gemini API Key trước khi sử dụng tính năng phân tích chuyên sâu.'
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
          currentUser.targetScore
        );
        setAiEvaluation(result);
      } catch (err: any) {
        setAiError(err.message || 'Không thể kết nối AI. Vui lòng thử lại.');
      } finally {
        setAiAnalyzing(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Main Score & Summary Card */}
        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8 bg-[#5A5A40] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
                Kết quả Thi Thử Vào Lớp 10
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold">{completedAttempt.examTitle}</h2>
              <p className="text-xs sm:text-sm text-[#D9D2C5]">
                Thời gian làm bài: {Math.round(completedAttempt.timeSpentSeconds / 60)} phút • Ngày{' '}
                {new Date(completedAttempt.date).toLocaleDateString('vi-VN')}
              </p>
            </div>

            <div className="bg-[#FDFCFB] text-[#3D3D2D] rounded-[2rem] p-5 text-center min-w-[160px] border border-[#D9D2C5]">
              <div className="text-xs font-bold text-[#8A8A70] uppercase tracking-wider">
                Điểm Số
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-[#5A5A40] mt-1">
                {completedAttempt.score.toFixed(2)}
              </div>
              <div className="text-xs text-[#8BA888] font-bold mt-1">
                {completedAttempt.correctCount}/{completedAttempt.totalQuestions} câu đúng
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 p-4 bg-[#FAF9F6] border-b border-[#EAE7E0] text-center divide-x divide-[#EAE7E0]">
            <div>
              <span className="text-xs text-[#8A8A70]">Số câu đúng</span>
              <p className="text-base sm:text-lg font-bold text-[#8BA888] flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedAttempt.correctCount}</span>
              </p>
            </div>
            <div>
              <span className="text-xs text-[#8A8A70]">Số câu sai</span>
              <p className="text-base sm:text-lg font-bold text-[#E67E22] flex items-center justify-center space-x-1">
                <XCircle className="w-4 h-4" />
                <span>{completedAttempt.incorrectCount}</span>
              </p>
            </div>
            <div>
              <span className="text-xs text-[#8A8A70]">Chưa làm</span>
              <p className="text-base sm:text-lg font-bold text-[#6B6B54]">
                {completedAttempt.unattemptedCount}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 DIAGNOSTIC & WEAKNESS EVALUATION SECTION */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#D9D2C5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE7E0] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#3D3D2D]">
                  Đánh Giá Năng Lực & Các Điểm Cần Cải Thiện
                </h3>
                <p className="text-xs text-[#8A8A70]">
                  {aiEvaluation
                    ? '✨ Báo cáo phân tích chuyên sâu cá nhân hóa bởi Gemini AI'
                    : 'Phân tích ma trận kết quả tự động'}
                </p>
              </div>
            </div>

            {/* AI Deep Analysis Button */}
            <button
              onClick={handleRunAiDeepAnalysis}
              disabled={aiAnalyzing}
              className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] text-[#5A5A40] rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {aiAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E67E22]" />
                  <span>AI đang phân tích bài thi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
                  <span>{aiEvaluation ? 'Phân tích lại bằng AI' : '🤖 AI Phân tích chuyên sâu'}</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Overall & Grade Prediction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-sm font-bold text-[#2C3E2D]">
                  {currentEvaluation.gradePrediction}
                </p>
              </div>
              <span className="text-[10px] text-[#5A5A40] font-medium">
                🎯 Mục tiêu của bạn: {currentUser.targetScore}đ ({currentUser.targetSchool})
              </span>
            </div>
          </div>

          {/* Topic Matrix Breakdown */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-[#8BA888]" />
              <span>Tỷ lệ chính xác theo chuyên đề trong đề thi:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(topicBreakdown).map(([tId, tData]) => {
                const acc = tData.total > 0 ? Math.round((tData.correct / tData.total) * 100) : 0;
                const isGood = acc >= 75;
                return (
                  <div
                    key={tId}
                    className="p-3 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#3D3D2D]">{tData.name}</span>
                      <span className={isGood ? 'text-emerald-700' : 'text-[#E67E22]'}>
                        {tData.correct}/{tData.total} câu ({acc}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#E8E2D9] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-[#8BA888]' : 'bg-[#E67E22]'
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
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
                <div className="space-y-2.5">
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
          <div className="bg-[#5A5A40]/10 border border-[#5A5A40]/20 p-4 rounded-2xl space-y-3">
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex space-x-1.5">
            <button
              onClick={() => setFilterResult('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filterResult === 'all'
                  ? 'bg-[#5A5A40] text-white'
                  : 'bg-white border border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
              }`}
            >
              Tất cả ({examQuestions.length})
            </button>
            <button
              onClick={() => setFilterResult('wrong')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filterResult === 'wrong'
                  ? 'bg-[#E67E22] text-white'
                  : 'bg-white border border-[#EAE7E0] text-[#E67E22] hover:bg-[#FDF2E9]'
              }`}
            >
              Câu sai ({completedAttempt.incorrectCount})
            </button>
            <button
              onClick={() => setFilterResult('flagged')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer ${
                filterResult === 'flagged'
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
              className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] text-[#4A4A4A] rounded-full text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm lại đề này</span>
            </button>
            <button
              onClick={onBackToDashboard}
              className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Về Dashboard</span>
            </button>
          </div>
        </div>

        {/* Detailed Explanations List */}
        <div className="space-y-4">
          {questionsToReview.map((q) => {
            const userChoice = userAnswers[q.id];
            const isCorrect = userChoice === q.correctOption;
            const isUnattempted = userChoice === undefined;

            return (
              <div
                key={q.id}
                className={`p-6 rounded-[2rem] bg-white border transition-all ${
                  isCorrect
                    ? 'border-[#8BA888]'
                    : isUnattempted
                    ? 'border-[#EAE7E0]'
                    : 'border-[#E67E22] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isCorrect
                          ? 'bg-[#EBF2EB] text-[#8BA888]'
                          : isUnattempted
                          ? 'bg-[#FAF9F6] text-[#6B6B54]'
                          : 'bg-[#FDF2E9] text-[#E67E22]'
                      }`}
                    >
                      Câu {examQuestions.findIndex((item) => item.id === q.id) + 1}
                    </span>
                    <span className="text-xs text-[#8A8A70] font-semibold capitalize">
                      {q.topicId.replace('_', ' ')}
                    </span>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#8BA888]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Đúng (+0.25đ)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#E67E22]">
                      <XCircle className="w-4 h-4" />
                      <span>Sai (Đã lưu vào Sổ câu sai)</span>
                    </span>
                  )}
                </div>

                {q.passage && (
                  <div className="my-3 p-3 bg-[#FAF9F6] rounded-xl text-xs text-[#8A8A70] border border-[#EAE7E0]">
                    {q.passage}
                  </div>
                )}

                <div className="mt-3 text-sm font-bold text-[#3D3D2D] leading-relaxed">
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
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {isOptionCorrect && <Check className="w-4 h-4 text-[#8BA888]" />}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs text-[#3D3D2D] space-y-2">
                  <div className="font-bold flex items-center space-x-1.5 text-[#5A5A40]">
                    <BookOpen className="w-4 h-4" />
                    <span>Giải thích chi tiết & Quy tắc:</span>
                  </div>
                  <p className="leading-relaxed">{q.explanation}</p>

                  {q.grammarRule && (
                    <div className="p-2 bg-white rounded-xl border border-[#D9D2C5] font-mono text-[11px] text-[#3D3D2D]">
                      <strong>Công thức:</strong> {q.grammarRule}
                    </div>
                  )}

                  {q.commonMistakeTip && (
                    <p className="text-[#E67E22] text-[11px]">💡 {q.commonMistakeTip}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};
