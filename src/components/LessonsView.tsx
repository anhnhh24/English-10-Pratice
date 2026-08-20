import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { LESSONS_DATA } from '../data/lessonsData';
import { MATH_LESSONS_DATA } from '../data/mathLessonsData';
import { TOPICS_META } from '../data/topicsMeta';
import { MATH_TOPICS_META } from '../data/mathTopicsMeta';
import {
  BookOpen,
  Zap,
  Lightbulb,
  ChevronRight,
  Search,
  Calculator,
} from 'lucide-react';

interface LessonsViewProps {
  onPracticeTopic: (topicId: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ onPracticeTopic }) => {
  const { currentSubject } = useApp();

  const lessonsList = currentSubject === 'math' ? MATH_LESSONS_DATA : LESSONS_DATA;
  const topicsMetaList = currentSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;

  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessonsList[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update selected lesson when subject changes
  useEffect(() => {
    setSelectedLessonId(lessonsList[0].id);
  }, [currentSubject]);

  const currentLesson =
    lessonsList.find((l) => l.id === selectedLessonId) || lessonsList[0];

  const filteredLessons = lessonsList.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-6">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm">
        <div className="max-w-2xl space-y-1.5 sm:space-y-2">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
              {currentSubject === 'math' ? '📐 Môn Toán Lớp 9 Lên 10' : '🇬🇧 Môn Tiếng Anh Lớp 9 Lên 10'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
            {currentSubject === 'math'
              ? 'Sổ Tay Công Thức Toán & Bí Kíp Giải Nhanh'
              : 'Sổ Tay Lý Thuyết & Mẹo Thi Đột Phá'}
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            {currentSubject === 'math'
              ? 'Tổng hợp toàn bộ công thức Đại số, Hình học 9, Định lý Vi-ét, BĐT Cauchy và mẹo bấm máy tính Casio FX-580VN X.'
              : 'Tổng hợp toàn bộ công thức cốt lõi, dấu hiệu nhận biết nhanh và bẫy đề thi tuyển sinh thường gặp nhất.'}
          </p>
        </div>
      </div>

      {/* MOBILE LESSON SELECTOR (Horizontal scrolling chips) */}
      <div className="lg:hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#5A5A40]">
          <span>Chọn chuyên đề lý thuyết:</span>
          <span className="text-[11px] text-[#8A8A70]">{filteredLessons.length} bài</span>
        </div>
        <div className="flex space-x-2 overflow-x-auto pb-1.5 no-scrollbar">
          {filteredLessons.map((lesson, idx) => {
            const isSelected = lesson.id === selectedLessonId;
            return (
              <button
                key={lesson.id}
                onClick={() => setSelectedLessonId(lesson.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-xs'
                    : 'bg-white border-[#EAE7E0] text-[#6B6B54] hover:bg-[#FAF9F6]'
                }`}
              >
                <span>Bài {idx + 1}: {lesson.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column: Sidebar of Lessons (Left on Desktop) & Detailed Theory Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Lesson Navigation (4 cols on Desktop) */}
        <div className="hidden lg:block lg:col-span-4 space-y-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chuyên đề..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#EAE7E0] rounded-2xl text-xs sm:text-sm focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto no-scrollbar pr-1">
            {filteredLessons.map((lesson) => {
              const isSelected = lesson.id === selectedLessonId;
              const topicMeta = topicsMetaList.find((t) => t.id === lesson.topicId);

              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm'
                      : 'bg-white border-[#EAE7E0] text-[#4A4A4A] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#F5F2ED] text-[#5A5A40]'
                      }`}
                    >
                      {topicMeta?.nameVi || lesson.topicId}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm line-clamp-1">{lesson.title}</h4>
                  <p
                    className={`text-[11px] mt-1 line-clamp-1 ${
                      isSelected ? 'text-[#D9D2C5]' : 'text-[#8A8A70]'
                    }`}
                  >
                    {lesson.subTitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Detailed Lesson Content (8 cols on Desktop, full width on Mobile) */}
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Lesson Header */}
          <div className="pb-4 border-b border-[#F5F2ED] space-y-1.5 sm:space-y-2">
            <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] font-bold text-[10px] sm:text-xs rounded-lg uppercase">
              Chuyên đề ôn thi số {lessonsList.findIndex((l) => l.id === currentLesson.id) + 1}
            </span>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#3D3D2D]">{currentLesson.title}</h2>
            <p className="text-xs sm:text-sm text-[#8A8A70] leading-relaxed">
              {currentLesson.summary}
            </p>
          </div>

          {/* Key Formulas Section */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
              <span>Công thức & Cấu trúc cốt lõi</span>
            </h3>

            <div className="space-y-3">
              {currentLesson.formulas.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs sm:text-sm space-y-2"
                >
                  <div className="font-bold text-[#5A5A40] text-xs sm:text-sm">
                    {item.name}
                  </div>
                  <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-[#D9D2C5] font-mono text-xs font-bold text-[#3D3D2D] whitespace-pre-line leading-relaxed shadow-2xs overflow-x-auto">
                    {item.formula}
                  </div>
                  <p className="text-[#4A4A4A] text-xs">
                    <strong>Ví dụ:</strong> {item.example}
                  </p>
                  {item.note && (
                    <p className="text-[#E67E22] text-[11px] font-medium italic">
                      💡 {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rules & In-depth Details */}
          {currentLesson.rules && currentLesson.rules.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs sm:text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#5A5A40]" />
                <span>Quy tắc chuyển đổi & Lưu ý quan trọng</span>
              </h3>

              <div className="space-y-3">
                {currentLesson.rules.map((r, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs sm:text-sm space-y-2"
                  >
                    <h5 className="font-bold text-[#3D3D2D]">{r.title}</h5>
                    <p className="text-[#6B6B54] leading-relaxed text-xs">{r.detail}</p>
                    {r.examples.map((ex, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-2 bg-white rounded-xl border border-[#EAE7E0] text-[#3D3D2D] text-xs font-medium"
                      >
                        • {ex}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Tips Box */}
          {currentLesson.examTips && currentLesson.examTips.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FDF2E9] border border-[#E8C07D] text-[#3D3D2D] space-y-2">
              <h4 className="font-bold text-xs sm:text-sm text-[#E67E22] flex items-center space-x-1.5">
                <Lightbulb className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
                <span>Bí kíp & Mẹo tránh bẫy Đề thi Vào 10:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[#4A4A4A]">
                {currentLesson.examTips.map((tip, tIdx) => (
                  <li key={tIdx} className="flex items-start space-x-2">
                    <span className="text-[#E67E22] font-bold">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bottom Action: Practice this topic */}
          <div className="pt-4 border-t border-[#F5F2ED] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-[#8A8A70]">
              Đã hiểu lý thuyết? Hãy làm bài tập củng cố ngay!
            </div>
            <button
              onClick={() => onPracticeTopic(currentLesson.topicId)}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Luyện bài tập chuyên đề này</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
