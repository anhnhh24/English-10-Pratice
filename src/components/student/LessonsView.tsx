import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LESSONS_DATA } from '../../data/lessonsData';
import { MATH_LESSONS_DATA } from '../../data/mathLessonsData';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import { getStoredApiKey, callGeminiApiWithFallback } from '../../services/aiExamService';
import {
  BookOpen,
  Zap,
  Lightbulb,
  ChevronRight,
  Search,
  Calculator,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  X,
  Brain,
  Layers,
  Flame,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson } from '../../types';

interface LessonsViewProps {
  onPracticeTopic: (topicId: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ onPracticeTopic }) => {
  const { currentSubject } = useApp();

  const lessonsList = currentSubject === 'math' ? MATH_LESSONS_DATA : LESSONS_DATA;
  const topicsMetaList = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessonsList[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [copiedFormulaName, setCopiedFormulaName] = useState<string | null>(null);

  // AI Deep Tutor Modal State
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiLessonExplanation, setAiLessonExplanation] = useState<string>('');
  const [aiModalLoading, setAiModalLoading] = useState<boolean>(false);

  // Update selected lesson when subject changes
  useEffect(() => {
    if (lessonsList.length > 0) {
      setSelectedLessonId(lessonsList[0].id);
    }
    setSearchQuery('');
    setSelectedTopicFilter('all');
  }, [currentSubject]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return lessonsList.filter((l) => {
      if (selectedTopicFilter !== 'all' && l.topicId !== selectedTopicFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = l.title.toLowerCase().includes(q);
        const matchSub = l.subTitle.toLowerCase().includes(q);
        const matchSum = l.summary.toLowerCase().includes(q);
        const matchSig = l.keySignals.some((s) => s.toLowerCase().includes(q));
        if (!matchTitle && !matchSub && !matchSum && !matchSig) return false;
      }
      return true;
    });
  }, [lessonsList, selectedTopicFilter, searchQuery]);

  const currentLesson: Lesson =
    lessonsList.find((l) => l.id === selectedLessonId) || filteredLessons[0] || lessonsList[0];

  const currentTopicMeta = topicsMetaList.find((t) => t.id === currentLesson?.topicId);

  const handleCopyFormula = (formula: string, name: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormulaName(name);
    setTimeout(() => setCopiedFormulaName(null), 2000);
  };

  const handleOpenAiLessonTutor = async (lesson: Lesson) => {
    setAiModalOpen(true);
    setAiModalLoading(true);
    setAiLessonExplanation('');

    const apiKey = getStoredApiKey();
    const isMath = currentSubject === 'math';

    if (!apiKey) {
      setAiLessonExplanation(
        `### 🤖 Phân Tích Chuyên Đề: ${lesson.title}\n\n` +
          `**Tóm tắt cốt lõi:**\n${lesson.summary}\n\n` +
          `**Các mẹo thi quan trọng:**\n` +
          lesson.examTips.map((tip) => `- 💡 ${tip}`).join('\n') +
          `\n\n*Gợi ý: Cài đặt Gemini API Key trong phần Cài đặt để nhận bài giảng chi tiết từng bước trích từ đề thi thật!*`
      );
      setAiModalLoading(false);
      return;
    }

    const prompt = `Bạn là chuyên gia luyện thi tuyển sinh vào Lớp 10 môn ${isMath ? 'Toán' : 'Tiếng Anh'} hàng đầu Việt Nam.
Hãy giải thích chuyên sâu, cặn kẽ và dễ hiểu nhất về CHUYÊN ĐỀ LÝ THUYẾT sau:
- Tên bài: "${lesson.title}" (${lesson.subTitle})
- Môn học: ${isMath ? 'Toán 9' : 'Tiếng Anh 9'}
- Nội dung tóm tắt: ${lesson.summary}

YÊU CẦU BÀI GIẢNG:
1. Giải thích bản chất cốt lõi vì sao học sinh hay bị nhầm lẫn.
2. Nêu 2 câu ví dụ THỰC CHIẾN trích từ đề thi tuyển sinh vào 10 mới nhất và hướng dẫn cách giải chi tiết từng bước.
3. Chỉ ra các "bẫy trừ điểm" tinh vi nhất mà người ra đề hay gài.
4. Tặng học sinh 1 câu thần chú / phương pháp giải nhanh để ăn trọn điểm.

Trình bày bằng Markdown chuyên nghiệp, có tiêu đề rõ ràng, bullet points và bảng nếu cần.`;

    try {
      const { text } = await callGeminiApiWithFallback(apiKey, 'gemini-3.6-flash', {
        contents: [{ parts: [{ text: prompt }] }],
      });
      setAiLessonExplanation(text);
    } catch (err) {
      console.warn('AI lesson tutor error:', err);
      setAiLessonExplanation(
        `### 🤖 Bài Giảng Chuyên Đề: ${lesson.title}\n\n` +
          lesson.examTips.map((tip) => `- 💡 ${tip}`).join('\n')
      );
    } finally {
      setAiModalLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-16">
      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 1. HERO BANNER                                                */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-br from-[#5A5A40] via-[#4A4A35] to-[#3D3D2D] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              {currentSubject === 'math' ? '📐 Sổ Tay Công Thức Toán Lớp 9' : '🇬🇧 Sổ Tay Lý Thuyết Tiếng Anh Lớp 9'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentSubject === 'math'
                ? 'Công Thức Toán & Bí Kíp Giải Nhanh Vào 10'
                : 'Lý Thuyết Trọng Tâm & Mẹo Làm Đề Vào 10'}
            </h1>
            <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
              {currentSubject === 'math'
                ? 'Hệ thống toàn bộ 9 chuyên đề Đại số, Hình học 9, Định lý Vi-ét, BĐT Cauchy và mẹo bấm máy tính Casio FX-580VN X.'
                : 'Hệ thống toàn bộ 15 chuyên đề Ngữ pháp, Ngữ âm, Trọng âm, Word Form, Viết lại câu và kỹ năng Đọc hiểu chuẩn tuyển sinh.'}
            </p>
          </div>

          <div className="bg-[#FDFCFB]/95 text-[#3D3D2D] p-4 rounded-2xl border border-[#D9D2C5] text-center shrink-0 min-w-[150px] shadow-lg">
            <span className="text-[10px] font-extrabold uppercase text-[#8A8A70] block">Tổng số chuyên đề</span>
            <p className="text-3xl font-black text-[#5A5A40]">{lessonsList.length}</p>
            <span className="text-[11px] font-bold text-emerald-700">Đầy đủ 100% ma trận</span>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 2. TOPIC FILTER CHIPS & SEARCH BAR                            */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#8A8A70] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài học, công thức, dấu hiệu..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs text-[#3D3D2D] outline-hidden placeholder:text-[#8A8A70] focus:border-[#5A5A40]"
            />
          </div>

          {/* Topic Select dropdown */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-[#8A8A70] whitespace-nowrap">Chuyên đề:</span>
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs font-bold text-[#3D3D2D] outline-hidden cursor-pointer w-full sm:w-auto"
            >
              <option value="all">📂 Tất cả chuyên đề ({lessonsList.length})</option>
              {topicsMetaList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nameVi}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 3. MOBILE LESSON SELECTOR (SCROLLING CHIPS)                   */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-2">
        <div className="flex space-x-2 overflow-x-auto pb-1.5 no-scrollbar">
          {filteredLessons.map((lesson) => {
            const isSelected = lesson.id === currentLesson?.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                    : 'bg-white border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
                }`}
              >
                {lesson.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 4. MAIN 2-COLUMN LAYOUT: SIDEBAR (LEFT) & LESSON VIEW (RIGHT) */}
      {/* ═════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Lesson Navigation Sidebar (4 cols on Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-2.5 max-h-[calc(100vh-240px)] overflow-y-auto no-scrollbar pr-1">
          {filteredLessons.map((lesson) => {
            const isSelected = lesson.id === currentLesson?.id;
            const tMeta = topicsMetaList.find((t) => t.id === lesson.topicId);

            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                    : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6] hover:border-[#D9D2C5]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#F5F2ED] text-[#5A5A40]'
                    }`}
                  >
                    {tMeta?.nameVi || lesson.topicId}
                  </span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-[#D9D2C5]' : 'text-[#8A8A70]'}`}>
                    {lesson.formulas.length} công thức
                  </span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm line-clamp-2 leading-snug">{lesson.title}</h4>
                <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-[#D9D2C5]' : 'text-[#8A8A70]'}`}>
                  {lesson.subTitle}
                </p>
              </button>
            );
          })}
        </div>

        {/* Right Detailed Lesson Content (8 cols on Desktop) */}
        {currentLesson ? (
          <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in">
            {/* Header & Quick Action Buttons */}
            <div className="pb-4 border-b border-[#F5F2ED] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] font-bold text-xs rounded-xl uppercase">
                  {currentTopicMeta?.nameVi || currentLesson.topicId}
                </span>

                <div className="flex items-center space-x-2">
                  {/* AI Deep Tutor Explainer */}
                  <button
                    onClick={() => handleOpenAiLessonTutor(currentLesson)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>🤖 AI Giảng Sâu Bài Này</span>
                  </button>

                  {/* Practice this topic button */}
                  <button
                    onClick={() => onPracticeTopic(currentLesson.topicId)}
                    className="px-3.5 py-1.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <span>Luyện bài tập</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#3D3D2D] leading-tight">
                  {currentLesson.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#8A8A70] mt-1">{currentLesson.subTitle}</p>
              </div>

              {/* Summary Callout */}
              <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] text-xs sm:text-sm text-[#4A4A4A] leading-relaxed">
                <strong className="text-[#5A5A40] font-bold block mb-1">🎯 Trọng tâm kiến thức:</strong>
                {currentLesson.summary}
              </div>
            </div>

            {/* ─── SECTION 1: FORMULAS & STRUCTURES ─── */}
            <div className="space-y-4">
              <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D] flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-[#5A5A40]" />
                <span>Bảng Công Thức & Cấu Trúc Cốt Lõi</span>
              </h3>

              <div className="space-y-3.5">
                {currentLesson.formulas.map((item, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-5 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] space-y-2.5 hover:border-[#D9D2C5] transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-extrabold text-xs text-[#3D3D2D] flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#5A5A40]" />
                        <span>{item.name}</span>
                      </span>

                      <button
                        onClick={() => handleCopyFormula(item.formula, item.name)}
                        className="px-2.5 py-1 bg-white hover:bg-[#F5F2ED] border border-[#D9D2C5] text-[11px] font-bold text-[#5A5A40] rounded-lg transition flex items-center space-x-1 cursor-pointer"
                        title="Sao chép công thức"
                      >
                        {copiedFormulaName === item.name ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Sao chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formula monospace block */}
                    <div className="p-3.5 bg-white rounded-xl border border-[#D9D2C5] font-mono text-xs sm:text-sm font-bold text-[#1E3A8A] leading-relaxed whitespace-pre-line">
                      {item.formula}
                    </div>

                    {/* Example */}
                    {item.example && (
                      <div className="text-xs text-[#4A4A4A] bg-[#F5F2ED]/60 p-3 rounded-xl space-y-0.5">
                        <span className="font-bold text-[#5A5A40] block">Ví dụ minh họa:</span>
                        <p className="italic leading-relaxed whitespace-pre-line">{item.example}</p>
                      </div>
                    )}

                    {/* Note / Mnemonic */}
                    {item.note && (
                      <div className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-relaxed whitespace-pre-line">
                        <strong>💡 Ghi nhớ / Thần chú:</strong> {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── SECTION 2: RULES & METHODS ─── */}
            {currentLesson.rules && currentLesson.rules.length > 0 && (
              <div className="space-y-3.5 pt-2">
                <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D] flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>Quy Tắc & Phương Pháp Giải Chi Tiết</span>
                </h3>

                <div className="space-y-3">
                  {currentLesson.rules.map((r, rIdx) => (
                    <div key={rIdx} className="p-5 rounded-2xl bg-white border border-[#EAE7E0] space-y-2">
                      <h4 className="font-bold text-xs sm:text-sm text-[#3D3D2D]">{r.title}</h4>
                      <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-line">
                        {r.detail}
                      </p>

                      {r.examples && r.examples.length > 0 && (
                        <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] text-xs space-y-1">
                          <span className="font-bold text-[#5A5A40] block">Mẫu bài thực tế:</span>
                          {r.examples.map((ex, exIdx) => (
                            <p key={exIdx} className="text-[#3D3D2D] font-mono text-[11px] whitespace-pre-line">
                              {ex}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── SECTION 3: EXAM TIPS & SHORTCUTS ─── */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 space-y-2.5">
              <div className="flex items-center space-x-2 font-bold text-xs sm:text-sm text-amber-950">
                <Zap className="w-4 h-4 text-amber-600" />
                <span>⚡ Mẹo Nhận Diện Đề Thi & Bí Kíp Giải Nhanh</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-950 leading-relaxed list-disc list-inside">
                {currentLesson.examTips.map((tip, tIdx) => (
                  <li key={tIdx} className="font-medium">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── SECTION 4: KEY SIGNALS / KEYWORDS ─── */}
            {currentLesson.keySignals && currentLesson.keySignals.length > 0 && (
              <div className="pt-2 flex items-center space-x-2 flex-wrap gap-y-1.5">
                <span className="text-xs font-bold text-[#8A8A70]">Từ khóa nhận biết:</span>
                {currentLesson.keySignals.map((sig, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-semibold rounded-lg border border-[#D9D2C5]"
                  >
                    #{sig}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* 5. AI DEEP TUTOR LESSON EXPLAINER MODAL                       */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5F2ED]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#3D3D2D]">
                    AI Gia Sư Giảng Sâu: {currentLesson?.title}
                  </h3>
                  <p className="text-[11px] text-[#8A8A70]">
                    Phân tích bản chất, ví dụ thực chiến và mẹo tránh bẫy tuyển sinh
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
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#5A5A40]">
                  AI Gia sư đang phân tích và chuẩn bị bài giảng chuyên sâu cho bạn...
                </p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-xs sm:text-sm text-[#3D3D2D] leading-relaxed whitespace-pre-line">
                {aiLessonExplanation}
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-[#F5F2ED]">
              <button
                onClick={() => setAiModalOpen(false)}
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Đã hiểu bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
