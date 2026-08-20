import React from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
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
  ArrowRight,
  Wand2,
  Calculator,
  Compass,
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
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, getQuestionById } = useApp();

  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;
  const defaultExamId = currentSubject === 'math' ? 'math_exam_official_01' : 'exam_official_01';
  const defaultPracticeTopic = currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar';

  const activeMistakes = (Object.values(mistakes) as MistakeItem[]).filter(
    (m) => !m.mastered && (m.subject || 'english') === currentSubject
  );
  const activeMistakesCount = activeMistakes.length;

  const currentSubjectTarget =
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore
      : currentUser.targetScoreEnglish || currentUser.targetScore;

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* 1. Header Greeting */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3D3D2D]">
              Chào {currentUser.name}! 👋
            </h2>
            <span className="px-2.5 py-0.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-full text-xs font-bold text-[#5A5A40]">
              {currentSubject === 'math' ? '📐 Môn Toán 10' : '🇬🇧 Môn Tiếng Anh 10'}
            </span>
          </div>
          <p className="text-[#8A8A70] text-xs sm:text-sm mt-1">
            {currentSubject === 'math' ? (
              <>
                Hôm nay chúng ta cần tập trung vào phần{' '}
                <span className="text-[#5A5A40] font-semibold underline decoration-[#8BA888]">
                  Phương trình bậc hai & Định lý Vi-ét
                </span>
                .
              </>
            ) : (
              <>
                Hôm nay chúng ta cần tập trung vào phần{' '}
                <span className="text-[#5A5A40] font-semibold underline decoration-[#8BA888]">
                  Mệnh đề quan hệ & Câu điều kiện
                </span>
                .
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs font-semibold text-[#5A5A40] shadow-2xs">
            <Flame className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
            <span>{currentUser.streakDays} ngày liên tiếp</span>
          </div>

          <button
            onClick={onOpenTargetModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#E8E2D9] border border-[#D9D2C5] rounded-2xl text-xs font-bold text-[#5A5A40] transition cursor-pointer shadow-2xs"
          >
            <Target className="w-4 h-4 text-[#8BA888]" />
            <span>
              Mục tiêu {currentSubject === 'math' ? 'Toán' : 'Anh'}: {currentSubjectTarget}đ
            </span>
          </button>
        </div>
      </header>

      {/* AI Exam Generator Feature Spotlight Banner */}
      <div className="bg-[#5A5A40] text-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-white/15 rounded-full text-[10px] sm:text-[11px] font-bold text-[#E8E2D9]">
            <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
            <span>
              AI Exam Generator: {currentSubject === 'math' ? 'Môn Toán Học 10' : 'Môn Tiếng Anh 10'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">
            {currentSubject === 'math'
              ? 'Tạo đề thi thử môn Toán vào 10 tùy chỉnh theo yêu cầu riêng'
              : 'Tạo đề thi tùy chỉnh theo yêu cầu riêng với Gemini AI'}
          </h3>
          <p className="text-xs text-[#DED8CE] max-w-xl leading-relaxed">
            {currentSubject === 'math'
              ? 'Tự chọn số câu, độ khó, chuyên đề Đại số, Hình học hoặc Bất đẳng thức. AI biên soạn đề chuẩn ma trận kèm lời giải chi tiết từng bước.'
              : 'Tự chọn số câu, độ khó, chuyên đề ngữ pháp hoặc tỉnh thành. AI sẽ tạo đề thi chuẩn kèm đáp án và lời giải chi tiết 100%.'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('ai_generator')}
          className="w-full sm:w-auto shrink-0 px-5 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold text-xs rounded-2xl transition shadow-sm flex items-center justify-center space-x-2 z-10 cursor-pointer"
        >
          <Wand2 className="w-4 h-4" />
          <span>Tạo đề AI ngay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Four Key Stat Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Questions Solved */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs uppercase font-bold text-[#8A8A70] mb-0.5">
              Câu {currentSubject === 'math' ? 'Toán' : 'Anh'} đã làm
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">{analytics.totalSolved}</h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#8BA888] font-semibold mt-1.5">
            +18% so với tuần trước
          </p>
        </div>

        {/* Card 2: Accuracy */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs uppercase font-bold text-[#8A8A70] mb-0.5">Độ chính xác</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">{analytics.overallAccuracy}%</h3>
          </div>
          <div className="w-full bg-[#F5F2ED] h-1.5 rounded-full mt-2 sm:mt-3 overflow-hidden">
            <div
              className="bg-[#E67E22] h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.overallAccuracy}%` }}
            />
          </div>
        </div>

        {/* Card 3: Streak */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <p className="text-[10px] sm:text-xs uppercase font-bold text-[#8A8A70] mb-0.5">Điểm dự đoán vào 10</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#5A5A40]">{analytics.predictedGrade10Score}đ</h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#8BA888] font-semibold mt-1.5">
            Mục tiêu: {currentSubjectTarget}đ
          </p>
        </div>

        {/* Card 4: Exam Attempts */}
        <div
          onClick={() => setActiveTab('mock_exam')}
          className="bg-[#5A5A40] p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] shadow-sm text-white flex flex-col justify-between cursor-pointer hover:bg-[#3D3D2D] transition"
        >
          <div>
            <p className="text-[10px] sm:text-xs uppercase font-bold text-white/70 mb-0.5">
              Đề {currentSubject === 'math' ? 'Toán' : 'Anh'} đã thi
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold">
              {examAttempts
                .filter((a) => (a.subject || 'english') === currentSubject)
                .length.toString()
                .padStart(2, '0')}
            </h3>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#E8E2D9] mt-1.5">
            Điểm TB: <strong>{analytics.averageExamScore.toFixed(1)}/10</strong>
          </p>
        </div>
      </section>

      {/* 3. Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <button
          onClick={() => onStartExam(defaultExamId)}
          className="p-3.5 sm:p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-2xl sm:rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mb-2.5 group-hover:bg-[#5A5A40] group-hover:text-white transition">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D] leading-tight">
            Thi thử Đề chuẩn
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#8A8A70] mt-0.5">
            {currentSubject === 'math' ? '12 câu / 60 phút' : '50 câu / 60 phút'}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('quick_blitz')}
          className="p-3.5 sm:p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-2xl sm:rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F5F2ED] text-[#E67E22] flex items-center justify-center mb-2.5 group-hover:bg-[#E67E22] group-hover:text-white transition">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D] leading-tight">
            Luyện Nhanh 10 câu
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#8A8A70] mt-0.5">
            {currentSubject === 'math' ? 'Phản xạ công thức' : 'Phản xạ ngẫu nhiên'}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className="p-3.5 sm:p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-2xl sm:rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F5F2ED] text-[#8BA888] flex items-center justify-center mb-2.5 group-hover:bg-[#8BA888] group-hover:text-white transition">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D] leading-tight">
            {currentSubject === 'math' ? 'Flashcard Công thức' : 'Flashcard Từ vựng'}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#8A8A70] mt-0.5">
            {currentSubject === 'math' ? 'Vi-ét, Hình, BĐT & Casio' : 'Unit 1-12 Lớp 9'}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('lessons')}
          className="p-3.5 sm:p-4 bg-white hover:bg-[#FAF9F6] border border-[#EAE7E0] hover:border-[#D9D2C5] rounded-2xl sm:rounded-[2rem] shadow-xs text-left transition cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mb-2.5 group-hover:bg-[#5A5A40] group-hover:text-white transition">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D] leading-tight">
            {currentSubject === 'math' ? 'Sổ tay Công thức' : 'Lý thuyết & Mẹo'}
          </h4>
          <p className="text-[10px] sm:text-[11px] text-[#8A8A70] mt-0.5">
            {currentSubject === 'math' ? 'Đại số & Hình học 9' : 'Công thức trọng tâm'}
          </p>
        </button>
      </div>

      {/* 4. Main 2-Column Section (Progress by Topic & Mistake Notebook Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Topic Mastery Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 shadow-xs border border-[#EAE7E0] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h4 className="text-base sm:text-lg font-bold text-[#3D3D2D]">
                Tiến độ theo chuyên đề môn {currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'}
              </h4>
              <button
                onClick={() => setActiveTab('topic_practice')}
                className="text-xs text-[#5A5A40] font-bold hover:underline cursor-pointer"
              >
                Xem tất cả chuyên đề
              </button>
            </div>

            <div className="space-y-3.5">
              {currentTopicsMeta.slice(0, 5).map((topic) => {
                const stat = analytics.topicStats[topic.id] || { solved: 0, accuracy: 0 };
                const pct = stat.accuracy || (currentSubject === 'math' ? 75 : 65);
                const barColor =
                  pct >= 80 ? 'bg-[#8BA888]' : pct >= 60 ? 'bg-[#E8C07D]' : 'bg-[#E67E22]';

                return (
                  <div key={topic.id} className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-[#4A4A4A]">{topic.nameVi}</span>
                      <span className="font-bold text-[#5A5A40]">{pct}%</span>
                    </div>
                    <div className="h-2.5 sm:h-3 bg-[#F5F2ED] rounded-full overflow-hidden">
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
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#F5F2ED]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#3D3D2D]">Gợi ý ôn luyện từ hệ thống</p>
                <p className="text-[11px] sm:text-xs text-[#8A8A70] italic">
                  {currentSubject === 'math'
                    ? 'Tập trung ôn Định lý Vi-ét và Tứ giác nội tiếp để nắm chắc 4.5 điểm thi vào 10'
                    : 'Dựa trên điểm số Mệnh đề quan hệ & Viết lại câu còn cần khắc phục'}
                </p>
              </div>
              <button
                onClick={() => onPracticeTopic(defaultPracticeTopic)}
                className="w-full sm:w-auto bg-[#5A5A40] hover:bg-[#3D3D2D] text-white px-5 sm:px-6 py-2.5 rounded-full text-xs font-bold shadow-xs transition cursor-pointer shrink-0 text-center"
              >
                Luyện tập ngay
              </button>
            </div>
          </div>
        </div>

        {/* Right Mistake Notebook Preview (1 col) */}
        <div className="bg-[#FAF9F6] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 border border-[#EAE7E0] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h4 className="text-sm sm:text-base lg:text-lg font-bold text-[#3D3D2D]">
                Sổ câu sai môn {currentSubject === 'math' ? 'Toán' : 'Anh'} ({activeMistakesCount})
              </h4>
              <button
                onClick={() => setActiveTab('mistakes')}
                className="text-xs text-[#E67E22] font-bold hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            {/* List of 3 sample mistakes */}
            <div className="space-y-2.5">
              {activeMistakes.length === 0 ? (
                <div className="p-4 sm:p-6 bg-white rounded-2xl border border-[#EAE7E0] text-center text-xs text-[#8A8A70]">
                  🎉 Tuyệt vời! Bạn không có câu sai môn {currentSubject === 'math' ? 'Toán' : 'Anh'}.
                </div>
              ) : (
                activeMistakes.slice(0, 3).map((item) => {
                  const q = getQuestionById(item.questionId);
                  if (!q) return null;
                  return (
                    <div
                      key={item.questionId}
                      onClick={() => setActiveTab('mistakes')}
                      className="p-3 sm:p-4 bg-white rounded-2xl border border-red-100 shadow-2xs hover:border-[#E67E22] transition cursor-pointer space-y-1"
                    >
                      <p className="text-[10px] text-[#E67E22] font-bold uppercase">
                        {q.topicId.replace('math_', '').replace(/_/g, ' ')} • Sai {item.wrongCount} lần
                      </p>
                      <p className="text-xs line-clamp-2 italic text-[#4A4A4A]">'{q.content}'</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* System status pill */}
          <div className="mt-2 bg-[#F2F0EB] p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#8BA888] rounded-full"></div>
              <span className="text-[10px] font-bold text-[#8A8A70] uppercase">
                {currentSubject === 'math' ? 'Đề Toán chuẩn 2026' : 'Đề Anh chuẩn 2026'}
              </span>
            </div>
            <button
              onClick={() => onStartExam(defaultExamId)}
              className="text-[10px] font-bold text-[#5A5A40] hover:underline cursor-pointer"
            >
              Làm ngay →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
