import React, { useState } from 'react';
import { LESSONS_DATA } from '../data/lessonsData';
import { TOPICS_META } from '../data/topicsMeta';
import {
  BookOpen,
  Sparkles,
  Zap,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  Search,
} from 'lucide-react';

interface LessonsViewProps {
  onPracticeTopic: (topicId: string) => void;
}

export const LessonsView: React.FC<LessonsViewProps> = ({ onPracticeTopic }) => {
  const [selectedLessonId, setSelectedLessonId] = useState<string>(LESSONS_DATA[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentLesson =
    LESSONS_DATA.find((l) => l.id === selectedLessonId) || LESSONS_DATA[0];

  const filteredLessons = LESSONS_DATA.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.subTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div className="max-w-2xl space-y-2">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
            Hệ thống Kiến thức Trọng tâm Vào 10
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Sổ Tay Lý Thuyết & Mẹo Thi Đột Phá
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5] leading-relaxed">
            Tổng hợp toàn bộ công thức cốt lõi, dấu hiệu nhận biết nhanh và bẫy đề thi tuyển sinh
            thường gặp nhất.
          </p>
        </div>
      </div>

      {/* Main 2-Column: Sidebar of Lessons (Left) & Detailed Theory Sheet (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Lesson Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
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

          <div className="space-y-2">
            {filteredLessons.map((lesson) => {
              const isSelected = lesson.id === selectedLessonId;
              const topicMeta = TOPICS_META.find((t) => t.id === lesson.topicId);

              return (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLessonId(lesson.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
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

        {/* Right Detailed Lesson Content (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-[#EAE7E0] shadow-sm p-6 sm:p-8 space-y-6">
          {/* Lesson Header */}
          <div className="pb-4 border-b border-[#F5F2ED] space-y-2">
            <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] font-bold text-xs rounded-lg uppercase">
              Chuyên đề ôn thi số {LESSONS_DATA.findIndex((l) => l.id === currentLesson.id) + 1}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#3D3D2D]">{currentLesson.title}</h2>
            <p className="text-xs sm:text-sm text-[#8A8A70] leading-relaxed">
              {currentLesson.summary}
            </p>
          </div>

          {/* Key Formulas Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#E67E22] fill-[#E67E22]" />
              <span>Công thức & Cấu trúc cốt lõi</span>
            </h3>

            <div className="space-y-3">
              {currentLesson.formulas.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs sm:text-sm space-y-2"
                >
                  <div className="font-bold text-[#5A5A40] text-xs sm:text-sm">
                    {item.name}
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#D9D2C5] font-mono text-xs font-bold text-[#3D3D2D] whitespace-pre-line leading-relaxed shadow-2xs">
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
              <h3 className="text-sm font-bold text-[#3D3D2D] flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#5A5A40]" />
                <span>Quy tắc chuyển đổi & Lưu ý quan trọng</span>
              </h3>

              <div className="space-y-3">
                {currentLesson.rules.map((r, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE7E0] text-xs sm:text-sm space-y-2"
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
            <div className="p-5 rounded-2xl bg-[#FDF2E9] border border-[#E8C07D] text-[#3D3D2D] space-y-2">
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
          <div className="pt-4 border-t border-[#F5F2ED] flex items-center justify-between">
            <div className="text-xs text-[#8A8A70]">
              Đã hiểu lý thuyết? Hãy làm bài tập củng cố ngay!
            </div>
            <button
              onClick={() => onPracticeTopic(currentLesson.topicId)}
              className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-full text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Luyện bài tập chủ đề này</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
