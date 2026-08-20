import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { VOCABULARY_DATA, VOCAB_TOPICS } from '../data/vocabData';
import { MATH_FORMULA_CARDS } from '../data/mathFormulaCards';
import {
  Sparkles,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  Bookmark,
  Calculator,
  Lightbulb,
  AlertTriangle,
} from 'lucide-react';
import { VocabularyWord, MathFormulaCard } from '../types';

export const VocabFlashcardsView: React.FC = () => {
  const { currentSubject } = useApp();

  // English state
  const [selectedVocabTopicId, setSelectedVocabTopicId] = useState<string>(VOCAB_TOPICS[0].id);
  const [vocabIdx, setVocabIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [masteredItems, setMasteredItems] = useState<string[]>([]);

  // Math state
  const [selectedMathCategory, setSelectedMathCategory] = useState<string>('all');
  const [mathIdx, setMathIdx] = useState<number>(0);

  // Reset card state when subject changes
  useEffect(() => {
    setIsFlipped(false);
    setVocabIdx(0);
    setMathIdx(0);
  }, [currentSubject]);

  // English data
  const filteredWords: VocabularyWord[] =
    selectedVocabTopicId === 'all'
      ? VOCABULARY_DATA
      : VOCABULARY_DATA.filter((w) => {
          const selectedTopic = VOCAB_TOPICS.find((t) => t.id === selectedVocabTopicId);
          return selectedTopic ? w.unit === selectedTopic.unit : true;
        });

  const wordsToDisplay = filteredWords.length > 0 ? filteredWords : VOCABULARY_DATA;
  const currentWord: VocabularyWord = wordsToDisplay[vocabIdx] || wordsToDisplay[0];

  // Math data
  const filteredMathCards: MathFormulaCard[] =
    selectedMathCategory === 'all'
      ? MATH_FORMULA_CARDS
      : MATH_FORMULA_CARDS.filter((c) => c.category === selectedMathCategory);

  const mathCardsToDisplay = filteredMathCards.length > 0 ? filteredMathCards : MATH_FORMULA_CARDS;
  const currentMathCard: MathFormulaCard = mathCardsToDisplay[mathIdx] || mathCardsToDisplay[0];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentSubject === 'math') {
      setMathIdx((prev) => (prev + 1) % mathCardsToDisplay.length);
    } else {
      setVocabIdx((prev) => (prev + 1) % wordsToDisplay.length);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentSubject === 'math') {
      setMathIdx((prev) => (prev - 1 + mathCardsToDisplay.length) % mathCardsToDisplay.length);
    } else {
      setVocabIdx((prev) => (prev - 1 + wordsToDisplay.length) % wordsToDisplay.length);
    }
  };

  const toggleMastered = (id: string) => {
    setMasteredItems((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1. MATH FORMULA FLASHCARD VIEW
  if (currentSubject === 'math') {
    const isMathMastered = masteredItems.includes(currentMathCard?.id);

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
          <div className="max-w-2xl space-y-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              📐 Flashcard Công Thức Toán Lớp 9 - Tuyển Sinh Vào 10
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Thẻ Ghi Nhớ Công Thức & Mẹo Casio
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
              Ôn luyện nhanh công thức Vi-ét, BĐT Cauchy, Tứ giác nội tiếp, Hình không gian và cảnh báo bẫy thi cử.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả công thức' },
            { id: 'algebra', label: 'Đại số & Vi-ét' },
            { id: 'geometry', label: 'Hình học & Tứ giác' },
            { id: 'real_life', label: 'Hình không gian & Thực tế' },
            { id: 'calculus_ineq', label: 'Bất đẳng thức & Cực trị' },
          ].map((cat) => {
            const isSelected = cat.id === selectedMathCategory;
            const count =
              cat.id === 'all'
                ? MATH_FORMULA_CARDS.length
                : MATH_FORMULA_CARDS.filter((c) => c.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedMathCategory(cat.id);
                  setMathIdx(0);
                  setIsFlipped(false);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isSelected
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                    : 'bg-white border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Flashcard Component */}
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#8A8A70] px-2 font-medium">
            <span>
              Thẻ {mathIdx + 1} / {mathCardsToDisplay.length}
            </span>
            <span>
              Đã thuộc: {masteredItems.filter((id) => mathCardsToDisplay.some((x) => x.id === id)).length} /{' '}
              {mathCardsToDisplay.length}
            </span>
          </div>

          {/* The Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[340px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
          >
            {/* Top meta */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5] capitalize">
                {currentMathCard.category.replace('_', ' ')}
              </span>

              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => toggleMastered(currentMathCard.id)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isMathMastered
                      ? 'bg-[#8BA888] border-[#8BA888] text-white'
                      : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#8A8A70] hover:text-[#5A5A40]'
                  }`}
                  title="Đánh dấu đã thuộc"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Front / Back Card content */}
            {!isFlipped ? (
              <div className="text-center space-y-3 py-6">
                <span className="text-xs uppercase font-bold text-[#8A8A70]">Tên công thức / Định lý</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D3D2D]">
                  {currentMathCard.title}
                </h2>
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] font-mono text-sm sm:text-base font-bold text-[#5A5A40] whitespace-pre-line leading-relaxed shadow-2xs">
                  {currentMathCard.formula}
                </div>
                <p className="text-xs text-[#8BA888] font-semibold pt-2 flex items-center justify-center space-x-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấn để xem giải thích, mẹo Casio & cảnh báo bẫy</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2 animate-in fade-in zoom-in-95 duration-150 text-left">
                <div className="text-center pb-2 border-b border-[#F5F2ED]">
                  <h3 className="text-base font-extrabold text-[#5A5A40]">
                    {currentMathCard.title}
                  </h3>
                  <p className="text-xs text-[#4A4A4A] mt-1">{currentMathCard.shortDesc}</p>
                </div>

                {currentMathCard.casioTip && (
                  <div className="p-3.5 bg-[#EBF2EB] rounded-2xl border border-[#8BA888]/40 space-y-1 text-xs">
                    <div className="font-bold text-[#2C3E2D] flex items-center space-x-1.5">
                      <Calculator className="w-3.5 h-3.5 text-[#8BA888]" />
                      <span>Mẹo bấm máy tính Casio:</span>
                    </div>
                    <p className="text-[#3D3D2D] leading-relaxed">{currentMathCard.casioTip}</p>
                  </div>
                )}

                {currentMathCard.trapWarning && (
                  <div className="p-3.5 bg-[#FDF2E9] rounded-2xl border border-[#E67E22]/40 space-y-1 text-xs">
                    <div className="font-bold text-[#D35400] flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#E67E22]" />
                      <span>Cảnh báo bẫy phòng thi:</span>
                    </div>
                    <p className="text-[#4A4A4A] leading-relaxed">{currentMathCard.trapWarning}</p>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Flip Hint */}
            <div className="text-center text-[11px] text-[#8A8A70] pt-2 border-t border-[#F5F2ED]">
              {isFlipped ? 'Nhấn để lật lại công thức' : 'Nhấn bất kỳ đâu trên thẻ để lật'}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-2xl bg-white border border-[#EAE7E0] hover:bg-[#FAF9F6] text-[#4A4A4A] text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-4 py-2.5 rounded-2xl bg-[#E8E2D9] text-[#5A5A40] hover:bg-[#D9D2C5] text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Lật thẻ</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-2xl bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Thẻ tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ENGLISH VOCABULARY FLASHCARD VIEW
  const isEnglishMastered = masteredItems.includes(currentWord?.word);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div className="max-w-2xl space-y-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
            🇬🇧 Flashcard Từ Vựng Trọng Tâm Lớp 9 - Tuyển Sinh Vào 10
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Bộ Thẻ Từ Vựng & Cụm Từ Cốt Lõi
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            Học từ vựng theo phương pháp lật thẻ kèm phiên âm IPA, ngữ cảnh thực tế và phát âm chuẩn.
          </p>
        </div>
      </div>

      {/* Unit / Topic Selector Pills */}
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
        {VOCAB_TOPICS.map((topic) => {
          const isSelected = topic.id === selectedVocabTopicId;
          const count =
            topic.id === 'all'
              ? VOCABULARY_DATA.length
              : VOCABULARY_DATA.filter((w) => w.unit === topic.unit).length;

          return (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedVocabTopicId(topic.id);
                setVocabIdx(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer border ${
                isSelected
                  ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                  : 'bg-white border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
              }`}
            >
              {topic.nameVi} ({count} từ)
            </button>
          );
        })}
      </div>

      {/* Flashcard Component */}
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-xs text-[#8A8A70] px-2 font-medium">
          <span>
            Thẻ {vocabIdx + 1} / {wordsToDisplay.length}
          </span>
          <span>
            Đã thuộc: {masteredItems.filter((w) => wordsToDisplay.some((x) => x.word === w)).length} /{' '}
            {wordsToDisplay.length}
          </span>
        </div>

        {/* The Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative min-h-[340px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
        >
          {/* Top meta */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5]">
              {currentWord.partOfSpeech} • {currentWord.unit}
            </span>

            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => speakWord(currentWord.word)}
                className="p-2 rounded-xl bg-[#F5F2ED] text-[#5A5A40] hover:bg-[#E8E2D9] transition cursor-pointer"
                title="Phát âm từ này"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => toggleMastered(currentWord.word)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isEnglishMastered
                    ? 'bg-[#8BA888] border-[#8BA888] text-white'
                    : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#8A8A70] hover:text-[#5A5A40]'
                }`}
                title="Đánh dấu đã thuộc"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Front / Back Card content */}
          {!isFlipped ? (
            <div className="text-center space-y-3 py-6">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3D3D2D]">
                {currentWord.word}
              </h2>
              <p className="text-base sm:text-lg font-mono text-[#8A8A70]">
                {currentWord.ipa}
              </p>
              <p className="text-xs text-[#8BA888] font-semibold pt-4 flex items-center justify-center space-x-1">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Nhấn để xem nghĩa tiếng Việt & ví dụ</span>
              </p>
            </div>
          ) : (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="space-y-1">
                <span className="text-xs uppercase font-bold text-[#8A8A70]">Nghĩa tiếng Việt</span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#E67E22]">
                  {currentWord.meaningVi}
                </h3>
              </div>

              <div className="p-4 bg-[#F5F2ED] rounded-2xl border border-[#D9D2C5] text-left text-xs sm:text-sm text-[#4A4A4A] space-y-1.5">
                <p className="italic font-medium">"{currentWord.exampleEn}"</p>
                <p className="text-[#8A8A70] font-medium">→ {currentWord.exampleVi}</p>
              </div>

              {currentWord.collocations && currentWord.collocations.length > 0 && (
                <div className="text-xs text-[#5A5A40] font-medium">
                  <strong>Cụm thường gặp:</strong> {currentWord.collocations.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Bottom Flip Hint */}
          <div className="text-center text-[11px] text-[#8A8A70] pt-2 border-t border-[#F5F2ED]">
            {isFlipped ? 'Nhấn để lật lại mặt trước' : 'Nhấn bất kỳ đâu trên thẻ để lật'}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrev}
            className="px-5 py-2.5 rounded-2xl bg-white border border-[#EAE7E0] hover:bg-[#FAF9F6] text-[#4A4A4A] text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Từ trước</span>
          </button>

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="px-4 py-2.5 rounded-2xl bg-[#E8E2D9] text-[#5A5A40] hover:bg-[#D9D2C5] text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Lật thẻ</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-2xl bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Từ tiếp theo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
