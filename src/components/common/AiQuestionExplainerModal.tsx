import React, { useState, useEffect } from 'react';
import { Question } from '../../types';
import { explainQuestionWithAI, AiQuestionExplanation, getStoredApiKey, AVAILABLE_MODELS } from '../../services/aiExamService';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  X,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  BookOpen,
  RotateCcw,
  Check,
  Zap,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiQuestionExplainerModalProps {
  question: Question | null;
  userSelectedOption?: number;
  onClose: () => void;
}

export const AiQuestionExplainerModal: React.FC<AiQuestionExplainerModalProps> = ({
  question,
  userSelectedOption,
  onClose,
}) => {
  const { toggleBookmark, isBookmarked } = useApp();
  const [loading, setLoading] = useState<boolean>(true);
  const [progressMsg, setProgressMsg] = useState<string>('🤖 AI Gia Sư đang phân tích câu hỏi...');
  const [explanation, setExplanation] = useState<AiQuestionExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');

  useEffect(() => {
    if (!question) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setExplanation(null);

    const apiKey = getStoredApiKey();

    explainQuestionWithAI(apiKey, question, userSelectedOption, (msg) => {
      if (isMounted) setProgressMsg(msg);
    }, selectedModel)
      .then((res) => {
        if (isMounted) {
          setExplanation(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Không thể kết nối AI Gia Sư. Vui lòng kiểm tra lại API Key.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [question, userSelectedOption, selectedModel]);

  if (!question) return null;

  const optLabels = ['A', 'B', 'C', 'D'];
  const correctLabel = optLabels[question.correctOption] || 'A';
  const isCorrect = userSelectedOption !== undefined && userSelectedOption === question.correctOption;
  const bookmarked = isBookmarked(question.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#FAF9F6] rounded-[2.5rem] max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#D9D2C5] overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#5A5A40] to-[#3D3D2D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm text-amber-300 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  AI Gia Sư Luyện Thi Vào 10
                </h3>
                <span className="px-2 py-0.5 bg-amber-400/30 text-amber-200 text-[10px] font-bold rounded-full">
                  Step-by-Step
                </span>
              </div>
              <p className="text-xs text-[#D9D2C5]">
                Giảng giải chi tiết phương pháp giải & phân tích bẫy đề thi
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-2.5 py-1.5 text-[11px] bg-white/15 border border-white/20 hover:bg-white/25 rounded-xl text-white outline-hidden cursor-pointer font-bold select-none"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="text-[#3D3D2D] bg-[#FAF9F6]">
                  {m.name.split(' (')[0]}
                </option>
              ))}
            </select>
            <button
              onClick={() => toggleBookmark(question.id)}
              className={`p-2 rounded-xl transition cursor-pointer ${bookmarked
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              title={bookmarked ? 'Bỏ lưu câu hỏi' : 'Lưu câu hỏi vào Bookmark'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 no-scrollbar flex-1">
          {/* Question Summary Box */}
          <div className="p-4 bg-white rounded-2xl border border-[#EAE7E0] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 bg-[#FAF9F6] text-[#5A5A40] font-bold rounded-lg border border-[#EAE7E0]">
                Mã câu: {question.id} • {question.subject === 'math' ? '📐 Môn Toán' : '🇬🇧 Môn Tiếng Anh'}
              </span>
              <div className="flex items-center space-x-2">
                {userSelectedOption !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                  >
                    Em chọn: {optLabels[userSelectedOption]} ({isCorrect ? 'Đúng ✓' : 'Chưa đúng ✗'})
                  </span>
                )}
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                  Đáp án chuẩn: {correctLabel}
                </span>
              </div>
            </div>

            {question.passage && (
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#EAE7E0] text-xs text-[#5A5A40] italic leading-relaxed">
                "{question.passage}"
              </div>
            )}

            <p className="text-xs sm:text-sm font-bold text-[#3D3D2D] leading-relaxed">
              {question.content}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {question.options.map((opt, i) => {
                const isThisCorrect = i === question.correctOption;
                const isUserChosen = userSelectedOption === i;
                return (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${isThisCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                        : isUserChosen
                          ? 'bg-red-50 border-red-300 text-red-900 line-through'
                          : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                      }`}
                  >
                    <span>
                      <strong className="mr-1">{optLabels[i]}.</strong> {opt}
                    </span>
                    {isThisCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Explanation Content or Loading State */}
          {loading ? (
            <div className="p-8 bg-white rounded-2xl border border-[#EAE7E0] text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-xs font-bold text-[#3D3D2D]">{progressMsg}</p>
              <p className="text-[11px] text-[#8A8A70]">
                Đang biên soạn phương pháp giải từng bước cho học sinh lớp 9...
              </p>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 space-y-2">
              <p className="font-bold flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Không thể tạo lời giải AI</span>
              </p>
              <p>{error}</p>
            </div>
          ) : explanation ? (
            <div className="space-y-4 animate-in fade-in">
              {/* 1. Approach & Concept */}
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                  <CompassIcon className="w-4 h-4 text-blue-700" />
                  <span>1. Hướng Tư Duy & Nhận Diện Dạng Bài:</span>
                </div>
                <p className="text-xs text-blue-950 font-medium leading-relaxed">
                  {explanation.approachMethod}
                </p>
              </div>

              {/* 2. Step-by-Step Solution */}
              <div className="p-5 bg-white rounded-2xl border border-[#EAE7E0] space-y-3 shadow-2xs">
                <div className="flex items-center space-x-2 text-[#3D3D2D] font-bold text-xs pb-2 border-b border-[#F5F2ED]">
                  <GraduationCap className="w-4 h-4 text-[#5A5A40]" />
                  <span>2. Lời Giải Chi Tiết Từng Bước:</span>
                </div>
                <div className="space-y-2.5">
                  {explanation.stepByStepSolution.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2.5 text-xs text-[#3D3D2D]">
                      <span className="w-5 h-5 rounded-full bg-[#5A5A40] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-normal">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Trap Analysis */}
              {explanation.trapAnalysis && (
                <div className="p-4 bg-[#FDF2E9] rounded-2xl border border-[#F5CBA7] space-y-1.5">
                  <div className="flex items-center space-x-2 text-[#D35400] font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-[#E67E22]" />
                    <span>3. Phân Tích Bẫy Đề Thi & Vì Sao Dễ Sai:</span>
                  </div>
                  <p className="text-xs text-[#7E5109] leading-relaxed">
                    {explanation.trapAnalysis}
                  </p>
                </div>
              )}

              {/* 4. Core Rule / Formula */}
              {explanation.coreRuleOrFormula && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs">
                    <Zap className="w-4 h-4 text-emerald-700" />
                    <span>4. Công Thức & Quy Tắc Cốt Lõi Cần Nhớ:</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-950 font-mono bg-white p-2.5 rounded-xl border border-emerald-200">
                    💡 {explanation.coreRuleOrFormula}
                  </p>
                </div>
              )}

              {/* 5. Encouragement */}
              {explanation.encouragement && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center text-xs text-amber-900 font-semibold italic">
                  💖 "{explanation.encouragement}"
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#EAE7E0] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8A8A70]">
            💡 AI Gia Sư hỗ trợ giải đáp 24/7 theo chương trình Sở GD&ĐT
          </span>
          <button
            onClick={() => {
              confetti({ particleCount: 35, spread: 45, origin: { y: 0.8 } });
              onClose();
            }}
            className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
          >
            Đã hiểu câu này ✓
          </button>
        </div>
      </div>
    </div>
  );
};

function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}
