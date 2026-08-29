import React, { useState, useEffect, useMemo } from 'react';
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
  Timer,
  Boxes,
  BookMarked,
  Smile,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VocabularyWord, MathFormulaCard } from '../../types';

export const VocabFlashcardsView: React.FC = () => {
  const {
    currentSubject,
    vocabularyWords,
    masteredVocabIds,
    starredVocabIds = [],
    vocabSrsData = {},
    toggleVocabMastered,
    toggleVocabStarred,
    promoteVocabSrs,
    demoteVocabSrs,
    getVocabBox,
  } = useApp();

  // Mode: 'flashcard' | 'cloze' | 'matching' | 'quiz' | 'dictation' | 'blitz60'
  const [studyMode, setStudyMode] = useState<'flashcard' | 'cloze' | 'matching' | 'quiz' | 'dictation' | 'blitz60'>('flashcard');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered' | 'starred' | 'daily' | 'srs_due' | 'box1' | 'box5'>('all');

  // Flashcard State
  const [vocabIdx, setVocabIdx] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Mode 2: Context Cloze State
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

  // Mode 6: 60-Second Survival Blitz Challenge State
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number>(60);
  const [blitzScore, setBlitzScore] = useState<number>(0);
  const [blitzStreak, setBlitzStreak] = useState<number>(0);
  const [blitzMaxStreak, setBlitzMaxStreak] = useState<number>(0);
  const [blitzIsActive, setBlitzIsActive] = useState<boolean>(false);
  const [blitzGameOver, setBlitzGameOver] = useState<boolean>(false);
  const [blitzWordIdx, setBlitzWordIdx] = useState<number>(0);
  const [blitzFeedback, setBlitzFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Math State
  const [selectedMathCategory, setSelectedMathCategory] = useState<string>('all');
  const [mathIdx, setMathIdx] = useState<number>(0);
  const [mathMastered, setMathMastered] = useState<string[]>([]);

  // AI Exam Sentences Modal State
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiModalWord, setAiModalWord] = useState<VocabularyWord | null>(null);
  const [aiGeneratedExamQuestions, setAiGeneratedExamQuestions] = useState<
    Array<{ question: string; options: string[]; correctIdx: number; explanation: string }>
  >([]);
  const [aiModalLoading, setAiModalLoading] = useState<boolean>(false);

  // AI Story Builder Modal State
  const [aiStoryModalOpen, setAiStoryModalOpen] = useState<boolean>(false);
  const [aiGeneratedStory, setAiGeneratedStory] = useState<{ storyEn: string; storyVi: string; wordsUsed: string[] } | null>(null);
  const [aiStoryLoading, setAiStoryLoading] = useState<boolean>(false);

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

    setBlitzIsActive(false);
    setBlitzGameOver(false);
    setBlitzTimeLeft(60);
    setBlitzScore(0);
    setBlitzStreak(0);
  }, [currentSubject, studyMode, selectedCategory, selectedDifficulty, filterStatus]);

  // Today's words
  const todayWords = useMemo(() => {
    return vocabularyWords.filter((w) => w.dailyBatch === todayStr);
  }, [vocabularyWords, todayStr]);

  // Filtered English words
  const filteredWords: VocabularyWord[] = useMemo(() => {
    return vocabularyWords.filter((w) => {
      const box = getVocabBox(w.id);

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
        return masteredVocabIds.includes(w.id) || masteredVocabIds.includes(w.word) || box === 5;
      }
      if (filterStatus === 'unmastered') {
        return !masteredVocabIds.includes(w.id) && !masteredVocabIds.includes(w.word) && box < 5;
      }
      if (filterStatus === 'starred') {
        return starredVocabIds.includes(w.id) || starredVocabIds.includes(w.word);
      }
      if (filterStatus === 'box1') {
        return box === 1;
      }
      if (filterStatus === 'box5') {
        return box === 5;
      }
      if (filterStatus === 'srs_due') {
        const nextReview = vocabSrsData[w.id]?.nextReviewDate;
        return !nextReview || nextReview <= todayStr;
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
  }, [vocabularyWords, searchQuery, selectedCategory, selectedDifficulty, filterStatus, todayWords, masteredVocabIds, starredVocabIds, vocabSrsData, todayStr, getVocabBox]);

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

  const clozeSentence = useMemo(() => {
    if (!currentClozeWord || !currentClozeWord.exampleEn) {
      return { masked: 'The student learns new _______ every day.', target: currentClozeWord?.word || '' };
    }
    const target = currentClozeWord.word.trim();
    const regex = new RegExp(`\\b${target}\\b`, 'gi');
    let masked = currentClozeWord.exampleEn.replace(regex, '_______');
    if (!masked.includes('_______')) {
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
      promoteVocabSrs(currentClozeWord.id);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      speakWord(currentClozeWord.word);
    } else {
      demoteVocabSrs(currentClozeWord.id);
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

      if (selectedMatchFirst.wordId === tile.wordId && selectedMatchFirst.type !== tile.type) {
        // MATCHED!
        setMatchCards((prev) =>
          prev.map((c) => (c.wordId === tile.wordId ? { ...c, matched: true } : c))
        );
        setMatchScore((prev) => prev + 10);
        promoteVocabSrs(tile.wordId);
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        setSelectedMatchFirst(null);

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
      promoteVocabSrs(currentQuizItem.word.id);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      speakWord(currentQuizItem.word.word);
    } else {
      demoteVocabSrs(currentQuizItem.word.id);
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
      promoteVocabSrs(currentDictationWord.id);
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } else {
      demoteVocabSrs(currentDictationWord.id);
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

  // ─── MODE 6: 60-SECOND VOCAB BLITZ SURVIVAL ───
  const startBlitzSurvival = () => {
    setBlitzTimeLeft(60);
    setBlitzScore(0);
    setBlitzStreak(0);
    setBlitzMaxStreak(0);
    setBlitzIsActive(true);
    setBlitzGameOver(false);
    setBlitzWordIdx(0);
  };

  useEffect(() => {
    if (!blitzIsActive || blitzGameOver) return;
    const timer = setInterval(() => {
      setBlitzTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBlitzGameOver(true);
          setBlitzIsActive(false);
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [blitzIsActive, blitzGameOver]);

  const currentBlitzItem = useMemo(() => {
    if (!blitzIsActive || wordsToDisplay.length === 0) return null;
    const targetWord = wordsToDisplay[blitzWordIdx % wordsToDisplay.length];
    const otherWords = vocabularyWords.filter((w) => w.id !== targetWord.id);
    const shuffledOthers = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [
      targetWord.meaningVi,
      ...shuffledOthers.map((w) => w.meaningVi || 'Nghĩa khác'),
    ].sort(() => 0.5 - Math.random());

    const correctIndex = options.indexOf(targetWord.meaningVi);
    return { targetWord, options, correctIndex };
  }, [blitzIsActive, blitzWordIdx, wordsToDisplay, vocabularyWords]);

  const handleBlitzAnswer = (optionIdx: number) => {
    if (!currentBlitzItem || blitzGameOver) return;
    const isRight = optionIdx === currentBlitzItem.correctIndex;

    if (isRight) {
      setBlitzScore((prev) => prev + 1);
      setBlitzStreak((prev) => {
        const next = prev + 1;
        setBlitzMaxStreak((m) => Math.max(m, next));
        return next;
      });
      // Time bonus +2s
      setBlitzTimeLeft((prev) => Math.min(prev + 2, 90));
      promoteVocabSrs(currentBlitzItem.targetWord.id);
      setBlitzFeedback('correct');
    } else {
      setBlitzStreak(0);
      // Time penalty -3s
      setBlitzTimeLeft((prev) => Math.max(prev - 3, 0));
      demoteVocabSrs(currentBlitzItem.targetWord.id);
      setBlitzFeedback('wrong');
    }

    setTimeout(() => {
      setBlitzFeedback(null);
      setBlitzWordIdx((prev) => prev + 1);
    }, 250);
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
    } finally {
      setAiModalLoading(false);
    }
  };

  // ─── AI NARRATIVE CONTEXT STORY BUILDER ───
  const handleOpenAiStoryBuilder = async () => {
    setAiStoryModalOpen(true);
    setAiStoryLoading(true);
    setAiGeneratedStory(null);

    const apiKey = getStoredApiKey();
    const sampleWords = wordsToDisplay.slice(0, 6);
    const wordsListStr = sampleWords.map((w) => `"${w.word}" (${w.meaningVi})`).join(', ');

    if (!apiKey) {
      setAiGeneratedStory({
        storyEn: `Once upon a time in a bustling village, a skilled craftsman tried to preserve ancient pottery techniques. Despite many difficulties, he never gave up his passion.`,
        storyVi: `Ngày xửa ngày xưa tại một ngôi làng nhộn nhịp, một người thợ thủ công lành nghề đã cố gắng bảo tồn các kỹ thuật làm gốm cổ xưa. Dù gặp nhiều khó khăn, ông không bao giờ từ bỏ niềm đam mê của mình.`,
        wordsUsed: sampleWords.map((w) => w.word),
      });
      setAiStoryLoading(false);
      return;
    }

    const prompt = `Bạn là chuyên gia giảng dạy Tiếng Anh theo phương pháp Siêu Trí Nhớ (Storytelling & Context Learning).
Hãy sáng tác 1 ĐOẠN VĂN KỂ CHUYỆN NGẮN (5 - 6 câu) vui nhộn, giàu cảm xúc và hình ảnh, LỒNG GHÉP TẤT CẢ các từ vựng sau:
${wordsListStr}

ĐỊNH DẠNG TRẢ VỀ:
Trả về DUY NHẤT một JSON object:
{
  "storyEn": "Đoạn văn tiếng Anh 5-6 câu có in hoa hoặc in đậm các từ vựng mục tiêu...",
  "storyVi": "Bản dịch tiếng Việt mạch lạc, dễ hiểu...",
  "wordsUsed": ["từ 1", "từ 2"]
}`;

    try {
      const { text } = await callGeminiApiWithFallback(apiKey, 'gemini-3.6-flash', {
        contents: [{ parts: [{ text: prompt }] }],
      });
      const clean = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(clean);
      if (parsed && parsed.storyEn) {
        setAiGeneratedStory(parsed);
      }
    } catch (err) {
      console.warn('AI Story Builder error:', err);
    } finally {
      setAiStoryLoading(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════
  // 1. MATH FORMULA FLASHCARD VIEW
  // ═════════════════════════════════════════════════════════════
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
  // 2. ENGLISH VOCABULARY ADVANCED MEMORY VIEW
  // ═════════════════════════════════════════════════════════════
  const currentBox = getVocabBox(currentWord?.id);
  const isEnglishMastered = masteredVocabIds.includes(currentWord?.id || currentWord?.word) || currentBox === 5;
  const isEnglishStarred = starredVocabIds.includes(currentWord?.id || currentWord?.word);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3D3D2D] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-2 relative z-10">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              🧠 Siêu Trí Nhớ Từ Vựng Lớp 9 (6 Phương Pháp Khoa Học)
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
            Kết hợp <strong>Cây Họ Từ (Word Families)</strong>, <strong>Mẹo Liên Tưởng (Mnemonics)</strong>, <strong>Hộp Leitner SRS</strong> và <strong>Thử Thách Sinh Tồn 60s</strong> giúp khắc sâu vào trí nhớ dài hạn.
          </p>
        </div>

        {/* Stats Pill */}
        <div className="bg-[#FDFCFB]/95 backdrop-blur-sm text-[#3D3D2D] p-4 rounded-[2rem] border border-[#D9D2C5] text-center shrink-0 w-full sm:w-44 shadow-lg space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-[#8A8A70] block">🏆 Đã làm chủ (Hộp 5)</span>
          <p className="text-3xl font-black text-emerald-700">
            {masteredVocabIds.length} <span className="text-xs font-bold text-[#64748B]">/ {vocabularyWords.length}</span>
          </p>
          <div className="text-[11px] font-bold text-amber-700">
            ⭐ Gắn sao: {starredVocabIds.length} từ khó
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 6-MODE NAVIGATION SWITCHER BAR                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="flex bg-[#E8E2D9] p-1.5 rounded-2xl max-w-3xl mx-auto text-xs font-bold gap-1 shadow-2xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setStudyMode('flashcard')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'flashcard' ? 'bg-white text-[#3D3D2D] shadow-xs' : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Thẻ 3D & Họ Từ</span>
        </button>

        <button
          onClick={() => setStudyMode('blitz60')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'blitz60' ? 'bg-rose-600 text-white shadow-xs animate-pulse' : 'text-rose-800 hover:text-rose-950'
          }`}
        >
          <Timer className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ Sinh Tồn 60s</span>
        </button>

        <button
          onClick={() => setStudyMode('cloze')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'cloze' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#5A5A40] hover:text-[#3D3D2D]'
          }`}
        >
          <PenTool className="w-3.5 h-3.5 text-amber-300" />
          <span>Điền Ngữ Cảnh</span>
        </button>

        <button
          onClick={() => setStudyMode('matching')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'matching' ? 'bg-orange-700 text-white shadow-xs' : 'text-orange-900 hover:text-[#3D3D2D]'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Ghép Cặp Nhanh</span>
        </button>

        <button
          onClick={() => setStudyMode('quiz')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'quiz' ? 'bg-[#1E3A8A] text-white shadow-xs' : 'text-[#1E3A8A] hover:text-[#3D3D2D]'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Mini Quiz</span>
        </button>

        <button
          onClick={() => setStudyMode('dictation')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 whitespace-nowrap ${
            studyMode === 'dictation' ? 'bg-purple-700 text-white shadow-xs' : 'text-purple-900 hover:text-[#3D3D2D]'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
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

          {/* Status & SRS Leitner Filter Pills */}
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
              onClick={() => setFilterStatus('srs_due')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                filterStatus === 'srs_due' ? 'bg-indigo-700 text-white shadow-xs' : 'text-indigo-900 hover:text-[#3D3D2D]'
              }`}
            >
              🔔 Cần ôn SRS
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
              🏆 Đã thuộc
            </button>
          </div>
        </div>

        {/* Dropdown Selects & AI Story button */}
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

            {/* AI Narrative Context Story Builder Button */}
            <button
              onClick={handleOpenAiStoryBuilder}
              className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>📖 AI Kể Chuyện Xâu Chuỗi Từ Vựng</span>
            </button>
          </div>

          <span className="text-xs text-[#64748B]">
            Đang hiển thị <strong>{wordsToDisplay.length}</strong> từ vựng
          </span>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* MODE 1: 3D INTERACTIVE FLASHCARD WITH WORD FAMILY & MNEMONICS  */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'flashcard' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between text-xs text-[#64748B] px-2 font-medium">
            <div className="flex items-center space-x-2">
              <span>
                Thẻ {vocabIdx + 1} / {wordsToDisplay.length}
              </span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 text-[10px] font-extrabold rounded-md flex items-center space-x-1">
                <Boxes className="w-3 h-3" />
                <span>Hộp Leitner {currentBox}/5</span>
              </span>
            </div>
            <span className="hidden sm:inline text-[11px] text-[#8A8A70]">
              Phím tắt: [Space] Lật thẻ • [← / →] Chuyển từ • [S] Phát âm
            </span>
          </div>

          {/* Flashcard Box */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="relative min-h-[420px] bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-7 sm:p-8 flex flex-col justify-between cursor-pointer hover:border-[#D9D2C5] transition select-none group"
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
                <button
                  onClick={() => speakWord(currentWord.word)}
                  className="p-2 rounded-xl bg-[#F5F2ED] text-[#5A5A40] hover:bg-blue-100 hover:text-blue-800 transition cursor-pointer"
                  title="Nghe phát âm chuẩn giọng bản xứ (Phím S)"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

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
                  <span>Nhấn để xem nghĩa, Cây họ từ & Mẹo siêu trí nhớ</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2 animate-in fade-in zoom-in-95 duration-150">
                {/* Meaning */}
                <div className="text-center space-y-0.5">
                  <span className="text-xs uppercase font-bold text-[#64748B]">Nghĩa tiếng Việt</span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#E67E22]">
                    {currentWord.meaningVi}
                  </h3>
                </div>

                {/* Example sentence */}
                {currentWord.exampleEn && (
                  <div className="p-3 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] text-xs text-[#3D3D2D] space-y-0.5">
                    <p className="italic font-medium">"{currentWord.exampleEn}"</p>
                    {currentWord.exampleVi && (
                      <p className="text-[#64748B] font-medium">→ {currentWord.exampleVi}</p>
                    )}
                  </div>
                )}

                {/* 🌳 1. WORD FAMILY TREE (CÂY HỌ TỪ) */}
                {currentWord.wordFamily && (
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-indigo-950 text-[11px] uppercase">
                      <span>🌳 Cây Họ Từ (Word Family):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      {currentWord.wordFamily.noun && (
                        <div className="p-1.5 bg-white rounded-lg border border-indigo-100">
                          <strong className="text-indigo-700">Noun:</strong> {currentWord.wordFamily.noun}
                        </div>
                      )}
                      {currentWord.wordFamily.verb && (
                        <div className="p-1.5 bg-white rounded-lg border border-indigo-100">
                          <strong className="text-indigo-700">Verb:</strong> {currentWord.wordFamily.verb}
                        </div>
                      )}
                      {currentWord.wordFamily.adj && (
                        <div className="p-1.5 bg-white rounded-lg border border-indigo-100">
                          <strong className="text-indigo-700">Adj:</strong> {currentWord.wordFamily.adj}
                        </div>
                      )}
                      {currentWord.wordFamily.adv && (
                        <div className="p-1.5 bg-white rounded-lg border border-indigo-100">
                          <strong className="text-indigo-700">Adv:</strong> {currentWord.wordFamily.adv}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 💡 2. MNEMONIC STORY (MẸO LIÊN TƯỞNG SIÊU TRÍ NHỚ) */}
                {currentWord.mnemonic && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-950 text-[11px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Mẹo Siêu Trí Nhớ & Câu Chuyện Liên Tưởng:</span>
                    </div>
                    <p className="text-amber-950 font-medium leading-relaxed italic">
                      "{currentWord.mnemonic}"
                    </p>
                  </div>
                )}

                {/* 🎯 3. SYNONYMS & ANTONYMS */}
                {(currentWord.synonyms || currentWord.antonyms) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {currentWord.synonyms && currentWord.synonyms.length > 0 && (
                      <div className="flex-1 min-w-[140px] p-2 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950">
                        <strong>= Đồng nghĩa:</strong> {currentWord.synonyms.join(', ')}
                      </div>
                    )}
                    {currentWord.antonyms && currentWord.antonyms.length > 0 && (
                      <div className="flex-1 min-w-[140px] p-2 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-950">
                        <strong>≠ Trái nghĩa:</strong> {currentWord.antonyms.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* 📦 4. LEITNER SRS RATING BUTTONS */}
                <div className="pt-2 flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => demoteVocabSrs(currentWord.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    🔴 Chưa nhớ (Reset Hộp 1)
                  </button>
                  <button
                    onClick={() => {
                      promoteVocabSrs(currentWord.id);
                      confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    🟢 Nhớ tốt (+1 Hộp SRS)
                  </button>
                </div>

                {/* AI Exam Questions Button */}
                <div className="pt-1 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenAiExamGen(currentWord)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Brain className="w-3.5 h-3.5 text-amber-300" />
                    <span>🤖 AI Đặt 3 Câu Đề Thi Vào 10</span>
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
      {/* MODE 6: 60-SECOND VOCAB BLITZ SURVIVAL CHALLENGE              */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {studyMode === 'blitz60' && (
        <div className="max-w-xl mx-auto space-y-4">
          {!blitzIsActive && !blitzGameOver && (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-5 shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center text-4xl mx-auto animate-pulse">
                ⚡
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#3D3D2D]">Thử Thách Sinh Tồn 60 Giây</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  Nhận diện nhanh nghĩa từ vựng dưới áp lực thời gian!
                  <br />
                  <strong className="text-emerald-700">Đúng: +2 giây</strong> • <strong className="text-rose-700">Sai: -3 giây</strong>
                </p>
              </div>
              <button
                onClick={startBlitzSurvival}
                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm rounded-2xl transition cursor-pointer shadow-md"
              >
                Bắt đầu thử thách ngay!
              </button>
            </div>
          )}

          {blitzGameOver && (
            <div className="p-8 sm:p-10 bg-white rounded-[2.5rem] border border-[#EAE7E0] text-center space-y-5 shadow-sm animate-in zoom-in-95">
              <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center text-4xl mx-auto">
                🏆
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-[#3D3D2D]">Hết Giờ Sinh Tồn!</h3>
                <p className="text-sm text-[#64748B]">
                  Bạn đã vượt qua được <strong className="text-emerald-700 text-lg font-black">{blitzScore}</strong> từ vựng!
                </p>
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#D9D2C5] text-xs text-[#5A5A40] font-bold">
                  🔥 Chuỗi đúng liên tiếp dài nhất: {blitzMaxStreak} câu
                </div>
              </div>
              <button
                onClick={startBlitzSurvival}
                className="px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl transition cursor-pointer shadow-xs"
              >
                Chơi lại ván mới
              </button>
            </div>
          )}

          {blitzIsActive && currentBlitzItem && (
            <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-6 sm:p-8 space-y-5 shadow-sm">
              {/* Blitz Timer and Score bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
                <div className="flex items-center space-x-2">
                  <Timer className={`w-5 h-5 ${blitzTimeLeft < 15 ? 'text-rose-600 animate-bounce' : 'text-orange-600'}`} />
                  <span className={`text-base font-black font-mono ${blitzTimeLeft < 15 ? 'text-rose-600' : 'text-[#3D3D2D]'}`}>
                    {blitzTimeLeft}s
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-amber-700">🔥 Combo x{blitzStreak}</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-black">
                    Điểm: {blitzScore}
                  </span>
                </div>
              </div>

              {/* Word Box */}
              <div className={`text-center space-y-2 py-4 rounded-2xl transition-colors ${
                blitzFeedback === 'correct' ? 'bg-emerald-50' : blitzFeedback === 'wrong' ? 'bg-red-50' : ''
              }`}>
                <h3 className="text-3xl sm:text-4xl font-black text-[#3D3D2D]">
                  {currentBlitzItem.targetWord.word}
                </h3>
                <p className="text-xs text-[#8A8A70] font-mono">{currentBlitzItem.targetWord.ipa}</p>
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 gap-2.5">
                {currentBlitzItem.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleBlitzAnswer(optIdx)}
                    className="p-4 rounded-2xl border bg-[#FAF9F6] border-[#EAE7E0] hover:border-rose-500 hover:bg-rose-50/50 text-xs sm:text-sm font-bold text-[#3D3D2D] transition text-left cursor-pointer active:scale-98"
                  >
                    <span className="mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* AI NARRATIVE CONTEXT STORY BUILDER MODAL                      */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {aiStoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <BookMarked className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D]">
                    AI Kể Chuyện Xâu Chuỗi Từ Vựng
                  </h3>
                  <p className="text-[11px] text-[#8A8A70]">
                    Kích hoạt Narrative Memory để ghi nhớ từ vựng qua một câu chuyện ngắn
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiStoryModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF9F6] text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiStoryLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#5A5A40]">
                  AI đang sáng tác câu chuyện xâu chuỗi các từ vựng cho bạn...
                </p>
              </div>
            ) : aiGeneratedStory ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                  <span className="text-xs font-extrabold text-emerald-900 block">🇬🇧 Câu chuyện Tiếng Anh:</span>
                  <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
                    {aiGeneratedStory.storyEn}
                  </p>
                </div>

                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2">
                  <span className="text-xs font-extrabold text-[#5A5A40] block">🇻🇳 Bản dịch Tiếng Việt:</span>
                  <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                    {aiGeneratedStory.storyVi}
                  </p>
                </div>

                {aiGeneratedStory.wordsUsed && (
                  <div className="text-xs text-[#64748B]">
                    <strong>Từ vựng đã dùng: </strong> {aiGeneratedStory.wordsUsed.join(', ')}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end pt-2 border-t border-[#F5F2ED]">
              <button
                onClick={() => setAiStoryModalOpen(false)}
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
