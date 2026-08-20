import { Exam } from '../types';
import { QUESTIONS_DATA } from './questionsData';

export const EXAMS_DATA: Exam[] = [
  {
    id: 'exam_official_01',
    code: 'TS10-HN-01',
    title: 'Đề Thi Thử Tuyển Sinh Vào Lớp 10 - Đề Chuẩn Số 01',
    targetProvince: 'Sở GD&ĐT Hà Nội / TP.HCM',
    description: 'Đề thi mô phỏng 100% ma trận đề thi chính thức vào 10: Phát âm (-s/es, -ed), Trọng âm, Ngữ pháp tổng hợp, Từ vựng Unit 1-9, Đọc điền từ, Đọc hiểu văn bản và Viết lại câu.',
    timeLimitMinutes: 60,
    totalQuestions: QUESTIONS_DATA.length,
    difficulty: 'standard',
    questionIds: QUESTIONS_DATA.map((q) => q.id),
    isOfficialFormat: true,
    createdAt: '2026-08-15',
  },
  {
    id: 'exam_grammar_focus_02',
    code: 'TS10-GRAM-02',
    title: 'Đề Chuyên Đề: Chinh Phục Ngữ Pháp & Biến Đổi Câu Điểm 8+',
    targetProvince: 'Chuyên đề Tăng Tốc Điểm Số',
    description: 'Tập trung sâu vào các bẫy điểm 8+ và 9+: Câu điều kiện kết hợp Unless, Mệnh đề quan hệ không dùng That, Bị động kép và Cặp cấu trúc biến đổi câu kinh điển.',
    timeLimitMinutes: 45,
    totalQuestions: 15,
    difficulty: 'advanced',
    questionIds: QUESTIONS_DATA.filter((q) =>
      ['grammar', 'sentence_rewrite', 'error_identification'].includes(q.topicId)
    ).map((q) => q.id),
    isOfficialFormat: false,
    createdAt: '2026-08-16',
  },
  {
    id: 'exam_speed_sprint_03',
    code: 'TS10-SPRINT-03',
    title: 'Đề Luyện Tốc Độ 30 Phút - Bứt Phá Ngữ Âm & Từ Vựng',
    targetProvince: 'Luyện Phản Xạ Nhanh',
    description: 'Rèn phản xạ nhanh ăn trọn 100% điểm phát âm, trọng âm, từ vựng và câu hỏi đuôi trong 30 phút.',
    timeLimitMinutes: 30,
    totalQuestions: 12,
    difficulty: 'standard',
    questionIds: QUESTIONS_DATA.filter((q) =>
      ['pronunciation', 'stress', 'vocabulary'].includes(q.topicId)
    ).map((q) => q.id),
    isOfficialFormat: false,
    createdAt: '2026-08-17',
  },
];
