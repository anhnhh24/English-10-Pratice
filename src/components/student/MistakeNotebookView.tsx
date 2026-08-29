import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { Question, MistakeItem, MistakeReason } from '../../types';
import {
  BookMarked,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Trash2,
  Check,
  Sparkles,
  Shuffle,
  Flame,
  Brain,
  Target,
  BarChart2,
  Search,
  MessageSquare,
  Edit3,
  X,
  Zap,
  ArrowRight,
  Award,
  ShieldAlert,
  Clock,
  HelpCircle,
  CheckSquare,
  Share2,
  Filter,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiQuestionExplainerModal } from '../common/AiQuestionExplainerModal';
import { generateSimilarQuestions, getStoredApiKey } from '../../services/aiExamService';

export const REASON_CONFIG: Record<
  MistakeReason,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  careless: {
    label: 'Đọc ẩu / Nhầm đề',
    icon: '⚡',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
  },
  knowledge_gap: {
    label: 'Hổng kiến thức / Quên quy tắc',
    icon: '🧠',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
  },
  trap_distractor: {
    label: 'Dính bẫy đề thi / Bẫy lừa',
    icon: '🪤',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  calculation: {
    label: 'Tính toán sai / Dịch nhầm',
    icon: '🧮',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  time_pressure: {
    label: 'Áp lực thời gian / Đoán mò',
    icon: '⏱️',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  other: {
    label: 'Nguyên nhân khác',
    icon: '📝',
    bg: 'bg-stone-50',
    text: 'text-stone-800',
    border: 'border-stone-200',
  },
};

interface MistakeNotebookViewProps {
  onOpenAiTutor?: (q: Question) => void;
}

interface PracticeQuestionState {
  question: Question;
  shuffledOptions: string[];
  correctOptionIndex: number;
}

export const MistakeNotebookView: React.FC<MistakeNotebookViewProps> = () => {
  const {
    currentSubject,
    currentUser,
    mistakes,
    getQuestionById,
    questions: allQuestions,
    recordAnswerResult,
    toggleMistakeMastered,
    updateMistakeNote,
    updateMistakeReason,
    removeMistake,
    clearMasteredMistakes,
  } = useApp();

  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

  // Navigation View Tab: 'notebook' | 'analytics'
  const [activeTab, setActiveTab] = useState<'notebook' | 'analytics'>('notebook');

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unmastered' | 'mastered'>('unmastered');
  const [filterReason, setFilterReason] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'newest' | 'topic'>('urgency');

  // Inline Note Editor state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // AI Modal states
  const [selectedQuestionForAi, setSelectedQuestionForAi] = useState<Question | null>(null);

  // AI Clone / Similar Questions Modal state
  const [aiSimilarModalOpen, setAiSimilarModalOpen] = useState<boolean>(false);
  const [aiSimilarBaseQuestion, setAiSimilarBaseQuestion] = useState<Question | null>(null);
  const [aiSimilarQuestions, setAiSimilarQuestions] = useState<Question[]>([]);
  const [aiSimilarLoading, setAiSimilarLoading] = useState<boolean>(false);
  const [aiSimilarIdx, setAiSimilarIdx] = useState<number>(0);
  const [aiSimilarChosen, setAiSimilarChosen] = useState<number | null>(null);
  const [aiSimilarChecked, setAiSimilarChecked] = useState<boolean>(false);
  const [aiSimilarScore, setAiSimilarScore] = useState<number>(0);

  // ─── RE-PRACTICE ENGINE STATE ───
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceMode, setPracticeMode] = useState<'standard' | 'shuffled' | 'streak_mastery'>('shuffled');
  const [practiceIdx, setPracticeIdx] = useState<number>(0);
  const [practiceQuestionsList, setPracticeQuestionsList] = useState<PracticeQuestionState[]>([]);
  const [chosenAnswer, setChosenAnswer] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState<boolean>(false);
  const [practiceSessionCorrect, setPracticeSessionCorrect] = useState<number>(0);
  const [practiceCompleted, setPracticeCompleted] = useState<boolean>(false);

  // Reset when currentSubject changes
  useEffect(() => {
    setIsPracticing(false);
    setPracticeIdx(0);
    setChosenAnswer(null);
    setHasChecked(false);
    setSelectedTopic('all');
    setFilterReason('all');
    setSearchQuery('');
  }, [currentSubject]);

  // Extract full mistake items with attached question objects
  const mistakeList = useMemo(() => {
    return (Object.values(mistakes) as MistakeItem[])
      .map((item) => {
        const q = getQuestionById(item.questionId);
        return { ...item, question: q };
      })
      .filter(
        (item): item is MistakeItem & { question: Question } =>
          item.question !== undefined && (item.question.subject || 'english') === currentSubject
      );
  }, [mistakes, getQuestionById, currentSubject]);

  // Filtered & Sorted Mistakes
  const filteredMistakes = useMemo(() => {
    return mistakeList
      .filter((item) => {
        // Topic filter
        if (selectedTopic !== 'all' && item.question.topicId !== selectedTopic) return false;
        // Status filter
        if (filterStatus === 'unmastered' && item.mastered) return false;
        if (filterStatus === 'mastered' && !item.mastered) return false;
        // Reason filter
        if (filterReason !== 'all' && (item.reason || 'knowledge_gap') !== filterReason) return false;
        // Search query
        if (searchQuery.trim()) {
          const qText = item.question.content.toLowerCase();
          const qExp = (item.question.explanation || '').toLowerCase();
          const qNote = (item.userNote || '').toLowerCase();
          const term = searchQuery.toLowerCase().trim();
          if (!qText.includes(term) && !qExp.includes(term) && !qNote.includes(term)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'urgency') {
          // Unmastered first, then highest wrong count
          if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
          return b.wrongCount - a.wrongCount;
        }
        if (sortBy === 'newest') {
          return new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime();
        }
        if (sortBy === 'topic') {
          return a.question.topicId.localeCompare(b.question.topicId);
        }
        return 0;
      });
  }, [mistakeList, selectedTopic, filterStatus, filterReason, searchQuery, sortBy]);

  // Summary counts & Metrics
  const totalMistakesCount = mistakeList.length;
  const unmasteredCount = mistakeList.filter((m) => !m.mastered).length;
  const masteredCount = mistakeList.filter((m) => m.mastered).length;
  const masteryPercentage =
    totalMistakesCount > 0 ? Math.round((masteredCount / totalMistakesCount) * 100) : 100;

  // Diagnostic Data by Topic
  const topicBreakdown = useMemo(() => {
    const map: Record<string, { total: number; unmastered: number; mastered: number }> = {};
    mistakeList.forEach((m) => {
      const tId = m.question.topicId;
      if (!map[tId]) map[tId] = { total: 0, unmastered: 0, mastered: 0 };
      map[tId].total += 1;
      if (m.mastered) map[tId].mastered += 1;
      else map[tId].unmastered += 1;
    });

    return Object.entries(map)
      .map(([topicId, stats]) => {
        const meta = currentTopicsMeta.find((t) => t.id === topicId);
        return {
          topicId,
          nameVi: meta?.nameVi || topicId.replace('math_', '').replace(/_/g, ' '),
          icon: (meta as any)?.icon || (meta as any)?.iconName || '📚',
          ...stats,
          rate: Math.round((stats.mastered / stats.total) * 100),
        };
      })
      .sort((a, b) => b.unmastered - a.unmastered);
  }, [mistakeList, currentTopicsMeta]);

  // Diagnostic Data by Error Reason
  const reasonBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      careless: 0,
      knowledge_gap: 0,
      trap_distractor: 0,
      calculation: 0,
      time_pressure: 0,
      other: 0,
    };
    mistakeList.forEach((m) => {
      const r = m.reason || 'knowledge_gap';
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([reason, count]) => ({
      reason: reason as MistakeReason,
      count,
      percent: totalMistakesCount > 0 ? Math.round((count / totalMistakesCount) * 100) : 0,
      config: REASON_CONFIG[reason as MistakeReason] || REASON_CONFIG.other,
    }));
  }, [mistakeList, totalMistakesCount]);

  // ─── START PRACTICE HANDLER ───
  const handleStartPractice = (mode: 'standard' | 'shuffled' | 'streak_mastery', customList?: Question[]) => {
    const sourceQuestions = customList || (
      mode === 'streak_mastery'
        ? filteredMistakes.filter((m) => !m.mastered).map((m) => m.question)
        : filteredMistakes.map((m) => m.question)
    );

    if (sourceQuestions.length === 0) return;

    const prepared: PracticeQuestionState[] = sourceQuestions.map((q) => {
      if (mode === 'shuffled') {
        // Shuffle options and calculate new correct index
        const originalCorrectText = q.options[q.correctOption];
        const indexedOptions = q.options.map((opt, idx) => ({ opt, idx }));
        const shuffled = [...indexedOptions].sort(() => 0.5 - Math.random());
        const newCorrectIdx = shuffled.findIndex((item) => item.opt === originalCorrectText);
        return {
          question: q,
          shuffledOptions: shuffled.map((item) => item.opt),
          correctOptionIndex: newCorrectIdx,
        };
      }
      return {
        question: q,
        shuffledOptions: [...q.options],
        correctOptionIndex: q.correctOption,
      };
    });

    setPracticeMode(mode);
    setPracticeQuestionsList(prepared);
    setIsPracticing(true);
    setPracticeIdx(0);
    setChosenAnswer(null);
    setHasChecked(false);
    setPracticeSessionCorrect(0);
    setPracticeCompleted(false);
  };

  const currentPracticeItem = practiceQuestionsList[practiceIdx];

  const handleCheckPracticeAnswer = () => {
    if (chosenAnswer === null || !currentPracticeItem) return;
    const isCorrect = chosenAnswer === currentPracticeItem.correctOptionIndex;

    // Record to persistent storage & update streaks
    recordAnswerResult(currentPracticeItem.question.id, isCorrect, chosenAnswer);

    if (isCorrect) {
      setPracticeSessionCorrect((prev) => prev + 1);
      const currentMistake = mistakes[currentPracticeItem.question.id];
      // If was 1 consecutive correct, now becomes 2 -> Mastered!
      if (currentMistake && currentMistake.consecutiveCorrect >= 1) {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      }
    }

    setHasChecked(true);
  };

  const handleNextPracticeQuestion = () => {
    if (practiceIdx < practiceQuestionsList.length - 1) {
      setPracticeIdx((prev) => prev + 1);
      setChosenAnswer(null);
      setHasChecked(false);
    } else {
      setPracticeCompleted(true);
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
    }
  };

  // ─── AI SIMILAR QUESTIONS DRILL ───
  const handleOpenAiSimilarDrill = async (baseQ: Question) => {
    setAiSimilarBaseQuestion(baseQ);
    setAiSimilarModalOpen(true);
    setAiSimilarLoading(true);
    setAiSimilarIdx(0);
    setAiSimilarChosen(null);
    setAiSimilarChecked(false);
    setAiSimilarScore(0);

    const apiKey = getStoredApiKey();
    try {
      const generated = await generateSimilarQuestions(
        apiKey,
        baseQ,
        3,
        'gemini-3.6-flash',
        allQuestions
      );
      setAiSimilarQuestions(generated);
    } catch (err) {
      console.error('AI similar generation failed:', err);
    } finally {
      setAiSimilarLoading(false);
    }
  };

  const handleAiSimilarAnswer = (chosenOpt: number) => {
    if (aiSimilarChecked || !aiSimilarQuestions[aiSimilarIdx]) return;
    setAiSimilarChosen(chosenOpt);
    setAiSimilarChecked(true);
    const isCorrect = chosenOpt === aiSimilarQuestions[aiSimilarIdx].correctOption;
    if (isCorrect) {
      setAiSimilarScore((prev) => prev + 1);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleAiSimilarNext = () => {
    if (aiSimilarIdx < aiSimilarQuestions.length - 1) {
      setAiSimilarIdx((prev) => prev + 1);
      setAiSimilarChosen(null);
      setAiSimilarChecked(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. HERO BANNER WITH MASTERY METRICS                           */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3D3D2D] text-white rounded-[2.5rem] p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-[#F5F2ED]">
              <BookMarked className="w-3.5 h-3.5" />
              <span>
                Sổ tay chẩn đoán & khắc phục lỗ hổng ({currentSubject === 'math' ? 'Toán 9' : 'Tiếng Anh 9'})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Sổ Câu Sai & Luyện Lại Lỗ Hổng
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
              Mỗi câu sai là một kho báu để bạn bứt phá điểm 9–10. Gắn nhãn nguyên nhân sai, ghi lại bài học rút kinh nghiệm và luyện tập đến khi làm chủ 2 lần liên tiếp!
            </p>
          </div>

          {/* Quick Metrics Card */}
          <div className="bg-[#FDFCFB]/95 backdrop-blur-sm text-[#3D3D2D] rounded-[2rem] p-5 border border-[#E8E2D9] shrink-0 w-full lg:w-72 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase text-[#8A8A70] tracking-wider">
                Tỷ lệ làm chủ lỗ hổng
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                {masteryPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#EAE7E0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#E67E22] to-[#8BA888] h-full transition-all duration-500 rounded-full"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0]">
                <span className="text-[10px] text-[#8A8A70] font-bold block uppercase">Cần sửa</span>
                <span className="text-2xl font-black text-[#E67E22]">{unmasteredCount}</span>
              </div>
              <div className="p-2.5 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0]">
                <span className="text-[10px] text-[#8A8A70] font-bold block uppercase">Đã làm chủ</span>
                <span className="text-2xl font-black text-[#8BA888]">{masteredCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. RE-PRACTICE SCREEN (IF PRACTICING)                          */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isPracticing ? (
        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
          {/* Header & Mode Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-[#F5F2ED] flex-wrap gap-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="px-3 py-1 bg-[#5A5A40] text-white text-xs font-bold rounded-xl flex items-center space-x-1">
                {practiceMode === 'shuffled' && <Shuffle className="w-3 h-3 text-amber-300" />}
                {practiceMode === 'streak_mastery' && <Flame className="w-3 h-3 text-orange-400" />}
                {practiceMode === 'standard' && <RotateCcw className="w-3 h-3 text-emerald-300" />}
                <span>
                  {practiceMode === 'shuffled'
                    ? 'Chống học vẹt (Đã đảo A/B/C/D)'
                    : practiceMode === 'streak_mastery'
                    ? 'Thử thách 2 lần đúng'
                    : 'Luyện chuẩn'}
                </span>
              </span>
              <span className="px-3 py-1 bg-[#FAF9F6] text-[#3D3D2D] text-xs font-bold rounded-xl border border-[#EAE7E0]">
                Câu {practiceIdx + 1} / {practiceQuestionsList.length}
              </span>
              <span className="text-xs font-bold text-[#8A8A70] capitalize">
                {currentPracticeItem?.question.topicId.replace('math_', '').replace(/_/g, ' ')}
              </span>
            </div>

            <button
              onClick={() => setIsPracticing(false)}
              className="text-xs font-bold text-[#8A8A70] hover:text-[#3D3D2D] underline cursor-pointer"
            >
              Thoát luyện tập
            </button>
          </div>

          {/* If Session Finished Screen */}
          {practiceCompleted ? (
            <div className="py-10 text-center space-y-5">
              <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-sm">
                🎉
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-[#3D3D2D]">Hoàn Thành Đợt Ôn Luyện Lỗ Hổng!</h3>
                <p className="text-sm text-[#64748B]">
                  Bạn đã trả lời đúng <strong className="text-emerald-700 font-extrabold">{practiceSessionCorrect}</strong> /{' '}
                  {practiceQuestionsList.length} câu hỏi.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  onClick={() => setIsPracticing(false)}
                  className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Quay lại Sổ câu sai
                </button>
                <button
                  onClick={() => handleStartPractice(practiceMode)}
                  className="px-6 py-2.5 bg-[#E8E2D9] text-[#5A5A40] hover:bg-[#D9D2C5] rounded-full text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Luyện lại một lần nữa</span>
                </button>
              </div>
            </div>
          ) : currentPracticeItem ? (
            <>
              {/* Previous note if exists */}
              {mistakes[currentPracticeItem.question.id]?.userNote && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 flex items-start space-x-2">
                  <span className="text-base">💡</span>
                  <div>
                    <strong className="block font-bold">Ghi chú của bạn từ lần làm trước:</strong>
                    <span>"{mistakes[currentPracticeItem.question.id].userNote}"</span>
                  </div>
                </div>
              )}

              {/* Passage if exists */}
              {currentPracticeItem.question.passage && (
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs sm:text-sm text-[#4A4A4A] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                  {currentPracticeItem.question.passage}
                </div>
              )}

              {/* Question Content */}
              <div className="text-base sm:text-lg font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
                {currentPracticeItem.question.content}
              </div>

              {/* Options (Shuffled if in anti-guess mode) */}
              <div className="space-y-2.5">
                {currentPracticeItem.shuffledOptions.map((opt, idx) => {
                  const isSelected = chosenAnswer === idx;
                  const isCorrectOpt = idx === currentPracticeItem.correctOptionIndex;

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
                      <span className="whitespace-pre-line">
                        <strong className="mr-2 text-[#5A5A40]">{String.fromCharCode(65 + idx)}.</strong>
                        {opt}
                      </span>
                      {hasChecked && isCorrectOpt && (
                        <CheckCircle2 className="w-5 h-5 text-[#8BA888] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation if checked */}
              {hasChecked && (
                <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] space-y-3 text-xs text-[#3D3D2D] animate-in fade-in">
                  <div className="font-bold flex items-center justify-between text-[#5A5A40]">
                    <div className="flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Giải thích cặn kẽ:</span>
                    </div>

                    <button
                      onClick={() => setSelectedQuestionForAi(currentPracticeItem.question)}
                      className="text-[11px] font-extrabold text-blue-700 hover:text-blue-900 flex items-center space-x-1 underline cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Nhờ AI Gia sư phân tích sâu</span>
                    </button>
                  </div>

                  <p className="leading-relaxed whitespace-pre-line">
                    {currentPracticeItem.question.explanation}
                  </p>

                  {currentPracticeItem.question.grammarRule && (
                    <div className="font-mono text-[11px] bg-white p-3 rounded-xl text-[#3D3D2D] border border-[#D9D2C5] whitespace-pre-line">
                      <strong>Công thức / Quy tắc:</strong> {currentPracticeItem.question.grammarRule}
                    </div>
                  )}

                  {currentPracticeItem.question.commonMistakeTip && (
                    <div className="p-2.5 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200">
                      <strong>⚠️ Bẫy đề thi cần nhớ:</strong> {currentPracticeItem.question.commonMistakeTip}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action bar */}
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
                    className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>{practiceIdx < practiceQuestionsList.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        /* ═════════════════════════════════════════════════════════════ */
        /* 3. MAIN DASHBOARD VIEW (NOTEBOOK / ANALYTICS TABS)            */
        /* ═════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex bg-[#E8E2D9] p-1 rounded-2xl text-xs font-bold gap-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('notebook')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'notebook'
                    ? 'bg-white text-[#3D3D2D] shadow-xs'
                    : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                }`}
              >
                <BookMarked className="w-4 h-4" />
                <span>Sổ Câu Sai & Ghi Chú ({filteredMistakes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'analytics'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#5A5A40] hover:text-[#3D3D2D]'
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Chẩn Đoán Lỗ Hổng Kiến Thức</span>
              </button>
            </div>

            {/* Action Buttons for Smart Practice Launch */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleStartPractice('shuffled')}
                disabled={filteredMistakes.length === 0}
                className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Tự động đảo vị trí đáp án để chống nhớ vẹt"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-300" />
                <span>Luyện Xáo Trộn Đáp Án ({filteredMistakes.length})</span>
              </button>

              <button
                onClick={() => handleStartPractice('streak_mastery')}
                disabled={unmasteredCount === 0}
                className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-40 text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                title="Luyện các câu chưa làm chủ đến khi đúng 2 lần liên tiếp"
              >
                <Flame className="w-3.5 h-3.5 text-yellow-200" />
                <span>Thử Thách 2 Lần Đúng ({unmasteredCount})</span>
              </button>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 1: NOTEBOOK & CARD LIST                                   */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'notebook' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-[#8A8A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo nội dung, giải thích, ghi chú..."
                      className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs text-[#3D3D2D] outline-hidden placeholder:text-[#8A8A70] focus:border-[#5A5A40]"
                    />
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center space-x-1 bg-[#F5F2ED] p-1 rounded-2xl text-xs font-bold w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setFilterStatus('unmastered')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        filterStatus === 'unmastered'
                          ? 'bg-[#E67E22] text-white shadow-xs'
                          : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                      }`}
                    >
                      Chưa sửa ({unmasteredCount})
                    </button>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        filterStatus === 'all'
                          ? 'bg-[#5A5A40] text-white shadow-xs'
                          : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                      }`}
                    >
                      Tất cả ({totalMistakesCount})
                    </button>
                    <button
                      onClick={() => setFilterStatus('mastered')}
                      className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                        filterStatus === 'mastered'
                          ? 'bg-[#8BA888] text-white shadow-xs'
                          : 'text-[#6B6B54] hover:text-[#3D3D2D]'
                      }`}
                    >
                      Đã làm chủ ({masteredCount})
                    </button>
                  </div>
                </div>

                {/* Dropdowns Row: Topic, Reason, Sort */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-[#F5F2ED] text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Topic Select */}
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-medium text-[#4A4A4A] outline-hidden cursor-pointer"
                    >
                      <option value="all">📂 Tất cả chuyên đề</option>
                      {currentTopicsMeta.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nameVi}
                        </option>
                      ))}
                    </select>

                    {/* Reason Filter Select */}
                    <select
                      value={filterReason}
                      onChange={(e) => setFilterReason(e.target.value)}
                      className="px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-medium text-[#4A4A4A] outline-hidden cursor-pointer"
                    >
                      <option value="all">🎯 Tất cả nguyên nhân sai</option>
                      {Object.entries(REASON_CONFIG).map(([rk, rv]) => (
                        <option key={rk} value={rk}>
                          {rv.icon} {rv.label}
                        </option>
                      ))}
                    </select>

                    {/* Sort Select */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="px-3 py-1.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-medium text-[#4A4A4A] outline-hidden cursor-pointer"
                    >
                      <option value="urgency">⚡ Ưu tiên câu sai nhiều nhất</option>
                      <option value="newest">🕒 Mới làm sai gần đây</option>
                      <option value="topic">📚 Gom theo chuyên đề</option>
                    </select>
                  </div>

                  {masteredCount > 0 && (
                    <button
                      onClick={clearMasteredMistakes}
                      className="px-3 py-1 text-xs text-[#8A8A70] hover:text-[#E67E22] rounded-xl border border-[#EAE7E0] transition cursor-pointer"
                    >
                      Dọn dẹp câu đã sửa
                    </button>
                  )}
                </div>
              </div>

              {/* Mistake Cards List */}
              {filteredMistakes.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-[2rem] bg-[#EBF2EB] text-[#8BA888] flex items-center justify-center mx-auto text-2xl">
                    ✨
                  </div>
                  <h3 className="font-bold text-[#3D3D2D] text-base">Tuyệt vời! Không tìm thấy câu sai nào</h3>
                  <p className="text-xs text-[#8A8A70] max-w-sm mx-auto">
                    Tất cả câu hỏi trong bộ lọc đều đã được bạn khắc phục hoàn hảo. Hãy tiếp tục luyện thêm các đề mới!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMistakes.map(({ question: q, wrongCount, mastered, consecutiveCorrect, userNote, reason }) => {
                    const rCfg = REASON_CONFIG[reason || 'knowledge_gap'] || REASON_CONFIG.other;
                    const isEditingNote = editingNoteId === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`p-6 rounded-[2rem] bg-white border transition-all ${
                          mastered ? 'border-[#8BA888] bg-[#FAF9F6]/60' : 'border-[#EAE7E0] shadow-2xs hover:border-[#D9D2C5]'
                        }`}
                      >
                        {/* Top Badges & Actions */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <span className="px-2.5 py-0.5 bg-[#FDF2E9] text-[#E67E22] rounded-lg text-xs font-bold border border-[#E8C07D]">
                              Sai {wrongCount} lần
                            </span>

                            {/* Consecutive correct streak badge */}
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 flex items-center space-x-1">
                              <span>Đúng liên tiếp: {consecutiveCorrect || 0}/2</span>
                              {consecutiveCorrect >= 2 && <Check className="w-3 h-3 text-emerald-600" />}
                            </span>

                            {/* Topic Name */}
                            <span className="text-xs font-semibold text-[#8A8A70] capitalize">
                              {q.topicId.replace('math_', '').replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {/* Toggle Mastered */}
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

                            {/* Remove button */}
                            <button
                              onClick={() => removeMistake(q.id)}
                              className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                              title="Xóa câu này khỏi sổ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="mt-3 text-sm font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
                          {q.content}
                        </div>

                        {/* Options Grid */}
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
                                <span>
                                  <strong className="mr-1.5 text-[#5A5A40]">{String.fromCharCode(65 + oIdx)}.</strong>
                                  {opt}
                                </span>
                                {isCorrect && <Check className="w-4 h-4 text-[#8BA888] shrink-0 ml-1" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation & Rules */}
                        <div className="mt-3 p-4 bg-[#FAF9F6] rounded-2xl text-xs text-[#3D3D2D] space-y-2.5 border border-[#EAE7E0]">
                          <p className="leading-relaxed font-medium whitespace-pre-line">
                            <strong className="text-[#5A5A40]">Giải thích chi tiết:</strong> {q.explanation}
                          </p>

                          {q.grammarRule && (
                            <p className="font-mono text-[11px] text-[#5A5A40] bg-white p-2.5 rounded-xl border border-[#D9D2C5] whitespace-pre-line">
                              <strong>Công thức / Quy tắc:</strong> {q.grammarRule}
                            </p>
                          )}

                          {q.commonMistakeTip && (
                            <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 whitespace-pre-line">
                              <strong>⚠️ Bẫy đề thi:</strong> {q.commonMistakeTip}
                            </p>
                          )}

                          {/* ─── ERROR REASON TAGGER & PERSONAL NOTES SECTION ─── */}
                          <div className="pt-3 border-t border-[#EAE7E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                            {/* Error Reason Dropdown / Badge */}
                            <div className="flex items-center space-x-2">
                              <span className="text-[11px] font-bold text-[#8A8A70]">Nguyên nhân sai:</span>
                              <select
                                value={reason || 'knowledge_gap'}
                                onChange={(e) => updateMistakeReason(q.id, e.target.value as MistakeReason)}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border outline-hidden cursor-pointer ${rCfg.bg} ${rCfg.text} ${rCfg.border}`}
                              >
                                {Object.entries(REASON_CONFIG).map(([rk, rv]) => (
                                  <option key={rk} value={rk}>
                                    {rv.icon} {rv.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Note Action Trigger */}
                            <button
                              onClick={() => {
                                setEditingNoteId(isEditingNote ? null : q.id);
                                setTempNoteText(userNote || '');
                              }}
                              className="text-[11px] font-bold text-[#5A5A40] hover:text-[#3D3D2D] flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{userNote ? 'Sửa ghi chú rút kinh nghiệm' : '+ Viết ghi chú cá nhân'}</span>
                            </button>
                          </div>

                          {/* Display User Note */}
                          {userNote && !isEditingNote && (
                            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <span className="font-bold text-[11px] text-amber-900 block">Bài học rút ra:</span>
                                <span>{userNote}</span>
                              </div>
                            </div>
                          )}

                          {/* Note Inline Form */}
                          {isEditingNote && (
                            <div className="space-y-2 p-3 bg-white rounded-xl border border-[#D9D2C5]">
                              <span className="text-[11px] font-bold text-[#3D3D2D] block">
                                Ghi lại bài học rút ra để không bao giờ sai lại:
                              </span>
                              <textarea
                                value={tempNoteText}
                                onChange={(e) => setTempNoteText(e.target.value)}
                                placeholder="Ví dụ: Cần chú ý điều kiện x >= 0 trước khi bình phương hai vế..."
                                className="w-full p-2 text-xs border border-[#EAE7E0] rounded-xl outline-hidden focus:border-[#5A5A40] resize-none h-16"
                              />
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setEditingNoteId(null)}
                                  className="px-3 py-1 text-xs text-[#8A8A70] rounded-lg cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => {
                                    updateMistakeNote(q.id, tempNoteText.trim());
                                    setEditingNoteId(null);
                                  }}
                                  className="px-3.5 py-1 bg-[#5A5A40] text-white rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Lưu ghi chú
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons: AI Deep Tutor & AI Clone Drill */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#EAE7E0] flex-wrap gap-2">
                            <button
                              onClick={() => handleOpenAiSimilarDrill(q)}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                              title="Tạo ngay 3 câu hỏi cùng dạng để luyện xóa lỗ hổng"
                            >
                              <Brain className="w-3.5 h-3.5 text-purple-600" />
                              <span>🤖 AI Luyện 3 Câu Tương Tự</span>
                            </button>

                            <button
                              onClick={() => setSelectedQuestionForAi(q)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                              <span>🤖 Nhờ AI Gia Sư Giảng Kỹ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* TAB 2: KNOWLEDGE GAP DIAGNOSTICS & ANALYTICS                  */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-[2rem] bg-white border border-[#EAE7E0] shadow-sm space-y-1">
                  <span className="text-[11px] font-bold uppercase text-[#8A8A70]">Tổng số lỗi đã ghi nhận</span>
                  <p className="text-3xl font-black text-[#3D3D2D]">{totalMistakesCount}</p>
                  <p className="text-xs text-[#8A8A70]">Tất cả câu hỏi bạn từng làm sai</p>
                </div>

                <div className="p-5 rounded-[2rem] bg-white border border-[#EAE7E0] shadow-sm space-y-1">
                  <span className="text-[11px] font-bold uppercase text-[#8A8A70]">Lỗ hổng chưa khắc phục</span>
                  <p className="text-3xl font-black text-[#E67E22]">{unmasteredCount}</p>
                  <p className="text-xs text-[#8A8A70]">Cần làm đúng 2 lần liên tiếp</p>
                </div>

                <div className="p-5 rounded-[2rem] bg-white border border-[#EAE7E0] shadow-sm space-y-1">
                  <span className="text-[11px] font-bold uppercase text-[#8A8A70]">Tỷ lệ làm chủ điểm yếu</span>
                  <p className="text-3xl font-black text-[#8BA888]">{masteryPercentage}%</p>
                  <p className="text-xs text-[#8A8A70]">Đã biến {masteredCount} câu sai thành điểm mạnh</p>
                </div>
              </div>

              {/* 1. Weak Topics Priority Table */}
              <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-[#EAE7E0] shadow-sm space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[#3D3D2D] flex items-center space-x-2">
                      <ShieldAlert className="w-5 h-5 text-[#E67E22]" />
                      <span>Xếp Hạng Chuyên Đề Cần Khắc Phục Gấp</span>
                    </h3>
                    <p className="text-xs text-[#8A8A70]">
                      Các chuyên đề có nhiều câu chưa làm chủ nhất được ưu tiên xếp lên đầu.
                    </p>
                  </div>
                </div>

                {topicBreakdown.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#8A8A70]">Chưa có dữ liệu câu sai để phân tích.</p>
                ) : (
                  <div className="space-y-3">
                    {topicBreakdown.map((item) => (
                      <div
                        key={item.topicId}
                        className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-[200px]">
                          <div className="flex items-center space-x-2">
                            <span className="text-base">{item.icon}</span>
                            <span className="font-bold text-xs sm:text-sm text-[#3D3D2D]">{item.nameVi}</span>
                          </div>
                          <div className="text-xs text-[#8A8A70]">
                            Chưa sửa: <strong className="text-[#E67E22]">{item.unmastered}</strong> • Đã làm chủ:{' '}
                            <strong className="text-[#8BA888]">{item.mastered}</strong> / {item.total} câu
                          </div>
                        </div>

                        {/* Progress Bar & Action */}
                        <div className="flex items-center space-x-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="w-32 sm:w-44 bg-[#EAE7E0] h-2.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-[#8BA888] h-full rounded-full transition-all"
                              style={{ width: `${item.rate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#5A5A40] w-10 text-right">{item.rate}%</span>

                          <button
                            onClick={() => {
                              const topicQuestions = mistakeList
                                .filter((m) => m.question.topicId === item.topicId)
                                .map((m) => m.question);
                              handleStartPractice('shuffled', topicQuestions);
                            }}
                            className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                          >
                            Luyện chuyên đề này
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Error Reasons Breakdown */}
              <div className="p-6 sm:p-8 rounded-[2.5rem] bg-white border border-[#EAE7E0] shadow-sm space-y-5">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#3D3D2D] flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <span>Phân Tích Nguyên Nhân Sai Sót (Root Cause Analysis)</span>
                  </h3>
                  <p className="text-xs text-[#8A8A70]">
                    Biết rõ bạn hay sai do đọc ẩu hay thiếu kiến thức giúp điều chỉnh phương pháp làm bài hiệu quả hơn.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reasonBreakdown.map((item) => (
                    <div
                      key={item.reason}
                      className={`p-4 rounded-2xl border ${item.config.bg} ${item.config.border} space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-base">{item.config.icon}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white border border-[#EAE7E0] text-[#3D3D2D]">
                          {item.percent}%
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#3D3D2D]">{item.config.label}</h4>
                        <p className="text-xs text-[#64748B] mt-0.5">{item.count} câu hỏi mắc lỗi này</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: AI SIMILAR QUESTIONS DRILL (Luyện 3 câu cùng dạng)   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {aiSimilarModalOpen && aiSimilarBaseQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D]">
                    AI Clone Drill: Luyện Câu Hỏi Cùng Dạng
                  </h3>
                  <p className="text-[11px] text-[#8A8A70]">
                    Kiểm tra độ hiểu sâu bản chất với các câu hỏi tương đương
                  </p>
                </div>
              </div>

              <button
                onClick={() => setAiSimilarModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF9F6] text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {aiSimilarLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#5A5A40]">
                  AI đang biên soạn 3 câu hỏi tương tự cùng dạng bài và bẫy đề...
                </p>
              </div>
            ) : aiSimilarQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#8A8A70]">
                  <span>
                    Câu {aiSimilarIdx + 1} / {aiSimilarQuestions.length}
                  </span>
                  <span className="text-purple-700">Điểm đúng: {aiSimilarScore}</span>
                </div>

                {/* Question */}
                <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs sm:text-sm font-bold text-[#3D3D2D] whitespace-pre-line">
                  {aiSimilarQuestions[aiSimilarIdx].content}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {aiSimilarQuestions[aiSimilarIdx].options.map((opt, oIdx) => {
                    const isSelected = aiSimilarChosen === oIdx;
                    const isCorrect = oIdx === aiSimilarQuestions[aiSimilarIdx].correctOption;

                    let style = 'bg-white border-[#EAE7E0] hover:bg-[#FAF9F6] text-[#3D3D2D]';
                    if (aiSimilarChecked) {
                      if (isCorrect) {
                        style = 'bg-emerald-100 border-emerald-500 font-bold text-emerald-900';
                      } else if (isSelected && !isCorrect) {
                        style = 'bg-red-100 border-red-500 text-red-900 line-through';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleAiSimilarAnswer(oIdx)}
                        disabled={aiSimilarChecked}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm transition flex items-center justify-between cursor-pointer ${style}`}
                      >
                        <span>
                          <strong className="mr-2">{String.fromCharCode(65 + oIdx)}.</strong>
                          {opt}
                        </span>
                        {aiSimilarChecked && isCorrect && <Check className="w-4 h-4 text-emerald-700" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {aiSimilarChecked && (
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1.5">
                    <strong className="block font-bold">Giải thích đáp án:</strong>
                    <p className="leading-relaxed">{aiSimilarQuestions[aiSimilarIdx].explanation}</p>
                    {aiSimilarQuestions[aiSimilarIdx].grammarRule && (
                      <p className="font-mono text-[11px] bg-white p-2 rounded-xl border border-purple-200">
                        {aiSimilarQuestions[aiSimilarIdx].grammarRule}
                      </p>
                    )}
                  </div>
                )}

                {/* Modal footer */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  {aiSimilarChecked && aiSimilarIdx < aiSimilarQuestions.length - 1 ? (
                    <button
                      onClick={handleAiSimilarNext}
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : aiSimilarChecked ? (
                    <button
                      onClick={() => setAiSimilarModalOpen(false)}
                      className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Hoàn thành luyện tập
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-xs text-center py-6 text-[#8A8A70]">
                Không tạo được câu hỏi tương tự. Vui lòng thử lại sau.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 5. AI QUESTION EXPLAINER MODAL                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {selectedQuestionForAi && (
        <AiQuestionExplainerModal
          question={selectedQuestionForAi}
          onClose={() => setSelectedQuestionForAi(null)}
        />
      )}
    </div>
  );
};
