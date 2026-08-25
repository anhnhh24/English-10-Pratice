import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MATH_FORMULA_CARDS } from '../../data/mathFormulaCards';
import { VOCAB_CATEGORIES } from '../../data/vocabCuratedBank';
import { getTodayDateString } from '../../services/vocabService';
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
  Zap,
  HelpCircle,
  Award,
  Layers,
  Flame,
  Check,
  X,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord, MathFormulaCard } from '../../types';

export const VocabFlashcardsView: React.FC = () => {
  const {
    currentSubject,
    vocabularyWords,
    masteredVocabIds,
    toggleVocabMastered,
  } = useApp();

  // Mode: 'flashcard' | 'daily_today' | 'quiz'
  const [studyMode, setStudyMode] = useState<'flashcard' | 'daily_today' | 'quiz'>('flashcard');

  // English state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [vocabIdx, setVocabIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Math state
  const [selectedMathCategory, setSelectedMathCategory] = useState<string>('all');
  const [mathIdx, setMathIdx] = useState<number>(0);
  const [mathMastered, setMathMastered] = useState<string[]>([]);

  const todayStr = getTodayDateString();

  // Reset card state when subject or mode changes
  useEffect(() => {
    setIsFlipped(false);
    setVocabIdx(0);
    setMathIdx(0);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizFinished(false);
  }, [currentSubject, studyMode, selectedCategory, selectedDifficulty]);

  // Today's words
  const todayWords = useMemo(() => {
    return vocabularyWords.filter((w) => w.dailyBatch === todayStr);
  }, [vocabularyWords, todayStr]);

  // Filtered English words
  const filteredWords: VocabularyWord[] = useMemo(() => {
    if (studyMode === 'daily_today') {
      return todayWords.length > 0 ? todayWords : vocabularyWords.slice(0, 20);
    }

    return vocabularyWords.filter((w) => {
      if (selectedCategory !== 'all') {
        const cat = VOCAB_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat) {
          const matchUnit = w.unit.toLowerCase().includes(cat.unit.toLowerCase());
          const matchTheme = w.theme.toLowerCase().includes(cat.unit.toLowerCase());
          if (!matchUnit && !matchTheme) return false;
        }
      }

      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [vocabularyWords, studyMode, selectedCategory, selectedDifficulty, todayWords]);

  const wordsToDisplay = filteredWords.length > 0 ? filteredWords : vocabularyWords;
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
      const len = mathCardsToDisplay.length || 1;
      setMathIdx((prev) => (prev + 1) % len);
    } else {
      const len = wordsToDisplay.length || 1;
      setVocabIdx((prev) => (prev + 1) % len);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentSubject === 'math') {
      const len = mathCardsToDisplay.length || 1;
      setMathIdx((prev) => (prev - 1 + len) % len);
    } else {
      const len = wordsToDisplay.length || 1;
      setVocabIdx((prev) => (prev - 1 + len) % len);
    }
  };

  const toggleMathMastered = (id: string) => {
    setMathMastered((prev) =>
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

  // ─── QUIZ GENERATOR FOR CURRENT WORD ───
  const currentQuizItem = useMemo(() => {
    if (wordsToDisplay.length === 0) return null;
    const targetWord = wordsToDisplay[quizIdx] || wordsToDisplay[0];

    // Pick 3 wrong options
    const otherWords = vocabularyWords.filter((w) => w.id !== targetWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [
      targetWord.meaningVi,
      ...shuffledOthers.map((w) => w.meaningVi || 'Nghĩa khác'),
    ].sort(() => 0.5 - Math.random());

    const correctIndex = options.indexOf(targetWord.meaningVi);

    return {
      word: targetWord,
      options,
      correctIndex,
    };
  }, [wordsToDisplay, quizIdx, vocabularyWords]);

  const handleQuizAnswer = (optionIdx: number) => {
    if (quizSubmitted || !currentQuizItem) return;
    setQuizSelectedOption(optionIdx);
    setQuizSubmitted(true);

    if (optionIdx === currentQuizItem.correctIndex) {
      setQuizScore((prev) => prev + 1);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleQuizNext = () => {
    setQuizSubmitted(false);
    setQuizSelectedOption(null);
    if (quizIdx + 1 < wordsToDisplay.length) {
      setQuizIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // 1. MATH FORMULA FLASHCARD VIEW
  // ═════════════════════════════════════════════════════════════════
  if (currentSubject === 'math') {
    const isMathMastered = mathMastered.includes(currentMathCard?.id);

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="bg-[#1E3A8A] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
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
            { id: 'all', name: 'Tất cả dạng bài' },
            { id: 'algebra', name: 'Đại số & Vi-ét' },
            { id: 'geometry', name: 'Hình học & Tứ giác' },
            { id: 'real_life', name: 'Toán thực tế' },
            { id: 'calculus_ineq', name: 'BĐT & Cực trị' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedMathCategory(cat.id);
                setMathIdx(0);
                setIsFlipped(false);
              }}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer border ${
                selectedMathCategory === cat.id
                  ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-sm'
                  : 'bg-white border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Math Flashcard */}
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-2 font-medium">
            <span>
              Thẻ {mathIdx + 1} / {mathCardsToDisplay.length}
            </span>
            <span>
              Đã thuộc: {mathMastered.length} / {mathCardsToDisplay.length}
            </span>
          </div>

          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[360px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-[#F5F2ED] text-[#1E3A8A] text-xs font-bold rounded-xl border border-[#D9D2C5]">
                {currentMathCard.category.toUpperCase()}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMathMastered(currentMathCard.id);
                }}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isMathMastered
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#64748B] hover:text-[#3D3D2D]'
                }`}
                title="Đánh dấu đã thuộc"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>

            {!isFlipped ? (
              <div className="text-center space-y-4 py-6">
                <span className="text-xs uppercase font-bold text-[#64748B]">Tên công thức</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#3D3D2D]">
                  {currentMathCard.title}
                </h2>
                <div className="p-4 bg-[#F5F2ED] rounded-2xl border border-[#D9D2C5] text-lg sm:text-xl font-bold font-mono text-[#1E3A8A]">
                  {currentMathCard.formula}
                </div>
                <p className="text-xs text-emerald-700 font-semibold pt-2 flex items-center justify-center space-x-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấn để xem diễn giải, mẹo Casio & cảnh báo bẫy sai</span>
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-3 animate-in fade-in zoom-in-95 duration-150">
                <div>
                  <span className="text-xs uppercase font-bold text-[#64748B]">Ý nghĩa & Ứng dụng</span>
                  <p className="text-sm font-semibold text-[#3D3D2D] mt-1">{currentMathCard.shortDesc}</p>
                </div>

                {currentMathCard.casioTip && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-blue-900">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span>Mẹo bấm máy tính Casio:</span>
                    </div>
                    <p className="text-blue-950 leading-relaxed font-mono">{currentMathCard.casioTip}</p>
                  </div>
                )}

                {currentMathCard.trapWarning && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Cảnh báo bẫy trừ điểm:</span>
                    </div>
                    <p className="text-amber-950 leading-relaxed">{currentMathCard.trapWarning}</p>
                  </div>
                )}
              </div>
            )}

            <div className="text-center text-[11px] text-[#64748B] pt-2 border-t border-[#F5F2ED]">
              {isFlipped ? 'Nhấn để lật lại công thức' : 'Nhấn bất kỳ đâu trên thẻ để lật'}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-2xl bg-white border border-[#EAE7E0] hover:bg-[#FAF9F6] text-[#3D3D2D] text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Thẻ trước</span>
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="px-4 py-2.5 rounded-2xl bg-[#E8E2D9] text-[#1E3A8A] hover:bg-[#D9D2C5] text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Lật thẻ</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-2xl bg-[#1E3A8A] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Thẻ tiếp theo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════
  // 2. ENGLISH VOCABULARY FLASHCARD & DAILY LEARNING VIEW
  // ═════════════════════════════════════════════════════════════════
  const isEnglishMastered = masteredVocabIds.includes(currentWord?.id || currentWord?.word);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="max-w-2xl space-y-2">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              🇬🇧 Flashcard Từ Vựng Lớp 9 Ôn Thi Vào 10
            </span>
            {todayWords.length > 0 && (
              <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-extrabold flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>20 từ mới hôm nay đã sẵn sàng!</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Kho Thẻ Từ Vựng & Flashcards Hàng Ngày
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            Học từ vựng 12 Unit, Phrasal Verbs, Collocations và Idioms kèm phát âm giọng chuẩn, câu ví dụ thực tế và mini quiz kiểm tra trí nhớ.
          </p>
        </div>

        <div className="bg-[#FDFCFB] text-[#3D3D2D] p-4 rounded-2xl border border-[#D9D2C5] text-center shrink-0 min-w-[150px]">
          <span className="text-[10px] font-bold uppercase text-[#64748B] block">Đã thuộc</span>
          <p className="text-2xl font-black text-emerald-700">
            {masteredVocabIds.length} <span className="text-xs font-bold text-[#64748B]">/ {vocabularyWords.length} từ</span>
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs (Flashcard / Daily Today 20 Words / Mini Quiz) */}
      <div className="flex bg-[#E8E2D9] p-1 rounded-2xl max-w-md mx-auto text-xs font-bold gap-1 shadow-2xs">
        <button
          onClick={() => setStudyMode('flashcard')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            studyMode === 'flashcard' ? 'bg-white text-[#3D3D2D] shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Thẻ Flashcard ({vocabularyWords.length})</span>
        </button>

        <button
          onClick={() => setStudyMode('daily_today')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            studyMode === 'daily_today' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#5A5A40] hover:text-[#3D3D2D]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Gói 20 Từ Hôm Nay ({todayWords.length || 20})</span>
        </button>

        <button
          onClick={() => setStudyMode('quiz')}
          className={`flex-1 py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            studyMode === 'quiz' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#1E3A8A] hover:text-[#3D3D2D]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Mini Quiz Trắc Nghiệm</span>
        </button>
      </div>

      {/* Filter Toolbar (Only in Flashcard Mode) */}
      {studyMode === 'flashcard' && (
        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#EAE7E0] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-white border border-[#D9D2C5] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
            >
              <option value="all">📂 Tất cả Chủ đề / Unit ({vocabularyWords.length})</option>
              {VOCAB_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.nameVi}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="p-2 bg-white border border-[#D9D2C5] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
            >
              <option value="all">🎯 Tất cả mức độ</option>
              <option value="easy">🟢 Cơ bản (6 - 7.5đ)</option>
              <option value="medium">🟡 Khá - Giỏi (7.5 - 8.75đ)</option>
              <option value="hard">🔴 Nâng cao (9 - 10đ)</option>
            </select>
          </div>

          <span className="text-xs text-[#64748B]">
            Đang hiển thị <strong>{wordsToDisplay.length}</strong> từ vựng
          </span>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 1 & 2: 3D FLASHCARD VIEW                                 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode !== 'quiz' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-2 font-medium">
            <span>
              Thẻ {vocabIdx + 1} / {wordsToDisplay.length}
            </span>
            <span>
              Đã thuộc: {masteredVocabIds.filter((id) => wordsToDisplay.some((w) => w.id === id || w.word === id)).length} /{' '}
              {wordsToDisplay.length}
            </span>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[360px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-7 sm:p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
          >
            {/* Top meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5]">
                  {currentWord.partOfSpeech} • {currentWord.unit}
                </span>
                {currentWord.dailyBatch === todayStr && (
                  <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold rounded-md">
                    🎁 Gói hôm nay
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => speakWord(currentWord.word)}
                  className="p-2 rounded-xl bg-[#F5F2ED] text-[#5A5A40] hover:bg-blue-100 hover:text-blue-800 transition cursor-pointer"
                  title="Nghe phát âm chuẩn giọng bản xứ"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => toggleVocabMastered(currentWord.id || currentWord.word)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isEnglishMastered
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#64748B] hover:text-[#3D3D2D]'
                  }`}
                  title={isEnglishMastered ? 'Đã thuộc từ này' : 'Đánh dấu đã thuộc'}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Card Content Front/Back */}
            {!isFlipped ? (
              <div className="text-center space-y-3 py-6">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#3D3D2D]">
                  {currentWord.word}
                </h2>
                <p className="text-base sm:text-lg font-mono text-[#64748B]">
                  {currentWord.ipa}
                </p>
                <span
                  className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold ${
                    currentWord.difficulty === 'hard'
                      ? 'bg-red-100 text-red-800'
                      : currentWord.difficulty === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {currentWord.difficulty === 'hard'
                    ? 'Mục tiêu 9 - 10đ'
                    : currentWord.difficulty === 'medium'
                    ? 'Khá - Giỏi (7.5 - 8.75đ)'
                    : 'Cơ bản (6 - 7.5đ)'}
                </span>
                <p className="text-xs text-emerald-700 font-semibold pt-4 flex items-center justify-center space-x-1">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Nhấn để xem nghĩa tiếng Việt & câu ví dụ</span>
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4 py-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-bold text-[#64748B]">Nghĩa tiếng Việt</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#E67E22]">
                    {currentWord.meaningVi}
                  </h3>
                </div>

                {currentWord.exampleEn && (
                  <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] text-left text-xs sm:text-sm text-[#3D3D2D] space-y-1">
                    <p className="italic font-medium">"{currentWord.exampleEn}"</p>
                    {currentWord.exampleVi && (
                      <p className="text-[#64748B] font-medium">→ {currentWord.exampleVi}</p>
                    )}
                  </div>
                )}

                {currentWord.collocations && currentWord.collocations.length > 0 && (
                  <div className="text-xs text-[#5A5A40] font-medium">
                    <strong>Cụm thường gặp (Collocations):</strong> {currentWord.collocations.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Flip Hint */}
            <div className="text-center text-[11px] text-[#64748B] pt-2 border-t border-[#F5F2ED]">
              {isFlipped ? 'Nhấn để lật lại mặt trước' : 'Nhấn bất kỳ đâu trên thẻ để lật'}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              className="px-5 py-2.5 rounded-2xl bg-white border border-[#EAE7E0] hover:bg-[#FAF9F6] text-[#3D3D2D] text-xs sm:text-sm font-semibold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
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
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 3: VOCAB MINI QUIZ (TRẮC NGHIỆM 4 ĐÁP ÁN)                 */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'quiz' && (
        <div className="max-w-xl mx-auto space-y-4">
          {quizFinished ? (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto shadow-2xs">
                🏆
              </div>
              <h3 className="text-2xl font-extrabold text-[#3D3D2D]">Hoàn Thành Bài Kiểm Tra!</h3>
              <p className="text-sm text-[#64748B]">
                Bạn đã trả lời đúng <strong className="text-emerald-700">{quizScore}</strong> /{' '}
                {wordsToDisplay.length} câu hỏi từ vựng.
              </p>
              <button
                onClick={() => {
                  setQuizIdx(0);
                  setQuizScore(0);
                  setQuizSubmitted(false);
                  setQuizSelectedOption(null);
                  setQuizFinished(false);
                }}
                className="px-6 py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-xs"
              >
                Luyện tập lại từ đầu
              </button>
            </div>
          ) : currentQuizItem ? (
            <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <span className="text-xs font-bold text-[#64748B]">
                  Câu hỏi {quizIdx + 1} / {wordsToDisplay.length}
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  Điểm: {quizScore}
                </span>
              </div>

              <div className="text-center space-y-2 py-2">
                <span className="text-xs text-[#64748B] font-semibold">Chọn nghĩa tiếng Việt của từ:</span>
                <h3 className="text-3xl font-black text-[#3D3D2D]">{currentQuizItem.word.word}</h3>
                <p className="text-xs text-[#64748B] font-mono">{currentQuizItem.word.ipa}</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {currentQuizItem.options.map((opt, optIdx) => {
                  let style = 'bg-[#FAF9F6] border-[#EAE7E0] text-[#3D3D2D] hover:border-[#5A5A40]';
                  if (quizSubmitted) {
                    if (optIdx === currentQuizItem.correctIndex) {
                      style = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                    } else if (quizSelectedOption === optIdx) {
                      style = 'bg-red-100 border-red-500 text-red-900 font-bold';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleQuizAnswer(optIdx)}
                      disabled={quizSubmitted}
                      className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold transition text-left flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <span>
                        <strong className="mr-2">{String.fromCharCode(65 + optIdx)}.</strong>
                        {opt}
                      </span>
                      {quizSubmitted && optIdx === currentQuizItem.correctIndex && (
                        <Check className="w-4 h-4 text-emerald-700" />
                      )}
                      {quizSubmitted && quizSelectedOption === optIdx && optIdx !== currentQuizItem.correctIndex && (
                        <X className="w-4 h-4 text-red-700" />
                      )}
                    </button>
                  );
                })}
              </div>

              {quizSubmitted && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleQuizNext}
                    className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
