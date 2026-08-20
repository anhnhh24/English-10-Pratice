import React from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MistakeItem } from '../types';
import {
  GraduationCap,
  BookMarked,
  Zap,
  Target,
  Flame,
  Award,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { TabType } from './Navbar';

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
  const { currentUser, exams, examAttempts, mistakes, analytics, getQuestionById } = useApp();

  const activeMistakes = (Object.values(mistakes) as MistakeItem[]).filter((m) => !m.mastered);
  const activeMistakesCount = activeMistakes.length;
  const recentExams = examAttempts.slice(0, 3);

  // Score gap
  const scoreGap = (currentUser.targetScore - analytics.averageExamScore).toFixed(1);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Greeting (As in Natural Tones Design HTML) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#3D3D2D]">
            Chào {currentUser.name}! 👋
          </h2>
          <p className="text-[#8A8A70] text-sm mt-0.5">
            Hôm nay chúng ta cần tập trung vào phần{' '}
            <span className="text-[#5A5A40] font-semibold underline decoration-[#8BA888]">
              Mệnh đề quan hệ & Câu điều kiện
            </span>
            .
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs font-semibold text-[#5A5A40]">
            <Flame className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
            <span>{currentUser.streakDays} ngày liên tiếp</span>
          </div>

          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-2xl text-xs font-bold text-[#5A5A40] transition cursor-pointer"
          >
            <Target className="w-4 h-4 text-[#8BA888]" />
            <span>Mục tiêu: {currentUser.targetScore}đ</span>
          </button>
        </div>
      </header>

      {/* AI Exam Generator Feature Spotlight Banner */}
      <div className="bg-[#5A5A40] text-white p-6 rounded-[2.5rem] shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/15 rounded-full text-[11px] font-bold text-[#E8E2D9]">
            <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
            <span>Tính năng mới: AI Exam Generator</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            Tạo đề thi tùy chỉnh theo yêu cầu riêng với Gemini AI
          </h3>
          <p className="text-xs text-[#DED8CE] max-w-xl">
            Tự chọn số câu, độ khó, chuyên đề ngữ pháp hoặc tỉnh thành. AI sẽ tạo đề thi chuẩn kèm đáp án và lời giải chi tiết 100%.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('ai_generator')}
          className="shrink-0 px-5 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs rounded-2xl transition shadow-sm flex items-center space-x-2 z-10 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Tạo đề AI ngay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Four Key Stat Metric Cards (Natural Tones Design) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Questions Solved */}
        <div className="bg-white p-5 rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-[#8A8A70] mb-1">Câu đã làm</p>
            <h3 className="text-3xl font-bold text-[#5A5A40]">{analytics.totalSolved}</h3>
          </div>
          <p className="text-[11px] text-[#8BA888] font-semibold mt-2">
            +15% so với tuần trước
          </p>
        </div>

        {/* Card 2: Accuracy */}
        <div className="bg-white p-5 rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-[#8A8A70] mb-1">Độ chính xác</p>
            <h3 className="text-3xl font-bold text-[#5A5A40]">{analytics.overallAccuracy}%</h3>
          </div>
          <div className="w-full bg-[#F5F2ED] h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#E67E22] h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.overallAccuracy}%` }}
            />
          </div>
        </div>

        {/* Card 3: Streak */}
        <div className="bg-white p-5 rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-[#8A8A70] mb-1">Ngày liên tiếp</p>
            <h3 className="text-3xl font-bold text-[#5A5A40]">{currentUser.streakDays}</h3>
          </div>
          <p className="text-[11px] text-[#8BA888] font-semibold mt-2">Duy trì phong độ tốt!</p>
        </div>

        {/* Card 4: Exam Attempts (Highlighted Olive) */}
        <div
          onClick={() => setActiveTab('mock_exam')}
          className="bg-[#5A5A40] p-5 rounded-[2rem] shadow-sm text-white flex flex-col justify-between cursor-pointer hover:bg-[#3D3D2D] transition"
        >
          <div>
            <p className="text-xs uppercase font-bold text-white/70 mb-1">Lượt thi thử</p>
            <h3 className="text-3xl font-bold">{examAttempts.length.toString().padStart(2, '0')}</h3>
          </div>
          <p className="text-[11px] text-[#E8E2D9] mt-2">
            Điểm TB: <strong>{analytics.averageExamScore.toFixed(1)}/10</strong>
          </p>
        </div>
      </section>

      {/* 3. Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onStartExam('exam_official_01')}
          className="p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mb-3 group-hover:bg-[#5A5A40] group-hover:text-white transition">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D]">Thi thử Đề chuẩn</h4>
          <p className="text-[11px] text-[#8A8A70] mt-0.5">50 câu / 60 phút</p>
        </button>

        <button
          onClick={() => setActiveTab('quick_blitz')}
          className="p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#E67E22] flex items-center justify-center mb-3 group-hover:bg-[#E67E22] group-hover:text-white transition">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D]">Luyện Nhanh 10 câu</h4>
          <p className="text-[11px] text-[#8A8A70] mt-0.5">Phản xạ ngẫu nhiên</p>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className="p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#8BA888] flex items-center justify-center mb-3 group-hover:bg-[#8BA888] group-hover:text-white transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D]">Flashcard Từ vựng</h4>
          <p className="text-[11px] text-[#8A8A70] mt-0.5">Unit 1-12 Lớp 9</p>
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className="p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mb-3 group-hover:bg-[#5A5A40] group-hover:text-white transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D]">Lý thuyết & Mẹo</h4>
          <p className="text-[11px] text-[#8A8A70] mt-0.5">Công thức trọng tâm</p>
        </button>
      </div>

      {/* 4. Main 2-Column Section (Progress by Topic & Mistake Notebook Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Topic Mastery Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 sm:p-8 shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold text-[#3D3D2D]">Tiến độ theo chủ đề</h4>
              <button
                onClick={() => setActiveTab('topic_practice')}
                className="text-xs text-[#5A5A40] font-bold hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-4">
              {TOPICS_META.slice(0, 5).map((topic) => {
                const stat = analytics.topicStats[topic.id] || { solved: 0, accuracy: 0 };
                const pct = stat.accuracy || 45;
                const barColor =
                  pct >= 80 ? 'bg-[#8BA888]' : pct >= 60 ? 'bg-[#E8C07D]' : 'bg-[#E67E22]';

                return (
                  <div key={topic.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-[#4A4A4A]">{topic.nameVi}</span>
                      <span className="font-bold text-[#5A5A40]">{pct}%</span>
                    </div>
                    <div className="h-3 bg-[#F5F2ED] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remedial suggestion bottom banner */}
          <div className="mt-8 pt-6 border-t border-[#F5F2ED]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#3D3D2D]">Gợi ý từ hệ thống</p>
                <p className="text-xs text-[#8A8A70] italic">
                  Dựa trên điểm số Mệnh đề quan hệ & Viết lại câu còn cần khắc phục
                </p>
              </div>
              <button
                onClick={() => onPracticeTopic('grammar')}
                className="bg-[#5A5A40] hover:bg-[#3D3D2D] text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
              >
                Luyện tập ngay
              </button>
            </div>
          </div>
        </div>

        {/* Right Mistake Notebook Preview (1 col) */}
        <div className="bg-[#FAF9F6] rounded-[2.5rem] p-6 border border-[#EAE7E0] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base sm:text-lg font-bold text-[#3D3D2D]">
                Sổ câu sai ({activeMistakesCount})
              </h4>
              <button
                onClick={() => setActiveTab('mistakes')}
                className="text-xs text-[#E67E22] font-bold hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            {/* List of 3 sample mistakes */}
            <div className="space-y-3">
              {activeMistakes.length === 0 ? (
                <div className="p-6 bg-white rounded-2xl border border-[#EAE7E0] text-center text-xs text-[#8A8A70]">
                  🎉 Không có câu sai chưa sửa. Bạn đang làm rất tốt!
                </div>
              ) : (
                activeMistakes.slice(0, 3).map((item) => {
                  const q = getQuestionById(item.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={item.questionId}
                      onClick={() => setActiveTab('mistakes')}
                      className="p-4 bg-white rounded-2xl border border-red-100 shadow-2xs hover:border-[#E67E22] transition cursor-pointer space-y-1"
                    >
                      <p className="text-[10px] text-[#E67E22] font-bold uppercase">
                        {q.topicId.replace('_', ' ')} • Sai {item.wrongCount} lần
                      </p>
                      <p className="text-xs line-clamp-2 italic text-[#4A4A4A]">'{q.content}'</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* System status pill */}
          <div className="mt-4 bg-[#F2F0EB] p-3.5 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8BA888] rounded-full"></div>
              <span className="text-[10px] font-bold text-[#8A8A70] uppercase">
                Hệ thống đã cập nhật đề mới
              </span>
            </div>
            <button
              onClick={() => onStartExam('exam_official_01')}
              className="text-[10px] font-bold text-[#5A5A40] hover:underline"
            >
              Làm ngay →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
