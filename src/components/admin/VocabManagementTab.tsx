import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VocabularyWord, DailyVocabSyncConfig } from '../../types';
import { VOCAB_CATEGORIES } from '../../data/vocabCuratedBank';
import { getStoredApiKey } from '../../services/aiExamService';
import { generateVocabBatchWithAI, parseVocabRawText, getTodayDateString } from '../../services/vocabService';
import {
  BookOpen,
  Plus,
  Wand2,
  Upload,
  Search,
  Volume2,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  Settings,
  X,
  Check,
  Zap,
  Tag,
  BookMarked,
  Filter,
  Download,
  AlertTriangle,
} from 'lucide-react';

export const VocabManagementTab: React.FC = () => {
  const {
    vocabularyWords,
    dailyVocabConfig,
    addVocabularyWord,
    updateVocabularyWord,
    deleteVocabularyWord,
    bulkImportVocabularyWords,
    triggerDailyVocabImport,
    updateDailyVocabConfig,
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState<string>('all');
  const [selectedBatchDate, setSelectedBatchDate] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Form states for Add/Edit
  const [formWord, setFormWord] = useState<string>('');
  const [formIpa, setFormIpa] = useState<string>('');
  const [formPartOfSpeech, setFormPartOfSpeech] = useState<VocabularyWord['partOfSpeech']>('noun');
  const [formMeaningVi, setFormMeaningVi] = useState<string>('');
  const [formExampleEn, setFormExampleEn] = useState<string>('');
  const [formExampleVi, setFormExampleVi] = useState<string>('');
  const [formUnit, setFormUnit] = useState<string>('Unit 1');
  const [formTheme, setFormTheme] = useState<string>('Local Environment');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formCollocations, setFormCollocations] = useState<string>('');

  // AI Gen states
  const [aiTopic, setAiTopic] = useState<string>('Unit 1 to 12 & Grade 9-10 Entrance Exam');
  const [aiDifficulty, setAiDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [aiCount, setAiCount] = useState<number>(20);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Import states
  const [rawImportText, setRawImportText] = useState<string>('');
  const [importResult, setImportResult] = useState<string | null>(null);

  // Manual Trigger state
  const [isTriggeringDaily, setIsTriggeringDaily] = useState<boolean>(false);
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null);

  const todayStr = getTodayDateString();

  // Unique Batch Dates
  const batchDates = useMemo(() => {
    const dates = new Set<string>();
    vocabularyWords.forEach((w) => {
      if (w.dailyBatch) dates.add(w.dailyBatch);
    });
    return Array.from(dates).sort().reverse();
  }, [vocabularyWords]);

  // Today's words count
  const todayWordsCount = useMemo(() => {
    return vocabularyWords.filter((w) => w.dailyBatch === todayStr).length;
  }, [vocabularyWords, todayStr]);

  // Filtered Vocabulary List
  const filteredWords = useMemo(() => {
    return vocabularyWords.filter((w) => {
      if (selectedCategory !== 'all') {
        const cat = VOCAB_CATEGORIES.find((c) => c.id === selectedCategory);
        if (cat) {
          const matchUnit = w.unit.toLowerCase().includes(cat.unit.toLowerCase());
          const matchTheme = w.theme.toLowerCase().includes(cat.unit.toLowerCase());
          if (!matchUnit && !matchTheme) return false;
        }
      }

      if (selectedDifficulty !== 'all' && w.difficulty !== selectedDifficulty) {
        return false;
      }

      if (selectedPartOfSpeech !== 'all' && w.partOfSpeech !== selectedPartOfSpeech) {
        return false;
      }

      if (selectedBatchDate !== 'all') {
        if (selectedBatchDate === 'today' && w.dailyBatch !== todayStr) return false;
        if (selectedBatchDate !== 'today' && w.dailyBatch !== selectedBatchDate) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchWord = w.word.toLowerCase().includes(q);
        const matchMeaning = w.meaningVi.toLowerCase().includes(q);
        const matchTheme = w.theme.toLowerCase().includes(q);
        const matchUnit = w.unit.toLowerCase().includes(q);
        if (!matchWord && !matchMeaning && !matchTheme && !matchUnit) return false;
      }

      return true;
    });
  }, [
    vocabularyWords,
    selectedCategory,
    selectedDifficulty,
    selectedPartOfSpeech,
    selectedBatchDate,
    searchQuery,
    todayStr,
  ]);

  // Speech pronunciation helper
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (w: VocabularyWord) => {
    setEditingWord(w);
    setFormWord(w.word);
    setFormIpa(w.ipa || '');
    setFormPartOfSpeech(w.partOfSpeech || 'noun');
    setFormMeaningVi(w.meaningVi || '');
    setFormExampleEn(w.exampleEn || '');
    setFormExampleVi(w.exampleVi || '');
    setFormUnit(w.unit || 'Unit 1');
    setFormTheme(w.theme || 'Local Environment');
    setFormDifficulty(w.difficulty || 'medium');
    setFormCollocations((w.collocations || []).join(', '));
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingWord(null);
    setFormWord('');
    setFormIpa('');
    setFormPartOfSpeech('noun');
    setFormMeaningVi('');
    setFormExampleEn('');
    setFormExampleVi('');
    setFormUnit('Unit 1');
    setFormTheme('Local Environment');
    setFormDifficulty('medium');
    setFormCollocations('');
    setShowAddModal(true);
  };

  // Save Word (Add or Edit)
  const handleSaveWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWord.trim() || !formMeaningVi.trim()) return;

    const collocationsArray = formCollocations
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const payload = {
      word: formWord.trim(),
      ipa: formIpa.trim().startsWith('/') ? formIpa.trim() : formIpa.trim() ? `/${formIpa.trim()}/` : '',
      partOfSpeech: formPartOfSpeech,
      meaningVi: formMeaningVi.trim(),
      exampleEn: formExampleEn.trim(),
      exampleVi: formExampleVi.trim(),
      unit: formUnit.trim() || 'Unit 1',
      theme: formTheme.trim() || 'Chuyên đề ôn thi',
      difficulty: formDifficulty,
      collocations: collocationsArray,
      source: 'admin' as const,
    };

    if (editingWord) {
      updateVocabularyWord(editingWord.id, payload);
      setEditingWord(null);
    } else {
      addVocabularyWord(payload);
      setShowAddModal(false);
    }
  };

  // Handle AI Generate Batch
  const handleGenerateAiBatch = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setAiError('Vui lòng cài đặt Gemini API Key trong thanh công cụ trước khi dùng AI.');
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    try {
      const generated = await generateVocabBatchWithAI(
        apiKey,
        aiCount,
        aiTopic,
        aiDifficulty
      );
      bulkImportVocabularyWords(generated);
      setShowAiModal(false);
      alert(`Đã dùng AI tạo và nạp thành công ${generated.length} từ vựng mới!`);
    } catch (err: any) {
      setAiError(err.message || 'Lỗi khi gọi AI tạo từ vựng.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Handle Raw Text Import
  const handleImportRawText = () => {
    if (!rawImportText.trim()) return;
    try {
      const parsed = parseVocabRawText(rawImportText);
      if (parsed.length === 0) {
        setImportResult('Không tìm thấy dữ liệu từ vựng hợp lệ. Vui lòng kiểm tra lại định dạng.');
        return;
      }
      bulkImportVocabularyWords(parsed);
      setImportResult(`Đã nhập thành công ${parsed.length} từ vựng vào kho!`);
      setRawImportText('');
      setTimeout(() => {
        setImportResult(null);
        setShowImportModal(false);
      }, 1200);
    } catch (err: any) {
      setImportResult(`Lỗi: ${err.message}`);
    }
  };

  // Handle Manual Midnight Trigger
  const handleManualDailyTrigger = async () => {
    setIsTriggeringDaily(true);
    setTriggerMsg(null);
    try {
      const res = await triggerDailyVocabImport(true);
      if (res) {
        setTriggerMsg(`✅ Đã nạp thành công gói ${res.count} từ mới cho ngày ${res.date}!`);
      } else {
        setTriggerMsg('Gói từ vựng hôm nay đã được nạp trước đó.');
      }
      setTimeout(() => setTriggerMsg(null), 3000);
    } catch (err: any) {
      setTriggerMsg(`❌ Lỗi: ${err.message}`);
    } finally {
      setIsTriggeringDaily(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-bold uppercase">
            <BookOpen className="w-4 h-4 text-[#5A5A40]" />
            <span>Tổng từ vựng</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#5A5A40]">{vocabularyWords.length}</p>
          <span className="text-[11px] text-[#64748B] block">Từ vựng ôn thi vào 10</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-bold uppercase">
            <Sparkles className="w-4 h-4 text-[#E67E22]" />
            <span>Gói nạp hôm nay</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#E67E22]">{todayWordsCount} từ</p>
          <span className="text-[11px] text-[#64748B] block">Gói ngày {todayStr}</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-bold uppercase">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Chuyên đề & Unit</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-800">{VOCAB_CATEGORIES.length}</p>
          <span className="text-[11px] text-[#64748B] block">12 Unit + Phrasal/Idioms</span>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-1">
          <div className="flex items-center space-x-2 text-[#64748B] text-xs font-bold uppercase">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>Tự động nạp (12h đêm)</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700">
            {dailyVocabConfig.enabled ? '00:00 (12h đêm)' : 'Đang tắt'}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold block">
            {dailyVocabConfig.enabled ? '20 từ / ngày tự động' : 'Chưa bật auto'}
          </span>
        </div>
      </div>

      {/* Action Toolbar Grid */}
      <div className="bg-white p-5 rounded-[2rem] border border-[#EAE7E0] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#F5F2ED]">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#5A5A40] text-white flex items-center justify-center font-bold text-base shadow-2xs">
              📚
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-[#3D3D2D]">
                Quản Lý Kho Từ Vựng & Flashcards Ôn Thi Vào 10
              </h3>
              <p className="text-xs text-[#64748B]">
                Thêm, sửa, xóa, phân loại và cấu hình tác vụ tự động nạp 20 từ mỗi ngày lúc 12h đêm cho học sinh
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualDailyTrigger}
              disabled={isTriggeringDaily}
              className="px-4 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              title="Kích hoạt nạp ngay 20 từ vựng cho ngày hôm nay"
            >
              {isTriggeringDaily ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang nạp...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Nạp 20 từ hôm nay ngay</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] rounded-xl border border-[#D9D2C5] transition cursor-pointer"
              title="Cài đặt tự động nạp 12h đêm"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {triggerMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{triggerMsg}</span>
          </div>
        )}

        {/* 4 Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="p-3 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm từ mới</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>AI Tạo 20 từ theo chủ đề</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="p-3 bg-white hover:bg-[#FAF9F6] text-[#3D3D2D] border border-[#D9D2C5] rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Upload className="w-4 h-4 text-amber-600" />
            <span>Import CSV / JSON / Text</span>
          </button>

          <button
            onClick={() => {
              const jsonBlob = new Blob([JSON.stringify(vocabularyWords, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(jsonBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Edu10_Vocabulary_${todayStr}.json`;
              a.click();
            }}
            className="p-3 bg-white hover:bg-[#FAF9F6] text-[#3D3D2D] border border-[#D9D2C5] rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#8BA888]" />
            <span>Xuất file JSON kho từ</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-[#FAF9F6] p-4 rounded-[2rem] border border-[#EAE7E0] space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo từ, nghĩa tiếng Việt, chủ đề..."
              className="w-full pl-10 pr-3 py-2 bg-white border border-[#EAE7E0] rounded-xl text-xs outline-hidden focus:ring-1 focus:ring-[#5A5A40] text-[#3D3D2D]"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white p-1 rounded-xl border border-[#D9D2C5] text-xs font-bold">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
            >
              Lưới Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B6B54]'
              }`}
            >
              Bảng Danh Sách
            </button>
          </div>
        </div>

        {/* 4 Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          {/* Topic / Unit Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 bg-white border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
          >
            <option value="all">📂 Tất cả Chủ đề / Unit ({vocabularyWords.length})</option>
            {VOCAB_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.nameVi}
              </option>
            ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="p-2 bg-white border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
          >
            <option value="all">🎯 Tất cả cấp độ</option>
            <option value="easy">🟢 Cơ bản (Mục tiêu 6 - 7.5đ)</option>
            <option value="medium">🟡 Khá - Giỏi (Mục tiêu 7.5 - 8.75đ)</option>
            <option value="hard">🔴 Nâng cao (Mục tiêu 9 - 10đ)</option>
          </select>

          {/* Part of Speech Filter */}
          <select
            value={selectedPartOfSpeech}
            onChange={(e) => setSelectedPartOfSpeech(e.target.value)}
            className="p-2 bg-white border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
          >
            <option value="all">🏷️ Tất cả từ loại</option>
            <option value="noun">Danh từ (noun)</option>
            <option value="verb">Động từ (verb)</option>
            <option value="adj">Tính từ (adj)</option>
            <option value="adv">Trạng từ (adv)</option>
            <option value="phrasal_verb">Cụm động từ (phrasal verb)</option>
            <option value="collocation">Collocation</option>
            <option value="idiom">Thành ngữ (idiom)</option>
          </select>

          {/* Batch Date Filter */}
          <select
            value={selectedBatchDate}
            onChange={(e) => setSelectedBatchDate(e.target.value)}
            className="p-2 bg-white border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D] cursor-pointer"
          >
            <option value="all">📅 Tất cả ngày nạp</option>
            <option value="today">🎁 Gói nạp hôm nay ({todayStr})</option>
            {batchDates
              .filter((d) => d !== todayStr)
              .map((d) => (
                <option key={d} value={d}>
                  Gói ngày {d}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Vocabulary Items List / Table */}
      {filteredWords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[2rem] border border-dashed border-[#D9D2C5] space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF9F6] flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <h4 className="text-sm font-bold text-[#3D3D2D]">Không tìm thấy từ vựng nào phù hợp</h4>
          <p className="text-xs text-[#64748B]">Hãy thay đổi bộ lọc hoặc thêm từ vựng mới vào kho.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setSelectedPartOfSpeech('all');
              setSelectedBatchDate('all');
            }}
            className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] text-xs font-bold rounded-xl border border-[#D9D2C5] cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredWords.map((w, idx) => (
            <div
              key={w.id || idx}
              className="p-4 bg-white hover:border-[#5A5A40] rounded-2xl border border-[#EAE7E0] transition flex flex-col justify-between space-y-3 shadow-2xs group"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-[#3D3D2D]">{w.word}</span>
                      <button
                        onClick={() => speakWord(w.word)}
                        className="p-1 rounded-lg bg-[#FAF9F6] hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                        title="Nghe phát âm chuẩn"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {w.ipa && <p className="text-xs text-[#64748B] font-mono">{w.ipa}</p>}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                      w.difficulty === 'hard'
                        ? 'bg-red-100 text-red-800'
                        : w.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {w.difficulty === 'hard' ? 'Nâng cao' : w.difficulty === 'medium' ? 'Khá' : 'Cơ bản'}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                  <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#5A5A40] text-[10px] font-bold rounded border border-[#EAE7E0]">
                    {w.partOfSpeech}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold rounded">
                    {w.unit}
                  </span>
                  {w.dailyBatch === todayStr && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-extrabold rounded">
                      🎁 Gói hôm nay
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-[#5A5A40] pt-1">{w.meaningVi}</p>

                {w.exampleEn && (
                  <div className="p-2 bg-[#FAF9F6] rounded-xl text-[11px] text-[#3D3D2D] italic space-y-0.5 border border-[#F5F2ED]">
                    <p>"{w.exampleEn}"</p>
                    {w.exampleVi && <p className="text-[#64748B] not-italic">({w.exampleVi})</p>}
                  </div>
                )}

                {w.collocations && w.collocations.length > 0 && (
                  <div className="text-[10px] text-[#64748B] flex items-center space-x-1 flex-wrap">
                    <span className="font-bold text-[#3D3D2D]">Collocation:</span>
                    <span>{w.collocations.join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F5F2ED] text-xs">
                <span className="text-[10px] text-[#64748B]">
                  {w.dailyBatch ? `Ngày: ${w.dailyBatch}` : 'Kho từ vựng'}
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(w)}
                    className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] transition cursor-pointer"
                    title="Chỉnh sửa từ vựng"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Bạn có chắc muốn xóa từ "${w.word}"?`)) {
                        deleteVocabularyWord(w.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                    title="Xóa từ vựng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-[2rem] border border-[#EAE7E0] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#EAE7E0] text-[#64748B] uppercase font-extrabold text-[10px]">
                  <th className="p-3.5">Từ vựng & IPA</th>
                  <th className="p-3.5">Loại từ</th>
                  <th className="p-3.5">Nghĩa tiếng Việt</th>
                  <th className="p-3.5">Chủ đề / Unit</th>
                  <th className="p-3.5">Cấp độ</th>
                  <th className="p-3.5">Ví dụ & Collocations</th>
                  <th className="p-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2ED]">
                {filteredWords.map((w, idx) => (
                  <tr key={w.id || idx} className="hover:bg-[#FAF9F6] transition">
                    <td className="p-3.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-[#3D3D2D]">{w.word}</span>
                        <button
                          onClick={() => speakWord(w.word)}
                          className="p-1 rounded bg-[#FAF9F6] text-blue-700 hover:bg-blue-100 cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono">{w.ipa}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-[#FAF9F6] text-[#5A5A40] font-bold rounded border border-[#EAE7E0] text-[10px]">
                        {w.partOfSpeech}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[#5A5A40]">{w.meaningVi}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold text-[10px]">
                        {w.unit}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          w.difficulty === 'hard'
                            ? 'bg-red-100 text-red-800'
                            : w.difficulty === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {w.difficulty === 'hard' ? 'Nâng cao' : w.difficulty === 'medium' ? 'Khá' : 'Cơ bản'}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-xs truncate text-[11px] text-[#64748B]">
                      {w.exampleEn || (w.collocations && w.collocations.join(', ')) || '--'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          className="p-1.5 rounded-lg bg-[#FAF9F6] hover:bg-[#EAE7E0] text-[#5A5A40] cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa từ "${w.word}"?`)) {
                              deleteVocabularyWord(w.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ➕ MODAL: ADD / EDIT SINGLE WORD                                          */}
      {/* ========================================================================= */}
      {(showAddModal || editingWord) && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setEditingWord(null);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EAE7E0] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-extrabold text-[#3D3D2D] text-base">
                {editingWord ? '✏️ Chỉnh Sửa Từ Vựng' : '➕ Thêm Từ Vựng Mới'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingWord(null);
                }}
                className="p-1 text-[#64748B] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Từ tiếng Anh (*):</label>
                  <input
                    type="text"
                    value={formWord}
                    onChange={(e) => setFormWord(e.target.value)}
                    placeholder="e.g. craftsman"
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold text-[#3D3D2D]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Phiên âm IPA:</label>
                  <input
                    type="text"
                    value={formIpa}
                    onChange={(e) => setFormIpa(e.target.value)}
                    placeholder="e.g. /ˈkrɑːftsmən/"
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Loại từ:</label>
                  <select
                    value={formPartOfSpeech}
                    onChange={(e) => setFormPartOfSpeech(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold cursor-pointer"
                  >
                    <option value="noun">Danh từ (noun)</option>
                    <option value="verb">Động từ (verb)</option>
                    <option value="adj">Tính từ (adj)</option>
                    <option value="adv">Trạng từ (adv)</option>
                    <option value="phrasal_verb">Cụm động từ (phrasal_verb)</option>
                    <option value="collocation">Collocation</option>
                    <option value="idiom">Thành ngữ (idiom)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Cấp độ:</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold cursor-pointer"
                  >
                    <option value="easy">🟢 Cơ bản</option>
                    <option value="medium">🟡 Khá - Giỏi</option>
                    <option value="hard">🔴 Nâng cao / Chuyên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Nghĩa tiếng Việt (*):</label>
                <input
                  type="text"
                  value={formMeaningVi}
                  onChange={(e) => setFormMeaningVi(e.target.value)}
                  placeholder="e.g. thợ thủ công, nghệ nhân"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold text-[#3D3D2D]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Unit / Chuyên đề:</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="e.g. Unit 1"
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Chủ đề chi tiết:</label>
                  <input
                    type="text"
                    value={formTheme}
                    onChange={(e) => setFormTheme(e.target.value)}
                    placeholder="e.g. Local Environment"
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Câu ví dụ tiếng Anh:</label>
                <textarea
                  rows={2}
                  value={formExampleEn}
                  onChange={(e) => setFormExampleEn(e.target.value)}
                  placeholder="e.g. The skilled craftsman made this vase by hand."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Dịch nghĩa câu ví dụ:</label>
                <textarea
                  rows={2}
                  value={formExampleVi}
                  onChange={(e) => setFormExampleVi(e.target.value)}
                  placeholder="e.g. Người thợ thủ công lành nghề làm chiếc bình này bằng tay."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden text-[#3D3D2D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Collocations (cách nhau dấu phẩy):</label>
                <input
                  type="text"
                  value={formCollocations}
                  onChange={(e) => setFormCollocations(e.target.value)}
                  placeholder="e.g. skilled craftsman, traditional artisan"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingWord(null);
                  }}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingWord ? 'Cập nhật từ vựng' : 'Lưu từ vựng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🤖 MODAL: AI GENERATE 20 VOCABULARY WORDS                                 */}
      {/* ========================================================================= */}
      {showAiModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isAiGenerating) setShowAiModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Wand2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-[#3D3D2D] text-base">AI Sinh 20 Từ Vựng</h3>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                disabled={isAiGenerating}
                className="p-1 text-[#64748B] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Chủ đề mong muốn:</label>
                <select
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                >
                  <option value="Unit 1 to 12 & Grade 9-10 Entrance Exam">✨ Tổng hợp 12 Unit Lớp 9 vào 10</option>
                  {VOCAB_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.nameVi}>
                      {cat.icon} {cat.nameVi}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Mức độ khó:</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  >
                    <option value="all">Tổng hợp chuẩn đề thi</option>
                    <option value="easy">Cơ bản (6 - 7.5đ)</option>
                    <option value="medium">Khá - Giỏi (7.5 - 8.75đ)</option>
                    <option value="hard">Nâng cao (9 - 10đ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#5A5A40] mb-1">Số lượng từ:</label>
                  <input
                    type="number"
                    min={5}
                    max={40}
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                  />
                </div>
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  disabled={isAiGenerating}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleGenerateAiBatch}
                  disabled={isAiGenerating}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isAiGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Gemini đang soạn từ...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Sinh & Nạp ngay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📥 MODAL: BULK IMPORT (CSV / JSON / TEXT)                                 */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowImportModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-[#3D3D2D] text-base">Import Từ Vựng Hàng Loạt</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-[#64748B] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B]">
                Dán mảng JSON hoặc định dạng dòng CSV (mỗi dòng 1 từ: <code>Từ | Nghĩa | IPA | Loại từ | Ví dụ</code>):
              </p>

              <textarea
                rows={7}
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder={`craftsman | thợ thủ công | /ˈkrɑːftsmən/ | noun | The craftsman made this vase.\nartisan | nghệ nhân | /ˌɑːtɪˈzæn/ | noun | Bat Trang is famous for artisans.`}
                className="w-full p-2.5 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-mono text-[11px] text-[#3D3D2D]"
              />

              {importResult && (
                <div className="p-2.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-bold">
                  {importResult}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#6B6B54] rounded-xl font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={handleImportRawText}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Xử lý & Nhập vào kho</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ MODAL: MIDNIGHT / DAILY SYNC CONFIGURATION                             */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSettingsModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-[#3D3D2D] text-base">Cài Đặt Tự Động Nạp 12h Đêm</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-[#64748B] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-[#FAF9F6] rounded-2xl border border-[#EAE7E0] flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-[#3D3D2D] block">Bật tự động nạp mỗi ngày</span>
                  <p className="text-[11px] text-[#64748B]">
                    Hệ thống sẽ tự động thêm 20 từ mới mỗi ngày lúc 12h đêm (00:00).
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyVocabConfig.enabled}
                  onChange={(e) => updateDailyVocabConfig({ enabled: e.target.checked })}
                  className="w-5 h-5 accent-[#5A5A40] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Giờ chạy hàng ngày:</label>
                <select
                  value={dailyVocabConfig.autoHour}
                  onChange={(e) => updateDailyVocabConfig({ autoHour: Number(e.target.value) })}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold text-[#3D3D2D]"
                >
                  <option value={0}>🌙 00:00 (12 giờ đêm - Mặc định)</option>
                  <option value={6}>🌅 06:00 (6 giờ sáng)</option>
                  <option value={12}>☀️ 12:00 (12 giờ trưa)</option>
                  <option value={18}>🌆 18:00 (6 giờ chiều)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#5A5A40] mb-1">Số lượng từ nạp mỗi ngày:</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={dailyVocabConfig.wordsPerBatch}
                  onChange={(e) => updateDailyVocabConfig({ wordsPerBatch: Number(e.target.value) })}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden font-bold"
                />
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px]">
                <p>
                  <strong>Lần nạp gần nhất:</strong> {dailyVocabConfig.lastSyncDate || 'Chưa nạp lần nào'}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-[#F5F2ED]">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Xong
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
