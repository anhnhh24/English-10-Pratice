import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
import { Question, MistakeItem } from '../types';
import {
  BookMarked,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Trash2,
  Check,
} from 'lucide-react';

interface MistakeNotebookViewProps {
  onOpenAiTutor?: (q: Question) => void;
}

export const MistakeNotebookView: React.FC<MistakeNotebookViewProps> = () => {
  const {
    currentSubject,
    currentUser,
    mistakes,
    getQuestionById,
    recordAnswerResult,
    toggleMistakeMastered,
    removeMistake,
    clearMasteredMistakes,
  } = useApp();

  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');

  // Re-practice mode
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceIdx, setPracticeIdx] = useState<number>(0);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  const mistakeList = (Object.values(mistakes) as MistakeItem[])
    .map((item) => {
      const q = getQuestionById(item.questionId);
      return { ...item, question: q };
    })
    .filter(
      (item) =>
        item.question !== undefined &&
        (item.question.subject || 'english') === currentSubject
    ) as Array<{
      questionId: string;
      wrongCount: number;
      lastAttemptDate: string;
      consecutiveCorrect: number;
      mastered: boolean;
      userNote?: string;
      question: Question;
    }>;

  const filteredMistakes = mistakeList.filter((item) => {
    if (selectedTopic !== 'all' && item.question.topicId !== selectedTopic) return false;
    if (filterStatus === 'unmastered' && item.mastered) return false;
    if (filterStatus === 'mastered' && !item.mastered) return false;
    return true;
  });

  const unmasteredCount = mistakeList.filter((m) => !m.mastered).length;
  const masteredCount = mistakeList.filter((m) => m.mastered).length;

  const questionsToPractice = filteredMistakes.map((m) => m.question);
  const currentPracticeQ: Question | undefined = questionsToPractice[practiceIdx];

  const handleStartPracticeRedo = () => {
    if (questionsToPractice.length === 0) return;
    setIsPracticing(true);
    setPracticeIdx(0);
    setChosenAnswer(null);
    setHasChecked(false);
  };

  const handleCheckPracticeAnswer = () => {
    if (chosenAnswer === null || !currentPracticeQ) return;
    const isCorrect = chosenAnswer === currentPracticeQ.correctOption;
    recordAnswerResult(currentPracticeQ.id, isCorrect);
    setHasChecked(true);
  };

  const handleNextPracticeQuestion = () => {
    if (practiceIdx < questionsToPractice.length - 1) {
      setPracticeIdx((prev) => prev + 1);
      setChosenAnswer(null);
      setHasChecked(false);
    } else {
      setIsPracticing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#5A5A40] text-white rounded-[2rem] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              <BookMarked className="w-3.5 h-3.5" />
              <span>Sổ tay thông minh ghi nhớ câu sai ({currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Sổ Câu Sai & Luyện Lại Lỗ Hổng
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
              Mỗi câu sai là một cơ hội để bạn ghi nhớ sâu hơn. Hãy làm lại cho đến khi trả lời đúng
              2 lần liên tiếp để biến điểm yếu thành điểm mạnh! Dữ liệu được lưu riêng cho tài khoản <strong>{currentUser.name}</strong>.
            </p>
          </div>

          <div className="bg-[#FDFCFB] text-[#3D3D2D] rounded-[2rem] p-5 border border-[#D9D2C5] text-center shrink-0 min-w-[170px]">
            <div className="text-[10px] text-[#8A8A70] uppercase tracking-wider font-bold">
              Câu cần khắc phục
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#E67E22] mt-0.5">
              {unmasteredCount}
            </div>
            <div className="text-xs text-[#8BA888] font-bold mt-1">
              Đã làm chủ: {masteredCount} câu
            </div>
          </div>
        </div>
      </div>

      {/* RE-PRACTICE INTERFACE */}
      {isPracticing && currentPracticeQ ? (
        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between pb-4 border-b border-[#F5F2ED]">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-[#E67E22] text-white text-xs font-bold rounded-xl">
                Luyện câu sai {practiceIdx + 1}/{questionsToPractice.length}
              </span>
              <span className="text-xs font-bold text-[#3D3D2D] capitalize">
                {currentPracticeQ.topicId.replace('math_', '').replace(/_/g, ' ')}
              </span>
            </div>

            <button
              onClick={() => setIsPracticing(false)}
              className="text-xs font-bold text-[#8A8A70] hover:text-[#3D3D2D] underline cursor-pointer"
            >
              Thoát luyện tập
            </button>
          </div>

          {currentPracticeQ.passage && (
            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs sm:text-sm text-[#4A4A4A] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {currentPracticeQ.passage}
            </div>
          )}

          <div className="text-base font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
            {currentPracticeQ.content}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentPracticeQ.options.map((opt, idx) => {
              const isSelected = chosenAnswer === idx;
              const isCorrectOpt = idx === currentPracticeQ.correctOption;

              let style = 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]';
              if (hasChecked) {
                if (isCorrectOpt) {
                  style =
                    'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold ring-2 ring-[#8BA888]/20';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'bg-[#FDF2E9] border-[#E67E22] text-[#3D3D2D] line-through';
                }
              } else if (isSelected) {
                style =
                  'bg-[#F5F2ED] border-[#5A5A40] text-[#3D3D2D] ring-2 ring-[#5A5A40]/20 font-semibold';
              }

              return (
                <button
                  key={idx}
                  onClick={() => !hasChecked && setChosenAnswer(idx)}
                  className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${style}`}
                >
                  <span className="whitespace-pre-line">{opt}</span>
                  {hasChecked && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-[#8BA888] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if checked */}
          {hasChecked && (
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] space-y-2 text-xs text-[#3D3D2D]">
              <div className="font-bold flex items-center space-x-1.5 text-[#5A5A40]">
                <BookOpen className="w-4 h-4" />
                <span>Giải thích cặn kẽ:</span>
              </div>
              <p className="leading-relaxed whitespace-pre-line">{currentPracticeQ.explanation}</p>
              {currentPracticeQ.grammarRule && (
                <p className="font-mono text-[11px] bg-white p-2.5 rounded-xl text-[#3D3D2D] border border-[#D9D2C5] whitespace-pre-line">
                  <strong>Công thức / Định lý:</strong> {currentPracticeQ.grammarRule}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-[#F5F2ED] flex items-center justify-end space-x-3">
            {!hasChecked ? (
              <button
                onClick={handleCheckPracticeAnswer}
                disabled={chosenAnswer === null}
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Kiểm tra đáp án
              </button>
            ) : (
              <button
                onClick={handleNextPracticeQuestion}
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {practiceIdx < questionsToPractice.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành ôn tập'}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* LIST OF MISTAKES */
        <div className="space-y-4">
          {/* Controls bar */}
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-[#F5F2ED] p-1 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setFilterStatus('unmastered')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    filterStatus === 'unmastered'
                      ? 'bg-[#E67E22] text-white shadow-xs'
                      : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                  }`}
                >
                  Chưa sửa ({unmasteredCount})
                </button>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                  }`}
                >
                  Tất cả ({mistakeList.length})
                </button>
                <button
                  onClick={() => setFilterStatus('mastered')}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                    filterStatus === 'mastered'
                      ? 'bg-[#8BA888] text-white shadow-xs'
                      : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                  }`}
                >
                  Đã làm chủ ({masteredCount})
                </button>
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs font-medium text-[#4A4A4A] outline-hidden cursor-pointer"
              >
                <option value="all">Tất cả chuyên đề</option>
                {currentTopicsMeta.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameVi}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {masteredCount > 0 && (
                <button
                  onClick={clearMasteredMistakes}
                  className="px-3 py-1.5 text-xs text-[#8A8A70] hover:text-[#E67E22] rounded-xl border border-[#EAE7E0] transition cursor-pointer"
                >
                  Dọn dẹp câu đã sửa
                </button>
              )}

              <button
                onClick={handleStartPracticeRedo}
                disabled={filteredMistakes.length === 0}
                className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Luyện lại {filteredMistakes.length} câu này</span>
              </button>
            </div>
          </div>

          {/* Cards of Mistakes */}
          {filteredMistakes.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-[2rem] bg-[#EBF2EB] text-[#8BA888] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-[#3D3D2D] text-base">Tuyệt vời! Không có câu sai nào</h3>
              <p className="text-xs text-[#8A8A70] max-w-sm mx-auto">
                Tất cả câu hỏi môn {currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'} bạn đều đã nắm chắc. Hãy thi thử hoặc luyện thêm đề mới!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMistakes.map(({ question: q, wrongCount, mastered }) => (
                <div
                  key={q.id}
                  className={`p-6 rounded-[2rem] bg-white border transition-all ${
                    mastered ? 'border-[#8BA888] bg-[#FAF9F6]' : 'border-[#EAE7E0] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-[#FDF2E9] text-[#E67E22] rounded-lg text-xs font-bold border border-[#E8C07D]">
                        Sai {wrongCount} lần
                      </span>
                      <span className="text-xs font-semibold text-[#8A8A70] capitalize">
                        {q.topicId.replace('math_', '').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => toggleMistakeMastered(q.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer flex items-center space-x-1 ${
                          mastered
                            ? 'bg-[#EBF2EB] border-[#8BA888] text-[#8BA888]'
                            : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54] hover:bg-[#E8E2D9]'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{mastered ? 'Đã làm chủ' : 'Đánh dấu đã hiểu'}</span>
                      </button>

                      <button
                        onClick={() => removeMistake(q.id)}
                        className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                        title="Xóa câu này khỏi sổ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
                    {q.content}
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                    {q.options.map((opt: string, oIdx: number) => {
                      const isCorrect = oIdx === q.correctOption;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between whitespace-pre-line ${
                            isCorrect
                              ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold'
                              : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && <Check className="w-4 h-4 text-[#8BA888] shrink-0 ml-1" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed explanation */}
                  <div className="mt-3 p-3.5 bg-[#FAF9F6] rounded-xl text-xs text-[#3D3D2D] space-y-1.5 border border-[#EAE7E0]">
                    <p className="leading-relaxed font-medium whitespace-pre-line">
                      <strong>Giải thích:</strong> {q.explanation}
                    </p>
                    {q.grammarRule && (
                      <p className="font-mono text-[11px] text-[#5A5A40] bg-white p-2 rounded-md border border-[#D9D2C5] whitespace-pre-line">
                        <strong>Công thức / Định lý:</strong> {q.grammarRule}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
