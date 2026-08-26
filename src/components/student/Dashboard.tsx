import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { MistakeItem, RemoteTaskAssignment, ExamAttempt } from '../../types';
import { getStoredRemoteTasks, subscribeToRemoteTasks, markRemoteTaskCompleted, studentSubmitRemoteTask } from '../../services/realtimeSyncService';
import { subscribeToGlobalSync } from '../../services/cookieService';
import { ScorePill } from '../common';
import { formatRelativeTime } from '../../utils/formatters';
import { StudentAttemptReviewModal } from '../modals/StudentAttemptReviewModal';
import {
  GraduationCap,
  BookMarked,
  Zap,
  Target,
  Flame,
  Sparkles,
  ArrowRight,
  Compass,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  FileText,
  Clock,
  Award,
  Eye,
  Check,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { TabType } from '../layout/Navbar';

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
  onStartExam: (examId: string) => void;
  onPracticeTopic: (topicId: string) => void;
  onOpenTargetModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onStartExam,
  onPracticeTopic,
  onOpenTargetModal,
}) => {
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, getQuestionById, exams, allExams, switchSubject, vocabularyWords } = useApp();

  const isMath = currentSubject === 'math';
  const currentTopicsMeta = isMath ? MATH_TOPICS_META : TOPICS_META;
  const defaultExamId = isMath ? 'math_exam_official_01' : 'exam_official_01';
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayVocabCount = vocabularyWords ? vocabularyWords.filter((w) => w.dailyBatch === todayDateStr).length : 0;

  // Remote assigned tasks state with real-time sync
  const [tasks, setTasks] = useState<RemoteTaskAssignment[]>(() => getStoredRemoteTasks());
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<ExamAttempt | null>(null);
  const [studentTaskTab, setStudentTaskTab] = useState<'pending' | 'completed'>('pending');
  const [manualSubmitTaskId, setManualSubmitTaskId] = useState<string | null>(null);
  const [manualSubmitNote, setManualSubmitNote] = useState<string>('');

  useEffect(() => {
    setTasks(getStoredRemoteTasks());

    const unsub = subscribeToRemoteTasks((newTask) => {
      setTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== newTask.id);
        return [newTask, ...filtered];
      });
    });

    const unsubSync = subscribeToGlobalSync((event) => {
      if (event.type === 'TASKS_UPDATED') {
        setTasks(getStoredRemoteTasks());
      }
    });

    const handleStorage = () => {
      setTasks(getStoredRemoteTasks());
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsub();
      unsubSync();
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentUser]);

  // Real Subject Attempts & Mistakes
  const filteredAttempts = examAttempts.filter(
    (a) => (a.subject || 'english') === currentSubject
  );
  const activeMistakes = (Object.values(mistakes) as MistakeItem[]).filter(
    (m) => !m.mastered && (m.subject || 'english') === currentSubject
  );
  const activeMistakesCount = activeMistakes.length;

  const currentSubjectTarget =
    isMath
      ? currentUser.targetScoreMath || currentUser.targetScore || 8.5
      : currentUser.targetScoreEnglish || currentUser.targetScore || 8.5;

  // Real dynamic focus topic from weakest topics or first topic
  const dynamicFocusTopicId =
    analytics.weakestTopics && analytics.weakestTopics.length > 0
      ? analytics.weakestTopics[0]
      : isMath
      ? 'math_pt_bac_hai_viet'
      : 'grammar';

  const dynamicFocusTopic =
    currentTopicsMeta.find((t) => t.id === dynamicFocusTopicId) || currentTopicsMeta[0];

  // Remote assigned tasks for this student
  const studentTasks = tasks.filter((t) => {
    if (t.recipientUserId !== 'all' && t.recipientUserId !== currentUser.id) return false;
    return true;
  });

  const pendingTasks = studentTasks.filter((t) => {
    if (t.status === 'confirmed' || t.status === 'submitted') return false;
    if (t.completed && t.status !== 'redo') return false;
    return true;
  });

  const completedTasks = studentTasks.filter((t) => {
    if (t.status === 'submitted' || t.status === 'confirmed') return true;
    if (t.completed && t.status !== 'redo' && t.status !== 'pending') return true;
    return false;
  });

  const getDeadlineInfo = (deadlineStr?: string) => {
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

  const handleStudentConfirmSubmit = (taskId: string) => {
    studentSubmitRemoteTask(taskId, {
      studentName: currentUser.name,
      studentNote: manualSubmitNote.trim() || 'Học sinh đã hoàn thành và gửi xác nhận',
    });
    setManualSubmitTaskId(null);
    setManualSubmitNote('');
  };

  return (
    <div className="space-y-5 pb-8 max-w-5xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. GREETING & FOCUS BANNER (Gọn gàng, tinh tế)              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white p-5 sm:p-7 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#3D3D2D]">
              Chào {currentUser.name}! 👋
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isMath
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isMath ? '📐 Môn Toán 9 Vào 10' : '🇬🇧 Môn Tiếng Anh 9 Vào 10'}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#64748B]">
            {activeMistakesCount > 0 ? (
              <span>
                Bạn đang có{' '}
                <strong className="text-[#E67E22]">{activeMistakesCount} câu cần ôn lại</strong> trong Sổ
                câu sai để không bị mất điểm đáng tiếc.
              </span>
            ) : analytics.totalSolved > 0 ? (
              <span>
                Đang học tốt! Hãy duy trì luyện đề và củng cố chuyên đề{' '}
                <strong className={isMath ? 'text-blue-700' : 'text-[#5A5A40]'}>
                  {dynamicFocusTopic.nameVi}
                </strong>
                .
              </span>
            ) : (
              <span>
                Bắt đầu làm bài kiểm tra hoặc luyện nhanh 10 câu để đánh giá lực học hiện tại nhé.
              </span>
            )}
          </p>
        </div>

        {/* Quick Goal & Streak Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs font-bold text-[#3D3D2D]">
            <Flame className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
            <span>{currentUser.streakDays || 0} ngày liên tiếp</span>
          </div>

          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#EAE7E0] rounded-xl text-xs font-bold text-[#3D3D2D] transition cursor-pointer"
            title="Đổi mục tiêu điểm số"
          >
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Mục tiêu: {currentSubjectTarget}đ</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. NHIỆM VỤ ANH TRAI / GIÁO VIÊN GIAO (Nổi bật & Đầy đủ)    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {studentTasks.length > 0 && (
        <div className="bg-white rounded-[2.5rem] p-5 sm:p-6 border border-[#EAE7E0] shadow-xs space-y-4 animate-in fade-in">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F2ED]">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg shadow-2xs">
                🎯
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-extrabold text-base text-[#3D3D2D]">
                    Nhiệm Vụ & Bài Tập Được Giao
                  </h3>
                  {pendingTasks.length > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full animate-pulse">
                      {pendingTasks.length} bài cần làm
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8A8A70]">
                  Bài tập từ người giám sát • Quản lý hạn nộp & trạng thái xác nhận
                </p>
              </div>
            </div>

            {/* Sub-tabs: Cần làm vs Đã nộp/Xác nhận */}
            <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#EAE7E0] text-xs font-bold w-full sm:w-auto">
              <button
                onClick={() => setStudentTaskTab('pending')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  studentTaskTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                }`}
              >
                <span>⚡ Cần làm</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  studentTaskTab === 'pending' ? 'bg-amber-700 text-white' : 'bg-[#EAE7E0] text-[#6B6B54]'
                }`}>
                  {pendingTasks.length}
                </span>
              </button>

              <button
                onClick={() => setStudentTaskTab('completed')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                  studentTaskTab === 'completed'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                }`}
              >
                <span>📋 Đã nộp & Xác nhận</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  studentTaskTab === 'completed' ? 'bg-emerald-800 text-white' : 'bg-[#EAE7E0] text-[#6B6B54]'
                }`}>
                  {completedTasks.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: PENDING / REDO TASKS */}
          {studentTaskTab === 'pending' && (
            <div>
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-[#D9D2C5] space-y-2">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-2xs">
                    ✨
                  </div>
                  <p className="text-xs font-bold text-[#3D3D2D]">Bạn đã hoàn thành tất cả nhiệm vụ được giao!</p>
                  <p className="text-[11px] text-[#8A8A70]">
                    Hãy chuyển sang tab "Đã nộp & Xác nhận" để xem kết quả đánh giá từ người giám sát.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {pendingTasks.map((t) => {
                    const dl = getDeadlineInfo(t.targetDeadline);
                    const isRedo = t.status === 'redo';

                    return (
                      <div
                        key={t.id}
                        className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 shadow-xs ${
                          isRedo
                            ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300'
                            : dl?.isOverdue
                            ? 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                            : 'bg-[#FAF9F6] border-[#EAE7E0] hover:border-[#D9D2C5]'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Card Top: Subject badge + Sender + Deadline */}
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${
                                  t.subject === 'math' ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
                                }`}
                              >
                                {t.subject === 'math' ? '📐 Toán' : '🇬🇧 Tiếng Anh'}
                              </span>

                              {isRedo ? (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                  <AlertCircle className="w-3 h-3 text-rose-600" />
                                  <span>Cần làm lại</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Đang làm</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-[#8A8A70]">
                              {formatRelativeTime(t.timestamp)}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="font-extrabold text-sm text-[#3D3D2D] leading-snug">
                            {t.title}
                          </h4>

                          {/* Teacher Message */}
                          {t.message && (
                            <p className="text-xs text-[#5A5A40] italic bg-white/80 p-2.5 rounded-xl border border-[#EAE7E0] line-clamp-2">
                              💬 "{t.message}"
                            </p>
                          )}

                          {/* Redo feedback from teacher if any */}
                          {isRedo && t.adminFeedback && (
                            <div className="p-2.5 bg-rose-100/70 border border-rose-300 rounded-xl text-xs text-rose-900 space-y-0.5">
                              <div className="font-bold flex items-center space-x-1 text-rose-800">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Lời dặn của {t.senderName || 'Người giám sát'}:</span>
                              </div>
                              <p className="text-[11px] italic leading-relaxed">"{t.adminFeedback}"</p>
                            </div>
                          )}

                          {/* Deadline Visual Alert */}
                          {dl && (
                            <div
                              className={`flex items-center space-x-1.5 text-xs font-bold p-2 rounded-xl border ${
                                dl.isOverdue
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : dl.isUrgent
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              <Clock className={`w-3.5 h-3.5 ${dl.isOverdue ? 'text-rose-600' : 'text-blue-600'}`} />
                              <span>Hạn chót: {dl.dateFormatted}</span>
                              <span className="opacity-90 font-extrabold">({dl.label})</span>
                            </div>
                          )}
                        </div>

                        {/* Inline Manual Submit Box if opened */}
                        {manualSubmitTaskId === t.id && (
                          <div className="p-3 bg-white rounded-xl border border-[#D9D2C5] space-y-2 animate-in fade-in">
                            <label className="block text-[11px] font-bold text-[#3D3D2D]">
                              Ghi chú khi nộp bài (tùy chọn):
                            </label>
                            <input
                              type="text"
                              value={manualSubmitNote}
                              onChange={(e) => setManualSubmitNote(e.target.value)}
                              placeholder="Ví dụ: Em đã hoàn thành và xem lại 5 câu sai..."
                              className="w-full text-xs p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-lg outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                            />
                            <div className="flex justify-end space-x-1.5">
                              <button
                                onClick={() => setManualSubmitTaskId(null)}
                                className="px-2.5 py-1 text-[11px] text-[#6B6B54] hover:bg-[#EAE7E0] rounded-lg transition"
                              >
                                Hủy
                              </button>
                              <button
                                onClick={() => handleStudentConfirmSubmit(t.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                              >
                                <Send className="w-3 h-3" />
                                <span>Gửi xác nhận ngay</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card Action Buttons */}
                        <div className="pt-2 border-t border-[#EAE7E0]/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              if (t.subject) switchSubject(t.subject);
                              if (t.assignedExamId) onStartExam(t.assignedExamId);
                              else if (t.assignedTopicId) onPracticeTopic(t.assignedTopicId);
                              else onStartExam(defaultExamId);
                            }}
                            className="flex-1 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                          >
                            <span>{isRedo ? 'Làm lại ngay' : 'Bắt đầu làm'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {manualSubmitTaskId !== t.id && (
                            <button
                              onClick={() => {
                                setManualSubmitTaskId(t.id);
                                setManualSubmitNote('');
                              }}
                              className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1"
                              title="Báo cáo hoàn thành nhiệm vụ để người giám sát xác nhận"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">Báo cáo nộp bài</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUBMITTED & CONFIRMED TASKS (LỊCH SỬ & XÁC NHẬN) */}
          {studentTaskTab === 'completed' && (
            <div>
              {completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-[#D9D2C5] space-y-2">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-2xs">
                    📝
                  </div>
                  <p className="text-xs font-bold text-[#3D3D2D]">Chưa có nhiệm vụ nào hoàn thành</p>
                  <p className="text-[11px] text-[#8A8A70]">
                    Sau khi làm xong bài tập ở tab "Cần làm", kết quả và trạng thái duyệt sẽ hiển thị ở đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {completedTasks.map((t) => {
                    const isConfirmed = t.status === 'confirmed' || (!t.status && t.completed);
                    const isSubmitted = t.status === 'submitted';
                    const dl = getDeadlineInfo(t.targetDeadline);

                    // Find corresponding attempt if any
                    const attempt = t.studentAttemptId
                      ? examAttempts.find((a) => a.id === t.studentAttemptId)
                      : t.assignedExamId
                      ? examAttempts.find((a) => a.examId === t.assignedExamId)
                      : null;

                    return (
                      <div
                        key={t.id}
                        className={`rounded-2xl p-4 border transition flex flex-col justify-between space-y-3 shadow-xs ${
                          isConfirmed
                            ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                            : 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="space-y-2">
                          {/* Card Top: Subject + Status Badge */}
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${
                                  t.subject === 'math' ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
                                }`}
                              >
                                {t.subject === 'math' ? '📐 Toán' : '🇬🇧 Tiếng Anh'}
                              </span>

                              {isConfirmed ? (
                                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã duyệt hoàn thành</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-bold flex items-center space-x-1">
                                  <Clock className="w-3 h-3 text-blue-600" />
                                  <span>Đã nộp • Chờ xác nhận</span>
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-[#8A8A70]">
                              {t.studentCompletedAt
                                ? `Nộp: ${formatRelativeTime(t.studentCompletedAt)}`
                                : formatRelativeTime(t.timestamp)}
                            </span>
                          </div>

                          {/* Task Title */}
                          <h4 className="font-extrabold text-sm text-[#3D3D2D] leading-snug">
                            {t.title}
                          </h4>

                          {/* Score Pill & Student Note */}
                          {(t.studentScore !== undefined || attempt) && (
                            <div className="p-2.5 bg-white/90 rounded-xl border border-[#EAE7E0] flex items-center justify-between text-xs">
                              <span className="font-bold text-[#3D3D2D]">Kết quả bài làm:</span>
                              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                {t.studentScore !== undefined
                                  ? `${t.studentScore.toFixed(1)}/10 điểm`
                                  : attempt
                                  ? `${attempt.score.toFixed(1)}/10 điểm`
                                  : ''}
                              </span>
                            </div>
                          )}

                          {/* Student note if submitted manually */}
                          {t.studentNote && (
                            <p className="text-[11px] text-[#64748B] italic bg-white/60 p-2 rounded-lg border border-[#EAE7E0]/60">
                              📝 Báo cáo: "{t.studentNote}"
                            </p>
                          )}

                          {/* Teacher Feedback when confirmed */}
                          {isConfirmed && t.adminFeedback && (
                            <div className="p-2.5 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-900 space-y-0.5">
                              <div className="font-bold flex items-center space-x-1 text-emerald-800">
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Nhận xét từ {t.senderName || 'Người giám sát'}:</span>
                              </div>
                              <p className="text-[11px] italic leading-relaxed">"{t.adminFeedback}"</p>
                            </div>
                          )}

                          {/* Deadline Info */}
                          {dl && (
                            <p className="text-[10px] text-[#8A8A70]">
                              ⏰ Hạn chót ban đầu: {dl.dateFormatted}
                            </p>
                          )}
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="pt-2 border-t border-[#EAE7E0]/60 flex items-center justify-between gap-2">
                          {attempt ? (
                            <button
                              onClick={() => setSelectedAttemptForReview(attempt)}
                              className="flex-1 py-1.5 bg-white hover:bg-[#FAF9F6] text-[#1E3A8A] border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem lại bài làm</span>
                            </button>
                          ) : (
                            <div className="text-[11px] text-[#8A8A70] italic">
                              {isConfirmed ? 'Đã hoàn thành đạt yêu cầu' : 'Đang chờ người giám sát duyệt'}
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (t.subject) switchSubject(t.subject);
                              if (t.assignedExamId) onStartExam(t.assignedExamId);
                              else if (t.assignedTopicId) onPracticeTopic(t.assignedTopicId);
                              else onStartExam(defaultExamId);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-zinc-100 text-[#5A5A40] border border-[#D9D2C5] rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                            title="Luyện tập lại"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Làm lại</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. 4 THỐNG KÊ REAL-DATA (100% số liệu thật)                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Real Exam Score Average */}
        <div
          onClick={() => setActiveTab('mock_exam')}
          className={`p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] text-white flex flex-col justify-between shadow-xs cursor-pointer transition hover:opacity-95 ${
            isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
          }`}
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-white/70 block">
              Điểm thi thử TB
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {filteredAttempts.length > 0 ? `${analytics.averageExamScore.toFixed(1)}đ` : '--'}
            </div>
          </div>
          <p className="text-[11px] text-white/80 mt-2">
            Đã nộp: <strong>{filteredAttempts.length} đề thi</strong>
          </p>
        </div>

        {/* Metric 2: Real Solved Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">
              Câu {isMath ? 'Toán' : 'Tiếng Anh'} đã làm
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#3D3D2D] mt-1">
              {analytics.totalSolved}
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-2">
            {analytics.totalSolved > 0
              ? `✓ ${analytics.totalCorrect}/${analytics.totalSolved} câu đúng`
              : 'Chưa có lượt giải'}
          </p>
        </div>

        {/* Metric 3: Real Overall Accuracy */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Độ chính xác</span>
            <div className="text-2xl sm:text-3xl font-black text-[#3D3D2D] mt-1">
              {analytics.overallAccuracy}%
            </div>
          </div>
          <div className="w-full bg-[#FAF9F6] h-1.5 rounded-full mt-2 overflow-hidden border border-[#EAE7E0]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analytics.overallAccuracy >= 80
                  ? 'bg-emerald-500'
                  : analytics.overallAccuracy >= 60
                  ? 'bg-amber-500'
                  : 'bg-[#E67E22]'
              }`}
              style={{ width: `${analytics.overallAccuracy}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Real Mistakes Count */}
        <div
          onClick={() => setActiveTab('mistakes')}
          className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between cursor-pointer hover:border-[#E67E22] transition"
        >
          <div>
            <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">
              Sổ câu sai cần chữa
            </span>
            <div className="text-2xl sm:text-3xl font-black text-[#E67E22] mt-1">
              {activeMistakesCount} <span className="text-xs font-bold text-[#8A8A70]">câu</span>
            </div>
          </div>
          <p className="text-[11px] text-[#8A8A70] mt-2">
            {activeMistakesCount > 0 ? 'Bấm để mở và luyện lại →' : '🎉 Không có câu sai tồn đọng'}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. 3 KHỐI TRỌNG TÂM HỌC TẬP (Simple & Focused Action Hub)    */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Thi Thử Tuyển Sinh */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[#3D3D2D]">1. Thi Thử Đề Chuẩn</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Làm đề thi thử chuẩn cấu trúc vào 10 (bấm giờ thi thật, tự động chấm điểm và chữa câu sai).
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => onStartExam(defaultExamId)}
              className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs ${
                isMath ? 'bg-[#1E3A8A] hover:bg-[#1E40AF]' : 'bg-[#5A5A40] hover:bg-[#3D3D2D]'
              }`}
            >
              <span>Vào thi đề số 01</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab('ai_generator')}
              className="w-full py-2 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI tạo đề riêng</span>
            </button>
          </div>
        </div>

        {/* Pillar 2: Luyện Phản Xạ Nhanh & Chuyên Đề */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[#3D3D2D]">2. Luyện Nhanh 10 Câu</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Luyện phản xạ công thức, nhận biết dạng bài trong 5 phút để tạo thói quen làm bài nhanh.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => setActiveTab('quick_blitz')}
              className="w-full py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <span>Bắt đầu 10 câu nhanh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onPracticeTopic(dynamicFocusTopic.id)}
              className="w-full py-2 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">Luyện: {dynamicFocusTopic.nameVi.slice(0, 18)}...</span>
            </button>
          </div>
        </div>

        {/* Pillar 3: Sổ Câu Sai & Flashcard */}
        <div className="bg-white p-5 sm:p-6 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-[#3D3D2D]">3. Sổ Câu Sai & Ghi Nhớ</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Đọc lại phân tích bẫy sai và ôn flashcard công thức để đảm bảo không bị trừ điểm oan.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => setActiveTab('mistakes')}
              className="w-full py-2.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#EAE7E0] text-[#3D3D2D] rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Mở Sổ câu sai ({activeMistakesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab('vocab')}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs ${
                !isMath && todayVocabCount > 0
                  ? 'bg-amber-500 hover:bg-amber-600 text-white font-extrabold shadow-sm'
                  : 'bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D]'
              }`}
            >
              <span>🗂️ Flashcard {isMath ? 'công thức' : 'từ vựng'}</span>
              {!isMath && todayVocabCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white text-amber-900 text-[10px] font-black rounded-full ml-1">
                  +{todayVocabCount} mới
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4.5 ĐỀ THI MỚI DO THẦY CÔ & AI SOẠN (Hiển thị ngay cho học sinh) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(() => {
        const subjectExams = exams.filter((e) => (e.subject || 'english') === currentSubject);
        const newTeacherOrAiExams = subjectExams.filter(
          (ex) =>
            !ex.isOfficialFormat ||
            ex.id.startsWith('exam_ai_') ||
            ex.id.startsWith('exam_custom_') ||
            ex.id.startsWith('exam_upload_') ||
            ex.creatorUserId !== undefined ||
            ex.title.includes('AI')
        );

        if (newTeacherOrAiExams.length === 0) return null;

        return (
          <section className="bg-white p-5 sm:p-7 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base shadow-2xs">
                  🎓
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">
                    Đề thi mới do Thầy Cô & AI biên soạn ({newTeacherOrAiExams.length} đề)
                  </h3>
                  <p className="text-[11px] text-[#8A8A70]">
                    Các đề thi vừa được thêm vào hệ thống môn {isMath ? 'Toán' : 'Tiếng Anh'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('mock_exam')}
                className="text-xs font-extrabold text-[#5A5A40] hover:underline cursor-pointer"
              >
                Mở phòng thi thử →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {newTeacherOrAiExams.slice(0, 6).map((ex) => (
                <div
                  key={ex.id}
                  className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#5A5A40] transition flex flex-col justify-between space-y-3 shadow-2xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">
                        {ex.id.startsWith('exam_ai_') ? '🤖 AI Soạn' : '📄 Đề Thầy Cô'}
                      </span>
                      <span className="text-[10px] text-[#8A8A70] font-medium">
                        ⏱️ {ex.timeLimitMinutes} phút • {ex.questionIds.length} câu
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-[#3D3D2D] line-clamp-2" title={ex.title}>
                      {ex.title}
                    </h4>
                    {ex.description && (
                      <p className="text-[11px] text-[#8A8A70] line-clamp-1 italic">
                        {ex.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onStartExam(ex.id)}
                    className="w-full py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                  >
                    <span>Làm bài ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. TIẾN ĐỘ CHUYÊN ĐỀ (100% Real Data, Clean State)         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white p-5 sm:p-7 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
          <div>
            <h3 className="font-extrabold text-base text-[#3D3D2D]">
              Độ nắm vững các chuyên đề {isMath ? 'Toán 9' : 'Tiếng Anh 9'}
            </h3>
            <p className="text-xs text-[#8A8A70]">Tỷ lệ chính xác theo bài làm thực tế của bạn</p>
          </div>

          <button
            onClick={() => setActiveTab('topic_practice')}
            className="text-xs font-extrabold text-[#5A5A40] hover:underline cursor-pointer"
          >
            Xem tất cả chuyên đề →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {currentTopicsMeta.slice(0, 6).map((topic) => {
            const stat = analytics.topicStats[topic.id] || { solved: 0, accuracy: 0 };
            const hasDone = stat.solved > 0;
            const accuracy = stat.accuracy;

            return (
              <div
                key={topic.id}
                onClick={() => onPracticeTopic(topic.id)}
                className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#D9D2C5] transition cursor-pointer flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-bold text-[#3D3D2D] truncate">{topic.nameVi}</p>
                  <p className="text-[10px] text-[#8A8A70]">
                    {hasDone ? `Đã làm ${stat.solved} câu` : 'Chưa luyện tập'}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {hasDone ? (
                    <>
                      <div className="w-16 bg-[#E8E2D9] h-2 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className={`h-full rounded-full ${
                            accuracy >= 80
                              ? 'bg-emerald-500'
                              : accuracy >= 60
                              ? 'bg-amber-500'
                              : 'bg-[#E67E22]'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span
                        className={`font-black ${
                          accuracy >= 80
                            ? 'text-emerald-700'
                            : accuracy >= 60
                            ? 'text-amber-700'
                            : 'text-[#E67E22]'
                        }`}
                      >
                        {accuracy}%
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#8A8A70] italic">Luyện ngay →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 6. LỊCH SỬ BÀI THI ĐÃ LÀM GẦN ĐÂY                          */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {filteredAttempts.length > 0 && (
        <section className="bg-white p-5 sm:p-7 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base shadow-2xs">
                📝
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">
                  Lịch sử bài thi {isMath ? 'Toán' : 'Tiếng Anh'} đã nộp ({filteredAttempts.length} bài)
                </h3>
                <p className="text-[11px] text-[#64748B]">
                  Kết quả làm bài và điểm số các lần thi thử gần nhất của bạn
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-extrabold text-[#5A5A40] hover:underline cursor-pointer"
            >
              Xem báo cáo chi tiết →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAttempts.slice(0, 6).map((attempt, index) => (
              <div
                key={attempt.id || index}
                onClick={() => setSelectedAttemptForReview(attempt)}
                className="p-4 bg-[#FAF9F6] hover:bg-white rounded-2xl border border-[#EAE7E0] hover:border-[#1E3A8A] transition flex flex-col justify-between space-y-2.5 shadow-2xs cursor-pointer group"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-[#64748B]">
                      {formatRelativeTime(attempt.date)}
                    </span>
                    <ScorePill score={attempt.score} maxScore={10} />
                  </div>
                  <h4 className="font-bold text-xs text-[#3D3D2D] group-hover:text-[#1E3A8A] line-clamp-2 transition" title={attempt.examTitle}>
                    {attempt.examTitle}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#EAE7E0]/60 text-[11px] text-[#64748B]">
                  <span>
                    ✓ {attempt.correctCount}/{attempt.totalQuestions} câu đúng
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAttemptForReview(attempt);
                      }}
                      className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                      title="Xem chi tiết bài làm & lời giải"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem giải</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (attempt.examId) onStartExam(attempt.examId);
                      }}
                      className="font-bold text-[#1E3A8A] hover:underline flex items-center space-x-0.5"
                      title="Làm lại đề thi này"
                    >
                      <span>Làm lại</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Detailed Student Attempt Review Modal */}
      <StudentAttemptReviewModal
        attempt={selectedAttemptForReview}
        onClose={() => setSelectedAttemptForReview(null)}
        onRetakeExam={onStartExam}
      />
    </div>
  );
};
