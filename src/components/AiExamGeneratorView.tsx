import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TopicId, Exam, Question } from '../types';
import { TOPICS_META } from '../data/topicsMeta';
import {
  testGeminiApiKey,
  generateExamWithAI,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  AVAILABLE_MODELS,
  ExamGenerationConfig,
  GeneratedExamResult,
} from '../services/aiExamService';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Zap,
  Play,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  Eye,
  EyeOff,
  Wand2,
  Send,
  Layers,
  Award,
  ArrowRight,
} from 'lucide-react';

interface AiExamGeneratorViewProps {
  onStartExam: (examId: string) => void;
}

interface PresetOption {
  title: string;
  badge: string;
  badgeColor: string;
  desc: string;
  config: Partial<ExamGenerationConfig>;
}

const PRESETS: PresetOption[] = [
  {
    title: 'Đề Thi Thử Chuẩn Sở GD&ĐT (40 câu)',
    badge: 'Chuẩn 100%',
    badgeColor: 'bg-[#5A5A40] text-white',
    desc: 'Đầy đủ ma trận: Phát âm, trọng âm, ngữ pháp tổng hợp, từ vựng, đọc hiểu, cloze test và viết lại câu.',
    config: {
      title: 'Đề Thi Thử Vào Lớp 10 Chuẩn Sở GD&ĐT - AI Generator',
      targetProvince: 'Sở GD&ĐT Hà Nội / TP.HCM / Toàn quốc',
      totalQuestions: 40,
      timeLimitMinutes: 60,
      difficulty: 'standard',
      focusTopics: ['grammar', 'vocabulary', 'pronunciation', 'stress', 'reading', 'cloze', 'sentence_rewrite'],
      customPrompt: 'Ma trận đề chuẩn vào 10: 4 câu ngữ âm & trọng âm, 12 câu trắc nghiệm ngữ pháp & từ vựng, 4 câu tìm lỗi sai, 5 câu đọc điền từ, 5 câu đọc hiểu văn bản, 10 câu viết lại câu / đồng nghĩa.',
    },
  },
  {
    title: 'Chuyên Đề Ngữ Pháp & Biến Đổi Câu 8+',
    badge: 'Điểm 8+',
    badgeColor: 'bg-[#8BA888] text-[#2C3E2D]',
    desc: 'Tập trung sâu vào câu điều kiện, câu bị động, câu tường thuật, mệnh đề quan hệ và các cấu trúc biến đổi câu.',
    config: {
      title: 'Chuyên Đề Bứt Phá Ngữ Pháp & Viết Lại Câu Điểm 8+',
      targetProvince: 'Chuyên Đề Tăng Tốc Điểm Số',
      totalQuestions: 20,
      timeLimitMinutes: 30,
      difficulty: 'advanced',
      focusTopics: ['grammar', 'sentence_rewrite', 'error_identification'],
      customPrompt: 'Tập trung vào các bẫy khó: Unless, Mệnh đề quan hệ không dùng That, Bị động kép, Cấu trúc So...that / Such...that / Too...to / Enough...to, và câu điều kiện loại 1-2-3.',
    },
  },
  {
    title: 'Luyện Siêu Tốc Ngữ Âm & Trọng Âm',
    badge: '10 Phút Ăn Điểm',
    badgeColor: 'bg-[#E67E22] text-white',
    desc: 'Rèn phản xạ nhanh ăn trọn 100% điểm phát âm đuôi -s/es, -ed, nguyên âm và trọng âm 2 - 3 âm tiết.',
    config: {
      title: 'Đề Luyện Phản Xạ Nhanh: Ngữ Âm & Trọng Âm 100% Ăn Điểm',
      targetProvince: 'Phản xạ tốc độ',
      totalQuestions: 15,
      timeLimitMinutes: 15,
      difficulty: 'standard',
      focusTopics: ['pronunciation', 'stress'],
      customPrompt: 'Đề gồm các câu chọn từ có phần gạch chân phát âm khác biệt (đuôi -s/es, -ed, nguyên âm) và trọng âm từ 2, 3 âm tiết với các quy tắc và ngoại lệ hay gặp trong đề thi.',
    },
  },
  {
    title: 'Đề Chuyên Anh & Câu Hỏi Phân Loại 9-10',
    badge: 'Điểm 9-10',
    badgeColor: 'bg-[#C0392B] text-white',
    desc: 'Đề bẫy cao, cấu trúc nâng cao, thành ngữ, cụm động từ (phrasal verbs) và từ vựng theo chủ đề Unit 1-9.',
    config: {
      title: 'Đề Phân Loại Học Sinh Giỏi & Chuyên Anh Vào 10',
      targetProvince: 'Chuyên Anh & Trường Top',
      totalQuestions: 20,
      timeLimitMinutes: 40,
      difficulty: 'challenge',
      focusTopics: ['grammar', 'vocabulary', 'sentence_rewrite', 'reading'],
      customPrompt: 'Các câu hỏi có tính phân loại cao, nhiều bẫy từ vựng đồng nghĩa/trái nghĩa, collocations, phrasal verbs, câu đảo ngữ nhẹ, và đọc hiểu chủ đề môi trường / công nghệ.',
    },
  },
];

