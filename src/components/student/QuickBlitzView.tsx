import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Question } from '../../types';
import { Zap, Clock, CheckCircle2, RotateCcw, Award, ChevronRight, Bookmark } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickBlitzViewProps {
  onBackToDashboard: () => void;
}

export const QuickBlitzView: React.FC<QuickBlitzViewProps> = ({ onBackToDashboard }) => {
  const { currentSubject, questions, recordAnswerResult, savePracticeSession, toggleBookmark, isBookmarked } =
    useApp();

  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [blitzQuestions, setBlitzQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(0);

  // Cleanly reset blitz session when subject changes
  React.useEffect(() => {
    setIsStarted(false);
    setIsFinished(false);
    setBlitzQuestions([]);
    setUserAnswers({});
    setCurrentIdx(0);
  }, [currentSubject]);

  const handleStartBlitz = () => {
    const subjectQuestions = questions.filter(
      (q) => (q.subject || 'english') === currentSubject
    );
    if (subjectQuestions.length === 0) {
      alert(`Hiện chưa có câu hỏi nào cho môn ${currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'}. Vui lòng tạo đề bằng AI hoặc thêm câu hỏi trước nhé!`);
      return;
    }
    const shuffled = [...subjectQuestions].sort(() => 0.5 - Math.random());
    const count = Math.min(10, shuffled.length);
    const picked = shuffled.slice(0, count);
    setBlitzQuestions(picked);
    setCurrentIdx(0);
    setUserAnswers({});
    setIsFinished(false);
    setIsStarted(true);
    setStartTime(Date.now());
  };

  const currentQ = blitzQuestions[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (!currentQ) return;
    const newAnswers = { ...userAnswers, [currentQ.id]: optIdx };
    setUserAnswers(newAnswers);

    const isCorrect = optIdx === currentQ.correctOption;
    recordAnswerResult(currentQ.id, isCorrect);

    setTimeout(() => {
      if (currentIdx < blitzQuestions.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        finishBlitz(newAnswers);
      }
    }, 300);
  };

  const finishBlitz = (finalAnswers: Record<string, number>) => {
    let correctCount = 0;
    blitzQuestions.forEach((q) => {
      if (finalAnswers[q.id] === q.correctOption) correctCount += 1;
    });

    const totalQ = blitzQuestions.length;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const scorePct = Math.round((correctCount / (totalQ || 1)) * 100);

    savePracticeSession({
      subject: currentSubject,
      type: 'quick_blitz',
      date: new Date().toISOString(),
      totalQuestions: totalQ,
      correctCount,
      scorePercent: scorePct,
      timeSpentSeconds: timeSpent,
      questionIds: blitzQuestions.map((q) => q.id),
      userAnswers: finalAnswers,
    });

    setIsFinished(true);
    if (scorePct >= 70) {
      confetti({ particleCount: 70, spread: 70 });
    }
  };

  // 1. INTRO
  if (!isStarted) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div className="bg-[#5A5A40] text-white rounded-[2.5rem] p-8 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto text-[#E8E2D9]">
            <Zap className="w-8 h-8 fill-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">
            Luyện Nhanh Phản Xạ ({currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'})
          </h2>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed max-w-md mx-auto">
            10 câu hỏi ngẫu nhiên được trích xuất từ tất cả các chuyên đề để rèn luyện phản xạ làm
            bài thi mỗi ngày.
          </p>

          <div className="pt-2">
            <button
              onClick={handleStartBlitz}
              id="btn-start-blitz"
              className="px-8 py-3.5 bg-white text-[#5A5A40] hover:bg-[#FAF9F6] font-bold rounded-full shadow-sm transition text-sm flex items-center space-x-2 mx-auto cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-[#5A5A40]" />
              <span>Bắt đầu Luyện Nhanh (10 câu)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE BLITZ
  if (isStarted && !isFinished && currentQ) {
    return (
      <div className="max-w-2xl mx-auto space-y-5 pb-12">
        <div className="bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs p-4 flex items-center justify-between">
          <span className="px-3 py-1 bg-[#E67E22] text-white font-bold text-xs rounded-xl">
            Câu {currentIdx + 1}/{blitzQuestions.length}
          </span>
          <span className="text-xs text-[#8A8A70] font-bold capitalize">
            {currentQ.topicId.replace('math_', '').replace(/_/g, ' ')}
          </span>
          <button
            onClick={() => toggleBookmark(currentQ.id)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              isBookmarked(currentQ.id)
                ? 'bg-[#FDF2E9] border-[#E67E22] text-[#E67E22]'
                : 'text-[#8A8A70] border-[#EAE7E0]'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked(currentQ.id) ? 'fill-[#E67E22]' : ''}`} />
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="text-base sm:text-lg font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
            {currentQ.content}
          </div>

          <div className="space-y-3">
            {currentQ.options.map((opt, idx) => {
              const isSelected = userAnswers[currentQ.id] === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#FDF2E9] border-[#E67E22] text-[#3D3D2D] font-bold ring-2 ring-[#E67E22]/20'
                      : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <span className="whitespace-pre-line">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 3. FINISHED
  if (isFinished) {
    let correctCount = 0;
    blitzQuestions.forEach((q) => {
      if (userAnswers[q.id] === q.correctOption) correctCount += 1;
    });

    return (
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-[2rem] bg-[#F5F2ED] text-[#5A5A40] flex items-center justify-center mx-auto border border-[#D9D2C5]">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#3D3D2D]">Hoàn Thành Luyện Nhanh!</h3>
          <p className="text-xs text-[#8A8A70] mt-1">Đã cộng chuỗi ngày học liên tục</p>
        </div>

        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8A8A70]">Số câu đúng:</span>
            <strong className="text-[#8BA888] font-bold">{correctCount}/{blitzQuestions.length} câu</strong>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleStartBlitz}
            className="w-full py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm thêm 1 lượt nữa</span>
          </button>
          <button
            onClick={onBackToDashboard}
            className="w-full py-3 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#4A4A4A] rounded-full text-xs font-bold transition cursor-pointer"
          >
            Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};
