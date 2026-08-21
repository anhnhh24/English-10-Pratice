import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { Question, TopicId } from '../../types';
import {
  generateExamWithAI,
  getStoredApiKey,
} from '../../services/aiExamService';
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

  // Active practice session states
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>({});
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Update selected topic & reset practice state when subject changes
  useEffect(() => {
    setIsPracticing(false);
    setIsFinished(false);
    setUserAnswers({});
    setCheckedQuestions({});
    setCurrentIdx(0);
    if (initialTopicId) {
      setSelectedTopic(initialTopicId as TopicId);
    } else {
      setSelectedTopic(currentSubject === 'math' ? 'math_pt_bac_hai_viet' : 'grammar');
    }
  }, [currentSubject, initialTopicId]);

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

            <div className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between ${isMath ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-[#FAF9F6] text-[#5A5A40] border border-[#D9D2C5]'}`}>
              <span>Có <strong>{topicQuestionsPool.length}</strong> câu hỏi có sẵn trong kho đề.</span>
            </div>
          </div>
        </div>

        {/* AI Generator Feature Card */}
        <div className={`p-5 rounded-[2.5rem] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm ${isMath ? 'bg-gradient-to-r from-[#1E3A8A] to-[#2563EB]' : 'bg-gradient-to-r from-[#5A5A40] to-[#789675]'}`}>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-200">
                AI Exam Generator Cho Chuyên Đề
              </span>
            </div>
            <h4 className="text-base font-bold text-white">
              Cần thêm câu hỏi mới về "{currentTopicsMeta.find((t) => t.id === selectedTopic)?.nameVi}"?
            </h4>
            <p className="text-xs text-white/80 max-w-lg">
              Yêu cầu Gemini AI tự động biên soạn 5 - 15 câu hỏi mới toanh kèm lời giải chi tiết và bẫy thi cử cho riêng chuyên đề này!
            </p>
          </div>

          <button
            onClick={() => setShowAiModal(true)}
            className="px-5 py-3 bg-white text-[#1E293B] hover:bg-white/90 rounded-2xl text-xs font-bold shadow-sm transition flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Wand2 className="w-4 h-4 text-amber-500" />
            <span>AI Tạo Đề Chuyên Đề</span>
          </button>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartPractice}
          id="btn-start-topic-practice"
          className={`w-full py-4 ${theme.primaryBg} hover:opacity-90 text-white rounded-[2rem] text-sm font-bold shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer`}
        >
          <span>Bắt đầu Luyện tập ({topicQuestionsPool.length} câu có sẵn)</span>
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* AI Generation Modal */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E2E8F0] space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-10 h-10 rounded-2xl ${theme.primaryBg} text-white flex items-center justify-center font-bold shadow-xs`}>
                    <Wand2 className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E293B] text-base">AI Sinh Đề Luyện Chuyên Đề</h3>
                    <p className="text-[11px] text-[#64748B]">
                      Chuyên đề: {currentTopicsMeta.find((t) => t.id === selectedTopic)?.nameVi}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAiModal(false)}
                  disabled={aiLoading}
                  className="p-1.5 text-[#64748B] hover:text-[#1E293B] rounded-xl transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-[#1E293B] mb-1.5">1. Số lượng câu hỏi muốn tạo:</label>
                  <div className="flex gap-2">
                    {[5, 10, 15].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiCount(num)}
                        className={`flex-1 py-2.5 rounded-xl font-bold border transition ${
                          aiCount === num
                            ? `${theme.primaryBg} text-white shadow-xs`
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1E293B] mb-1.5">2. Độ khó:</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'standard', label: 'Cơ bản (7 - 8đ)' },
                      { id: 'advanced', label: 'Khá - Giỏi (8 - 9đ)' },
                      { id: 'challenge', label: 'Phân loại (9.5 - 10đ)' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setAiDifficulty(d.id as any)}
                        className={`flex-1 py-2.5 rounded-xl font-bold border text-[11px] transition ${
                          aiDifficulty === d.id
                            ? `${theme.primaryBg} text-white shadow-xs`
                            : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#1E293B] mb-1.5">
                    3. Yêu cầu trọng tâm riêng cho AI (Tùy chọn):
                  </label>
                  <textarea
                    rows={3}
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder={
                      isMath
                        ? 'Ví dụ: Tập trung vào dạng tìm tham số m để phương trình có 2 nghiệm thỏa mãn x1 = 2*x2, có nhiều bẫy điều kiện...'
                        : 'Ví dụ: Tập trung vào dạng câu điều kiện loại 2, câu ước wish và câu bị động đặc biệt...'
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl outline-hidden text-[#1E293B]"
                  />
                </div>

                {/* Quick suggestions */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase">Gợi ý nhanh:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(isMath
                      ? ['Có bẫy điều kiện xác định', 'Dạng tìm tham số m', 'Kỹ thuật chọn điểm rơi', 'Bài toán thực tế']
                      : ['Câu bị động nâng cao', 'Mệnh đề quan hệ', 'Cụm động từ khó', 'Từ vựng chủ đề môi trường']
                    ).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setAiCustomPrompt(sug)}
                        className="px-2.5 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] rounded-lg text-[10px] font-medium"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {aiStatusMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-blue-600" />
                    <span>{aiStatusMsg}</span>
                  </div>
                )}

                {aiError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                <div className="flex space-x-2 pt-2 border-t border-[#F1F5F9]">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    disabled={aiLoading}
                    className="flex-1 py-2.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#334155] rounded-xl font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={aiLoading}
                    className={`flex-1 py-2.5 ${theme.primaryBg} hover:opacity-90 text-white rounded-xl font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50`}
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Đang tạo đề...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Tạo Đề & Luyện Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
