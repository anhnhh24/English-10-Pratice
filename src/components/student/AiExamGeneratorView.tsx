import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TopicId, SubjectId, ExamSectionFlexConfig } from '../../types';
import { TOPICS_META } from '../../data/topicsMeta';
import { MATH_TOPICS_META } from '../../data/mathTopicsMeta';
import {
  testGeminiApiKey,
  generateExamWithAI,
  getStoredApiKey,
  setStoredApiKey,
  clearStoredApiKey,
  AVAILABLE_MODELS,
  ExamGenerationConfig,
  GeneratedExamResult,
} from '../../services/aiExamService';
import { logAndBroadcastActivity } from '../../services/realtimeSyncService';
import {
  Sparkles,
  Key,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Wand2,
  ArrowRight,
  Calculator,
  Languages,
  Plus,
  Trash2,
  Tag,
  Layers,
  MessageSquare,
  MapPin,
  Cpu,
  Zap,
  SlidersHorizontal,
  HelpCircle,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

// ═══════════════════════════════════════════════════════════
// STANDARD PRESETS FOR GRADE 10 ENTRANCE EXAMS
// ═══════════════════════════════════════════════════════════

const DEFAULT_ENGLISH_FLEX_SECTIONS: ExamSectionFlexConfig[] = [
  {
    id: 'sec_pron_stress',
    title: 'Ngữ âm & Trọng âm (Pronunciation & Stress)',
    topicId: 'pronunciation',
    questionCount: 4,
    difficulty: 'standard' as any,
    customRequirement: '2 câu phát âm (-s/es, -ed, nguyên âm) + 2 câu trọng âm 2 & 3 âm tiết.',
  },
  {
    id: 'sec_grammar_vocab',
    title: 'Ngữ pháp & Từ vựng tổng hợp',
    topicId: 'grammar',
    questionCount: 10,
    difficulty: 'medium',
    customRequirement: '12 thì, câu bị động, gián tiếp, điều kiện, wish, giới từ, cụm động từ.',
  },
  {
    id: 'sec_comm',
    title: 'Giao tiếp Xã hội (Social Communication)',
    topicId: 'communication',
    questionCount: 2,
    difficulty: 'easy',
    customRequirement: 'Tình huống đối thoại thường ngày: cảm ơn, xin lỗi, khen ngợi, lời mời.',
  },
  {
    id: 'sec_error',
    title: 'Tìm lỗi sai (Error Identification)',
    topicId: 'error_identification',
    questionCount: 3,
    difficulty: 'medium',
    customRequirement: 'Tìm phần gạch chân A, B, C, D sai về thì, hòa hợp chủ vị, đại từ quan hệ.',
  },
  {
    id: 'sec_cloze',
    title: 'Đọc điền từ vào đoạn văn (Guided Cloze)',
    topicId: 'cloze',
    questionCount: 5,
    difficulty: 'medium',
    customRequirement: '1 bài đọc 120-160 từ có 5 chỗ trống (1)-(5) kiểm tra từ vựng, liên từ, ngữ pháp.',
  },
  {
    id: 'sec_reading',
    title: 'Đọc hiểu văn bản (Reading Comprehension)',
    topicId: 'reading',
    questionCount: 5,
    difficulty: 'hard',
    customRequirement: '1 bài đọc 180-220 từ chủ đề lớp 9 (Main idea, details, vocabulary, pronoun).',
  },
  {
    id: 'sec_rewrite',
    title: 'Viết lại câu & Kết hợp câu (Sentence Transformation)',
    topicId: 'sentence_rewrite',
    questionCount: 11,
    difficulty: 'hard',
    customRequirement: 'Chuyển đổi câu đồng nghĩa: Unless, In spite of, So...that, Used to, Wish, Passive...',
  },
];

const DEFAULT_MATH_FLEX_SECTIONS: ExamSectionFlexConfig[] = [
  {
    id: 'sec_math_can_thuc',
    title: 'Căn thức & Rút gọn biểu thức',
    topicId: 'math_can_thuc',
    questionCount: 3,
    difficulty: 'easy',
    customRequirement: 'ĐKXĐ, rút gọn phân thức chứa căn và tính giá trị biểu thức.',
  },
  {
    id: 'sec_math_he_pt',
    title: 'Hệ phương trình & Hàm số Parabol',
    topicId: 'math_he_phuong_trinh',
    questionCount: 3,
    difficulty: 'medium',
    customRequirement: 'Hệ PT bậc nhất 2 ẩn và tương giao đồ thị đường thẳng d với Parabol (P).',
  },
  {
    id: 'sec_math_viet',
    title: 'Phương trình bậc hai & Hệ thức Vi-ét',
    topicId: 'math_pt_bac_hai_viet',
    questionCount: 3,
    difficulty: 'hard',
    customRequirement: 'Tìm tham số m để pt có 2 nghiệm thỏa mãn hệ thức đối xứng/không đối xứng.',
  },
  {
    id: 'sec_math_lap_pt',
    title: 'Giải toán bằng cách lập PT / Hệ PT',
    topicId: 'math_giai_toan_lap_pt',
    questionCount: 2,
    difficulty: 'medium',
    customRequirement: 'Bài toán chuyển động thực tế (S = v.t) hoặc bài toán năng suất công việc.',
  },
  {
    id: 'sec_math_hinh_hoc',
    title: 'Hình học: Đường tròn & Tứ giác nội tiếp',
    topicId: 'math_duong_tron_tu_giac',
    questionCount: 3,
    difficulty: 'hard',
    customRequirement: 'Chứng minh 4 điểm cùng thuộc đường tròn, góc nội tiếp và tiếp tuyến.',
  },
  {
    id: 'sec_math_bdt',
    title: 'Bài toán thực tế & BĐT Cực trị (Điểm 10)',
    topicId: 'math_bat_dang_thuc_cuc_tri',
    questionCount: 1,
    difficulty: 'expert',
    customRequirement: 'Câu phân loại điểm 10 áp dụng BĐT Cauchy AM-GM hoặc bài toán cực trị.',
  },
];

const ENGLISH_PRESETS: PresetOption[] = [
  {
    title: 'Đề Thi Thử Chuẩn Sở GD&ĐT Hà Nội (40 câu / 60 phút)',
    badge: 'Chuẩn 100%',
    badgeColor: 'bg-[#5A5A40] text-white',
    desc: 'Đúng chuẩn cấu trúc 7 phần: 4 câu Ngữ âm, 10 câu Ngữ pháp - Từ vựng, 2 câu Giao tiếp, 3 câu Lỗi sai, 5 câu Cloze, 5 câu Reading, 11 câu Viết lại câu.',
    config: {
      subject: 'english',
      title: 'Đề Thi Thử Tuyển Sinh Vào 10 Chuẩn Sở GD&ĐT Hà Nội',
      targetProvince: 'Sở GD&ĐT Hà Nội / Toàn quốc',
      totalQuestions: 40,
      timeLimitMinutes: 60,
      difficulty: 'standard',
      focusTopics: ['pronunciation', 'stress', 'grammar', 'vocabulary', 'communication', 'error_identification', 'cloze', 'reading', 'sentence_rewrite'],
      flexSections: DEFAULT_ENGLISH_FLEX_SECTIONS,
      customPrompt: 'Biên soạn bám sát 100% cấu trúc đề thi tuyển sinh vào lớp 10 Hà Nội gồm 7 phần hoàn chỉnh.',
    },
  },
  {
    title: 'Đề Chuẩn Sở TP.HCM (40 câu / 90 phút - Có Biển báo & Word Form)',
    badge: 'Form TP.HCM',
    badgeColor: 'bg-indigo-600 text-white',
    desc: 'Đặc trưng đề thi TP.HCM: Kèm 2 câu Biển báo thực tế (Signs/Notices), 4 câu Word Formation, 2 bài đọc hiểu và các câu giao tiếp thực tiễn.',
    config: {
      subject: 'english',
      title: 'Đề Thi Tuyển Sinh Lớp 10 Môn Tiếng Anh - Chuẩn Sở TP.HCM',
      targetProvince: 'Sở GD&ĐT TP.HCM',
      totalQuestions: 40,
      timeLimitMinutes: 90,
      difficulty: 'advanced',
      focusTopics: ['pronunciation', 'stress', 'grammar', 'vocabulary', 'signs_notices', 'word_form', 'cloze', 'reading', 'sentence_rewrite'],
      flexSections: [
        { id: 'sec_hcm_pron', title: 'Ngữ âm & Trọng âm', topicId: 'pronunciation', questionCount: 4, difficulty: 'easy' },
        { id: 'sec_hcm_vocab', title: 'Từ vựng & Ngữ pháp', topicId: 'vocabulary', questionCount: 8, difficulty: 'medium' },
        { id: 'sec_hcm_signs', title: 'Biển báo & Thông báo thực tế (Signs)', topicId: 'signs_notices', questionCount: 2, difficulty: 'medium', customRequirement: 'Biển báo giao thông hoặc nội quy công cộng.' },
        { id: 'sec_hcm_cloze', title: 'Đọc điền từ Cloze Test', topicId: 'cloze', questionCount: 5, difficulty: 'medium' },
        { id: 'sec_hcm_reading', title: 'Đọc hiểu văn bản (Reading)', topicId: 'reading', questionCount: 5, difficulty: 'hard' },
        { id: 'sec_hcm_wordform', title: 'Cấu tạo & Dạng từ (Word Form)', topicId: 'word_form', questionCount: 4, difficulty: 'hard', customRequirement: 'Biến đổi dạng từ (noun/adj/adv/verb) phù hợp vào câu.' },
        { id: 'sec_hcm_rewrite', title: 'Viết lại câu (Transformation)', topicId: 'sentence_rewrite', questionCount: 12, difficulty: 'hard' },
      ],
      customPrompt: 'Biên soạn theo cấu trúc đề thi tuyển sinh vào 10 TP.HCM có phần Biển báo thực tế và Word Formation.',
    },
  },
  {
    title: 'Đề Chuyên Anh & Câu Hỏi Phân Loại (50 câu / 60 phút)',
    badge: 'Điểm 9-10',
    badgeColor: 'bg-[#C0392B] text-white',
    desc: 'Đề thi chuyên sâu bẫy từ vựng nâng cao, Phrasal verbs hiếm, Collocations, Thành ngữ (Idioms), Đảo ngữ và 2 bài đọc hiểu.',
    config: {
      subject: 'english',
      title: 'Đề Thi Thử Chuyên Anh & Trường THPT Chuyên Vào 10',
      targetProvince: 'Trường Chuyên & Top 1',
      totalQuestions: 50,
      timeLimitMinutes: 60,
      difficulty: 'challenge',
      focusTopics: ['grammar', 'vocabulary', 'idioms', 'sentence_rewrite', 'reading', 'cloze', 'error_identification'],
      flexSections: [
        { id: 'sec_spec_pron', title: 'Ngữ âm ngoại lệ & Trọng âm 3-4 âm tiết', topicId: 'stress', questionCount: 4, difficulty: 'hard' },
        { id: 'sec_spec_lexico', title: 'Từ vựng C1-B2, Phrasal Verbs & Collocations', topicId: 'vocabulary', questionCount: 16, difficulty: 'expert' },
        { id: 'sec_spec_error', title: 'Tìm lỗi sai ngữ pháp nâng cao', topicId: 'error_identification', questionCount: 5, difficulty: 'hard' },
        { id: 'sec_spec_cloze', title: 'Guided Cloze Test nâng cao', topicId: 'cloze', questionCount: 5, difficulty: 'hard' },
        { id: 'sec_spec_read', title: 'Đọc hiểu chuyên sâu (2 bài đọc)', topicId: 'reading', questionCount: 10, difficulty: 'expert' },
        { id: 'sec_spec_rewrite', title: 'Biến đổi câu nâng cao & Đảo ngữ (Inversion)', topicId: 'sentence_rewrite', questionCount: 10, difficulty: 'expert' },
      ],
      customPrompt: 'Đề thi phân loại cao có nhiều câu đảo ngữ, thành ngữ, collocations và bài đọc hiểu mang tính học thuật.',
    },
  },
  {
    title: 'Chuyên Đề Ngữ Pháp & Biến Đổi Câu Điểm 8+ (25 câu)',
    badge: 'Điểm 8+',
    badgeColor: 'bg-[#8BA888] text-[#2C3E2D]',
    desc: 'Tập trung luyện sâu câu điều kiện, câu bị động kép, câu gián tiếp, mệnh đề quan hệ, so/such...that, too/enough.',
    config: {
      subject: 'english',
      title: 'Chuyên Đề Tăng Tốc: Ngữ Pháp & Viết Lại Câu Điểm 8+',
      targetProvince: 'Chuyên đề Bứt phá Điểm số',
      totalQuestions: 25,
      timeLimitMinutes: 35,
      difficulty: 'advanced',
      focusTopics: ['grammar', 'sentence_rewrite', 'error_identification'],
      flexSections: [
        { id: 'sec_gr_core', title: 'Ngữ pháp 12 thì, Bị động & Câu điều kiện', topicId: 'grammar', questionCount: 10, difficulty: 'medium' },
        { id: 'sec_gr_error', title: 'Nhận diện lỗi sai ngữ pháp', topicId: 'error_identification', questionCount: 5, difficulty: 'hard' },
        { id: 'sec_gr_trans', title: 'Biến đổi cấu trúc câu tương đương', topicId: 'sentence_rewrite', questionCount: 10, difficulty: 'hard' },
      ],
    },
  },
  {
    title: 'Luyện Siêu Tốc Ngữ Âm & Trọng Âm (15 câu / 15 phút)',
    badge: '100% Ăn Điểm',
    badgeColor: 'bg-[#E67E22] text-white',
    desc: 'Rèn phản xạ nhanh ăn trọn 100% điểm phát âm đuôi -s/es, -ed, nguyên âm và trọng âm 2 - 3 âm tiết.',
    config: {
      subject: 'english',
      title: 'Đề Luyện Phản Xạ Nhanh: Ngữ Âm & Trọng Âm 100% Ăn Điểm',
      targetProvince: 'Phản xạ tốc độ',
      totalQuestions: 15,
      timeLimitMinutes: 15,
      difficulty: 'standard',
      focusTopics: ['pronunciation', 'stress'],
      flexSections: [
        { id: 'sec_sp_pron_s', title: 'Quy tắc phát âm đuôi -s/es và -ed', topicId: 'pronunciation', questionCount: 5, difficulty: 'easy' },
        { id: 'sec_sp_pron_v', title: 'Phát âm nguyên âm đơn/đôi & phụ âm', topicId: 'pronunciation', questionCount: 5, difficulty: 'medium' },
        { id: 'sec_sp_stress', title: 'Trọng âm từ 2 và 3 âm tiết', topicId: 'stress', questionCount: 5, difficulty: 'medium' },
      ],
    },
  },
];

const MATH_PRESETS: PresetOption[] = [
  {
    title: 'Đề Thi Thử Toán Vào 10 Chuẩn Sở (15 câu / 60 phút)',
    badge: 'Chuẩn 100%',
    badgeColor: 'bg-[#5A5A40] text-white',
    desc: 'Bám sát ma trận: Căn thức, Hệ phương trình, Tương giao Parabol, Hệ thức Vi-ét, Toán chuyển động & Tứ giác nội tiếp.',
    config: {
      subject: 'math',
      title: 'Đề Thi Thử Môn Toán Tuyển Sinh Lớp 10 - Chuẩn Sở GD&ĐT',
      targetProvince: 'Sở GD&ĐT Hà Nội / TP.HCM / Toàn quốc',
      totalQuestions: 15,
      timeLimitMinutes: 60,
      difficulty: 'standard',
      focusTopics: ['math_can_thuc', 'math_he_phuong_trinh', 'math_ham_so_do_thi', 'math_pt_bac_hai_viet', 'math_giai_toan_lap_pt', 'math_duong_tron_tu_giac'],
      flexSections: DEFAULT_MATH_FLEX_SECTIONS,
    },
  },
  {
    title: 'Chuyên Đề Đại Số: Vi-ét & Parabol Điểm 8+ (10 câu)',
    badge: 'Điểm 8+',
    badgeColor: 'bg-[#8BA888] text-[#2C3E2D]',
    desc: 'Luyện sâu định lý Vi-ét (biểu thức đối xứng, không đối xứng, tìm tham số m) và bài toán tương giao đồ thị.',
    config: {
      subject: 'math',
      title: 'Chuyên Đề Bứt Phá Đại Số: Hệ Thức Vi-ét & Đồ Thị Parabol',
      targetProvince: 'Chuyên Đề Trọng Tâm',
      totalQuestions: 10,
      timeLimitMinutes: 30,
      difficulty: 'advanced',
      focusTopics: ['math_pt_bac_hai_viet', 'math_ham_so_do_thi'],
    },
  },
  {
    title: 'Chuyên Đề Hình Học: Tứ Giác Nội Tiếp (10 câu)',
    badge: 'Chắc Điểm Hình',
    badgeColor: 'bg-[#E67E22] text-white',
    desc: 'Rèn luyện 4 dấu hiệu vàng chứng minh tứ giác nội tiếp, góc nội tiếp, tiếp tuyến và hệ thức lượng trong tam giác vuông.',
    config: {
      subject: 'math',
      title: 'Chuyên Đề Hình Học 9: Tứ Giác Nội Tiếp & Hệ Thức Lượng',
      targetProvince: 'Luyện kỹ năng Hình học',
      totalQuestions: 10,
      timeLimitMinutes: 30,
      difficulty: 'standard',
      focusTopics: ['math_he_thuc_luong', 'math_duong_tron_tu_giac', 'math_hinh_khong_gian_thuc_te'],
    },
  },
  {
    title: 'Đề Chuyên Toán & Bất Đẳng Thức Cực Trị 9-10 (8 câu)',
    badge: 'Điểm 9.5-10',
    badgeColor: 'bg-[#C0392B] text-white',
    desc: 'Chinh phục câu phân loại điểm 10: BĐT Cauchy AM-GM, Schwarz, Bunhiacopxki và bài toán cực trị hình học.',
    config: {
      subject: 'math',
      title: 'Đề Thách Thức Điểm 9.5 - 10: Bất Đẳng Thức & Vi-ét Nâng Cao',
      targetProvince: 'Mục tiêu Chuyên & Trường Top 1',
      totalQuestions: 8,
      timeLimitMinutes: 40,
      difficulty: 'challenge',
      focusTopics: ['math_bat_dang_thuc_cuc_tri', 'math_pt_bac_hai_viet', 'math_he_phuong_trinh'],
    },
  },
];

const ENGLISH_QUICK_TAGS = [
  { name: 'Ngữ âm (-s/-ed/vowels)', topicId: 'pronunciation' },
  { name: 'Trọng âm (2 & 3 âm tiết)', topicId: 'stress' },
  { name: 'Ngữ pháp 12 thì & Bị động', topicId: 'grammar' },
  { name: 'Câu điều kiện & Wish', topicId: 'grammar' },
  { name: 'Mệnh đề quan hệ & So sánh', topicId: 'grammar' },
  { name: 'Cụm động từ (Phrasal Verbs)', topicId: 'vocabulary' },
  { name: 'Giao tiếp xã hội (Communication)', topicId: 'communication' },
  { name: 'Tìm lỗi sai (Error Identification)', topicId: 'error_identification' },
  { name: 'Đọc điền từ (Guided Cloze)', topicId: 'cloze' },
  { name: 'Đọc hiểu văn bản (Reading)', topicId: 'reading' },
  { name: 'Viết lại câu (Transformation)', topicId: 'sentence_rewrite' },
  { name: 'Biển báo thực tế (Signs & Notices)', topicId: 'signs_notices' },
  { name: 'Cấu tạo & Dạng từ (Word Form)', topicId: 'word_form' },
  { name: 'Thành ngữ & Collocations (Idioms)', topicId: 'idioms' },
  { name: 'Đảo ngữ (Inversion 9-10đ)', topicId: 'sentence_rewrite' },
];

const MATH_QUICK_TAGS = [
  { name: 'Căn thức & Rút gọn', topicId: 'math_can_thuc' },
  { name: 'Hệ phương trình bậc nhất', topicId: 'math_he_phuong_trinh' },
  { name: 'Tương giao Parabol & Đường thẳng', topicId: 'math_ham_so_do_thi' },
  { name: 'Định lý Vi-ét & Tham số m', topicId: 'math_pt_bac_hai_viet' },
  { name: 'Giải toán bằng cách lập PT', topicId: 'math_giai_toan_lap_pt' },
  { name: 'Hệ thức lượng tam giác vuông', topicId: 'math_he_thuc_luong' },
  { name: 'Tứ giác nội tiếp đường tròn', topicId: 'math_duong_tron_tu_giac' },
  { name: 'Hình không gian (Trụ - Nón - Cầu)', topicId: 'math_hinh_khong_gian_thuc_te' },
  { name: 'Bất đẳng thức Cauchy Cực trị', topicId: 'math_bat_dang_thuc_cuc_tri' },
];

export const AiExamGeneratorView: React.FC<AiExamGeneratorViewProps> = ({ onStartExam }) => {
  const { currentSubject, currentUser, switchSubject, addExam, bulkImportQuestions } = useApp();

  // Selected subject for generation
  const [genSubject, setGenSubject] = useState<SubjectId>(currentSubject);

  // Mode: 'presets' (Chọn mẫu có sẵn) | 'flex_builder' (Trình thiết kế Thẻ Flex Tùy Biến)
  const [generatorMode, setGeneratorMode] = useState<'presets' | 'flex_builder'>('presets');

  // Sync with current subject
  useEffect(() => {
    setGenSubject(currentSubject);
    if (currentSubject === 'math') {
      setTitle('Đề Thi Thử Môn Toán Tuyển Sinh Lớp 10 - Chuẩn Sở GD&ĐT');
      setTotalQuestions(15);
      setTimeLimitMinutes(60);
      setFlexSections(DEFAULT_MATH_FLEX_SECTIONS);
    } else {
      setTitle('Đề Thi Thử Vào Lớp 10 Chuẩn Sở GD&ĐT Hà Nội');
      setTotalQuestions(40);
      setTimeLimitMinutes(60);
      setFlexSections(DEFAULT_ENGLISH_FLEX_SECTIONS);
    }
  }, [currentSubject]);

  const currentPresets = genSubject === 'math' ? MATH_PRESETS : ENGLISH_PRESETS;
  const currentTopicsMeta = genSubject === 'math' ? MATH_TOPICS_META : TOPICS_META;
  const currentQuickTags = genSubject === 'math' ? MATH_QUICK_TAGS : ENGLISH_QUICK_TAGS;

  // API Key State
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [testingKey, setTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Exam Generation Form State
  const [title, setTitle] = useState<string>('Đề Thi Thử Vào Lớp 10 Chuẩn Sở GD&ĐT Hà Nội');
  const [targetProvince, setTargetProvince] = useState<string>('Sở GD&ĐT Hà Nội / Toàn quốc');
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<'standard' | 'advanced' | 'challenge'>('standard');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(true);

  // Flex Sections State (Thẻ Flex & Custom Danh mục)
  const [flexSections, setFlexSections] = useState<ExamSectionFlexConfig[]>(DEFAULT_ENGLISH_FLEX_SECTIONS);
  const [newCustomCatName, setNewCustomCatName] = useState<string>('');

  // Calculate sum of questions across all flex sections
  const flexSumQuestions = useMemo(() => {
    return flexSections.reduce((sum, sec) => sum + (Number(sec.questionCount) || 0), 0);
  }, [flexSections]);

  // Handle Subject Change
  const handleSubjectTabChange = (subj: SubjectId) => {
    setGenSubject(subj);
    if (subj === 'math') {
      setTitle('Đề Thi Thử Tuyển Sinh Vào 10 Môn Toán (AI Generator)');
      setTotalQuestions(15);
      setTimeLimitMinutes(60);
      setFlexSections(DEFAULT_MATH_FLEX_SECTIONS);
    } else {
      setTitle('Đề Thi Thử Vào Lớp 10 Chuẩn Sở GD&ĐT Hà Nội');
      setTotalQuestions(40);
      setTimeLimitMinutes(60);
      setFlexSections(DEFAULT_ENGLISH_FLEX_SECTIONS);
    }
  };

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
    if (preset.config.subject) setGenSubject(preset.config.subject);
    if (preset.config.title) setTitle(preset.config.title);
    if (preset.config.targetProvince) setTargetProvince(preset.config.targetProvince);
    if (preset.config.totalQuestions) setTotalQuestions(preset.config.totalQuestions);
    if (preset.config.timeLimitMinutes) setTimeLimitMinutes(preset.config.timeLimitMinutes);
    if (preset.config.difficulty) setDifficulty(preset.config.difficulty);
    if (preset.config.customPrompt) setCustomPrompt(preset.config.customPrompt);
    if (preset.config.flexSections && preset.config.flexSections.length > 0) {
      setFlexSections(preset.config.flexSections);
    }
  };

  // FLEX SECTION HANDLERS
  const handleUpdateFlexCount = (id: string, delta: number) => {
    setFlexSections((prev) =>
      prev.map((sec) => {
        if (sec.id === id) {
          const newCount = Math.max(1, Math.min(30, (sec.questionCount || 0) + delta));
          return { ...sec, questionCount: newCount };
        }
        return sec;
      })
    );
  };

  const handleSetFlexCountDirect = (id: string, count: number) => {
    const safeCount = Math.max(1, Math.min(40, count || 1));
    setFlexSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, questionCount: safeCount } : sec))
    );
  };

  const handleSetFlexDifficulty = (id: string, diff: 'easy' | 'medium' | 'hard' | 'expert') => {
    setFlexSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, difficulty: diff } : sec))
    );
  };

  const handleSetFlexReq = (id: string, req: string) => {
    setFlexSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, customRequirement: req } : sec))
    );
  };

  const handleDeleteFlexSection = (id: string) => {
    if (flexSections.length <= 1) {
      alert('Đề thi cần có ít nhất 1 thẻ danh mục!');
      return;
    }
    setFlexSections((prev) => prev.filter((sec) => sec.id !== id));
  };

  const handleAddQuickTag = (tag: { name: string; topicId: string }) => {
    const existing = flexSections.find((s) => s.title.toLowerCase() === tag.name.toLowerCase());
    if (existing) {
      handleUpdateFlexCount(existing.id, 2);
      return;
    }

    const newSec: ExamSectionFlexConfig = {
      id: `sec_flex_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      title: tag.name,
      topicId: tag.topicId,
      questionCount: 4,
      difficulty: 'medium',
      customRequirement: `Tập trung vào chuyên đề ${tag.name}`,
    };
    setFlexSections((prev) => [...prev, newSec]);
  };

  const handleAddCustomCategory = () => {
    if (!newCustomCatName.trim()) return;
    const newSec: ExamSectionFlexConfig = {
      id: `sec_custom_${Date.now()}`,
      title: newCustomCatName.trim(),
      topicId: 'grammar',
      questionCount: 4,
      difficulty: 'medium',
      customRequirement: `Yêu cầu riêng: ${newCustomCatName.trim()}`,
      isCustom: true,
    };
    setFlexSections((prev) => [...prev, newSec]);
    setNewCustomCatName('');
  };

  const handleAutoBalanceTotal = () => {
    setTotalQuestions(flexSumQuestions);
    setTimeLimitMinutes(
      flexSumQuestions <= 15 ? 30 : flexSumQuestions <= 25 ? 45 : flexSumQuestions <= 40 ? 60 : 90
    );
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
      // Synchronize totalQuestions with flexSum if in flex builder mode
      const finalTotalQ = generatorMode === 'flex_builder' ? flexSumQuestions : totalQuestions;

      const config: ExamGenerationConfig = {
        subject: genSubject,
        title,
        targetProvince,
        difficulty,
        totalQuestions: finalTotalQ,
        timeLimitMinutes,
        flexSections: flexSections.length > 0 ? flexSections : undefined,
        focusTopics: flexSections.map((s) => s.topicId || 'grammar'),
        customPrompt,
        modelName: selectedModel,
      };

      const result = await generateExamWithAI(apiKey || getStoredApiKey(), config, (step) => {
        setProgressStep(step);
      });

      // 1. Save all questions into Question Bank
      bulkImportQuestions(result.questions);

      // 2. Save exam into Exams library
      addExam({
        id: result.exam.id,
        subject: genSubject,
        code: result.exam.code,
        title: result.exam.title,
        description: result.exam.description,
        targetProvince: result.exam.targetProvince,
        timeLimitMinutes: result.exam.timeLimitMinutes,
        totalQuestions: result.questions.length,
        difficulty: result.exam.difficulty,
        questionIds: result.questions.map((q) => q.id),
        isOfficialFormat: false,
      });

      logAndBroadcastActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarColor: currentUser.avatarColor,
        subject: genSubject,
        type: 'ai_exam_generated',
        severity: 'positive',
        title: `Tự tạo đề ôn tập bằng AI (${genSubject === 'math' ? 'Môn Toán' : 'Tiếng Anh'})`,
        detail: `Học sinh đã dùng AI tạo đề "${result.exam.title}" (${result.questions.length} câu • Chuẩn Flex Ma Trận)`,
        examTitle: result.exam.title,
        examId: result.exam.id,
      });

      setGeneratedResult(result);
      setSavedSuccess(true);
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      setErrorMessage(
        err.message ||
        'Đã có lỗi xảy ra trong quá trình sinh đề thi bằng AI. Vui lòng kiểm tra API Key hoặc thử lại.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Start exam directly in simulator
  const handleStartGeneratedExam = () => {
    if (!generatedResult) return;
    onStartExam(generatedResult.exam.id);
  };

  // Copy formatted exam
  const handleCopyExamText = () => {
    if (!generatedResult) return;
    let text = `=== ${generatedResult.exam.title.toUpperCase()} ===\n`;
    text += `Môn: ${genSubject === 'math' ? 'Toán Học' : 'Tiếng Anh'} | Mã đề: ${generatedResult.exam.code} | Thời gian: ${generatedResult.exam.timeLimitMinutes} phút | Số câu: ${generatedResult.questions.length}\n\n`;

    generatedResult.questions.forEach((q, idx) => {
      text += `Câu ${idx + 1}: ${q.content}\n`;
      if (q.passage) text += `[Mô tả/Đoạn văn]:\n${q.passage}\n`;
      q.options.forEach((opt) => {
        text += `   ${opt}\n`;
      });
      text += `-> Đáp án đúng: ${q.options[q.correctOption]}\n`;
      text += `-> Lời giải chi tiết: ${q.explanation}\n`;
      if (q.grammarRule) text += `-> Công thức/Định lý: ${q.grammarRule}\n`;
      if (q.commonMistakeTip) text += `-> Lưu ý tránh bẫy: ${q.commonMistakeTip}\n`;
      text += `------------------------------------\n\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#8BA888]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#5A5A40] text-white text-xs font-bold rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />
              <span>AI Exam Generator 3.0 (Thẻ Flex & Chuẩn Khảo Thí)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#3D3D2D]">
              Tạo Đề Thi Vào 10 Chuẩn Sở & Thẻ Flex Linh Hoạt
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8A70] max-w-2xl">
              Biên soạn đề thi chuẩn ma trận tuyển sinh lớp 10 (Hà Nội, TP.HCM, Toàn quốc) hoặc tự do lắp ghép các Thẻ Flex chuyên đề theo đúng số câu mong muốn.
            </p>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] text-[#5A5A40] rounded-2xl text-xs font-bold hover:bg-[#E8E2D9] transition flex items-center space-x-2 shadow-2xs"
            >
              <Key className="w-4 h-4 text-[#E67E22]" />
              <span>Lấy API Key Miễn Phí</span>
            </a>
          </div>
        </div>
      </div>

      {/* Subject Selection Tabs for Generator */}
      <div className="bg-[#FAF9F6] p-1.5 rounded-2xl border border-[#D9D2C5] flex max-w-md shadow-2xs">
        <button
          onClick={() => handleSubjectTabChange('english')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${genSubject === 'english'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D] hover:bg-[#E8E2D9]'
            }`}
        >
          <span>🇬🇧</span>
          <span>Tạo Đề Môn Tiếng Anh</span>
        </button>

        <button
          onClick={() => handleSubjectTabChange('math')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${genSubject === 'math'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D] hover:bg-[#E8E2D9]'
            }`}
        >
          <span>📐</span>
          <span>Tạo Đề Môn Toán Học</span>
        </button>
      </div>

      {/* 2. API Key Box */}
      <div className="bg-[#FDFCFB] border border-[#D9D2C5] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
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
              className="px-3 py-1.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-xl text-xs font-bold text-[#5A5A40] outline-hidden cursor-pointer"
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
              className="w-full pl-4 pr-10 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] rounded-2xl text-xs font-mono text-[#3D3D2D] placeholder-[#A09F8E] focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-hidden"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A70] hover:text-[#5A5A40] cursor-pointer"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="sm:col-span-4 flex items-center space-x-2">
            <button
              onClick={handleTestApiKey}
              disabled={testingKey || !apiKey.trim()}
              className="flex-1 px-4 py-2.5 bg-[#5A5A40] text-white rounded-2xl text-xs font-bold hover:bg-[#474733] transition disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer shadow-2xs"
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
                className="px-3 py-2.5 bg-[#FAF9F6] border border-[#D9D2C5] text-[#8A8A70] hover:text-[#C0392B] rounded-2xl text-xs font-bold transition cursor-pointer"
                title="Xóa API Key"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center space-x-2 ${testResult.success
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

      {/* 3. Mode Toggle: Presets vs Flex Builder */}
      <div className="flex bg-[#F5F2ED] p-1.5 rounded-2xl border border-[#D9D2C5] max-w-lg shadow-2xs text-xs font-bold">
        <button
          type="button"
          onClick={() => setGeneratorMode('presets')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            generatorMode === 'presets'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <span>📋 Mẫu Chuẩn Khảo Thí</span>
        </button>

        <button
          type="button"
          onClick={() => setGeneratorMode('flex_builder')}
          className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 ${
            generatorMode === 'flex_builder'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[#6B6B54] hover:text-[#3D3D2D]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>🎛️ Thẻ Flex & Custom Danh Mục</span>
        </button>
      </div>

      {/* Mode 1: Quick Preset Templates */}
      {generatorMode === 'presets' && (
        <div className="space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-[#3D3D2D] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#E67E22]" />
              <span>Mẫu Đề Thi {genSubject === 'math' ? 'Toán' : 'Tiếng Anh'} Gợi Ý Nhanh</span>
            </h3>
            <span className="text-xs text-[#8A8A70]">Chọn mẫu để tự động điền cấu trúc</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {currentPresets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className="bg-[#FDFCFB] border border-[#D9D2C5] p-5 rounded-3xl hover:border-[#5A5A40] hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                    <span className="text-[11px] font-bold text-[#8A8A70]">
                      {preset.config.totalQuestions} câu • {preset.config.timeLimitMinutes}p
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#3D3D2D] group-hover:text-[#5A5A40] leading-snug">
                    {preset.title}
                  </h4>
                  <p className="text-[11px] text-[#8A8A70] line-clamp-3 leading-relaxed">
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
      )}

      {/* Mode 2: Flex Cards Builder & Custom Categories */}
      {generatorMode === 'flex_builder' && (
        <div className="bg-white border-2 border-blue-200 rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm animate-in fade-in">
          {/* Flex Builder Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-100 text-blue-700 rounded-xl">
                  <Layers className="w-4 h-4" />
                </span>
                <h3 className="text-base font-bold text-blue-950">
                  Trình Thiết Kế Thẻ Flex Chuyên Đề ({flexSections.length} thẻ đang cấu hình)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Tự do tăng giảm số câu, độ khó và thêm bất kỳ danh mục tùy biến nào cho đề thi.
              </p>
            </div>

            {/* Total Questions Allocation Pill */}
            <div className="flex items-center space-x-2">
              <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-900 flex items-center space-x-2">
                <span>Tổng số câu:</span>
                <strong className="text-sm text-blue-700">{flexSumQuestions} câu</strong>
              </div>
              {flexSumQuestions !== totalQuestions && (
                <button
                  type="button"
                  onClick={handleAutoBalanceTotal}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Đồng bộ {flexSumQuestions} câu</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick-Add Category Tags */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-600" />
              <span>Thêm nhanh danh mục vào đề:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {currentQuickTags.map((tag, tIdx) => {
                const isAlreadyIn = flexSections.some(
                  (s) => s.title.toLowerCase() === tag.name.toLowerCase()
                );
                return (
                  <button
                    key={tIdx}
                    type="button"
                    onClick={() => handleAddQuickTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                      isAlreadyIn
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 border border-slate-200'
                    }`}
                  >
                    <span>{isAlreadyIn ? '✓' : '+'}</span>
                    <span>{tag.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Category Adder Input */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-2.5">
            <input
              type="text"
              value={newCustomCatName}
              onChange={(e) => setNewCustomCatName(e.target.value)}
              placeholder="Nhập tên danh mục hoặc chuyên đề tùy ý (VD: Đảo ngữ, Unit 1-3, Biển báo...)"
              className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium outline-hidden focus:border-blue-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCategory()}
            />
            <button
              type="button"
              onClick={handleAddCustomCategory}
              disabled={!newCustomCatName.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thẻ Flex Tùy Biến</span>
            </button>
          </div>

          {/* Flex Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {flexSections.map((sec, sIdx) => {
              const curDiff = sec.difficulty || 'medium';
              return (
                <div
                  key={sec.id}
                  className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-xs space-y-3 hover:border-blue-300 transition"
                >
                  {/* Card Top: Index, Title & Delete */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate" title={sec.title}>
                        {sec.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteFlexSection(sec.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="Xóa thẻ này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Middle: Stepper Count & Difficulty Chips */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Stepper Count */}
                    <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateFlexCount(sec.id, -1)}
                        className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        -
                      </button>
                      <span className="px-2 font-bold text-xs text-blue-900 min-w-[40px] text-center">
                        {sec.questionCount} câu
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateFlexCount(sec.id, 1)}
                        className="w-6 h-6 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-black text-xs flex items-center justify-center cursor-pointer shadow-2xs"
                      >
                        +
                      </button>
                    </div>

                    {/* Difficulty selector */}
                    <div className="flex space-x-1">
                      {[
                        { id: 'easy', label: 'Dễ', bg: 'bg-emerald-600 text-white' },
                        { id: 'medium', label: 'TB', bg: 'bg-blue-600 text-white' },
                        { id: 'hard', label: 'Khó', bg: 'bg-amber-600 text-white' },
                        { id: 'expert', label: 'Cực khó', bg: 'bg-rose-600 text-white' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSetFlexDifficulty(sec.id, lvl.id as any)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            curDiff === lvl.id
                              ? `${lvl.bg} shadow-xs`
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom: Custom Requirement Input */}
                  <div>
                    <input
                      type="text"
                      value={sec.customRequirement || ''}
                      onChange={(e) => handleSetFlexReq(sec.id, e.target.value)}
                      placeholder="Yêu cầu trọng tâm riêng (VD: Có bẫy thì quá khứ hoàn thành...)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Detailed Configuration Form (Basic Parameters) */}
      <div className="bg-[#FAF9F6] border border-[#D9D2C5] rounded-3xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#D9D2C5] pb-4">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="text-base font-bold text-[#3D3D2D]">
              Thông Số Chung Của Đề Thi {genSubject === 'math' ? 'Toán' : 'Tiếng Anh'}
            </h3>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Tên đề thi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề Thi Thử Vào 10 Chuẩn Sở GD&ĐT"
              className="w-full px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] font-medium outline-hidden focus:border-[#5A5A40]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">Tỉnh thành / Định dạng hướng tới</label>
            <input
              type="text"
              value={targetProvince}
              onChange={(e) => setTargetProvince(e.target.value)}
              placeholder="VD: Sở GD&ĐT Hà Nội / TP.HCM / Toàn quốc"
              className="w-full px-4 py-2.5 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] font-medium outline-hidden focus:border-[#5A5A40]"
            />
          </div>
        </div>

        {/* Parameters: Count, Time, Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#5A5A40]">
              Tổng số lượng câu ({generatorMode === 'flex_builder' ? `${flexSumQuestions} câu theo Thẻ Flex` : `${totalQuestions} câu`})
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[15, 25, 40, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setTotalQuestions(num);
                    setTimeLimitMinutes(num <= 15 ? 30 : num <= 25 ? 45 : num <= 40 ? 60 : 90);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${totalQuestions === num
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
              {[30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setTimeLimitMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${timeLimitMinutes === mins
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
            <label className="text-xs font-bold text-[#5A5A40]">Độ khó tổng thể</label>
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
                  className={`py-2 px-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${difficulty === diff.id
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
            placeholder={
              genSubject === 'math'
                ? 'Ví dụ: Tập trung vào bài toán lập hệ phương trình chuyển động, câu Vi-ét tìm m để x1^2 + x2^2 = 10, và 1 câu hình chứng minh tứ giác nội tiếp...'
                : 'Ví dụ: Tập trung vào câu điều kiện loại 2-3, câu bị động kép, 5 câu hỏi đuôi và 1 bài đọc hiểu về bảo vệ môi trường...'
            }
            className="w-full p-3 bg-[#FDFCFB] border border-[#D9D2C5] rounded-2xl text-xs text-[#3D3D2D] placeholder-[#A09F8E] outline-hidden focus:border-[#5A5A40]"
          />
        </div>

        {/* Generate Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerateExam}
            disabled={isGenerating}
            className="w-full py-4 bg-[#5A5A40] hover:bg-[#474733] text-white rounded-2xl font-bold text-sm shadow-md transition disabled:opacity-60 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-[#8BA888]" />
                <span>{progressStep || 'Đang tạo đề thi bằng Gemini AI...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 text-[#E67E22]" />
                <span>
                  Tạo Đề Thi {genSubject === 'math' ? 'Toán' : 'Tiếng Anh'} {generatorMode === 'flex_builder' ? flexSumQuestions : totalQuestions} Câu Bằng AI Ngay
                </span>
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
        <div className="bg-[#FAF9F6] border-2 border-[#8BA888] rounded-3xl p-5 sm:p-8 shadow-md space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D2C5] pb-5">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-[#8BA888] text-[#2C3E2D] text-[10px] font-bold rounded-full uppercase flex items-center space-x-1 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2C3E2D]" />
                  <span>Đã tự động lưu vào kho đề ({genSubject === 'math' ? 'Môn Toán' : 'Môn Tiếng Anh'})</span>
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
                      <div className="flex items-start space-x-3 pr-2">
                        <span className="w-6 h-6 rounded-lg bg-[#E8E2D9] text-[#5A5A40] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-[#3D3D2D] leading-snug whitespace-pre-line">
                            {q.content}
                          </p>
                          <span className="text-[10px] text-[#8A8A70] uppercase font-bold mt-1 inline-block">
                            {q.topicId.replace('math_', '').replace(/_/g, ' ')} • {q.difficulty}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-[#5A5A40] shrink-0 ml-2">
                        {isExpanded ? 'Ẩn' : 'Chi tiết'}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-[#E8E2D9] space-y-3 text-xs">
                        {q.passage && (
                          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#D9D2C5] text-[#4A4A4A] whitespace-pre-line">
                            {q.passage}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border text-xs font-medium whitespace-pre-line ${oIdx === q.correctOption
                                  ? 'bg-[#EBF2EB] border-[#8BA888] text-[#2C3E2D] font-bold'
                                  : 'bg-white border-[#EAE7E0] text-[#4A4A4A]'
                                }`}
                            >
                              {opt} {oIdx === q.correctOption && ' ✓ (Đáp án đúng)'}
                            </div>
                          ))}
                        </div>

                        <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#D9D2C5] space-y-1.5 text-xs">
                          <p className="text-[#3D3D2D] whitespace-pre-line">
                            <strong>Lời giải chi tiết:</strong> {q.explanation}
                          </p>
                          {q.grammarRule && (
                            <p className="text-[#5A5A40] whitespace-pre-line">
                              <strong>Công thức/Quy tắc:</strong> {q.grammarRule}
                            </p>
                          )}
                          {q.commonMistakeTip && (
                            <p className="text-[#E67E22]">
                              <strong>💡 Mẹo tránh bẫy:</strong> {q.commonMistakeTip}
                            </p>
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
