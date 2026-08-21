import React from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
import { MistakeItem } from '../types';
import {
  Award,
  TrendingUp,
  Target,
  Clock,
  BookMarked,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BarChart2,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface AnalyticsViewProps {
  onOpenTargetModal?: () => void;
  onPracticeWeakness?: (topicId: string) => void;
  onPracticeTopic?: (topicId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onPracticeWeakness,
  onPracticeTopic,
}) => {
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, getQuestionById } = useApp();

  const handlePractice = onPracticeWeakness || onPracticeTopic || (() => {});
  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

  const subjectExamAttempts = examAttempts.filter((a) => (a.subject || 'english') === currentSubject);
  const activeMistakesCount = (Object.values(mistakes) as MistakeItem[]).filter((m) => {
    if (m.mastered) return false;
    const q = getQuestionById(m.questionId);
    return q && (q.subject || 'english') === currentSubject;
  }).length;

  const subjectTargetScore =
    currentSubject === 'math'
      ? currentUser.targetScoreMath || currentUser.targetScore
      : currentUser.targetScoreEnglish || currentUser.targetScore;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              Báo Cáo Năng Lực Học Tập: {currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Phân Tích & Dự Đoán Điểm Số Tuyển Sinh
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D2C5]">
              Dữ liệu học tập của học sinh <strong>{currentUser.name}</strong> ({currentUser.targetSchool}) được cập nhật thời gian thực theo từng môn thi.
            </p>
          </div>

          <div className="bg-[#FDFCFB] text-[#3D3D2D] p-5 rounded-[2rem] border border-[#D9D2C5] text-center shrink-0 min-w-[170px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#8A8A70]">
              Dự đoán Điểm Vào 10
            </p>
            <div className="text-4xl font-extrabold text-[#5A5A40] mt-0.5">
              {analytics.predictedGrade10Score > 0 ? `~${analytics.predictedGrade10Score.toFixed(1)}` : '--'}
            </div>
            <p className="text-[11px] text-[#8BA888] font-bold mt-0.5">
              Mục tiêu: {subjectTargetScore}/10
            </p>
          </div>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
          <div className="flex items-center space-x-2 text-[#8A8A70] text-xs font-bold uppercase mb-1">
            <CheckCircle2 className="w-4 h-4 text-[#8BA888]" />
            <span>Tổng câu đã giải</span>
          </div>
          <div className="text-2xl font-bold text-[#5A5A40]">{analytics.totalSolved} câu</div>
          <p className="text-[11px] text-[#8A8A70] mt-1">Đề thi & luyện chuyên đề</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
          <div className="flex items-center space-x-2 text-[#8A8A70] text-xs font-bold uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-[#E67E22]" />
            <span>Độ chính xác môn {currentSubject === 'math' ? 'Toán' : 'Anh'}</span>
          </div>
          <div className="text-2xl font-bold text-[#5A5A40]">{analytics.overallAccuracy}%</div>
          <div className="w-full bg-[#F5F2ED] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#E67E22] h-full rounded-full"
              style={{ width: `${analytics.overallAccuracy}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
          <div className="flex items-center space-x-2 text-[#8A8A70] text-xs font-bold uppercase mb-1">
            <Award className="w-4 h-4 text-[#5A5A40]" />
            <span>Điểm thi thử TB</span>
          </div>
          <div className="text-2xl font-bold text-[#5A5A40]">
            {analytics.averageExamScore > 0 ? `${analytics.averageExamScore.toFixed(1)}/10` : '--/10'}
          </div>
          <p className="text-[11px] text-[#8BA888] font-semibold mt-1">
            Qua {subjectExamAttempts.length} lượt làm bài
          </p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
          <div className="flex items-center space-x-2 text-[#8A8A70] text-xs font-bold uppercase mb-1">
            <BookMarked className="w-4 h-4 text-[#E67E22]" />
            <span>Câu sai chưa sửa</span>
          </div>
          <div className="text-2xl font-bold text-[#E67E22]">{activeMistakesCount} câu</div>
          <p className="text-[11px] text-[#8A8A70] mt-1">Cần ôn lại trong sổ câu sai</p>
        </div>
      </div>

      {/* Breakdown by Topic */}
      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#3D3D2D]">
              Ma Trận Năng Lực Từng Chuyên Đề ({currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'})
            </h3>
            <p className="text-xs text-[#8A8A70]">
              Tỷ lệ chính xác tương ứng với từng dạng bài trong cấu trúc đề thi tuyển sinh
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {currentTopicsMeta.map((topic) => {
            const stat = analytics.topicStats[topic.id] || { solved: 0, accuracy: 0 };
            const hasSolved = stat.solved > 0;
            const pct = hasSolved ? stat.accuracy : 0;
            const barColor =
              pct >= 80 ? 'bg-[#8BA888]' : pct >= 60 ? 'bg-[#E8C07D]' : 'bg-[#E67E22]';

            return (
              <div
                key={topic.id}
                className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-[#3D3D2D]">{topic.nameVi}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-white text-[#8A8A70] rounded-md border border-[#EAE7E0]">
                        {hasSolved ? `Đã làm ${stat.solved} câu` : 'Chưa luyện tập'}
                      </span>
                    </div>
                    <span className="font-extrabold text-[#5A5A40]">
                      {hasSolved ? `${pct}%` : '--'}
                    </span>
                  </div>

                  <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-[#EAE7E0]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => handlePractice(topic.id)}
                  className="px-4 py-2 bg-white hover:bg-[#5A5A40] hover:text-white border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] transition flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                >
                  <span>Luyện chuyên đề</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
