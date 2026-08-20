import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TOPICS_META } from '../data/topicsMeta';
import { DifficultyLevel, Question, TopicId, SubTopicId, Exam } from '../types';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
  Check,
  X,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    questions,
    exams,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addExam,
    deleteExam,
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'questions' | 'exams' | 'students'>('questions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Question Modal State
  const [showQModal, setShowQModal] = useState<boolean>(false);
  const [editingQ, setEditingQ] = useState<Question | null>(null);

  // Form states for Question
  const [topicId, setTopicId] = useState<TopicId>('grammar');
  const [subTopicId, setSubTopicId] = useState<SubTopicId>('tenses');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [passage, setPassage] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [opt0, setOpt0] = useState<string>('');
  const [opt1, setOpt1] = useState<string>('');
  const [opt2, setOpt2] = useState<string>('');
  const [opt3, setOpt3] = useState<string>('');
  const [correctOption, setCorrectOption] = useState<number>(0);
  const [explanation, setExplanation] = useState<string>('');
  const [grammarRule, setGrammarRule] = useState<string>('');
  const [commonMistakeTip, setCommonMistakeTip] = useState<string>('');
  const [translation, setTranslation] = useState<string>('');

  // Exam Modal State
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [examTitle, setExamTitle] = useState<string>('');
  const [examCode, setExamCode] = useState<string>('DE-10-M03');
  const [examDesc, setExamDesc] = useState<string>('');
  const [examTime, setExamTime] = useState<number>(60);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    if (selectedTopic !== 'all' && q.topicId !== selectedTopic) return false;
    if (
      searchQuery &&
      !q.content.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !q.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleOpenAddQ = () => {
    setEditingQ(null);
    setTopicId('grammar');
    setSubTopicId('tenses');
    setDifficulty('medium');
    setPassage('');
    setContent('');
    setOpt0('A. ');
    setOpt1('B. ');
    setOpt2('C. ');
    setOpt3('D. ');
    setCorrectOption(0);
    setExplanation('');
    setGrammarRule('');
    setCommonMistakeTip('');
    setTranslation('');
    setShowQModal(true);
  };

  const handleOpenEditQ = (q: Question) => {
    setEditingQ(q);
    setTopicId(q.topicId);
    setSubTopicId(q.subTopicId || 'tenses');
    setDifficulty(q.difficulty);
    setPassage(q.passage || '');
    setContent(q.content);
    setOpt0(q.options[0] || '');
    setOpt1(q.options[1] || '');
    setOpt2(q.options[2] || '');
    setOpt3(q.options[3] || '');
    setCorrectOption(q.correctOption);
    setExplanation(q.explanation);
    setGrammarRule(q.grammarRule || '');
    setCommonMistakeTip(q.commonMistakeTip || '');
    setTranslation(q.translation || '');
    setShowQModal(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const qData = {
      topicId,
      subTopicId,
      difficulty,
      content,
      passage: passage.trim() ? passage : undefined,
      options: [opt0, opt1, opt2, opt3],
      correctOption,
      explanation,
      grammarRule: grammarRule.trim() ? grammarRule : undefined,
      commonMistakeTip: commonMistakeTip.trim() ? commonMistakeTip : undefined,
      translation: translation.trim() ? translation : undefined,
    };

    if (editingQ) {
      updateQuestion(editingQ.id, qData);
    } else {
      addQuestion(qData);
    }
    setShowQModal(false);
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newEx = {
      title: examTitle,
      code: examCode,
      description: examDesc,
      targetProvince: 'Toàn quốc',
      timeLimitMinutes: examTime,
      totalQuestions: selectedQIds.length,
      difficulty: 'standard' as const,
      questionIds: selectedQIds.length > 0 ? selectedQIds : questions.slice(0, 10).map((q) => q.id),
      isOfficialFormat: true,
    };
    addExam(newEx);
    setShowExamModal(false);
    setExamTitle('');
    setExamDesc('');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ngan_hang_cau_hoi_tieng_anh_10_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Admin Header */}
      <div className="bg-[#5A5A40] text-white p-6 sm:p-8 rounded-[2rem] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-[#E8E2D9]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Khu Vực Quản Trị Giáo Viên & Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Quản Lý Nội Dung & Ngân Hàng Đề Thi
          </h1>
          <p className="text-xs sm:text-sm text-[#D9D2C5]">
            Quản lý câu hỏi, tạo đề thi tuyển sinh, xuất/nhập dữ liệu Excel/JSON và theo dõi học sinh.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất JSON</span>
          </button>
          <button
            onClick={handleOpenAddQ}
            id="btn-add-new-question"
            className="px-5 py-2.5 bg-[#8BA888] hover:bg-[#789675] text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm câu hỏi mới</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex space-x-2 bg-[#E8E2D9] p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveAdminTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeAdminTab === 'questions'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ngân hàng câu hỏi ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('exams')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeAdminTab === 'exams'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Danh sách Đề thi ({exams.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('students')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
            activeAdminTab === 'students'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Học sinh theo dõi (1)</span>
        </button>
      </div>

      {/* 1. QUESTIONS TAB */}
      {activeAdminTab === 'questions' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-3 min-w-[280px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8A8A70] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nội dung câu hỏi, đáp án, giải thích..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl text-[#4A4A4A] outline-hidden"
              >
                <option value="all">Tất cả chuyên đề ({questions.length})</option>
                {TOPICS_META.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameVi}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-[#8A8A70] font-medium">
              Hiển thị <strong>{filteredQuestions.length}</strong> / {questions.length} câu hỏi
            </div>
          </div>

          {/* Question List Cards */}
          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 bg-white rounded-[2rem] border border-[#EAE7E0] shadow-sm hover:border-[#D9D2C5] transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 bg-[#F5F2ED] text-[#5A5A40] text-xs font-bold rounded-lg border border-[#D9D2C5]">
                      #{idx + 1} • {q.topicId.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                        q.difficulty === 'easy'
                          ? 'bg-[#EBF2EB] text-[#8BA888]'
                          : q.difficulty === 'hard'
                          ? 'bg-[#FDF2E9] text-[#E67E22]'
                          : 'bg-[#F5F2ED] text-[#6B6B54]'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditQ(q)}
                      className="p-1.5 text-[#8A8A70] hover:text-[#5A5A40] rounded-lg hover:bg-[#FAF9F6] transition cursor-pointer"
                      title="Chỉnh sửa câu này"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
                          deleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 text-[#8A8A70] hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Xóa câu hỏi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {q.passage && (
                  <div className="p-3 bg-[#FAF9F6] rounded-xl text-xs text-[#8A8A70] italic line-clamp-2">
                    {q.passage}
                  </div>
                )}

                <div className="text-xs sm:text-sm font-bold text-[#3D3D2D]">{q.content}</div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-xl border ${
                        oIdx === q.correctOption
                          ? 'bg-[#EBF2EB] border-[#8BA888] text-[#3D3D2D] font-bold'
                          : 'bg-[#FAF9F6] border-[#EAE7E0] text-[#6B6B54]'
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-[#8A8A70] pt-1">
                  <strong>Giải thích:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. EXAMS TAB */}
      {activeAdminTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] border border-[#EAE7E0] shadow-sm">
            <h3 className="text-sm font-bold text-[#3D3D2D]">Danh sách Đề thi Thử</h3>
            <button
              onClick={() => {
                setSelectedQIds(questions.slice(0, 15).map((q) => q.id));
                setShowExamModal(true);
              }}
              className="px-4 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo đề thi mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-white p-6 rounded-[2.5rem] border border-[#EAE7E0] shadow-sm space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="px-2.5 py-1 bg-[#F5F2ED] text-[#5A5A40] font-bold text-xs rounded-xl border border-[#D9D2C5]">
                    {ex.code}
                  </span>
                  <span className="text-xs text-[#8A8A70]">{ex.timeLimitMinutes} phút</span>
                </div>

                <h4 className="font-bold text-base text-[#3D3D2D]">{ex.title}</h4>
                <p className="text-xs text-[#8A8A70] line-clamp-2">{ex.description}</p>

                <div className="pt-3 border-t border-[#F5F2ED] flex justify-between items-center text-xs">
                  <span className="text-[#8A8A70]">
                    Số câu: <strong>{ex.questionIds.length} câu</strong>
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Xóa đề thi này?')) deleteExam(ex.id);
                    }}
                    className="text-red-500 hover:underline text-xs font-semibold cursor-pointer"
                  >
                    Xóa đề
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. STUDENTS TAB */}
      {activeAdminTab === 'students' && (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-[#EAE7E0] shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-[#3D3D2D]">Danh Sách Học Sinh Lớp 9 Ôn Thi</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF9F6] text-[#8A8A70] uppercase font-bold border-b border-[#EAE7E0]">
                <tr>
                  <th className="p-3">Học sinh</th>
                  <th className="p-3">Mục tiêu điểm</th>
                  <th className="p-3">Trường NV1</th>
                  <th className="p-3">Chuỗi học</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F2ED]">
                <tr className="hover:bg-[#FAF9F6]">
                  <td className="p-3 font-bold text-[#3D3D2D]">
                    Nguyễn Hoàng Minh
                    <span className="block text-[10px] text-[#8A8A70] font-normal">
                      minh.nguyen9a1@gmail.com
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-sm text-[#5A5A40]">8.5 / 10</td>
                  <td className="p-3 text-[#4A4A4A]">THPT Chu Văn An (Hà Nội)</td>
                  <td className="p-3 text-[#E67E22] font-bold">14 ngày liên tục</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-[#EBF2EB] text-[#8BA888] font-bold rounded-md">
                      Đang tích cực ôn luyện
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT QUESTION MODAL */}
      {showQModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#EAE7E0] max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">
                {editingQ ? 'Chỉnh Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới Vào Ngân Hàng'}
              </h3>
              <button
                onClick={() => setShowQModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Chuyên đề:</label>
                  <select
                    value={topicId}
                    onChange={(e) => setTopicId(e.target.value as TopicId)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    {TOPICS_META.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nameVi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4A4A4A] mb-1">Mức độ khó:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  >
                    <option value="easy">Nhận biết (Dễ)</option>
                    <option value="medium">Thông hiểu (Vừa)</option>
                    <option value="hard">Vận dụng (Khó)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Đoạn văn đọc hiểu (Nếu có):
                </label>
                <textarea
                  rows={2}
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  placeholder="Dán đoạn văn đọc hiểu hoặc điền từ vào đây..."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Nội dung câu hỏi / Câu cần hoàn thành (*):
                </label>
                <textarea
                  rows={2}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Ví dụ: If I ______ rich, I would travel around the world."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#4A4A4A]">4 Phương án lựa chọn:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={opt0}
                    onChange={(e) => setOpt0(e.target.value)}
                    placeholder="A. ..."
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt1}
                    onChange={(e) => setOpt1(e.target.value)}
                    placeholder="B. ..."
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt2}
                    onChange={(e) => setOpt2(e.target.value)}
                    placeholder="C. ..."
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                  <input
                    type="text"
                    value={opt3}
                    onChange={(e) => setOpt3(e.target.value)}
                    placeholder="D. ..."
                    className="p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Đáp án đúng:</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(parseInt(e.target.value))}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                >
                  <option value={0}>Đáp án A</option>
                  <option value={1}>Đáp án B</option>
                  <option value={2}>Đáp án C</option>
                  <option value={3}>Đáp án D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">
                  Lời giải thích chi tiết (*):
                </label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Giải thích vì sao chọn đáp án này..."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowQModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] hover:bg-[#E8E2D9] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] hover:bg-[#3D3D2D] text-white rounded-xl font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu câu hỏi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE EXAM MODAL */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-6 shadow-2xl border border-[#EAE7E0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE7E0]">
              <h3 className="font-bold text-[#3D3D2D] text-base">Tạo Đề Thi Thử Tuyển Sinh</h3>
              <button
                onClick={() => setShowExamModal(false)}
                className="p-1 text-[#8A8A70] hover:text-[#3D3D2D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Mã đề:</label>
                <input
                  type="text"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Tên đề thi:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Ví dụ: Đề thi thử Sở GD&ĐT Hà Nội - Đợt 2"
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-[#4A4A4A] mb-1">Mô tả đề thi:</label>
                <textarea
                  rows={2}
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  placeholder="Mô tả cấu trúc..."
                  className="w-full p-2 bg-[#FAF9F6] border border-[#EAE7E0] rounded-xl outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-[#FAF9F6] text-[#4A4A4A] rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5A5A40] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Tạo Đề Thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
