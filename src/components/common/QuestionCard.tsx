import React, { useState } from 'react';
import { Question } from '../../types';
import { Bookmark, Check, X, Sparkles, Lightbulb } from 'lucide-react';
import { SubjectBadge } from './SubjectBadge';
import { formatTopicTitle } from '../../utils/formatters';

interface QuestionCardProps {
  question: Question;
  index?: number;
  selectedOption?: number;
  onSelectOption?: (optionIndex: number) => void;
  showExplanation?: boolean;
  isReviewMode?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: (questionId: string) => void;
  userNote?: string;
  onSaveNote?: (note: string) => void;
  onOpenAiTutor?: (question: Question) => void;
  className?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  selectedOption,
  onSelectOption,
  showExplanation = false,
  isReviewMode = false,
  isBookmarked = false,
  onToggleBookmark,
  userNote,
  onSaveNote,
  onOpenAiTutor,
  className = '',
}) => {
  const [showFullExp, setShowFullExp] = useState(showExplanation);
  const [editingNote, setEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState(userNote || '');

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(noteInput);
      setEditingNote(false);
    }
  };

  return (
    <div
      className={`p-5 sm:p-7 bg-white rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-4 transition ${className}`}
    >
      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {index !== undefined && (
            <span className="px-3 py-1 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5]">
              Câu {index + 1}
            </span>
          )}

          <SubjectBadge subject={question.subject} size="sm" />

          <span className="text-[11px] text-[#8A8A70] font-bold">
            {formatTopicTitle(question.topicId)}
          </span>

          <span className="text-[10px] px-2 py-0.5 bg-white text-[#8A8A70] rounded-md border border-[#EAE7E0] uppercase font-extrabold">
            {question.difficulty}
          </span>
        </div>

        {onToggleBookmark && (
          <button
            onClick={() => onToggleBookmark(question.id)}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isBookmarked
                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'text-[#8A8A70] hover:bg-[#FAF9F6]'
            }`}
            title={isBookmarked ? 'Đã lưu câu hỏi' : 'Lưu câu hỏi'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-600' : ''}`} />
          </button>
        )}
      </div>

      {/* Passage if any */}
      {question.passage && (
        <div className="p-3.5 bg-[#FAF9F6] rounded-2xl text-xs text-[#5A5A40] italic leading-relaxed border border-[#EAE7E0] whitespace-pre-line">
          {question.passage}
        </div>
      )}

      {/* Question Content */}
      <div className="text-sm font-bold text-[#3D3D2D] leading-relaxed whitespace-pre-line">
        {question.content}
      </div>

      {/* Options List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {question.options.map((opt, oIdx) => {
          const isSelected = selectedOption === oIdx;
          const isCorrect = oIdx === question.correctOption;

          let optionStyle = 'bg-[#FAF9F6] border-[#EAE7E0] text-[#3D3D2D] hover:bg-[#F5F2ED]';

          if (isReviewMode) {
            if (isCorrect) {
              optionStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-red-50 border-red-300 text-red-800 font-bold';
            } else {
              optionStyle = 'bg-[#FAF9F6] border-[#EAE7E0] text-[#8A8A70] opacity-70';
            }
          } else if (isSelected) {
            optionStyle = 'bg-[#5A5A40] text-white font-bold border-[#5A5A40] shadow-xs';
          }

          return (
            <button
              key={oIdx}
              type="button"
              disabled={isReviewMode}
              onClick={() => onSelectOption && onSelectOption(oIdx)}
              className={`p-3.5 rounded-2xl border text-xs text-left transition flex items-center justify-between gap-2 ${optionStyle} ${
                !isReviewMode ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <span
                  className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                    isSelected && !isReviewMode
                      ? 'bg-white text-[#5A5A40]'
                      : 'bg-white/80 text-[#5A5A40] border border-[#D9D2C5]'
                  }`}
                >
                  {String.fromCharCode(65 + oIdx)}
                </span>
                <span className="leading-snug break-words">{opt}</span>
              </div>

              {isReviewMode && (
                <div>
                  {isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 shrink-0" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation / Answer Key / AI Tutor Box */}
      {(isReviewMode || showFullExp) && question.explanation && (
        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#D9D2C5] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-bold text-[#5A5A40]">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Giải thích chi tiết & Bẫy đề thi:</span>
            </div>

            {onOpenAiTutor && (
              <button
                type="button"
                onClick={() => onOpenAiTutor(question)}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-xs hover:opacity-90 transition flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Hỏi Gia Sư AI</span>
              </button>
            )}
          </div>
          <p className="text-[#5A5A40] leading-relaxed whitespace-pre-line">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
