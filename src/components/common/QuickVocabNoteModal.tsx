import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord } from '../../types';
import { generateSentenceVocabInfoWithAI } from '../../services/aiSentenceGradingService';
import {
  X,
  Sparkles,
  Volume2,
  Bookmark,
  Check,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Plus,
  Loader2,
  Tag,
  FileText,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuickVocabNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  contextSentence?: string;
  sourceTitle?: string;
  onWordSaved?: (newWord: VocabularyWord) => void;
}

export const QuickVocabNoteModal: React.FC<QuickVocabNoteModalProps> = ({
  isOpen,
  onClose,
  initialWord = '',
  contextSentence = '',
  sourceTitle = 'Đề thi / Bài tập',
  onWordSaved,
}) => {
  const { addVocabularyWord, toggleVocabStarred } = useApp();

  const [word, setWord] = useState<string>('');
  const [ipa, setIpa] = useState<string>('');
  const [partOfSpeech, setPartOfSpeech] = useState<
    'noun' | 'verb' | 'adj' | 'adv' | 'phrasal_verb' | 'idiom' | 'collocation'
  >('noun');
  const [meaningVi, setMeaningVi] = useState<string>('');
  const [exampleEn, setExampleEn] = useState<string>('');
  const [exampleVi, setExampleVi] = useState<string>('');
  const [category, setCategory] = useState<string>('Vocab From Exam');
  const [userNote, setUserNote] = useState<string>('');
  const [isStarred, setIsStarred] = useState<boolean>(false);

  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Initialize or reset when modal opens or initialWord changes
  useEffect(() => {
    if (isOpen) {
      const cleanWord = (initialWord || '').trim();
      setWord(cleanWord);
      setIpa('');
      setPartOfSpeech('noun');
      setMeaningVi('');
      setExampleEn(contextSentence ? contextSentence.trim() : '');
      setExampleVi('');
      setCategory('Vocab From Exam');
      setUserNote('');
      setIsStarred(false);
      setSaveSuccessMsg(null);

      // Auto-trigger AI lookup if a word was selected!
      if (cleanWord && cleanWord.length >= 2 && cleanWord.length <= 40) {
        handleAiAutoLookup(cleanWord, contextSentence);
      }
    }
  }, [isOpen, initialWord, contextSentence]);

  if (!isOpen) return null;

  const handleAiAutoLookup = async (lookupWord?: string, lookupContext?: string) => {
    const targetWord = lookupWord || word;
    if (!targetWord.trim()) return;

    setIsAiLoading(true);
    try {
      const info = await generateSentenceVocabInfoWithAI(targetWord, lookupContext || contextSentence);
      if (info) {
        if (info.word) setWord(info.word);
        if (info.ipa) setIpa(info.ipa);
        if (info.partOfSpeech) setPartOfSpeech(info.partOfSpeech as any);
        if (info.meaningVi) setMeaningVi(info.meaningVi);
        if (info.exampleEn) setExampleEn(info.exampleEn);
        if (info.exampleVi) setExampleVi(info.exampleVi);
        if (info.category) setCategory(info.category);
      }
    } catch (e) {
      console.warn('AI Vocab Auto Lookup failed:', e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaningVi.trim()) {
      alert('Vui lòng nhập Từ vựng tiếng Anh và Nghĩa tiếng Việt!');
      return;
    }

    const newWordPayload: Omit<VocabularyWord, 'id'> = {
      word: word.trim(),
      ipa: ipa.trim() || undefined,
      partOfSpeech,
      meaningVi: meaningVi.trim(),
      exampleEn: exampleEn.trim() || `Example with ${word.trim()}`,
      exampleVi: exampleVi.trim() || undefined,
      unit: sourceTitle || 'Đề thi vào 10',
      theme: category || 'Vocab From Exam',
      dateAdded: new Date().toISOString(),
      source: 'manual',
    };

    const savedWord = addVocabularyWord(newWordPayload);

    if (isStarred && savedWord && savedWord.id) {
      toggleVocabStarred(savedWord.id);
    }

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (_) {}

    if (onWordSaved) {
      onWordSaved(savedWord);
    }

    setSaveSuccessMsg(`✅ Đã lưu từ "${word}" vào Sổ tay Flashcard!`);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EAE7E0] space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5 text-[#8BA888]" />
            </div>
            <div>
              <h3 className="font-bold text-[#3D3D2D] text-base flex items-center space-x-1.5">
                <span>Lưu Từ Mới Vào Sổ Tay</span>
                <span className="px-2 py-0.5 bg-[#F5F2ED] text-[#5A5A40] rounded-full text-[10px] font-semibold">
                  Flashcard & SRS
                </span>
              </h3>
              <p className="text-[11px] text-[#8A8A70]">
                Nguồn: <span className="font-medium text-[#5A5A40]">{sourceTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8A8A70] hover:text-[#3D3D2D] rounded-xl hover:bg-[#FAF9F6] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Sentence Banner if available */}
        {contextSentence && (
          <div className="p-3 bg-[#FAF9F6] border border-[#EAE7E0] rounded-2xl text-xs space-y-1">
            <p className="text-[10px] font-bold text-[#8A8A70] uppercase tracking-wider flex items-center space-x-1">
              <FileText className="w-3 h-3 text-[#5A5A40]" />
              <span>Ngữ cảnh câu trong đề thi:</span>
            </p>
            <p className="text-[#3D3D2D] italic leading-relaxed">
              "{contextSentence}"
            </p>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Word Input + Audio + AI Auto Fill */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#3D3D2D]">Từ / Cụm từ tiếng Anh (*):</label>
              <button
                type="button"
                onClick={() => handleAiAutoLookup()}
                disabled={isAiLoading || !word.trim()}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    <span>Đang tra AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    <span>⚡ AI Tra nghĩa & Điền mẫu</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                placeholder="VD: craftsman, take off, environmental..."
                required
                className="flex-1 px-3.5 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-bold text-sm text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
              />
              <button
                type="button"
                onClick={() => word.trim() && handleSpeak(word)}
                title="Nghe phát âm chuẩn"
                className="p-2.5 bg-[#FAF9F6] hover:bg-[#EAE7E0] border border-[#EAE7E0] text-[#5A5A40] rounded-xl transition cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* IPA & Part of Speech */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="font-bold text-[#3D3D2D]">Phiên âm IPA:</label>
              <input
                type="text"
                value={ipa}
                onChange={(e) => setIpa(e.target.value)}
                placeholder="VD: /ˈkrɑːftsmən/"
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-mono text-xs text-[#5A5A40] outline-hidden focus:border-[#5A5A40]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#3D3D2D]">Loại từ:</label>
              <select
                value={partOfSpeech}
                onChange={(e) => setPartOfSpeech(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-bold text-xs text-[#3D3D2D] outline-hidden focus:border-[#5A5A40] cursor-pointer"
              >
                <option value="noun">Danh từ (Noun - n.)</option>
                <option value="verb">Động từ (Verb - v.)</option>
                <option value="adj">Tính từ (Adj - a.)</option>
                <option value="adv">Trạng từ (Adv - adv.)</option>
                <option value="phrasal_verb">Cụm động từ (Phrasal Verb)</option>
                <option value="idiom">Thành ngữ (Idiom)</option>
                <option value="collocation">Cụm từ cố định (Collocation)</option>
              </select>
            </div>
          </div>

          {/* Meaning Vi */}
          <div className="space-y-1">
            <label className="font-bold text-[#3D3D2D]">Nghĩa tiếng Việt (*):</label>
            <input
              type="text"
              value={meaningVi}
              onChange={(e) => setMeaningVi(e.target.value)}
              placeholder="VD: thợ thủ công, nghệ nhân làm đồ mỹ nghệ..."
              required
              className="w-full px-3.5 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl font-bold text-xs text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
            />
          </div>

          {/* Example Sentence EN & VI */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-bold text-[#3D3D2D]">Câu ví dụ tiếng Anh:</label>
              <input
                type="text"
                value={exampleEn}
                onChange={(e) => setExampleEn(e.target.value)}
                placeholder="VD: The craftsman spent hours carving the wooden statue."
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs text-[#3D3D2D] outline-hidden focus:border-[#5A5A40]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-[#3D3D2D]">Dịch nghĩa câu ví dụ:</label>
              <input
                type="text"
                value={exampleVi}
                onChange={(e) => setExampleVi(e.target.value)}
                placeholder="VD: Người thợ thủ công đã dành hàng giờ để khắc bức tượng gỗ."
                className="w-full px-3 py-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-xs text-[#6B6B54] outline-hidden focus:border-[#5A5A40]"
              />
            </div>
          </div>

          {/* Star & Category Options */}
          <div className="pt-2 border-t border-[#F5F2ED] flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsStarred(!isStarred)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                isStarred
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-[#FAF9F6] text-[#8A8A70] border-[#EAE7E0] hover:text-[#3D3D2D]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isStarred ? 'Đã ghim từ quan trọng ★' : 'Ghim từ quan trọng'}</span>
            </button>

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!word.trim() || !meaningVi.trim()}
                className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-[#8BA888]" />
                <span>Lưu vào Sổ từ</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
