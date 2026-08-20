import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
import { Question, TopicId } from '../types';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  Bookmark,
  RotateCcw,
  ChevronRight,
  Award,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TopicPracticeViewProps {
  initialTopicId?: string;
  onBackToDashboard: () => void;
}

export const TopicPracticeView: React.FC<TopicPracticeViewProps> = ({
  initialTopicId,
  onBackToDashboard,
}) => {
  const { currentSubject, questions, recordAnswerResult, savePracticeSession, toggleBookmark, isBookmarked } =
    useApp();

  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;
  const defaultTopic: TopicId = currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar';

  const [selectedTopic, setSelectedTopic] = useState<TopicId>(
    (initialTopicId as TopicId) || defaultTopic
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Update selected topic when subject changes
  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopic(initialTopicId as TopicId);
    } else {
      setSelectedTopic(currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar');
    }
  }, [currentSubject, initialTopicId]);

  // Active practice session states
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Filter pool by topic, subject & difficulty
  const topicQuestionsPool = questions.filter((q) => {
    if ((q.subject || 'english') !== currentSubject) return false;
    if (q.topicId !== selectedTopic) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleStartPractice = () => {
    const shuffled = [...topicQuestionsPool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (picked.length === 0) {
      const allInTopic = questions.filter(
        (q) => (q.subject || 'english') === currentSubject && q.topicId === selectedTopic
      );
      picked.push(...allInTopic.slice(0, questionCount));
    }

    setPracticeQuestions(picked);
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedQuestions({});
    setIsFinished(false);
    setIsPracticing(true);
    setStartTime(Date.now());
  };

  const currentQ = practiceQuestions[currentIdx];
  const isCurrentChecked = currentQ ? checkedQuestions[currentQ.id] : false;
  const userChoice = currentQ ? userAnswers[currentQ.id] : undefined;

  const handleSelectOption = (optIdx: number) => {
    if (!currentQ || isCurrentChecked) return;
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }));
  };

  const handleCheckCurrentAnswer = () => {
    if (!currentQ || userChoice === undefined) return;
    const isCorrect = userChoice === currentQ.correctOption;
    recordAnswerResult(currentQ.id, isCorrect);
    setCheckedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
  };

  const handleNext = () => {
    if (currentIdx < practiceQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = () => {
    let correctCount = 0;
    practiceQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOption) correctCount += 1;
    });

    const totalQ = practiceQuestions.length;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const scorePct = Math.round((correctCount / totalQ) * 100);

    savePracticeSession({
      subject: currentSubject,
      type: 'topic',
      topicId: selectedTopic,
      date: new Date().toISOString(),
      totalQuestions: totalQ,
      correctCount,
      scorePercent: scorePct,
      timeSpentSeconds: timeSpent,
      questionIds: practiceQuestions.map((q) => q.id),
      userAnswers,
    });

    setIsFinished(true);
    if (scorePct >= 70) {
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  // 1. CONFIGURATION VIEW
  if (!isPracticing) {
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
              Luyện Chuyên Đề: {currentSubject === 'math' ? 'Môn Toán 10' : 'Môn Tiếng Anh 10'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8A70]">
              Chủ động lựa chọn nội dung kiến thức, độ khó và số lượng câu muốn ôn luyện
            </p>
          </div>
        </div>

        {/* Topic Grid Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase text-[#8A8A70] tracking-wider">
            1. Chọn Chuyên Đề Trọng Tâm:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentTopicsMeta.map((t) => {
              const isSelected = selectedTopic === t.id;
              const countInBank = questions.filter(
                (q) => (q.subject || 'english') === currentSubject && q.topicId === t.id
              ).length;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTopic(t.id)}
                  className={`p-4 rounded-[2rem] border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                      : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-[#F5F2ED] text-[#5A5A40]'
                        }`}
                      >
                        {t.weightInExam}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-[#D9D2C5]' : 'text-[#8A8A70]'
                        }`}
                      >
                        {countInBank} câu
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm leading-tight">{t.nameVi}</h4>
                  </div>
                  <p
                    className={`text-[11px] mt-2 line-clamp-2 ${
                      isSelected ? 'text-[#D9D2C5]' : 'text-[#8A8A70]'
                    }`}
                  >
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Options: Difficulty & Question Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm">
          <div>
            <label className="block text-xs font-bold text-[#3D3D2D] mb-2">
              2. Mức độ thử thách:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'all', label: 'Tất cả mức độ' },
                { id: 'easy', label: 'Nhận biết (Dễ)' },
                { id: 'medium', label: 'Thông hiểu (Vừa)' },
                { id: 'hard', label: 'Vận dụng (Khó)' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDifficulty(d.id)}
                  className={`p-2.5 rounded-2xl border font-semibold transition cursor-pointer ${
                    selectedDifficulty === d.id
                      ? 'bg-[#F5F2ED] border-[#5A5A40] text-[#5A5A40] font-bold'
                      : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3D3D2D] mb-2">
              3. Số lượng câu hỏi:
            </label>
            <div className="flex space-x-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`flex-1 py-2.5 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                    questionCount === num
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                      : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>

            <div className="mt-4 p-3.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs text-[#5A5A40]">
              Có <strong>{topicQuestionsPool.length}</strong> câu hỏi sẵn sàng trong ngân hàng đề.
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartPractice}
          id="btn-start-topic-practice"
          className="w-full py-4 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-[2rem] text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
        >
          <span>Bắt đầu Luyện tập ngay</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // 2. PRACTICE SESSION VIEW
  if (isPracticing && !isFinished && currentQ) {
    const isCorrect = userChoice === currentQ.correctOption;

    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-12">
        {/* Practice Top Header */}
        <div className="bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-[#5A5A40] text-white font-bold text-xs rounded-xl">
              Câu {currentIdx + 1}/{practiceQuestions.length}
            </span>
            <span className="text-xs font-bold text-[#3D3D2D] capitalize">
              {currentQ.topicId.replace('math_', '').replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => toggleBookmark(currentQ.id)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isBookmarked(currentQ.id)
                  ? 'bg-[#F5F2ED] border-[#5A5A40] text-[#5A5A40]'
                  : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#8A8A70]'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 ${isBookmarked(currentQ.id) ? 'fill-[#5A5A40]' : ''}`}
              />
            </button>
            <button
              onClick={() => setIsPracticing(false)}
              className="text-xs font-bold text-[#8A8A70] hover:text-[#3D3D2D] underline px-2 cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6">
          {currentQ.passage && (
            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs sm:text-sm text-[#4A4A4A] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {currentQ.passage}
            </div>
          )}

          <div className="text-base sm:text-lg font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
            {currentQ.content}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = userChoice === idx;
              const isOptionCorrect = idx === currentQ.correctOption;

              let style = 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]';
              if (isCurrentChecked) {
                if (isOptionCorrect) {
                  style =
                    'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold ring-2 ring-[#8BA888]/20';
                } else if (isSelected && !isOptionCorrect) {
                  style = 'bg-[#FDF2E9] border-[#E67E22] text-[#3D3D2D] line-through';
                }
              } else if (isSelected) {
                style =
                  'bg-[#F5F2ED] border-[#5A5A40] text-[#3D3D2D] ring-2 ring-[#5A5A40]/20 font-semibold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${style}`}
                >
                  <span className="whitespace-pre-line">{opt}</span>
                  {isCurrentChecked && isOptionCorrect && (
                    <CheckCircle2 className="w-5 h-5 text-[#8BA888] shrink-0" />
                  )}
                  {isCurrentChecked && isSelected && !isOptionCorrect && (
                    <XCircle className="w-5 h-5 text-[#E67E22] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box (Visible once checked) */}
          {isCurrentChecked && (
            <div
              className={`p-5 rounded-2xl border space-y-2 text-xs animate-in fade-in ${
                isCorrect
                  ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D]'
                  : 'bg-[#FDF2E9] border-[#E67E22] text-[#3D3D2D]'
              }`}
            >
              <div className="font-bold flex items-center space-x-1.5 text-sm">
                <BookOpen className="w-4 h-4" />
                <span>{isCorrect ? 'Chính xác! Lời giải:' : 'Chưa đúng! Lời giải chi tiết:'}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-line">{currentQ.explanation}</p>

              {currentQ.grammarRule && (
                <p className="p-2.5 bg-white/80 rounded-xl border border-[#D9D2C5] font-mono text-[11px] text-[#3D3D2D] whitespace-pre-line">
                  <strong>Công thức / Định lý:</strong> {currentQ.grammarRule}
                </p>
              )}

              {currentQ.commonMistakeTip && (
                <p className="text-[#E67E22] text-[11px] font-medium">💡 {currentQ.commonMistakeTip}</p>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4 border-t border-[#F5F2ED] flex items-center justify-end space-x-3">
            {!isCurrentChecked ? (
              <button
                onClick={handleCheckCurrentAnswer}
                disabled={userChoice === undefined}
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Kiểm tra đáp án
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{currentIdx < practiceQuestions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. FINISHED SUMMARY VIEW
  if (isFinished) {
    let correctCount = 0;
    practiceQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOption) correctCount += 1;
    });
    const totalQ = practiceQuestions.length;
    const pct = Math.round((correctCount / totalQ) * 100);

    return (
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-[2rem] bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mx-auto border border-[#D9D2C5]">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#3D3D2D]">Hoàn Thành Bài Luyện Tập!</h3>
          <p className="text-xs text-[#8A8A70]">
            Chuyên đề {currentTopicsMeta.find((t) => t.id === selectedTopic)?.nameVi}
          </p>
        </div>

        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8A8A70]">Số câu đúng:</span>
            <strong className="text-[#8BA888] font-bold">
              {correctCount}/{totalQ} câu
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8A8A70]">Tỷ lệ chính xác:</span>
            <strong className="text-[#5A5A40] font-bold">{pct}%</strong>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleStartPractice}
            className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Luyện thêm lượt khác</span>
          </button>
          <button
            onClick={() => setIsPracticing(false)}
            className="w-full py-3 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#4A4A4A] rounded-full text-xs font-bold transition cursor-pointer"
          >
            Đổi chuyên đề khác
          </button>
        </div>
      </div>
    );
  }

  return null;
};