const PROMPT_SUGGESTIONS = [
  'Tập trung nhiều câu về Mệnh đề quan hệ và Câu gián tiếp',
  'Chủ đề từ vựng Unit 1-6 SGK Global Success (Môi trường, Đô thị, Văn hóa)',
  'Kèm 1 đoạn văn đọc hiểu 5 câu về Biến đổi khí hậu (Climate Change)',
  'Nhiều câu bẫy Phrasal verbs (look after, give up, take off, turn down)',
  'Luyện kỹ câu hỏi đuôi (Tag questions) và câu ước (Wish clauses)',
];

export const AiExamGeneratorView: React.FC<AiExamGeneratorViewProps> = ({ onStartExam }) => {
  const { addExam, bulkImportQuestions } = useApp();

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Exam Configuration State
  const [title, setTitle] = useState<string>('Đề Thi Thử Vào Lớp 10 Chuẩn Sở GD&ĐT');
  const [targetProvince, setTargetProvince] = useState<string>('Sở GD&ĐT Hà Nội / TP.HCM');
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [totalQuestions, setTotalQuestions] = useState<number>(20);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);
  const [selectedTopics, setSelectedTopics] = useState<TopicId[]>([
    'grammar',
    'vocabulary',
    'pronunciation',
    'stress',
    'sentence_rewrite',
  ]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GeneratedExamResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [expandedQuestionIdx, setExpandedQuestionIdx] = useState<number | null>(0);

  // Load API Key on mount
  useEffect(() => {
    const saved = getStoredApiKey();
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleSaveApiKey = (keyVal: string) => {
    setApiKey(keyVal);
    if (keyVal.trim()) {
      setStoredApiKey(keyVal.trim());
    } else {
      clearStoredApiKey();
    }
    setTestResult(null);
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'Vui lòng nhập API Key trước khi kiểm tra.' });
      return;
    }
    setTestingKey(true);
    setTestResult(null);
    const res = await testGeminiApiKey(apiKey.trim(), selectedModel);
    setTestingKey(false);
    setTestResult(res);
    if (res.success) {
      setStoredApiKey(apiKey.trim());
    }
  };

  const handleApplyPreset = (preset: PresetOption) => {
    if (preset.config.title) setTitle(preset.config.title);
    if (preset.config.targetProvince) setTargetProvince(preset.config.targetProvince);
    if (preset.config.totalQuestions) setTotalQuestions(preset.config.totalQuestions);
    if (preset.config.timeLimitMinutes) setTimeLimitMinutes(preset.config.timeLimitMinutes);
    if (preset.config.difficulty) setDifficulty(preset.config.difficulty);
    if (preset.config.focusTopics) setSelectedTopics(preset.config.focusTopics);
    if (preset.config.customPrompt) setCustomPrompt(preset.config.customPrompt);
  };

  const toggleTopic = (topicId: TopicId) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((t) => t !== topicId) : [...prev, topicId]
    );
  };

  const handleAddPromptSuggestion = (text: string) => {
    setCustomPrompt((prev) => (prev ? `${prev}. ${text}` : text));
  };

  // Generate Action
  const handleGenerateExam = async () => {
    if (!apiKey.trim() && !getStoredApiKey()) {
      setErrorMessage('Vui lòng nhập Gemini API Key ở ô bên dưới trước khi tạo đề thi.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResult(null);
    setSavedSuccess(false);

    try {
      const config: ExamGenerationConfig = {
        title,
        targetProvince,
        difficulty,
        totalQuestions,
        timeLimitMinutes,
        focusTopics: selectedTopics,
        customPrompt,
        modelName: selectedModel,
      };

      const result = await generateExamWithAI(apiKey || getStoredApiKey(), config, (step) => {
        setProgressStep(step);
      });

      setGeneratedResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra trong quá trình sinh đề thi bằng AI. Vui lòng kiểm tra API Key hoặc thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save generated exam into AppContext
  const handleSaveToLibrary = () => {
    if (!generatedResult) return;

    // 1. Bulk import questions into questions library
    bulkImportQuestions(generatedResult.questions);

    // 2. Add exam to exams list
    addExam({
      code: generatedResult.exam.code,
      title: generatedResult.exam.title,
      description: generatedResult.exam.description,
      targetProvince: generatedResult.exam.targetProvince,
      timeLimitMinutes: generatedResult.exam.timeLimitMinutes,
      totalQuestions: generatedResult.exam.totalQuestions,
      difficulty: generatedResult.exam.difficulty,
      questionIds: generatedResult.questions.map((q) => q.id),
      isOfficialFormat: false,
    });

    setSavedSuccess(true);
  };

  // Start exam directly in simulator
  const handleStartGeneratedExam = () => {
    if (!generatedResult) return;

    // 1. Bulk import questions into questions library
    bulkImportQuestions(generatedResult.questions);

    // 2. Add exam
    const createdExam = addExam({
      code: generatedResult.exam.code,
      title: generatedResult.exam.title,
      description: generatedResult.exam.description,
      targetProvince: generatedResult.exam.targetProvince,
      timeLimitMinutes: generatedResult.exam.timeLimitMinutes,
      totalQuestions: generatedResult.exam.totalQuestions,
      difficulty: generatedResult.exam.difficulty,
      questionIds: generatedResult.questions.map((q) => q.id),
      isOfficialFormat: false,
    });

    // 3. Switch to exam simulator
    onStartExam(createdExam.id);
  };

  // Copy formatted exam
  const handleCopyExamText = () => {
    if (!generatedResult) return;
    let text = `=== ${generatedResult.exam.title.toUpperCase()} ===\n`;
    text += `Mã đề: ${generatedResult.exam.code} | Thời gian: ${generatedResult.exam.timeLimitMinutes} phút | Số câu: ${generatedResult.questions.length}\n\n`;

    generatedResult.questions.forEach((q, idx) => {
      text += `Câu ${idx + 1}: ${q.content}\n`;
      if (q.passage) text += `[Đoạn văn]:\n${q.passage}\n`;
      q.options.forEach((opt) => {
        text += `   ${opt}\n`;
      });
      text += `-> Đáp án đúng: ${q.options[q.correctOption]}\n`;
      text += `-> Lời giải chi tiết: ${q.explanation}\n`;
      if (q.grammarRule) text += `-> Công thức/Quy tắc: ${q.grammarRule}\n`;
      if (q.translation) text += `-> Dịch nghĩa: ${q.translation}\n`;
      text += `------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#8BA888]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#5A5A40] text-white text-xs font-bold rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
              <span>AI Exam Generator 2.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D3D2D]">
              Tạo Đề Thi Tiếng Anh Vào 10 Bằng AI
            </h2>
            <p className="text-sm text-[#8A8A70] max-w-2xl">
              Tự động biên soạn đề thi chuẩn ma trận tuyển sinh lớp 10 theo tỉnh thành, chuyên đề ngữ pháp,
              độ khó và các yêu cầu tùy chỉnh riêng của bạn. Kèm đầy đủ 100% đáp án và giải thích chi tiết.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] text-[#5A5A40] rounded-2xl text-xs font-bold hover:bg-[#E8E2D9] transition flex items-center space-x-2"
            >
              <Key className="w-4 h-4 text-[#E67E22]" />
              <span>Lấy API Key Miễn Phí</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. API Key Box */}
      <div className="bg-[#FDFCFB] border border-[#D9D2C5] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9D2C5] pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#8BA888]/20 flex items-center justify-center text-[#5A5A40]">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#3D3D2D]">Cấu hình Gemini API Key</h3>
              <p className="text-[11px] text-[#8A8A70]">
                API Key được lưu an toàn trực tiếp trên trình duyệt của bạn (LocalStorage).
              </p>
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-[#8A8A70]">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] outline-none cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="Dán mã Gemini API Key của bạn tại đây (ví dụ: AIzaSy...)"
              className="w-full pl-4 pr-10 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs font-mono text-[#3D3D2D] placeholder-[#A09F8E] focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A70] hover:text-[#5A5A40]"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <button
              onClick={handleTestApiKey}
              disabled={testingKey || !apiKey.trim()}
              className="flex-1 px-4 py-2.5 bg-[#5A5A40] text-white rounded-2xl text-xs font-bold hover:bg-[#474733] transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {testingKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang test...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#8BA888]" />
                  <span>Kiểm tra kết nối</span>
                </>
              )}
            </button>

            {apiKey && (
              <button
                onClick={() => handleSaveApiKey('')}
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] text-[#8A8A70] hover:text-[#C0392B] rounded-2xl text-xs font-bold transition"
                title="Xóa API Key"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center space-x-2 ${
              testResult.success
                ? 'bg-[#8BA888]/20 text-[#2C3E2D] border border-[#8BA888]/40'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* 3. Quick Preset Templates */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#3D3D2D] flex items-center space-x-2">
            <Zap className="w-4 h-4 text-[#E67E22]" />
            <span>Mẫu Đề Thi Gợi Ý Nhanh (1-Chạm)</span>
          </h3>
          <span className="text-xs text-[#8A8A70]">Chọn mẫu để tự động điền cấu hình</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="bg-[#FDFCFB] border border-[#D9D2C5] p-4 rounded-3xl hover:border-[#5A5A40] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                  <span className="text-[11px] font-bold text-[#8A8A70]">
                    {preset.config.totalQuestions} câu • {preset.config.timeLimitMinutes}p
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#3D3D2D] group-hover:text-[#5A5A40] leading-snug">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-[#8A8A70] line-clamp-2 leading-relaxed">
                  {preset.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-[#5A5A40]">
                <span>Áp dụng mẫu này</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Detailed Configuration Form */}
      <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9D2C5] pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="text-base font-bold text-[#3D3D2D]">Tùy Chỉnh Ma Trận Đề Thi Chi Tiết</h3>
          </div>
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="text-xs font-bold text-[#5A5A40] flex items-center space-x-1 hover:underline"
          >
            <span>{showAdvancedSettings ? 'Thu gọn cài đặt nâng cao' : 'Hiện cài đặt nâng cao'}</span>
            {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Tên đề thi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề Thi Thử Vào 10 - Bứt Phá Ngữ Pháp & Viết Lại Câu"
              className="w-full px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] font-medium outline-none focus:border-[#5A5A40]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Tỉnh thành / Định dạng hướng tới</label>
            <input
              type="text"
              value={targetProvince}
              onChange={(e) => setTargetProvince(e.target.value)}
              placeholder="VD: Sở GD&ĐT Hà Nội / TP.HCM / Đà Nẵng"
              className="w-full px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] font-medium outline-none focus:border-[#5A5A40]"
            />
          </div>
        </div>

        {/* Parameters: Count, Time, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Số lượng câu hỏi</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[10, 15, 20, 40].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setTotalQuestions(num);
                    // Tự động gợi ý thời gian phù hợp
                    setTimeLimitMinutes(num === 10 ? 15 : num === 15 ? 25 : num === 20 ? 30 : 60);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    totalQuestions === num
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#FDFCFB] border border-[#D9D2C5] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Thời gian làm bài (phút)</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimeLimitMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    timeLimitMinutes === mins
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#FDFCFB] border border-[#D9D2C5] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {mins}p
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Độ khó mục tiêu</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'standard', label: 'Cơ bản (7đ)' },
                { id: 'advanced', label: 'Khá (8+)' },
                { id: 'challenge', label: 'Chuyên (9-10)' },
              ].map((diff) => (
                <button
                  key={diff.id}
                  type="button"
                  onClick={() => setDifficulty(diff.id as any)}
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    difficulty === diff.id
                      ? 'bg-[#5A5A40] text-white shadow-xs'
                      : 'bg-[#FDFCFB] border border-[#D9D2C5] text-[#6B6B54] hover:bg-[#E8E2D9]'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Focus Topics Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#5A5A40] block">
            Chuyên đề & Kỹ năng bao gồm trong đề ({selectedTopics.length} chuyên đề đã chọn)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOPICS_META.map((t) => {
              const isChecked = selectedTopics.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTopic(t.id)}
                  className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isChecked
                      ? 'bg-[#E8E2D9] border-[#5A5A40] text-[#3D3D2D]'
                      : 'bg-[#FDFCFB] border-[#D9D2C5] text-[#8A8A70] hover:bg-[#FAF9F6]'
                  }`}
                >
                  <span className="text-xs font-bold">{t.nameVi}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#D9D2C5]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt & Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#5A5A40]">
              Yêu cầu chi tiết bổ sung cho AI (Prompt tự do)
            </label>
            <span className="text-[11px] text-[#8A8A70]">Tùy chọn</span>
          </div>

          <textarea
            rows={3}
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ví dụ: Tập trung vào câu điều kiện loại 2-3, câu bị động kép, 5 câu hỏi đuôi và 1 bài đọc hiểu về bảo vệ môi trường..."
            className="w-full p-3 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] placeholder-[#A09F8E] outline-none focus:border-[#5A5A40]"
          />

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-[#8A8A70] self-center mr-1">
              Gợi ý nhanh:
            </span>
            {PROMPT_SUGGESTIONS.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPromptSuggestion(sug)}
                className="px-2.5 py-1 bg-[#E8E2D9] text-[#5A5A40] rounded-xl text-[11px] font-semibold hover:bg-[#D9D2C5] transition cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerateExam}
            disabled={isGenerating}
            className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-bold text-sm hover:bg-[#474733] shadow-md transition disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-[#8BA888]" />
                <span>{progressStep || 'Đang tạo đề thi bằng Gemini AI...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-[#E67E22]" />
                <span>Tạo Đề Thi {totalQuestions} Câu Bằng AI Ngay</span>
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Không thể tạo đề thi</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* 5. Generation Results Preview */}
      {generatedResult && (
        <div className="bg-[#FAF9F6] border-2 border-[#8BA888] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D2C5] pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-[#8BA888] text-[#2C3E2D] text-[10px] font-bold rounded-full uppercase">
                  Đã tạo thành công
                </span>
                <span className="text-xs font-mono text-[#8A8A70]">{generatedResult.exam.code}</span>
              </div>
              <h3 className="text-xl font-bold text-[#3D3D2D]">{generatedResult.exam.title}</h3>
              <p className="text-xs text-[#8A8A70]">
                {generatedResult.exam.totalQuestions} câu hỏi • Thời gian {generatedResult.exam.timeLimitMinutes} phút • {generatedResult.exam.targetProvince}
              </p>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleStartGeneratedExam}
                className="px-5 py-2.5 bg-[#5A5A40] text-white rounded-2xl text-xs font-bold hover:bg-[#474733] shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Vào Làm Bài Thi Ngay</span>
              </button>

              <button
                onClick={handleSaveToLibrary}
                disabled={savedSuccess}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition flex items-center space-x-1.5 cursor-pointer ${
                  savedSuccess
                    ? 'bg-[#8BA888]/20 border-[#8BA888] text-[#2C3E2D]'
                    : 'bg-[#FDFCFB] border-[#D9D2C5] text-[#5A5A40] hover:bg-[#E8E2D9]'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đã lưu vào kho đề</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#5A5A40]" />
                    <span>Lưu vào kho đề</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyExamText}
                className="px-3.5 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs font-bold text-[#5A5A40] hover:bg-[#E8E2D9] transition flex items-center space-x-1.5 cursor-pointer"
                title="Sao chép đề thi dạng văn bản"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đã copy!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#8A8A70]" />
                    <span>Copy đề</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Questions Accordion List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#3D3D2D]">
                Xem trước {generatedResult.questions.length} câu hỏi vừa sinh:
              </h4>
              <span className="text-[11px] text-[#8A8A70]">Nhấn vào từng câu để xem đáp án & giải thích</span>
            </div>

            <div className="space-y-2">
              {generatedResult.questions.map((q, idx) => {
                const isExpanded = expandedQuestionIdx === idx;
                return (
                  <div
                    key={idx}
                    className="bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl overflow-hidden shadow-2xs"
                  >
                    <div
                      onClick={() => setExpandedQuestionIdx(isExpanded ? null : idx)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-[#FAF9F6] transition"
                    >
                      <div className="flex items-start space-x-3 pr-4">
                        <span className="w-6 h-6 rounded-full bg-[#E8E2D9] text-[#5A5A40] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#3D3D2D] leading-snug">
                            {q.content}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-[#8A8A70]">
                            <span className="capitalize">Chủ đề: {q.topicId}</span>
                            <span>•</span>
                            <span className="capitalize">Độ khó: {q.difficulty}</span>
                            <span>•</span>
                            <span className="font-bold text-emerald-700">
                              Đáp án: {['A', 'B', 'C', 'D'][q.correctOption]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[#8A8A70] shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-[#E8E2D9] bg-[#FAF9F6] space-y-3 text-xs">
                        {q.passage && (
                          <div className="p-3 bg-[#E8E2D9]/40 border border-[#D9D2C5] rounded-xl text-[11px] text-[#4A4A4A] italic leading-relaxed">
                            <span className="font-bold not-italic text-[#5A5A40] block mb-1">
                              [Đoạn văn đọc]:
                            </span>
                            {q.passage}
                          </div>
                        )}

                        {/* Options */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctOption;
                            return (
                              <div
                                key={optIdx}
                                className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                  isCorrect
                                    ? 'bg-[#8BA888]/20 border-[#8BA888] text-[#2C3E2D] font-bold'
                                    : 'bg-[#FDFCFB] border-[#D9D2C5] text-[#5A5A40]'
                                }`}
                              >
                                <span>{opt}</span>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanations & Rules */}
                        <div className="p-3 bg-[#FDFCFB] border border-[#D9D2C5] rounded-xl space-y-2 text-[11px]">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#5A5A40]">💡 Lời giải chi tiết: </span>
                            <span className="text-[#3D3D2D]">{q.explanation}</span>
                          </div>
                          {q.grammarRule && (
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#8BA888]">📐 Quy tắc / Công thức: </span>
                              <span className="text-[#3D3D2D]">{q.grammarRule}</span>
                            </div>
                          )}
                          {q.commonMistakeTip && (
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#E67E22]">⚠️ Mẹo tránh bẫy: </span>
                              <span className="text-[#3D3D2D]">{q.commonMistakeTip}</span>
                            </div>
                          )}
                          {q.translation && (
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#8A8A70]">🇻🇳 Dịch nghĩa: </span>
                              <span className="text-[#6B6B54] italic">{q.translation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
