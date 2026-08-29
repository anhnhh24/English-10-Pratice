import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MATH_FORMULA_CARDS } from '../../data/mathFormulaCards';
import { VOCAB_CATEGORIES } from '../../data/vocabCuratedBank';
import { getTodayDateString } from '../../services/vocabService';
import { getStoredApiKey, callGeminiApiWithFallback } from '../../services/aiExamService';
import {
  Sparkles,
  Volume2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  CheckCircle2,
  Star,
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
  Search,
  PenTool,
  Grid,
  Headphones,
  Shuffle,
  Clock,
  ArrowRight,
  Brain,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord, MathFormulaCard } from '../../types';

export const VocabFlashcardsView: React.FC = () => {
  const {
    currentSubject,
    vocabularyWords,
    masteredVocabIds,
    starredVocabIds = [],
    toggleVocabMastered,
    toggleVocabStarred,
  } = useApp();

  // Mode: 'flashcard' | 'cloze' | 'matching' | 'quiz' | 'dictation'
  const [studyMode, setStudyMode] = useState<'flashcard' | 'cloze' | 'matching' | 'quiz' | 'dictation'>('flashcard');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered' | 'starred' | 'daily'>('all');

  // Flashcard State
  const [vocabIdx, setVocabIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Mode 2: Context Cloze / Word Form Fill-in State
  const [clozeIdx, setClozeIdx] = useState<number>(0);
  const [clozeInput, setClozeInput] = useState<string>('');
  const [clozeChecked, setClozeChecked] = useState<boolean>(false);
  const [clozeIsCorrect, setClozeIsCorrect] = useState<boolean | null>(null);
  const [clozeRevealedChars, setClozeRevealedChars] = useState<number>(0);
  const [clozeScore, setClozeScore] = useState<number>(0);
  const [clozeFinished, setClozeFinished] = useState<boolean>(false);

  // Mode 3: Speed Matching Game State
  const [matchCards, setMatchCards] = useState<
    Array<{ id: string; text: string; wordId: string; type: 'en' | 'vi'; matched: boolean }>
  >([]);
  const [selectedMatchFirst, setSelectedMatchFirst] = useState<{ id: string; wordId: string; type: 'en' | 'vi' } | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [matchTimer, setMatchTimer] = useState<number>(0);
  const [matchGameOver, setMatchGameOver] = useState<boolean>(false);

  // Mode 4: Mini Quiz State
  const [quizIdx, setQuizIdx] = useState<number>(0);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Mode 5: Audio Dictation State
  const [dictationIdx, setDictationIdx] = useState<number>(0);
  const [dictationInput, setDictationInput] = useState<string>('');
  const [dictationChecked, setDictationChecked] = useState<boolean>(false);
  const [dictationIsCorrect, setDictationIsCorrect] = useState<boolean | null>(null);
  const [dictationScore, setDictationScore] = useState<number>(0);
  const [dictationFinished, setDictationFinished] = useState<boolean>(false);

  // Math State
  const [selectedMathCategory, setSelectedMathCategory] = useState<string>('all');
  const [mathIdx, setMathIdx] = useState<number>(0);
  const [mathMastered, setMathMastered] = useState<string[]>([]);
  const [mathStudyMode, setMathStudyMode] = useState<'flashcard' | 'quiz'>('flashcard');
  const [mathQuizIdx, setMathQuizIdx] = useState<number>(0);
  const [mathQuizScore, setMathQuizScore] = useState<number>(0);
  const [mathQuizSelected, setMathQuizSelected] = useState<number | null>(null);
  const [mathQuizChecked, setMathQuizChecked] = useState<boolean>(false);

  // AI Exam Sentences Modal State
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiModalWord, setAiModalWord] = useState<VocabularyWord | null>(null);
  const [aiGeneratedExamQuestions, setAiGeneratedExamQuestions] = useState<
    Array<{ question: string; options: string[]; correctIdx: number; explanation: string }>
  >([]);
  const [aiModalLoading, setAiModalLoading] = useState<boolean>(false);

  const todayStr = getTodayDateString();

  // Reset indices on mode or filter changes
  useEffect(() => {
    setIsFlipped(false);
    setVocabIdx(0);
    setClozeIdx(0);
    setClozeInput('');
    setClozeChecked(false);
    setClozeIsCorrect(null);
    setClozeRevealedChars(0);
    setClozeScore(0);
    setClozeFinished(false);

    setQuizIdx(0);
    setQuizScore(0);
    setQuizSelectedOption(null);
    setQuizSubmitted(false);
    setQuizFinished(false);

    setDictationIdx(0);
    setDictationInput('');
    setDictationChecked(false);
    setDictationIsCorrect(null);
    setDictationScore(0);
    setDictationFinished(false);
  }, [currentSubject, studyMode, selectedCategory, selectedDifficulty, filterStatus]);

  // Today's words
  const todayWords = useMemo(() => {
    return vocabularyWords.filter((w) => w.dailyBatch === todayStr);
  }, [vocabularyWords, todayStr]);

  // Filtered English words
  const filteredWords: VocabularyWord[] = useMemo(() => {
    return vocabularyWords.filter((w) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchW = w.word.toLowerCase().includes(query);
        const matchM = (w.meaningVi || '').toLowerCase().includes(query);
        const matchU = (w.unit || '').toLowerCase().includes(query);
        if (!matchW && !matchM && !matchU) return false;
      }

      // Status filter
      if (filterStatus === 'daily') {
        return w.dailyBatch === todayStr;
      }
      if (filterStatus === 'mastered') {
        return masteredVocabIds.includes(w.id) || masteredVocabIds.includes(w.word);
      }
      if (filterStatus === 'unmastered') {
        return !masteredVocabIds.includes(w.id) && !masteredVocabIds.includes(w.word);
      }
      if (filterStatus === 'starred') {
        return starredVocabIds.includes(w.id) || starredVocabIds.includes(w.word);
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const cat = VOCAB_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat) {
          const matchUnit = w.unit.toLowerCase().includes(cat.unit.toLowerCase());
          const matchTheme = w.theme.toLowerCase().includes(cat.unit.toLowerCase());
          if (!matchUnit && !matchTheme) return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) {
        return false;
      }

      return true;
    });
  }, [vocabularyWords, searchQuery, selectedCategory, selectedDifficulty, filterStatus, todayWords, masteredVocabIds, starredVocabIds, todayStr]);

  const wordsToDisplay = filteredWords.length > 0 ? filteredWords : vocabularyWords;
  const currentWord: VocabularyWord = wordsToDisplay[vocabIdx] || wordsToDisplay[0];

  // ─── AUDIO PRONUNCIATION (SpeechSynthesis) ───
  const speakWord = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ─── KEYBOARD SHORTCUTS FOR FLASHCARD MODE ───
  useEffect(() => {
    if (studyMode !== 'flashcard' || currentSubject === 'math') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 's' || e.key === 'S') {
        if (currentWord) speakWord(currentWord.word);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, currentSubject, currentWord, wordsToDisplay.length]);

  // Flashcard Navigation
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

  // ─── MODE 2: CONTEXT CLOZE HANDLERS ───
  const currentClozeWord = wordsToDisplay[clozeIdx] || wordsToDisplay[0];

  // Helper to extract cloze sentence
  const clozeSentence = useMemo(() => {
    if (!currentClozeWord || !currentClozeWord.exampleEn) {
      return { masked: 'The student learns new _______ every day.', target: currentClozeWord?.word || '' };
    }
    const target = currentClozeWord.word.trim();
    // Case-insensitive regex to replace target word with blank
    const regex = new RegExp(`\\b${target}\\b`, 'gi');
    let masked = currentClozeWord.exampleEn.replace(regex, '_______');
    if (!masked.includes('_______')) {
      // If exact word boundary didn't match, replace substring
      masked = currentClozeWord.exampleEn.replace(new RegExp(target, 'gi'), '_______');
    }
    return { masked, target };
  }, [currentClozeWord]);

  const handleCheckCloze = () => {
    if (!clozeInput.trim() || clozeChecked) return;
    const cleanInput = clozeInput.trim().toLowerCase();
    const cleanTarget = clozeSentence.target.trim().toLowerCase();
    const isRight = cleanInput === cleanTarget;

    setClozeChecked(true);
    setClozeIsCorrect(isRight);

    if (isRight) {
      setClozeScore((prev) => prev + 1);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      speakWord(currentClozeWord.word);
    }
  };

  const handleNextCloze = () => {
    setClozeChecked(false);
    setClozeIsCorrect(null);
    setClozeInput('');
    setClozeRevealedChars(0);
    if (clozeIdx + 1 < wordsToDisplay.length) {
      setClozeIdx((prev) => prev + 1);
    } else {
      setClozeFinished(true);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    }
  };

  const handleRevealChar = () => {
    const target = clozeSentence.target;
    if (clozeRevealedChars < target.length) {
      setClozeRevealedChars((prev) => prev + 1);
      setClozeInput(target.slice(0, clozeRevealedChars + 1));
    }
  };

  // ─── MODE 3: SPEED MATCHING GAME INITIALIZATION ───
  const initMatchingGame = () => {
    const pool = [...wordsToDisplay].sort(() => 0.5 - Math.random()).slice(0, 6);
    const tiles: Array<{ id: string; text: string; wordId: string; type: 'en' | 'vi'; matched: boolean }> = [];

    pool.forEach((w) => {
      tiles.push({
        id: `en_${w.id}_${Math.random()}`,
        text: w.word,
        wordId: w.id,
        type: 'en',
        matched: false,
      });
      tiles.push({
        id: `vi_${w.id}_${Math.random()}`,
        text: w.meaningVi,
        wordId: w.id,
        type: 'vi',
        matched: false,
      });
    });

    setMatchCards(tiles.sort(() => 0.5 - Math.random()));
    setSelectedMatchFirst(null);
    setMatchScore(0);
    setMatchTimer(0);
    setMatchGameOver(false);
  };

  useEffect(() => {
    if (studyMode === 'matching') {
      initMatchingGame();
    }
  }, [studyMode, wordsToDisplay]);

  // Matching game timer
  useEffect(() => {
    if (studyMode !== 'matching' || matchGameOver) return;
    const interval = setInterval(() => {
      setMatchTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [studyMode, matchGameOver]);

  const handleTileClick = (tile: { id: string; text: string; wordId: string; type: 'en' | 'vi'; matched: boolean }) => {
    if (tile.matched) return;

    if (!selectedMatchFirst) {
      setSelectedMatchFirst(tile);
    } else {
      if (selectedMatchFirst.id === tile.id) {
        setSelectedMatchFirst(null);
        return;
      }

      // Check if matching pair
      if (selectedMatchFirst.wordId === tile.wordId && selectedMatchFirst.type !== tile.type) {
        // MATCHED!
        setMatchCards((prev) =>
          prev.map((c) => (c.wordId === tile.wordId ? { ...c, matched: true } : c))
        );
        setMatchScore((prev) => prev + 10);
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        setSelectedMatchFirst(null);

        // Check if all matched
        const remaining = matchCards.filter((c) => !c.matched && c.wordId !== tile.wordId);
        if (remaining.length === 0) {
          setMatchGameOver(true);
          confetti({ particleCount: 90, spread: 100, origin: { y: 0.5 } });
        }
      } else {
        // MISMATCH
        setSelectedMatchFirst(null);
      }
    }
  };

  // ─── MODE 4: MINI QUIZ HANDLERS ───
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
      speakWord(currentQuizItem.word.word);
    }
  };

  const handleQuizNext = () => {
    setQuizSubmitted(false);
    setQuizSelectedOption(null);
    if (quizIdx + 1 < wordsToDisplay.length) {
      setQuizIdx((prev) => prev + 1);
    } else {
      setQuizFinished(true);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    }
  };

  // ─── MODE 5: AUDIO DICTATION HANDLERS ───
  const currentDictationWord = wordsToDisplay[dictationIdx] || wordsToDisplay[0];

  const handleCheckDictation = () => {
    if (!dictationInput.trim() || dictationChecked) return;
    const isRight = dictationInput.trim().toLowerCase() === currentDictationWord.word.trim().toLowerCase();
    setDictationChecked(true);
    setDictationIsCorrect(isRight);

    if (isRight) {
      setDictationScore((prev) => prev + 1);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleNextDictation = () => {
    setDictationChecked(false);
    setDictationIsCorrect(null);
    setDictationInput('');
    if (dictationIdx + 1 < wordsToDisplay.length) {
      setDictationIdx((prev) => prev + 1);
    } else {
      setDictationFinished(true);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    }
  };

  // ─── AI EXAM QUESTIONS GENERATOR MODAL ───
  const handleOpenAiExamGen = async (w: VocabularyWord) => {
    setAiModalWord(w);
    setAiModalOpen(true);
    setAiModalLoading(true);
    setAiGeneratedExamQuestions([]);

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setAiGeneratedExamQuestions([
        {
          question: `Choose the correct word to complete: "The artisan used traditional techniques to _______ exquisite silk."`,
          options: [w.word, 'destroy', 'ignore', 'forget'],
          correctIdx: 0,
          explanation: `Từ "${w.word}" (${w.meaningVi}) là đáp án chính xác nhất trong ngữ cảnh này.`,
        },
      ]);
      setAiModalLoading(false);
      return;
    }

    const prompt = `Bạn là chuyên gia biên soạn đề thi Tuyển sinh vào Lớp 10 môn Tiếng Anh.
Hãy tạo đúng 3 câu hỏi trắc nghiệm THỰC CHIẾN (chuẩn ma trận đề thi vào 10 tại Hà Nội/TP.HCM/Toàn quốc) SỬ DỤNG TỪ VỰNG SAU:
- Từ vựng: "${w.word}" (${w.partOfSpeech} - ${w.meaningVi})
- Chủ đề: ${w.unit} (${w.theme})
- Cụm từ đi kèm: ${(w.collocations || []).join(', ')}

ĐỊNH DẠNG TRẢ VỀ:
Trả về DUY NHẤT một JSON Array hợp lệ:
[
  {
    "question": "Nội dung câu hỏi đề thi vào 10 có chỗ trống...",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "correctIdx": 0,
    "explanation": "Giải thích chi tiết vì sao chọn từ này trong đề thi..."
  }
]`;

    try {
      const { text } = await callGeminiApiWithFallback(apiKey, 'gemini-3.6-flash', {
        contents: [{ parts: [{ text: prompt }] }],
      });
      const clean = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setAiGeneratedExamQuestions(parsed);
      }
    } catch (err) {
      console.warn('AI vocab exam gen error:', err);
      setAiGeneratedExamQuestions([
        {
          question: `Complete the sentence: "Many tourists visit the village to admire the _______ pottery."`,
          options: [w.word, 'careless', 'polluted', 'impossible'],
          correctIdx: 0,
          explanation: `"${w.word}" mang ý nghĩa phù hợp nhất với cấu trúc câu.`,
        },
      ]);
    } finally {
      setAiModalLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // 1. MATH FORMULA FLASHCARD & QUIZ VIEW
  // ═════════════════════════════════════════════════════════════════
  const filteredMathCards: MathFormulaCard[] =
    selectedMathCategory === 'all'
      ? MATH_FORMULA_CARDS
      : MATH_FORMULA_CARDS.filter((c) => c.category === selectedMathCategory);

  const mathCardsToDisplay = filteredMathCards.length > 0 ? filteredMathCards : MATH_FORMULA_CARDS;
  const currentMathCard: MathFormulaCard = mathCardsToDisplay[mathIdx] || mathCardsToDisplay[0];

  const toggleMathMastered = (id: string) => {
    setMathMastered((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  if (currentSubject === 'math') {
    const isMathMastered = mathMastered.includes(currentMathCard?.id);

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header Banner */}
        <div className="bg-[#1E3A8A] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm">
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
  // 2. ENGLISH VOCABULARY MULTI-SENSORY MASTERY VIEW
  // ═════════════════════════════════════════════════════════════════
  const isEnglishMastered = masteredVocabIds.includes(currentWord?.id || currentWord?.word);
  const isEnglishStarred = starredVocabIds.includes(currentWord?.id || currentWord?.word);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3D3D2D] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              🇬🇧 Kho Từ Vựng & Flashcards Đa Giác Quan Lớp 9
            </span>
            {todayWords.length > 0 && (
              <span className="px-3 py-1 bg-amber-400 text-amber-950 rounded-full text-xs font-extrabold flex items-center space-x-1 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>Gói 20 từ hôm nay sẵn sàng!</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Luyện Từ Vựng Toàn Diện Vào Lớp 10
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            Áp dụng phương pháp Active Recall, Spaced Repetition và Game phản xạ giúp ghi nhớ từ vựng 12 Unit, Phrasal Verbs, Collocations & Idioms bền vững.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="bg-[#FDFCFB]/95 backdrop-blur-sm text-[#3D3D2D] p-4 rounded-[2rem] border border-[#D9D2C5] text-center shrink-0 w-full sm:w-44 shadow-lg space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-[#8A8A70] block">Đã làm chủ</span>
          <p className="text-3xl font-black text-emerald-700">
            {masteredVocabIds.length} <span className="text-xs font-bold text-[#64748B]">/ {vocabularyWords.length}</span>
          </p>
          <div className="text-[11px] font-bold text-amber-700">
            ⭐ Gắn sao: {starredVocabIds.length} từ khó
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 5-MODE NAVIGATION SWITCHER BAR                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="flex bg-[#E8E2D9] p-1.5 rounded-2xl max-w-2xl mx-auto text-xs font-bold gap-1 shadow-2xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStudyMode('flashcard')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            studyMode === 'flashcard' ? 'bg-white text-[#3D3D2D] shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Thẻ 3D</span>
        </button>

        <button
          onClick={() => setStudyMode('cloze')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            studyMode === 'cloze' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#5A5A40] hover:text-[#3D3D2D]'
          }`}
        >
          <PenTool className="w-4 h-4 text-amber-300" />
          <span>Điền Ngữ Cảnh</span>
        </button>

        <button
          onClick={() => setStudyMode('matching')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            studyMode === 'matching' ? 'bg-orange-700 text-white shadow-xs' : 'text-orange-900 hover:text-[#3D3D2D]'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Ghép Cặp Nhanh</span>
        </button>

        <button
          onClick={() => setStudyMode('quiz')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            studyMode === 'quiz' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#1E3A8A] hover:text-[#3D3D2D]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Mini Quiz</span>
        </button>

        <button
          onClick={() => setStudyMode('dictation')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 whitespace-nowrap ${
            studyMode === 'dictation' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 hover:text-[#3D3D2D]'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Nghe Chính Tả</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8A8A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tra từ tiếng Anh, nghĩa tiếng Việt..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs text-[#3D3D2D] outline-hidden placeholder:text-[#8A8A70] focus:border-[#5A5A40]"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center space-x-1 bg-[#F5F2ED] p-1 rounded-2xl text-xs font-bold w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterStatus === 'all' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              Tất cả ({vocabularyWords.length})
            </button>
            <button
              onClick={() => setFilterStatus('daily')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterStatus === 'daily' ? 'bg-amber-600 text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              🎁 Hôm nay ({todayWords.length || 20})
            </button>
            <button
              onClick={() => setFilterStatus('starred')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterStatus === 'starred' ? 'bg-amber-500 text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              ⭐ Gắn sao ({starredVocabIds.length})
            </button>
            <button
              onClick={() => setFilterStatus('mastered')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterStatus === 'mastered' ? 'bg-[#8BA888] text-white shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
              }`}
            >
              Đã thuộc ({masteredVocabIds.length})
            </button>
          </div>
        </div>

        {/* Dropdown Selects */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#F5F2ED] text-xs">
          <div className="flex flex-wrap items-center gap-2 font-bold">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
            >
              <option value="all">📂 Tất cả Chủ đề / Unit</option>
              {VOCAB_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.nameVi}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="p-2 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
            >
              <option value="all">🎯 Tất cả độ khó</option>
              <option value="easy">🟢 Cơ bản (6 - 7.5đ)</option>
              <option value="medium">🟡 Khá - Giỏi (7.5 - 8.75đ)</option>
              <option value="hard">🔴 Nâng cao (9 - 10đ)</option>
            </select>
          </div>

          <span className="text-xs text-[#64748B]">
            Đang hiển thị <strong>{wordsToDisplay.length}</strong> từ vựng
          </span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 1: 3D INTERACTIVE FLASHCARD                              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'flashcard' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-2 font-medium">
            <span>
              Thẻ {vocabIdx + 1} / {wordsToDisplay.length}
            </span>
            <span className="hidden sm:inline text-[11px] text-[#8A8A70]">
              Phím tắt: [Space] Lật thẻ • [← / →] Chuyển từ • [S] Phát âm
            </span>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[380px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-7 sm:p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
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

              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                {/* Audio button */}
                <button
                  onClick={() => speakWord(currentWord.word)}
                  className="p-2 rounded-xl bg-[#F5F2ED] text-[#5A5A40] hover:bg-blue-100 hover:text-blue-800 transition cursor-pointer"
                  title="Nghe phát âm chuẩn giọng bản xứ (Phím S)"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                {/* Star difficult toggle */}
                <button
                  onClick={() => toggleVocabStarred(currentWord.id || currentWord.word)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isEnglishStarred
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-[#F5F2ED] border-[#D9D2C5] text-[#64748B] hover:text-amber-600'
                  }`}
                  title={isEnglishStarred ? 'Đã gắn sao từ khó' : 'Gắn sao từ này để ôn lại'}
                >
                  <Star className={`w-4 h-4 ${isEnglishStarred ? 'fill-current' : ''}`} />
                </button>

                {/* Mastered toggle */}
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
              <div className="text-center space-y-3.5 py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-0.5">
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
                    <strong>Collocations:</strong> {currentWord.collocations.join(', ')}
                  </div>
                )}

                {/* AI Exam Questions Button */}
                <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenAiExamGen(currentWord)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 mx-auto cursor-pointer shadow-xs"
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-300" />
                    <span>🤖 AI Đặt 3 Câu Đề Thi Thực Chiến</span>
                  </button>
                </div>
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
      {/* MODE 2: CONTEXT CLOZE / WORD FORM FILL-IN                     */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'cloze' && (
        <div className="max-w-xl mx-auto space-y-4">
          {clozeFinished ? (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-3xl mx-auto">
                🏆
              </div>
              <h3 className="text-2xl font-extrabold text-[#3D3D2D]">Hoàn Thành Luyện Điền Ngữ Cảnh!</h3>
              <p className="text-sm text-[#64748B]">
                Bạn đã điền đúng chính xác <strong className="text-emerald-700 font-black">{clozeScore}</strong> /{' '}
                {wordsToDisplay.length} câu ví dụ thực tế.
              </p>
              <button
                onClick={() => {
                  setClozeIdx(0);
                  setClozeScore(0);
                  setClozeFinished(false);
                }}
                className="px-6 py-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-xs"
              >
                Luyện tập lại
              </button>
            </div>
          ) : currentClozeWord ? (
            <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <span className="text-xs font-bold text-[#64748B]">
                  Câu {clozeIdx + 1} / {wordsToDisplay.length}
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  Điểm: {clozeScore}
                </span>
              </div>

              {/* Cloze Sentence Box */}
              <div className="space-y-3">
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-sm sm:text-base text-[#3D3D2D] leading-relaxed font-medium">
                  {clozeSentence.masked}
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Gợi ý nghĩa: </span>
                    <span>{currentClozeWord.meaningVi} ({currentClozeWord.partOfSpeech})</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    {currentClozeWord.word.length} ký tự
                  </span>
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={clozeInput}
                    onChange={(e) => !clozeChecked && setClozeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (!clozeChecked ? handleCheckCloze() : handleNextCloze())}
                    placeholder="Gõ từ tiếng Anh còn thiếu..."
                    disabled={clozeChecked}
                    autoFocus
                    className={`flex-1 p-3.5 rounded-2xl border text-sm font-bold outline-hidden transition ${
                      clozeChecked
                        ? clozeIsCorrect
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                          : 'bg-red-50 border-red-500 text-red-900'
                        : 'bg-white border-[#EAE7E0] focus:border-[#5A5A40] text-[#3D3D2D]'
                    }`}
                  />

                  {!clozeChecked && (
                    <button
                      onClick={handleRevealChar}
                      className="px-3.5 py-3.5 bg-[#FAF9F6] hover:bg-[#F5F2ED] border border-[#EAE7E0] text-[#5A5A40] rounded-2xl text-xs font-bold transition cursor-pointer"
                      title="Gợi ý thêm 1 chữ cái"
                    >
                      💡 Gợi ý
                    </button>
                  )}
                </div>

                {/* Result banner if checked */}
                {clozeChecked && (
                  <div className={`p-4 rounded-2xl text-xs font-medium space-y-1 ${
                    clozeIsCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    <div className="font-bold flex items-center space-x-1.5">
                      {clozeIsCorrect ? <Check className="w-4 h-4 text-emerald-700" /> : <X className="w-4 h-4 text-red-700" />}
                      <span>{clozeIsCorrect ? 'Chính xác 100%!' : `Đáp án đúng là: "${clozeSentence.target}" (${currentClozeWord.ipa})`}</span>
                    </div>
                    {currentClozeWord.exampleVi && (
                      <p className="text-[11px] text-[#4A4A4A]">Dịch nghĩa: {currentClozeWord.exampleVi}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                {!clozeChecked ? (
                  <button
                    onClick={handleCheckCloze}
                    disabled={!clozeInput.trim()}
                    className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] disabled:opacity-40 text-white font-bold text-xs rounded-full transition cursor-pointer shadow-xs"
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <button
                    onClick={handleNextCloze}
                    className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white font-bold text-xs rounded-full transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>{clozeIdx < wordsToDisplay.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 3: SPEED MATCHING MEMORY GAME                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'matching' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Header timer & score */}
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#3D3D2D]">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Thời gian: {matchTimer}s</span>
            </div>

            <div className="text-xs font-extrabold text-emerald-700">
              Điểm: {matchScore}
            </div>

            <button
              onClick={initMatchingGame}
              className="px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] hover:bg-[#F5F2ED] text-xs font-bold text-[#5A5A40] rounded-xl transition flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi ván mới</span>
            </button>
          </div>

          {matchGameOver ? (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-4 shadow-sm">
              <div className="w-20 h-20 bg-orange-100 text-orange-700 rounded-3xl flex items-center justify-center text-4xl mx-auto">
                ⚡
              </div>
              <h3 className="text-2xl font-extrabold text-[#3D3D2D]">Chúc Mừng! Hoàn Thành Cực Nhanh!</h3>
              <p className="text-sm text-[#64748B]">
                Bạn đã ghép đúng tất cả 6 cặp từ trong <strong>{matchTimer} giây</strong> với điểm số{' '}
                <strong className="text-orange-600 font-bold">{matchScore} điểm</strong>!
              </p>
              <button
                onClick={initMatchingGame}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-xs"
              >
                Chơi tiếp ván mới
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {matchCards.map((tile) => {
                const isSelected = selectedMatchFirst?.id === tile.id;
                let style = 'bg-white border-[#EAE7E0] text-[#3D3D2D] hover:border-[#5A5A40] hover:bg-[#FAF9F6]';

                if (tile.matched) {
                  style = 'bg-emerald-50 border-emerald-300 text-emerald-800 opacity-30 pointer-events-none scale-95';
                } else if (isSelected) {
                  style = 'bg-orange-100 border-orange-500 text-orange-950 ring-2 ring-orange-400 font-bold';
                }

                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(tile)}
                    disabled={tile.matched}
                    className={`p-5 rounded-2xl border text-xs sm:text-sm font-semibold transition-all duration-150 min-h-[90px] flex items-center justify-center text-center cursor-pointer shadow-2xs ${style}`}
                  >
                    <span className="line-clamp-3">{tile.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 4: VOCAB MINI QUIZ                                       */}
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
                Bạn đã trả lời đúng <strong className="text-emerald-700 font-black">{quizScore}</strong> /{' '}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 5: AUDIO DICTATION & SPELLING                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'dictation' && (
        <div className="max-w-xl mx-auto space-y-4">
          {dictationFinished ? (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center text-3xl mx-auto">
                🎧
              </div>
              <h3 className="text-2xl font-extrabold text-[#3D3D2D]">Hoàn Thành Nghe & Viết Chính Tả!</h3>
              <p className="text-sm text-[#64748B]">
                Bạn đã viết đúng chính tả <strong className="text-purple-700 font-black">{dictationScore}</strong> /{' '}
                {wordsToDisplay.length} từ vựng.
              </p>
              <button
                onClick={() => {
                  setDictationIdx(0);
                  setDictationScore(0);
                  setDictationFinished(false);
                }}
                className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-2xl transition cursor-pointer shadow-xs"
              >
                Luyện tập lại
              </button>
            </div>
          ) : currentDictationWord ? (
            <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-6 sm:p-8 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <span className="text-xs font-bold text-[#64748B]">
                  Từ số {dictationIdx + 1} / {wordsToDisplay.length}
                </span>
                <span className="text-xs font-extrabold text-purple-700">
                  Điểm: {dictationScore}
                </span>
              </div>

              {/* Voice Player Big Button */}
              <div className="text-center space-y-3 py-4">
                <button
                  onClick={() => speakWord(currentDictationWord.word)}
                  className="w-20 h-20 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-3xl flex items-center justify-center mx-auto transition-transform active:scale-95 cursor-pointer shadow-xs"
                  title="Nghe phát âm chuẩn"
                >
                  <Volume2 className="w-8 h-8" />
                </button>
                <span className="text-xs font-bold text-purple-900 block">
                  Bấm để nghe phát âm tiếng Anh
                </span>
                <p className="text-xs font-mono text-[#8A8A70]">
                  Gợi ý phiên âm: {currentDictationWord.ipa}
                </p>
                <div className="text-xs text-[#5A5A40]">
                  Nghĩa: <strong>{currentDictationWord.meaningVi}</strong> ({currentDictationWord.partOfSpeech})
                </div>
              </div>

              {/* Dictation Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={dictationInput}
                  onChange={(e) => !dictationChecked && setDictationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (!dictationChecked ? handleCheckDictation() : handleNextDictation())}
                  placeholder="Gõ đúng chính tả từ tiếng Anh..."
                  disabled={dictationChecked}
                  autoFocus
                  className={`w-full p-3.5 rounded-2xl border text-sm font-bold text-center outline-hidden transition ${
                    dictationChecked
                      ? dictationIsCorrect
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-red-50 border-red-500 text-red-900'
                      : 'bg-white border-[#EAE7E0] focus:border-purple-600 text-[#3D3D2D]'
                  }`}
                />

                {dictationChecked && (
                  <div className={`p-4 rounded-2xl text-xs font-medium space-y-1 ${
                    dictationIsCorrect ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    <div className="font-bold flex items-center space-x-1.5">
                      {dictationIsCorrect ? <Check className="w-4 h-4 text-emerald-700" /> : <X className="w-4 h-4 text-red-700" />}
                      <span>{dictationIsCorrect ? 'Chính tả chuẩn xác!' : `Chính tả đúng: "${currentDictationWord.word}"`}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                {!dictationChecked ? (
                  <button
                    onClick={handleCheckDictation}
                    disabled={!dictationInput.trim()}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white font-bold text-xs rounded-full transition cursor-pointer shadow-xs"
                  >
                    Kiểm tra chính tả
                  </button>
                ) : (
                  <button
                    onClick={handleNextDictation}
                    className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-full transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <span>{dictationIdx < wordsToDisplay.length - 1 ? 'Từ tiếp theo' : 'Xem kết quả'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* AI EXAM SENTENCES GENERATOR MODAL                             */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {aiModalOpen && aiModalWord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D]">
                    AI Đặt Câu Đề Thi Thực Chiến: "{aiModalWord.word}"
                  </h3>
                  <p className="text-[11px] text-[#8A8A70]">
                    Các câu hỏi trắc nghiệm thực tế chuẩn cấu trúc đề tuyển sinh vào 10
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF9F6] text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiModalLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#5A5A40]">
                  AI đang tạo 3 câu hỏi trắc nghiệm đề thi vào 10 cho từ "{aiModalWord.word}"...
                </p>
              </div>
            ) : aiGeneratedExamQuestions.length > 0 ? (
              <div className="space-y-4">
                {aiGeneratedExamQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2.5">
                    <span className="text-xs font-bold text-purple-700">Câu hỏi {qIdx + 1}:</span>
                    <p className="text-xs sm:text-sm font-bold text-[#3D3D2D]">{q.question}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border font-medium ${
                            oIdx === q.correctIdx
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                              : 'bg-white border-[#EAE7E0] text-[#4A4A4A]'
                          }`}
                        >
                          <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-[#64748B] pt-1 leading-relaxed">
                      💡 <strong>Giải thích:</strong> {q.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-6 text-[#8A8A70]">
                Không tạo được câu hỏi. Vui lòng thử lại sau.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
