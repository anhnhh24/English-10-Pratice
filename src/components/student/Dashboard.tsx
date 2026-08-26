import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { MistakeItem, RemoteTaskAssignment, ExamAttempt } from '../../types';
import { getStoredRemoteTasks, subscribeToRemoteTasks, studentSubmitRemoteTask } from '../../services/realtimeSyncService';
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
  Clock,
  Eye,
  Check,
  Send,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
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
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, exams, switchSubject, vocabularyWords } = useApp();

  const isMath = currentSubject === 'math';
  const currentTopicsMeta = isMath ? MATH_TOPICS_META : TOPICS_META;
  const defaultExamId = isMath ? 'math_exam_official_01' : 'exam_official_01';
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayVocabCount = vocabularyWords ? vocabularyWords.filter((w) => w.dailyBatch === todayDateStr).length : 0;

  // Remote assigned tasks state with real-time sync
  const [tasks, setTasks] = useState<RemoteTaskAssignment[]>(() => getStoredRemoteTasks());
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<ExamAttempt | null>(null);
  const [manualSubmitTaskId, setManualSubmitTaskId] = useState<string | null>(null);
  const [manualSubmitNote, setManualSubmitNote] = useState<string>('');
  const [showAllPendingTasks, setShowAllPendingTasks] = useState<boolean>(false);
  
  // Tabbed Content Hub state (giảm rối mắt bằng cách chia tab nội dung chi tiết)
  const [detailTab, setDetailTab] = useState<'topics' | 'exams' | 'history' | 'completed_tasks'>('topics');

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

  // Dynamic recommended focus topic
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

  // New exams created by teachers / AI
  const subjectExams = exams.filter((e) => (e.subject || 'english') === currentSubject);

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

  // Primary top pending task for focus hero
  const topPendingTask = pendingTasks.length > 0 ? pendingTasks[0] : null;
  const remainingPendingTasks = pendingTasks.slice(1);

  return (
    <div className="space-y-4 sm:space-y-5 pb-8 max-w-5xl mx-auto">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 1. GREETING & STATUS BANNER (Tinh tế, ấm áp, gọn gàng)      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white p-4 sm:p-6 rounded-[2rem] border border-[#EAE7E0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <h2 className="text-lg sm:text-xl font-black text-[#3D3D2D]">
              Chào {currentUser.name}! 👋
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isMath
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {isMath ? '📐 Môn Toán Vào 10' : '🇬🇧 Môn Tiếng Anh Vào 10'}
            </span>
          </div>
          <p className="text-xs text-[#64748B]">
            Mục tiêu: <strong className="text-[#3D3D2D]">{currentUser.targetSchool}</strong> ({currentSubjectTarget}đ môn {isMath ? 'Toán' : 'Anh'})
          </p>
        </div>

        {/* Quick Goal & Streak Badges */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1 px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs font-bold text-[#3D3D2D]">
            <Flame className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
            <span>{currentUser.streakDays || 0} ngày</span>
          </div>

          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#EAE7E0] rounded-xl text-xs font-bold text-emerald-800 transition cursor-pointer"
            title="Đổi mục tiêu điểm số"
          >
            <Target className="w-4 h-4 text-emerald-600" />
            <span>{currentSubjectTarget}đ</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 2. ⭐ KHU VỰC TRỌNG TÂM HÔM NAY (Today's Hero Focus)         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {topPendingTask ? (
        // Case A: Có nhiệm vụ cần làm ngay
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-[2rem] p-5 sm:p-6 border-2 border-amber-400/80 shadow-xs space-y-3.5 animate-in fade-in">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base font-bold shadow-2xs">
                🎯
              </span>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 block">
                  Nhiệm Vụ Ưu Tiên Hôm Nay ({pendingTasks.length} bài cần làm)
                </span>
                <p className="text-xs text-[#64748B]">
                  Giao bởi: <strong>{topPendingTask.senderName || 'Người giám sát'}</strong>
                </p>
              </div>
            </div>

            {(() => {
              const dl = getDeadlineInfo(topPendingTask.targetDeadline);
              if (!dl) return null;
              return (
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 border ${
                  dl.isOverdue
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : dl.isUrgent
                    ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                    : 'bg-white text-blue-800 border-blue-200'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{dl.label} ({dl.dateFormatted})</span>
                </span>
              );
            })()}
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EAE7E0] space-y-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold text-white ${
                topPendingTask.subject === 'math' ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
              }`}>
                {topPendingTask.subject === 'math' ? '📐 Môn Toán' : '🇬🇧 Tiếng Anh'}
              </span>
              {topPendingTask.status === 'redo' && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[10px] font-bold">
                  ⚠️ Cần làm lại
                </span>
              )}
            </div>

            <h3 className="font-extrabold text-base sm:text-lg text-[#3D3D2D] leading-snug">
              {topPendingTask.title}
            </h3>

            {topPendingTask.message && (
              <p className="text-xs text-[#5A5A40] italic bg-[#FAF9F6] p-2.5 rounded-xl border border-[#EAE7E0]">
                💬 Lời dặn: "{topPendingTask.message}"
              </p>
            )}

            {topPendingTask.adminFeedback && topPendingTask.status === 'redo' && (
              <p className="text-xs text-rose-900 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                🔴 Nhận xét cần sửa: "{topPendingTask.adminFeedback}"
              </p>
            )}

            {/* Inline manual submit box */}
            {manualSubmitTaskId === topPendingTask.id && (
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-emerald-300 space-y-2 pt-2 animate-in fade-in">
                <input
                  type="text"
                  value={manualSubmitNote}
                  onChange={(e) => setManualSubmitNote(e.target.value)}
                  placeholder="Ghi chú khi nộp bài (ví dụ: Em đã hoàn thành và xem lại 3 câu sai)..."
                  className="w-full text-xs p-2.5 bg-white border border-[#D9D2C5] rounded-xl outline-hidden focus:ring-1 focus:ring-emerald-600"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setManualSubmitTaskId(null)}
                    className="px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#EAE7E0] rounded-xl transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleStudentConfirmSubmit(topPendingTask.id)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi xác nhận hoàn thành</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (topPendingTask.subject) switchSubject(topPendingTask.subject);
                  if (topPendingTask.assignedExamId) onStartExam(topPendingTask.assignedExamId);
                  else if (topPendingTask.assignedTopicId) onPracticeTopic(topPendingTask.assignedTopicId);
                  else onStartExam(defaultExamId);
                }}
                className="flex-1 py-2.5 px-4 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-extrabold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>{topPendingTask.status === 'redo' ? 'Làm lại bài ngay' : '👉 Bắt đầu làm ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {manualSubmitTaskId !== topPendingTask.id && (
                <button
                  onClick={() => {
                    setManualSubmitTaskId(topPendingTask.id);
                    setManualSubmitNote('');
                  }}
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1"
                  title="Báo cáo hoàn thành nhiệm vụ"
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Báo cáo nộp bài</span>
                </button>
              )}
            </div>
          </div>

          {/* Expand more tasks toggle if > 1 task */}
          {remainingPendingTasks.length > 0 && (
            <div>
              <button
                onClick={() => setShowAllPendingTasks(!showAllPendingTasks)}
                className="w-full py-2 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs font-bold text-[#5A5A40] transition cursor-pointer flex items-center justify-center space-x-1"
              >
                <span>
                  {showAllPendingTasks
                    ? 'Thu gọn danh sách bài tập'
                    : `Xem thêm ${remainingPendingTasks.length} nhiệm vụ khác`}
                </span>
                {showAllPendingTasks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAllPendingTasks && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 animate-in fade-in">
                  {remainingPendingTasks.map((t) => {
                    const dl = getDeadlineInfo(t.targetDeadline);
                    return (
                      <div key={t.id} className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] space-y-2 text-xs shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#3D3D2D] truncate">{t.title}</span>
                          {dl && <span className="text-[10px] text-amber-800 font-bold">{dl.label}</span>}
                        </div>
                        {t.message && <p className="text-[11px] text-[#64748B] italic line-clamp-1">"{t.message}"</p>}
                        <div className="flex items-center space-x-2 pt-1">
                          <button
                            onClick={() => {
                              if (t.subject) switchSubject(t.subject);
                              if (t.assignedExamId) onStartExam(t.assignedExamId);
                              else if (t.assignedTopicId) onPracticeTopic(t.assignedTopicId);
                              else onStartExam(defaultExamId);
                            }}
                            className="flex-1 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold rounded-lg text-xs transition"
                          >
                            Làm bài
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
      ) : activeMistakesCount > 0 ? (
        // Case B: Có câu sai cần ôn lại
        <div className="bg-gradient-to-r from-orange-50 via-white to-amber-50 rounded-[2rem] p-5 sm:p-6 border border-[#E67E22]/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-orange-100 text-[#E67E22] flex items-center justify-center text-xl font-bold shrink-0 shadow-2xs">
              📖
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E67E22] block">
                Đề Xuất Ôn Luyện Hôm Nay
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">
                Em đang có <span className="text-[#E67E22]">{activeMistakesCount} câu sai</span> cần xem lại
              </h3>
              <p className="text-xs text-[#64748B]">
                Hãy dành 5 phút sửa lỗi bẫy để không bị mất điểm đáng tiếc trong kỳ thi nhé!
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('mistakes')}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white font-extrabold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shrink-0 shadow-xs"
          >
            <span>Mở Sổ câu sai & Luyện lại</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Case C: Đã hoàn thành tốt mục tiêu
        <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 rounded-[2rem] p-5 sm:p-6 border border-emerald-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl font-bold shrink-0 shadow-2xs">
              ✨
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                Tiến Độ Rất Tốt
              </span>
              <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">
                Không có câu sai tồn đọng! Em đã sẵn sàng thi thử chưa?
              </h3>
              <p className="text-xs text-[#64748B]">
                Hãy làm 1 đề thi thử số 01 hoặc làm 10 câu phản xạ để duy trì phong độ.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => onStartExam(defaultExamId)}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-extrabold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
            >
              <span>Vào thi thử đề số 01</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 3. THANH THỐNG KÊ 3 CHỈ SỐ TINH GỌN (Compact Metrics)       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {/* Metric 1: Điểm TB */}
        <div
          onClick={() => setActiveTab('mock_exam')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            isMath ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300' : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            Điểm TB Thi Thử
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#3D3D2D] my-1">
            {filteredAttempts.length > 0 ? `${analytics.averageExamScore.toFixed(1)}đ` : '--'}
          </div>
          <span className="text-[10px] text-[#64748B] truncate">
            {filteredAttempts.length > 0 ? `Đã nộp ${filteredAttempts.length} đề thi` : 'Chưa thi thử'}
          </span>
        </div>

        {/* Metric 2: Câu đã giải */}
        <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-[#EAE7E0] flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            Câu {isMath ? 'Toán' : 'Anh'} Đã Làm
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#3D3D2D] my-1">
            {analytics.totalSolved}
          </div>
          <span className="text-[10px] text-emerald-700 font-bold truncate">
            {analytics.totalSolved > 0 ? `✓ Đúng ${analytics.overallAccuracy}%` : 'Chưa có lượt giải'}
          </span>
        </div>

        {/* Metric 3: Sổ câu sai */}
        <div
          onClick={() => setActiveTab('mistakes')}
          className="p-3.5 sm:p-4 bg-white hover:bg-orange-50/30 rounded-2xl border border-[#EAE7E0] hover:border-[#E67E22] transition cursor-pointer flex flex-col justify-between"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
            Sổ Câu Sai
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#E67E22] my-1">
            {activeMistakesCount} <span className="text-xs font-normal text-[#8A8A70]">câu</span>
          </div>
          <span className="text-[10px] text-[#8A8A70] truncate">
            {activeMistakesCount > 0 ? 'Bấm để mở sổ →' : '✓ Sạch câu sai'}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 4. BỘ 3 LỐI TẮT HỌC TẬP CHÍNH (3 Clean Study Cards)         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Pillar 1: Thi Thử Chuẩn */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">1. Thi Thử Đề Chuẩn</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Bấm giờ làm bài như thi thật, tự động chấm điểm và giải thích chi tiết.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => onStartExam(defaultExamId)}
              className="w-full py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 shadow-2xs"
            >
              <span>Vào thi đề số 01</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('ai_generator')}
              className="w-full py-1.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Tạo đề ôn tập</span>
            </button>
          </div>
        </div>

        {/* Pillar 2: Luyện Nhanh & Chuyên Đề */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">2. Luyện Nhanh 10 Câu</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              5 phút phản xạ công thức, nhận biết dạng câu hỏi nhanh không mất nhiều thời gian.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => setActiveTab('quick_blitz')}
              className="w-full py-2 bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1 shadow-2xs"
            >
              <span>Bắt đầu 10 câu nhanh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onPracticeTopic(dynamicFocusTopic.id)}
              className="w-full py-1.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate">Luyện: {dynamicFocusTopic.nameVi.slice(0, 16)}...</span>
            </button>
          </div>
        </div>

        {/* Pillar 3: Sổ Câu Sai & Ghi Nhớ */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE7E0] shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">3. Sổ Câu Sai & Ghi Nhớ</h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Đọc giải thích bẫy sai và lật flashcard công thức để ghi nhớ kiến thức sâu.
            </p>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#F5F2ED]">
            <button
              onClick={() => setActiveTab('mistakes')}
              className="w-full py-2 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#EAE7E0] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>Mở Sổ câu sai ({activeMistakesCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('vocab')}
              className="w-full py-1.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>🗂️ Flashcard {isMath ? 'công thức' : 'từ vựng'}</span>
              {!isMath && todayVocabCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-black rounded-full ml-1">
                  +{todayVocabCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 5. HỘP NỘI DUNG ĐA NĂNG PHÂN TAB (Tabbed Content Hub)       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs p-4 sm:p-6 space-y-4">
        {/* Tab Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F5F2ED]">
          <div className="flex bg-[#FAF9F6] p-1 rounded-2xl border border-[#EAE7E0] text-xs font-bold w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setDetailTab('topics')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                detailTab === 'topics' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chuyên đề trọng tâm ({currentTopicsMeta.length})</span>
            </button>

            <button
              onClick={() => setDetailTab('exams')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                detailTab === 'exams' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Đề thi thử ({subjectExams.length})</span>
            </button>

            <button
              onClick={() => setDetailTab('history')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                detailTab === 'history' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lịch sử bài làm ({filteredAttempts.length})</span>
            </button>

            {completedTasks.length > 0 && (
              <button
                onClick={() => setDetailTab('completed_tasks')}
                className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  detailTab === 'completed_tasks' ? 'bg-emerald-700 text-white shadow-xs' : 'text-emerald-800 hover:text-emerald-950'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Nhiệm vụ đã nộp ({completedTasks.length})</span>
              </button>
            )}
          </div>

          {/* Quick link button based on selected tab */}
          {detailTab === 'topics' ? (
            <button
              onClick={() => setActiveTab('topic_practice')}
              className="text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer text-right"
            >
              Mở luyện chuyên đề →
            </button>
          ) : detailTab === 'exams' ? (
            <button
              onClick={() => setActiveTab('mock_exam')}
              className="text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer text-right"
            >
              Xem phòng thi thử →
            </button>
          ) : detailTab === 'history' ? (
            <button
              onClick={() => setActiveTab('analytics')}
              className="text-xs font-bold text-[#5A5A40] hover:underline cursor-pointer text-right"
            >
              Báo cáo năng lực →
            </button>
          ) : null}
        </div>

        {/* TAB 1: TIẾN ĐỘ CHUYÊN ĐỀ */}
        {detailTab === 'topics' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in">
            {currentTopicsMeta.map((topic) => {
              const stat = analytics.topicStats[topic.id] || { solved: 0, accuracy: 0 };
              const hasDone = stat.solved > 0;
              const accuracy = stat.accuracy;

              return (
                <div
                  key={topic.id}
                  onClick={() => onPracticeTopic(topic.id)}
                  className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#5A5A40] transition cursor-pointer flex items-center justify-between text-xs group shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#3D3D2D] truncate group-hover:text-[#5A5A40] transition">
                      {topic.nameVi}
                    </p>
                    <p className="text-[10px] text-[#8A8A70]">
                      {hasDone ? `Đã làm ${stat.solved} câu` : 'Chưa luyện tập'}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {hasDone ? (
                      <span
                        className={`font-black text-xs ${
                          accuracy >= 80 ? 'text-emerald-700' : accuracy >= 60 ? 'text-amber-700' : 'text-[#E67E22]'
                        }`}
                      >
                        {accuracy}%
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#8A8A70] italic">Luyện →</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: ĐỀ THI THỬ & ĐỀ MỚI */}
        {detailTab === 'exams' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in">
            {subjectExams.slice(0, 6).map((ex) => (
              <div
                key={ex.id}
                className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] hover:border-[#5A5A40] transition flex flex-col justify-between space-y-2.5 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-lg text-[10px]">
                      {ex.isOfficialFormat ? '📄 Đề Chuẩn' : '🤖 Đề AI / Thầy Cô'}
                    </span>
                    <span className="text-[10px] text-[#8A8A70]">
                      ⏱️ {ex.timeLimitMinutes}p • {ex.questionIds.length} câu
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-[#3D3D2D] line-clamp-2" title={ex.title}>
                    {ex.title}
                  </h4>
                </div>

                <button
                  onClick={() => onStartExam(ex.id)}
                  className="w-full py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <span>Làm bài thi</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: LỊCH SỬ BÀI LÀM */}
        {detailTab === 'history' && (
          <div>
            {filteredAttempts.length === 0 ? (
              <div className="py-8 text-center bg-[#FAF9F6] rounded-2xl border border-dashed border-[#D9D2C5] space-y-2">
                <p className="text-xs font-bold text-[#3D3D2D]">Em chưa nộp bài thi nào môn {isMath ? 'Toán' : 'Tiếng Anh'}</p>
                <p className="text-[11px] text-[#8A8A70]">Sau khi nộp bài thi thử, toàn bộ điểm số và lời giải sẽ lưu tại đây.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in">
                {filteredAttempts.slice(0, 6).map((attempt, index) => (
                  <div
                    key={attempt.id || index}
                    onClick={() => setSelectedAttemptForReview(attempt)}
                    className="p-4 bg-[#FAF9F6] hover:bg-white rounded-2xl border border-[#EAE7E0] hover:border-[#1E3A8A] transition flex flex-col justify-between space-y-2 shadow-2xs cursor-pointer group"
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
                      <span>✓ {attempt.correctCount}/{attempt.totalQuestions} câu</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAttemptForReview(attempt);
                        }}
                        className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem giải</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NHIỆM VỤ ĐÃ DUYỆT */}
        {detailTab === 'completed_tasks' && completedTasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
            {completedTasks.map((t) => {
              const isConfirmed = t.status === 'confirmed' || (!t.status && t.completed);
              return (
                <div key={t.id} className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3D3D2D]">{t.title}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isConfirmed ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}
                    </span>
                  </div>
                  {t.adminFeedback && (
                    <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      💬 "{t.adminFeedback}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Detailed Student Attempt Review Modal */}
      <StudentAttemptReviewModal
        attempt={selectedAttemptForReview}
        onClose={() => setSelectedAttemptForReview(null)}
        onRetakeExam={onStartExam}
      />
    </div>
  );
};
