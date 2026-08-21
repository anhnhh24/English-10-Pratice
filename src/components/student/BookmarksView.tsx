import React from 'react';
import { useApp } from '../../context/AppContext';
import { Bookmark } from 'lucide-react';
import { Question } from '../../types';
import { QuestionCard, EmptyState } from '../common';

export const BookmarksView: React.FC = () => {
  const { currentSubject, currentUser, bookmarks, getQuestionById, toggleBookmark } = useApp();

  const savedQuestions = bookmarks
    .map((id) => getQuestionById(id))
    .filter(
      (q): q is Question => q !== undefined && (q.subject || 'english') === currentSubject
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in">
      {/* Header */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm">
        <div className="space-y-1">
          <span className="px-3.5 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
            Bộ Sưu Tập Cá Nhân: {currentSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-1">
            Câu Hỏi Đã Lưu & Ghi Nhớ ({savedQuestions.length})
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5]">
            Những câu hỏi hay, công thức đặc biệt hoặc bẫy đề thi bạn đã lưu lại dưới tài khoản <strong>{currentUser.name}</strong>.
          </p>
        </div>
      </div>

      {savedQuestions.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={`Chưa có câu hỏi môn ${currentSubject === 'math' ? 'Toán' : 'Tiếng Anh'} nào được lưu`}
          description="Khi làm bài thi hoặc luyện tập, bạn hãy nhấn biểu tượng Bookmark để lưu lại câu hỏi cần xem kỹ nhé!"
        />
      ) : (
        <div className="space-y-4">
          {savedQuestions.map((q, idx) => (
            <QuestionCard
              key={q.id}
              question={q}
              index={idx}
              showExplanation={true}
              isReviewMode={true}
              isBookmarked={true}
              onToggleBookmark={() => toggleBookmark(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

