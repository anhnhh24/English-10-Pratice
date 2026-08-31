import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { SENTENCE_REWRITE_PROBLEMS } from '../../data/sentenceRewriteData';
import { Question, TopicId, SentenceRewriteProblem, SentenceGradingResult } from '../../types';
import {
  generateExamWithAI,
  getStoredApiKey,
} from '../../services/aiExamService';
import { evaluateSentenceRewriteWithAI } from '../../services/aiSentenceGradingService';
import { QuickVocabNoteModal } from '../common/QuickVocabNoteModal';
import {
  CheckCircle2,
  XCircle,
  BookOpen,
  Bookmark,
  RotateCcw,
  ChevronRight,
  Award,
  ArrowLeft,
  Wand2,
  Sparkles,
  RefreshCw,
  Zap,
  Lightbulb,
  AlertTriangle,
  PenTool,
  Check,
  Send,
  HelpCircle,
  BookMarked,
  Layers,
  ArrowRight,
  CheckCheck,
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
  const {
    currentSubject,
    questions,
    recordAnswerResult,
    savePracticeSession,
    toggleBookmark,
    isBookmarked,
    bulkImportQuestions,
  } = useApp();

  const currentTopicsMeta = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;
  const defaultTopic: TopicId = currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar';

  const [selectedTopic, setSelectedTopic] = useState<TopicId>(
    (initialTopicId as TopicId) || defaultTopic
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Practice Mode: 'quiz' (Trắc nghiệm) or 'essay' (Tự luận viết lại câu)
  const [practiceMode, setPracticeMode] = useState<'quiz' | 'essay'>('quiz');

  // Active Multiple-Choice practice session states
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Active Sentence Rewrite Essay states
  const [essayProblems, setEssayProblems] = useState<SentenceRewriteProblem[]>([]);
  const [essayIdx, setEssayIdx] = useState<number>(0);
  const [studentEssayInput, setStudentEssayInput] = useState<string>('');
  const [essayResults, setEssayResults] = useState<Record<string, SentenceGradingResult>>({});
  const [isGradingEssay, setIsGradingEssay] = useState<boolean>(false);
  const [essayFinished, setEssayFinished] = useState<boolean>(false);

  // Quick Vocab Modal State
  const [vocabModalOpen, setVocabModalOpen] = useState<boolean>(false);
  const [vocabModalWord, setVocabModalWord] = useState<string>('');
  const [vocabModalContext, setVocabModalContext] = useState<string>('');
  const [vocabModalSource, setVocabModalSource] = useState<string>('Luyện chuyên đề');

  // Floating text selection state
  const [selectedText, setSelectedText] = useState<string>('');
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);

  // Listen for text selection
  useEffect(() => {
    const handleSelection = () => {
      if (typeof window === 'undefined') return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const text = sel.toString().trim();
        if (text.length >= 2 && text.length <= 60 && !text.includes('\n')) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectedText(text);
          setFloatingPos({
            x: Math.max(10, Math.min(window.innerWidth - 160, rect.left + rect.width / 2 - 60)),
            y: Math.max(10, rect.top - 42 + window.scrollY),
          });
          return;
        }
      }
      setFloatingPos(null);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const openVocabModalWithSelection = () => {
    if (!selectedText) return;
    setVocabModalWord(selectedText);
    setVocabModalContext(
      practiceMode === 'essay' && essayProblems[essayIdx]
        ? essayProblems[essayIdx].originalSentence
        : currentQ?.content || ''
    );
    setVocabModalSource(
      `Chuyên đề: ${currentTopicsMeta.find((t) => t.id === selectedTopic)?.nameVi || 'Luyện tập'}`
    );
    setVocabModalOpen(true);
    setFloatingPos(null);
  };

  // Update selected topic & reset practice state when subject changes
  useEffect(() => {
    setIsPracticing(false);
    setIsFinished(false);
    setEssayFinished(false);
    setUserAnswers({});
    setCheckedQuestions({});
    setEssayResults({});
    setStudentEssayInput('');
    setCurrentIdx(0);
    setEssayIdx(0);

    if (initialTopicId) {
      setSelectedTopic(initialTopicId as TopicId);
      if (initialTopicId === 'sentence_rewrite') {
        setPracticeMode('essay');
      } else {
        setPracticeMode('quiz');
      }
    } else {
      setSelectedTopic(currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar');
      setPracticeMode('quiz');
    }
  }, [currentSubject, initialTopicId]);

  // When switching topic to sentence_rewrite, default to essay mode
  useEffect(() => {
    if (selectedTopic === 'sentence_rewrite') {
      setPracticeMode('essay');
    } else {
      setPracticeMode('quiz');
    }
  }, [selectedTopic]);

  // AI Topic Generator States
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>('');
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiDifficulty, setAiDifficulty] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);

  const isMath = currentSubject === 'math';
  const theme = {
    primaryBg: isMath ? 'bg-[#1E3A8A]' : 'bg-[#5A5A40]',
    primaryText: isMath ? 'text-[#1E3A8A]' : 'text-[#5A5A40]',
    accentBg: isMath ? 'bg-[#2563EB]' : 'bg-[#8BA888]',
    accentColor: isMath ? 'text-[#2563EB]' : 'text-[#8BA888]',
    selectedBorder: isMath ? 'border-[#1E3A8A]' : 'border-[#5A5A40]',
  };

  // Filter pool for multiple-choice
  const topicQuestionsPool = questions.filter((q) => {
    if ((q.subject || 'english') !== currentSubject) return false;
    if (q.topicId !== selectedTopic) return false;
    if (selectedDifficulty !== 'all' && q.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // Filter pool for Sentence Rewrite Essay
  const essayProblemsPool = SENTENCE_REWRITE_PROBLEMS.filter((p) => {
    if (selectedDifficulty !== 'all' && p.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // START MULTIPLE-CHOICE PRACTICE
  const handleStartPractice = () => {
    if (selectedTopic === 'sentence_rewrite' && practiceMode === 'essay') {
      handleStartEssayPractice();
      return;
    }

    const shuffled = [...topicQuestionsPool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (picked.length === 0) {
      const allInTopic = questions.filter(
        (q) => (q.subject || 'english') === currentSubject && q.topicId === selectedTopic
      );
      picked.push(...allInTopic.slice(0, questionCount));
    }

    if (picked.length === 0) {
      alert('Chuyên đề này hiện chưa có câu hỏi trong ngân hàng. Bạn hãy nhấn "Tạo Câu Hỏi Bằng AI" để hệ thống tự động sinh bộ câu hỏi mới nhé!');
      return;
    }

    setPracticeQuestions(picked);
    setCurrentIdx(0);
    setUserAnswers({});
    setCheckedQuestions({});
    setIsFinished(false);
    setIsPracticing(true);
    setStartTime(Date.now());
  };

  // START ESSAY PRACTICE
  const handleStartEssayPractice = () => {
    const shuffled = [...essayProblemsPool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    if (picked.length === 0) {
      picked.push(...SENTENCE_REWRITE_PROBLEMS.slice(0, questionCount));
    }

    setEssayProblems(picked);
    setEssayIdx(0);
    setStudentEssayInput('');
    setEssayResults({});
    setEssayFinished(false);
    setIsPracticing(true);
    setStartTime(Date.now());
  };

  // AI GENERATION HANDLER
  const handleGenerateWithAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiStatusMsg('Đang gửi yêu cầu đến Gemini AI...');
    try {
      const currentMeta = currentTopicsMeta.find((t) => t.id === selectedTopic);
      const apiKey = getStoredApiKey();
      const res = await generateExamWithAI(
        apiKey,
        {
          subject: currentSubject,
          title: `Luyện Chuyên Đề: ${currentMeta?.nameVi || selectedTopic} (Tạo bởi AI)`,
          difficulty: aiDifficulty,
          totalQuestions: aiCount,
          timeLimitMinutes: 30,
          focusTopics: [selectedTopic],
          customPrompt: aiCustomPrompt
            ? `Chỉ tạo các câu hỏi thuộc chuyên đề ${currentMeta?.nameVi}. Yêu cầu trọng tâm: ${aiCustomPrompt}`
            : `Chỉ tạo các câu hỏi thuộc chuyên đề ${currentMeta?.nameVi} chuẩn cấu trúc đề tuyển sinh vào lớp 10.`,
        },
        (msg) => setAiStatusMsg(msg)
      );

      // Save generated questions
      bulkImportQuestions(res.questions);

      // Start session immediately
      setPracticeQuestions(res.questions);
      setCurrentIdx(0);
      setUserAnswers({});
      setCheckedQuestions({});
      setIsFinished(false);
      setIsPracticing(true);
      setShowAiModal(false);
      setStartTime(Date.now());
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Lỗi khi tạo câu hỏi với AI. Vui lòng kiểm tra lại kết nối API.');
    } finally {
      setAiLoading(false);
    }
  };

  // MULTIPLE CHOICE HANDLERS
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
    const scorePct = totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0;

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

  // ESSAY PRACTICE HANDLERS
  const currentEssay = essayProblems[essayIdx];
  const currentEssayResult = currentEssay ? essayResults[currentEssay.id] : undefined;

  const handleGradeCurrentEssay = async () => {
    if (!currentEssay || !studentEssayInput.trim() || isGradingEssay) return;

    setIsGradingEssay(true);
    try {
      const res = await evaluateSentenceRewriteWithAI(currentEssay, studentEssayInput);
      setEssayResults((prev) => ({ ...prev, [currentEssay.id]: res }));
      if (res.isCorrect && res.score >= 8.5) {
        confetti({ particleCount: 40, spread: 50 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGradingEssay(false);
    }
  };

  const handleNextEssay = () => {
    if (essayIdx < essayProblems.length - 1) {
      setEssayIdx((prev) => prev + 1);
      setStudentEssayInput('');
    } else {
      finishEssayPractice();
    }
  };

  const finishEssayPractice = () => {
    let totalScore = 0;
    let correctCount = 0;
    essayProblems.forEach((p) => {
      const res = essayResults[p.id];
      if (res) {
        totalScore += res.score;
        if (res.isCorrect || res.score >= 8.0) correctCount += 1;
      }
    });

    const totalQ = essayProblems.length;
    const avgScore = totalQ > 0 ? totalScore / totalQ : 0;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const scorePct = Math.round(avgScore * 10);

    savePracticeSession({
      subject: currentSubject,
      type: 'topic',
      topicId: 'sentence_rewrite',
      date: new Date().toISOString(),
      totalQuestions: totalQ,
      correctCount,
      scorePercent: scorePct,
      timeSpentSeconds: timeSpent,
      questionIds: essayProblems.map((p) => p.id),
      userAnswers: {},
    });

    setEssayFinished(true);
    if (scorePct >= 70) {
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  // ═══════════════════════════════════════════════
  // 1. CONFIGURATION VIEW
  // ═══════════════════════════════════════════════
  if (!isPracticing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Floating Quick Vocab Note Pill */}
        {floatingPos && selectedText && (
          <div
            style={{ top: `${floatingPos.y}px`, left: `${floatingPos.x}px` }}
            className="fixed z-50 bg-[#3D3D2D] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center space-x-1.5 animate-in fade-in cursor-pointer hover:bg-black"
            onClick={openVocabModalWithSelection}
          >
            <BookMarked className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Note từ mới: "{selectedText.slice(0, 15)}..."</span>
          </div>
        )}

        <QuickVocabNoteModal
          isOpen={vocabModalOpen}
          onClose={() => setVocabModalOpen(false)}
          initialWord={vocabModalWord}
          contextSentence={vocabModalContext}
          sourceTitle={vocabModalSource}
        />

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
              Chủ động lựa chọn nội dung kiến thức, chế độ tự luận hoặc trắc nghiệm để ôn luyện
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
              const countInBank =
                t.id === 'sentence_rewrite'
                  ? `${SENTENCE_REWRITE_PROBLEMS.length} câu tự luận`
                  : `${questions.filter((q) => (q.subject || 'english') === currentSubject && q.topicId === t.id).length} câu`;

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
                        {countInBank}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm leading-tight flex items-center space-x-1.5">
                      <span>{t.nameVi}</span>
                      {t.id === 'sentence_rewrite' && (
                        <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 text-[9px] font-black rounded-md uppercase tracking-wider">
                          Tự Luận AI
                        </span>
                      )}
                    </h4>
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

        {/* Special Essay Mode Toggle for Sentence Rewriting */}
        {selectedTopic === 'sentence_rewrite' && currentSubject === 'english' && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-[2rem] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PenTool className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-bold text-blue-900">
                  Chế độ Làm Bài Cho Chuyên Đề Viết Lại Câu:
                </h4>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                AI Chấm & Sửa Lỗi Chi Tiết
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPracticeMode('essay')}
                className={`p-3 rounded-2xl border text-left font-bold transition cursor-pointer flex items-center space-x-2.5 ${
                  practiceMode === 'essay'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-100/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${practiceMode === 'essay' ? 'bg-white/20' : 'bg-blue-100'}`}>
                  ✍️
                </div>
                <div>
                  <p className="text-xs">Chế Độ Tự Luận (Khuyên dùng)</p>
                  <p className="text-[10px] font-normal opacity-85">Tự gõ câu viết lại, AI chấm điểm 10/10</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPracticeMode('quiz')}
                className={`p-3 rounded-2xl border text-left font-bold transition cursor-pointer flex items-center space-x-2.5 ${
                  practiceMode === 'quiz'
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                    : 'bg-white text-[#4A4A4A] border-[#EAE7E0] hover:bg-[#FAF9F6]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${practiceMode === 'quiz' ? 'bg-white/20' : 'bg-[#F5F2ED]'}`}>
                  🔘
                </div>
                <div>
                  <p className="text-xs">Chế Độ Trắc Nghiệm</p>
                  <p className="text-[10px] font-normal opacity-85">Chọn 1 trong 4 đáp án A, B, C, D</p>
                </div>
              </button>
            </div>
          </div>
        )}

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

            <div className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between ${isMath ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-[#FAF9F6] text-[#5A5A40] border border-[#D9D2C5]'}`}>
              <span>
                {selectedTopic === 'sentence_rewrite' && practiceMode === 'essay'
                  ? `Có ${essayProblemsPool.length} câu tự luận viết lại câu chuẩn thi vào 10.`
                  : `Có ${topicQuestionsPool.length} câu hỏi có sẵn trong kho đề.`}
              </span>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartPractice}
          id="btn-start-topic-practice"
          className={`w-full py-4 ${selectedTopic === 'sentence_rewrite' && practiceMode === 'essay' ? 'bg-blue-600 hover:bg-blue-700' : theme.primaryBg} hover:opacity-90 text-white rounded-[2rem] text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer`}
        >
          <span>
            {selectedTopic === 'sentence_rewrite' && practiceMode === 'essay'
              ? `Bắt đầu Luyện Tự Luận Viết Lại Câu (AI Chấm Điểm)`
              : `Bắt đầu Luyện tập (${topicQuestionsPool.length} câu có sẵn)`}
          </span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // 2. ESSAY PRACTICE SESSION VIEW (Viết lại câu Tự luận)
  // ═══════════════════════════════════════════════
  if (isPracticing && !essayFinished && practiceMode === 'essay' && currentEssay) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-12">
        {/* Floating Quick Vocab Note Pill */}
        {floatingPos && selectedText && (
          <div
            style={{ top: `${floatingPos.y}px`, left: `${floatingPos.x}px` }}
            className="fixed z-50 bg-[#3D3D2D] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center space-x-1.5 animate-in fade-in cursor-pointer hover:bg-black"
            onClick={openVocabModalWithSelection}
          >
            <BookMarked className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Note từ mới: "{selectedText.slice(0, 15)}..."</span>
          </div>
        )}

        <QuickVocabNoteModal
          isOpen={vocabModalOpen}
          onClose={() => setVocabModalOpen(false)}
          initialWord={vocabModalWord}
          contextSentence={vocabModalContext || currentEssay.originalSentence}
          sourceTitle={`Chuyên đề Viết lại câu`}
        />

        {/* Top Control Bar */}
        <div className="bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-xl">
              Câu {essayIdx + 1}/{essayProblems.length} (Tự luận)
            </span>
            <span className="text-xs font-bold text-[#3D3D2D] capitalize">
              {currentEssay.subTopicTitleVi}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setVocabModalWord(currentEssay.originalSentence.slice(0, 20));
                setVocabModalContext(currentEssay.originalSentence);
                setVocabModalOpen(true);
              }}
              title="Lưu từ mới vào Sổ tay"
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#FAF9F6] border border-[#EAE7E0] text-[#5A5A40] rounded-xl text-xs font-bold hover:bg-[#EAE7E0] transition cursor-pointer"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#8BA888]" />
              <span className="hidden sm:inline">Note từ mới</span>
            </button>
            <button
              onClick={() => setIsPracticing(false)}
              className="text-xs font-bold text-[#8A8A70] hover:text-[#3D3D2D] underline px-2 cursor-pointer"
            >
              Thoát
            </button>
          </div>
        </div>

        {/* Essay Problem Box */}
        <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-5">
          {/* Header Tag */}
          <div className="flex items-center justify-between pb-2 border-b border-[#F5F2ED]">
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-bold">
              {currentEssay.sourceExam || 'Đề thi Tuyển sinh vào 10'}
            </span>
            {currentEssay.keyword && (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md text-[11px] font-bold">
                Từ bắt buộc dùng: <strong className="font-mono">{currentEssay.keyword}</strong>
              </span>
            )}
          </div>

          {/* Original Sentence */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#8A8A70] uppercase tracking-wider">
              Câu gốc (Original Sentence):
            </label>
            <div className="p-4 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl text-sm sm:text-base font-bold text-[#3D3D2D] leading-relaxed">
              "{currentEssay.originalSentence}"
            </div>
          </div>

          {/* Given Beginning Prompt */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#8A8A70] uppercase tracking-wider flex items-center space-x-1">
              <PenTool className="w-3.5 h-3.5 text-blue-600" />
              <span>Viết lại câu bắt đầu bằng:</span>
            </label>

            {currentEssay.givenBeginning && (
              <div className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1.5 rounded-xl inline-block border border-blue-200">
                Gợi ý đầu câu: <strong>"{currentEssay.givenBeginning}..."</strong>
              </div>
            )}

            <div className="relative">
              <textarea
                rows={3}
                value={studentEssayInput}
                onChange={(e) => setStudentEssayInput(e.target.value)}
                placeholder={`Nhập câu viết lại hoàn chỉnh của bạn tại đây... ${currentEssay.givenBeginning ? `(VD: ${currentEssay.givenBeginning} ...)` : ''}`}
                className="w-full p-4 bg-white border-2 border-[#D9D2C5] focus:border-blue-600 rounded-2xl outline-hidden text-sm sm:text-base text-[#3D3D2D] font-medium leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* AI Grading Result Feedback Card */}
          {currentEssayResult && (
            <div
              className={`p-5 rounded-2xl border space-y-3.5 text-xs animate-in fade-in ${
                currentEssayResult.isCorrect && currentEssayResult.score >= 8.0
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : currentEssayResult.score >= 5.0
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              {/* Score Header */}
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {currentEssayResult.score >= 8.5 ? '🎉' : currentEssayResult.score >= 5.0 ? '💡' : '⚠️'}
                  </span>
                  <span className="font-bold text-sm">
                    {currentEssayResult.status === 'perfect'
                      ? 'Chính xác hoàn hảo!'
                      : currentEssayResult.status === 'acceptable'
                      ? 'Đúng ngữ nghĩa & ngữ pháp'
                      : currentEssayResult.status === 'minor_error'
                      ? 'Đã đúng hướng (Cần sửa lỗi nhỏ)'
                      : 'Chưa chính xác'}
                  </span>
                </div>
                <div className="px-3 py-1 bg-white rounded-full font-black text-sm shadow-xs border border-black/10">
                  {currentEssayResult.score.toFixed(1)} / 10đ
                </div>
              </div>

              {/* Feedback text */}
              <p className="leading-relaxed font-medium whitespace-pre-line text-xs sm:text-sm">
                {currentEssayResult.feedback}
              </p>

              {/* Standard Key Comparison */}
              <div className="p-3 bg-white/90 rounded-xl border border-black/10 space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-500">Đáp án chuẩn của Sở GD&ĐT:</p>
                <p className="font-bold text-[#3D3D2D] text-xs sm:text-sm font-mono">
                  {currentEssayResult.standardKey}
                </p>
              </div>

              {/* Acceptable variations if any */}
              {currentEssayResult.alternativeAnswers && currentEssayResult.alternativeAnswers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Các cách viết tương đương hợp lệ khác:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700">
                    {currentEssayResult.alternativeAnswers.map((alt, aIdx) => (
                      <li key={aIdx} className="font-mono">{alt}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grammar Rule & Traps */}
              <div className="p-3 bg-white/70 rounded-xl border border-black/10 text-[11px] space-y-1">
                <p className="font-bold text-[#5A5A40]">📘 Cấu trúc & Quy tắc ngữ pháp:</p>
                <p className="font-mono text-slate-800">{currentEssay.grammarStructure}</p>
                {currentEssay.commonTraps && (
                  <p className="text-amber-800 font-medium pt-1">💡 {currentEssay.commonTraps}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#F5F2ED] flex items-center justify-end space-x-3">
            {!currentEssayResult ? (
              <button
                onClick={handleGradeCurrentEssay}
                disabled={!studentEssayInput.trim() || isGradingEssay}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-full text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-2 cursor-pointer"
              >
                {isGradingEssay ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>AI đang chấm bài...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Chấm Điểm Bằng AI</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNextEssay}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{essayIdx < essayProblems.length - 1 ? 'Câu tự luận tiếp theo' : 'Xem tổng kết'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // 3. ESSAY FINISHED SUMMARY VIEW
  // ═══════════════════════════════════════════════
  if (essayFinished && practiceMode === 'essay') {
    let totalScore = 0;
    let correctCount = 0;
    essayProblems.forEach((p) => {
      const res = essayResults[p.id];
      if (res) {
        totalScore += res.score;
        if (res.isCorrect || res.score >= 8.0) correctCount += 1;
      }
    });
    const totalQ = essayProblems.length;
    const avgScore = totalQ > 0 ? (totalScore / totalQ).toFixed(1) : '0';
    const scorePct = totalQ > 0 ? Math.round((Number(avgScore) / 10) * 100) : 0;

    return (
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-[2rem] bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
          <Award className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-bold text-[#3D3D2D]">Hoàn Thành Bài Luyện Tự Luận!</h3>
          <p className="text-xs text-[#8A8A70]">
            Chuyên đề Viết Lại Câu & Biến Đổi Cấu Trúc (AI Đã Chấm Điểm)
          </p>
        </div>

        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#8A8A70]">Điểm trung bình:</span>
            <strong className="text-blue-600 font-bold text-sm">{avgScore} / 10đ</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8A8A70]">Số câu đạt chuẩn:</span>
            <strong className="text-emerald-600 font-bold">{correctCount}/{totalQ} câu</strong>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={handleStartEssayPractice}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Luyện thêm đề tự luận khác</span>
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

  // ═══════════════════════════════════════════════
  // 4. MULTIPLE CHOICE PRACTICE VIEW
  // ═══════════════════════════════════════════════
  if (isPracticing && !isFinished && currentQ) {
    const isCorrect = userChoice === currentQ.correctOption;

    return (
      <div className="max-w-3xl mx-auto space-y-5 pb-12">
        {/* Floating Quick Vocab Note Pill */}
        {floatingPos && selectedText && (
          <div
            style={{ top: `${floatingPos.y}px`, left: `${floatingPos.x}px` }}
            className="fixed z-50 bg-[#3D3D2D] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center space-x-1.5 animate-in fade-in cursor-pointer hover:bg-black"
            onClick={openVocabModalWithSelection}
          >
            <BookMarked className="w-3.5 h-3.5 text-[#8BA888]" />
            <span>Note từ mới: "{selectedText.slice(0, 15)}..."</span>
          </div>
        )}

        <QuickVocabNoteModal
          isOpen={vocabModalOpen}
          onClose={() => setVocabModalOpen(false)}
          initialWord={vocabModalWord}
          contextSentence={vocabModalContext || currentQ.content}
          sourceTitle={`Chuyên đề: ${currentQ.topicId}`}
        />

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
            {currentSubject === 'english' && (
              <button
                onClick={() => {
                  setVocabModalWord(currentQ.content.slice(0, 20));
                  setVocabModalContext(currentQ.content);
                  setVocabModalOpen(true);
                }}
                title="Lưu từ mới vào Sổ tay"
                className="flex items-center space-x-1 px-2.5 py-1 bg-[#FAF9F6] border border-[#EAE7E0] text-[#5A5A40] rounded-xl text-xs font-bold hover:bg-[#EAE7E0] transition cursor-pointer"
              >
                <BookMarked className="w-3.5 h-3.5 text-[#8BA888]" />
                <span className="hidden sm:inline">Note từ mới</span>
              </button>
            )}

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

  // ═══════════════════════════════════════════════
  // 5. FINISHED SUMMARY VIEW
  // ═══════════════════════════════════════════════
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
