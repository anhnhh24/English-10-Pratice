import React from 'react';
import { useApp } from '../context/AppContext';
import { Bookmark, Check, Trash2, BookOpen } from 'lucide-react';
import { Question } from '../types';

export const BookmarksView: React.FC = () => {
  const { bookmarks, getQuestionById, toggleBookmark } = useApp();

  const savedQuestions = bookmarks
    .map((id) => getQuestionById(id))
    .filter(Boolean) as Question[];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
            Bộ Sưu Tập Cá Nhân
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Câu Hỏi Đã Lưu & Ghi Nhớ ({savedQuestions.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5]">
            Những câu hỏi hay, bẫy tinh vi hoặc kiến thức bạn đã lưu lại để tra cứu trước ngày thi.
          </p>
        </div>
      </div>

      {savedQuestions.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-12 border border-[#EAE7E0] text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#D9D2C5] text-[#8A8A70] flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-[#3D3D2D] text-base">Chưa có câu hỏi nào được lưu</h3>
          <p className="text-xs text-[#8A8A70] max-w-sm mx-auto">
            Khi làm bài thi hoặc luyện tập, bạn hãy nhấn biểu tượng Bookmark để lưu lại câu hỏi cần
            xem kỹ nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 bg-white rounded-[2rem] border border-[#EAE7E0] shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5]">
                    Câu {idx + 1} • {q.topicId.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[#8A8A70] uppercase font-bold">
                    {q.difficulty}
                  </span>
                </div>

                <button
                  onClick={() => toggleBookmark(q.id)}
                  className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                  title="Bỏ lưu câu này"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {q.passage && (
                <div className="p-3 bg-[#FAF9F6] rounded-xl text-xs text-[#8A8A70] italic">
                  {q.passage}
                </div>
              )}

              <div className="text-sm font-bold text-[#3D3D2D]">{q.content}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, oIdx) => {
                  const isCorrect = oIdx === q.correctOption;
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCorrect
                          ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold'
                          : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                      }`}
                    >
                      <span>{opt}</span>
                      {isCorrect && <Check className="w-4 h-4 text-[#8BA888]" />}
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 bg-[#FAF9F6] rounded-xl text-xs text-[#4A4A4A] space-y-1 border border-[#EAE7E0]">
                <p>
                  <strong>Giải thích:</strong> {q.explanation}
                </p>
                {q.grammarRule && (
                  <p className="font-mono text-[11px] text-[#5A5A40]">
                    <strong>Quy tắc:</strong> {q.grammarRule}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
