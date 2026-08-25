import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { MistakeItem, RemoteTaskAssignment, ExamAttempt } from '../../types';
import { getStoredRemoteTasks, subscribeToRemoteTasks, markRemoteTaskCompleted } from '../../services/realtimeSyncService';
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
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, getQuestionById, exams, allExams, switchSubject } = useApp();

  const isMath = currentSubject === 'math';
  const currentTopicsMeta = isMath ? MATH_TOPICS_META : TOPICS_META;
  const defaultExamId = isMath ? 'math_exam_official_01' : 'exam_official_01';

  // Remote assigned tasks state with real-time sync
  const [tasks, setTasks] = useState<RemoteTaskAssignment[]>(() => getStoredRemoteTasks());
  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<ExamAttempt | null>(null);

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

  // Remote assigned tasks for this student (Filter out completed tasks & deleted exams across all subjects)
  const pendingTasks = tasks.filter((t) => {
    if (t.completed) return false;
    if (t.recipientUserId !== 'all' && t.recipientUserId !== currentUser.id) return false;
    // If task is bound to an exam, ensure the exam is valid if allExams is populated
    if (t.assignedExamId && allExams && allExams.length > 0) {
      const examExists = allExams.some((e) => e.id === t.assignedExamId);
      if (!examExists) {
        // Fallback: check if it matches in exams
        const fallbackExists = (exams || []).some((e) => e.id === t.assignedExamId);
        if (!fallbackExists) return true; // keep visible so student isn't blocked from seeing assignment
      }
    }
    return true;
  });

  const handleDismissTask = (taskId: string) => {
    markRemoteTaskCompleted(taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)));
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
      {/* 2. NHIỆM VỤ ANH TRAI / GIÁO VIÊN GIAO (Nổi bật khi có bài) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {pendingTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-[2rem] shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xl">📌</span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Nhiệm vụ anh vừa giao cho bạn ({pendingTasks.length} bài)
                </h3>
                <p className="text-[11px] text-amber-100">Hoàn thành để được anh xem lại bài giải</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white/20 text-xs font-extrabold rounded-xl backdrop-blur-xs">
              Cần làm ngay
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {pendingTasks.map((t) => (
              <div
                key={t.id}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 text-xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between font-bold text-white mb-1">
                    <span className="truncate pr-2">{t.title}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="text-[10px] text-amber-200 font-normal">
                        {t.senderName || 'Người giám sát'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismissTask(t.id);
                        }}
                        className="p-1 hover:bg-white/20 rounded-md transition text-white/80 hover:text-white cursor-pointer"
                        title="Đánh dấu đã hoàn thành / Ẩn nhiệm vụ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white/90 text-[11px] italic line-clamp-2">"{t.message}"</p>
                </div>

                <button
                  onClick={() => {
                    if (t.subject) switchSubject(t.subject);
                    if (t.assignedExamId) onStartExam(t.assignedExamId);
                    else if (t.assignedTopicId) onPracticeTopic(t.assignedTopicId);
                    else onStartExam(defaultExamId);
                  }}
                  className="w-full py-2 bg-white text-orange-800 font-extrabold text-xs rounded-xl hover:bg-orange-50 transition cursor-pointer flex items-center justify-center space-x-1 shadow-xs"
                >
                  <span>Bắt đầu làm ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
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
              className="w-full py-2 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1"
            >
              <span>🗂️ Flashcard {isMath ? 'công thức' : 'từ vựng'}</span>
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
                <p className="text-[11px] text-[#8A8A70]">
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
                    <span className="text-[10px] text-[#8A8A70]">
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
