import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamAttempt, Question } from '../../types';
import { ScorePill, SubjectBadge } from '../common';
import { AiQuestionExplainerModal } from '../common/AiQuestionExplainerModal';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  Bookmark,
  Sparkles,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Award,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

interface StudentAttemptReviewModalProps {
  attempt: ExamAttempt | null;
  onClose: () => void;
  onRetakeExam?: (examId: string) => void;
}

export const StudentAttemptReviewModal: React.FC<StudentAttemptReviewModalProps> = ({
  attempt,
  onClose,
  onRetakeExam,
}) => {
  const {
    questions,
    exams,
    allExams,
    getQuestionById,
    toggleBookmark,
    isBookmarked,
    getTeacherNote,
    currentUser,
  } = useApp();

  const [questionFilter, setQuestionFilter] = useState<'all' | 'wrong' | 'correct' | 'unattempted'>('all');
  const [explainingQuestion, setExplainingQuestion] = useState<{
    question: Question;
    userSelectedOption?: number;
  } | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!attempt) return null;

  const isMath = attempt.subject === 'math';
  const examBank = allExams || exams || [];
  const examObj = examBank.find((e) => e.id === attempt.examId);

  // Collect question list
  let reviewQuestions: Question[] = [];
  if (examObj && examObj.questionIds && examObj.questionIds.length > 0) {
    reviewQuestions = examObj.questionIds
      .map((qId) => getQuestionById(qId))
      .filter((q): q is Question => Boolean(q));
  }

  // Fallback: lookup from userAnswers keys
  if (reviewQuestions.length === 0 && attempt.userAnswers) {
    reviewQuestions = Object.keys(attempt.userAnswers)
      .map((qId) => getQuestionById(qId))
      .filter((q): q is Question => Boolean(q));
  }

  // Final fallback: questions of subject
  if (reviewQuestions.length === 0) {
    reviewQuestions = questions
      .filter((q) => (q.subject || 'english') === (attempt.subject || 'english'))
      .slice(0, attempt.totalQuestions || 10);
  }

  const totalQ = attempt.totalQuestions || reviewQuestions.length || 1;
  const correctQ = attempt.correctCount || 0;
  const wrongQ = attempt.incorrectCount || 0;
  const unattemptedQ =
    attempt.unattemptedCount !== undefined
      ? attempt.unattemptedCount
      : Math.max(0, totalQ - correctQ - wrongQ);
  const accuracy = Math.round((correctQ / totalQ) * 100);

  // Filter questions according to active tab
  const filteredQuestions = reviewQuestions.filter((q) => {
    const userChoice = attempt.userAnswers?.[q.id];
    const isAnswered = userChoice !== undefined && userChoice !== -1;
    const isCorrect = isAnswered && userChoice === q.correctOption;

    if (questionFilter === 'wrong') return isAnswered && !isCorrect;
    if (questionFilter === 'correct') return isCorrect;
    if (questionFilter === 'unattempted') return !isAnswered;
    return true;
  });

  const teacherNote = getTeacherNote(attempt.userId || currentUser.id);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-[#FAF9F6] rounded-[2.5rem] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D9D2C5] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#EAE7E0] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl ${
                isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]'
              } text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0`}
            >
              {isMath ? '📐' : '🇬🇧'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="font-extrabold text-[#3D3D2D] text-base sm:text-lg truncate">
                  {attempt.examTitle}
                </h3>
                <SubjectBadge subject={attempt.subject} />
              </div>
              <p className="text-xs text-[#8A8A70] truncate mt-0.5">
                Nộp bài: {new Date(attempt.date).toLocaleString('vi-VN')} • ID: {attempt.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#F5F2ED] hover:bg-[#EAE7E0] text-[#5A5A40] hover:text-[#3D3D2D] transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Ribbon */}
        <div className="bg-[#FAF9F6] p-4 sm:p-5 border-b border-[#EAE7E0] shrink-0 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Điểm số đạt được</span>
              <p className="text-xl sm:text-2xl font-black text-[#5A5A40]">
                {attempt.score.toFixed(2)} <span className="text-xs font-bold text-[#8A8A70]">/ 10đ</span>
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Độ chính xác</span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700">
                {accuracy}% <span className="text-xs font-bold text-emerald-600">({correctQ}/{totalQ} câu)</span>
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Số câu sai / bỏ qua</span>
              <p className="text-xl sm:text-2xl font-black text-red-600">
                {wrongQ + unattemptedQ} <span className="text-xs font-bold text-red-500">câu</span>
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-[#EAE7E0] shadow-2xs space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#8A8A70] block">Thời gian làm bài</span>
              <p className="text-xl sm:text-2xl font-black text-[#E67E22]">
                {Math.floor((attempt.timeSpentSeconds || 0) / 60)} <span className="text-xs font-bold">phút</span>{' '}
                {(attempt.timeSpentSeconds || 0) % 60}s
              </p>
            </div>
          </div>

          {/* Teacher feedback note banner if exists */}
          {teacherNote && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Lời dặn dò & Nhận xét của Thầy Cô / Anh Trai:</span>
              </div>
              <p className="italic text-[11px] leading-relaxed text-amber-950/90 pl-5">
                "{teacherNote}"
              </p>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex bg-[#E8E2D9] p-1 rounded-2xl max-w-lg text-xs font-bold overflow-x-auto no-scrollbar gap-1">
            <button
              onClick={() => setQuestionFilter('all')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                questionFilter === 'all'
                  ? 'bg-white text-[#3D3D2D] shadow-xs'
                  : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              Tất cả ({reviewQuestions.length})
            </button>
            <button
              onClick={() => setQuestionFilter('wrong')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
                questionFilter === 'wrong'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-red-700 hover:text-red-900'
              }`}
            >
              <span>❌ Làm sai ({wrongQ})</span>
            </button>
            <button
              onClick={() => setQuestionFilter('correct')}
              className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
                questionFilter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span>✅ Làm đúng ({correctQ})</span>
            </button>
            {unattemptedQ > 0 && (
              <button
                onClick={() => setQuestionFilter('unattempted')}
                className={`flex-1 py-1.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
                  questionFilter === 'unattempted'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700 hover:text-amber-900'
                }`}
              >
                <span>⚪ Chưa làm ({unattemptedQ})</span>
              </button>
            )}
          </div>
        </div>

        {/* Question Review Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE7E0] text-xs text-[#8A8A70] space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center mx-auto text-2xl">
                ✨
              </div>
              <p className="font-bold text-[#3D3D2D]">Không có câu hỏi nào trong bộ lọc này</p>
              <p>Hãy chọn "Tất cả" để xem lại toàn bộ đề thi.</p>
            </div>
          ) : (
            filteredQuestions.map((q, qIndex) => {
              const studentChoice = attempt.userAnswers?.[q.id];
              const isAnswered = studentChoice !== undefined && studentChoice !== -1;
              const isCorrect = isAnswered && studentChoice === q.correctOption;
              const bookmarked = isBookmarked(q.id);

              return (
                <div
                  key={q.id || qIndex}
                  className={`p-5 rounded-[2rem] border transition space-y-3.5 bg-white shadow-xs ${
                    isCorrect
                      ? 'border-emerald-200'
                      : isAnswered
                      ? 'border-red-200'
                      : 'border-amber-200'
                  }`}
                >
                  {/* Question Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#F5F2ED]">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-extrabold text-sm text-[#3D3D2D]">
                        Câu {qIndex + 1}
                      </span>
                      <span className="px-2.5 py-0.5 bg-[#FAF9F6] text-[#5A5A40] font-bold text-[10px] rounded-lg border border-[#EAE7E0]">
                        {q.topicId || 'Chuyên đề ôn thi'}
                      </span>
                      <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#8A8A70] text-[10px] rounded-lg">
                        {q.difficulty === 'easy'
                          ? 'Cơ bản'
                          : q.difficulty === 'medium'
                          ? 'Trung bình'
                          : q.difficulty === 'hard'
                          ? 'Khá'
                          : 'Phân loại'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCorrect ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đúng (+{(10 / totalQ).toFixed(2)}đ)</span>
                        </span>
                      ) : isAnswered ? (
                        <span className="px-3 py-1 bg-red-100 text-red-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-red-300">
                          <X className="w-3.5 h-3.5 text-red-600" />
                          <span>Chưa đúng (0đ)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl flex items-center space-x-1 border border-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chưa chọn đáp án</span>
                        </span>
                      )}

                      {/* Bookmark Button */}
                      <button
                        onClick={() => toggleBookmark(q.id)}
                        className={`p-1.5 rounded-xl border transition cursor-pointer ${
                          bookmarked
                            ? 'bg-amber-100 border-amber-300 text-amber-800'
                            : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#8A8A70] hover:text-[#3D3D2D]'
                        }`}
                        title={bookmarked ? 'Bỏ lưu câu hỏi' : 'Lưu câu hỏi này'}
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                      </button>

                      {/* AI Explainer Trigger Button */}
                      <button
                        onClick={() =>
                          setExplainingQuestion({
                            question: q,
                            userSelectedOption: studentChoice,
                          })
                        }
                        className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                        title="Hỏi AI phân tích & giải thích chi tiết câu này"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span className="hidden sm:inline">Hỏi AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Passage if any */}
                  {q.passage && (
                    <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs text-[#5A5A40] italic leading-relaxed whitespace-pre-wrap">
                      {q.passage}
                    </div>
                  )}

                  {/* Question Content */}
                  <div className="text-sm font-semibold text-[#3D3D2D] leading-relaxed whitespace-pre-wrap">
                    {q.content}
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt, optIdx) => {
                      const isSelectedByStudent = studentChoice === optIdx;
                      const isCorrectOpt = q.correctOption === optIdx;

                      let optStyle = 'bg-[#FAF9F6] border-[#EAE7E0] text-[#3D3D2D]';
                      let badge = null;

                      if (isSelectedByStudent && isCorrectOpt) {
                        optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-300/50';
                        badge = (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
                            <Check className="w-3 h-3" />
                            <span>Bạn chọn đúng</span>
                          </span>
                        );
                      } else if (isSelectedByStudent && !isCorrectOpt) {
                        optStyle = 'bg-red-50 border-red-400 text-red-900 font-bold ring-2 ring-red-300/50';
                        badge = (
                          <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-extrabold flex items-center space-x-1 shrink-0">
                            <X className="w-3 h-3" />
                            <span>Bạn chọn sai</span>
                          </span>
                        );
                      } else if (isCorrectOpt) {
                        optStyle = 'bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold';
                        badge = (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-extrabold shrink-0">
                            ✓ Đáp án đúng
                          </span>
                        );
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-2xl border text-xs transition flex items-start justify-between gap-2 ${optStyle}`}
                        >
                          <div className="flex items-start space-x-2 min-w-0">
                            <span className="font-extrabold text-[#5A5A40] shrink-0">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Explanation Box */}
                  {q.explanation && (
                    <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs space-y-1 mt-2">
                      <div className="flex items-center space-x-1.5 font-bold text-[#5A5A40]">
                        <BookOpen className="w-3.5 h-3.5 text-[#8BA888]" />
                        <span>Lời giải chi tiết & Phân tích bẫy sai:</span>
                      </div>
                      <p className="text-[#3D3D2D] leading-relaxed pl-5 whitespace-pre-wrap">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#EAE7E0] flex items-center justify-between shrink-0 gap-3">
          <div className="text-xs text-[#8A8A70] hidden sm:block">
            Đúng {correctQ}/{totalQ} câu • Điểm {attempt.score.toFixed(2)}/10đ
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            {onRetakeExam && attempt.examId && (
              <button
                onClick={() => {
                  onClose();
                  onRetakeExam(attempt.examId);
                }}
                className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#2563EB] text-white rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center space-x-1.5 shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại đề thi này</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#3D3D2D] rounded-xl text-xs font-bold transition cursor-pointer border border-[#D9D2C5]"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* AI Explainer Modal */}
      {explainingQuestion && (
        <AiQuestionExplainerModal
          question={explainingQuestion.question}
          userSelectedOption={explainingQuestion.userSelectedOption}
          onClose={() => setExplainingQuestion(null)}
        />
      )}
    </div>
  );
};
