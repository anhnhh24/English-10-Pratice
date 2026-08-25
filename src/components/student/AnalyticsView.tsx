import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { MistakeItem, ExamAttempt } from '../../types';
import { ScorePill, SubjectBadge } from '../common';
import { StudentAttemptReviewModal } from '../modals/StudentAttemptReviewModal';
import { formatRelativeTime } from '../../utils/formatters';
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
  Search,
  RotateCcw,
  Eye,
  FileText,
  Filter,
} from 'lucide-react';

interface AnalyticsViewProps {
  onOpenTargetModal?: () => void;
  onPracticeWeakness?: (topicId: string) => void;
  onPracticeTopic?: (topicId: string) => void;
  onStartExam?: (examId: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onPracticeWeakness,
  onPracticeTopic,
  onStartExam,
}) => {
  const { currentSubject, currentUser, examAttempts, mistakes, analytics, getQuestionById } = useApp();

  const [selectedAttemptForReview, setSelectedAttemptForReview] = useState<ExamAttempt | null>(null);
  const [historySubjectFilter, setHistorySubjectFilter] = useState<'all' | 'math' | 'english'>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyScoreFilter, setHistoryScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

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

  // Filtered Exam Attempts for History Section
  const filteredHistoryAttempts = examAttempts.filter((att) => {
    if (historySubjectFilter === 'math' && att.subject !== 'math') return false;
    if (historySubjectFilter === 'english' && (att.subject || 'english') !== 'english') return false;

    if (historyScoreFilter === 'high' && att.score < 8.0) return false;
    if (historyScoreFilter === 'medium' && (att.score < 6.5 || att.score >= 8.0)) return false;
    if (historyScoreFilter === 'low' && att.score >= 6.5) return false;

    if (historySearchQuery) {
      const q = historySearchQuery.toLowerCase();
      const matchTitle = (att.examTitle || '').toLowerCase().includes(q);
      if (!matchTitle) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Quick stats across all attempts
  const highestScore = examAttempts.length > 0 ? Math.max(...examAttempts.map((a) => a.score)) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
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

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📜 LỊCH SỬ CHI TIẾT CÁC BÀI THI & LƯỢT NỘP ĐỀ CỦA BẠN        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm space-y-6 animate-in fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#F5F2ED]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-lg shadow-2xs">
              📜
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-[#3D3D2D]">
                  Lịch Sử Bài Thi & Các Lượt Nộp Đề
                </h3>
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-extrabold rounded-full">
                  {examAttempts.length} bài
                </span>
              </div>
              <p className="text-xs text-[#8A8A70]">
                Xem lại chi tiết từng câu làm đúng/sai, lời giải và nhận xét của thầy cô
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-[#5A5A40]">
            <span className="px-3 py-1.5 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0]">
              Điểm cao nhất: <strong className="text-emerald-700">{highestScore > 0 ? `${highestScore.toFixed(2)}đ` : '--'}</strong>
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-[#FAF9F6] p-3 sm:p-4 rounded-2xl border border-[#EAE7E0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {/* Subject Filter */}
            <div className="flex bg-white p-1 rounded-xl border border-[#D9D2C5]">
              <button
                onClick={() => setHistorySubjectFilter('all')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  historySubjectFilter === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                }`}
              >
                Tất cả môn ({examAttempts.length})
              </button>
              <button
                onClick={() => setHistorySubjectFilter('math')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  historySubjectFilter === 'math' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#6B6B54]'
                }`}
              >
                📐 Toán ({examAttempts.filter((a) => a.subject === 'math').length})
              </button>
              <button
                onClick={() => setHistorySubjectFilter('english')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  historySubjectFilter === 'english' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
                }`}
              >
                🇬🇧 Tiếng Anh ({examAttempts.filter((a) => (a.subject || 'english') === 'english').length})
              </button>
            </div>

            {/* Score Tier Filter */}
            <select
              value={historyScoreFilter}
              onChange={(e) => setHistoryScoreFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-[#D9D2C5] rounded-xl text-xs text-[#3D3D2D] font-bold outline-hidden cursor-pointer"
            >
              <option value="all">🎯 Tất cả mức điểm</option>
              <option value="high">🟢 Điểm cao (8.0 - 10.0đ)</option>
              <option value="medium">🟡 Khá (6.5 - 7.9đ)</option>
              <option value="low">🔴 Cần cố gắng (&lt; 6.5đ)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Tìm đề thi đã làm..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
            />
          </div>
        </div>

        {/* Attempts List */}
        {filteredHistoryAttempts.length === 0 ? (
          <div className="p-10 text-center bg-[#FAF9F6] rounded-3xl border border-dashed border-[#D9D2C5] space-y-3">
            <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-2xs">
              📝
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#3D3D2D]">Chưa có bài thi nào phù hợp với bộ lọc</h4>
              <p className="text-xs text-[#64748B] mt-0.5">
                {examAttempts.length === 0
                  ? 'Bạn chưa làm bài thi thử nào. Hãy vào phòng thi thử để bắt đầu làm bài đầu tiên!'
                  : 'Không tìm thấy bài thi phù hợp với từ khóa hoặc bộ lọc đã chọn.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              {(historySubjectFilter !== 'all' || historyScoreFilter !== 'all' || historySearchQuery) && (
                <button
                  onClick={() => {
                    setHistorySubjectFilter('all');
                    setHistoryScoreFilter('all');
                    setHistorySearchQuery('');
                  }}
                  className="px-4 py-2 bg-white hover:bg-[#FAF9F6] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5] transition cursor-pointer shadow-2xs"
                >
                  🔄 Đặt lại tất cả bộ lọc
                </button>
              )}

              {onStartExam && (
                <button
                  onClick={() => onStartExam(currentSubject === 'math' ? 'math_exam_official_01' : 'exam_official_01')}
                  className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  🚀 Thi thử đề {currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'} ngay
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredHistoryAttempts.map((attempt, index) => {
              const totalQuestions = attempt.totalQuestions || 40;
              const accuracyPct = Math.round(((attempt.correctCount || 0) / (totalQuestions || 1)) * 100);

              return (
                <div
                  key={attempt.id || index}
                  onClick={() => setSelectedAttemptForReview(attempt)}
                  className="p-5 bg-[#FAF9F6] hover:bg-white border border-[#EAE7E0] hover:border-[#1E3A8A] rounded-[2rem] transition flex flex-col justify-between space-y-3.5 shadow-2xs cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl ${
                          attempt.subject === 'math' ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
                        } text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0`}
                      >
                        {attempt.subject === 'math' ? '📐' : '🇬🇧'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5 flex-wrap">
                          <SubjectBadge subject={attempt.subject} />
                          <span className="text-[10px] text-[#8A8A70]">
                            {formatRelativeTime(attempt.date)}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D] group-hover:text-[#1E3A8A] line-clamp-2 mt-0.5 transition" title={attempt.examTitle}>
                          {attempt.examTitle}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <ScorePill score={attempt.score} maxScore={10} />
                    </div>
                  </div>

                  {/* Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white/80 p-2.5 rounded-xl border border-[#EAE7E0]/60">
                    <div>
                      <span className="text-[10px] text-[#8A8A70] block">Chính xác</span>
                      <strong className="text-emerald-700 font-extrabold">{accuracyPct}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A8A70] block">Số câu đúng</span>
                      <strong className="text-[#3D3D2D]">{attempt.correctCount}/{totalQuestions}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8A8A70] block">Thời gian</span>
                      <strong className="text-[#E67E22]">
                        {Math.floor((attempt.timeSpentSeconds || 0) / 60)}p {(attempt.timeSpentSeconds || 0) % 60}s
                      </strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#EAE7E0]/60 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAttemptForReview(attempt);
                      }}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer border border-emerald-200"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Xem giải chi tiết</span>
                    </button>

                    {onStartExam && attempt.examId && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartExam(attempt.examId);
                        }}
                        className="px-3 py-1.5 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#1E3A8A] rounded-xl font-bold transition flex items-center space-x-1 cursor-pointer border border-[#D9D2C5]"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Làm lại đề</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

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

      {/* Student Attempt Review Modal */}
      <StudentAttemptReviewModal
        attempt={selectedAttemptForReview}
        onClose={() => setSelectedAttemptForReview(null)}
        onRetakeExam={onStartExam}
      />
    </div>
  );
};
